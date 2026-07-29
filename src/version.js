/* Versionskennung.

   Bei jeder ausgelieferten Fassung wird VERSION erhöht und BUILD auf das
   Datum gesetzt. Beides steht im Startbildschirm, auf der Arbeitsfläche
   und in den Einstellungen, damit sich mit einem Blick prüfen lässt,
   welcher Stand gerade läuft. */

export const VERSION = '0.5.0';
export const BUILD   = '2026-07-29';
export const CODENAME = 'Auftragsbörse';

export const versionLine = () => `Version ${VERSION} · ${BUILD}`;
