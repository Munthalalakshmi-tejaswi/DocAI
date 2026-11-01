// IndexedDB storage service for persisting active document and chat session across browser refresh

const DB_NAME = "DocAI_Persistence_DB";
const STORE_NAME = "active_session";
const SESSION_KEY = "current_session";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveActiveSession({
  documentId,
  filename,
  uploadDate,
  totalPages,
  fileBlob,
  messages,
}) {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(
        {
          documentId,
          filename,
          uploadDate,
          totalPages,
          fileBlob,
          messages,
          savedAt: Date.now(),
        },
        SESSION_KEY
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not persist session to IndexedDB:", err);
  }
}

export async function loadActiveSession() {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(SESSION_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Could not load session from IndexedDB:", err);
    return null;
  }
}

export async function clearActiveSession() {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(SESSION_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not clear session from IndexedDB:", err);
  }
}
