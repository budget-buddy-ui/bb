self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('budget-buddy-cache').then(cache => {
      return cache.addAll([
        '/test/',
        '/test/index.html',
        '/test/manifest.json',
        '/test/icon-192.png',
        '/test/icon-512.png'
        // Add more files if needed (JS, CSS, fonts, etc.)
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
