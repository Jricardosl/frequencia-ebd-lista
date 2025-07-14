const CACHE_NAME = "ebd-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/alunos.js",
  "/js/script.js",
  "/js/pwa.js",
  "/manifest.json",
  "/images/LOGO NAZARENO.jpeg",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      // Fallback opcional: você pode colocar uma página offline.html aqui
    })
  );
});
