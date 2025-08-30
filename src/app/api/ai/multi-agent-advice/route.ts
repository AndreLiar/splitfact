// Multi-Agent Enhanced Fiscal Advice API
// Ultimate endpoint combining web search, Notion data, Splitfact data, and multi-agent coordination

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getMultiAgentOrchestrator, OrchestrationQuery, OrchestrationResult } from "@/lib/multi-agent-orchestrator";
import { headers } from "next/headers";

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for complex multi-agent processing

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "127.0.0.1";

  try {
    // Simple request tracking (without rate limiting dependency)
    console.log(`[Multi-Agent] Request from IP: ${ip}`);

    // Authentication required
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { query, context } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Requête manquante ou invalide" },
        { status: 400 }
      );
    }

    // Prepare multi-agent orchestration query
    const orchestrationQuery: OrchestrationQuery = {
      originalQuery: query,
      userId: session.user.id,
      context: {
        userRevenue: context?.userRevenue,
        userThresholdProgress: context?.userThresholdProgress,
        businessType: context?.businessType || 'micro-entrepreneur',
        urgency: context?.urgency || 'medium',
        requiresRealTimeData: true, // Always enable for this endpoint
        requiresNotionData: context?.includeNotionData !== false // Enabled by default
      }
    };

    // Execute multi-agent orchestration
    console.log(`[Multi-Agent] Processing query for user ${session.user.id}:`, query.substring(0, 100) + '...');
    
    const orchestrator = getMultiAgentOrchestrator();
    const result: OrchestrationResult = await orchestrator.processQuery(orchestrationQuery);

    // Log usage for monitoring
    console.log(`[Multi-Agent] Query processed successfully:`, {
      userId: session.user.id,
      agentsUsed: result.agentsUsed,
      executionTime: result.executionTime,
      confidence: result.confidence,
      sourcesCount: result.sources.length,
      queryComplexity: result.metadata.queryComplexity
    });

    return NextResponse.json({
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources.map(source => ({
        type: source.type,
        title: source.title,
        url: source.url,
        reliability: source.reliability
      })),
      recommendations: result.recommendations,
      metadata: {
        agentsUsed: result.agentsUsed,
        executionTime: result.executionTime,
        queryComplexity: result.metadata.queryComplexity,
        dataSourcesUsed: result.metadata.dataSourcesUsed,
        fallbackUsed: result.metadata.fallbackUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Multi-agent advice error:", error);

    // Determine error type for appropriate response
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: "Limite de requêtes atteinte. Veuillez patienter." },
        { status: 429 }
      );
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { 
          error: "La requête est trop complexe et a pris trop de temps. Veuillez la simplifier.",
          fallbackAdvice: "Je recommande de diviser votre question en plusieurs parties plus spécifiques."
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur lors du traitement de votre demande",
        fallbackAdvice: "Veuillez reformuler votre question ou réessayer plus tard."
      },
      { status: 500 }
    );
  }
}

// Health check endpoint for monitoring
export async function GET() {
  try {
    const orchestrator = getMultiAgentOrchestrator();
    const capabilities = orchestrator.getCapabilities();
    
    return NextResponse.json({
      status: "healthy",
      service: "multi-agent-fiscal-advice",
      capabilities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Multi-agent health check failed:", error);
    
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: "Service unavailable",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}