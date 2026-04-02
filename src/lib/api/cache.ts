interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  persist?: boolean;
}

const store = new Map<string, CacheEntry<unknown>>();
const STORAGE_PREFIX = "runewise_cache:";
const MAX_ENTRIES = 200;

function readPersisted<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writePersisted<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage write failures and keep the in-memory cache hot.
  }
}

function remember<T>(key: string, entry: CacheEntry<T>, options?: CacheOptions): void {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }
  store.set(key, entry);
  if (options?.persist) writePersisted(key, entry);
}

function getEntry<T>(key: string, options?: CacheOptions): CacheEntry<T> | null {
  const memoryEntry = store.get(key) as CacheEntry<T> | undefined;
  if (memoryEntry) return memoryEntry;

  if (!options?.persist) return null;

  const persisted = readPersisted<T>(key);
  if (!persisted) return null;
  remember(key, persisted, options);
  return persisted;
}

export function getCached<T>(
  key: string,
  ttlMs: number,
  options?: CacheOptions
): T | null {
  const entry = getEntry<T>(key, options);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function getStaleCached<T>(key: string, options?: CacheOptions): T | null {
  return getEntry<T>(key, options)?.data ?? null;
}

export function getCacheTimestamp(
  key: string,
  options?: CacheOptions
): number | null {
  return getEntry(key, options)?.timestamp ?? null;
}

export function setCache<T>(key: string, data: T, options?: CacheOptions): void {
  remember(key, { data, timestamp: Date.now() }, options);
}
