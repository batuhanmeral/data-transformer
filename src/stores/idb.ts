const storeName = "data";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("data-workbench", 1);
    let blocked = false;

    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("IndexedDB is blocked."));
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
  });
}

async function query<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  try {
    const db = await openDatabase();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = operation(transaction.objectStore(storeName));
        transaction.onabort = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(request.result);
      });
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  }
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return query<T>("readonly", (store) => store.get(key));
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  await query("readwrite", (store) => store.put(value, key));
}
