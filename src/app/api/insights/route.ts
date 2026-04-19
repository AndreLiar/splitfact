import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import FiscalContextService from "@/lib/fiscal-context";
import { getInsightEngine } from "@/lib/proactive-insights";
import { cacheUtils } from "@/lib/ai-cache";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'insights', 'health', 'suggestions'
    const context = url.searchParams.get('context'); // For context-specific suggestions

    // Get comprehensive fiscal profile
    const fiscalProfile = await FiscalContextService.getUserFiscalProfile(session.user.id);
    const insightEngine = getInsightEngine();

    switch (type) {
      case 'health':
        const healthScore = await cacheUtils.getOrFetch(
          'health',
          session.user.id,
          async () => insightEngine.calculateFiscalHealth(fiscalProfile)
        );
        return NextResponse.json(healthScore);

      case 'suggestions':
        if (!context) {
          return new NextResponse("Context required for suggestions", { status: 400 });
        }
        const suggestions = await cacheUtils.getOrFetch(
          'suggestions',
          session.user.id,
          async () => insightEngine.generateSmartSuggestions(context, fiscalProfile),
          context
        );
        return NextResponse.json(suggestions);

      case 'insights':
      default:
        const insights = await cacheUtils.getOrFetch(
          'insights',
          session.user.id,
          async () => insightEngine.generateInsights(fiscalProfile)
        );
        return NextResponse.json(insights);
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, insightId } = await request.json();

    // Handle insight actions (dismiss, mark as read, etc.)
    switch (action) {
      case 'dismiss':
        // In a real implementation, you'd store this in the database
        return NextResponse.json({ success: true, message: 'Insight dismissed' });
      
      case 'complete':
        // Mark insight as completed
        return NextResponse.json({ success: true, message: 'Insight marked as completed' });
      
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    console.error("Error handling insight action:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}