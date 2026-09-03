/* ================================================================
   VERSION.JS
   Einzige Stelle, an der die Versionsnummer steht. Bei jedem
   nennenswerten Update hier hochzählen (z.B. '0.2.0').

   Wird an zwei Stellen genutzt:
   1. update.sh liest diese Zeile direkt aus (Regex auf "VERSION = '...'")
      und verwendet sie als Commit-Nachricht -- Datei-Pfad und Format
      der Zeile deshalb NICHT verändern.
   2. js/version-display.js zeigt sie in der App an (Statusleiste).
   ================================================================ */

const VERSION = '0.1.0';
