/* ================================================================
   REGISTER-SW.JS
   Registriert den Service Worker, falls der Browser das
   unterstützt. Auf JEDER Seite einbinden (nach den anderen
   Skripten), damit die App auch offline startet.
   ================================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service Worker konnte nicht registriert werden:', err);
    });
  });
}
