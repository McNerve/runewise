import { apiFetch } from "./fetch";
import { getCached, getStaleCached, setCache } from "./cache";

export interface JsonRequestOptions<T> {
  url: string;
  cacheKey?: string;
  ttlMs?: number;
  persist?: boolean;
  dedupeKey?: string;
  headers?: HeadersInit;
  parser?: (input: unknown) => T;
  transform?: (input: unknown) => T;
}

const inflight = new Map<string, Promise<unknown>>();

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function requestJson(url: string, headers?: HeadersInit): Promise<unknown> {
  const res = await apiFetch(url, { headers });
  if (!res.ok) {
    if (RETRYABLE.has(res.status)) {
      await new Promise((r) => setTimeout(r, 1_000));
      const retry = await apiFetch(url, { headers });
      if (!retry.ok) throw new Error(`Request failed: ${retry.status}`);
      return retry.json();
    }
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchJson<T>({
  url,
  cacheKey,
  ttlMs,
  persist,
  dedupeKey,
  headers,
  parser,
  transform,
}: JsonRequestOptions<T>): Promise<T> {
  const cacheOptions = { persist };
  if (cacheKey && ttlMs != null) {
    const cached = getCached<T>(cacheKey, ttlMs, cacheOptions);
    if (cached) return cached;
  }

  const key = dedupeKey ?? cacheKey ?? url;
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = requestJson(url, headers)
    .then((json) => {
      const normalized = parser ? parser(json) : transform ? transform(json) : (json as T);
      if (cacheKey) setCache(cacheKey, normalized, cacheOptions);
      return normalized;
    })
    .catch((error: unknown) => {
      if (cacheKey) {
        const stale = getStaleCached<T>(cacheKey, cacheOptions);
        if (stale) return stale;
      }
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
