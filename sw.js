self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('budget-buddy-cache').then(cache => {
      return cache.addAll([
        '/',
        '/bb.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
        // Add more static assets (fonts, CSS, etc.) here if needed
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});