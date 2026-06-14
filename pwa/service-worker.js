// ============================================================
// pwa/service-worker.js — Kesling Archive D3
// ============================================================

const CACHE_NAME = 'kesling-archive-v1';
const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/upload.html',
  '/search.html',
  '/files.html',
  '/profile.html',
  '/settings.html',
  '/pwa/offline.html',
  '/assets/css/style.css',
  '/assets/css/dashboard.css',
  '/assets/css/upload.css',
  '/assets/css/responsive.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/dashboard.js',
  '/assets/js/upload.js',
  '/assets/js/search.js',
  '/supabase/supabase.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://fonts')));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Supabase API calls — always network
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) {
    return;
  }

  // For navigation requests, network first then fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/pwa/offline.html'))
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('/pwa/offline.html');
      });
    })
  );
});
