# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

## Aktueller Stand (v0.13.3)

**Neues Kernmodul `js/core/ausfall.js` - Pannen und Stillstand:**
- Kritische Grenze je Bauteil: Bremsen 15 %, Reifen 12 %, Antrieb 10 %,
  Motor 8 %, Karosserie 5 %. Unterschreitung -> Fahrzeug bleibt am
  aktuellen Standort liegen und kann keine Touren mehr fahren.
- Zwei Wege zurück: **vor Ort** (nur Reifen, mobiler Dienst - 450 DM,
  1 Tag) oder **Bergung** (alle übrigen Schäden - 1.800 DM, 3 Tage,
  +900 DM bei Ausfall im Ausland).
- Vorwarnung, bevor ein Teil die kritische Grenze erreicht.
- Kosten und Standzeit landen in der Fahrzeughistorie (Grundlage für
  die spätere Buchhaltung).
- Kostenbeträge sind plausible Größenordnungen, aber nicht recherchiert
  (Vermerk im Code).

**Fahrzeughistorie umgebaut:** In der Detailansicht steht nur noch der
neueste Eintrag als klickbare Zeile - vorher wuchs die Liste mit jedem
Ereignis und nahm dem Bild den Platz weg. Klick öffnet die vollständige
Chronik in einem eigenen Fenster (mit km-Stand je Eintrag, scrollbar,
eigener Taskleisten-Eintrag).

## Vorheriger Stand (v0.13.2)

**Neue Kernmodule:**
- `js/core/spielzeit.js` - Spielkalender, startet 01.03.1994. Wird
  später auch von Tourenplanung, Personal und Buchhaltung genutzt.
- `js/core/fristen.js` - Termin- und Fristenüberwachung: HU (jährlich),
  SP (halbjährlich, §29 StVZO für Nutzfahrzeuge > 7,5 t), Wartung
  (alle 60.000 km, laufleistungsabhängig).
  ACHTUNG: Intervalle entsprechen heutiger Regelung, für die 90er noch
  gegenzuprüfen (Vermerk im Code).
- `js/core/historie.js` - Ereignis-Chronik pro Fahrzeug (Zugang, Tour,
  Reparatur, Wartung, Prüfung, Schaden), max. 200 Einträge.
- `js/core/auslastung.js` - Auslastung aus Tour-Einträgen, Zeitraum
  90 Tage. 100 % = 5 von 7 Tagen (Wochenende, Sonntagsfahrverbot,
  Werkstattzeiten). Überlastung erst ab 105 %. Fahrzeuge unter 14 Tagen
  im Bestand werden nicht bewertet.

**Fuhrpark-Oberfläche:**
- Übersicht: Spieldatum, Flottenauslastung, Zähler für kritische
  Fahrzeuge / Fristen / Unterauslastung; Marken an auffälligen Einträgen
- Detail: Fristen-Block mit Ampel, Auslastungs-Block, Fahrzeughistorie
- Debug: Zeit vorspulen (Woche/Monat), Fristen abhaken. Touren lassen
  jetzt Spielzeit vergehen (Dauer aus Distanz, ~600-700 km/Tag nach
  damaligen Lenkzeiten)

## Vorheriger Stand (v0.13.1)

**Neue Übersichtsseite im Fuhrpark:**
- Startbildschirm listet alle Fahrzeuge mit Marke/Modell, Kennzeichen,
  Kurzinfos und Gesamtzustand-Balken
- Kopfzeile zeigt Fahrzeuganzahl und ggf. Anzahl kritischer Fahrzeuge
- Auswahl eines Eintrags öffnet die Detailansicht

**Detailansicht:** Navigationspfeile entfernt, stattdessen
"❮ Übersicht"-Button. Wischen zum Blättern funktioniert weiterhin.

**Lackierungssystem** (`js/core/lackierung.js`):
- Färbt die Zugmaschine zur Laufzeit per Canvas um - keine zusätzlichen
  Bilddateien nötig, Schattierungen bleiben exakt erhalten
- Sechs Farben (rot, orange, gelb, grün, blau, violett), beliebig
  erweiterbar; Ergebnis wird zwischengespeichert
- `lackierung` als Fahrzeugeigenschaft, sichtbar in der Infoliste
- Rückfall aufs Originalbild, solange das Sprite lädt oder bei
  unbekannter Farbe

## Vorheriger Stand (v0.13.0)

**Kopfzeile:** nur noch Marke/Modell und Kennzeichen, beides größer
(16px) und fett. "Gesamt: X%"-Badge entfernt (Zustand steht weiterhin
im Balken unter dem Bild).

