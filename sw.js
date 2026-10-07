/* Guarda la app en el dispositivo para que funcione sin internet.
   Al publicar una versión nueva, cambia el número de VERSION. */
const VERSION = "italiano-v1.1";
const FILES = ["./", "./index.html", "./app.css", "./app.js", "./data.js", "./manifest.webmanifest",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(resp => {
    if (resp && resp.ok && new URL(e.request.url).origin === location.origin) { const copy = resp.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return resp;
  }).catch(() => caches.match("./index.html"))));
});
