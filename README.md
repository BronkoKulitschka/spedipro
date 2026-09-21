# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

**Versionierung:** Die zweite Stelle bleibt bei 0.15, bis die
Tourenplanung abgeschlossen ist - bis dahin wird nur die dritte Stelle
hochgezählt (0.15.3, 0.15.4, ...).

## Aktueller Stand (v0.15.22)

**Tourenplanung war nicht mehr bedienbar - Namenskollision behoben.**
Der neue Fristbalken bekam in 0.15.21 die Klasse `tour-ablauf`. So
heißt aber seit jeher der Rahmen um den ganzen Planungsablauf. Beide
Regeln galten damit für denselben Kasten, und der Rahmen erbte
`position: absolute`, `pointer-events: none` und verlor sein
Flex-Layout: Die komplette Tourenplanung nahm keine Klicks und keine
Wischgesten mehr an. Der Balken heißt jetzt `tour-fristbalken`.

Das ist nach `.tour-stadtname` in 0.15.14 die zweite Kollision dieser
Art. Ein neuer Test prüft deshalb nicht nur den Balken, sondern
ausdrücklich, dass der Planungsrahmen `position: static`,
`pointer-events: auto` und `display: flex` behält.

**Zwei weitere Funde auf dem Weg dorthin:**

*Der Weiter-Pfeil meldete sich bei jedem Zeittakt neu an.* Sein
Zuhörer hängt am Dispositionsbereich selbst, nicht an einem frisch
erzeugten Kind - und der bleibt bestehen. Gemessen: nach 300
Neuaufbauten 302 Kopien, nach 25 Spielstunden 449. Jetzt genau eine,
gesichert über ein Kennzeichen am Element.

*Die Karte wurde jede Spielminute neu gezeichnet.* Dabei ändern sich
nur Fortschrittsbalken und Ankunftszeiten in der Liste. Die 165
Städtemarken jedes Mal neu aufzubauen kostete auf Telefon-Niveau
gemessene 59 ms je Takt gegenüber 1 ms ohne. Der Zeittakt baut jetzt
nur noch die Liste auf; die Fahrzeugpunkte zeichnet ohnehin eine
eigene Funktion. Lange Aufgaben über 20 Sekunden: von 219 ms auf 74 ms.

## Vorheriger Stand (v0.15.21)

**Ablaufbalken hinter der Schrift.** Jede Auftragszeile trägt jetzt
einen Balken, der die ganze Zeilenhöhe füllt und mit der Restlaufzeit
schrumpft - grün, ab der Hälfte gelb, im letzten Fünftel orange. So
sieht man die Dringlichkeit, ohne jede Zeile zu lesen. Gezeigt wird die
Standzeit am Markt (Ladefenster plus zwei Tage), nicht die Lieferfrist:
Danach nimmt den Auftrag jemand anders.

**Rot, wenn der Termin nicht mehr zu halten ist.** Kann das gewählte
Fahrzeug von seinem Standort aus nicht mehr rechtzeitig liefern, wird
der Balken rot und schraffiert - eine Absage, keine Abstufung, deshalb
auch ohne Farbsehen erkennbar. Grundlage ist `Auftraege.terminMachbar`,
dieselbe Prüfung, die auch die Warnung im Text erzeugt.

**Weiter direkt aus der Zeile.** Am rechten Rand jeder wählbaren Zeile
sitzt ein Pfeil, der auswählt und gleich weiterschaltet. Bei langen
Listen musste man vorher bis ans Ende scrollen, um den Weiter-Knopf zu
finden - bei zwanzig Aufträgen war der außer Sicht. Der Knopf unten
bleibt, für alle, die erst vergleichen wollen.

Beim Bauen kam noch ein Anzeigefehler heraus: Die Kartenbühne trägt
`will-change: transform` und liegt damit auf einer eigenen
Compositing-Ebene. Sobald die Listenzeilen positioniert wurden, zeichnete
Chromium die Karte über die Auftragsliste. `#tour-disposition` bekommt
deshalb einen eigenen Stapelkontext.

## Vorheriger Stand (v0.15.20)

**Echte Straßen statt gerader Linien.** Das Straßennetz kommt jetzt aus
**Natural Earth 10m roads** (Public Domain) — derselben Quelle wie
Küsten, Flüsse und Städte. Werkzeuge und Ablauf: `werkzeug/LIESMICH.md`.

- **435 von 452 Verbindungen** haben einen echten Verlauf, zusammen
  6.463 Stützpunkte. Die übrigen 17 behalten die alte Schätzung und
  tragen `quelle: "schaetzung"`
- **Die Kilometer sind gemessen, nicht geschätzt.** Bisher stand in
  `strassennetz.js` ausdrücklich, die Angabe sei „die Luftlinie mit
  Umwegfaktor 1,2 — eine Schätzung, die später durch echte
  Streckenlängen ersetzt werden sollte". Damit war jede Entfernung,
  Fahrzeit, Spritrechnung und jeder Frachtpreis im Spiel auf eine
  Faustregel gebaut. Im Median lag sie nur 0,8 % daneben, im Einzelfall
  aber deutlich: Bremerhaven–Hamburg war als **Fähre** eingetragen,
  weil die Wasseranteil-Heuristik Weser- und Elbmündung falsch deutete
- **Der Typ kommt aus dem benutzten Weg**, nicht aus einer Schätzung
  über Wasseranteile. Aus 70 vermeintlichen Fährverbindungen wurden 40
  tatsächliche
- **Karte und Route stammen aus derselben Quelle.** Ins Kartenbild ist
  genau das Netz gemalt, das auch gefahren wird — nicht alles, was
  Natural Earth kennt. Deshalb können Bild und Routenlinie nicht
  auseinanderlaufen. Das war der Grund, den naheliegenden Weg (OSM-
  Screenshot als Hintergrund) nicht zu gehen: Eine Karte mit echten
  Autobahnen, über die eine schnurgerade Routenlinie läuft, fällt mehr
  auf als eine ehrlich abstrahierte Karte
- **Fahrzeug und Routenlinie folgen dem Verlauf**, in der Tourenplanung
  wie im Kartenfenster des Fuhrparks. `Route.berechne()` liefert dafür
  `verlauf`, `Route.punktAuf()` den Punkt nach zurückgelegter Strecke

