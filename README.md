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
* In der **Disposition** liegen Karte und Auftragsliste nebeneinander. Jedes
  Fahrzeug ist dort dauerhaft zu sehen, auch wenn es steht — grau, wenn es
  gerade Pause oder Ruhezeit hat. Ein Tippen auf einen Auftrag in der Liste
  rückt ihn in den Kartenausschnitt, „Deutschland" zeigt alles auf einmal.
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

## Hilfe und Einführung

Beim ersten Betrieb öffnet sich eine **Einführung**, die in acht Schritten durch
Disposition, Betriebsuhr, Kasse, Ladeliste und Betriebsentwicklung führt. Sie
prüft selbst, ob ein Schritt erledigt ist, und geht dann weiter. Überspringen
ist jederzeit möglich, ein Neustart über das Startmenü.

Die **Hilfe** ist der alten Windows-Hilfe nachempfunden: links das
Inhaltsverzeichnis nach Gruppen, rechts der Artikel, oben Zurück und Inhalt.
Sechzehn Themen, davon eines je Programm und fünf zu den Grundlagen.

Jedes Fenster hat ein **?** in der Titelleiste, das direkt die Hilfeseite zum
jeweiligen Programm öffnet. **F1** öffnet die Hilfe allgemein.

Die Texte stehen gesammelt in `src/help/topics.js` in einem einfachen Format aus
Überschriften, Absätzen, Listen, Tabellen, Hinweiskästen und Querverweisen — ein
neues Thema ist ein Eintrag mehr in dieser Datei.

## Aussehen

Der Hintergrund der Arbeitsfläche lässt sich in den Einstellungen wechseln:
neun Voreinstellungen von Türkis bis Karomuster, dazu ein eigenes Bild. Das
Bild wird vor dem Speichern auf 1600 Bildpunkte verkleinert und liegt unter
`spedipro.wallpaper` im Browserspeicher, getrennt vom Spielstand. Im Fuhrpark
bekommt jede Fahrzeugzeile denselben Hintergrund als eigene Fläche.

Damit derselbe Wert überall verwendbar ist, werden auch einfarbige
Voreinstellungen als Bildebene ausgedrückt — `linear-gradient(#6a9a9a, #6a9a9a)`
statt einer Farbe. Muster mit eigener Kachelgröße führen diese getrennt in
`size`, sonst wäre der Wert als `background-image` ungültig. `node
test/wallpaper.mjs` prüft das.

Fahrende Fahrzeuge auf der Karte tragen einen pulsierenden Ring, wippen leicht
und wandern in einer Sekunde zur nächsten Position, statt zu springen. Die
Blickrichtung ergibt sich aus dem zuletzt gefahrenen Stück. Wer
`prefers-reduced-motion` gesetzt hat, bekommt alles ohne Bewegung.

## Eigene Fahrzeuggrafik

Liegt unter `assets/truck.png` eine Datei, wird sie auf der Karte anstelle
des Sinnbilds 🚛 verwendet. Ohne Datei bleibt das Sinnbild — es geht also
nichts kaputt, wenn keine da ist.

Anforderungen: PNG mit durchsichtigem Hintergrund, 64 × 64 Bildpunkte,
Fahrzeug zeigt nach rechts. Die Gegenrichtung spiegelt das Programm selbst.
Näheres in `assets/README.md`.

Die Fahrzeuge werden bewusst **nicht animiert** dargestellt. Eine frühere
Fassung hatte einen pulsierenden Ring und eine Bewegungsanimation — beides
ist entfallen, weil die Animation auf `transform` lief und damit Leaflets
eigener Positionierung in die Quere kam.

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
  help/
    topics.js           alle Hilfetexte
  data/
    autobahn.js         Baustellen und Meldungen der Autobahn GmbH
    overpass.js         echte Betriebe aus OpenStreetMap
    hubs.js             Flughäfen, Häfen und Güterbahnhöfe
    osrm.js             Straßenführung, mit Luftlinie als Rückfallebene
  sim/
    clock.js            Betriebsuhr, Zeitverhältnis, Tagesabrechnung
    fleet.js            fahren, disponieren, kaufen, verkaufen
    drivers.js          Erfahrung und Schulung
    orders.js           Auftragsbörse mit drei Auftragsarten
    market.js           Marktlage und Ansehen
    contracts.js        Rahmenverträge
    partners.js         befreundete Speditionen
    progress.js         Betriebsstufen und Freischaltungen
    goods.js            Güterklassen, Kapazität, Ladungsprüfung
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

    dispo.js            Disposition: Karte und Auftragsliste in einem Fenster
    fleet.js            Fuhrpark
    training.js         Schulung, ein Fenster je Fahrer
    finance.js          Kasse
    logbook.js          Betriebsbuch
    dealer.js           Fahrzeughandel
    contracts.js        Verträge, Marktlage, Ansehen
    industry.js         Branche
    progress.js         Betriebsentwicklung
    settings.js         Einstellungen, Spielstand, Datenquellen
    report.js           Bericht über die Abwesenheit
    help.js             Hilfe im Stil der Windows-Hilfe
    tutorial.js         Einführung für den ersten Betrieb
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

