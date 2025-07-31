// Universal AI Service - Switches between local Ollama, OpenAI, and Gemini
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AI_CONFIG, isLocalMode, isOpenAIMode, isGeminiMode } from "./ai-config";
import { OllamaLangChainLLM } from "./ollama-service";
import { getOpenAIService, OpenAIService } from "./openai-service";

// Types for compatibility
interface AIMessage {
  content: string;
  constructor: { name: string };
}

export class UniversalAIService {
  private ollamaService: OllamaLangChainLLM | null = null;
  private openaiService: OpenAIService | null = null;
  private geminiService: any = null; // Will be loaded dynamically in production

  constructor() {
    if (isLocalMode()) {
      this.ollamaService = new OllamaLangChainLLM(AI_CONFIG.OLLAMA.MODEL);
    } else if (isOpenAIMode()) {
      this.openaiService = getOpenAIService();
    }
  }

  /**
   * Initialize Gemini service dynamically (only when needed)
   */
  private async initGemini() {
    if (!this.geminiService && isGeminiMode()) {
      try {
        const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
        this.geminiService = new ChatGoogleGenerativeAI({
          model: AI_CONFIG.GEMINI.MODEL,
          apiKey: AI_CONFIG.GEMINI.API_KEY,
          temperature: 0.7,
        });
      } catch (error) {
        console.error("Failed to initialize Gemini service:", error);
        throw new Error("Gemini service initialization failed");
      }
    }
  }

  /**
   * Universal invoke method - works with any AI service
   */
  async invoke(messages: AIMessage[], options: { temperature?: number } = {}): Promise<AIMessage> {
    const temperature = options.temperature || 0.7;

    try {
      if (isLocalMode() && this.ollamaService) {
        // Use Ollama for local development
        const langchainMessages = messages.map(msg => {
          if (msg.constructor.name === 'SystemMessage') {
            return new SystemMessage(msg.content);
          } else {
            return new HumanMessage(msg.content);
          }
        });

        const result = await this.ollamaService.invoke(langchainMessages as any);
        return { 
          content: result.content.toString(),
          constructor: { name: 'AIMessage' }
        };

      } else if (isOpenAIMode() && this.openaiService) {
        // Use OpenAI for production
        const systemMessage = messages.find(m => m.constructor.name === 'SystemMessage')?.content || 'You are a helpful assistant.';
        const userMessage = messages.find(m => m.constructor.name === 'HumanMessage')?.content || '';
        
        const result = await this.openaiService.chat(systemMessage, userMessage, { temperature });
        return { 
          content: result,
          constructor: { name: 'AIMessage' }
        };

      } else if (isGeminiMode()) {
        // Use Gemini for production
        await this.initGemini();
        if (!this.geminiService) {
          throw new Error("Gemini service not available");
        }

        const langchainMessages = messages.map(msg => {
          if (msg.constructor.name === 'SystemMessage') {
            return new SystemMessage(msg.content);
          } else {
            return new HumanMessage(msg.content);
          }
        });

        const result = await this.geminiService.invoke(langchainMessages as any);
        return { 
          content: result.content,
          constructor: { name: 'AIMessage' }
        };

      } else {
        throw new Error(`Unsupported AI mode: ${AI_CONFIG.MODE}`);
      }

    } catch (error) {
      console.error(`AI service error (${AI_CONFIG.MODE}):`, error);
      throw error;
    }
  }

  /**
   * Simple text generation
   */
  async generate(prompt: string, options: { temperature?: number } = {}): Promise<string> {
    const messages = [
      { content: prompt, constructor: { name: 'HumanMessage' } }
    ];
    
    const result = await this.invoke(messages, options);
    return result.content;
  }

  /**
   * Chat with system and user messages
   */
  async chat(systemMessage: string, userMessage: string, options: { temperature?: number } = {}): Promise<string> {
    if (isOpenAIMode() && this.openaiService) {
      // Direct OpenAI call for better performance
      return await this.openaiService.chat(systemMessage, userMessage, options);
    }

    // Use universal invoke for other services
    const messages = [
      { content: systemMessage, constructor: { name: 'SystemMessage' } },
      { content: userMessage, constructor: { name: 'HumanMessage' } }
    ];
    
    const result = await this.invoke(messages, options);
    return result.content;
  }

  /**
   * Get current AI mode and model information
   */
  getInfo(): { mode: string; model: string; provider: string } {
    if (isLocalMode()) {
      return {
        mode: 'local',
        model: AI_CONFIG.OLLAMA.MODEL,
        provider: 'Ollama'
      };
    } else if (isOpenAIMode()) {
      return {
        mode: 'openai',
        model: AI_CONFIG.OPENAI.MODEL,
        provider: 'OpenAI'
      };
    } else if (isGeminiMode()) {
      return {
        mode: 'gemini',
        model: AI_CONFIG.GEMINI.MODEL,
        provider: 'Google Gemini'
      };
    } else {
      return {
        mode: AI_CONFIG.MODE,
        model: 'unknown',
        provider: 'unknown'
      };
    }
  }

  /**
   * Health check for the active AI service
   */
  async checkHealth(): Promise<{ healthy: boolean; mode: string; model: string; latency: number }> {
    const startTime = Date.now();
    
    try {
      if (isOpenAIMode() && this.openaiService) {
        const health = await this.openaiService.checkHealth();
        return {
          healthy: health.available,
          mode: AI_CONFIG.MODE,
          model: health.model,
          latency: health.latency || Date.now() - startTime
        };
      }

      // Test with a simple query for other services
      await this.chat('Test', 'Hello');
      
      return {
        healthy: true,
        mode: AI_CONFIG.MODE,
        model: isLocalMode() ? AI_CONFIG.OLLAMA.MODEL : AI_CONFIG.GEMINI.MODEL,
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error("AI health check failed:", error);
      return {
        healthy: false,
        mode: AI_CONFIG.MODE,
        model: isLocalMode() ? AI_CONFIG.OLLAMA.MODEL : AI_CONFIG.GEMINI.MODEL,
        latency: Date.now() - startTime
      };
    }
  }
}

// Singleton instance
let universalAIInstance: UniversalAIService | null = null;

export const getUniversalAI = (): UniversalAIService => {
  if (!universalAIInstance) {
    universalAIInstance = new UniversalAIService();
  }
  return universalAIInstance;
};

export default UniversalAIService;