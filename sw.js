const CACHE = "cvf-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./grok_image_qtfpp7.jpg",
  "./manifest.webmanifest"
];
// Cache first, network fallback (+ put en cache)
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res=>{
      try{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); }catch{}
      return res;
    }).catch(()=> cached))
  );
});