Beim Aufbau mussten zwei Eigenheiten der Daten ausgeglichen werden:
Natural Earth erfasst Abschnitte als einzelne Linienzüge, die sich an
Kreuzungen überschneiden, ohne gemeinsamen Stützpunkt — ohne Ausgleich
hingen nur 27 % des Netzes zusammen. Und Hafenstädte wie Venezia oder
Roscoff sind dem Fährnetz näher als der Autobahn; ohne Filter fuhr der
Router von Bologna nach Venezia 2.468 km über das Mittelmeer.

**Einschränkung:** Natural Earth bildet das Netz von heute ab, nicht das
von 1994. Die A 20 und der Ausbau in den neuen Ländern kamen später,
der Kanaltunnel öffnete im Mai 1994.

## Vorheriger Stand (v0.15.19)

**Der Unterwegs-Hinweis steht jetzt unter dem Bild**, nicht mehr darauf.
Als Überlagerung verdeckte er die hinteren Bauteile samt ihrer
Beschriftung - Reifen und Antrieb lagen genau darunter, und das
ausgerechnet dann, wenn man nachsehen will, wie es einem Fahrzeug auf
Tour geht. Er sitzt zwischen Fahrzeugbild und Zustandsbalken und
schiebt nichts mehr zu. Der Ausfall-Hinweis bleibt im Bild: Ein
liegengebliebenes Fahrzeug soll auffallen.

**Standort und Status kennen die laufende Tour.** Dabei fiel auf, dass
in der Infoliste "Hamburg" und "verfügbar" stand, während das Fahrzeug
längst zwischen zwei Städten unterwegs war. Jetzt steht dort
"unterwegs (Hamburg → Newcastle-upon-Tyne)" und "auf Tour, beladen"
bzw. "auf Tour, Anfahrt leer" oder "Ruhezeit".

## Vorheriger Stand (v0.15.18)

**Nur noch eine Uhr, und die steht in der Taskleiste.** Die Tourenplanung
hatte eine eigene Zeitanzeige in der Kartenleiste - das brach die
Vorstellung, vor einem Rechner zu sitzen: Ein Programm unter Windows 98
hatte keine eigene Uhr, man schaut nach unten rechts. Die Anzeige ist
ersatzlos entfernt.

Was dabei mitwandern musste:
- **Das Pausezeichen.** Steht die Zeit (kein Fahrzeug unterwegs), zeigt
  die Taskleistenuhr ein ⏸ und wird grau-kursiv. Ohne das wartet man
  auf Zeit, die nicht vergeht
- **Die Anzeige muss von selbst umschalten.** Steht die Uhr, kommt kein
  Zeittakt mehr - die Anzeige erführe nie, dass sie steht. `clock.js`
  hängt sich deshalb zusätzlich an `Fahrt.beiAenderung`: Genau dann
  wechselt der Zustand
- **Das Spieldatum bleibt auf dem Telefon sichtbar.** Es war unter
  420 px ausgeblendet; mit der Uhr in der Tourenplanung wäre sonst gar
  nicht mehr zu sehen, welchen Tag man schreibt - und 1994 ist nicht
  irgendein Jahr. Der Platz kommt aus kleinerer Schrift und daraus, dass
  jetzt die Fensterknöpfe schrumpfen statt des Infobereichs

## Vorheriger Stand (v0.15.17)

**Zwei Fehler behoben, die zusammen das Spiel blockierten.**

*Die Startflotte stand nicht im Depot.* Sie entsteht, sobald die Karte
zum ersten Mal zeichnet - also bevor ein Depot gewählt ist. Der
Notbehelfsort war Frankfurt am Main, und dort blieb das Fahrzeug, auch
wenn die Spedition in Hamburg gegründet wurde. Seit dem
stadtorientierten Ablauf (0.15.14) braucht die Disposition ein Fahrzeug
VOR ORT: Auf der Stadtseite des Depots stand keins, der Knopf
"Fahrzeug wählen" erschien nicht, und es ließ sich keine Tour starten.
Die Gründung stellt die Flotte jetzt ins Depot
(`FuhrparkApp.zumDepotVersetzen`).

*Die Taskleistenuhr lief frei.* Die Bedingung "nur laufen, solange
Fahrzeuge unterwegs sind" wurde erst gesetzt, wenn die Tourenplanung
zum ersten Mal geöffnet wurde. Bis dahin tickte die Uhr ab dem
Seitenaufruf. Wer zuerst ein anderes Programm öffnete, sah eine
laufende Taskleistenuhr und daneben eine stehende Uhr in der
Tourenplanung. Die Bedingung steht jetzt in `clock.js` und gilt ab dem
Seitenaufruf.

*Reparatur beim Laden:* Spielstände bis 0.15.16 stecken im blockierten
Zustand fest. Beim Laden wird eingegriffen, aber nur im eindeutig
kaputten Fall - es gibt ein Depot, dort steht kein Fahrzeug, und keines
ist unterwegs. Eine bewusst verteilte Flotte bleibt unangetastet. Der
Eingriff steht im Abwesenheitsprotokoll.

## Vorheriger Stand (v0.15.16)

**Finanzmodul** (`js/core/finanzen.js`, `js/apps/finanzen/`, Desktop-
Symbol und Programme-Menü). Kontenrahmen an SKR03 angelehnt, echte
Kontonummern: 8400 Frachterlöse, 4500 Kraftstoffe, 4510 Kfz-Steuer,
4520 Versicherung, 4530 laufende Kfz-Betriebskosten, 4210 Miete, 4970
Verwaltung, 4830 Abschreibungen, 2110 Zinsen, dazu 1200 Bank, 0320
Fuhrpark und 0630 Darlehen.
- Gebucht wird vereinfacht: Konto und Betrag gegen die Bank, kein Soll
  und Haben. Jede Buchung trägt Beleg, Datum, Text und - wo zutreffend
  - Fahrzeug-ID und Kilometer
- Zahlungsziele gibt es bewusst nicht; eine Zustellung bringt das Geld
  sofort. Offene Posten und Mahnwesen wären der nächste Schritt
