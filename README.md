# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

## Aktueller Stand (v0.12.0)

**Titelleiste:** höher (Padding 3→7px), größere Schrift, und deutlich
größere Minimieren-/Schließen-Buttons (16×14 → 28×24px) für bessere
Fingerbedienung. Fensterinhalt-Höhe entsprechend nachgezogen.

**Bild sitzt jetzt direkt unter dem Kopfzeilen-Text:** Der Bildrahmen
füllt nicht mehr den Restplatz (was das Bild mittig zentrierte und den
Balken nach unten drückte), sondern schmiegt sich eng ans Bild. Balken
und Navigation folgen direkt darunter, ungenutzter Platz landet unten,
Debug-Leiste bleibt am Fensterende.
- Verfügbare Höhe wird aus dem Fensterinhalt minus Geschwisterelemente
  berechnet (der Rahmen hat keine eigene Höhe mehr)
- `ResizeObserver` beobachtet jetzt den Container statt den Rahmen -
  sonst hätte die Größenänderung des Bildes sich endlos selbst neu
  ausgelöst

## Vorheriger Stand (v0.11.0)

**Layout umgestellt.** Reihenfolge von oben nach unten:
1. Kopfzeile (Fahrzeugname, Kennzeichen, Daten)
2. Bild - direkt darunter, nutzt die volle Breite
3. Gesamtzustand-Balken
4. Blätter-Pfeile - jetzt unten, links/rechts vom Zähler (1 / 4)
5. Debug-Leiste

Pfeile sind für die waagerechte Leiste umproportioniert (56×32 statt
36×48). Der Zähler hat eine feste Mindestbreite, damit die Pfeile beim
Blättern nicht seitlich verspringen. Wischen auf dem Bild blättert
weiterhin.

## Vorheriger Stand (v0.10.0)

**Bugfix (Bild wurde gar nicht angezeigt):** In einer Flexbox-Zeile
steuert `flex: 1` nur die Breite, nicht die Höhe. Zusammen mit
`align-items: center` schrumpfte die Bild-Spalte auf ihre Inhaltshöhe,
der Rahmen bekam Höhe 0 und das Bild lag unsichtbar in einer
nulldimensionalen Box.
- `align-items: stretch` auf der Zeile + `align-self: stretch` auf der
  Bild-Spalte (Pfeil-Buttons bleiben per `align-self: center` mittig)
- Größenberechnung ist jetzt selbstheilend: `ResizeObserver` rechnet
  neu, sobald der Rahmen eine echte Größe bekommt, statt beim ersten
  Fehlversuch stillschweigend aufzugeben

## Vorheriger Stand (v0.9.0)

**Bugfix:** Bildbox kollabierte auf Größe 0, wenn das Bild nicht lud
(z.B. falscher Pfad/Cache) - riss dadurch Balken und Pager-Anzeige aus
ihrer Position. Box-Größe wird jetzt explizit per JS aus dem
verfügbaren Platz berechnet, unabhängig vom Ladezustand des Bildes.
Zusätzlich: sichtbarer schraffierter Platzhalter mit Fehlertext, falls
das Bild tatsächlich nicht gefunden wird (statt stillem Kollaps).

## Vorheriger Stand (v0.8.0)

**Layout-Fix:** Bildbox wurde in verschachteltem Flexbox-Layout nicht
korrekt begrenzt und konnte das Fenster zum Scrollen zwingen (was
wiederum mit der Wisch-Navigation kollidierte). Neuer Rahmen-Container
begrenzt die Bildbox jetzt strikt auf den verfügbaren Platz.

**Callouts überarbeitet:**
- Neue Bauteil-Zuordnung: Motor→Motorhaube, Bremse→Vorderachse
  Zugmaschine, Reifen→Hinterachse Auflieger, Karosserie→Fahrerkabine,
  Antrieb→Hinterachse Zugmaschine
- Labels sind jetzt unterstrichen
- Verbindungslinien: durchgezogen statt gestrichelt, kein Punkt-Marker
  mehr, Farbe stufenlos von Rot (0%) über Gelb bis Grün (100%) je nach
  Bauteilzustand
- Linien starten jetzt exakt am Ende des Unterstrichs (nach dem
  Rendern anhand der echten Textbox-Maße berechnet, nicht geschätzt)

## Vorheriger Stand (v0.7.0)

**Fuhrpark komplett neu als Blätter-Ansicht statt Liste:**
- Ein Fahrzeug pro Bildschirm, isometrische Pixelart-Grafik (dieselbe
  Grafik für alle Fahrzeuge) statt Statusbalken-Liste -
  `assets/sprites/lkw-generisch.png`
- Floating-Callouts mit Verbindungslinie zum jeweiligen Bauteil,
  farbcodiert nach Zustand (grün/gelb/rot)
