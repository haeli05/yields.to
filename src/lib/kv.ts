// Lightweight wrapper around Vercel KV with safe fallbacks.
// Provides JSON get/set with TTL and an in-memory fallback.

type JsonRecord = Record<string, unknown>;

type CacheEntry = { value: unknown; expiresAt: number };

declare global {
  var __kvMem: Map<string, CacheEntry> | undefined;
}

const mem: Map<string, CacheEntry> = globalThis.__kvMem ?? new Map();
globalThis.__kvMem = mem;

async function getVercelKV(): Promise<typeof import("@vercel/kv").kv | null> {
  if (process.env.DISABLE_KV === "1" || process.env.DISABLE_KV === "true") {
    return null;
  }
  try {
    // Dynamic import so local dev works without binding
    const mod = await import("@vercel/kv");
    // Ensure required envs exist; otherwise treat as unavailable
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return mod.kv;
  } catch {
    return null;
  }
}

export async function kvGetJson<T = JsonRecord>(key: string): Promise<T | null> {
  const kv = await getVercelKV();
  if (kv) {
    try {
      const v = await kv.get<T>(key);
      if (v == null) return null;
      return v as T;
    } catch {
      // fall through to mem
    }
  }
  const now = Date.now();
  const entry = mem.get(key);
  if (!entry || entry.expiresAt < now) return null;
  return entry.value as T;
}

export async function kvSetJson<T>(key: string, value: T, ttlSeconds: number) {
  const kv = await getVercelKV();
  if (kv) {
    try {
      await kv.set(key, value, { ex: ttlSeconds });
    } catch {
      // ignore and write to mem
    }
  }
  mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