- Zum Monatsersten laufen Kfz-Steuer, Versicherung, Abschreibung,
  Depotmiete, Verwaltung, Kreditraten und Kontokorrentzinsen. Das läuft
  auch in der Nachholsimulation mit
- Abschreibung linear über die Nutzungsdauer der Branchentabelle. Der
  vorhandene Fuhrpark geht bei der Gründung als Sacheinlage ein, sonst
  wäre das Startfahrzeug ein kostenloses Betriebsmittel
- Kauf wird aus der Kasse bezahlt, der Rest finanziert: Ratenkredit mit
  gleichbleibender Tilgung, Zins aus Diskontsatz plus Aufschlag
- Sechs Ansichten: Übersicht, Journal (nach Monat und Konto filterbar),
  BWA, Kosten je Fahrzeug in DM/km, Bank mit Darlehen, und Sätze

**Kostensätze mit Beleglage** (`js/data/kostensaetze.js`, Recherche in
`docs/kosten-1994.md`). Alle Geldbeträge liegen an einer Stelle, jeder
mit Quelle oder mit `belegt: false`. Die Ansicht "Sätze" im
Finanzprogramm zeigt beides nebeneinander - vier belegte Sätze grün,
acht vorläufige gelb.

Belegt und im Spiel:
- **Dieselpreis 1994: 1,14 DM/l**, jahresabhängig von 1990 bis 1998.
  Der bisherige Festwert 1,05 DM war geschätzt und zu niedrig
- **Nutzungsdauer** nach AfA-Tabelle des Wirtschaftszweigs
  Personen- und Güterbeförderung: Zugmaschine 5 Jahre, Anhänger 6.
  Nicht die 9 bzw. 11 Jahre der allgemeinen Tabelle
- **Diskontsatz** der Bundesbank mit allen Stufen 1993 bis 1996; zum
  Spielstart 5,25 %
- **Keine Lkw-Maut 1994.** Die Eurovignette startete erst zum
  01.01.1995 - eine Straßenbenutzungsgebühr im Startjahr wäre falsch

Noch vorläufig und im Programm so gekennzeichnet: Kfz-Steuer (Mechanik
bekannt, DM-Beträge der Fassung 1994 nicht), Versicherungsprämien,
Depotmiete, Verwaltung, Zinsaufschläge, Reifen je km, Neupreise.

**Nebenbefund für die Routenplanung:** In der Schweiz galt bis zu den
bilateralen Verträgen eine Gewichtslimite von **28 t**. Ein
40-Tonnen-Sattelzug durfte die Schweiz 1994 nicht durchfahren. Betrifft
`route.js`, noch nicht umgesetzt.

**Marktrahmen bestätigt:** Der Tarifzwang im Güterfernverkehr endete
zum 01.01.1994, zwei Monate vor Spielstart. Frei verhandelte
Frachtpreise und der Spotmarkt in der Tourenplanung sind damit
historisch korrekt.

## Vorheriger Stand (v0.15.15)

**Spielstandverwaltung mit drei festen Plätzen** (`js/apps/spielstaende/`).
Erreichbar über das Startmenü, Eintrag "Spielstände..." - bewusst kein
Desktop-Symbol und kein Eintrag unter "Programme": Spielstände gehören
zum Spiel, nicht in den Arbeitsalltag der Spedition.
- Je Platz: Depot, Spielzeit, Zeitpunkt der letzten Sicherung, Anzahl
  Fahrzeuge und laufender Touren
- Laden, Speichern, Löschen, Neues Spiel, Ausgeben als `.json` und
  Einlesen einer Datei
- Gesichert wird laufend **nur auf den aktiven Platz**. Sonst würde die
  Automatik alle zehn Sekunden den zuletzt angesehenen Platz
  überschreiben. Laden und Speichern wechseln den aktiven Platz mit
- Ein Spiel ohne Depot wird nicht gesichert - sonst wäre Platz 1 belegt,
  sobald man das Spiel nur öffnet
- **Fassungswechsel löschen nichts mehr.** Ein Stand aus einer älteren
  Fassung bleibt liegen, wird als "Fassung n - nicht ladbar" markiert
  und lässt sich weiterhin ausgeben. Vorher wurde er beim ersten Start
  einer neuen Fassung stillschweigend entsorgt - bei laufender
  Entwicklung die häufigste Verlustursache
- Der alte Ein-Platz-Spielstand (`spedipro.spielstand`) wird beim ersten
  Start einmalig auf Platz 1 übernommen
- Betriebsdaten (Depot, Gründungsdatum) liegen nicht mehr unter einem
  eigenen Schlüssel, sondern im Spielstand - ein global gespeichertes
  Depot würde beim Platzwechsel stehenbleiben und zur falschen Flotte
  passen

**Nachholsimulation mit Ereignisprotokoll.** Ein Browser rechnet nicht,
während er geschlossen ist; auch ein Service Worker nicht, sobald der
Prozess beendet ist. Deshalb wird die verstrichene Zeit beim Öffnen
nachgeholt - das ist kein Notbehelf, sondern das übliche Verfahren.
- Neben den Touren laufen jetzt auch Marktvorgänge mit: Die Frachtbörse
  frischt je Spieltag auf, unangetastete Aufträge verfallen, neu
  überfällige HU-/SP-/Wartungsfristen werden erkannt, Kundenbeziehungen
  kühlen nach 30 Spieltagen ohne Auftrag ab (`Kunden.altern`)
- Jedes Ereignis landet mit Zeitstempel im Protokoll: Ankunft mit
  Deckungsbeitrag und Pünktlichkeit, verfallener Auftrag mit entgangenem
  Entgelt, überfällige Frist, liegengebliebenes Fahrzeug
- Das Fenster "Während deiner Abwesenheit" zeigt die Liste; in der
  Tourenplanung führt ein Knopf dorthin
- Das Protokoll wird mitgespeichert und übersteht das Schließen des
  Fensters. Höchstens 120 Einträge, Deckel weiter bei 7 nachgeholten
  Tagen