## Betriebsentwicklung

Der Bogen des Spiels. Sechs Stufen, jede verlangt etwas Konkretes und gibt
etwas frei, das vorher nicht ging. Nichts kann verloren gehen, es gibt keine
Frist und keinen Rückfall.

| Stufe | Anforderung | Neu verfügbar |
|---|---|---|
| 1 Einzelunternehmer | — | Kurier, Verteiler · 1 Vertrag |
| 2 Fuhrbetrieb | 12 Zustellungen, 2 LKW | **Selbstdisposition** · 2 Verträge |
| 3 Kleinspedition | 60 Zustellungen, 4 LKW, 1 erfüllter Vertrag | Fernverkehr 400 · 3 Verträge |
| 4 Spedition | 150 Zustellungen, 25.000 km, Ansehen 60, 6 LKW | Schwerlast 620 · 4 Verträge · Partner fragen häufiger |
| 5 Regionalspediteur | 300 Zustellungen, 75.000 km, Ansehen 75, 3 Verträge | 5 Verträge · zweites Depot vorgemerkt |
| 6 Logistiker | 600 Zustellungen, 200.000 km, Ansehen 90, 8 Verträge, 12 LKW | 6 Verträge · Lager vorgemerkt |

Die **Automatik ist bewusst nicht von Anfang an da**. Die ersten zwölf Fahrten
disponiert man selbst — danach ist die Selbstdisposition die Belohnung dafür,
dass man den Betrieb einmal von Hand verstanden hat. Sie kommt früh genug, dass
der Betrieb schon in der ersten Sitzung anfängt, ohne einen weiterzulaufen.

Das Programm **Betriebsentwicklung** zeigt jede Anforderung einzeln mit
Fortschrittsbalken. Der Rückkehrbericht nennt zusätzlich, was gerade eine
Entscheidung braucht: Verträge kurz vor Ablauf, freie Schulungspunkte, Fahrer
kurz vor der nächsten Stufe.

## Auftragsvergabe: Spotmarkt, Verträge, Partner

Nachempfunden, wie Speditionen tatsächlich an Fracht kommen. Drei Arten
liegen gemischt in der Disposition, jede mit eigener Kennzeichnung.

Ziele sind zweierlei: **Betriebe im Umkreis des Depots** aus OpenStreetMap für
den Nahverkehr, und **Umschlagpunkte im ganzen Bundesgebiet** für den
Fernverkehr — 30 Frachtflughäfen, See- und Binnenhäfen sowie Güterbahnhöfe von
Kiel bis München. Etwa jede dritte Anfrage geht in den Fernverkehr.

Umschlagverkehr zahlt 13 bis 30 % Zuschlag, weil die Ladung terminiert ist und
die Abfertigung Zeit kostet. Hamburger Hafen und Bremerhaven zahlen am besten.

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

**Ansehen** wächst mit jeder Zustellung, mit erfüllten Verträgen und durch
Ereignisse wie ein Kundenlob oder eine gelungene Kontrolle. Es sinkt nie.
Zwischen 0 und 100 hebt es alle Erlöse um 10 bis 20 % und verbessert die
Ausschreibungen.

Ereignisse zahlen entweder auf die Kasse oder auf den Ruf ein, nie beides in
großem Umfang. Geldbeträge bleiben unter zwei durchschnittlichen Frachten —
für Pünktlichkeit überweist niemand ein Vielfaches dessen, was die Fahrt selbst
eingebracht hat. Lob wird deshalb in Ansehen verbucht.

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
* **Gehalten wird auf Rastanlagen**, nicht auf der Autobahn. Ist die Zeit um,
  steuert der Fahrer den nächsten LKW-Parkplatz auf der Strecke an und darf
  dafür bis zu 45 km überziehen — so, wie es die Verordnung erlaubt, um einen
  geeigneten Halteplatz zu erreichen. Die Plätze kommen aus dem Dienst
  `parking_lorry` der Autobahn GmbH und lassen sich auf der Karte einblenden.
* Ein Fahrzeug, das lange genug steht, hat seine Ruhezeit ohnehin genommen —
  gerechnet wird über tatsächlichen Stillstand, nicht über Mitternacht.

Das Programm **Tagesansicht** zeigt Datum, Art des Tages, ein etwaiges
Fahrverbot und für jeden Fahrer einen Tagesbalken: gefüllt die verbrauchte
Lenkzeit, der rote Strich die aktuelle Uhrzeit.

Die Werte stehen in `config.js` unter `DRIVE` und lassen sich frei ändern.

## Ladung und Fahrzeuge

