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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const userId = session.user.id;

    const costMonitor = getCostMonitor();

    // Get comprehensive analytics
    const analytics = costMonitor.getCostAnalytics(userId, days);
    
    // Get budget status
    const budgetStatus = await costMonitor.canAffordQuery(userId, 0);

    // Get cost-aware recommendations
    const recommendations = await getCostAwareRecommendations(userId, costMonitor);

    return NextResponse.json({
      analytics: {
        ...analytics,
        period: `Last ${days} days`,
        budgetStatus: {
          dailyRemaining: budgetStatus.remainingBudget,
          allowed: budgetStatus.allowed,
          reason: budgetStatus.reason
        }
      },
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting cost analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, dailyLimit, monthlyLimit } = await request.json();
    const userId = session.user.id;
    const costMonitor = getCostMonitor();

    switch (action) {
      case 'update_budget':
        await costMonitor.setUserBudget(userId, dailyLimit, monthlyLimit);
        return NextResponse.json({ 
          success: true, 
          message: "Budget limits updated successfully",
          newLimits: { dailyLimit, monthlyLimit }
        });

      case 'reset_daily':
        costMonitor.resetDailyCosts();
        return NextResponse.json({ 
          success: true, 
          message: "Daily costs reset for all users" 
        });

      case 'reset_monthly':
        costMonitor.resetMonthlyCosts();
        return NextResponse.json({ 
          success: true, 
          message: "Monthly costs reset for all users" 
        });

      default:
        return new NextResponse("Invalid action", { status: 400 });
    }

  } catch (error) {
    console.error("Error updating cost settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to get cost-aware recommendations
async function getCostAwareRecommendations(userId: string, costMonitor: any) {
  const analytics = costMonitor.getCostAnalytics(userId, 30);
  const recommendations = [];

  // Analyze spending patterns
  const totalQueries = Object.values(analytics.costByRoute as Record<string, number>)
    .reduce((a: number, b: number) => a + b, 0);

  if (totalQueries === 0) {
    recommendations.push({
      type: 'info',
      title: 'Commencez à utiliser le système IA',
      description: 'Posez votre première question pour obtenir des conseils fiscaux personnalisés.',
      priority: 'low'
    });
  } else {
    // Check if user is using too many complex queries
    const complexPercentage = ((analytics.costByRoute as any)['COMPLEX'] || 0) / totalQueries;
    if (complexPercentage > 0.4) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimisez vos requêtes',
        description: `${(complexPercentage * 100).toFixed(0)}% de vos requêtes sont complexes. Essayez des questions plus simples pour réduire les coûts.`,
        priority: 'medium',
        potentialSaving: `€${(analytics.totalCost * 0.3).toFixed(3)}`
      });
    }

    // Check success rate
    if (analytics.efficiency.successRate < 0.9) {
      recommendations.push({
        type: 'quality',
        title: 'Améliorez la qualité de vos questions',
        description: `Taux de succès: ${(analytics.efficiency.successRate * 100).toFixed(0)}%. Questions plus claires = meilleurs résultats.`,
        priority: 'high'
      });
    }

    // Budget warnings
    if (analytics.totalCost > 3.0) {
      recommendations.push({
        type: 'budget',
        title: 'Budget élevé ce mois-ci',
        description: `Vous avez dépensé €${analytics.totalCost.toFixed(3)} ce mois-ci. Considérez l'utilisation du mode progressif.`,
        priority: 'medium'
      });
    }

    // Savings celebration
    if (analytics.savings.percentage > 50) {
      recommendations.push({
        type: 'success',
        title: 'Excellent! Vous économisez beaucoup',
        description: `Vous avez économisé ${analytics.savings.percentage.toFixed(0)}% (€${analytics.savings.amount.toFixed(3)}) grâce au routage intelligent.`,
        priority: 'low'
      });
    }
  }

  return recommendations;
}