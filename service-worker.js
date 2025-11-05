const CACHE_NAME = "prononciateur-cache-v3";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/assets/icon-192x192.png",
  "/assets/icon-512x512.png"
];

// Installation : mettre en cache les fichiers
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

// Fetch : affiche la page offline si échec de réseau
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    fetch(evt.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        if (evt.request.mode === "navigate") {
          return caches.match("/offline.html");
        } else {
          return caches.match(evt.request);
        }
      })
  );
});
