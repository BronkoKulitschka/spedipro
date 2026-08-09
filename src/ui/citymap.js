/* Kartenauswahl im Startbildschirm.

   Eine Übersicht Deutschlands mit allen wählbaren Städten. Die Größe
   des Punktes richtet sich nach der Einwohnerzahl, damit man sich
   zurechtfindet. Ausgewählt wird durch Antippen. */

import { CITIES } from '../data/cities.js';
import { esc } from '../util.js';

let karte = null;
let marken = new Map();
let beiWahl = null;
let beiPunkt = null;
let freieMarke = null;

export function zeigeStaedteKarte(behaelter, gewaehlt, onWahl, onPunkt) {
  beiWahl = onWahl;
  beiPunkt = onPunkt;

  /* Bei jedem Aufruf neu aufsetzen — der Startbildschirm wird
     vollständig neu gezeichnet, der alte Knoten ist dann fort. */
  if (karte) { karte.remove(); karte = null; }
  marken = new Map();

  karte = L.map(behaelter, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
  }).setView([51.2, 10.2], 5);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12, minZoom: 5,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(karte);

  for (const stadt of CITIES) {
    const gross = stadt.einwohner >= 500;
    const mittel = stadt.einwohner >= 200;

    const marke = L.marker([stadt.lat, stadt.lon], {
      icon: L.divIcon({
        className: '',
        html: `<div class="stadt-punkt ${gross ? 'gross' : mittel ? 'mittel' : 'klein'}"
                    data-stadt="${stadt.key}">
                 <span class="stadt-kreis"></span>
                 <span class="stadt-name">${esc(stadt.name)}</span>
               </div>`,
        iconSize: [10, 10], iconAnchor: [5, 5],
      }),
      title: `${stadt.name} — ${stadt.text}`,
    }).addTo(karte);

    marke.on('click', () => waehle(stadt.key));
    marken.set(stadt.key, marke);
  }

  /* Freie Wahl: irgendwohin tippen, wo eine Ortschaft in der Nähe ist. */
  karte.on('click', e => {
    if (beiPunkt) beiPunkt(e.latlng.lat, e.latlng.lng);
  });

  if (gewaehlt) markiere(gewaehlt);
  setTimeout(() => karte && karte.invalidateSize(), 120);
}

/* Marke für einen frei gewählten Punkt setzen. */
export function setzeFreienPunkt(lat, lon, beschriftung, zustand = 'suche') {
  if (!karte) return;
  entferneFreienPunkt();

  freieMarke = L.marker([lat, lon], {
    icon: L.divIcon({
      className: '',
      html: `<div class="frei-punkt ${zustand}">
               <span class="frei-kreis"></span>
               <span class="frei-name">${esc(beschriftung)}</span>
             </div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    }),
    zIndexOffset: 1000,
  }).addTo(karte);

  /* Die Stadtauswahl aufheben, es gilt jetzt der freie Punkt. */
  for (const marke of marken.values()) {
    marke.getElement()?.querySelector('.stadt-punkt')?.classList.remove('gewaehlt');
  }
}

export function entferneFreienPunkt() {
  if (freieMarke && karte) karte.removeLayer(freieMarke);
  freieMarke = null;
}

export function zeigeAusschnitt(lat, lon, stufe = 9) {
  if (karte) karte.setView([lat, lon], stufe, { animate: true });
}

function waehle(key) {
  markiere(key);
  if (beiWahl) beiWahl(key);
}

/* Von außen aufrufbar, wenn über die Liste gewählt wurde. */
export function markiere(key) {
  entferneFreienPunkt();
  for (const [k, marke] of marken) {
    const el = marke.getElement()?.querySelector('.stadt-punkt');
    if (el) el.classList.toggle('gewaehlt', k === key);
  }

  const stadt = CITIES.find(c => c.key === key);
  if (stadt && karte) karte.setView([stadt.lat, stadt.lon], 7, { animate: true });
}

export function schliesseStaedteKarte() {
  if (karte) { karte.remove(); karte = null; }
  marken = new Map();
  freieMarke = null;
  beiWahl = null;
  beiPunkt = null;
}
