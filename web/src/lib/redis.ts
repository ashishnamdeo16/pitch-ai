import { Redis } from "@upstash/redis";

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, remaining: 0 };
    }
    return { success: true, remaining: limit };
  }

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