**Tourenplanung von der Stadt aus** (v0.15.14): Stadt wählen, "Tour
planen", dann Stadtseite mit Überschrift, Fahrzeugstatus und der Liste
"Ausgehend ab <Stadt>" aus festen Aufträgen und freiem Warenangebot.
Mit Fahrzeug vor Ort: Fahrzeug → Fracht → Ziel → Losfahren; bei einem
festen Auftrag entfällt die Zielwahl. Ohne Fahrzeug: die fünf
nächstgelegenen freien Fahrzeuge bis 1500 km als Leerfahrt anfordern.

**Flottenübersicht in der Tourenplanung** (v0.15.12): Dauerhafte Liste
aller eigenen Fahrzeuge mit Lackierungspunkt, Standort und Status; Klick
springt zur Stadt. Städte mit eigenem Fahrzeug tragen einen Ring auf der
Karte.

**Cache-Busting** (v0.15.13): Alle Skript- und CSS-Verweise tragen
`?v=<Version>`, damit nach einem Push keine alte Datei aus dem Cache
kommt. Die Versionsnummer in der Taskleiste bleibt auch auf schmalen
Geräten sichtbar - ohne sie lässt sich am Telefon nicht erkennen, welche
Fassung geladen ist.

## Vorheriger Stand (v0.15.11)

**Karte neu gestaltet - Stil der KI-Vorlage, Geometrie aus Geodaten.**
Eine extern erzeugte KI-Karte diente als gestalterische Vorlage. Sie
direkt zu verwenden schied aus: gemessen nur 73,9 % Übereinstimmung mit
den echten Umrissen (Britische Inseln zu weit westlich, Norwegen
gestaucht, Italien und Griechenland verschoben) - Städte wären im Wasser
gelandet. Stattdessen:
- Unsere Karte im Stil der Vorlage neu gerendert: gedämpfte erdige
  Grüntöne, abgestufte Meerestiefe zur Küste, dunkle Gebirgskämme mit
  Schattenwurf (Licht von Nordwesten), warme Sandtöne im Süden
- Zusätzlich beide Karten überblendet: 45 % Farbanteil der KI-Karte,
  aber nur wo beide sich über Land und Wasser einig sind (83,2 % der
  Fläche). An Konfliktstellen hart auf die eigene Karte - sonst blutet
  das verschobene KI-Meer über die Küsten
- Die Helligkeitsstruktur der Vorlage wirkt überall (trägt Relief, keine
  Geometrie)
- Geprüft: keine der 165 Städte liegt im Wasser
- Format auf JPEG gewechselt (199 KB statt 627 KB als PNG, im Vergleich
  bei dreifacher Vergrößerung nicht zu unterscheiden)

**Höhenfeld verbessert:** engere Kämme statt runder Kuppeln, isolierte
Einzelgipfel unter 2.200 m entfallen - die erzeugten runde Flecken im
Flachland.

**Weitere Änderungen:**
- Versionsnummer in der Taskleiste (`js/core/version.js` als einzige
  Pflegestelle)
- "Depot verlegen" funktioniert wieder - der Handler war beim Umbau auf
  Auftragsdisposition verlorengegangen
- Fahrzeuge auf der Karte als farbige Punkte in ihrer Lackierung statt
  als Symbol: stehende als kleine Punkte an der Stadtmarke, fahrende als
  größerer Punkt mit weißem Ring (leer hohl, beladen gefüllt)
- Karte frischt nach Fahrzeugkauf oder -verkauf auf

## Vorheriger Stand (v0.15.10)

**Behobene Fehler:**
- **Reparatur ging nicht mehr.** Beim Entfernen der Debug-Tour wurde ein
  Codeblock zu großzügig herausgeschnitten - dabei ging der Klick-Handler
  für die Bauteil-Auswahl im Bild verloren. Ohne ihn ließ sich kein Teil
  wählen und der Knopf blieb gesperrt. Handler wieder da.
- **Fuhrpark zeigte bei laufender Tour veraltete Inhalte.** War das
  Fenster schon offen, holte der Fenstermanager es nur nach vorne, ohne
  neu zu zeichnen. Jetzt wird beim erneuten Öffnen immer aufgefrischt;
  zusätzlich laufen Fortschrittsbalken und Ankunftszeit live mit, ohne
  eine getroffene Bauteilauswahl zu verwerfen.
- **Neue Fahrzeuge standen am falschen Ort.** Mit Depot war es korrekt,
  ohne Depot landeten sie an einem zufälligen Ort aus einer festen Liste.
  Jetzt: mit Depot dort, ohne Depot bei den vorhandenen Fahrzeugen.

**Schnellvorlauf entfernt** - der ⏭-Knopf an laufenden Touren ist weg,
samt Funktion und Styling. Die Debug-Knöpfe "+1 Woche / +1 Monat" im
Fuhrpark bleiben vorerst.

## Vorheriger Stand (v0.15.9)

**Verlorene Touren behoben.** Ursache: Gespeichert wurde nur alle 20
Sekunden und beim regulären Verlassen der Seite - beendet ein
Handy-Browser die Seite hart, war die Tour weg. Jetzt wird sofort
gesichert, sobald etwas Wichtiges geschieht (Tourstart, Ankunft,
Depotwahl), zusätzlich `pagehide` als Auslöser (feuert mobil
verlässlicher als `beforeunload`), Intervall auf 10 Sekunden verkürzt.

**Zeit läuft nur, wenn Fahrzeuge unterwegs sind.** Sonst steht die Uhr -
erkennbar am ⏸ hinter der Uhrzeit. Beim Planen verstreichen damit keine
Fristen.

**Fuhrpark zeigt Fahrzeuge auf Tour:**
- Blaue Marke in der Übersicht mit Strecke und Fortschritt
- Hinweisfeld in der Detailansicht (unten im Bild, damit es den
  Ausfall-Hinweis oben nicht überlagert)
- Klick öffnet ein eigenes Kartenfenster, das den Ausschnitt automatisch
  so wählt, dass die ganze Route hineinpasst; mit Fahrzeugposition,
  laufender Aktualisierung und Zurück-Knopf zum Fuhrpark

**Ausgehende Frachten je Stadt.** Jede Stadt zeigt ihre offenen Frachten
mit Ziel, Menge, Strecke und Entgelt; nicht ladbare abgeblendet. Ein
globaler Pool von 24 Aufträgen wäre auf 165 Städte verteilt fast überall
leer gewesen - Frachten werden deshalb bei Bedarf pro Stadt nacherzeugt
(mindestens sechs) und bleiben dann bestehen.

