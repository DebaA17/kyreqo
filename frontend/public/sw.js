const CACHE_NAME = 'kyreqo-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Pass-through fetch handler satisfying PWA installability requirements
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
