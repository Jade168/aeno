// AENO SW v3 - FORCE UPDATE (NO CACHE)

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(() => {
      return new Response("Offline - AENO cannot load", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    })
  );
});
