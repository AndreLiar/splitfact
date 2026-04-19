import { NextResponse } from "next/server";
import { getOllamaService } from "@/lib/ollama-service";

export async function GET() {
  try {
    const ollamaService = getOllamaService();
    
    // Check Ollama health and available models
    const health = await ollamaService.checkHealth();
    const models = await ollamaService.listModels();

    return NextResponse.json({
      ollama: health,
      availableModels: models,
      currentModel: ollamaService.getModel(),
      status: health.available ? 'ready' : 'unavailable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error checking AI health:", error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { testPrompt } = await request.json();
    const ollamaService = getOllamaService();
    
    const prompt = testPrompt || "Bonjour, peux-tu me répondre brièvement en français pour tester la connexion?";
    
    const startTime = Date.now();
    const response = await ollamaService.generate(prompt, { temperature: 0.2 });
    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: 'success',
      response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      duration: `${duration}ms`,
      model: ollamaService.getModel(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error testing Ollama:", error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}