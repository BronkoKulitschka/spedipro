# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

## Aktueller Stand (v0.1.0)

Leerer Windows-98-Desktop als Fundament:
- Taskbar mit Start-Button, Uhr
- Startmenü (Platzhalter-Einträge)
- Fenstermanager (`WindowManager.open(...)`) zum Öffnen/Verschieben/
  Schließen von Programmfenstern - noch ohne echtes Programm

## Struktur

```
spedipro/
  index.html
  css/
    win98.css       Wiederverwendbare Win98-Bausteine (Bevel, Buttons, Fenster)
    desktop.css      Desktop, Taskbar, Startmenü
  js/
    core/            Fenstermanager, Uhr, Startmenü, (später: gameState)
    apps/             Einzelne Programme (Fuhrpark, Tourenplanung, Personal, Buchhaltung)
    data/             Reale Referenzdaten als JSON (Fahrzeuge, Städte, Wirtschaft)
  assets/
    icons/
    sprites/
```

## Nächste Schritte

- gameState + Speichern/Laden (localStorage)
- Erstes Programm: Fuhrpark-Verwaltung
- Desktop-Icons zum Öffnen der Programme
