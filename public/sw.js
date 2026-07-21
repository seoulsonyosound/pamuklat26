const CACHE_NAME = 'photobooth-offline-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/capture',
  '/gallery',
  '/admin/frame',
  '/globals.css',
  '/favicon.ico',
];

// Installation: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use silent catch to avoid install failure on dynamic or hot-reloading assets
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[ServiceWorker] Failed to cache asset: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activation: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing cached files from', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetching: intercept requests, serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests, bypass Chrome extensions, API endpoints, and Supabase
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('chrome-extension') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately
        return cachedResponse;
      }

      // Fetch from network
      return fetch(event.request)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone response and cache it for future offline usage
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Fetch failed, network offline:', error);
          // If offline and request is for a page/route, return the cached index
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw error;
        });
    })
  );
});
