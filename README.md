# SpeditionsPro 95

Eine ruhige Speditionssimulation in einer Windows-95-Oberfläche. Kein Zeitlimit,
keine Konkurrenz, kein Verlieren — der Betrieb läuft, Fahrer lernen dazu, und
gefahren wird auf einer echten Karte.

Web-Prototyp für eine spätere Android-App. Inspiriert von *Trans World*
(Starbyte, 1990) für den C64.

## Starten

Das Projekt nutzt ES-Module. Ein Doppelklick auf `index.html` reicht deshalb
nicht — der Browser blockiert Module über `file://`. Ein beliebiger lokaler
Server genügt:

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

Auf GitHub Pages läuft es ohne weitere Einrichtung.

## Aufbau

```
index.html              Gerüst, lädt Leaflet, Stile und main.js
styles/
  win95.css             Fenster, Rahmen, Schaltflächen, Balken
  app.css               Layout, Karte, Meldungen, Farben
src/
  config.js             alle Stellschrauben: Depots, Regeln, Fertigkeiten, Ereignisse
  util.js               Formatierung, Zufall, Entfernungsrechnung
  state.js              Spielzustand, Fahrer, LKWs, Wirkung der Fertigkeiten
  main.js               Ablauf, Ladevorgang, Verdrahtung der Handler
  data/
    autobahn.js         Baustellen und Meldungen der Autobahn GmbH
    overpass.js         echte Betriebe aus OpenStreetMap
    osrm.js             Straßenführung, mit Luftlinie als Rückfallebene
  sim/
    clock.js            Betriebsuhr, Tagesabrechnung, Pannen
    fleet.js            fahren, disponieren, kaufen, verkaufen
    drivers.js          Erfahrung und Schulung
    orders.js           Auftragsbörse
    events.js           kleine Ereignisse aus dem Alltag
  ui/
    screens.js          Vorlagen für Start-, Lade- und Spielbildschirm
    paint.js            aktualisiert das laufende Fenster
    fleet.js            Fuhrparkliste mit Balken und Fertigkeiten
    map.js              Leaflet: Kacheln, Betriebe, Meldungen, rollende LKWs
    modals.js           Schulungs- und Datenquellenfenster
    toast.js            Meldungen unten rechts
```

Die HTML-Vorlagen sprechen Handler über `App.…` an. `main.js` legt dieses Objekt
an; damit bleiben die Vorlagen frei von Importen.

## Spielprinzip

* Jeder LKW hat einen Fahrer mit Namen. Zustellungen bringen Erfahrung,
  längere Strecken mehr.
* Jede Stufe gibt einen Schulungspunkt für fünf Fertigkeiten: Spritsparen,
  Streckenkenntnis, Verhandlung, Fahrzeugpflege, Gelassenheit.
* Diesel kostet pro Kilometer, jeder LKW kostet Fixkosten pro Tag. Ein Minus
  auf dem Konto ist kein Spielende, nur eine Zahl.
* Aufträge führen zu echten Betrieben aus OpenStreetMap. Beim Annehmen wird die
  Route berechnet und geprüft, welche gemeldeten Baustellen darauf liegen.

## Datenquellen

| Was | Woher | Hinweis |
|---|---|---|
| Karte und Betriebe | OpenStreetMap, Overpass-API | © OpenStreetMap-Mitwirkende, ODbL |
| Straßenführung | OSRM-Demoserver | nur für kleine Nutzung |
| Baustellen, Meldungen | Autobahn GmbH des Bundes | offene Daten, kein Schlüssel nötig |

Die Namensnennung von OpenStreetMap ist Pflicht und steht in der Karte. Die
Demoserver von OSM und OSRM sind nicht für dauerhaften Betrieb gedacht — für
eine veröffentlichte App gehören eigene Kacheln und ein eigener Router dazu.

Die Autobahn-API liefert Baustellen und Meldungen, aber keinen Verkehrsfluss in
Echtzeit. Wer echte Staudaten möchte, braucht einen Dienst wie TomTom oder HERE
mit Schlüssel.

## Nächste Schritte

* Aufträge zwischen zwei Betrieben statt immer ab Depot
* Mehrere Depots, LKW-Typen, Ladungsarten
* Speicherstand im Browser
* Portierung nach Android mit MapLibre oder osmdroid; die Module unter `data/`
  und `sim/` lassen sich fast unverändert nach Kotlin übertragen
