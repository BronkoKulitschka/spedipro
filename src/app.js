
import { VERSION } from './version.js';

const screens = {
  fuhrpark:'FUHRPARK',
  auftraege:'AUFTRÄGE',
  touren:'TOURENPLANUNG',
  personal:'PERSONAL',
  werkstatt:'WERKSTATT',
  kassenbuch:'KASSENBUCH',
  kunden:'KUNDEN',
  statistik:'STATISTIK',
  nachrichten:'NACHRICHTEN',
  niederlassungen:'NIEDERLASSUNGEN',
  karte:'KARTENÜBERSICHT',
  einstellungen:'EINSTELLUNGEN'
};

let current='home';

function mainMenu(){
  return `<div class="master-shell" aria-label="Spedipro 95 Hauptmenü">
    <button class="hotspot help" data-action="help" aria-label="Hilfe"></button>
    <button class="hotspot close" data-action="close" aria-label="Schließen"></button>
    <button class="hotspot cta" data-screen="touren" aria-label="Tourenplanung starten"></button>

    <button class="hotspot tile c1 r1" data-screen="fuhrpark" aria-label="Fuhrpark"></button>
    <button class="hotspot tile c2 r1" data-screen="auftraege" aria-label="Aufträge"></button>
    <button class="hotspot tile c3 r1" data-screen="touren" aria-label="Tourenplanung"></button>

    <button class="hotspot tile c1 r2" data-screen="personal" aria-label="Personal"></button>
    <button class="hotspot tile c2 r2" data-screen="werkstatt" aria-label="Werkstatt"></button>
    <button class="hotspot tile c3 r2" data-screen="kassenbuch" aria-label="Kassenbuch"></button>

    <button class="hotspot tile c1 r3" data-screen="kunden" aria-label="Kunden"></button>
    <button class="hotspot tile c2 r3" data-screen="statistik" aria-label="Statistik"></button>
    <button class="hotspot tile c3 r3" data-screen="nachrichten" aria-label="Nachrichten"></button>

    <button class="hotspot tile c1 r4" data-screen="niederlassungen" aria-label="Niederlassungen"></button>
    <button class="hotspot tile c2 r4" data-screen="karte" aria-label="Kartenübersicht"></button>
    <button class="hotspot tile c3 r4" data-screen="einstellungen" aria-label="Einstellungen"></button>
  </div>`;
}

function subScreen(id){
  const title=screens[id];
  return `<section class="subscreen">
    <header class="sub-title"><button class="back" data-home>←</button><span>SPEDIPRO 95 · ${title}</span></header>
    <div class="sub-content">
      <div class="panel">
        <h2>${title}</h2>
        <p>Der Hauptmenü-Button funktioniert. Die Fachlogik dieses Bereichs wird im nächsten dafür vorgesehenen kleinen Entwicklungsschritt umgesetzt.</p>
      </div>
      <div class="version">Version ${VERSION}</div>
    </div>
  </section>`;
}

function render(){
  document.querySelector('#app').innerHTML=current==='home'?mainMenu():subScreen(current);
  document.querySelectorAll('[data-screen]').forEach(el=>el.addEventListener('click',()=>{
    current=el.dataset.screen; render(); window.scrollTo(0,0);
  }));
  document.querySelector('[data-home]')?.addEventListener('click',()=>{current='home';render();window.scrollTo(0,0)});
  document.querySelector('[data-action="help"]')?.addEventListener('click',()=>alert(`Spedipro 95\nVersion ${VERSION}`));
  document.querySelector('[data-action="close"]')?.addEventListener('click',()=>alert('Spedipro 95 läuft als Web-App und bleibt geöffnet.'));
}
render();
