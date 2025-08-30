import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { getSmartRouter } from "@/lib/smart-query-router";
import { getCostMonitor } from "@/lib/cost-monitor";
import FiscalContextService from "@/lib/fiscal-context";

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

    // Check budget for enhanced queries (higher cost due to web search + Notion)
    const { allowed, reason, remainingBudget } = await costMonitor.canAffordQuery(userId, 0.08);
    
    if (!allowed) {
      return NextResponse.json({ 
        error: "Budget limit reached for enhanced queries",
        reason,
        remainingBudget,
        suggestion: "Try a regular query or increase your budget limits"
      }, { status: 402 });
    }

    try {
      // Get comprehensive fiscal context (including Notion data)
      const fiscalContext = await FiscalContextService.getUserFiscalProfile(userId);
      
      // Enhance query with contextual information
      const enhancedQuery = buildContextualQuery(query, fiscalContext);
      
      // Use smart router with web search enabled
      const smartRouter = getSmartRouter();
      const response = await smartRouter.routeQuery(enhancedQuery, {
        userId,
        forceRoute: 'WEB_RESEARCH', // Use web-enhanced route
        enableWebSearch: true,
        maxWebResults: options.maxWebResults || 5,
        maxCost: Math.min(remainingBudget, 0.08)
      });

      // Track the enhanced query cost
      await costMonitor.trackQueryCost(
        userId,
        'enhanced-fiscal-advice',
        'WEB_RESEARCH_NOTION',
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
          remainingBudget: remainingBudget - response.metadata.cost,
          fiscalContext: {
            hasNotionIntegration: fiscalContext.notion.isConnected,
            notionWorkspace: fiscalContext.notion.workspaceName,
            lastNotionSync: fiscalContext.notion.lastSyncAt,
            totalRevenue: fiscalContext.revenue.totalPaid,
            thresholdProgress: fiscalContext.compliance.bncThresholdProgress,
            clientsCount: fiscalContext.clients.total,
            notionEnhancedData: fiscalContext.notion.enhancedInsights ? {
              crossPlatformRevenue: fiscalContext.notion.enhancedInsights.crossPlatformRevenue,
              notionNotes: fiscalContext.notion.enhancedInsights.fiscalNotesInsights
            } : null
          }
        }
      });

    } catch (contextError) {
      console.error("Error getting fiscal context:", contextError);
      
      // Fallback to regular web-enhanced advice without full context
      const smartRouter = getSmartRouter();
      const fallbackResponse = await smartRouter.routeQuery(query, {
        userId,
        forceRoute: 'WEB_RESEARCH',
        enableWebSearch: true,
        maxWebResults: 3,
        maxCost: Math.min(remainingBudget, 0.04)
      });

      await costMonitor.trackQueryCost(
        userId,
        'enhanced-fiscal-advice-fallback',
        'WEB_RESEARCH',
        fallbackResponse.metadata.cost,
        fallbackResponse.metadata.cost,
        fallbackResponse.metadata.processingTime,
        true
      );

      return NextResponse.json({ 
        advice: fallbackResponse.answer,
        metadata: {
          ...fallbackResponse.metadata,
          fallback: true,
          reason: "Context integration failed, used web search only"
        }
      });
    }

  } catch (error) {
    console.error("Error in enhanced fiscal advice API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Build a contextually enhanced query with user's fiscal data
 */
function buildContextualQuery(originalQuery: string, fiscalContext: any): string {
  const contextualInfo = [];
  
  // Add revenue context
  if (fiscalContext.revenue.totalPaid > 0) {
    contextualInfo.push(`CA encaissé 2025: ${fiscalContext.revenue.totalPaid.toLocaleString('fr-FR', { 
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0 
    })}`);
  }

  // Add compliance context
  if (fiscalContext.compliance.bncThresholdProgress > 0) {
    contextualInfo.push(`Progression seuil BNC: ${fiscalContext.compliance.bncThresholdProgress.toFixed(1)}%`);
  }

  // Add client context
  if (fiscalContext.clients.total > 0) {
    contextualInfo.push(`${fiscalContext.clients.total} clients actifs`);
  }

  // Add Notion context if available
  if (fiscalContext.notion.isConnected && fiscalContext.notion.enhancedInsights) {
    const notionInsights = fiscalContext.notion.enhancedInsights;
    
    if (notionInsights.crossPlatformRevenue.notionTotal > 0) {
      contextualInfo.push(`Revenus Notion: ${notionInsights.crossPlatformRevenue.notionTotal.toLocaleString('fr-FR', { 
        style: 'currency', currency: 'EUR' 
      })}`);
    }

    if (notionInsights.fiscalNotesInsights.urgentReminders > 0) {
      contextualInfo.push(`${notionInsights.fiscalNotesInsights.urgentReminders} rappels urgents dans Notion`);
    }

    if (notionInsights.enhancedClientAnalysis.totalProjectsTracked > 0) {
      contextualInfo.push(`${notionInsights.enhancedClientAnalysis.totalProjectsTracked} projets suivis dans Notion`);
    }
  }

  // Build enhanced query
  if (contextualInfo.length > 0) {
    return `${originalQuery}

CONTEXTE FISCAL PERSONNEL:
${contextualInfo.map(info => `• ${info}`).join('\n')}

Note: Adapte ta réponse en tenant compte de ces informations spécifiques à ma situation.`;
  }

  return originalQuery;
}