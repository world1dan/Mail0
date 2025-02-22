import type { Cache, State } from "swr";
import Dexie from "dexie";

interface CacheEntry<Data> {
  key: string;
  state: State<Data>;
  timestamp: number;
}

class SWRDatabase extends Dexie {
  cache!: Dexie.Table<CacheEntry<unknown>, string>;

  constructor() {
    super("SWRCache");
    this.version(1).stores({
      cache: "key,timestamp",
    });
  }
}

const db = new SWRDatabase();
const ONE_DAY = 1000 * 60 * 60 * 24;

export function dexieStorageProvider<Data>(): Cache {
  const memoryCache = new Map<string, State<Data>>();

  db.cache
    .each((entry) => {
      if (Date.now() - entry.timestamp <= ONE_DAY) {
        memoryCache.set(entry.key, entry.state);
      } else {
        db.cache.delete(entry.key).catch(console.error);
      }
    })
    .catch(console.error);

  return {
    keys() {
      return memoryCache.keys();
    },

    get(key: string) {
      return memoryCache.get(key);
    },

    set(key: string, value: State<Data>) {
      // Don't cache promises or undefined data
      if (value.data instanceof Promise || value.data === undefined) return;

      console.log(key, value);

      memoryCache.set(key, value);

      // Sync to IndexedDB in the background
      db.cache
        .put({
          key,
          state: value,
          timestamp: Date.now(),
        })
        .catch(console.error);
    },

    delete(key: string) {
      memoryCache.delete(key);

      // Sync to IndexedDB in the background
      db.cache.delete(key).catch(console.error);
    },
  };
}
