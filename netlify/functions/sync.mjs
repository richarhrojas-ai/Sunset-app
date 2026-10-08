// Sincronización del progreso personal con Netlify Blobs.
//
//   GET  /api/sync                    → { entries, updated }
//   GET  /api/sync?list=backups       → { dates: ['2027-03-05', ...] }
//   GET  /api/sync?backup=AAAA-MM-DD  → el estado con que empezó ese día
//   POST /api/sync  { entries }       → fusiona con lo guardado y devuelve el resultado
//
// Cada entrada es { v: valor, t: milisegundos }; por clave gana la más reciente.
// Antes de la primera escritura de cada día se guarda una copia del estado anterior
// (backups/AAAA-MM-DD), así que siempre se puede volver al estado con que empezó un día.
//
// Requiere la variable de entorno SUNSET_KEY (la clave que se escribe en la app).
import { getStore } from '@netlify/blobs';
import { authorize, json } from '../lib/auth.mjs';

const DATA_KEY = 'progreso';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function mergeEntries(base, incoming) {
  const out = Object.assign({}, base);
  for (const [k, e] of Object.entries(incoming || {})) {
    if (!e || typeof e.t !== 'number') continue;
    if (!out[k] || e.t > out[k].t) out[k] = e;
  }
  return out;
}

export async function handle(req, store, secret, delayMs) {
  const denied = await authorize(req, secret, delayMs);
  if (denied) return denied;

  const url = new URL(req.url);
  const saved = (await store.get(DATA_KEY, { type: 'json' })) || { entries: {} };

  if (req.method === 'GET') {
    if (url.searchParams.get('list') === 'backups') {
      const { blobs } = await store.list({ prefix: 'backups/' });
      const dates = blobs.map((b) => b.key.slice('backups/'.length)).filter((d) => DAY.test(d)).sort().reverse();
      return json(200, { dates });
    }
    const day = url.searchParams.get('backup');
    if (day) {
      if (!DAY.test(day)) return json(400, { error: 'Fecha inválida' });
      const copy = await store.get('backups/' + day, { type: 'json' });
      return copy ? json(200, copy) : json(404, { error: 'No hay copia de ese día' });
    }
    return json(200, saved);
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (e) { return json(400, { error: 'JSON inválido' }); }
    if (!body || typeof body.entries !== 'object') return json(400, { error: 'Falta entries' });
    const updated = new Date().toISOString();
    const today = 'backups/' + updated.slice(0, 10);
    if (Object.keys(saved.entries).length && !(await store.get(today, { type: 'json' }))) {
      await store.setJSON(today, saved);
    }
    const merged = { entries: mergeEntries(saved.entries, body.entries), updated };
    await store.setJSON(DATA_KEY, merged);
    return json(200, merged);
  }

  return json(405, { error: 'Método no permitido' });
}

export default async (req) => handle(req, getStore({ name: 'sunset', consistency: 'strong' }), process.env.SUNSET_KEY);

export const config = { path: '/api/sync' };
