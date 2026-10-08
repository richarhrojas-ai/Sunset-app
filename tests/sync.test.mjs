import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, mergeEntries } from '../netlify/functions/sync.mjs';

function memoryStore() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
  };
}
const req = (method, key, body) => new Request('http://x/api/sync', {
  method, headers: key ? { 'x-sunset-key': key } : {}, body: body ? JSON.stringify(body) : undefined,
});

test('mergeEntries: gana la entrada más reciente por clave', () => {
  const a = { x: { v: 1, t: 10 }, y: { v: 'a', t: 50 } };
  const b = { x: { v: 2, t: 20 }, y: { v: 'b', t: 40 }, z: { v: true, t: 5 }, bad: { v: 1 } };
  assert.deepEqual(mergeEntries(a, b), { x: { v: 2, t: 20 }, y: { v: 'a', t: 50 }, z: { v: true, t: 5 } });
});

test('rechaza sin clave, con clave incorrecta o sin SUNSET_KEY', async () => {
  const s = memoryStore();
  assert.equal((await handle(req('GET'), s, 'secreto')).status, 401);
  assert.equal((await handle(req('GET', 'otra'), s, 'secreto')).status, 401);
  assert.equal((await handle(req('GET', 'secreto'), s, undefined)).status, 500);
});

test('POST fusiona, guarda copia diaria y GET devuelve lo guardado', async () => {
  const s = memoryStore();
  let r = await handle(req('POST', 'k', { entries: { a: { v: 1, t: 1 } } }), s, 'k');
  assert.equal(r.status, 200);
  r = await handle(req('POST', 'k', { entries: { a: { v: 0, t: 0 }, b: { v: 2, t: 2 } } }), s, 'k');
  const body = await r.json();
  assert.deepEqual(body.entries, { a: { v: 1, t: 1 }, b: { v: 2, t: 2 } });
  assert.ok([...s.m.keys()].some((k) => k.startsWith('backups/')));
  const got = await (await handle(req('GET', 'k'), s, 'k')).json();
  assert.deepEqual(got.entries, body.entries);
});

test('POST con cuerpo inválido → 400', async () => {
  const s = memoryStore();
  const bad = new Request('http://x/api/sync', { method: 'POST', headers: { 'x-sunset-key': 'k' }, body: 'no-json' });
  assert.equal((await handle(bad, s, 'k')).status, 400);
  assert.equal((await handle(req('POST', 'k', { otra: 1 }), s, 'k')).status, 400);
});
