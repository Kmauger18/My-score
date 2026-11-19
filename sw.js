// Service worker : l’appli s’ouvre même sans réseau.
const CACHE = "my-score-v3.1.0";
const COQUILLE = [
  "./", "index.html", "css/style.css",
  "js/app.js", "js/store.js", "js/phrases.js", "js/firebase-config.js",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const memeOrigine = url.origin === location.origin;
  const polices = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  const sdk = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!memeOrigine && !polices && !sdk) return; // Firebase temps réel : jamais en cache

  // Réseau d’abord (pour avoir les mises à jour), cache en secours
  e.respondWith(
    fetch(req)
      .then((rep) => {
        if (rep.ok || rep.type === "opaque") {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
        }
        return rep;
      })
      .catch(() => caches.match(req, { ignoreSearch: memeOrigine }).then((r) => r || caches.match("index.html")))
  );
});
