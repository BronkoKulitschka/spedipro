# SpeditionsPro 95

Eine ruhige Speditionssimulation als Windows-95-Desktop. Jeder Arbeitsbereich
ist ein eigenes Programm in einem eigenen Fenster: Routenplanung, Disposition,
Fuhrpark, Kasse, Betriebsbuch, Einstellungen.

Kein Zeitlimit, keine Konkurrenz, kein Verlieren. Der Betrieb läuft, Fahrer
lernen dazu, gefahren wird auf einer echten Karte.

Web-Prototyp für eine spätere Android-App. Inspiriert von *Trans World*
(Starbyte, 1990) für den C64.

## Version

Die aktuelle Fassung steht in `src/version.js` und wird an vier Stellen
angezeigt: im Startbildschirm, im Ladeprotokoll, unten rechts auf der
Arbeitsfläche und im Programm **Einstellungen** unter „Programmstand".

Stimmt die angezeigte Nummer nicht mit der erwarteten überein, hat der
Browser noch den alten Stand zwischengespeichert. Dann die Seite mit
gedrückter Umschalttaste neu laden.

Beim Ausliefern einer neuen Fassung:

```bash
./bump-version.sh 0.5.1
```

Das setzt Nummer und Datum in `src/version.js` und zieht die `?v=`-Angaben
in `index.html` nach, damit der Browser die Dateien wirklich neu holt.

## Starten

Das Projekt nutzt ES-Module. Ein Doppelklick auf `index.html` reicht deshalb
nicht — der Browser blockiert Module über `file://`. Ein lokaler Server genügt:

```bash
python3 -m http.server 8000
# danach http://localhost:8000 öffnen
```

Auf GitHub Pages läuft es ohne weitere Einrichtung.

## Bedienung

* **Symbole auf dem Desktop** oder das **Startmenü** öffnen die Programme.
* Fenster lassen sich verschieben, in der Größe ändern, minimieren und
  bildfüllend schalten. Die Taskleiste zeigt alles Offene.
* **Leertaste** hält die Betriebsuhr an und lässt sie weiterlaufen.
* Unter 820 Pixeln Breite öffnen Fenster bildfüllend und werden über die
  Taskleiste gewechselt — so bleibt es auf dem Telefon bedienbar.

## Zeit

Die Uhr läuft in Realzeit. Wie viel Spielzeit dabei vergeht, steht in
`config.js` unter `TIME.DEFAULT_RATIO` und lässt sich im Programm
**Einstellungen** jederzeit ändern.

Voreinstellung ist **1 : 3** — eine echte Minute sind drei Spielminuten. Ein
Spieltag dauert damit bei 1× rund acht Stunden echter Zeit. Die Stufen 2× und
4× multiplizieren das, ohne die Häufigkeit von Ereignissen zu verändern: die
hängt an der Spielzeit, nicht am Takt.

## Aufbau

```
index.html              Gerüst, lädt Leaflet, Stile und main.js
styles/
  win95.css             Fenster, Rahmen, Schaltflächen, Balken
  app.css               Karte, Meldungen, Farben, Hilfsklassen
  desktop.css           Arbeitsfläche, Fensterrahmen, Startmenü, Taskleiste
src/
  config.js             alle Stellschrauben: Depots, Regeln, Zeit, Fertigkeiten
  util.js               Formatierung, Zufall, Entfernungsrechnung
  state.js              Spielzustand, Fahrer, LKWs, Wirkung der Fertigkeiten
  main.js               Ablauf: Start, Laden, Desktop
  data/
    autobahn.js         Baustellen und Meldungen der Autobahn GmbH
    overpass.js         echte Betriebe aus OpenStreetMap
    osrm.js             Straßenführung, mit Luftlinie als Rückfallebene
  sim/
    clock.js            Betriebsuhr, Zeitverhältnis, Tagesabrechnung
    fleet.js            fahren, disponieren, kaufen, verkaufen
    drivers.js          Erfahrung und Schulung
    orders.js           Auftragsbörse
    events.js           kleine Ereignisse aus dem Alltag
  ui/
    wm.js               Fensterverwaltung, Taskleiste, Startmenü
    screens.js          Start-, Lade- und Desktopgerüst
    map.js              Leaflet: Kacheln, Betriebe, Meldungen, rollende LKWs
    toast.js            Meldungen unten rechts
  apps/
    index.js            Verzeichnis aller Programme
    map.js              Routenplanung
    dispo.js            Disposition
    fleet.js            Fuhrpark
    training.js         Schulung, ein Fenster je Fahrer
    finance.js          Kasse
    logbook.js          Betriebsbuch
    settings.js         Einstellungen und Datenquellen
```

### Ein Programm hinzufügen

Eine Datei in `src/apps/` anlegen und in `index.js` eintragen. Mehr braucht es
nicht — Fenster, Symbol, Startmenüeintrag und Taskleiste entstehen daraus
von selbst.

```js
export const MeinApp = {
  id: 'meins', icon: '📌', title: () => 'Mein Programm',
  width: 360, height: 300, desktop: true,
  body: () => '<div class="pad">Inhalt</div>',
  mount(el) {},     // einmal beim Öffnen
  update(el) {},    // bei jedem Takt, nur wenn sichtbar
};
```

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

* Speicherstand im Browser, damit ein Betrieb über Tage weiterläuft
* Aufträge zwischen zwei Betrieben statt immer ab Depot
* Fensterpositionen merken
* Portierung nach Android mit MapLibre oder osmdroid; `data/` und `sim/` lassen
  sich fast unverändert nach Kotlin übertragen
