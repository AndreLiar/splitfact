// Ollama Local LLM Integration Service
// Provides local AI capabilities as a drop-in replacement for Google Gemini

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'deepseek-coder-v2:latest') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Generate text using Ollama local LLM
   */
  async generate(prompt: string, options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}): Promise<string> {
    try {
      const requestBody: OllamaRequest = {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          top_p: 0.9,
          ...(options.max_tokens && { max_tokens: options.max_tokens })
        }
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error(`Failed to generate response from local LLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chat-style interaction with system and user messages
   */
  async chat(systemMessage: string, userMessage: string, options: {
    temperature?: number;
    max_tokens?: number;
  } = {}): Promise<string> {
    const combinedPrompt = `System: ${systemMessage}\n\nUser: ${userMessage}\n\nAssistant:`;
    return this.generate(combinedPrompt, options);
  }

  /**
   * Check if Ollama service is available and model is loaded
   */
  async checkHealth(): Promise<{ available: boolean; model: string; error?: string }> {
    try {
      // Check if Ollama is running
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { available: false, model: this.model, error: 'Ollama service not available' };
      }

      const data = await response.json();
      const models = data.models || [];
      const modelExists = models.some((m: any) => m.name === this.model);

      if (!modelExists) {
        return { 
          available: false, 
          model: this.model, 
          error: `Model ${this.model} not found. Available models: ${models.map((m: any) => m.name).join(', ')}` 
        };
      }

      return { available: true, model: this.model };
    } catch (error) {
      return { 
        available: false, 
        model: this.model, 
        error: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Change the model being used
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel(): string {
    return this.model;
  }
}

// Singleton instance
let ollamaServiceInstance: OllamaService | null = null;

export const getOllamaService = (): OllamaService => {
  if (!ollamaServiceInstance) {
    ollamaServiceInstance = new OllamaService();
  }
  return ollamaServiceInstance;
};

// LangChain-compatible wrapper for drop-in replacement
export class OllamaLangChainLLM {
  private ollamaService: OllamaService;

  constructor(model: string = 'deepseek-coder-v2:latest', options: { temperature?: number } = {}) {
    this.ollamaService = new OllamaService('http://localhost:11434', model);
  }

  async invoke(messages: Array<{ content: string; constructor: { name: string } }>): Promise<{ content: string }> {
    try {
      let systemMessage = '';
      let userMessage = '';

      for (const message of messages) {
        if (message.constructor.name === 'SystemMessage') {
          systemMessage = message.content;
        } else if (message.constructor.name === 'HumanMessage') {
          userMessage = message.content;
        }
      }

      const response = await this.ollamaService.chat(systemMessage, userMessage);
      return { content: response };
    } catch (error) {
      console.error('Error in OllamaLangChainLLM:', error);
      throw error;
    }
  }
}

export default OllamaService;