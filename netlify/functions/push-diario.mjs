// Función programada (cada hora): envía el recordatorio a cada dispositivo suscrito cuando en su zona horaria
// es la hora que eligió, una sola vez por día. Quita las suscripciones que el navegador ya dio de baja (404/410).
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { SUBS_KEY } from './push.mjs';

export const PAYLOAD = { title: 'Sunset', body: 'Dos minutos para tu registro de hoy.', url: './?rapido=1' };

export function localParts(date, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: p.year + '-' + p.month + '-' + p.day, hour: Number(p.hour) };
}

export async function runDaily(store, send, now = new Date()) {
  const list = (await store.get(SUBS_KEY, { type: 'json' })) || [];
  const keep = [];
  let sent = 0, changed = false;
  for (const s of list) {
    const lp = localParts(now, s.tz || 'UTC');
    if (lp.hour === s.hour && s.last !== lp.day) {
      try {
        await send({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(PAYLOAD));
        s.last = lp.day; sent++; changed = true;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) { changed = true; continue; }
      }
    }
    keep.push(s);
  }
  if (changed) await store.setJSON(SUBS_KEY, keep);
  return sent;
}

export default async () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || process.env.URL || 'https://sunset.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  await runDaily(getStore({ name: 'sunset', consistency: 'strong' }), (sub, payload) => webpush.sendNotification(sub, payload));
};

export const config = { schedule: '@hourly' };
