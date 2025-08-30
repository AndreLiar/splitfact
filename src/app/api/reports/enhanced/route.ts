// Enhanced Reports API with External Data Integration
// Provides access to comprehensive reports combining multiple data sources

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getEnhancedReporting } from "@/lib/enhanced-reporting-engine";
import { getCrossPlatformInsights } from "@/lib/cross-platform-insights";

export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes for complex report generation

export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'json';
    
    if (!reportType) {
      return NextResponse.json(
        { error: "Type de rapport requis" },
        { status: 400 }
      );
    }

    const reportingEngine = getEnhancedReporting();
    let report;

    console.log(`[EnhancedReports] Generating ${reportType} report for user ${session.user.id}`);

    // Generate the requested report type
    switch (reportType.toLowerCase()) {
      case 'fiscal-health':
        report = await reportingEngine.generateFiscalHealthReport(session.user.id);
        break;
        
      case 'business-performance':
        report = await reportingEngine.generateBusinessPerformanceReport(session.user.id);
        break;
        
      case 'market-analysis':
        report = await reportingEngine.generateMarketAnalysisReport(session.user.id);
        break;
        
      default:
        return NextResponse.json(
          { error: `Type de rapport non supporté: ${reportType}` },
          { status: 400 }
        );
    }

    // Return the report in the requested format
    if (format === 'summary') {
      return NextResponse.json({
        id: report.id,
        type: report.type,
        title: report.title,
        summary: report.summary,
        keyMetrics: extractKeyMetrics(report),
        generatedAt: report.createdAt,
        validUntil: report.dataSource.validUntil
      });
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('[EnhancedReports] Report generation failed:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du rapport',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { reportType, config } = await request.json();
    
    if (!reportType) {
      return NextResponse.json(
        { error: "Type de rapport requis" },
        { status: 400 }
      );
    }

    const reportingEngine = getEnhancedReporting();
    const insightsEngine = getCrossPlatformInsights();
    
    console.log(`[EnhancedReports] Custom report generation for user ${session.user.id}`);

    // Generate cross-platform insights first
    const insights = await insightsEngine.generateInsights(session.user.id, {
      timeframe: config?.timeframe || 'month',
      includeProjections: config?.includeProjections !== false,
      focusAreas: config?.focusAreas || ['performance', 'optimization', 'compliance']
    });

    // Generate the main report
    let report;
    switch (reportType.toLowerCase()) {
      case 'fiscal-health':
        report = await reportingEngine.generateFiscalHealthReport(session.user.id);
        break;
      case 'business-performance':
        report = await reportingEngine.generateBusinessPerformanceReport(session.user.id);
        break;
      case 'market-analysis':
        report = await reportingEngine.generateMarketAnalysisReport(session.user.id);
        break;
      default:
        return NextResponse.json(
          { error: `Type de rapport non supporté: ${reportType}` },
          { status: 400 }
        );
    }

    // Enhance with insights
    if (insights.length > 0) {
      report.sections.push({
        id: 'cross_platform_insights',
        title: 'Insights Cross-Platform',
        content: `${insights.length} insights générés par l'analyse croisée de vos données`,
        data: insights,
        insights: insights.map(i => i.description)
      });
    }

    return NextResponse.json({
      report,
      insights: insights.map(insight => ({
        id: insight.id,
        category: insight.category,
        title: insight.title,
        impact: insight.impact,
        confidence: insight.dataSource.confidence
      })),
      metadata: {
        generatedAt: new Date(),
        dataSourcesUsed: {
          splitfact: true,
          notion: report.dataSource.notion !== undefined,
          external: report.dataSource.external.length > 0
        },
        processingTime: Date.now() - Date.now() // This would be calculated properly
      }
    });

  } catch (error) {
    console.error('[EnhancedReports] Custom report generation failed:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du rapport personnalisé',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Helper function to extract key metrics from report
function extractKeyMetrics(report: any) {
  const metrics: any = {};
  
  // Extract key metrics from report sections
  report.sections.forEach((section: any) => {
    if (section.data) {
      switch (section.id) {
        case 'revenue_analysis':
          metrics.totalRevenue = section.data.totalPaid;
          metrics.yearOverYear = section.data.yearOverYear;
          break;
        case 'compliance_status':
          metrics.thresholdProgress = section.data.bncThresholdProgress;
          break;
        case 'client_portfolio':
          if (section.data.splitfact) {
            metrics.totalClients = section.data.splitfact.total;
            metrics.averagePaymentDelay = section.data.splitfact.averagePaymentDelay;
          }
          break;
      }
    }
  });

  return metrics;
}