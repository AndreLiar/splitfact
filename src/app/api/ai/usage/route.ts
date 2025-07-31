import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getCostMonitor } from "@/lib/cost-monitor";

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const costMonitor = getCostMonitor();
    const stats = costMonitor.getStats();
    const report = costMonitor.getUsageReport();

    return NextResponse.json({
      stats,
      report,
      budgetStatus: {
        budget: 5.0,
        used: stats.totalCost,
        remaining: stats.remainingBudget,
        percentageUsed: (stats.totalCost / 5.0) * 100,
        isNearLimit: stats.totalCost > 4.0, // 80% of budget
        isOverBudget: stats.totalCost > 5.0
      }
    });
  } catch (error) {
    console.error("Error getting AI usage stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action } = await request.json();
    
    if (action === 'reset') {
      const costMonitor = getCostMonitor();
      costMonitor.resetStats();
      
      return NextResponse.json({
        success: true,
        message: 'Usage statistics reset successfully'
      });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error managing AI usage:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}