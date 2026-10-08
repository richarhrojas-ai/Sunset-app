import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, mergeEntries } from '../netlify/functions/sync.mjs';
import { handleContent } from '../netlify/functions/content.mjs';

function memoryStore() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async list({ prefix }) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  };
}
const req = (method, key, body, query = '') => new Request('http://x/api/sync' + query, {
  method, headers: key ? { 'x-sunset-key': key } : {}, body: body ? JSON.stringify(body) : undefined,
});
const call = (r, s, ...rest) => handle(r, s, rest.length ? rest[0] : 'k', 0);

test('mergeEntries: gana la entrada más reciente por clave', () => {
  const a = { x: { v: 1, t: 10 }, y: { v: 'a', t: 50 } };
  const b = { x: { v: 2, t: 20 }, y: { v: 'b', t: 40 }, z: { v: true, t: 5 }, bad: { v: 1 } };
  assert.deepEqual(mergeEntries(a, b), { x: { v: 2, t: 20 }, y: { v: 'a', t: 50 }, z: { v: true, t: 5 } });
});

test('rechaza sin clave, con clave incorrecta o sin SUNSET_KEY', async () => {
  const s = memoryStore();
  assert.equal((await call(req('GET'), s, 'secreto')).status, 401);
  assert.equal((await call(req('GET', 'otra'), s, 'secreto')).status, 401);
  assert.equal((await call(req('GET', 'secreto'), s, undefined)).status, 500);
});

test('POST fusiona y GET devuelve lo guardado', async () => {
  const s = memoryStore();
  let r = await call(req('POST', 'k', { entries: { a: { v: 1, t: 1 } } }), s);
  assert.equal(r.status, 200);
  r = await call(req('POST', 'k', { entries: { a: { v: 0, t: 0 }, b: { v: 2, t: 2 } } }), s);
  const body = await r.json();
  assert.deepEqual(body.entries, { a: { v: 1, t: 1 }, b: { v: 2, t: 2 } });
  const got = await (await call(req('GET', 'k'), s)).json();
  assert.deepEqual(got.entries, body.entries);
});

test('la copia del día guarda el estado ANTERIOR a la primera escritura de ese día', async () => {
  const s = memoryStore();
  await call(req('POST', 'k', { entries: { nota: { v: 'original', t: 1 } } }), s);     // primera vez: nada que copiar
  assert.equal([...s.m.keys()].filter((k) => k.startsWith('backups/')).length, 0);
  await call(req('POST', 'k', { entries: { nota: { v: 'borrada', t: 2 } } }), s);      // primera escritura "con datos": copia lo anterior
  await call(req('POST', 'k', { entries: { nota: { v: 'otra', t: 3 } } }), s);         // misma fecha: no pisa la copia
  const day = new Date().toISOString().slice(0, 10);
  const list = await (await call(req('GET', 'k', null, '?list=backups'), s)).json();
  assert.deepEqual(list.dates, [day]);
  const copy = await (await call(req('GET', 'k', null, '?backup=' + day), s)).json();
  assert.equal(copy.entries.nota.v, 'original');
});

test('pedir una copia: fecha inválida → 400, inexistente → 404', async () => {
  const s = memoryStore();
  assert.equal((await call(req('GET', 'k', null, '?backup=../../x'), s)).status, 400);
  assert.equal((await call(req('GET', 'k', null, '?backup=2020-01-01'), s)).status, 404);
});

test('POST con cuerpo inválido → 400', async () => {
  const s = memoryStore();
  const bad = new Request('http://x/api/sync', { method: 'POST', headers: { 'x-sunset-key': 'k' }, body: 'no-json' });
  assert.equal((await call(bad, s)).status, 400);
  assert.equal((await call(req('POST', 'k', { otra: 1 }), s)).status, 400);
});

test('/api/content solo entrega el contenido con la clave correcta', async () => {
  const data = { years: [{ year: 2027 }] };
  const get = (key) => new Request('http://x/api/content', { headers: key ? { 'x-sunset-key': key } : {} });
  assert.equal((await handleContent(get(), 's', data, 0)).status, 401);
  assert.equal((await handleContent(get('mala'), 's', data, 0)).status, 401);
  const ok = await handleContent(get('s'), 's', data, 0);
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), data);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
});

test('el contenido real trae años con 52 semanas y 7×7 palabras', async () => {
  const real = (await import('../netlify/content/data.mjs')).default;
  for (const y of real.years) {
    assert.equal(y.weeks.length, 52);
    assert.equal(y.board.length, 7);
    assert.ok(y.board.every((r) => r.length === 7));
  }
});
