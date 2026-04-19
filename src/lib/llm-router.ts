/**
 * LLM Router — provider-agnostic inference layer.
 *
 * Uses the OpenAI SDK wire format (compatible with Groq and Ollama).
 * Select provider via LLM_PROVIDER env var: "groq" (default) | "ollama"
 *
 * Routing logic:
 *  - Vision tasks (image OCR)  → Groq llama-4-scout-17b  (vision capable, fast)
 *  - Text tasks (PDF structuring, French fiscal)  → Groq mistral-saba-24b (French-native)
 *  - Local dev fallback         → Ollama with configurable models
 */

import OpenAI from 'openai';

export type LLMProvider = 'groq' | 'ollama';

export function getActiveProvider(): LLMProvider {
  const p = process.env.LLM_PROVIDER?.toLowerCase();
  return p === 'ollama' ? 'ollama' : 'groq';
}

function buildClient(provider: LLMProvider): OpenAI {
  if (provider === 'ollama') {
    return new OpenAI({
      apiKey: process.env.OLLAMA_API_KEY ?? 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com/v1',
    });
  }
  // Groq — OpenAI-compatible API
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

// Vision model: image OCR (must support image_url)
const VISION_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
  ollama: process.env.OLLAMA_VISION_MODEL ?? 'gemma3:27b',
};

// Text model: French invoice structuring, fiscal analysis
const TEXT_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_MODEL ?? 'mistral-saba-24b',
  ollama: process.env.OLLAMA_MODEL ?? 'ministral-3:8b',
};

/**
 * Run vision inference on a base64-encoded image.
 * Used for invoice OCR when the upload is an image file.
 */
export async function extractFromImage(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const provider = getActiveProvider();
  const client = buildClient(provider);
  const model = VISION_MODELS[provider];

  const response = await client.chat.completions.create({
    model,
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
          },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Run text inference on extracted text content.
 * Used for PDF invoice structuring (text extracted before calling this).
 */
export async function extractFromText(
  text: string,
  prompt: string,
): Promise<string> {
  const provider = getActiveProvider();
  const client = buildClient(provider);
  const model = TEXT_MODELS[provider];

  const response = await client.chat.completions.create({
    model,
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n---\n\n${text}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}

/**
 * Check that the active provider is correctly configured.
 * Call this at startup or in health check routes.
 */
export function isLLMConfigured(): boolean {
  const provider = getActiveProvider();
  if (provider === 'groq') return !!process.env.GROQ_API_KEY;
  return !!process.env.OLLAMA_API_KEY;
}
