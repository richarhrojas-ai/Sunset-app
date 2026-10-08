// Almacén en memoria con la misma interfaz que usa la función (etag y escrituras condicionales).
export function memoryStore() {
  const m = new Map();      // clave → { json, etag }
  let n = 0;
  const store = {
    m,
    beforeWrite: null,      // gancho para simular que otro dispositivo escribe en medio
    async get(k) { return m.has(k) ? JSON.parse(m.get(k).json) : null; },
    async getWithMetadata(k) { return m.has(k) ? { data: JSON.parse(m.get(k).json), etag: m.get(k).etag } : null; },
    async setJSON(k, v, opts = {}) {
      if (store.beforeWrite) { const f = store.beforeWrite; store.beforeWrite = null; await f(); }
      if (opts.onlyIfNew && m.has(k)) return { modified: false };
      if (opts.onlyIfMatch && (!m.has(k) || m.get(k).etag !== opts.onlyIfMatch)) return { modified: false };
      m.set(k, { json: JSON.stringify(v), etag: 'e' + (++n) });
      return { modified: true, etag: m.get(k).etag };
    },
    async list({ prefix }) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  };
  return store;
}
