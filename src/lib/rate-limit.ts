import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazily instantiated so missing env vars don't crash the module at import time.
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Cache limiters by window so we don't recreate them on every request.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(
      key,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
        analytics: false,
      }),
    );
  }
  return limiterCache.get(key)!;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Fail-open: if Redis env vars are missing, skip rate limiting rather than crashing.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
  try {
    const limiter = getLimiter(maxRequests, windowMs);
    const { success, remaining, reset } = await limiter.limit(key);
    return { allowed: success, remaining, resetAt: Number(reset) };
  } catch {
    // Redis unreachable — fail-open
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

export function getIp(req: Request): string {
  const forwarded =
    (req as any).headers?.get?.('x-forwarded-for') ??
    (req as any).headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}
