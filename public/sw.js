// Service worker: guarda la app para abrirla sin conexión.
// Red primero (así siempre ves la última versión publicada), caché si no hay red.
// Nunca se guarda /api/: el contenido y los registros viajan con la clave y se guardan en la app.
const CACHE = 'sunset-v76';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/tree.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'images/logo.png',
  'images/trees/Lila-wide.webp',
  'images/trees/Lila-tall.webp',
  'images/trees/Lila-wide-day.webp',
  'images/trees/Lila-tall-day.webp',
  'images/trees/Verde-wide.webp',
  'images/trees/Verde-tall.webp',
  'images/trees/Verde-wide-day.webp',
  'images/trees/Verde-tall-day.webp',
  'images/trees/Amarillo-wide.webp',
  'images/trees/Amarillo-tall.webp',
  'images/trees/Amarillo-wide-day.webp',
  'images/trees/Amarillo-tall-day.webp',
  'images/trees/Blanco-wide.webp',
  'images/trees/Blanco-tall.webp',
  'images/trees/Blanco-wide-day.webp',
  'images/trees/Blanco-tall-day.webp',
  'images/trees/Negro-wide.webp',
  'images/trees/Negro-tall.webp',
  'images/trees/Negro-wide-day.webp',
  'images/trees/Negro-tall-day.webp',
  'images/trees/Rojo-wide.webp',
  'images/trees/Rojo-tall.webp',
  'images/trees/Rojo-wide-day.webp',
  'images/trees/Rojo-tall-day.webp',
  'images/trees/Azul-wide.webp',
  'images/trees/Azul-tall.webp',
  'images/trees/Azul-wide-day.webp',
  'images/trees/Azul-tall-day.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Solo el propio sitio (sin /api/) y las fuentes. Lo demás (Google Calendar, etc.) va directo a la red.
  const own = url.origin === location.origin;
  if (e.request.method !== 'GET' || (own && url.pathname.startsWith('/api/')) || (!own && !url.hostname.startsWith('fonts.g'))) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Notificación diaria: la envía la función programada; al tocarla se abre el registro rápido.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Sunset', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.startsWith(self.registration.scope));
    if (open) return open.navigate(url).then((c) => (c || open).focus()).catch(() => open.focus());
    return self.clients.openWindow(url);
  }));
});
