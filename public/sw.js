// Service Worker for Qawmi Madrasa PWA
const CACHE_NAME = 'madrasa-v9';

// Only cache essential static assets (no /index.html - Next.js doesn't produce it)
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
];

// Standalone offline page for failed navigations (network down + nothing in
// cache). Self-contained HTML — no external assets, UTF-8, light theme with
// the template's teal-900 header band + dot-grid background identity.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>অফলাইনে আছেন</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 24px;
    font-family: 'Noto Serif Bengali', 'Noto Sans Bengali', system-ui, sans-serif;
    /* Template dot-grid: gray dots on light gray */
    background-color: #f3f4f6;
    background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    background-size: 20px 20px;
    color: #1f2937;
  }
  main {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-top: 4px solid #0f766e;
    border-radius: 16px;
    padding: 40px 32px;
    max-width: 420px; width: 100%;
    box-shadow: 0 2px 4px rgba(0,0,0,.04), 0 12px 32px -12px rgba(0,0,0,.12);
  }
  .star {
    width: 76px; height: 76px; margin: 0 auto 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; color: #0f766e;
    background: #f0fdfa;
    border: 1px solid #99f6e4;
  }
  h1 { font-size: 1.55rem; font-weight: 700; color: #115e59; margin-bottom: 10px; }
  .sub { font-size: 1.02rem; color: #4b5563; margin-bottom: 6px; }
  .en { font-size: 0.85rem; color: #9ca3af; margin-bottom: 26px; }
  button {
    font: inherit; font-weight: 700; font-size: 0.98rem; cursor: pointer;
    color: #ffffff; background: #0f766e;
    border: 1px solid #0f766e; border-radius: 999px;
    padding: 11px 30px;
  }
  button:hover { background: #0d9488; }
</style>
</head>
<body>
  <main>
    <div class="star" aria-hidden="true">✦</div>
    <h1>অফলাইনে আছেন</h1>
    <p class="sub">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন</p>
    <p class="en">You are offline — check your connection and try again.</p>
    <button onclick="location.reload()">আবার চেষ্টা করুন / Retry</button>
  </main>
</body>
</html>`;

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
// Every remaining GET is fetched network-first and successful same-origin
// non-navigation responses are written to the cache; the skip-list below
// (dynamic /api/ routes, dev-only HMR artifacts and the Firebase / Google /
// GitHub hosts) never reaches that path.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls, dev HMR artifacts and external resources.
  // '/_next/webpack-hmr' and 'hot-update' are dev-server artifacts — caching
  // them breaks hot reload and serves stale dev chunks.
  const url = event.request.url;
  if (url.includes('/api/') ||
      url.includes('/_next/webpack-hmr') ||
      url.includes('hot-update') ||
      url.includes('firebaseio.com') ||
      url.includes('firebasedatabase.app') ||
      url.includes('googleapis.com') ||
      url.includes('github.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful same-origin, non-navigation responses
        if (response.ok &&
            event.request.mode !== 'navigate' &&
            url.startsWith(self.location.origin)) {
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
          // For navigation requests, serve a friendly standalone offline page
          if (event.request.mode === 'navigate') {
            return new Response(OFFLINE_HTML, {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
