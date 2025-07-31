import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import FiscalContextService from "@/lib/fiscal-context";
import { getMemoryService } from "@/lib/ai-memory";
import { getFiscalOrchestrator } from "@/lib/fiscal-agents";
import { getUniversalAI } from "@/lib/ai-service";

export const runtime = 'nodejs';

// Function to determine if a query requires multi-agent processing
function isComplexQuery(query: string): boolean {
  const complexKeywords = [
    'optimize', 'optimis', 'stratégie', 'strategy', 'compare', 'compar',
    'calculate', 'calcul', 'projection', 'forecast', 'prévision',
    'threshold', 'seuil', 'compliance', 'conformité', 'audit',
    'multi', 'several', 'plusieurs', 'complex', 'compliqué',
    'analyze', 'analys', 'detailed', 'détaillé', 'comprehensive'
  ];

  const simpleKeywords = [
    'what is', 'qu\'est-ce que', 'definition', 'définition',
    'when', 'quand', 'where', 'où', 'how much', 'combien',
    'yes or no', 'oui ou non', 'simple', 'basic', 'basique'
  ];

  const lowerQuery = query.toLowerCase();
  
  // If query contains simple keywords, use simple processing
  if (simpleKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return false;
  }
  
  // If query contains complex keywords or is long, use multi-agent
  if (complexKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 100) {
    return true;
  }
  
  // Default to simple processing for short, basic queries
  return query.length > 50;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { query } = await request.json();
    if (!query) {
      return new NextResponse("Query is required", { status: 400 });
    }

    // Determine if query requires multi-agent processing
    const requiresMultiAgent = isComplexQuery(query);

    let result;
    let usedMultiAgent = false;

    if (requiresMultiAgent) {
      // Get comprehensive fiscal context for complex queries
      const fiscalProfile = await FiscalContextService.getUserFiscalProfile(session.user.id);
      
      // Initialize memory service for conversation continuity
      const memoryService = getMemoryService();
      
      // Get relevant memories and generate memory-aware context
      const memoryContext = await memoryService.generateMemoryContext(session.user.id, query);
      
      // Initialize multi-agent orchestrator
      const orchestrator = getFiscalOrchestrator();

      try {
        // Use multi-agent orchestration for complex fiscal advice
        result = await orchestrator.processQuery(query, fiscalProfile, memoryContext);
        usedMultiAgent = true;

        // Store the conversation in memory for future reference
        try {
          await memoryService.storeConversation(
            session.user.id,
            query,
            result,
            fiscalProfile
          );
        } catch (memoryError) {
          console.warn("Failed to store conversation in memory:", memoryError);
          // Continue with response even if memory storage fails
        }
      } catch (orchestrationError) {
        console.error("Multi-agent orchestration failed:", orchestrationError);
        return new NextResponse("Failed to process request with fiscal agents.", { status: 500 });
      }
    } else {
      // Use simple AI service for basic queries
      try {
        const aiService = getUniversalAI();
        const systemPrompt = "You are a French fiscal advisor for micro-entrepreneurs. Keep your responses brief and practical.";
        
        const aiResponse = await aiService.chat(systemPrompt, query);
        result = aiResponse;
        usedMultiAgent = false;
      } catch (simpleError) {
        console.error("Simple AI service failed:", simpleError);
        return new NextResponse("Failed to generate simple fiscal advice.", { status: 500 });
      }
    }

    if (result) {
      return NextResponse.json({ 
        advice: result,
        context: {
          multiAgent: usedMultiAgent // Indicate whether multi-agent system was used
        }
      });
    } else {
      return new NextResponse("Failed to generate AI fiscal advice.", { status: 500 });
    }
  } catch (error) {
    console.error("Error generating AI fiscal advice:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}