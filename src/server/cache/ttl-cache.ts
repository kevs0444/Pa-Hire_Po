interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Lightweight bounded LRU + TTL cache with single-flight promise deduplication.
 * Prevents thundering-herd external scrapes when 1,000+ users query popular roles concurrently.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(private readonly maxEntries = 250) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh insertion order for LRU behavior
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) return;
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getOrFetch(
    key: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    forceRefresh = false
  ): Promise<{ value: T; cached: boolean }> {
    if (!forceRefresh) {
      const cachedValue = this.get(key);
      if (cachedValue !== undefined) {
        return { value: cachedValue, cached: true };
      }
    }

    const existingFlight = this.inFlight.get(key);
    if (existingFlight) {
      const value = await existingFlight;
      return { value, cached: true };
    }

    const flightPromise = fetcher()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, flightPromise);
    const value = await flightPromise;
    return { value, cached: false };
  }
}
