/**
 * Service Worker für SpediPro 95.
 *
 * Zwei Strategien, bewusst getrennt:
 *
 *  • Navigation (die Seite selbst): erst Netz, dann Cache.
 *    Dadurch bekommt man neue Fassungen sofort und nicht erst, wenn der
 *    Browser-Cache abläuft — genau das Problem mit der weißen Seite.
 *
 *  • Alles andere: erst Cache, im Hintergrund nachladen.
 *    Assets tragen einen Hash im Namen, sind also unveränderlich.
 *    Die Spieldaten sind groß und ändern sich selten.
 *
 * Die Version steckt in der Registrierungs-URL (?v=…). Ändert sie sich,
 * gilt der Worker als neu, und alte Caches werden aufgeräumt.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") ?? "dev";
const CACHE = `spedipro-${VERSION}`;

/** Was sofort verfügbar sein muss, damit die App offline startet. */
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Einzeln, damit ein fehlendes Element nicht die ganze Installation kippt.
      await Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      // Nicht automatisch übernehmen — die App fragt vorher nach.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("spedipro-") && n !== CACHE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "uebernehmen") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: erst Netz, damit neue Fassungen sofort ankommen.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch {
          const cached =
            (await caches.match(req)) ?? (await caches.match("./index.html"));
          return (
            cached ??
            new Response("Offline und keine gespeicherte Fassung vorhanden.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Alles andere: aus dem Cache antworten, im Hintergrund auffrischen.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => undefined);

      const res = cached ?? (await network);
      return (
        res ??
        new Response("Nicht verfügbar.", {
          status: 504,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    })(),
  );
});
