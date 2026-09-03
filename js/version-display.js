/* ================================================================
   VERSION-DISPLAY.JS
   Schreibt die Versionsnummer aus src/version.js in jedes Element
   mit id="versionTag". Auf jeder Seite einbindbar, die eine
   Statusleiste mit Versionsanzeige hat.

   Reihenfolge im HTML wichtig: src/version.js MUSS vor dieser
   Datei eingebunden sein.
   ================================================================ */

(function(){
  const el = document.getElementById('versionTag');
  if(!el) return;
  el.textContent = typeof VERSION !== 'undefined' ? `v${VERSION}` : '';
})();
