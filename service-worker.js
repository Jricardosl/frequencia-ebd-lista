const CACHE_NAME = "ebd-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/alunos.js",
  "/js/script.js",
  "/js/pwa.js",
  "/manifest.json",
  "/images/LOGO NAZARENO.jpeg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
