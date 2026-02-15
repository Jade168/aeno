// sw.js - AENO FIX VERSION
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
      await self.clients.claim();
    })()
  );
});

// NEVER cache anything (development safe)
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
