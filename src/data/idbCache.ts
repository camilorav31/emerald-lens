// Minimal promise wrapper over one IndexedDB object store, used as a durable cache for PokeAPI data.
const DB_NAME = 'emerald-lens'
const STORE = 'pokeapi'
const VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = action(db.transaction(STORE, mode).objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export const cacheGet = <T>(key: string) => run<T | undefined>('readonly', (s) => s.get(key))
export const cacheSet = (key: string, value: unknown) => run('readwrite', (s) => s.put(value, key))

const inflight = new Map<string, Promise<unknown>>()

// Cache-first: IndexedDB hit, otherwise build once (deduped across concurrent callers) and store.
export function cached<T>(key: string, build: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>
  const promise = (async () => {
    try {
      const hit = await cacheGet<T>(key)
      if (hit !== undefined) return hit
    } catch {
      /* IndexedDB unavailable (private mode): fall through to the network */
    }
    const value = await build()
    cacheSet(key, value).catch(() => {})
    return value
  })().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}
