/* Versionskennung.

   Bei jeder ausgelieferten Fassung wird VERSION erhöht und BUILD auf das
   Datum gesetzt. Beides steht im Startbildschirm, auf der Arbeitsfläche
   und in den Einstellungen, damit sich mit einem Blick prüfen lässt,
   welcher Stand gerade läuft. */

export const VERSION = '0.25.0';
export const BUILD   = '2026-08-31';
export const CODENAME = 'Verhandlung';

export const versionLine = () => `Version ${VERSION} · ${BUILD}`;
