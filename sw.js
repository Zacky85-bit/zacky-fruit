const CACHE = "zacky-fruit-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin === location.origin) {
    /* Fichiers du jeu : internet d'abord (pour les mises à jour), sinon la copie gardée */
    e.respondWith(
      fetch(e.request).then(function (r) {
        if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
        return r;
      }).catch(function () {
        return caches.match(e.request).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    /* Polices : copie gardée d'abord, pour économiser les données */
    e.respondWith(caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (r) {
        var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return r;
      });
    }));
  }
});
