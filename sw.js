/* Servicearbeiter.

   Zwei Aufgaben:

   1. Benachrichtigungen. Auf Android verlangt Chrome dafür zwingend
      einen Servicearbeiter — ein einfaches new Notification() wirft
      dort einen Fehler.

   2. Kartenkacheln behalten. Jede einmal geladene Kachel wird
      aufbewahrt. Beim nächsten Spielen ist die vertraute Umgebung
      auch ohne Netz da. Das ist kein vollständiger Ersatz für eine
      eigenständige Fassung, aber ein großer Schritt dorthin — und es
      macht die Karte spürbar flüssiger.

   Das Spiel selbst wird ebenfalls aufbewahrt, damit es ohne Netz
   startet. Dabei gilt: erst das Netz fragen, dann den Speicher —
   sonst bekämst du nach einem Update noch die alte Fassung. */

const SPIEL   = 'spedipro-spiel-v1';
const KACHELN = 'spedipro-kacheln-v1';

/* Wie viele Kacheln höchstens aufbewahrt werden. Eine Kachel ist
   etwa 15 KB, 1200 Stück sind also ungefähr 18 MB — genug für
   mehrere Regionen in den üblichen Zoomstufen. */
const KACHEL_GRENZE = 1200;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    /* Ältere Fassungen der Ablage aufräumen. */
    const namen = await caches.keys();
    await Promise.all(namen
      .filter(n => n.startsWith('spedipro-') && n !== SPIEL && n !== KACHELN)
      .map(n => caches.delete(n)));

    await self.clients.claim();
  })());
});

const istKachel = url =>
  /tile\.openstreetmap\.org/.test(url) || /\/\d+\/\d+\/\d+\.png$/.test(url);

const istEigenes = url =>
  url.startsWith(self.location.origin) && !/\/sw\.js$/.test(url);

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  /* Kartenkacheln: erst im Speicher nachsehen. Kacheln ändern sich
     nicht, ein erneutes Laden wäre verschwendet. */
  if (istKachel(request.url)) {
    event.respondWith(kachelHolen(request));
    return;
  }

  /* Eigene Dateien: erst das Netz, dann der Speicher. So bekommt man
     nach einem Update sofort die neue Fassung, aber ohne Netz noch
     die alte statt gar nichts. */
  if (istEigenes(request.url)) {
    event.respondWith(netzZuerst(request));
  }
});

async function kachelHolen(request) {
  const ablage = await caches.open(KACHELN);
  const bekannt = await ablage.match(request);
  if (bekannt) return bekannt;

  try {
    const antwort = await fetch(request);
    if (antwort.ok) {
      ablage.put(request, antwort.clone());
      aufraeumen(ablage);
    }
    return antwort;
  } catch {
    /* Ohne Netz und ohne gespeicherte Kachel bleibt die Fläche leer.
       Leaflet kommt damit zurecht. */
    return new Response('', { status: 504, statusText: 'keine Verbindung' });
  }
}

async function netzZuerst(request) {
  try {
    const antwort = await fetch(request);
    if (antwort.ok) {
      const ablage = await caches.open(SPIEL);
      ablage.put(request, antwort.clone());
    }
    return antwort;
  } catch {
    const bekannt = await caches.match(request);
    if (bekannt) return bekannt;
    throw new Error('nicht verfügbar');
  }
}

/* Die ältesten Kacheln entfernen, wenn es zu viele werden.
   Läuft nebenher und hält niemanden auf. */
let raeumtGerade = false;

async function aufraeumen(ablage) {
  if (raeumtGerade) return;
  raeumtGerade = true;

  try {
    const alle = await ablage.keys();
    const zuviel = alle.length - KACHEL_GRENZE;
    if (zuviel > 0) {
      for (const eintrag of alle.slice(0, zuviel)) await ablage.delete(eintrag);
    }
  } finally {
    raeumtGerade = false;
  }
}

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil((async () => {
    const fenster = await self.clients.matchAll({
      type: 'window', includeUncontrolled: true,
    });
    for (const f of fenster) {
      if ('focus' in f) return f.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  })());
});

/* Auf Wunsch den Kachelspeicher leeren — für die Einstellungen. */
self.addEventListener('message', event => {
  if (event.data?.art === 'kacheln-leeren') {
    caches.delete(KACHELN).then(() => {
      event.source?.postMessage({ art: 'kacheln-geleert' });
    });
  }

  if (event.data?.art === 'kacheln-zaehlen') {
    caches.open(KACHELN)
      .then(a => a.keys())
      .then(k => event.source?.postMessage({ art: 'kachel-zahl', zahl: k.length }));
  }
});
