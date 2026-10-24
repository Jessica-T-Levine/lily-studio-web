// Lily's Hop Hop — offline support.
// Change VERSION whenever you upload a new version of the game so players get the update.
const VERSION = "hophop-page-v28";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "../playhouse/lily-halloween-v1.js", "../playhouse/lily-frog-friends-2d-v1.js", "../playhouse/lily-halloween-costumes-v1.js", "../playhouse/lily-fish-2d-v6.js", "../playhouse/lily-fish-moves-v3.js", "/lily-home-sky-v1.js", "/lily-sky-v1.js"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("hophop") && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Game files: try the internet first (so updates show up), fall back to the saved copy when offline.
// Fonts: use the saved copy if there is one.
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isFont) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