**Leerfahrten:** Fehlt ein passendes Fahrzeug, lässt sich eines leer in
die Stadt schicken - mit Auswahl nach Entfernung und geschätzten
Spritkosten. Läuft über dieselbe Fahrtlogik, bringt keinen Erlös und
wird als Leerfahrt in der Historie vermerkt.

## Vorheriger Stand (v0.15.8)

**Spielstand mit Hintergrund-Simulation** (`js/core/speicher.js`):
- Gespeichert werden Spielzeit, Fahrzeuge, Kunden, Aufträge und
  laufende Touren - automatisch alle 20 Sekunden sowie beim Schließen
  oder Wegschalten der Seite
- Beim Laden wird die verstrichene reale Zeit nachgeholt (1 reale Minute
  = 1 Simulationsstunde). Touren fahren in der Pause weiter und kommen
  an; ein Hinweis meldet, was passiert ist
- Nachsimulation in 30-Minuten-Schritten, damit Lenk- und Ruhezeiten
  greifen. Höchstens 7 Tage werden nachgeholt
- Routen werden nicht mitgespeichert, sondern beim Laden aus Start- und
  Zielort neu berechnet - der Spielstand bleibt damit gültig, wenn sich
  das Straßennetz ändert

**Warendetails im selben Rahmen** statt in einem eigenen Fenster, mit
Zurück-Knopf. Die Karte bleibt durchgehend sichtbar.

**Springende Liste behoben.** Ursache war der vollständige Neuaufbau des
Bereichs bei jeder Auswahl. Jetzt wird nur die Markierung umgesetzt und
der Weiter-Knopf ergänzt - die Liste bleibt unangetastet.

**Laufende Touren bleiben auf der Karte sichtbar** - in Blau, klar
unterschieden von der orangen Route in Planung. Leerfahrten zur
Ladestelle gestrichelt und blasser als der beladene Hauptlauf.

## Vorheriger Stand (v0.15.7)

**Start mit einem Fahrzeug:** ein gebrauchter Meridian 1830 S, Bj. 1988,
412.000 km, Zustand 58-74 %. Alles Weitere muss erwirtschaftet werden.
Nebeneffekt: Mit nur einem Planenauflieger passen von 24 Aufträgen etwa
8 - der Filter "Passend zur Flotte" wird zum wichtigsten Werkzeug, und
der Anreiz für andere Aufbautypen ist von Anfang an spürbar.

**Verschleiß und Fristen kommen jetzt ausschließlich aus echten Touren.**
Die Debug-Tour im Fuhrpark ist entfernt. Belegt: Tour gefahren →
412.000 auf 414.984 km → Bremsen von 58 auf 52,2 % → Wartungsfrist
wandert auf "fällig bei 449.616 km".

**Behobene Fehler:**
- Button-Beschriftungen unter der Karte passten nicht: feste Höhe war
  zusammen mit längerem Text das Problem. Höhe jetzt automatisch,
  Leiste bricht bei Bedarf um
- Auftragsliste sprang beim Blättern nach oben: Sie wurde bei jedem
  Zeittakt neu aufgebaut. Während der Auftragswahl wird jetzt nicht mehr
  getaktet neu gezeichnet, und die Scrollposition bleibt erhalten
- Warendetails ließen sich nicht mehr öffnen: Der Klick-Handler war beim
  Umbau auf Auftragsdisposition versehentlich mitgelöscht worden. Wieder
  da, zusätzlich ist jetzt auch das Aufbau-Kürzel in der Auftragsliste
  antippbar (ohne dabei den Auftrag auszuwählen)

## Vorheriger Stand (v0.15.6)

**Tourenplanung nach dem Vorbild echter Speditionssoftware umgebaut.**
Bisher fahrzeugorientiert (Fahrzeug wählen → Ladung erfinden → Ziel
suchen), jetzt auftragsorientiert wie in der Disposition: Es liegen
Transportaufträge vor, die auf verfügbare Fahrzeuge verteilt werden.

**Neue Kernmodule:**
- `js/core/auftraege.js` - Auftragspool mit Nummer, Lade- und
  Entladestelle, Ware, Menge, Zeitfenster, Lieferfrist, vereinbartem
  Entgelt und Auftraggeber. Statuskette offen → disponiert → unterwegs
  → zugestellt. Aufträge verfallen, wenn sie liegen bleiben.
  Terminprüfung inklusive Anfahrt.
- `js/core/kunden.js` - Auftraggeber mit wachsender Bindung über fünf
  Stufen (Frachtbörse → Gelegenheitskunde → Wiederkehrender Kunde →
  Stammkunde → Vertragskunde). Preisaufschlag steigt von 0 auf 35 %,
  gebundene Kunden vergeben eigene Aufträge außerhalb der Börse.
  Verspätungen drücken den Aufschlag wieder.

**Neuer Ablauf in drei Schritten:**
1. Auftrag aus dem Pool - sortiert nach Ertrag je Kilometer, Filter für
   Börse, Kundenaufträge und "passend zur Flotte"
2. Fahrzeugvorschläge - sortiert nach Eignung und Leerkilometern.
   Ungeeignete gesperrt mit Begründung (Aufbau, Kapazität, Termin)
3. Disponieren - mit Deckungsbeitrag (Entgelt minus Spritkosten) vor
   der Entscheidung

**Touren haben jetzt zwei Etappen:** Leerfahrt zur Ladestelle und
beladener Hauptlauf, getrennt abgerechnet (Verschleiß und Verbrauch
unterscheiden sich deutlich). Leer fahrende Fahrzeuge sind auf der Karte
blasser, der Status wechselt sichtbar von "Anfahrt leer" zu "beladen
unterwegs".

**Spielzeit läuft in Echtzeit:** eine Simulationsstunde entspricht einer
realen Minute, ein Spieltag 24 realen Minuten. Touren laufen im
Hintergrund weiter, mehrere Fahrzeuge gleichzeitig möglich. Lenkzeit
9 Std/Tag, danach 11 Std Ruhe. Taskleiste zeigt Spieldatum und -uhrzeit.

