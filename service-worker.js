const CACHE_NAME = "prononciateur-cache-v1";
const FILES_TO_CACHE = [
  "/", // <-- important pour le root
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/assets/icon-192x192.png",
  "/assets/icon-512x512.png"
];

// Installation : on met les fichiers en cache
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch : réponse depuis le cache ou le réseau
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request);
    })
  );
});
