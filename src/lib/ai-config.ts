// AI Configuration - Environment-based AI service selection

export const AI_CONFIG = {
  // Set to 'local' for development, 'openai' or 'gemini' for production  
  MODE: process.env.AI_MODE || 'local',
  
  // Ollama configuration
  OLLAMA: {
    BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    MODEL: process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest',
    FALLBACK_MODEL: 'qwen3:latest'
  },
  
  // OpenAI configuration
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY,
    MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  
  // Gemini configuration  
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY,
    MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  }
};

export const isLocalMode = () => AI_CONFIG.MODE === 'local';
export const isOpenAIMode = () => AI_CONFIG.MODE === 'openai';
export const isGeminiMode = () => AI_CONFIG.MODE === 'gemini';

export default AI_CONFIG;