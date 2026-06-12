interface CacheEntry {
  value: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheClear(): void {
  store.clear();
}
