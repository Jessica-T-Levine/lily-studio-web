// Lily's Hop Hop moved to /hophop/. This retires the old offline copy that lived at /hop/:
// it clears the old saved game (only the old "hophop-v" copies), lets everything load from the internet,
// and removes itself, so nobody is ever stuck on an old saved version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => /^hophop-v\d+$/.test(k)).map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(list => list.forEach(c => { try { c.navigate("/hophop/"); } catch (_) {} }))
  );
});
self.addEventListener("fetch", () => {});   // nothing saved: everything comes straight from the internet
