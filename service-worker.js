// Service worker de Armenta Monitor Simulator.
// Sube CACHE_VERSION cada vez que subas una nueva versión del index.html,
// para que los usuarios reciban la actualización en vez de quedarse con la copia guardada.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'armenta-monitor-sim-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('armenta-monitor-sim-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: red primero para index.html (para no quedarse con una versión vieja del
// simulador), y "cache primero" para el resto (íconos/manifest, que casi no cambian).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAppShellDoc = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isAppShellDoc) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((res) => res || fetch(req))
  );
});
