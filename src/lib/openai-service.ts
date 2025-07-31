// OpenAI Service for production deployment
import OpenAI from 'openai';
import { AI_CONFIG } from './ai-config';
import { getCostMonitor } from './cost-monitor';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!AI_CONFIG.OPENAI.API_KEY) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: AI_CONFIG.OPENAI.API_KEY,
    });
    
    this.model = AI_CONFIG.OPENAI.MODEL;
  }

  /**
   * Chat completion with system and user messages
   */
  async chat(systemMessage: string, userMessage: string, options: { temperature?: number } = {}): Promise<string> {
    const costMonitor = getCostMonitor();
    const inputText = `${systemMessage}\n${userMessage}`;
    
    // Check budget before making request
    if (costMonitor.wouldExceedBudget(inputText)) {
      throw new Error('Request would exceed AI budget. Please upgrade or wait for budget reset.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: 1000, // Limit tokens to control costs
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Track usage for cost monitoring
      costMonitor.trackQuery(inputText, response, this.model);
      
      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI service failed: ${error}`);
    }
  }

  /**
   * Generate response from a single prompt
   */
  async generate(prompt: string, options: { temperature?: number } = {}): Promise<string> {
    return this.chat('You are a helpful assistant.', prompt, options);
  }

  /**
   * Check OpenAI service health and model availability
   */
  async checkHealth(): Promise<{ available: boolean; model: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.chat('Test', 'Hello', { temperature: 0 });
      
      return {
        available: true,
        model: this.model,
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return {
        available: false,
        model: this.model,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Get current model information
   */
  getModelInfo(): { model: string; provider: string } {
    return {
      model: this.model,
      provider: 'OpenAI'
    };
  }
}

// Singleton instance
let openAIInstance: OpenAIService | null = null;

export const getOpenAIService = (): OpenAIService => {
  if (!openAIInstance) {
    openAIInstance = new OpenAIService();
  }
  return openAIInstance;
};

export default OpenAIService;