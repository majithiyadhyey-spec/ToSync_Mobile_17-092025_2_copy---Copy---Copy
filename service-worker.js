// This service worker is used for Progressive Web App (PWA) features,
// primarily for caching assets to enable offline functionality.

// A unique name for the cache, which should be versioned.
// When you update the app's assets, incrementing this version number
// will ensure the service worker installs the new files.
const CACHE_NAME = 'tosync-cache-v1';

// An array of URLs that form the "app shell" - the minimal resources
// required for the application to run. These are cached during installation.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', 
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/locales/en.json',
  '/locales/cs.json',
  // CDN resources from the importmap are also cached.
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react@^19.1.0/',
  'https://esm.sh/react-dom@^19.1.0/',
  'https://esm.sh/jsqr@1.4.0',
  'https://esm.sh/@google/genai'
];

/**
 * 'install' event: Fired when the service worker is first registered.
 * This is where we open our cache and add the app shell URLs to it.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add all URLs to cache. We catch errors for individual URLs
        // to make the installation more resilient against single CDN failures.
        const promises = urlsToCache.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
            });
        });
        return Promise.all(promises);
      })
  );
});

/**
 * 'fetch' event: Fired for every network request made by the page.
 * This service worker uses a "cache-first" strategy. It first checks if a
 * response for the request exists in the cache. If so, it serves the cached
 * response. Otherwise, it fetches the resource from the network, serves it
 * to the page, and also adds the response to the cache for future requests.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If a cached response is found, return it.
        if (response) {
          return response;
        }

        // If not found in cache, fetch from the network.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response.
            // 0 status can occur for 'no-cors' requests to CDNs.
            if (!response || (response.status !== 200 && response.status !== 0) || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                 // We only cache GET requests to avoid caching POST/PUT etc.
                if(event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

/**
 * 'activate' event: Fired when the service worker becomes active.
 * This is the ideal place to clean up old, unused caches. It ensures that
 * when the CACHE_NAME is updated, older versions of the cache are deleted.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});