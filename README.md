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

## Spielstand und Abwesenheit

Der Betrieb wird alle zwanzig Sekunden und beim Verlassen der Seite in
`localStorage` gesichert, zusammen mit einem Zeitstempel.

Ein Browser kann im Hintergrund nicht dauerhaft weiterrechnen — inaktive Tabs
werden eingefroren, Timer gedrosselt. Deshalb läuft nichts weiter, sondern wird
beim nächsten Öffnen **nachgerechnet**: aus der vergangenen Realzeit ergibt sich
über das eingestellte Verhältnis die fehlende Spielzeit, die in Schritten von
fünfzehn Minuten nachsimuliert wird. Danach zeigt ein Bericht, was passiert ist.

Grenzen:

* Höchstens fünf Spieltage werden aufgeholt, damit eine lange Pause nicht in
  einer Endlosschleife endet.
* War die Uhr beim Verlassen angehalten, ruht auch der Betrieb.
* Nur LKW auf **Automatik** fahren in der Abwesenheit weiter. Alles andere
  steht nach der laufenden Fahrt am Zielort.

Für die spätere Android-App gilt dasselbe Muster. Ein echter Hintergrunddienst
über WorkManager wäre möglich, lohnt sich für ein ruhiges Spiel aber kaum —
Nachrechnen beim Öffnen ist genauer, sparsamer und einfacher.

## Testlauf

Ein Rauchtest spielt zehn Spieltage ohne Browser durch und prüft, dass
Zustand, Auftragsbörse, Verträge, Fahrten und Kassenbuch zusammenpassen:

```bash
node test/smoke.mjs
```

Er hat schon zwei echte Fehler gefunden: fehlende Felder im Spielstart und
eine Bilanz, die auseinanderlief, weil alte Buchungen aus der begrenzten
Liste fielen. Vor jeder Auslieferung einmal laufen lassen.

## Aufbau

