const CACHE_NAME = "pufflord-cache-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./config.js",
  "./state.js",
  "./prices.js",
  "./market.js",
  "./travel.js",
  "./events.js",
  "./ui.js",
  "./modal.js",
  "./save.js",
  "./quests.js",
  "./achievements.js",
  "./investments.js",
  "./upgrades.js",
  "./storage.js",
  "./feedback.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
