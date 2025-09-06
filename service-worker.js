const CACHE_VERSION = "budget-buddy-v1.1"; // IMPORTANT: Increment this version number for every update!
const CACHE_NAME = CACHE_VERSION; // Use the version as the cache name

const URLS_TO_CACHE = [
  "/bb/", // Cache the root path, which often serves index.html
  "/bb/index.html", // Explicitly cache your main HTML file
  "/bb/manifest.json",
  "/bb/icons/icon-192.png",
  "/bb/icons/icon-512.png",
  // Note: Google Fonts CSS is external. It's generally handled well by browser cache,
  // but if you want to ensure offline access for it, you'd need a more advanced strategy
  // or self-host the fonts. For now, we'll assume it's fine to fetch from network.
  // "https://fonts.googleapis.com/css2?family=Bubblegum+Sans&family=Open+Sans:wght@400;700&display=swap"
  // The original HTML uses 'Open Sans' and 'Comic Neue', so let's update this if you want to cache it:
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Comic+Neue:wght@400;700&display=swap"
];

// Install SW and cache resources
self.addEventListener("install", (event) => {
  console.log("📦 Service worker installing...", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console("✅ Caching app shell:", URLS_TO_CACHE);
      return cache.addAll(URLS_TO_CACHE);
    }).catch(error => {
      console.error("❌ Service worker failed to cache during install:", error);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate SW and clean old caches
self.addEventListener("activate", (event) => {
  console.log("⚙️ Service worker activating...", CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim(); // Take control of clients immediately
});

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy for index.html and the root path: Network First, then Cache
  // This ensures users get the latest HTML if online, and a cached version if offline.
  if (requestUrl.pathname === '/bb/' || requestUrl.pathname === '/bb/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // If network request is successful, cache the new response
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(async () => {
          // If network fails, serve from cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback for completely offline if index.html isn't in cache (shouldn't happen often)
          // You could return a specific offline page here if you had one.
          return new Response("<h1>Offline</h1><p>Please check your internet connection.</p>", {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return; // Stop processing for this request
  }

  // Strategy for other assets (icons, manifest, fonts): Cache First, then Network (Stale-While-Revalidate)
  // This provides fast loading from cache, and updates the cache in the background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update the cache with the new network response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // If network fails and no cached response, handle offline scenario for this asset
        console.warn("❌ Network request failed and no cache for:", event.request.url);
        // You could return a placeholder image or a generic offline message here
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Optional: Listen for 'message' event from the main thread
// This can be used to force a service worker update from the client side if needed.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
