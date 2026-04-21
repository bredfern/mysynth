// A constant for the cache name, useful for versioning
const CACHE_NAME = 'my-synth-cache-v1';

// A list of static resources to precache
const urlsToCache = [
  "/mysynth/",
  "/mysynth/index.html",
  "/mysynth/synth.js",
  "/mysynth/root.css",
  "/mysynth/seq-step.css",
  "/mysynth/synth-app.css",
  "/mysynth/android-chrome-192x192.png",
  "/mysynth/android-chrome-512x512.png",
  "/mysynth/apple-touch-icon.png",
  "/mysynth/favicon-16x16.png",
  "/mysynth/favicon-32x32.png",
  "/mysynth/favicon.ico",
];

// The install event listener
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// The activate event listener
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// The fetch event listener
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // No match in cache, fetch from network
        return fetch(event.request);
      })
  );
});
