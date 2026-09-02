/* Versionskennung.

   Bei jeder ausgelieferten Fassung wird VERSION erhöht und BUILD auf das
   Datum gesetzt. Beides steht im Startbildschirm, auf der Arbeitsfläche
   und in den Einstellungen, damit sich mit einem Blick prüfen lässt,
   welcher Stand gerade läuft. */

export const VERSION = '0.30.1';
export const BUILD   = '2026-09-02';
export const CODENAME = 'Fahrschule';

export const versionLine = () => `Version ${VERSION} · ${BUILD}`;
