
const CACHE_NAME = 'japan-2026-v37';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/japan_trip_data.json',
  '/css/styles.css',
  '/js/auth.js',
  '/js/data.js',
  '/js/app.js',
  '/js/itinerary.js',
  '/js/hotels.js',
  '/js/trains.js',
  '/js/onsens.js',
  '/js/checklists.js',
  '/js/learn.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/sumo_explainer.html',
  '/suzuka_explainer.html'
];

// Install: pre-cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