**Neue Infoliste unter der Navigation:** Baujahr, Aufbau, Laufleistung,
Standort, Status, Verbrauch gesamt - zweispaltig (Bezeichnung links,
Wert rechts fett) in einem abgesetzten Kasten.

**Callouts näher ans Fahrzeug gerückt**, Verbindungslinien dadurch
kürzer.

Reihenfolge: Kopfzeile → Bild → Zustandsbalken → Navigation →
Infoliste → Debug-Leiste.

## Vorheriger Stand (v0.12.0)

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
- Echtes Pixelart-Icon für Fuhrpark (später ersetzt, siehe oben) statt
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

## Geplant (noch nicht umgesetzt)

**Designmodus** - Details als Kommentar in `js/core/lackierung.js`:
- Auflieger einfärben (dieselbe Technik wie bei der Kabine). Empfehlung:
  Auflieger im Sprite in einen eigenen Farbton legen statt "grau"
  zu erkennen, damit Kabine und Auflieger unabhängig ansprechbar sind
- Beschriftung auf dem Auflieger (Firmenname). Zu beachten: isometrische
  Schrägstellung des Textes, Pixelschrift ohne Weichzeichnung, Cache-
  Schlüssel dann aus Farbe UND Text

**Tourausfall und Vertragsstrafe** - Notiz in `js/core/ausfall.js`.
Bleibt ein Fahrzeug mitten in einer Tour liegen und wird nicht zeitnah
instand gesetzt, soll die Tour platzen und eine Strafe fällig werden.
Braucht die Tourenplanung: heute wird die Tour in einem Rutsch
abgerechnet, es gibt keinen Zwischenstand "steht bei km X mit Ladung",
und ohne Auftrag (Kunde, Liefertermin, Entgelt) gibt es keine Grundlage
für eine Strafe. Rechtlicher Rahmen für die Ausgestaltung: KVO
(national) und CMR (grenzüberschreitend) - vor Umsetzung prüfen.

**Weitere Fahrzeugkonfigurationen** - ausführliche Notiz in
`js/data/fahrzeugtypen.js`. Geplant sind Gliederzüge (Motorwagen mit und
ohne Anhänger), Wechselbrücken-Fahrzeuge (mit und ohne Anhänger),
Verteilerfahrzeuge 7,5-12 t (mit und ohne Anhänger) und Transporter bis
3,5 t. Das ist mehr als ein neuer Katalogeintrag: Anhänger/Auflieger
brauchen eine eigene Einheit mit eigener Laufleistung, eigenem
Verschleiß und eigenen Prüffristen; die Fristen werden gewichtsabhängig
(SP-Pflicht erst über 7,5 t bzw. 10 t bei Anhängern, Transporter gar
nicht); jede Konfiguration braucht ein eigenes Sprite mit eigenen
Callout-Ankern; Verschleiß und Auslastung müssen das Einsatzprofil
(Nah- vs. Fernverkehr) berücksichtigen. Transporter fallen besonders aus
dem Raster: keine Lenkzeitpflicht mit Fahrtenschreiber, Klasse 3 statt
Klasse 2, ganz andere Preis- und Verbrauchsgrößen - spielerisch als
Einstiegsfahrzeug für eine junge Spedition gedacht.

**Fahrzeughandel-Modul** - ersetzt die Debug-Kauf-Buttons in der
Fuhrpark-Übersicht ("Neufahrzeug", "Gebrauchtfahrzeug", "Leeren"). Die
Buttons erst entfernen, wenn das Modul steht. Die Herleitungslogik für
Gebrauchtfahrzeuge (Laufleistung passend zum Baujahr, Verschleiß
passend zur Laufleistung, ersetzte Verschleißteile) kann dabei
übernommen werden - sie steckt in `gebrauchtesFahrzeugKaufen()`.

**Werkstatt-Anbindung im Fuhrpark** - Notiz im Code an der Debug-Leiste
in `js/apps/fuhrpark/fuhrpark.js`:
- Der Debug-Button "Reparieren" wird später durch einen "Werkstatt"-
  Button ersetzt, der das Werkstatt-Modul mit dem Fahrzeug im Kontext
  öffnet
- Ohne eigene Werkstatt: Termin bei Fremdwerkstatt (Wartezeit,
  Fremdpreise). Mit eigener Werkstatt: interne Ausführung (günstiger,
  aber kapazitätsbegrenzt)
- Werkstatt-Besitz gehört in den globalen gameState, nicht in den Fuhrpark
- Debug-Button erst entfernen, wenn das Werkstatt-Modul steht

## Nächste Schritte

- gameState + Speichern/Laden (localStorage)
- Weiteres Programm: Personal-Modul (liefert Fahrverhalten-Faktor)
- Eigenes Pixelart-Icon für Fuhrpark (aktuell Emoji-Platzhalter)
