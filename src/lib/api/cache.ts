import { idbGet, idbSet, idbDelete } from "../storage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  persist?: boolean;
}

const store = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 200;

function remember<T>(key: string, entry: CacheEntry<T>, options?: CacheOptions): void {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }
  store.set(key, entry);
  if (options?.persist) {
    void idbSet(key, entry);
  }
}

function getMemoryEntry<T>(key: string): CacheEntry<T> | null {
  return (store.get(key) as CacheEntry<T> | undefined) ?? null;
}

/** Synchronous cache read — checks in-memory store only. */
export function getCached<T>(
  key: string,
  ttlMs: number,
  options?: CacheOptions
): T | null {
  const entry = getMemoryEntry<T>(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    store.delete(key);
    if (options?.persist) void idbDelete(key);
    return null;
  }
  return entry.data;
}

/**
 * Async cache read — checks memory first, then IndexedDB.
 * Populates memory cache on IndexedDB hit for future sync reads.
 */
export async function getCachedAsync<T>(
  key: string,
  ttlMs: number,
  options?: CacheOptions
): Promise<T | null> {
  const memResult = getCached<T>(key, ttlMs, options);
  if (memResult) return memResult;

  if (!options?.persist) return null;

  const persisted = await idbGet<CacheEntry<T>>(key);
  if (!persisted) return null;
  if (Date.now() - persisted.timestamp > ttlMs) {
    void idbDelete(key);
    return null;
  }
  remember(key, persisted);
  return persisted.data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getStaleCached<T>(key: string, _options?: CacheOptions): T | null {
  return getMemoryEntry<T>(key)?.data ?? null;
}

export async function getStaleCachedAsync<T>(key: string, options?: CacheOptions): Promise<T | null> {
  const mem = getMemoryEntry<T>(key);
  if (mem) return mem.data;

  if (!options?.persist) return null;

  const persisted = await idbGet<CacheEntry<T>>(key);
  if (!persisted) return null;
  remember(key, persisted);
  return persisted.data;
}

export function getCacheTimestamp(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: CacheOptions
): number | null {
  return getMemoryEntry(key)?.timestamp ?? null;
}

export function setCache<T>(key: string, data: T, options?: CacheOptions): void {
  remember(key, { data, timestamp: Date.now() }, options);
}

export function clearCacheKey(key: string): void {
  store.delete(key);
  void idbDelete(key);
}
