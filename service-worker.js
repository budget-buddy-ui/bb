const CACHE_NAME = "budget-buddy-v1";
const URLS_TO_CACHE = [
  "/test/",
  "/test/index.html",
  "/test/manifest.json",
  "/test/icons/icon-192.png",
  "/test/icons/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Bubblegum+Sans&family=Open+Sans:wght@400;700&display=swap"
];

// Install SW and cache resources
self.addEventListener("install", (event) => {
  console.log("📦 Service worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Caching app shell");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate SW and clean old caches
self.addEventListener("activate", (event) => {
  console.log("⚙️ Service worker activating...");
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
  return self.clients.claim();
});

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // Optionally: return fallback offline page or image
        })
      );
    })
  );
});