Jede Sendung hat eine Güterklasse nach dem **Einheitlichen Güterverzeichnis für
die Verkehrsstatistik (NST-2007)** des Statistischen Bundesamts, eine Menge in
Europaletten und ein Gewicht. Zwölf Klassen von Baustoffen bis Kühlgut, jede mit
eigener Dichte und eigenem Preisniveau.

Das entscheidet, woran eine Ladung scheitert:

| Klasse | kg je Palette | im Sattelzug |
|---|---|---|
| Möbel und Konsumgüter | 250 | 33 Paletten — der Platz ist zuerst voll |
| Nahrungsmittel | 600 | 33 Paletten |
| Baustoffe | 1.200 | 20 Paletten — das Gewicht bremst |
| Erze, Steine, Erden | 1.500 | 16 Paletten |

Kühlgut braucht einen **Kühlaufbau**, Gefahrgut nach ADR eine **ADR-Ausrüstung**.
Beides gibt es beim Kauf dazu, der Kühlaufbau kostet 8 % Nutzlast.

### Fahrzeugdaten

Elf Klassen, gruppiert nach Führerscheinklasse.

| Klasse | FS | Preis | zGG | Nutzlast | Plätze | m³ | Fix/Tag |
|---|---|---|---|---|---|---|---|
| Kastenwagen 3.0 | B | 7.500 € | 3,0 t | 1,0 t | 3 | 8 | 250 € |
| Kurier 3.5 | B | 12.000 € | 3,5 t | 1,2 t | 4 | 14 | 303 € |
| Maxi 3.5 lang | B | 15.500 € | 3,5 t | 1,05 t | 6 | 20 | 341 € |
| Kompakt 5.0 | C1 | 17.000 € | 5,0 t | 1,8 t | 10 | 26 | 413 € |
| Nahverkehr 7.5 | C1 | 24.000 € | 7,5 t | 2,3 t | 15 | 34 | 484 € |
| Verteiler 12 | C | 30.000 € | 12 t | 5,5 t | 17 | 45 | 550 € |
| Solo 18 | C | 42.000 € | 18 t | 9,5 t | 18 | 50 | 660 € |
| Fernverkehr 400 | CE | 52.000 € | 40 t | 24 t | 33 | 90 | 743 € |
| Jumbo 40 | CE | 58.000 € | 40 t | 24,5 t | 38 | 120 | 798 € |
| Thermo 40 | CE | 68.000 € | 40 t | 21,5 t | 33 | 82 | 853 € |
| Schwerlast 620 | CE | 78.000 € | 44 t | 27 t | 26 | 70 | 935 € |

Die Werte folgen dem Branchenüblichen: ein 7,5-Tonner fasst 15 Europaletten bei
rund 2,3 t Nutzlast, ein Standardsattelzug mit 13,6 Lademetern 33 Paletten bei
24 t. Der Jumbo als Gliederzug mit Durchladesystem kommt auf 38 Paletten.

Fahrzeuge bis 3,5 t sind vom Sonntags- und Feiertagsfahrverbot ausgenommen.
Der Thermo 40 hat das Kühlaggregat fest verbaut und braucht keine Nachrüstung.

Die Fixkosten je Tag richten sich nach der Klasse — ein großes Fahrzeug ohne
Auslastung ist teuer.

### Touren zusammenlegen

In der Disposition sammelst du mit **„+ laden"** mehrere Sendungen auf einem
Fahrzeug. Die Ladeliste zeigt laufend Stellplätze und Nutzlast als Balken, bei
jeder weiteren Sendung den **Umweg in Kilometern**, den sie kostet. Passt etwas
nicht, steht der Grund dort statt des Knopfes — „nur 17 Stellplätze" oder
„Nutzlast 5,5 t überschritten".

**„Tour starten"** schickt das Fahrzeug los. Die Stopps werden nach dem nächsten
Nachbarn geordnet, jede Teilstrecke einzeln über OSRM geroutet. An jedem Stopp
wird die jeweilige Fracht abgerechnet. Mehrstopp-Touren brauchen nur 33 Minuten
Rampenzeit je Stopp statt einer vollen Stunde — Sammelverkehr lohnt sich.

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

## Erfundene Namen

Alle Betriebsnamen im Spiel sind frei erfunden und benennen keine wirklichen
Unternehmen — weder die Ersatzliste in `data/fallback.js`, die bei einem
Ausfall der Overpass-Abfrage einspringt, noch der Namensgenerator in
`data/invent.js`, noch die Partnerspeditionen.

Ausgenommen sind die Umschlagpunkte in `data/hubs.js`: Häfen, Frachtflughäfen
und Güterbahnhöfe sind öffentliche Infrastruktur und tragen ihre tatsächlichen
Ortsbezeichnungen. Markennamen einzelner Betreiber wurden dort durch neutrale
Bezeichnungen ersetzt.

Kommt die Overpass-Abfrage durch, stammen die Namen aus OpenStreetMap und sind
dann selbstverständlich echt — das sind offene Kartendaten.

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
