/* sw.js – Cápsula Volver al Futuro 2.0
   Estrategia:
   - Precarga mínimo same-origin (index, manifest, logo).
   - Runtime cache "network-first" para HTML.
   - "stale-while-revalidate" simple para assets same-origin.
   Nota: CDNs (Tailwind, QRCode, LZString, confetti) se dejan pasar a red (CORS).
*/
const VERSION = 'v1.0.0';
const CACHE_STATIC = `capsula-static-${VERSION}`;
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './grok_image_qtfpp7.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k.startsWith('capsula-') && k !== CACHE_STATIC) ? caches.delete(k) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Sólo manejamos GET
  if (request.method !== 'GET') return;

  // HTML -> network-first (para no quedar desactualizado)
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const respClone = res.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, respClone));
          return res;
        })
        .catch(() => caches.match(request).then(res => res || caches.match('./index.html')))
    );
    return;
  }

  // Same-origin assets -> cache-first, luego red (stale-while-revalidate simple)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          const respClone = res.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, respClone));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Externos (CDNs) -> network fallback a cache si existe (poco probable por CORS)
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
