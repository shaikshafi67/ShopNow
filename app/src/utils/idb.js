export function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ShopNowDB', 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('store');
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
}

export async function get(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('store')) return resolve(null);
    const tx = db.transaction('store', 'readonly');
    const store = tx.objectStore('store');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function set(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
