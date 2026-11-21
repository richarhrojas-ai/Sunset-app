import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handlePush, validTimeZone, SUBS_KEY } from '../netlify/functions/push.mjs';
import { runDaily, localParts } from '../netlify/functions/push-diario.mjs';
import { handleContent, publicConfig } from '../netlify/functions/content.mjs';
import { memoryStore } from './helpers/memory-store.mjs';

const SECRET = 'clave-de-prueba';
const req = (method, body, key = SECRET) => new Request('http://x/api/push', {
  method, headers: key ? { 'x-sunset-key': key } : {}, body: body ? JSON.stringify(body) : undefined,
});
const sub = (n) => ({ endpoint: 'https://push.example/' + n, keys: { p256dh: 'p' + n, auth: 'a' + n } });

test('push: sin clave no deja suscribir', async () => {
  const r = await handlePush(req('POST', { subscription: sub(1) }, ''), memoryStore(), SECRET, {}, 0);
  assert.equal(r.status, 401);
});

test('push: entrega la clave pública y guarda/actualiza/quita suscripciones', async () => {
  const store = memoryStore();
  const g = await handlePush(req('GET'), store, SECRET, { VAPID_PUBLIC_KEY: 'PUB' }, 0);
  assert.equal((await g.json()).publicKey, 'PUB');
  assert.equal((await handlePush(req('POST', { subscription: sub(1), hour: 7, tz: 'America/Asuncion' }), store, SECRET, {}, 0)).status, 200);
  await handlePush(req('POST', { subscription: sub(1), hour: 21, tz: 'America/Asuncion' }), store, SECRET, {}, 0);
  let list = await store.get(SUBS_KEY);
  assert.equal(list.length, 1);
  assert.equal(list[0].hour, 21);
  await handlePush(req('DELETE', { endpoint: sub(1).endpoint }), store, SECRET, {}, 0);
  list = await store.get(SUBS_KEY);
  assert.equal(list.length, 0);
});

test('push: rechaza suscripciones inválidas y corrige hora o zona raras', async () => {
  const store = memoryStore();
  assert.equal((await handlePush(req('POST', { subscription: { endpoint: 'http://inseguro' } }), store, SECRET, {}, 0)).status, 400);
  const r = await handlePush(req('POST', { subscription: sub(2), hour: 99, tz: 'Marte/Olimpo' }), store, SECRET, {}, 0);
  const b = await r.json();
  assert.equal(b.hour, 21);
  assert.equal(b.tz, 'UTC');
  assert.equal(validTimeZone('America/Asuncion'), 'America/Asuncion');
});

test('envío diario: avisa una vez por día a la hora local de cada dispositivo y quita los dados de baja', async () => {
  const store = memoryStore();
  await store.setJSON(SUBS_KEY, [
    Object.assign(sub(1), { hour: 21, tz: 'America/Asuncion', last: '' }),
    Object.assign(sub(2), { hour: 21, tz: 'Europe/Madrid', last: '' }),
    Object.assign(sub(3), { hour: 21, tz: 'America/Asuncion', last: '' }),
  ]);
  const at = new Date('2027-03-06T00:15:00Z');   // 21:15 del 5 de marzo en Asunción (UTC-3); 01:15 en Madrid
  assert.deepEqual(localParts(at, 'America/Asuncion'), { day: '2027-03-05', hour: 21 });
  const sent = [];
  const send = async (s) => { if (s.endpoint.endsWith('/3')) { const e = new Error('gone'); e.statusCode = 410; throw e; } sent.push(s.endpoint); };
  assert.equal(await runDaily(store, send, at), 1);
  assert.deepEqual(sent, ['https://push.example/1']);
  const list = await store.get(SUBS_KEY);
  assert.equal(list.length, 2, 'la suscripción dada de baja se quita');
  assert.equal(list.find((s) => s.endpoint.endsWith('/1')).last, '2027-03-05');
  assert.equal(await runDaily(store, send, new Date('2027-03-06T00:45:00Z')), 0, 'no repite el mismo día');
});

test('contenido: agrega la configuración pública sin secretos', async () => {
  const cfg = publicConfig({ GOOGLE_CLIENT_ID: 'gid', VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'NO' });
  assert.deepEqual(cfg, { googleClientId: 'gid', vapidPublicKey: 'pub' });
  const r = await handleContent(new Request('http://x/api/content', { headers: { 'x-sunset-key': SECRET } }), SECRET, { years: [], config: cfg }, 0);
  assert.equal((await r.json()).config.googleClientId, 'gid');
});
