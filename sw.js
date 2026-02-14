const CACHE_NAME = 'war-card-game-v1.3';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './index.tsx',
  './App.tsx',
  './constants.tsx',
  './types.ts',
  './manifest.json',
  './components/CardComponent.tsx',
  './components/DeckStack.tsx',
  './services/soundService.ts'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});