**Routenberechnung** (`js/core/route.js`): Dijkstra über die 452
Verbindungen, Fähren mit Bewertungsaufschlag. Strecken sind damit echt
statt geschätzt (Hamburg–München 812 km über 3 Etappen).

## Vorheriger Stand (v0.15.5)

**Tourenplanung in fünf Schritten** (vorerst nur A nach B):
1. Standort mit Fahrzeugen
2. Fahrzeug (stillstehende sind gesperrt)
3. Ladung - gefiltert danach, was der Aufbau befördern kann; je Ware
   Höchstmenge und ob Gewicht oder Volumen begrenzt
4. Ziel - nur Städte mit Bedarf für diese Ware, nach Entfernung sortiert,
   mit km und Frachterlös
5. Start - Verschleiß wird berechnet, Spielzeit läuft weiter, Fahrzeug
   steht danach am Ziel, alles landet in der Historie

Fortschrittsleiste oben, erledigte Schritte anklickbar zum Zurückspringen.

**Neu auf der Karte:**
- Gelbes Symbol an Städten, in denen Fahrzeuge stehen (mit Anzahl)
- Antippen einer Ware lässt Lieferstädte grün pulsieren, im Zielschritt
  die Bedarfsstädte violett - beide eindeutig unterscheidbar von den
  roten Stadtmarken und der blauen Depotmarke
- Pulsieren nur am Ring, die Marke bleibt an ihrem Platz

**Warenfenster:** Kategorie, Aufbautyp, Schüttdichte, Warenwert,
Besonderheiten, Ladung je Auflieger, plus wo die Ware angeboten und
gebraucht wird.

**Neues Modul `js/core/ladung.js`:** Eignung (welcher Aufbau kann was),
Höchstmenge (Gewicht oder Volumen), Frachtpreis. Der Preis steigt mit
Warenwert, Kühlpflicht und Gefahrgut - plausible Größenordnung, keine
belegten Tarife von 1994 (der damalige Tarifzwang nach GüKG wäre zu
prüfen).

**Bugfix:** Zwei Fahrzeugstandorte hießen "Mailand" und "Prag", die
Städtedaten führen sie als "Milano" und "Praha" - die Tourenplanung
hätte diese Fahrzeuge nicht gefunden. Neue Fahrzeuge stehen jetzt am
Depot.

## Vorheriger Stand (v0.15.4)

**Depot** (`js/core/betrieb.js`, Anfang des globalen Spielstands):
- Beim ersten Öffnen der Tourenplanung wird ein Heimatstandort gewählt,
  frei unter allen 165 Städten, mit Vorschau der dort verladbaren Waren
- Depot ist auf der Karte blau markiert, bei jeder anderen Stadt steht
  die Entfernung dorthin
- Später verlegbar (mit Rückfrage). Wird im Browser gespeichert,
  Zugriff über try/catch abgesichert

**Güter und Wirtschaftsregionen** (Schritt 1 der Tourenplanung):
- `js/data/gueter.js` - 72 Warenarten mit Aufbautyp, Schüttdichte,
  Wert je Tonne, Kühlpflicht und Gefahrgut-Kennzeichnung. Die Dichte
  entscheidet, ob eine Ladung durch Gewicht oder Volumen begrenzt ist
  (Dämmstoff: 5,4 t füllen den Auflieger, Stahl erreicht die 25 t)
- `js/data/regionen.js` - 25 Wirtschaftsregionen mit Angebot und Bedarf,
  alle 165 Städte zugeordnet
- `js/core/wirtschaft.js` - leitet Angebot und Bedarf je Stadt ab aus
  Region, Hafeneigenschaft und Stadtgröße. Was eine Region selbst
  erzeugt, wird ihr nicht als Bedarf zugewiesen
- Disposition zeigt beide Spalten mit Aufbau-Kürzel je Ware

**Herkunft der Zuordnung:** Belegte Güterstromdaten für 1994 liegen
nicht vor. Die Zuordnung ist aus bekannten Wirtschaftsschwerpunkten der
Regionen abgeleitet (Ruhrgebiet Kohle/Stahl, Norrland Holz/Erz, Poebene
Maschinen/Textil) und im Code als Annäherung gekennzeichnet.

**Fuhrpark:** Neues Fristen-Fenster neben Historie (später der
Werkstatt-Zugang), mit Debug-Rücksetzung je Frist. "Zurück zum
Fahrzeug" schließt die Nebenfenster jetzt, statt sie offen zu lassen.

## Vorheriger Stand (v0.15.3)

**Stadtmarken skalieren nicht mehr mit dem Zoom.** Sie liegen jetzt wie
die Namen in einer eigenen Ebene außerhalb der gezoomten Bühne; die
Bildschirmpositionen werden bei jeder Ansichtsänderung neu berechnet und
auf ganze Pixel gerundet. Randfall behoben: Solange die Fenstergröße
noch nicht feststeht, wird nicht ausgeblendet - sonst galt jede Marke
als außerhalb und die Karte blieb leer.

**Karte auf feine Auflösung umgestellt** (Natural Earth 10m statt 50m):

| | vorher | jetzt |
|---|---|---|
| Deutschland-Umriss | 562 Punkte | 3.027 Punkte |
| Norwegen-Umriss | 1.985 Punkte | 15.817 Punkte |
| Flüsse | 462 | 1.455 |
| Seen | 412 | 1.355 |

Sichtbar an norwegischen Fjorden, dalmatinischen Inseln und der Ägäis.
Flüsse und Seen werden nach Bedeutung gefiltert - alle zu zeichnen
ergäbe ein unlesbares Adernetz. Projektion unverändert, alle Städte
sitzen weiterhin exakt (geprüft: keine liegt im Wasser). Dateigröße
233 KB.

## Vorheriger Stand (v0.15.2)

**Schrift vereinheitlicht:** Nur noch Tahoma/MS Sans Serif für die
gesamte Oberfläche (Originalschriften von Windows 98). Die Pixelschrift
ist entfernt - damit entfällt auch das Nachladen von Google Fonts, die
Oberfläche läuft jetzt vollständig offline.

**Button-Design zurückgesetzt:** wieder flacher Bevel-Rahmen ohne
abgerundete Ecken, Verlauf oder Schlagschatten. Fensterecken ebenfalls
wieder eckig.

