const DB_NAME = "runewise";
const STORE_NAME = "cache";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Storage write failed — continue with in-memory cache
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

const MIGRATION_KEY = "runewise_idb_migrated";
const STORAGE_PREFIX = "runewise_cache:";

/** One-time migration: move persisted cache entries from localStorage to IndexedDB. */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return;
    const db = await openDB();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    if (keys.length === 0) {
      localStorage.setItem(MIGRATION_KEY, "1");
      return;
    }
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objStore = tx.objectStore(STORE_NAME);
    for (const fullKey of keys) {
      const cacheKey = fullKey.slice(STORAGE_PREFIX.length);
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        try {
          objStore.put(JSON.parse(raw), cacheKey);
        } catch {
          // Skip malformed entries
        }
      }
    }
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    for (const fullKey of keys) {
      localStorage.removeItem(fullKey);
    }
    localStorage.setItem(MIGRATION_KEY, "1");
  } catch {
    // Migration failed — not critical, cache will rebuild naturally
  }
}

export async function idbKeys(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
