import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getSmartRouter } from "@/lib/smart-query-router";
import { getCostMonitor } from "@/lib/cost-monitor";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { query, options = {} } = await request.json();
    if (!query) {
      return new NextResponse("Query is required", { status: 400 });
    }

    const userId = session.user.id;
    const costMonitor = getCostMonitor();

    // Check budget for web-enhanced queries (higher cost)
    const { allowed, reason, remainingBudget } = await costMonitor.canAffordQuery(userId, 0.05);
    
    if (!allowed) {
      return NextResponse.json({ 
        error: "Budget limit reached for web-enhanced queries",
        reason,
        remainingBudget,
        suggestion: "Try a regular query or increase your budget limits"
      }, { status: 402 });
    }

    // Force web research route
    const smartRouter = getSmartRouter();
    const response = await smartRouter.routeQuery(query, {
      userId,
      forceRoute: 'WEB_RESEARCH',
      enableWebSearch: true,
      maxWebResults: options.maxWebResults || 4,
      maxCost: Math.min(remainingBudget, 0.05)
    });

    // Track the enhanced query cost
    await costMonitor.trackQueryCost(
      userId,
      'web-enhanced-advice',
      'WEB_RESEARCH',
      response.metadata.cost,
      response.metadata.cost,
      response.metadata.processingTime,
      true
    );

    return NextResponse.json({ 
      advice: response.answer,
      metadata: {
        route: response.metadata.route,
        cost: response.metadata.cost,
        confidence: response.metadata.confidence,
        usedWebSearch: response.metadata.usedWebSearch,
        webSources: response.metadata.webSources,
        extractedContent: response.metadata.extractedContent,
        processingTime: response.metadata.processingTime,
        remainingBudget: remainingBudget - response.metadata.cost
      }
    });

  } catch (error) {
    console.error("Error in web-enhanced advice API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}