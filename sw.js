// Service worker: guarda la app para abrirla sin conexión.
// Red primero (así siempre ves la última versión publicada), caché si no hay red.
const CACHE = 'sunset-2027-v1';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'data/sunset-2027.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