**Kartenschrift scharf gestellt.** Zwei Ursachen für die Unschärfe:
1. Die Namen lagen in der per `transform` skalierten Ebene und wurden
   mit einem Bruchwert gegenskaliert - Text landet dabei zwischen den
   Pixeln. Sie sitzen jetzt in einer eigenen, nicht skalierten Ebene;
   die Positionen werden in JS berechnet und auf ganze Pixel gerundet.
2. Die Zentrierung per `translateX(-50%)` ergab bei ungerader Textbreite
   eine weitere halbe Pixelverschiebung. Namen stehen jetzt unten rechts
   neben der Marke statt zentriert darunter.

Nebeneffekt: Es werden nur noch Namen im sichtbaren Ausschnitt erzeugt,
bei starkem Zoom also eine Handvoll statt 165.

## Vorheriger Stand (v0.15.1)

**Bedienung und Optik:**
- Klickbereich der Stadtmarken deutlich vergrößert (unsichtbarer Rahmen
  von 11 px, Trefferfläche ~27 px statt 5 px)
- Städtenamen erscheinen ab Zoomstufe 2,2 (größere Städte und
  Frachtknoten) bzw. 3,2 (alle). Beschriftungen skalieren gegen den
  Zoom, bleiben also gleich groß
- "Zurück zum Fahrzeug"-Button in Auslastungs- und Historienfenster;
  holt den Fuhrpark nach vorne und stellt ihn wieder her, falls
  minimiert
- Schrift lesbarer: Fließtext in Tahoma/MS Sans Serif (Originalschriften
  von Windows 98), Grundgröße 12 -> 13 px. Pixelschrift nur noch für
  Titelleisten und Überschriften
- Buttons mit abgerundeten Ecken, Verlauf und Schlagschatten; beim
  Drücken sinken sie sichtbar ein

**Bugfix Zwei-Finger-Zoom:** Beim Anheben eines Fingers sprang die Karte.
Ursache war nicht die Zoom-Rechnung (der Punkt zwischen den Fingern
bleibt exakt stehen), sondern der Gestenwechsel: Die Ein-Finger-Logik
rechnete mit dem Startpunkt von vor dem Zoomen weiter.
- Zustandsverfolgung der Geste ("keine"/"ziehen"/"zoomen")
- Griffpunkt wird beim Wechsel von zwei auf einen Finger neu gesetzt
- Maus-Handler ignoriert Ereignisse während einer Fingergeste (manche
  Browser senden nach Berührungen zusätzlich Maus-Ereignisse)
- Randfälle: nachträglich aufgesetzter zweiter Finger, `touchcancel`

## Vorheriger Stand (v0.15.0)

**Karte deutlich ausgebaut** (`assets/sprites/europa.png`):
- Höhenrelief aus 78 echten Gipfelpunkten (Natural Earth), benachbarte
  Gipfel unter 250 km zu Ketten verbunden - ergibt Alpenbogen, Apennin,
  Skanden statt einzelner Kegel. Die Gebirgspolygone von Natural Earth
  wurden bewusst NICHT gefüllt: sie umschließen teils ganze Becken
  (Karpaten das siebenbürgische Hochland) und ergäben falsche Hochflächen
- Flüsse und Seen, Bodentextur, breitenabhängige Schneegrenze
  (Alpen ~2700 m, Nordskandinavien fast auf Meereshöhe)
- Straßennetz eingezeichnet: 452 Verbindungen, davon 70 Fähren
  (gestrichelt). Auswahl je Stadt bis zu 5 Nachbarn innerhalb 420 km,
  Wasseranteil der Strecke aus der Karte geprüft: bis 20 % Straße,
  20-55 % Fähre, darüber verworfen. Alle 165 Städte sind erreichbar
- Verbindungen auch als Daten: `js/data/strassennetz.js` für die
  spätere Routenberechnung

**Stadtmarken** in vier Größen nach Einwohnerzahl (Verteilung 42/46/41/36),
große Städte mit hellem Kern, Frachtknoten weiterhin gelb. Tooltip zeigt
jetzt Land und Einwohnerzahl.

**Einwohnerzahlen korrigiert:** Natural Earth führt 1995er Werte nur für
große Ballungsräume - 118 von 165 Städten hatten keine. Jetzt Rückfall
auf die aktuelle Zahl, das Feld `einwQuelle` hält fest, worauf sich der
Wert bezieht (wichtig, sobald das Frachtaufkommen daran hängt).

**Fuhrpark:**
- Auslastung und Historie in eigene Fenster ausgelagert, erreichbar über
  Buttons neben "Übersicht". Das Fahrzeugbild bekommt den frei
  gewordenen Platz (min. 200 px, wächst mit)
- Auslastungsfenster mit Kennzahlen und Auflistung der Touren im Zeitraum

**Tourenplanung:** Kartenbereich auf 50 % der Fensterhöhe erweitert.

## Vorheriger Stand (v0.14.0)

**Neues Modul: Tourenplanung** (`js/apps/tourenplanung/`)
- Kartenfenster im oberen Bereich (38 % Fensterhöhe, min. 180 px),
  `flex: none` + `flex-shrink: 0` - darf sich durch nichts verkleinern
- Zoom über Buttons, Mausrad und Zwei-Finger-Geste; Verschieben per
  Ziehen (Maus und Touch), mit Randbegrenzung
- 165 Städte als Quadrate ohne Beschriftung, Namen per Tooltip;
  63 Frachtknoten gelb hervorgehoben
- Dispositionsbereich darunter: zeigt gewählte Stadt mit Land,
  Einwohnerzahl 1995 und Koordinaten (Warenangebote folgen)

**Kartendaten:**
- `assets/sprites/europa.png` - Pixelart-Europakarte, gerendert aus
  echten Geodaten (Natural Earth), definierte Projektion
- `js/core/karte.js` - Umrechnung Koordinaten <-> Bildpunkt in beide
  Richtungen (verlustfrei), Luftlinie und geschätzte Straßenentfernung
- `js/data/staedte.js` - 165 Städte mit echten Koordinaten, Länder-
  kürzel, Einwohnerzahlen 1995. Auswahl über Mindestabstand 140 km für
  gleichmäßige Verteilung, plus Pflichtknoten (Häfen, Wirtschafts-
  zentren), die diesen Abstand unterschreiten dürfen

