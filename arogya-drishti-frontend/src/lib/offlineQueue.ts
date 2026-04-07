/**
 * IndexedDB wrapper for the offline write queue.
 * Manages persistence of requests to be replayed when back online.
 */

const DB_NAME = 'arogya-sync';
const DB_VERSION = 1;
const STORE_NAME = 'arogya-sync-queue';

export interface QueuedRequest {
  id: string;          // uuid
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  retries: number;
  createdAt: number;   // timestamp
}

/**
 * Generate a simple UUID v4-like string
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Open or create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Enqueue a request to be retried when back online
 */
export async function enqueue(
  req: Omit<QueuedRequest, 'id' | 'retries' | 'createdAt'>,
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('offlineQueue.enqueue() requires browser environment');
  }

  const db = await openDB();
  const id = generateId();

  const queuedRequest: QueuedRequest = {
    id,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
    retries: 0,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.add(queuedRequest);

    putReq.onerror = () => {
      db.close();
      reject(new Error(`Failed to enqueue request: ${putReq.error?.message}`));
    };

    putReq.onsuccess = () => {
      db.close();
      resolve(id);
    };
  });
}

/**
 * Get all queued requests
 */
export async function getAll(): Promise<QueuedRequest[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onerror = () => {
      db.close();
      reject(new Error(`Failed to get queue: ${req.error?.message}`));
    };

    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
  });
}

/**
 * Remove a queued request by ID
 */
export async function remove(id: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onerror = () => {
      db.close();
      reject(new Error(`Failed to remove request: ${req.error?.message}`));
    };

    req.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}

/**
 * Clear all queued requests
 */
export async function clear(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onerror = () => {
      db.close();
      reject(new Error(`Failed to clear queue: ${req.error?.message}`));
    };

    req.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}

/**
 * Get the number of pending requests in the queue
 */
export async function count(): Promise<number> {
  if (typeof window === 'undefined') {
    return 0;
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();

    req.onerror = () => {
      db.close();
      reject(new Error(`Failed to count queue: ${req.error?.message}`));
    };

    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
  });
}

export const offlineQueue = {
  enqueue,
  getAll,
  remove,
  clear,
  count,
};
