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
 *
 * Observability: each call is traced in Langfuse when LANGFUSE_SECRET_KEY is set.
 */

import OpenAI from 'openai';
import { Langfuse } from 'langfuse';

export type LLMProvider = 'groq' | 'ollama';

// Singleton Langfuse client — no-ops when env vars are absent
function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) return null;
  return new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASEURL ?? 'https://cloud.langfuse.com',
    flushAt: 1, // flush immediately in serverless
  });
}

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
  const val = process.env[envKey]?.trim().toLowerCase();
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
      apiKey: process.env.OLLAMA_API_KEY?.trim() ?? 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL?.trim() ?? 'https://ollama.com/v1',
    });
  }
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY?.trim(),
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

const VISION_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_VISION_MODEL?.trim() ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
  ollama: process.env.OLLAMA_VISION_MODEL?.trim() ?? 'gemma3:27b',
};

const TEXT_MODELS: Record<LLMProvider, string> = {
  groq: process.env.GROQ_MODEL?.trim() ?? 'mistral-saba-24b',
  ollama: process.env.OLLAMA_MODEL?.trim() ?? 'ministral-3:8b',
};

type ChatMessages = OpenAI.Chat.ChatCompletionMessageParam[];

interface RunOptions {
  taskName: string; // shown as trace name in Langfuse
  userId?: string;
  usedFallback?: boolean;
}

async function runWithFallback(
  buildMessages: (provider: LLMProvider) => ChatMessages,
  modelMap: Record<LLMProvider, string>,
  options: RunOptions,
): Promise<string> {
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();
  const langfuse = getLangfuse();

  const trace = langfuse?.trace({
    name: options.taskName,
    userId: options.userId,
    tags: ['llm-extraction'],
  });

  async function callProvider(provider: LLMProvider, isFallback: boolean): Promise<string> {
    const model = modelMap[provider];
    const messages = buildMessages(provider);
    const client = buildClient(provider);

    const generation = trace?.generation({
      name: isFallback ? 'fallback-call' : 'primary-call',
      model,
      input: messages,
      metadata: { provider, isFallback },
    });

    const start = Date.now();
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 1500,
        messages,
      });
      const latencyMs = Date.now() - start;
      const content = response.choices[0]?.message?.content ?? '';

      generation?.end({
        output: content,
        usage: {
          input: response.usage?.prompt_tokens,
          output: response.usage?.completion_tokens,
          total: response.usage?.total_tokens,
          unit: 'TOKENS',
        },
        metadata: { latencyMs, provider, model, isFallback },
      });

      return content;
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errMsg = err instanceof Error ? err.message : String(err);
      generation?.end({
        output: { error: errMsg },
        level: 'ERROR',
        statusMessage: errMsg,
        metadata: { latencyMs, provider, model, isFallback },
      });
      throw err;
    }
  }

  try {
    const result = await callProvider(primary, false);
    await langfuse?.shutdownAsync();
    return result;
  } catch (primaryErr) {
    if (!isFallbackWorthy(primaryErr)) {
      await langfuse?.shutdownAsync();
      throw primaryErr;
    }

    const reason = primaryErr instanceof OpenAI.APIError
      ? `status ${primaryErr.status}`
      : (primaryErr instanceof Error ? primaryErr.message : 'unknown error');

    console.warn(`[LLMRouter] Primary (${primary}) failed (${reason}), switching to fallback (${fallback})`);

    try {
      const result = await callProvider(fallback, true);
      await langfuse?.shutdownAsync();
      return result;
    } catch (fallbackErr) {
      await langfuse?.shutdownAsync();
      throw fallbackErr;
    }
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
  userId?: string,
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
    { taskName: 'invoice-extraction-vision', userId },
  );
}

/**
 * Text inference for PDF invoice structuring (text pre-extracted from PDF).
 * Primary: Groq mistral-saba-24b → Fallback: Ollama ministral-3:8b
 */
export async function extractFromText(
  text: string,
  prompt: string,
  userId?: string,
): Promise<string> {
  return runWithFallback(
    () => [{ role: 'user', content: `${prompt}\n\n---\n\n${text}` }],
    TEXT_MODELS,
    { taskName: 'invoice-extraction-text', userId },
  );
}

/**
 * Returns true if at least the primary provider is configured.
 */
export function isLLMConfigured(): boolean {
  const primary = getPrimaryProvider();
  if (primary === 'groq') return !!process.env.GROQ_API_KEY?.trim();
  return !!process.env.OLLAMA_API_KEY?.trim();
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
