/* ================================================================
   SW.JS -- Service Worker
   Cached die App-Shell (HTML/CSS/JS/Icons), damit SpediPro 95 auch
   offline bzw. bei schlechter Verbindung startet.

   Wichtig: CACHE_VERSION bei jeder inhaltlichen Änderung hochzählen
   (z.B. "v2", "v3", ...) -- sonst liefern Handys weiter die alte,
   zwischengespeicherte Version aus.
   ================================================================ */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `spedipro-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/theme.css',
  './css/dashboard.css',
  './js/icons.js',
  './js/nav-data.js',
  './js/dashboard.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

// ── Installation: App-Shell in den Cache legen ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Aktivierung: alte Cache-Versionen aufräumen ─────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('spedipro-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-first für die App-Shell, sonst Netzwerk ────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Nur eigene, erfolgreiche Antworten nachträglich cachen
          // (keine Fremd-CDNs wie Google Fonts, keine Fehlerseiten)
          if (
            response.ok &&
            response.type === 'basic'
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