**Fuhrpark verbessert:**
- Ausfall-/Warnhinweis überlagert jetzt das Bild, statt ihm die Höhe zu
  nehmen und es zu beschneiden
- Bauteil-Auswahl erfolgt durch Antippen im Bild statt über ein
  Dropdown (entfernt). Gewähltes Teil wird hervorgehoben, ein
  blinkender Ring markiert die Stelle am Fahrzeug, die Verbindungslinie
  wird kräftiger gezeichnet
- Reparatur-Button zeigt das gewählte Teil und ist ohne Auswahl gesperrt
- Win98-Stil für deaktivierte Schaltflächen ergänzt

## Vorheriger Stand (v0.13.3)

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
      tourenplanung.css
      spielstaende.css
      finanzen.css
  werkzeug/            Skripte zur Datenerzeugung (laufen nicht im Spiel)
    LIESMICH.md        Herkunft und Ablauf
    netz2.py           Straßengraph aus Natural Earth
    routen.py          Städte anbinden, Wege suchen
    strassen_zeichnen.py  Netz in die Karte malen
  docs/
    historischer-rahmen-1994.md   Zeitliche Gegebenheiten (zu verifizieren)
    kosten-1994.md                Kostendaten mit Quellen, offene Punkte markiert
  js/
    core/
      clock.js          Taskbar-Uhr
      startmenu.js       Startmenü-Verhalten
      windowmanager.js   Fenster öffnen/minimieren/schließen (Vollbild, Singleton, Taskleiste)
      verschleiss.js     Verschleiß-/Verbrauchsberechnung (datenquellen-unabhängig)
      spielzeit.js       Spielkalender (Start 01.03.1994)
      fristen.js         HU, SP, Wartung
      historie.js        Ereignis-Chronik je Fahrzeug
      auslastung.js      Auslastung aus Tour-Einträgen
      ausfall.js         Pannen, Stillstand, Bergung
      lackierung.js      Umfärben der Kabine zur Laufzeit
      karte.js           Kartenprojektion und Entfernungen
      wirtschaft.js      Angebot und Bedarf je Stadt
      betrieb.js         Depot und Betriebsdaten
      ladung.js          Eignung, Menge, Frachtpreis
      route.js           Wegsuche über das Straßennetz
      fahrt.js           Laufende Touren mit Etappen und Lenkzeiten
      kunden.js          Auftraggeber und Kundenbindung
      auftraege.js       Auftragspool mit Statusverfolgung
      speicher.js        Spielstände (3 Plätze), Nachsimulation, Protokoll
      finanzen.js        Kontenrahmen, Journal, Monatsabschluss, Kredite
      version.js         Versionsnummer (einzige Pflegestelle)
    apps/
      fuhrpark/
        fuhrpark.js      Fuhrpark-Programm (Zustand, UI, Debug-Buttons)
      tourenplanung/
        tourenplanung.js Karte, Zoom/Verschieben, Disposition
      spielstaende/
        spielstaende.js  Spielstandverwaltung und Abwesenheitsprotokoll
      finanzen/
        finanzen.js      Finanzprogramm (Übersicht, Journal, BWA, Sätze)
    data/
      fahrzeugtypen.js   Katalog fiktiver, an reale 90er-LKW angelehnter Fahrzeugtypen
      staedte.js         165 europäische Städte mit echten Koordinaten
      strassennetz.js    452 Verbindungen mit echtem Verlauf und Länge
      gueter.js          72 Warenarten mit Transporteigenschaften
      regionen.js        25 Wirtschaftsregionen (Angebot/Bedarf)
      kostensaetze.js    Alle Geldbeträge mit Quelle bzw. belegt: false
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

**Prüfungen können durchfallen** - Notiz in `js/core/fristen.js`. HU und
SP sollen ein Ergebnis haben (bestanden / Mängel / erhebliche Mängel),
abhängig vom Zustand der Bauteile. Bei Mängeln läuft die Frist nicht
weiter, das Fahrzeug muss instand gesetzt und nachgeprüft werden; bei
erheblichen Mängeln keine Weiterfahrt. Sinnvoll erst mit dem
Werkstatt-Modul.

**Ausfälle ohne Verschleiß-Unterschreitung** - Notiz in
`js/core/ausfall.js`. Fahrzeuge sollen auch durch zufällige Defekte
(Lichtmaschine, Anlasser, Druckluft), Reifenschaden durch Fremdkörper,
Unfälle oder Winterprobleme liegenbleiben. Wahrscheinlichkeit aus Alter,
Laufleistung, Gesamtzustand und Jahreszeit.

**Stadtpanorama im Kartenfenster** - sobald eine Stadt ausgewählt ist,
soll an die Stelle der Europakarte eine Panorama-Ansicht dieser Stadt
treten, in derselben Pixelart wie der Rest des Spiels. Offen: ein Bild
je Stadt sind 165 Motive - realistischer ist ein Baukasten aus wenigen
Silhouetten je Stadttyp (Seehafen, Binnenhafen, Industriestadt,
Altstadt, Alpenstadt) plus Wahrzeichen für die großen Knoten. Das
Kartenfenster muss dafür zwischen Karte und Panorama umschalten können,
ohne Zoom und Versatz der Karte zu verlieren; ein Knopf für den Weg
zurück zur Karte gehört dazu. Auf der Panorama-Ansicht sitzen keine
Marken - die Routen bleiben nur auf der Karte sichtbar.

**Rundtouren mit mehreren Stopps** - aktuell nur A nach B. Das
Tour-Objekt in  müsste dafür eine Etappenliste führen
statt eines einzelnen Ziels, jede Etappe mit eigener Ladung.

**Streckenprofil aus der Route** - Touren rechnen derzeit mit
Durchschnittswerten für Gelände und Straßenqualität. Sobald die Route
über das Straßennetz berechnet wird, sollten die echten Werte je
Abschnitt einfließen.

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

- Weiteres Programm: Personal-Modul (liefert Fahrverhalten-Faktor)
- Eigenes Pixelart-Icon für Fuhrpark (aktuell Emoji-Platzhalter)
