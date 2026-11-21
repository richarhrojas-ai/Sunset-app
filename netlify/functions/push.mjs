// Notificación diaria (Web Push): guarda en qué dispositivo y a qué hora avisar.
//
//   GET    /api/push                         → { publicKey } (clave pública VAPID, para suscribirse)
//   POST   /api/push { subscription, hour, tz } → guarda o actualiza la suscripción de este dispositivo
//   DELETE /api/push { endpoint }            → la quita
//
// Requiere SUNSET_KEY y, para enviar, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY (npm run push:claves).
// El envío lo hace la función programada push-diario.mjs, una vez por hora.
import { getStore } from '@netlify/blobs';
import { authorize, json } from '../lib/auth.mjs';

export const SUBS_KEY = 'push/subs';
const MAX_DEVICES = 10;

export function validTimeZone(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return 'UTC';
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch (e) { return 'UTC'; }
}

export async function handlePush(req, store, secret, env = {}, delayMs) {
  const denied = await authorize(req, secret, delayMs);
  if (denied) return denied;
  if (req.method === 'GET') return json(200, { publicKey: env.VAPID_PUBLIC_KEY || '' });
  if (req.method !== 'POST' && req.method !== 'DELETE') return json(405, { error: 'Método no permitido' });
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'JSON inválido' }); }
  const list = (await store.get(SUBS_KEY, { type: 'json' })) || [];
  if (req.method === 'DELETE') {
    await store.setJSON(SUBS_KEY, list.filter((s) => s.endpoint !== (body && body.endpoint)));
    return json(200, { ok: true });
  }
  const sub = body && body.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    return json(400, { error: 'Suscripción inválida' });
  }
  const hour = Number.isInteger(body.hour) && body.hour >= 0 && body.hour <= 23 ? body.hour : 21;
  const entry = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, hour, tz: validTimeZone(body.tz), last: '' };
  const next = list.filter((s) => s.endpoint !== sub.endpoint).concat([entry]).slice(-MAX_DEVICES);
  await store.setJSON(SUBS_KEY, next);
  return json(200, { ok: true, hour, tz: entry.tz });
}

export default async (req) => handlePush(req, getStore({ name: 'sunset', consistency: 'strong' }), process.env.SUNSET_KEY, process.env);

export const config = { path: '/api/push' };
