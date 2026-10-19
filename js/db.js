// Armazenamento local: IndexedDB para documentos (fotos), localStorage para o resto.
const DB = (() => {
  let db;
  function open() {
    return new Promise((res, rej) => {
      if (db) return res(db);
      const r = indexedDB.open('egito-mae', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('docs', { keyPath: 'id' }); };
      r.onsuccess = () => { db = r.result; res(db); };
      r.onerror = () => rej(r.error);
    });
  }
  async function all() {
    const d = await open();
    return new Promise((res, rej) => {
      const req = d.transaction('docs').objectStore('docs').getAll();
      req.onsuccess = () => res(req.result.sort((a, b) => a.criado - b.criado));
      req.onerror = () => rej(req.error);
    });
  }
  async function put(doc) {
    const d = await open();
    return new Promise((res, rej) => {
      const tx = d.transaction('docs', 'readwrite');
      tx.objectStore('docs').put(doc);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  async function del(id) {
    const d = await open();
    return new Promise((res, rej) => {
      const tx = d.transaction('docs', 'readwrite');
      tx.objectStore('docs').delete(id);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  }
  return { all, put, del };
})();

const Store = {
  get(k, def) { try { const v = localStorage.getItem('egito.' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('egito.' + k, JSON.stringify(v)); } catch {} },
};