```
index.html              Gerüst, lädt Leaflet, Stile und main.js
test/smoke.mjs          Rauchtest für die Simulation
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
    orders.js           Auftragsbörse mit drei Auftragsarten
    market.js           Marktlage und Ansehen
    contracts.js        Rahmenverträge
    partners.js         befreundete Speditionen
    events.js           kleine Ereignisse aus dem Alltag
    save.js             Sichern und Laden im Browser
    offline.js          Nachrechnen der Abwesenheit
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
    dealer.js           Fahrzeughandel
    contracts.js        Verträge, Marktlage, Ansehen
    industry.js         Branche
    settings.js         Einstellungen, Spielstand, Datenquellen
    report.js           Bericht über die Abwesenheit
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

* Ein LKW fährt von dort los, wo er gerade steht, und **bleibt am Ziel**.
  Es gibt keine Zwangsrückfahrt — wer geschickt disponiert, kettet Aufträge
  aneinander und spart Leerkilometer. Zurück ins Depot geht es nur auf
  Anweisung.
* Der Frachtpreis hängt am Betrieb, der Dieselverbrauch an der tatsächlich
  gefahrenen Strecke. Ein Fahrzeug in der Nähe verdient an derselben Fracht
  also mehr.
* **Automatik** je LKW: sucht sich selbst den Auftrag mit dem besten
  Verhältnis von Fracht zu Anfahrt. Nötig, damit in der Abwesenheit
  weitergefahren wird.
* Jeder LKW hat einen Fahrer mit Namen. Zustellungen bringen Erfahrung,
  längere Strecken mehr.
* Jede Stufe gibt einen Schulungspunkt für fünf Fertigkeiten: Spritsparen,
  Streckenkenntnis, Verhandlung, Fahrzeugpflege, Gelassenheit.
* Diesel kostet pro Kilometer, jeder LKW kostet Fixkosten pro Tag. Ein Minus
  auf dem Konto ist kein Spielende, nur eine Zahl.
* Aufträge führen zu echten Betrieben aus OpenStreetMap. Beim Annehmen wird die
  Route berechnet und geprüft, welche gemeldeten Baustellen darauf liegen.

## Auftragsvergabe: Spotmarkt, Verträge, Partner

Nachempfunden, wie Speditionen tatsächlich an Fracht kommen. Drei Arten
liegen gemischt in der Disposition, jede mit eigener Kennzeichnung.

**🏷️ Spotmarkt** — der freie Markt. Der Preis schwankt täglich zwischen 78 und
132 % des Grundwerts. Bei knappem Laderaum lohnt sich Warten, bei Überkapazität
fährt man knapp. Am Wochenende kommt deutlich weniger herein, sonntags fast
nichts.

**📜 Rahmenverträge** — ein Verlader schreibt eine Relation über zwei bis sechs
Wochen aus: feste Sendungszahl, fester Preis je Fahrt, Abschlussprämie. Der
Satz liegt rund 12 % unter dem Spotdurchschnitt, dafür ist er planbar. Ein
**Dieselfloater** hebt oder senkt ihn anteilig mit der Marktlage.

Wird ein Vertrag nicht erfüllt, passiert nichts Schlimmes: ab 60 % Erfüllung
gibt es die halbe Prämie, darunter keine. Eine Strafe gibt es nie.

**🤝 Partneraufträge** — befreundete Speditionen geben eigene Fracht an
Subunternehmer weiter. Sie zahlen 5 bis 30 % über dem Grundwert, je nachdem,
wie oft man schon für sie gefahren ist. Vier Stufen von „unbekannt" bis
„Haussubunternehmer".

**Ansehen** wächst mit jeder Zustellung und mit erfüllten Verträgen. Es sinkt
nie. Zwischen 0 und 100 hebt es alle Erlöse um 10 bis 20 % und verbessert die
Ausschreibungen.

### Die anderen Speditionen

Sie konkurrieren nicht. Sie nehmen keine Aufträge weg, unterbieten nicht und
setzen den Spieler unter keinen Zeitdruck. Ihre einzige Rolle ist die eines
zusätzlichen Auftraggebers, dessen Sätze mit der Beziehung steigen. Das
Programm **Branche** zeigt ihre Größe und den Stand der Zusammenarbeit.

## Kalender, Fahrverbote und Lenkzeiten

Der Betrieb beginnt am **Montag, 3. August 2026**. Aus der verstrichenen
Spielzeit wird ein echtes Datum berechnet, inklusive Wochentag und der
bundesweiten Feiertage — die beweglichen über die Osterformel von Gauß.

* **Sonn- und Feiertagsfahrverbot** von 0 bis 22 Uhr. Schwere Fahrzeuge
  bleiben stehen, wo sie sind. Der Kurier 3.5 ist als Fahrzeug unter
  7,5 Tonnen ausgenommen und fährt weiter.
* **Lenkzeiten**, vereinfacht nach den europäischen Regeln: 4,5 Stunden am
  Stück, dann 45 Minuten Pause. 9 Stunden am Tag, dann 11 Stunden Ruhezeit.
  Die Pause wird unterwegs eingelegt, der Zug steht dann auf der Strecke.
* Ein Fahrzeug, das lange genug steht, hat seine Ruhezeit ohnehin genommen —
  gerechnet wird über tatsächlichen Stillstand, nicht über Mitternacht.

Das Programm **Tagesansicht** zeigt Datum, Art des Tages, ein etwaiges
Fahrverbot und für jeden Fahrer einen Tagesbalken: gefüllt die verbrauchte
Lenkzeit, der rote Strich die aktuelle Uhrzeit.

Die Werte stehen in `config.js` unter `DRIVE` und lassen sich frei ändern.

## Fahrzeuge und Kasse

Vier Klassen stehen zur Wahl, jeweils neu oder gebraucht. Sie unterscheiden
sich in Anschaffung, Verbrauch, Reisegeschwindigkeit, Ladefähigkeit und
Pannenanfälligkeit — die Frage ist nicht, welcher der beste ist, sondern
welcher zu den gefahrenen Strecken passt.

| Klasse | Preis | Fracht | Diesel | Schnitt |
|---|---|---|---|---|
| Kurier 3.5 | 12.000 € | ×0,60 | sparsam | +8 km/h |
| Verteiler 12 | 20.000 € | ×1,00 | normal | ±0 |
| Fernverkehr 400 | 34.000 € | ×1,40 | hoch | +6 km/h |
| Schwerlast 620 | 52.000 € | ×1,90 | sehr hoch | −4 km/h |

Gebrauchte kosten rund 38 % weniger, kommen mit Laufleistung und gehen
deutlich häufiger in die Werkstatt. Der Wiederverkaufswert sinkt mit den
gefahrenen Kilometern.

Jede Geldbewegung läuft über `book()` in `state.js` und landet im Kassenbuch:
Bereich, Text, Betrag, Spieltag und Uhrzeit. Die Kasse zeigt daraus Einnahmen,
Ausgaben, Saldo und eine Aufschlüsselung nach Bereichen — Fracht, Diesel,
Fixkosten, Werkstatt, Schulung, Fahrzeugkauf, Fahrzeugverkauf, Sonstiges.

## Für später vorgemerkt

Die Wirtschaftsebene, angelehnt an klassische Aufbausimulationen:

* **Eigene Lager** an strategisch günstigen Orten bauen. Ein Lager wäre ein
  zweites Depot: Fahrzeuge starten dort, Leerfahrten verkürzen sich, und es
  entstehen laufende Kosten, die sich erst ab einer gewissen Auslastung tragen.
* **Warenarten** statt namenloser Fracht — Schüttgut, Paletten, Kühlware,
  Schwerlast. Jede Ware passt nur zu bestimmten Fahrzeugklassen und bringt
  eigene Preise mit.
* **Produktionsketten**: eigene Betriebe, die Rohstoffe annehmen und
  Fertigwaren ausgeben. Der eigene Fuhrpark beliefert sich selbst, und der
  Gewinn entsteht aus der Kette statt aus der einzelnen Fahrt.
* **Werkstatt und Zustand** je Fahrzeug, Reifen, Inspektionsintervalle.

Reihenfolge und Umfang sind offen — vermerkt, nicht beschlossen.

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
* Fensterpositionen merken
* Portierung nach Android mit MapLibre oder osmdroid; `data/` und `sim/` lassen
  sich fast unverändert nach Kotlin übertragen
