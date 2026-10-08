// Sincronización del progreso personal con Netlify Blobs.
//
//   GET  /api/sync              → { entries, updated }
//   POST /api/sync  { entries } → fusiona con lo guardado y devuelve el resultado
//
// Cada entrada es { v: valor, t: milisegundos }; por clave gana la más reciente.
// Además de los datos vivos, guarda una copia por día en backups/AAAA-MM-DD
// para poder volver a una versión anterior.
//
// Requiere la variable de entorno SUNSET_KEY (la clave que se escribe en la app).
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

const DATA_KEY = 'progreso';

export function mergeEntries(base, incoming) {
  const out = Object.assign({}, base);
  for (const [k, e] of Object.entries(incoming || {})) {
    if (!e || typeof e.t !== 'number') continue;
    if (!out[k] || e.t > out[k].t) out[k] = e;
  }
  return out;
}

function sameKey(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && timingSafeEqual(x, y);
}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export async function handle(req, store, secret) {
  if (!secret) return json(500, { error: 'Falta configurar SUNSET_KEY en Netlify' });
  if (!sameKey(req.headers.get('x-sunset-key'), secret)) return json(401, { error: 'Clave incorrecta' });

  const saved = (await store.get(DATA_KEY, { type: 'json' })) || { entries: {} };

  if (req.method === 'GET') return json(200, saved);

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (e) { return json(400, { error: 'JSON inválido' }); }
    if (!body || typeof body.entries !== 'object') return json(400, { error: 'Falta entries' });
    const merged = { entries: mergeEntries(saved.entries, body.entries), updated: new Date().toISOString() };
    await store.setJSON(DATA_KEY, merged);
    await store.setJSON('backups/' + merged.updated.slice(0, 10), merged);
    return json(200, merged);
  }

  return json(405, { error: 'Método no permitido' });
}

export default async (req) => handle(req, getStore({ name: 'sunset', consistency: 'strong' }), process.env.SUNSET_KEY);

export const config = { path: '/api/sync' };
