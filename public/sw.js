// Service Worker for Qawmi Madrasa PWA
const CACHE_NAME = 'madrasa-v3';

// Only cache essential static assets (no /index.html - Next.js doesn't produce it)
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/islamic-pattern.png',
];

// Install - cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail for assets that may not exist
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first with selective caching
// Only cache same-origin static assets, NOT Firebase or dynamic API responses
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls and external resources
  const url = event.request.url;
  if (url.includes('/api/') ||
      url.includes('firebaseio.com') ||
      url.includes('googleapis.com') ||
      url.includes('github.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache same-origin, non-navigation responses
        if (response.ok && event.request.mode !== 'navigate') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache for same-origin requests
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigation requests, serve a basic offline page
          if (event.request.mode === 'navigate') {
            return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