- Fünf Verschleißteile statt drei: Reifen, Bremsen, Motor, **Antrieb**,
  **Karosserie** - inkl. eigener Gelände-/Straßen-/Jahreszeit-Faktoren
  (Winter wirkt sich z.B. durch Streusalz besonders auf die Karosserie aus)
- Gesamtzustand-Balken unter dem Bild, farbcodiert, aktualisiert sich live
- Durchblättern per Pfeil-Buttons oder Wisch-Geste (links/rechts),
  mit Rundum-Navigation
- Debug-Buttons (Tour simulieren / Teil reparieren) wirken auf das
  gerade angezeigte Fahrzeug

## Vorheriger Stand (v0.6.0)

**Pixelart-Design** für Fenster und Taskleiste:
- Feine Pixel-Schrift ("Pixelify Sans" von Google Fonts) als Standard-
  schrift überall statt der bisherigen Systemschrift
- Echtes Pixelart-Icon für Fuhrpark (`assets/icons/fuhrpark.svg`) statt
  Emoji-Platzhalter - handgezeichnetes Raster, `shape-rendering:
  crispEdges` + `image-rendering: pixelated` für scharfe Kanten in
  jeder Größe
- Eigenes Pixelart-Icon für den Start-Button (`assets/icons/start-flag.svg`)
- Feines Dither-Muster (4×4px Schachbrett) statt Flatfarbe für den
  Desktop-Hintergrund - authentisch für die 90er, als Displays mit
  wenigen Farben zusätzliche Farbtiefe simulierten

## Vorheriger Stand (v0.5.0)

- **Minimieren:** Fenster lassen sich über den `_`-Button in die
  Taskleiste legen (`display:none`, Fenster bleibt im Hintergrund
  "offen").
- **Wiederherstellen:** Klick auf den Taskleisten-Eintrag oder erneutes
  Öffnen über Icon/Startmenü holt das Fenster zurück in den Vordergrund.
- **Schließen (X):** entfernt Fenster UND Taskleisten-Eintrag komplett -
  danach ist das Programm wieder ganz neu startbar.

## Vorheriger Stand (v0.4.0)

Windows-98-Desktop mit Startmenü und erstem Programm (Fuhrpark).

**Fundament:**
- Taskbar mit Start-Button, Uhr
- Startmenü mit aufklappbarem "Programme »"-Untermenü (per Klick, kein
  Hover-Zwang - funktioniert auch auf Touch/Handy), befüllt sich zur
  Laufzeit aus `AppRegistry` - neue Programme melden sich dort selbst an
- Fenstermanager (`WindowManager.open(...)`): Fenster sind **Vollbild**,
  pro Programm nur **einmal gleichzeitig offen** (Singleton über `id`),
  Schließen nur über den **X-Button**

**Fuhrpark-Modul** (startbar über Desktop-Icon oder Start → Programme):
- Flottenübersicht mit 4 Testfahrzeugen, Verschleiß pro Teil
  (Reifen/Bremsen/Motor), Spritverbrauch
- Reine Verwaltung/Berechnung - kein Kauf/Verkauf (Fahrzeughandel),
  keine Wartung (Werkstatt), keine Tourzuweisung (Tourenplanung),
  das sind eigene, noch nicht existierende Module
- Debug-Buttons: "Tour simulieren" (zufällige Tourdaten, Platzhalter für
  Tourenplanung/Personal) und "Reparieren" (Platzhalter für Werkstatt)

## Struktur

```
spedipro/
  index.html
  css/
    win98.css        Wiederverwendbare Win98-Bausteine (Bevel, Buttons, Fenster)
    desktop.css       Desktop, Taskbar, Startmenü, Desktop-Icons
    apps/
      fuhrpark.css     Styling des Fuhrpark-Fensters
  js/
    core/
      clock.js          Taskbar-Uhr
      startmenu.js       Startmenü-Verhalten
      windowmanager.js   Fenster öffnen/minimieren/schließen (Vollbild, Singleton, Taskleiste)
      verschleiss.js     Verschleiß-/Verbrauchsberechnung (datenquellen-unabhängig)
    apps/
      fuhrpark/
        fuhrpark.js      Fuhrpark-Programm (Zustand, UI, Debug-Buttons)
    data/
      fahrzeugtypen.js   Katalog fiktiver, an reale 90er-LKW angelehnter Fahrzeugtypen
  assets/
    icons/
    sprites/
```

## Nächste Schritte

- gameState + Speichern/Laden (localStorage)
- Weiteres Programm: Personal-Modul (liefert Fahrverhalten-Faktor)
- Eigenes Pixelart-Icon für Fuhrpark (aktuell Emoji-Platzhalter)
