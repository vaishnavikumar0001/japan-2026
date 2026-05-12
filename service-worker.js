
const CACHE_NAME = 'japan-2026-v57';

// Use relative paths so this works whether deployed at /japan-2026/ or /
const BASE = self.registration.scope;

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'japan_trip_data.json',
  BASE + 'css/styles.css',
  BASE + 'js/auth.js',
  BASE + 'js/data.js',
  BASE + 'js/app.js',
  BASE + 'js/itinerary.js',
  BASE + 'js/hotels.js',
  BASE + 'js/trains.js',
  BASE + 'js/onsens.js',
  BASE + 'js/checklists.js',
  BASE + 'js/learn.js',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'sumo_explainer.html',
  BASE + 'suzuka_explainer.html'
];

// Install: pre-cache all assets individually so one 404 can't kill the whole install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
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
          return caches.match(BASE + 'index.html');
        }
      });
    })
  );
});
