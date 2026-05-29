import { Redis } from "@upstash/redis";
import type { RedisSessionState } from "../types.js";

/**
 * Redis-backed session sync enables horizontal scaling of WS nodes.
 * Each session key is namespaced by userId to enforce concurrent user isolation.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const SESSION_PREFIX = "pitchpilot:session:";
const CACHE_PREFIX = "pitchpilot:ai-cache:";
const TTL = parseInt(process.env.WS_SESSION_TTL_SEC || "3600", 10);

export function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

export async function getSessionState(
  sessionId: string
): Promise<RedisSessionState | null> {
  if (!redis) return null;
  return redis.get<RedisSessionState>(sessionKey(sessionId));
}

export async function setSessionState(
  sessionId: string,
  state: RedisSessionState
): Promise<void> {
  if (!redis) return;
  await redis.set(sessionKey(sessionId), state, { ex: TTL });
}

export async function patchSessionTranscript(
  sessionId: string,
  delta: string,
  sequence: number
): Promise<void> {
  if (!redis) return;
  const key = sessionKey(sessionId);
  const existing = await redis.get<RedisSessionState>(key);
  if (!existing) return;
  existing.transcript += delta;
  existing.sequence = sequence;
  existing.lastHeartbeat = Date.now();
  await redis.set(key, existing, { ex: TTL });
}

/** AI response cache — reduces duplicate GPT calls for similar transcript windows */
export async function getCachedAI(
  sessionId: string,
  hash: string
): Promise<string | null> {
  if (!redis) return null;
  return redis.get<string>(`${CACHE_PREFIX}${sessionId}:${hash}`);
}

export async function setCachedAI(
  sessionId: string,
  hash: string,
  response: string
): Promise<void> {
  if (!redis) return;
  await redis.set(`${CACHE_PREFIX}${sessionId}:${hash}`, response, { ex: 300 });
}

export async function deleteSessionState(sessionId: string): Promise<void> {
  if (!redis) return;
  await redis.del(sessionKey(sessionId));
}

export { redis };
