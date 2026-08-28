"use client";

/** IndexedDB stash for editor images that haven't been committed with the post yet. */

const DB_NAME = "gitpress.pending-media";
const STORE = "files";
const VERSION = 1;

export interface PendingMediaFile {
  name: string;
  type: string;
  blob: Blob;
}

function storageKey(siteId: string, path: string): string {
  return `${siteId}:${path || "new"}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readPendingMedia(siteId: string, path: string): Promise<PendingMediaFile[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(storageKey(siteId, path));
      request.onsuccess = () => {
        const value = request.result as PendingMediaFile[] | undefined;
        resolve(Array.isArray(value) ? value : []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function writePendingMedia(
  siteId: string,
  path: string,
  files: PendingMediaFile[],
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const key = storageKey(siteId, path);
      if (files.length === 0) store.delete(key);
      else store.put(files, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Quota / private mode — in-memory queue still works for this session.
  }
}

export async function clearPendingMedia(siteId: string, path: string): Promise<void> {
  await writePendingMedia(siteId, path, []);
}
