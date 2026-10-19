// Armazenamento local: IndexedDB para arquivos (documentos, fotos, SOS), localStorage para o resto.
const IDB = (() => {
  let db;
  function open() {
    return new Promise((res, rej) => {
      if (db) return res(db);
      const r = indexedDB.open('egito-mae', 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const s of ['docs', 'fotos', 'sos']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
      };
      r.onsuccess = () => { db = r.result; res(db); };
      r.onerror = () => rej(r.error);
    });
  }
  const tx = async (store, mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode); const st = t.objectStore(store);
      const out = fn(st);
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    all: store => tx(store, 'readonly', st => st.getAll()).then(l => (l || []).sort((a, b) => (a.criado || 0) - (b.criado || 0))),
    get: (store, id) => tx(store, 'readonly', st => st.get(id)),
    put: (store, obj) => tx(store, 'readwrite', st => { st.put(obj); }),
    del: (store, id) => tx(store, 'readwrite', st => { st.delete(id); }),
    count: store => tx(store, 'readonly', st => st.count()),
  };
})();
// Compatibilidade com o código dos documentos
const DB = { all: () => IDB.all('docs'), put: d => IDB.put('docs', d), del: id => IDB.del('docs', id) };

const Store = {
  get(k, def) { try { const v = localStorage.getItem('egito.' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('egito.' + k, JSON.stringify(v)); } catch {} },
};

// Pede ao navegador para não apagar os dados do app quando faltar espaço.
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}
