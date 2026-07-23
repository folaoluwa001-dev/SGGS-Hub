const CACHE_NAME = 'sggs-hub-cache-v1';
const DYNAMIC_CACHE = 'sggs-hub-dynamic-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event Listener (Triggers browser PWA installability check in desktop omnibox)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Exclude API requests and chrome extension protocols
  if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            const cache = await caches.open(CACHE_NAME);
            return (await cache.match('/')) || Response.error();
          }
        });
    })
  );
});
