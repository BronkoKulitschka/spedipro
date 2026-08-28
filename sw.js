/* Servicearbeiter.

   Auf Android verlangt Chrome für Benachrichtigungen zwingend einen
   Servicearbeiter — ein einfaches new Notification() wirft dort einen
   Fehler ("Illegal constructor"). Diese Datei existiert allein zu
   diesem Zweck: Sie fängt nichts ab und speichert nichts zwischen,
   sie muss nur vorhanden und angemeldet sein.

   Ein Klick auf eine Meldung holt das Spielfenster nach vorn. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

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
