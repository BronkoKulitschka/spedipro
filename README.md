# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

## Aktueller Stand (v0.4.0)

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
      windowmanager.js   Fenster öffnen/schließen (Vollbild, Singleton pro App)
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
