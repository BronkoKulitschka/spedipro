/* ================================================================
   NAV-DATA.JS
   Liste der Navigationskacheln auf dem Dashboard. "href" zeigt auf
   die jeweilige Unterseite -- die Datei muss noch nicht existieren,
   wird aber schon verlinkt, damit man sie einfach nachreichen kann.
   ================================================================ */

const NAV = [
  { key:'fuhrpark',         label:'FUHRPARK',        href:'fuhrpark.html' },
  { key:'auftraege',        label:'AUFTRÄGE',        href:'auftraege.html' },
  { key:'touren',           label:'TOURENPLANUNG',   href:'tourenplanung.html' },
  { key:'personal',         label:'PERSONAL',        href:'personal.html' },
  { key:'werkstatt',        label:'WERKSTATT',       href:'werkstatt.html' },
  { key:'kassenbuch',       label:'KASSENBUCH',      href:'kassenbuch.html' },
  { key:'kunden',           label:'KUNDEN',          href:'kunden.html' },
  { key:'statistik',        label:'STATISTIK',       href:'statistik.html' },
  { key:'nachrichten',      label:'NACHRICHTEN',     href:'nachrichten.html', badge:5 },
  { key:'niederlassungen',  label:'NIEDERLASSUNGEN', href:'niederlassungen.html' },
  { key:'kartenuebersicht', label:'KARTENÜBERSICHT', href:'kartenuebersicht.html' },
  { key:'einstellungen',    label:'EINSTELLUNGEN',   href:'einstellungen.html' },
];
