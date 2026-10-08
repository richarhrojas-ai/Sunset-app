// Service worker: guarda la app para abrirla sin conexión.
// Red primero (así siempre ves la última versión publicada), caché si no hay red.
// Nunca se guarda /api/: el contenido y los registros viajan con la clave y se guardan en la app.
const CACHE = 'sunset-v38';
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
  'images/trees/Verde-wide.webp',
  'images/trees/Verde-tall.webp',
  'images/trees/Amarillo-wide.webp',
  'images/trees/Amarillo-tall.webp',
  'images/trees/Blanco-wide.webp',
  'images/trees/Blanco-tall.webp',
  'images/trees/Negro-wide.webp',
  'images/trees/Negro-tall.webp',
  'images/trees/Rojo-wide.webp',
  'images/trees/Rojo-tall.webp',
  'images/trees/Azul-wide.webp',
  'images/trees/Azul-tall.webp',
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
  if (e.request.method !== 'GET' || new URL(e.request.url).pathname.startsWith('/api/')) return;
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
