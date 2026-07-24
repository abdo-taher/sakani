const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.data;
}

export function isFresh(key, ttlMs = 30000) {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.ts < ttlMs;
}

export function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

export function clearCache(key) {
  if (key) {
    for (const k of cache.keys()) {
      if (k === key || k.startsWith(key + "?")) {
        cache.delete(k);
      }
    }
  } else {
    cache.clear();
  }
}
