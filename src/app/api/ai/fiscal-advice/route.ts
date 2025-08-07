import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getSmartRouter } from "@/lib/smart-query-router";
import { getProgressiveEnhancer } from "@/lib/progressive-enhancer";
import { getCostMonitor } from "@/lib/cost-monitor";
import { createSelectiveMemoryManager } from "@/lib/selective-memory-manager";
import { getMemoryService } from "@/lib/ai-memory";

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
    const startTime = Date.now();

    // Initialize services
    const costMonitor = getCostMonitor();
    const smartRouter = getSmartRouter();
    const progressiveEnhancer = getProgressiveEnhancer();
    const memoryManager = createSelectiveMemoryManager(getMemoryService());

    try {
      // Check if user can afford this query
      const { allowed, reason, remainingBudget } = await costMonitor.canAffordQuery(userId, 0.025); // Worst case cost
      
      if (!allowed) {
        return NextResponse.json({ 
          error: "Budget limit reached",
          reason,
          remainingBudget,
          suggestion: "Try a simpler query or increase your budget limits"
        }, { status: 402 }); // Payment Required
      }

      let result;
      let metadata;

      // Choose processing approach based on options
      if (options.useProgressiveEnhancement) {
        // Use progressive enhancement for optimal cost/quality balance
        const enhancementResult = await progressiveEnhancer.enhanceQuery(query, {
          userId,
          maxAttempts: options.maxAttempts || 2,
          maxCost: Math.min(remainingBudget, options.maxCost || 0.05),
          satisfactionThreshold: options.satisfactionThreshold || 0.75
        });
        
        result = enhancementResult.finalAnswer;
        metadata = {
          route: enhancementResult.metadata.finalRoute,
          cost: enhancementResult.totalCost,
          processingTime: enhancementResult.metadata.processingTime,
          confidence: enhancementResult.confidence,
          enhancementPath: enhancementResult.enhancementPath,
          attempts: enhancementResult.metadata.attempts,
          escalations: enhancementResult.metadata.escalations,
          satisfactionScore: enhancementResult.satisfactionScore
        };
      } else {
        // Use smart routing for direct optimal routing
        const routingOptions = {
          userId,
          maxCost: Math.min(remainingBudget, options.maxCost || 0.05),
          forceRoute: options.forceRoute,
          skipMemory: options.skipMemory || false,
          skipContext: options.skipContext || false
        };

        const response = await smartRouter.routeQuery(query, routingOptions);
        
        result = response.answer;
        metadata = {
          route: response.metadata.route,
          agents: response.metadata.agents,
          cost: response.metadata.cost,
          processingTime: response.metadata.processingTime,
          confidence: response.metadata.confidence,
          usedContext: response.metadata.usedContext,
          usedMemory: response.metadata.usedMemory,
          escalated: response.metadata.escalated
        };
      }

      // Track costs and performance
      await costMonitor.trackQueryCost(
        userId,
        'fiscal-advice',
        metadata.route,
        metadata.cost, // estimated
        metadata.cost, // actual (same for now)
        metadata.processingTime,
        true, // success
        undefined // tokens used (would be populated by AI service)
      );

      // Selective memory storage
      try {
        // This would use the classification from smart router
        // For now, we'll store based on route complexity
        const shouldStore = metadata.route !== 'SIMPLE' && metadata.route !== 'FALLBACK';
        
        if (shouldStore && !options.skipMemory) {
          await memoryManager.storeSelectively(
            userId,
            query,
            result,
            { category: metadata.route, domain: 'FISCAL' } as any // Simplified intent
          );
        }
      } catch (memoryError) {
        console.warn("Failed to store in selective memory:", memoryError);
        // Continue with response
      }

      // Get cost analytics for user feedback
      const analytics = costMonitor.getCostAnalytics(userId, 7); // Last 7 days

      return NextResponse.json({ 
        advice: result,
        metadata: {
          ...metadata,
          analytics: {
            totalSpent: analytics.totalCost,
            queriesCount: analytics.costByRoute,
            savings: analytics.savings,
            remainingBudget
          }
        }
      });

    } catch (processingError) {
      console.error("Query processing failed:", processingError);
      
      // Track failed query cost (minimal)
      await costMonitor.trackQueryCost(
        userId,
        'fiscal-advice',
        'ERROR',
        0.001, // minimal cost for failed query
        0.001,
        Date.now() - startTime,
        false // failed
      );

      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Unknown error occurred';

      return new NextResponse(`Failed to process fiscal advice query: ${errorMessage}`, { 
        status: 500 
      });
    }

  } catch (error) {
    console.error("Error in fiscal advice API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}