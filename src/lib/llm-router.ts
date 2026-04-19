/**
 * LLM Router — automatic primary/fallback inference layer.
 *
 * Primary provider: LLM_PRIMARY (default: "groq")
 * Fallback provider: LLM_FALLBACK (default: "ollama")
 *
 * On any failure from primary (rate limit 429, timeout, API error),
 * the router transparently retries with the fallback provider.
 *
 * Routing logic per task:
 *  Vision (image OCR) → Groq llama-4-scout-17b  → Ollama gemma3:27b
 *  Text (PDF/French)  → Groq mistral-saba-24b   → Ollama ministral-3:8b
 */

import OpenAI from 'openai';

export type LLMProvider = 'groq' | 'ollama';

// Which errors should trigger a fallback (not user errors)
function isFallbackWorthy(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    // 429 rate limit, 503 unavailable, 500 server error, timeout
    return err.status === 429 || err.status >= 500 || err.status === 408;
  }
  // Network-level failures (ECONNRESET, ETIMEDOUT, etc.)
  return err instanceof Error && (
    err.message.includes('ECONNRESET') ||
    err.message.includes('ETIMEDOUT') ||
    err.message.includes('fetch failed') ||
    err.message.includes('timeout')
  );
}

function getProvider(envKey: string, defaultProvider: LLMProvider): LLMProvider {
  const val = process.env[envKey]?.toLowerCase();
  return val === 'ollama' ? 'ollama' : val === 'groq' ? 'groq' : defaultProvider;
}

export function getPrimaryProvider(): LLMProvider {
  return getProvider('LLM_PRIMARY', 'groq');
}

export function getFallbackProvider(): LLMProvider {
  const primary = getPrimaryProvider();
  const configured = getProvider('LLM_FALLBACK', primary === 'groq' ? 'ollama' : 'groq');
  // Fallback must differ from primary
  return configured !== primary ? configured : (primary === 'groq' ? 'ollama' : 'groq');
}

function buildClient(provider: LLMProvider): OpenAI {
  if (provider === 'ollama') {
    return new OpenAI({
      apiKey: process.env.OLLAMA_API_KEY ?? 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com/v1',
    });
  }
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

const VISION_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
  ollama: process.env.OLLAMA_VISION_MODEL ?? 'gemma3:27b',
};

const TEXT_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_MODEL ?? 'mistral-saba-24b',
  ollama: process.env.OLLAMA_MODEL ?? 'ministral-3:8b',
};

type ChatMessages = OpenAI.Chat.ChatCompletionMessageParam[];

async function runWithFallback(
  buildMessages: (provider: LLMProvider) => ChatMessages,
  modelMap: Record<LLMProvider, string>,
): Promise<string> {
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();

  try {
    const client = buildClient(primary);
    const response = await client.chat.completions.create({
      model: modelMap[primary],
      max_tokens: 1500,
      messages: buildMessages(primary),
    });
    return response.choices[0]?.message?.content ?? '';
  } catch (primaryErr) {
    if (!isFallbackWorthy(primaryErr)) throw primaryErr;

    const reason = primaryErr instanceof OpenAI.APIError
      ? `status ${primaryErr.status}`
      : (primaryErr instanceof Error ? primaryErr.message : 'unknown error');

    console.warn(`[LLMRouter] Primary (${primary}) failed (${reason}), switching to fallback (${fallback})`);

    const fallbackClient = buildClient(fallback);
    const fallbackResponse = await fallbackClient.chat.completions.create({
      model: modelMap[fallback],
      max_tokens: 1500,
      messages: buildMessages(fallback),
    });
    return fallbackResponse.choices[0]?.message?.content ?? '';
  }
}

/**
 * Vision inference on a base64-encoded image (PNG, JPEG, WEBP).
 * Primary: Groq llama-4-scout-17b → Fallback: Ollama gemma3:27b
 */
export async function extractFromImage(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  return runWithFallback(
    () => [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
        ],
      },
    ],
    VISION_MODELS,
  );
}

/**
 * Text inference for PDF invoice structuring (text pre-extracted from PDF).
 * Primary: Groq mistral-saba-24b → Fallback: Ollama ministral-3:8b
 */
export async function extractFromText(
  text: string,
  prompt: string,
): Promise<string> {
  return runWithFallback(
    () => [{ role: 'user', content: `${prompt}\n\n---\n\n${text}` }],
    TEXT_MODELS,
  );
}

/**
 * Returns true if at least the primary provider is configured.
 */
export function isLLMConfigured(): boolean {
  const primary = getPrimaryProvider();
  if (primary === 'groq') return !!process.env.GROQ_API_KEY;
  return !!process.env.OLLAMA_API_KEY;
}

/**
 * Returns a summary of the current routing configuration.
 * Useful for health check endpoints.
 */
export function getLLMStatus() {
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();
  return {
    primary: { provider: primary, model: TEXT_MODELS[primary], visionModel: VISION_MODELS[primary] },
    fallback: { provider: fallback, model: TEXT_MODELS[fallback], visionModel: VISION_MODELS[fallback] },
  };
}
