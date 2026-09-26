# SpediPro 95

Speditionsmanager-Simulator im Windows-98-Look. Europa in den 90er
Jahren, alle Werte und Statistiken orientieren sich an echten Daten.

**Versionierung:** Die zweite Stelle bleibt bei 0.15, bis die
Tourenplanung abgeschlossen ist - bis dahin wird nur die dritte Stelle
hochgezählt (0.15.3, 0.15.4, ...).

**Drei Dokumente gelten für jede Entscheidung in diesem Projekt:**
`docs/kosten-1994.md` für die Zahlen der Spielwelt,
`docs/spieldesign.md` für die Frage, ob eine geplante Funktion
überhaupt eine Entscheidung erzeugt, und
`docs/optik-und-bedienung.md` für die Frage, ob man sie sehen und
anfassen kann. Das zweite endet mit 56 Prüffragen, das dritte mit 74
Prüfregeln und einer Annahmeliste von 32 Testfällen - jeweils samt
einem Abschnitt, der sie auf den aktuellen Stand von SpediPro anwendet,
einschließlich der Stellen, an denen wir gerade dagegen verstoßen.

Der kürzeste Befund aus dem dritten: **Der 98er-Look ist nicht das
Problem, die 98er-Maße sind es.** Der Textkontrast lag schon immer bei
11,54:1 (gefordert: 4,5:1), aber 100 % der Textstellen lagen unter der
Mindestgröße von 18 px und 57 % der Bedienelemente unter 44 px
Trefferfläche. Die Auflösung heißt nicht „weniger 98", sondern
**98 bei 150 dpi**: Proportionen treu, absolute Größen angehoben,
Skalierung als Einstellung - und sichtbare Größe getrennt von der
Trefferfläche. Seit dem Umbau vom 26.09.2026 ist das gebaut und
gemessen: keine Textstelle unter 18 px, keine Trefferfläche unter
44 px, 200 % Vergrößerung ohne abgeschnittenen Text, Einstellungen
unter Start → Einstellungen → Anzeige.

## Geplant: Lizenzen, Genehmigungen und Berechtigungen

*Entwurf, noch nichts davon gebaut. Zahlen sind bis zur Recherche
Platzhalter und als solche gekennzeichnet.*

Der Spieler soll nicht von Anfang an überallhin fahren und alles laden
dürfen. Er erarbeitet sich das Recht dazu Stück für Stück. Das ist
kein Kunstgriff: 1994 war der Güterkraftverkehr in Deutschland genau
so gestaffelt - der Nahverkehr frei, der Fernverkehr kontingentiert,
das Ausland an Lizenzen und zwischenstaatliche Kontingente gebunden.
Die Spielmechanik ergibt sich aus der Rechtslage, nicht umgekehrt.

### Drei Ebenen

Eine Fracht lässt sich nur fahren, wenn alle drei zusammenpassen:

| Ebene | Was sie sperrt | Wo sie sitzt |
|---|---|---|
| **Betrieb** | Fernverkehr, EU-Ausland, einzelne Drittländer, Abfall | neues Programm „Genehmigungen" |
| **Fahrzeug** | Kühlkette (ATP), Tank, Silo, Schwerlast | Fristen-Modul, wo HU und SP schon liegen |
| **Fahrer** | Führerscheinklasse, ADR | Personalmodul, sobald es kommt |

Solange es kein Personal gibt, hält der Unternehmer selbst die
Fahrerqualifikationen - mit dem Personalmodul wandern sie an die
einzelne Person, und plötzlich ist es ein Unterschied, wer fährt.

### Die vier Währungen des Fortschritts

Damit sich Berechtigungen nicht einfach kaufen lassen, kostet jede
eine andere Mischung aus vier Dingen:

1. **Geld** - Lehrgangs- und Prüfungsgebühren, Verwaltungsgebühren.
2. **Zeit** - Lehrgänge dauern Tage, Behörden bearbeiten Wochen. Beides
   läuft in der Spielzeit mit, wie eine Tour. Man beantragt und wartet.
3. **Voraussetzungen** - manches setzt anderes voraus: ohne fachliche
   Eignung keine Fernverkehrsgenehmigung, ohne nationale Genehmigung
   keine EU-Lizenz. Dazu **finanzielle Leistungsfähigkeit**: ein
   Mindest-Eigenkapital je Fahrzeug, das die Buchhaltung ausweist.
4. **Knappheit** - Fernverkehrsgenehmigungen und Drittland-Kontingente
   waren begrenzt. Sie sind nicht bestellbar, sondern stehen auf einer
   Warteliste oder werden von einem aufgebenden Kollegen übernommen.
   Das ist der eigentliche Engpass des Aufstiegs.

Dazu ein fünftes, das nur verloren gehen kann: **Zuverlässigkeit**.
Lenkzeitverstöße, Überladung, versäumte HU, reihenweise verspätete
Lieferungen - das führt zu Auflagen, im Wiederholungsfall zum Entzug
der Genehmigung. Die Kundenbewertung, die es schon gibt, bekommt damit
ein behördliches Gegenstück.

### Der Stufenplan

**1. Nahverkehr.** Start mit einem 3,5-t-Transporter, 50 km um das
Depot. Keine Genehmigung nötig - so war es auch in Wirklichkeit.
Kleine Frachten, kleine Erlöse, Klasse 3 reicht.

**2. Fachliche Eignung.** Lehrgang und IHK-Prüfung. Kostet Geld und
mehrere Wochen, in denen der Betrieb weiterläuft. Schlüssel zu allem
Weiteren.

**3. Güterfernverkehrsgenehmigung.** Braucht fachliche Eignung,
Zuverlässigkeit und Eigenkapitalnachweis - und einen freien Platz im
Kontingent. Ab hier fällt die 50-km-Grenze im Inland.

**4. Führerschein Klasse 2 und der erste schwere Zug.** Fahrschule,
ärztliche Untersuchung, Gebühren. Erst jetzt lohnen sich die
Sattelzüge, die heute am Anfang stehen.

**5. Gemeinschaftslizenz (EU-Lizenz).** Auf Grundlage der nationalen
Genehmigung. Öffnet die EG-Staaten - und damit den halben Kontinent.

**6. Drittländer.** Schweiz, Polen, Tschechien, Ungarn, Jugoslawien,
Österreich bis zum Beitritt 1995: bilaterale Genehmigungen oder
CEMT-Genehmigung, jahresweise zugeteilt und je Fahrt verbraucht.
Österreich zusätzlich mit **Ökopunkten** ab 1993 - je Transitfahrt
ein Kontingent, dessen Verbrauch vom Stickoxidwert des Fahrzeugs
abhängt. Ein sauberer Motor wird damit zur Fahrerlaubnis.

**7. Spezialisierungen.** Jede öffnet einen Frachtbereich:

- **ADR** - Gefahrgutfahrerschulung (Basiskurs, Aufbaukurse für Tank
  und einzelne Klassen), fünf Jahre gültig, danach Auffrischung. Dazu
  im Betrieb der **Gefahrgutbeauftragte** mit eigener Prüfung.
- **ATP/FRC** - Bescheinigung für den Kühlkoffer, sechs Jahre, dann
  Nachprüfung. Läuft sie ab, ist der Kühlauflieger totes Kapital.
- **Beförderungserlaubnis Abfall** - Zuverlässigkeit und Sachkunde,
  öffnet Abfall und Schrott.
- **Schwertransport** - Dauer- oder Einzelerlaubnis nach StVO, mit
  Auflagen, Begleitfahrzeugen und eigener Routenprüfung.

### Anschluss an das, was schon steht

Der Eingriff ist kleiner, als er klingt:

- Die Frachtliste sperrt heute schon Zeilen mit Begründung. Statt
  „Kein passender Aufbau verfügbar" stünde dort „ADR-Schein fehlt"
  oder „Keine Genehmigung für Polen".
- `route.js` muss die **durchfahrenen Länder** liefern, nicht nur das
  Ziel - sonst prüft man die Erlaubnis für Italien und fährt ohne
  Ökopunkte durch Österreich.
- Das Fristen-Modul kann Gültigkeiten und Nachschulungen bereits; ATP
  und ADR sind nur weitere Fristen.
- Die Buchhaltung liefert den Eigenkapitalnachweis und bucht Gebühren
  und Lehrgänge als Betriebsausgaben.
- Neues Programm **„Genehmigungen"** auf dem Schreibtisch: eine
  Aktenübersicht mit vier Zuständen je Eintrag - *vorhanden* (mit
  Ablaufdatum), *beantragt* (mit Restlaufzeit), *möglich* (alle
  Voraussetzungen erfüllt, Antrag stellen) und *gesperrt* (mit der
  Liste dessen, was noch fehlt). Letzteres ist die Fortschrittsanzeige
  des Spiels.

### Zu recherchieren, bevor gebaut wird

Nichts davon setze ich aus dem Gedächtnis an. Offen sind:
Kontingentgrößen und Vergabepraxis der Fernverkehrsgenehmigungen,
Gebühren und Lehrgangskosten 1994, Bearbeitungsdauern der Behörden,
die Marktpreise gehandelter Genehmigungen, die Ökopunkte-Rechnung, die
Mindest-Eigenkapitalsätze je Fahrzeug und die Führerscheinkosten der
Zeit. Verfahren wie beim Kostenmodul: erst Quellen sammeln, dann
Zahlen setzen, Platzhalter ausdrücklich kennzeichnen.

## Geplant: Freischaltung — die Werkzeuge sind Menschen

*Entwurf, noch nichts davon gebaut. Verzahnt sich mit dem
Lizenzkapitel darüber: Das regelt, wohin man fahren und was man laden
darf, dieses hier, wer die Tour zusammenstellt.*

### Der Befund

Gemeldet wurde nach einem Test am Schreibtisch: die Tourenplanung ist
zu umfangreich und zu schwerfällig; das Planen soll spannend sein und
nicht durch zu viele Möglichkeiten unverständlich werden.

Nachgezählt, was in jedem Schritt gleichzeitig auf dem Bildschirm
steht (bedienbare Elemente, Zahlen mit Einheit, Wörter):

| Schritt | bedienbar | Zahlen | Wörter |
|---|---|---|---|
| Übersicht, keine Stadt gewählt | 0 | 0 | 13 |
| **1 Fracht wählen** | **17** | **24** | **300** |
| 2 Ziel wählen | 4 | 6 | 58 |
| 3 Fahrzeug wählen | 5 | 6 | 52 |
| 4 Durchsicht, 1 Sendung | 14 | 18 | 137 |
| **4 Durchsicht, 3 Sendungen** | **29** | **31** | 223 |

Die Auskunft ist eindeutig: **Schritt 2 und 3 sind in Ordnung** - vier
bis fünf Dinge, sechs Zahlen. Das Problem sitzt in Schritt 1 und 4.

Schritt 1 überfällt mit 300 Wörtern, bevor irgendetwas entschieden
ist: Jede Frachtzeile trägt Aufbaukürzel, Ziel, Nummer, Tonnage, Ware,
Kilometer, Entgelt, Auftraggeber, Frist, Fristbalken und Restmenge.
Zum Wählen braucht man drei Angaben - wohin, wieviel Geld, wie eilig.

Schritt 4 hat 29 Werkzeuge, fast alle zum Reparieren: Pfeile zum
Umsortieren, Löschen und Ändern je Sendung, „+ Sendung" je Halt,
Einklappen, vier Frachtbrieffelder, zweimal Verwerfen. Jedes einzelne
war für sich begründet (0.15.34 bis 0.15.38). Zusammen sind sie ein
Cockpit und kein Spiel.

### Die Lösung: nicht ausdünnen, sondern verdienen

Die Werkzeuge verschwinden nicht - sie kommen später. Und der Grund
dafür ist keine Bedienungsregel, sondern eine Tatsache über den
Betrieb: **Eine Ein-Mann-Spedition macht keine
Beiladungsoptimierung.** Der Unternehmer fährt selbst, nimmt einen
Auftrag und fährt ihn. Beiladung, Stoppfolgen und Mengenkalkulation
sind der Beruf eines Disponenten, und den stellt man ein, wenn der
Betrieb ihn trägt.

Damit ist das Ausdünnen keine Notlösung, sondern die Wahrheit über den
Betrieb, den man gerade führt - und die Fahrer und der Disponent
bekommen einen Grund zu existieren, der über ein Gehalt hinausgeht.

### Die Treppe

**Stufe 1 - Du fährst selbst.** Ein 3,5-t-Transporter, Nahverkehr,
50 km ums Depot. Der Ablauf: Stadt antippen → Fracht wählen →
losfahren. Kein Fahrzeugschritt, weil es nur ein Fahrzeug gibt. Keine
Beiladung, kein Umsortieren, keine Mengenwahl. **Zwei Entscheidungen
statt siebzehn.**

Die 50-km-Grenze aus dem Lizenzkapitel kürzt die Frachtliste dabei von
selbst: Die 300 Wörter schrumpfen nicht, weil etwas versteckt wird,
sondern weil es weniger zu holen gibt. Die Entscheidung bleibt echt -
von den erreichbaren Aufträgen ist einer der beste, und welcher, sagt
**DM je Tag**.

**Stufe 2 - Der zweite Wagen.** Jetzt erscheint der Fahrzeugschritt,
weil er jetzt eine Wahl ist. Vorher wäre er ein Klick ohne
Entscheidung gewesen.

**Stufe 3 - Der erste angestellte Fahrer.** Aus „welcher Wagen" wird
„wer fährt". Derselbe Schritt, aber jetzt steht ein Mensch darin, der
seine Eigenheiten hat.

**Stufe 4 - Der Disponent.** Mit ihm kommen **Beiladung und
Mengenwahl**. Er füllt die Wagen - das ist sein Beruf, und deshalb
kann man es ab jetzt.

**Stufe 5 - Das Büro.** Stoppfolgen von Hand umsortieren, mehr als
zwei Sendungen je Tour. Feinwerkzeug für den, der es will.

### Zwei Regeln, ohne die es nicht funktioniert

**Was gesperrt ist, muss sichtbar sein.** Sonst ist es kein
Versprechen, sondern Abwesenheit, und der Spieler erfährt nie, dass es
mehr gibt. Eine graue Zeile genügt: `+ Beiladung — ab dem ersten
Disponenten`. Einmal, nicht als Dauerwerbung.

**Was gesperrt ist, darf nie nötig werden.** Solange Umsortieren
gesperrt ist, darf keine Lage entstehen, die es verlangt. Deshalb
hängt die Sendungsgrenze an der Stufe: eine, dann zwei, dann vier. Bei
einer Sendung gibt es nichts zu sortieren.

### Anschluss an das, was schon steht

- `SENDUNGEN_MAX` in der Disposition ist heute ein Festwert (4) und
  wird zur Stufengröße.
- Die Werkzeuge sind alle vorhanden und geprüft - Beiladung (0.15.28),
  Mengenregler (0.15.36), Handreihenfolge (0.15.38). Es kommt je eine
  Bedingung davor, kein neuer Code dahinter.
- `kunden.js` führt Bindungsstufen; ein Personalmodul gibt es noch
  nicht. Fahrer müssen Entitäten mit Kennung werden, so wie die Kunden
  es schon sind.
- Die Bilder (Pixelgrafik, 256 Farben) brauchen dieselbe eine Stelle,
  die aus einer Kennung ein Bild macht - für Waren, Städte, Fahrzeuge,
  **Fahrer und Kunden**.

### Was damit noch nicht gelöst ist

Die Treppe macht den Anfang einfach. Sie macht ihn nicht spannend.
Spannung entsteht aus **Knappheit**, nicht aus Möglichkeiten: ein
Wagen und drei gute Aufträge, eine Frist, die wirklich knapp ist,
Geld, das für den zweiten Wagen gerade nicht reicht. Die Bausteine
sind da - Frist, Kontostand, Kreditlinie -, sie werden nur nicht
inszeniert. Das ist das nächste Thema nach diesem.

## Geplant: Weniger Zahlen, mehr Ansage

*Entwurf aus dem Gespräch vom 24.09.2026, noch nichts davon gebaut.
Hängt am Kapitel darüber: Die Ansagen sollen später aus dem Telefon
kommen.*

### Der Befund

In der Durchsicht stehen zehn Zeilen, aufgeklappt vierzehn. Dazu je
Tag, je Tonne, Restkapazität, Fristen. Das ist über 0.15.39 bis
0.15.41 gewachsen, jede Ergänzung für sich begründet - zusammen sind
sie ein Steuerberaterfenster.

Der Fehler dahinter: Die Zusammenfassung beantwortet **zwei
verschiedene Fragen zugleich**. "Soll ich das fahren?" braucht eine
Zahl und ein Urteil. "Warum ist das so?" braucht die ganze Rechnung -
aber nur, wenn jemand sie sucht. Gebaut wurde die zweite; die erste
wurde nie ausgesprochen.

### Die Ansage

Ganz oben steht, was Sache ist, in fünf Stufen:

```
  Da bleibt richtig was übrig.
  Verdient sich.
  Geht so.
  Lohnt kaum.
  Da legst du drauf.
```

Dazu die Farbe, die es schon gibt: grün, grau, rot.

Entscheidend ist nicht nur das Wort, sondern die **Wortart**.
"Mittelmäßig" ist eine Note - man fragt sofort: gemessen woran?
"Geht so" ist ein Satz, den der Spieler selbst sagen würde, und er
braucht keinen Vergleich. Wer auf Anhieb verstehen soll, ob es gut
war, darf nicht über die Worte nachdenken müssen.

**Die Ansage kommt von dem, der fährt.** Anfangs vom Spieler selbst -
er sitzt ja noch im Wagen -, später vom Fahrer, und mit dem
Telefonkapitel dann buchstäblich als Anruf. Damit ist "Geht so" nicht
die Anzeige eines Systems, sondern jemand, der die Schultern zuckt.
Das hat eine Folge, die vorher zu klären ist: Sobald Sätze von
Personen kommen, müssen sie zur Person passen. Der wortkarge Fahrer
sagt etwas anderes als der, der gern redet - und dieselbe Tour klingt
dann bei zweien verschieden.

### Die Rechnung dahinter, in derselben Sprache

Aufgeklappt, nicht im Weg:

```
  Eingenommen                    357 DM
  Sprit                        − 52 DM
  Reifen und Verschleiß        − 22 DM
  Miete, Steuer, Versicherung  − 29 DM
  ────────────────────────────────────
  Bleibt übrig                  254 DM
```

**Der Deckungsbeitrag fällt weg.** Er ist eine Zwischensumme für
Betriebswirte; der Spieler braucht ihn nicht. "Fixkosten anteilig"
wird zu dem, was es ist - Miete, Steuer, Versicherung. Aus
"Reingewinn" wird "bleibt übrig", weil das dasselbe heißt und niemand
darüber nachdenken muss.

Das ist dieselbe Übersetzung, die die Buchhaltung in 0.15.37 schon
bekommen hat ("Sprit" statt "Kraftstoffe", "Wertverlust" statt
"Abschreibungen"). Die Disposition ist dabei stehengeblieben.

**Was an Fachsprache bleibt**, weil es zur Welt gehört und den Spieler
zum Spediteur macht: Frachtbrief, Ladefenster, Standzeit, Rampe,
Disposition. Deckungsbeitrag macht ihn zum Buchhalter - das ist der
Unterschied.

### Die Listen

In Zielliste und Auftragsübersicht steht heute "367 DM je Tag" - eine
Zahl, mit der man erst etwas anfangen kann, wenn man die anderen
danebenhält. Ein Balken mit einem Wort sagt dasselbe schneller, und
den Balken gibt es schon. Die genaue Zahl bleibt im Tooltip.

### Noch offen

- **Relativ oder absolut?** Ein relatives Urteil misst an dem, was
  dieser Wagen sonst verdient, und wandert mit, wenn die Flotte
  wächst. Ein absolutes braucht feste Schwellen, die erfunden wären.
  Neigung: relativ.
- **Merkt sich der aufgeklappte Zustand, wer da spielt?** Wer einmal
  aufklappt, will es vermutlich immer sehen. Dann wäre es kein
  Verstecken, sondern eine Voreinstellung für die, die erst spielen
  und später rechnen wollen.
- Verzahnung mit der **Freischaltungstreppe**: Der Zahlendruck ist am
  Anfang am größten, wenn man einen Wagen hat und nichts zu
  vergleichen. Dort müssten von den zehn Zeilen drei stehen.

## Geplant: Konkurrenz, das Telefon und die dunkle Seite

*Entwurf aus dem Gespräch vom 24.09.2026, noch nichts davon gebaut.
Setzt das Freischaltungskapitel darüber fort: Das regelt, wie der
Betrieb wächst, dieses hier, gegen wen.*

### Der Befund

Ein Ruf- oder Prestigewert ohne Gegenüber ist nur eine zweite Anzeige
für dasselbe Geld. Wer sagen will "ich bin besser", braucht jemanden,
der schlechter ist. Die Konkurrenz **gibt es im Spiel schon** - sie ist
nur unsichtbar: `VERFALL_TAGE = 2` in `auftraege.js` trägt den
Kommentar "wie lange ein Auftrag am Markt bleibt, bevor ihn jemand
anders nimmt". Jeder verfallene Auftrag ist ein Konkurrent, der
schneller war. Im Protokoll steht nur "A-1048 verfallen".

### Die Regel, die sich dabei geändert hat

Bis hierher galt: jede Zahl belegt oder ausdrücklich als unbelegt
gekennzeichnet. Das bleibt - aber nur dort, wo es hingehört.

> **Belegt bleibt, was der Spieler nachrechnet.
> Frei ist, was er erlebt.**

Dieselpreis, Abschreibung, Frachtsätze, Lenkzeiten, Steuern: weiter
recherchiert, weil das Spiel ein Rechenspiel ist und ein falscher Satz
sich als falsch anfühlt. Figuren, Anrufe, Ereignisse, Schmuggelgut und
Tonfall: erfunden, zugespitzt, auf Spielbarkeit hin gebaut. Ein
Schmuggelauftrag muss sich nicht auf eine Verbrauchsteuertabelle
berufen - er muss sich lohnen und weh tun können.

Damit entfällt die Recherchelast, die für dieses Kapitel sonst
angefallen wäre: Kabotage-Kontingente, BAG-Bußgelder in DM,
Verbrauchsteuerdifferenzen nach 1993. Gebraucht wird keine Tabelle,
sondern eine Kontrolle, die sich gefährlich anfühlt.

### Die Konkurrenten sind Personen - und dasselbe System wie alle anderen

Konkurrent, Kunde und Fahrer unterscheiden sich in der Mechanik kaum:
eine Firma oder ein Mensch, ein Gesicht, eine Beziehung, die sich über
Zeit verändert. Der Namensgenerator dafür steht schon in `kunden.js`.
Wer das einmal baut, bedient alle drei.

**Fünf bis acht mit Gesicht**, der Rest namenlos. Acht Gesichter kann
man sich merken, dreißig nicht. Jeder mit einem Charakter, der sein
Verhalten erklärt:

- der **Platzhirsch** mit dreißig Zügen, der nach der Tarifaufhebung
  nicht mehr mitkommt
- der **Billigheimer**, der jeden Preis unterbietet und dessen Fahrer
  übermüdet sind
- der **Spezialist**, der nur Gefahrgut fährt und dich nicht als
  Gegner sieht
- der **Aufsteiger**, der dasselbe macht wie du, nur einen Monat
  voraus

### Das Telefon

1994 spricht man nicht über ein Dialogfenster, sondern über Telefon
und Fax. Ein Programm "Telefon" auf dem Schreibtisch, mit
Anrufbeantworter und Wählscheibe; ein Faxgerät, das Papier ausspuckt.
Das ist keine Dekoration, es ändert die Dramaturgie:

- Ein Anruf **kommt herein**, während man disponiert, und unterbricht.
  Man kann rangehen oder klingeln lassen.
- Der Anrufbeantworter sammelt das Verpasste. Wer dreimal vergeblich
  anruft, ruft beim Nächsten an.
- Ein Fax ist verbindlich und liegt herum. Ein Telefonat gibt es nur
  mündlich - und genau das macht es für die dunkle Seite brauchbar.

**Man sieht sein Gegenüber.** Links ein Porträt im Rahmen, daneben
Name, Firma und eine Zeile, wie man zueinander steht; darunter die
Antworten. Das Bild **bewegt sich ein wenig** - blinzeln, den Kopf
neigen, die Miene wechseln, je nach dem, was gesagt wurde. Zwei, drei
Bildzustände je Figur genügen. Der Unterschied zwischen einem
Standbild und einem Gesicht, das reagiert, ist der zwischen Text und
Charakter; die Wirtschaftssimulationen der Zeit haben genau davon
gelebt.

Zwei Dinge, die daran hängen:

- Die Porträts brauchen **eine gemeinsame Bildregel** - gleicher
  Ausschnitt, gleiche Blickrichtung, gleiche Lichtquelle, gleiche
  Palette, Kleidung von 1994. Sonst sieht die Belegschaft aus wie aus
  fünf verschiedenen Spielen. `werkzeug/sprite-aufbereiten.py` kann
  Raster und Palette schon, ist aber auf Fahrzeuge vor Weiß
  zugeschnitten; Gesichter brauchen einen eigenen Durchlauf, und die
  Umfärberegel gilt für sie nicht.
- **Die Figur kommt vor dem Bild.** Wer ist das, was will er, wie
  redet er - und erst danach, wie er aussieht. Sonst bekommt man
  hübsche Fremde.

### Die graue Seite

Was jeder machte und kaum jemand so nannte:

- **Preisabsprachen.** Nach dem Wegfall des Tarifs riefen sich die
  Alteingesessenen an. Wer sich hält, verdient besser; wer ausschert,
  gewinnt den Auftrag und verliert die Beziehung. Spielerisch das
  reichhaltigste Element, weil es eine echte Gefangenendilemma-Struktur
  hat - und es fällt genau in den historischen Augenblick des
  Spielstarts.
- **Überladung.** Ein paar Tonnen mehr, billiger je Tonne, höheres
  Risiko bei der Kontrolle, mehr Verschleiß. Im vorhandenen Modell
  sauber messbar.
- **Lenkzeiten.** Der Fahrtenschreiber von 1994 ist eine Wachsscheibe.
  Der Fahrer fährt durch, die Tour wird pünktlich - der Preis steht bei
  der nächsten Kontrolle und in der Gesundheit des Fahrers.
- **Gefälligkeiten.** Aushilfsfahrzeug leihen, einen Auftrag abgeben,
  wenn man selbst nicht kann. Die helle Seite derselben Beziehung.

### Die dunkle Seite

Drei Schmuggelgüter, bewusst so gewählt, dass sie sich spielerisch
unterscheiden und nicht drei Namen für dasselbe sind:

| | Eigenschaft | wofür es steht |
|---|---|---|
| **Zigaretten** | viel Volumen, guter Aufschlag, leicht zu finden | das Brot |
| **Alkohol** | schwer und laut, sprengt den Transporter, Bruchrisiko | braucht einen richtigen Wagen |
| **Medikamente** | eine Kiste, kaum Gewicht, höchster Wert je m³ | die Stufe, bei der man kurz überlegt |

Dazu passt eine Eigenschaft, die das Spiel schon hat: Die Preisstaffel
belohnt kleine Sendungen je Tonne am stärksten. Eine Kiste in einem
sonst legal beladenen Wagen ist mechanisch bereits das Lukrativste,
was es gibt.

Weiter im Dunkeln: Abfall nach Osten (`abfall` und `schrott` stehen
schon im Warenkatalog), nicht deklariertes Gefahrgut, und ein
Auflieger, von dem man weiß, wo er steht.

**Nicht gebaut wird:** Menschenhandel, Waffen, Drogen. Nicht aus
Prüderie, sondern weil es den Ton kippt. Das Spiel handelt von einem
Mann mit einem Transporter, der zu wenig verdient; die Versuchungen
sollen in dieser Welt bleiben und alltäglich wirken. Eine Palette
unverzollter Zigaretten ist die richtige Größenordnung.

**Wie man davon erfährt: durch einen Anruf.** Kein Menüpunkt, keine
Freischaltung. Irgendwann, wenn es finanziell eng ist, meldet sich
jemand mit einem Angebot, das zu gut klingt. Dann ist es eine
Entscheidung und keine Funktion.

### Das Gegengewicht

Ohne Gegenkraft ist die dunkle Seite nur ein besserer Preis, und dann
nimmt sie jeder. Es braucht drei:

- **Das BAG** kontrolliert am Straßenrand und im Betrieb. Eine
  Kontrolle ist ein Ereignis mit Ausgang, kein Würfelwurf im
  Hintergrund - man sieht den Wagen stehen und wartet.
- **Die Versicherung** zahlt nicht, wenn die Ladung nicht die war, die
  im Frachtbrief stand.
- **Die Kunden.** Ein Vertragskunde, der davon Wind bekommt, kündigt;
  seriöse Verlader wollen keinen Ärger.

Entscheidend: Das Risiko **steigt, je öfter man es tut**. Einmal ist
ein Fehltritt, zehnmal ist ein Muster, und Muster fallen auf.

### Ruf ist zwei Zahlen, nicht eine

Das **Ansehen bei den Verladern** entscheidet, wer anruft - als
Kundenstufen von "Frachtbörse" bis "Vertragskunde" bereits gebaut. Der
**Ruf in der Branche** entscheidet, wer hilft und wer schneidet: ob der
Platzhirsch zur Absprache einlädt, ob jemand einen Auftrag abgibt, wenn
es klemmt, ob jemand ein Fahrzeug leiht.

Die beiden laufen nicht parallel, und darin liegt das Spiel. Wer nur
sauber fährt, bleibt allein und langsam. Wer nur mauschelt, hat Freunde
in der Branche und keine anständigen Kunden mehr. Interessant ist die
Mitte.

Und damit beantwortet sich die Ausgangsfrage ohne fremde Bilanzen:
"Ich bin besser" heißt nicht "ich habe mehr Geld", sondern *von den
vierzehn Verladern in meiner Region rufen mich neun direkt an; bei
Kruse sind es noch drei.* Jeder Kunde, der nicht dich anruft, ruft
einen anderen an - mehr Konkurrenzmodell braucht es nicht.

### Reihenfolge

1. Konkurrenten mit Namen und Gesicht, dazu das Telefon. Trägt für
   sich und macht das Spiel sofort lebendiger.
2. Die Absprachen - die reichste Mechanik, und sie braucht nichts
   Neues außer dem Telefon.
3. Das Dunkle, zuletzt, wenn das Gegengewicht steht.

**Ausdrücklich nicht geplant:** eine Rangliste mit simulierten Firmen
und Bilanzen, wie Transworld (Starbyte, 1990) sie hatte. Sie wäre ein
zweites Wirtschaftsmodell neben unserem, ihre Zahlen wären frei
erfunden, und sie verengt das Ziel auf eine Punktzahl. Ein Spediteur
von 1994 kannte die Bücher seiner Konkurrenten ohnehin nicht - er
merkte, dass er Aufträge verlor.

## Aktueller Stand (v0.15.43)

**Umgebaut nach `docs/optik-und-bedienung.md`: die 98er-Optik
skaliert, statt zu schrumpfen.**

### Der Befund

Die Recherche hatte vier Stellen benannt, an denen der Nachbau gegen
dokumentierte Untergrenzen verstößt. Gemessen war es schlimmer als
vermutet:

- **100 % der Textstellen** lagen unter der Mindestgröße von 18 px,
  die häufigste Schriftgröße war 11 px, die kleinste 10 px.
- **57 % der Bedienelemente** waren kleiner als 44 px Trefferfläche,
  24 % sogar kleiner als 24 px.
- **190 von 190 Schriftgrößen** standen in festen Pixelwerten. Es gab
  keine einzige Stelle, an der man hätte drehen können - die Forderung
  nach 200 % Vergrößerung war damit nicht verletzt, sondern gar nicht
  erst erfüllbar.

Nicht verstoßen hat ausgerechnet das, was man vermuten würde: Der
Textkontrast liegt bei 11,54:1 gegen geforderte 4,5:1, die Titelleiste
bei 16,01:1, Listen bei 21:1. Der Look war nie das Problem. Die Maße
waren es.

### Was jetzt anders ist

**Eine Größe, aus der alles folgt.** `html { font-size: calc(18px *
var(--skala)) }`, und jede Länge steht in `rem`. Umgerechnet wurde mit
1/11, weil die alte Oberfläche auf 11 px aufgebaut war: **1rem sind 11
alte Pixel.** Alles wächst um denselben Faktor 1,636, die Proportionen
bleiben exakt die des Originals. Das ist kein Kompromiss am Look,
sondern Windows 98 bei 150 dpi statt bei 96 - das Original hatte selbst
eine Einstellung "Große Schriftarten".

`werkzeug/css-auf-skala.py` hat 603 Deklarationen umgerechnet und
protokolliert, was es bewusst ausgelassen hat: alles unter 3 px (der
1-px-Bevel **ist** der Look), Ränder und Schatten, alles was
Pixelgrafik bemisst, und die Bedingungen von Media Queries.

**Aus zehn Schriftgrößen wurden vier.** 18 / 21 / 26 / 36 px, in den
alten Verhältnissen (11 : 13 : 16 : 22). Die zehn gewachsenen Größen
waren Wildwuchs; Windows 98 kannte praktisch zwei.

**Die Trefferfläche ist nicht mehr die sichtbare Fläche.** 35
Schaltflächen sehen weiterhin kleiner aus als 44 px und sind trotzdem
44 px groß - über ein Pseudoelement, das über den Knopf hinausragt. Wo
Knöpfe im Original aneinanderkleben (Titelleiste), reicht das nicht:
dort wächst der Abstand am Finger wirklich. Geprüft wurde das mit
echten Zeigerklicks statt mit erzeugten Ereignissen, weil nur das
zeigt, ob sich vergrößerte Flächen gegenseitig verdecken.

**Neues Programm: Eigenschaften von Anzeige** (Start → Einstellungen →
Anzeige). Sechs Größenstufen von "so klein wie Windows 98 wirklich war"
bis doppelt, vier Zeilendichten, Kontrastschalter, Eingabeart. Die
Werte liegen in einem eigenen Speicherschlüssel und **überleben das
Löschen des Spielstands** - wer seine Oberfläche mühsam eingestellt
hat, soll sie nicht mit dem Spielstand verlieren.

**Hoher Kontrast als Modus, nicht als neuer Standard.** Vier eigene
Kantenfarben liegen getrennt von den Textfarben. Im Standard trägt die
dunkle Kante den Zustand mit 5,70:1; im Kontrastmodus liegen alle vier
Kanten über 3:1 (5,97 / 11,54 / 3,79 / 5,97). Der Standardlook bleibt
unverändert 98.

### Was es gekostet hat

Eine Stelle, und die soll nicht verschwiegen werden: Der aufgeklappte
Frachtbrief und die volle Auswahlliste passen auf einem 400x880-Gerät
nicht mehr beide in voller Größe untereinander. Vorher hatte die Liste
dort elf Zeilen, jetzt vier. Ohne den neuen Deckel auf dem Frachtbrief
wären es null gewesen - das war der eigentliche Fund. `browsertest-platz.js`
misst diese Schwelle seither in **Zeilen statt in Pixeln**, weil
"200 px" seit der Skalierung keine Aussage mehr ist.

Dichte gegen Lesbarkeit, und die Lesbarkeit hat gewonnen. Das
Gegenmittel steht im Anzeigefenster.

### Geprüft

`browsertest-optik.js` prüft zwölf Regeln maschinell, alle bestehen:
keine Textstelle unter 18 px (0 von 318), keine Trefferfläche unter
44 px (0 von 70), keine schneidenden 24-px-Kreise, bei 200 % kein
waagerechtes Rollen und kein abgeschnittener Text, **keine einzige
Textfarbe** unter 4,5:1 bzw. 3:1, null Animationen bei
`prefers-reduced-motion`, Einstellungen überleben den Spielstand.
Dazu `browsertest-echtklick.js` mit echten Zeigerklicks. Die 25
bestehenden Browsertests laufen unverändert durch.

### Die größte offene Lücke

**Die Tastatur.** Maus und Finger sind geprüft, die Tastatur nicht: Es
gibt keine Fokusreihenfolge, keine sichtbaren Fokusrahmen, keine
Tastenkürzel. Regel 64 verlangt, dass jede Region der Oberfläche mit
derselben Eingabeart erreichbar ist - für die Tastatur ist sie das
nicht. Das sollte der nächste Schritt an der Oberfläche sein.

## Vorheriger Stand (v0.15.42)

**Umgebaut nach `docs/spieldesign.md` - und dabei einen Fehler
gefunden, der das halbe Spiel lahmlegte.**

### Der Wagen stand still, und niemand hatte es gemerkt

Die Regeln 5 und 6 fragen, ob der Spieler überhaupt eine Wahl hat.
Geprüft wurde das nicht mit einer Meinung, sondern mit einer
Monatsprobe: vier Spielweisen (immer der kürzeste Lauf, der beste je
Tag, das höchste Entgelt, der längste Lauf), gleiche Startlage, 30
Spieltage, und am Ende zählt der Kontostand.

Das Ergebnis war vernichtend: **Der Transporter fuhr in dreißig Tagen
eine einzige Tour** und stand 710 von 720 Stunden herum.

Der Grund lag in `auffrischen()`. Die Mindestzahl von Aufträgen "vor
der eigenen Tür" wurde über **alle** eigenen Orte zusammen gezählt.
Das Depot allein erfüllte sie - also bekam ein Wagen, der nach einer
Tour in Leipzig stand, dort **null** Aufträge. Er konnte nur noch leer
nach Hause fahren oder warten. Die Mindestzahl gilt jetzt **je Ort**
(sechs, davon mindestens zwei, die der kleinste Wagen der Flotte auch
laden kann).

| | vorher | jetzt |
|---|---|---|
| Touren in 30 Spieltagen | 1 bis 17 | **48 bis 68** |
| Leerlauf | 278-710 Std | **0-376 Std** |
| Angebot am Standort | 0,0-0,2 | **2,2** |

Das ist der teuerste Einzelfund dieses Projekts bisher, und er wurde
nicht durch Spielen entdeckt, sondern durch eine Prüffrage aus der
Literatur.

### Die 4,4-fache Dominanz des Kurzlaufs gab es nie

Im README zu 0.15.40 stand, der Vorsprung des Kurzlaufs sei von 2,8-
auf 4,4-fach gewachsen. Das war eine **Rate je Tag**, und Raten sind
nur etwas wert, wenn man sie einlösen kann. Über einen ganzen Monat
gemessen gewinnt mal der kürzeste, mal der längste, mal das höchste
Entgelt - je nachdem, was die Börse auswirft. Keine Spielweise
gewinnt durchgehend.

Damit besteht das Spiel Regel 5 ("gibt es eine Option, die unter allen
Umständen die beste ist?"), und die geplante Gegenmaßnahme entfällt.
**Einschränkung dazu:** Die Monatsprobe streut stark, weil jede
Wiederholung eine neue Welt würfelt. Sie taugt, um eine Dominanz
auszuschließen, nicht um zwei Spielweisen auf zehn Prozent genau zu
vergleichen.

### Oben steht jetzt ein Satz, keine Tabelle

Die Durchsicht hatte zehn Zeilen, aufgeklappt vierzehn - Regel 16
erlaubt fünf Leitgrößen, in der Einführungsphase drei. Jetzt stehen
dort **zwei Zahlen**: was übrig bleibt, und wie lange der Wagen dafür
gebunden ist. Darüber der Satz, um den es geht:

```
  Geht so.
  204 DM bleiben übrig · bindet den Wagen 1 Tag 2 Std

  [▼ Rechnung]
```

**Der Deckungsbeitrag ist ganz entfallen.** Nicht, weil er Fachsprache
wäre - Regel 53 erlaubt Fachsprache ausdrücklich am Gegenstand -,
sondern weil er eine Zwischensumme ist, die keine Entscheidung ändert.
Entfernt man sie, entscheidet der Spieler genauso. Das ist Felders
Test auf Tracking Complexity ohne Tiefe.

Aufgeklappt steht die Rechnung in Alltagssprache, und die Herkunft des
Entgelts sitzt als eingerückte Unterzeilen darin statt hinter einem
zweiten Knopf - das wäre die dritte Ebene gewesen, und zwei sind das
Maß (Regel 31):

```
  Eingenommen                     460 DM
    A-1049 · 1,1 t Stückgut
    Strecke 623 km à 0,59 DM        365 DM
    Be- und Entladen                151 DM
    Börsenabschlag ×0,89          −  56 DM
  Sprit                          − 116 DM
  Reifen und Verschleiß          −  50 DM
  Miete, Steuer, Versicherung    −  90 DM
  ─────────────────────────────────────────
  Bleibt übrig                     204 DM
```

### Eine Skala für das ganze Spiel

Regel 21 verlangt, dass jede Bewertung dieselben Stufen, Farben und
Wörter benutzt. Die fünf Sätze stehen deshalb an genau einer Stelle,
in `js/core/kalkulation.js`:

> Da legst du drauf. · Lohnt kaum. · Geht so. · Verdient sich. · Da
> bleibt richtig was übrig.

Es sind **Sätze, keine Noten**. "Mittelmäßig" ist eine Note - man
fragt sofort: gemessen woran? "Geht so" braucht keinen Vergleich.

Der Maßstab ist der **Tagessatz des Wagens**: Was kostet dieses
Fahrzeug an einem Kalendertag, ohne einen Meter zu fahren? Eine Tour,
die weniger einbringt, verdient ihr Standgeld nicht. Der Maßstab ist
relativ - er wandert mit, wenn ein größerer Wagen dazukommt - und er
ist nicht erfunden, sondern gerechnet. Die Schwellen (0, 1, 3, 6-fach)
sind an der gemessenen Verteilung gesetzt: Median 6,3-fach, 13 % unter
dem Tagessatz, Höchstwert 11,7.

Die Zielliste zeigt seitdem das Urteil in Worten und den Balken; die
genaue Zahl steht im Tooltip. Regel 18: exakte Zahl dort, wo
verrechnet wird, Wort dort, wo nur verglichen wird. Und Regel 22:
Farbe trägt nie allein - neben jeder Farbe steht das Wort, und der
farbige Balken links wiederholt die Stufe als Form.

### Der erste Spieltag beginnt nicht mit Warten

Regel 30 verlangt, dass der Spieler in der ersten Stunde einen ganzen
Kreislauf erlebt: annehmen, fahren, bezahlt werden. Gemessen fiel das
durch - in rund jedem fünften Spiel war keiner der ladbaren Aufträge
sofort abholbereit (drei Aufträge mit je 40 % Bereitschaft ergeben
0,6³ = 22 % Fehlanzeige). Der erste Auftrag an jedem Ort steht jetzt
immer sofort bereit.

### Was weiter verstößt, und warum es so bleibt

**Manche Städte haben für einen 1,4-Tonner nichts.** Beim wahllosen
Umsetzen in irgendeine der 165 Städte findet der Transporter in fünf
bis zehn von dreißig Fällen keine Fracht - Rohöl, Schüttgut, Container
kann er nicht laden. Das ist kein Fehler, sondern ein dünnes Netz mit
einem Spezialfahrzeug, und die Disposition bietet das Leer-Umsetzen
an. In Städte, in die ihn eine Tour wirklich bringt, trifft es höchstens
einen von fünfzehn Ankunftsorten.

**Regel 23 war ein Irrtum von mir.** Im Dokument stand, der Kontostand
in der Taskleiste ändere sich lautlos. Geprüft: Dort steht gar kein
Kontostand, nur Datum und Uhr. Offen bleibt der Monatsabschluss, der
Miete, Steuer und Versicherung bucht und es nur ins Protokoll meldet.

**Regel 34** (kontinuierliche statt diskreter Entscheidungen) und
**Regel 35** (erkennen, wann der Ausgang feststeht) sind weiter
unerfüllt. Beide werden erst wichtig, wenn die Flotte wächst.

### Geprüft

Neuer Test `browsertest-designregeln.js`: acht Regeln maschinell
geprüft (gibt es eine Wahl, streuen die Angebote im Urteil, höchstens
fünf Zahlen oben, eine Skala mit fünf Stufen und fünf Farben, Farbe
nie allein, höchstens zwei Ebenen, keine Buchhaltersprache auf
Schaltflächen, kein Bankrott in der Einführung, sofort abholbereite
Fracht am ersten Tag). Dazu `browsertest-reingewinn.js` umgebaut auf
die neue Struktur.

Fünf bestehende Tests prüften auf das alte Vokabular
("Deckungsbeitrag", "Bindet den Wagen", "je Tag") und sind auf das
neue umgestellt. Die Suite läuft mit 24 Browsertests zweimal
vollständig durch.

## Vorheriger Stand (v0.15.41)

**Zwei Dinge im Dispositionsmodul, die zusammengehören: Der Wagen
wartet jetzt auf die Ladung, und eine laufende Tour lässt sich
abbrechen.**

### Das Ladefenster gilt

`tourPlan()` rechnete seit jeher damit, dass der Wagen wartet, bis die
Ware bereitsteht, und warnte bei über zwölf Stunden. `fahrt.js` kannte
`ladeBeginn` überhaupt nicht und fuhr sofort los. Die Warnung
beschrieb etwas, das nie eintrat.

Jetzt setzt `standzeitSetzen()` die Standzeit **nach** dem Ladefenster
an: erst warten, dann laden. Das Warten ist dabei sichtbar von der
Rampenzeit getrennt (`wartetBis` neben `stehtBis`) - in der Liste der
laufenden Touren steht „wartet auf Ladung" statt „an der Rampe", in
einem Warnton statt im Grau der Ruhezeit. Der Unterschied ist keine
Spitzfindigkeit: Rampenzeit ist Arbeit, Wartezeit ist der einzige
Stillstand, den der Disponent hätte vermeiden können.

**Damit ist die Unterscheidung aus 0.15.40 wieder hinfällig.** Dort
hatte ich `dauerStunden` (Termin) und `bindungStunden` (Kosten)
getrennt, weil ein voller Tag Fixkosten für eine Wartezeit, die nie
eintrat, falsch gewesen wäre. Seit die Fahrt wartet, ist wer an der
Rampe steht genauso gebunden wie wer fährt. Die Trennung hat genau
eine Version gehalten - und das ist richtig so: Sie war die Antwort auf
einen Fehler, nicht auf die Sache.

**Der erste Spieltag stand still.** Gemessen, nachdem das Warten
gebaut war: Von den acht Aufträgen im eigenen Depot war **kein
einziger** sofort ladbar, der Wagen stand im Schnitt **19 Stunden**
herum, ehe er losfuhr. Der Grund lag in `erzeugen()`: Jedes
Ladefenster wurde auf 0 bis 36 Stunden **in der Zukunft** gesetzt.
Nach einem Spieltag war das Problem von selbst weg, weil die Börse
altert (nach 24 Stunden waren 70 % abholbereit, nach 72 Stunden alle) -
aber die erste Tour eines neuen Spiels stand, und das ist der
schlechtestmögliche Augenblick dafür. Eine Börse, auf der nichts
sofort verfügbar ist, ist ohnehin unrealistisch: Ein Teil der Ware
steht schon an der Rampe. Jetzt sind **vier von zehn Aufträgen sofort
abholbereit**, der Rest in den nächsten anderthalb Tagen.

| | vorher | jetzt |
|---|---|---|
| sofort ladbar am ersten Tag | 2 % | **42 %** |
| Ø Wartezeit am ersten Tag | 19,4 Std | **12,6 Std** |
| Ø Wartezeit nach einem Tag | 1,9 Std | **0,9 Std** |

Das Warten ist damit kein Zoll mehr, sondern eine Entscheidung: Nimm
die Fracht, die bereitsteht, oder die bessere, die erst morgen
aufgeht.

### Eine laufende Tour lässt sich abbrechen

Einmal losgeschickt, lief eine Tour bisher durch - kein Abbrechen,
kein Umdisponieren. Ein Disponent macht genau das den ganzen Tag.

`Fahrt.abbrechen()` beendet sie, aber ohne zu schummeln: Der Wagen
fährt den **nächsten Halt noch an** und bleibt dort stehen. Ein Zug auf
der Autobahn lässt sich nicht an Ort und Stelle abstellen, und die Zeit
bis zur nächsten Stadt vergeht ebenso wie der Sprit dafür - beides
wird gerechnet und als Leerfahrt gebucht.

Drei verschiedene Schicksale, und sie unterscheiden sich:

- Was **an Bord** ist, ist angenommen und wird nicht geliefert. Der
  Verlader steht da. Das platzt (neuer Auftragsstatus `geplatzt`) und
  belastet die Kundenbeziehung wie eine Verspätung - nur ohne den
  Erlös, der sie sonst aufwöge.
- Was **noch nicht geladen** wurde, kann ein anderer fahren und geht
  ohne Schaden zurück an die Börse.
- Die **Leerfahrt** zum nächsten Halt kostet Sprit und Verschleiß.

Der Knopf sitzt an der laufenden Tour, klein und rechts, mit Rückfrage:
Was an Bord ist, platzt, und das lässt sich nicht zurücknehmen.

**Nebenbei ist dabei aufgefallen, dass man die laufenden Touren
überhaupt nicht sah**, sobald eine Stadt gewählt war -
`laufendeFahrten()` stand nur im leeren Zustand. Nach dem Losschicken
springt die Disposition aber genau dorthin zurück. Jetzt steht die
Liste unter beiden Ansichten.

**Und ein zweiter Fund aus dem eigenen Test:** Die Ankunftsmeldung des
alten Spielstands stand im neuen. `Speicher.neuBeginnen()` räumte alles
auf außer den Meldungen der Anzeige - die hängen an der App, nicht am
Spielstand. Dafür gibt es jetzt `TourenplanungApp.neuBegonnen()`.

Geprüft mit `browsertest-abbruch.js`: Anteil sofort abholbereiter
Fracht, Warten bis genau zum Ladefenster, Status „wartet auf Ladung",
Losrollen danach - und für den Abbruch: Tour beendet, Sendung an Bord
geplatzt, Wagen steht am nächsten Halt statt im Nichts, Zeit und Geld
für die Restfahrt, Meldung erklärt es, Kundenbeziehung trägt den
Ausfall ohne Umsatz.

**Siebzehn bestehende Tests mussten nachziehen**, und zwar alle aus
demselben Grund: Sie legen sich ihre Fracht selbst an und spulen dann
eine feste Stundenzahl vor. Mit einem gewürfelten Ladefenster stand der
Wagen je nach Wurf noch, wenn der Test längst weitergefahren war -
`browsertest-buchhaltung.js` und `browsertest-start.js` fielen genau so
sporadisch aus. Sie überschreiben `Auftraege.erzeugen` jetzt so, dass
selbst angelegte Fracht sofort bereitsteht. Das Warten selbst prüft
`browsertest-abbruch.js`.

## Vorheriger Stand (v0.15.40)

**Was bleibt von einer Tour wirklich übrig?**

Gemeldet wurde, dass man den Reingewinn je Tour nicht sieht. Beim
Nachmessen stellte sich heraus, dass die angezeigte Zahl nicht nur
unvollständig war, sondern nicht einmal mit dem übereinstimmte, was
das Spiel danach buchte.

**Zwei Fehler, die derselbe Fehler waren.** `Entgelt − Sprit` stand an
vier Stellen im Code: Zielliste der Disposition, Frachtbrief-Durchsicht,
Auftragsübersicht und Ankunftsmeldung. Vier Kopien einer Formel, und
keine von ihnen hatte sie ganz. Beim Abrechnen bucht
`Finanzen.tourAbgerechnet()` nämlich zusätzlich Reifen und Verschleiß.
Dazu schätzte die Planung den Sprit mit dem blanken Basisverbrauch,
während die gefahrene Tour Beladung und Gelände einrechnet - bei
vollem Wagen ein Unterschied von 39 %.

Gemessen an einer Tour Hamburg-Hannover mit 1,4 t:

| | vorher | jetzt |
|---|---|---|
| Durchsicht versprach | 207 DM | **187 DM** |
| gebucht wurde | 187 DM | **187 DM** |

Beides läuft jetzt über ein neues Modul, `js/core/kalkulation.js`. Wer
die Zahlen ändert, ändert sie dort, und alle Ansichten folgen. Die
Verbrauchsschätzung benutzt dasselbe Modell wie die Fahrt
(`Verschleiss.verbrauchSchaetzen()`, neu und ohne Nebenwirkung auf das
Fahrzeug). Eine Schätzung darf danebenliegen, aber nicht systematisch
in eine Richtung.

**Deckungsbeitrag und Reingewinn sind zwei Zahlen, und beide stehen
jetzt da.** Der Deckungsbeitrag ist das Entgelt abzüglich der Kosten,
die nur wegen dieser Fahrt anfallen - er beantwortet „lohnt sich die
Fahrt gegenüber Stehenbleiben?". Der Reingewinn zieht zusätzlich den
Anteil an den Kosten ab, die ohnehin laufen, und beantwortet „lebt die
Firma davon?". Die Durchsicht liest sich seitdem wie eine Rechnung:

    Entgelt                  298 DM
    Sprit                   − 54 DM
    Reifen und Verschleiß   − 22 DM
    Deckungsbeitrag          222 DM
    Fixkosten anteilig      − 29 DM   0,3 Tage à 85 DM
    ─────────────────────────────────
    Reingewinn               193 DM

**Der Schlüssel für die Fixkosten ist die Zeit, nicht der Kilometer.**
Fixkosten laufen nach Kalender. Ein Wagen, der zehn Tage für eine Tour
braucht, trägt zehn Tage Miete, Steuer und Abschreibung - ob er fährt,
an der Rampe steht oder Ruhezeit hat. So rechnet auch ein Spediteur:
Er kennt seinen Tagessatz je Fahrzeug und hält die Tour dagegen.

Der Tagessatz entsteht aus dem, was diesem einen Wagen zuzurechnen
ist: Steuer, Versicherung und Abschreibung gehören ihm allein, die
Depotmiete wird nach Grundbetrag und Fläche geteilt, die Verwaltung
nach Köpfen - ein Büro führt man für den Betrieb, nicht für einen
bestimmten Wagen. Für den Start-Transporter sind das 2.576 DM im Monat
oder **85 DM am Tag**. Gerechnet wird mit 30,44 Tagen je Monat; mit
glatten 30 wären alle Tagessätze um 1,5 % zu hoch.

**Eine Zeit, die zwei Dinge hieß.** Der erste Versuch belastete eine
150-km-Tour mit 86 DM Fixkosten, abgerechnet wurden 14 DM. Der Grund
war, dass `plan.dauerStunden` beides zugleich sein sollte: der
Zustelltermin und die Bindungsdauer. Es enthält das Warten auf ein
Ladefenster, das erst morgen aufgeht - für den Termin richtig, für die
Kostenumlage falsch, denn in dieser Zeit ist der Wagen in der
Simulation längst wieder unterwegs. Der Plan führt jetzt beide Zahlen:
`dauerStunden` für den Termin, `bindungStunden` für die Kosten. „Bindet
den Wagen" zeigt seitdem die zweite - was das Feld immer schon
behauptet hat.

**Nach der Ankunft steht dieselbe Rechnung noch einmal da**, jetzt mit
dem gemessenen Verbrauch und der wirklich vergangenen Zeit statt einer
Schätzung. Die Fahrzeughistorie führt den Reingewinn je Tour mit; der
Tooltip zeigt die ganze Rechnung. Fährt eine Tour mehrere Sendungen,
trägt jede nur ihren Teil der Zeit, geteilt nach Kilometern - sonst
zahlte jede von drei Sendungen die Fixkosten der ganzen Tour.

**Ein Unterschied bleibt, und er hat einen Namen.** Die Planung rechnet
die Standzeit am letzten Stopp mit, die Fahrt setzt sie dort nicht
(`fahrt.js`, `standzeitSetzen`: „danach ist die Tour ohnehin zu Ende").
Die Planung liegt dadurch um die Abladezeit zu hoch - im Beispiel 165
DM versprochen, 173 DM abgerechnet. Die Richtung stimmt (es wird nie
weniger als versprochen), und `browsertest-reingewinn.js` prüft genau
das statt Gleichheit. Wer den Unterschied ganz beseitigen will, muss
die Fahrt am letzten Stopp abladen lassen - das verlängert jede Tour um
rund zwei Stunden und ist deshalb eine eigene Entscheidung.

**Und dieselbe Frage nach oben gestellt: woraus besteht das Entgelt?**
Die Kosten waren jetzt aufgeschlüsselt, der Erlös stand weiter als
blanke Zahl da - dabei steckt darin alles, was der Spieler beeinflussen
kann. Ein Knopf „Woraus?" neben dem Entgelt klappt je Sendung eine
zweite kleine Rechnung auf:

    A-1048 · 0,5 t Stückgut
    Strecke        623 km à 0,37 DM      233 DM
    Be- und Entladen  Papiere, Rampenzeit 129 DM
    Börsenabschlag ×0,89                 − 40 DM
    ───────────────────────────────────────────
    Entgelt                              322 DM

Damit wird sichtbar, was die Wirtschaft aus 0.15.39 eigentlich tut:
Der Streckensatz von 0,37 DM je km für eine halbe Tonne gegen 3,40 DM
für eine volle Ladung ist die Gewichtsstaffel, und sie ist der Grund,
warum sich Beiladung lohnt. Zuschläge für Kühlung, Gefahrgut und
Wertgut bekommen eigene Zeilen samt Begründung. Die letzte Zeile vor
der Summe sagt, was der Markt daraus gemacht hat - Börsenabschlag oder
Stammkundenaufschlag, mit Namen des Kunden.

`Ladung.frachtpreis()` ist dafür auf `Ladung.aufschluesselung()`
aufgesetzt, die dieselbe Rechnung mit ihren Bestandteilen liefert. Der
Auftrag führt seither `listenpreis` und `preisfaktor` mit: Der
Börsenabschlag ist gewürfelt und ließe sich nachher nicht mehr
rekonstruieren.

Zwei Dinge, die beim Bauen schiefgingen und beide dasselbe Prinzip
betreffen - **eine Rechnung, deren Posten nicht aufgehen, ist
schlimmer als gar keine**:

- Zuschläge wurden zunächst jeder auf den Grundwert bezogen. Bei
  Kühlung und Gefahrgut zusammen waren das 7 % zu viel. Sie wirken
  nacheinander, der zweite auf das Ergebnis des ersten.
- Die Marktzeile rechnete aus dem gespeicherten Faktor. Sobald ein
  Entgelt woanders gesetzt wird, gehen die Posten dann nicht mehr auf -
  der Test hat genau das getroffen. Jetzt ist sie der **Rest**:
  Entgelt minus Listenpreis. Damit summiert sich die Rechnung immer auf
  die Zahl, die danebensteht.

Der Block ist standardmäßig zu. Die Zusammenfassung soll auf einen
Blick lesbar bleiben; die Herleitung ist für den, der sie sucht.

**Die Standzeit an der Rampe ist halbiert**, von zwei Stunden je
Vorgang auf eine. Vier Stunden Rampe für eine Palette Stückgut waren
zu viel: Bei einem 150-km-Lauf machten sie 63 % der ganzen Tour aus.
Geteilt wurden alle Werte mit demselben Faktor, damit die Verhältnisse
zwischen den Aufbauten bleiben - ein Tankzug steht weiterhin
anderthalbmal so lange wie eine Plane, ein Kipper den Bruchteil.

Was das misst, gegen den Stand davor:

| Strecke | DB je Tag vorher | jetzt |
|---|---|---|
| 60 km | 770 DM | **1.297 DM** |
| 150 km | 712 DM | **1.042 DM** |
| 300 km | 652 DM | **849 DM** |
| 600 km | 327 DM | **356 DM** |
| 1.200 km | 280 DM | **293 DM** |

**Der Vorsprung des Kurzlaufs wächst damit von 2,8- auf 4,4-fach.**
Das ist die Kehrseite: Die Rampe war genau das Gegengewicht, das
0.15.28 eingeführt hatte, weil ohne sie jeder Kurzlauf rechnerisch
dreimal so gut aussah wie eine Ferntour. Begrenzt wird es im Spiel vom
Angebot - im eigenen Depot liegen im Schnitt vier ladbare Aufträge,
nicht acht Kurzläufe am Tag. Falls sich beim Spielen doch „immer den
kürzesten nehmen" einstellt, ist die nächste Stellschraube nicht die
Rampe, sondern der Frachtpreis: Die Abfertigungspauschale (60 + 260 ×
Staffel) macht kurze Läufe je Kilometer besonders einträglich.

Nebenbei repariert: „1 Tage 16 Std" stand bis hierher in jeder
Durchsicht einer eintägigen Tour.

Geprüft mit `browsertest-reingewinn.js`, 35 Proben: Tagessatz ist die
Summe seiner Posten, Durchsicht rechnet wie eine Rechnung, „Woraus?"
klappt auf und wieder zu und seine Posten ergeben das Entgelt,
versprochen ist gebucht, Ankunft und Historie führen den Reingewinn,
die Staffel gibt der kleinen Sendung je Tonne mehr und der großen
insgesamt mehr, nichts rechnet mehr ohne Verschleiß. Die Suite läuft zweimal vollständig durch, 23 Tests.
`browsertest-standzeit.js` prüfte auf die Beschriftung „Je Tag", die
jetzt „Deckungsbeitrag je Tag" heißt - seit mehrere Zahlen je Tour
dastehen, muss dabeistehen, welche gemeint ist. Und er prüfte die
Standzeit gegen die feste Zahl 2; jetzt liest er die Tabelle und
prüft die Verhältnisse - dass ein Tank länger steht als eine Plane
und ein Kipper kürzer, war der Sinn der Tabelle, nicht der Wert.

## Vorheriger Stand (v0.15.39)

**Der Transporter ist das erste Fahrzeug.**

Bisher begann jedes Spiel mit einem 24-Tonner. Das nahm die ganze
Treppe aus dem Freischaltungskapitel vorweg: Wer oben anfängt, kann
nicht mehr aufsteigen. Der neue Spielstand beginnt mit einem
**Kastor T35**, 3,5 t zulässig, 1,4 t Zuladung, 12 m³, Vorbild
Mercedes-Benz T1 / VW LT 35, Baujahr 1989 mit 186.000 km auf der Uhr.

**Das Pixelbild dazu.** `assets/sprites/transporter-generisch.png`,
560x436, 39 Farben. Der erste Entwurf war von Hand in Python
konstruiert - Projektionsachsen aus dem Sattelzug-Sprite gemessen,
Flächen als Polygone berechnet. Er saß geometrisch richtig und sah aus
wie ein Karton mit Rädern. Das jetzige Bild ist von einem Bildmodell
gezeichnet und hier nachbearbeitet, und das ist der interessantere
Teil, weil ein Bildmodell nichts liefert, was ein Sprite sein könnte:
1422x1106 Pixel, 58.065 Farben, weichgezeichnete Kanten, ein
Hintergrund, der fast weiß ist.

Die Nachbearbeitung ist deshalb kein Verkleinern, sondern ein
Zurückrechnen auf das Raster, das das Modell nachgeahmt hat. Die
Blockgröße lässt sich messen: Man summiert die Farbunterschiede
spaltenweise, sucht die Ausschläge und schaut, welcher Abstand am
häufigsten vorkommt - hier rund 5 Pixel. Also erst mit einem
Flächenmittel auf das logische Raster herunter (damit verschwindet die
Weichzeichnung in der Mittelung, statt später als Farbsaum
übrigzubleiben), dann auf 46 Farben quantisieren, **ohne Dithering** -
Dithering würde genau die Rasterpunkte erzeugen, die hier wegsollen -,
dann alles fast Weiße auf reines Weiß setzen und schließlich
ganzzahlig mit Nearest Neighbour vergrößern. Ganzzahlig, weil ein
Faktor von 1,4 manche Pixel verdoppelt und andere nicht; das sieht man.

Die Größe ist am Sattelzug ausgerichtet, nicht am Rahmen: 298x232
gegen dessen 477x304. Ein erster Versuch füllte das Bild besser aus
und war dann 428x332 groß - der 3,5-Tonner wäre in der Liste höher
gewesen als der 40-Tonner.

**Die Umfärbbarkeit war die eigentliche Vorgabe an das Bild.**
`lackierung.js` erkennt Lack daran, dass ein Pixel gesättigt (> 0,25)
und rötlich ist (Farbton unter 25 oder über 340 Grad). Ein Reifen mit
Rotstich würde mitgefärbt. Der Prompt an das Bildmodell schreibt
deshalb ausdrücklich vor, dass alles Unlackierte neutral grau oder
blaugrau zu sein hat. Nachgemessen: Die 30.784 Lackpixel liegen
sämtlich bei Farbton 355 Grad und Sättigung über 0,86, die 12.212
übrigen Fahrzeugpixel bei Farbton 203 bis 225 Grad - also im Blauen,
weit außerhalb des Fensters. Alle sechs Lackierungen sind geprüft.

**Lackierung kann mehrere Sprites.** `lackierung.js` hatte eine feste
Quelle; jetzt führt es einen Bildspeicher je URL und einen Cache je
`quelle|farbton|gross-oder-klein`. Jedes Fahrzeug bringt sein Bild
(`sprite`) und seinen Miniaturausschnitt (`miniaturAusschnitt`) im
Fahrzeugtyp mit.

**Das Ganze steht als Werkzeug im Baum**, weil noch viele Bilder
kommen: `werkzeug/sprite-aufbereiten.py`. Es misst das Raster, rechnet
zurück, quantisiert, prüft die Umfärbbarkeit und schlägt den
Miniaturausschnitt vor. Aus dem Originalbild erzeugt es das
eingebaute Sprite Byte für Byte.

**Die Callouts hängen am Typ, nicht am Modul.** Ein Transporter hat
den Motor nicht dort, wo ihn ein Sattelzug hat. `calloutAnker` steht
jetzt im Fahrzeugtyp, `CALLOUT_LAYOUT` im Fuhrpark ist nur noch der
Rückfall. Die fünf Ankerpunkte des Transporters sind **gemessen, nicht
gesetzt**: Die beiden Räder über ihre dunklen Flächen (zusammenhängende
Bereiche unter Helligkeit 70 suchen, Schwerpunkt nehmen), die übrigen
drei im Browser nachgezogen, bis die Linie dort endet, wo das Bauteil
sitzt. Das Bild füllt seinen Rahmen auf ein Pixel genau, also sind
Bildprozent gleich Rahmenprozent. Zwei Anker saßen im ersten Anlauf
falsch - der Motor zeigte auf die A-Säule statt auf die Haube, der
Antrieb aufs Hinterrad statt zwischen die Achsen - beides erst im
gerenderten Bild zu sehen, nicht in den Zahlen.

Was der kleine Wagen sonst noch nach sich zog, jedes Stück ein
eigener Fehler:

- **Er konnte gar nichts laden.** `aufbautyp: "Kastenwagen"` stand in
  keiner Zuordnungstabelle. `"Kastenwagen": "plane"` in `ladung.js`.
- **Das Ladevolumen war global.** 90 m³ standen als Konstante im Code
  und im Erklärtext der Ware. Jetzt liefert `ladevolumen(fahrzeug)`
  den Wert des Fahrzeugs, und die Warenansicht rechnet mit dem
  Bezugsfahrzeug statt mit einer festen Zahl.
- **Er bekam eine Sicherheitsprüfung.** §29 StVZO gilt ab 7,5 t.
  `fristen.js` entscheidet das jetzt nach Klasse und Zuladung.
- **Der Mengenregler erreichte sein eigenes Maximum nicht.** Bei
  `min="1" step="0.5"` und 1,4 t Zuladung war 1,0 t der einzige
  erreichbare Wert. Schrittweite skaliert jetzt mit dem Fahrzeug
  (0,1 / 0,2 / 0,5 t), und die Obergrenze wird auf ein Vielfaches der
  Schrittweite gerundet. Den Fehler gab es vorher auch - mit 25-t-Zügen
  fiel er nur nicht auf.
- **Alle Aufträge waren zu groß.** Die Börse warf 3 bis 25 t aus.
  Nach *Anzahl* überwiegen in Wirklichkeit die kleinen Sendungen
  deutlich, nach *Tonnage* ist es umgekehrt. Die Verteilung ist jetzt
  55 % Kleingut (0,2-1,5 t), 30 % Teilladung (2-8 t), 15 %
  Komplettladung. Gemessen: 52 % aller Sendungen sind jetzt <= 1,4 t.

Die Testsuite läuft dreimal hintereinander vollständig durch (23
Tests). Acht mussten angefasst werden, und fast alle aus demselben
Grund: Sie legten sich ihren Auftrag selbst an und ließen `erzeugen()`
die Menge würfeln. Für einen 24-Tonner war jede Menge recht; für 1,4 t
Zuladung war die Zeile meist gesperrt, und der Test fiel je nach
Würfel aus. Jetzt drücken sie die Menge auf das, was der Wagen trägt.

Drei weitere hingen an Annahmen, die mit der neuen Wirtschaft nicht
mehr galten:

- Die Auftragsübersicht las den Deckungsbeitrag mit
  `/([\d.]+) DM je Tag/`. Bei kleinen Sendungen stehen dort
  Kommastellen und Minuszeichen, und aus „−10" wurde „10". Die Liste
  war richtig sortiert, der Test hielt sie für falsch.
- Die Finanzen prüften auf ein Startkapital von genau 250.000 DM.
  Jetzt lesen sie den Kostensatz - die Zahl ist eine Stellschraube, die
  Buchung ist die Sache.
- Der Starttest nahm den ersten Auftrag der Liste und sah ihm beim
  Fahren zu. Seit die Börse acht Aufträge im eigenen Depot hat und
  Kleingut kurze Wege fährt, war die Tour vorbei, ehe er hinsah. Jetzt
  legt er sich selbst einen weiten Lauf an und klickt genau den.

**Damit der Transporter benutzbar ist, musste die Wirtschaft nach.**
Drei Dinge fielen beim Bauen auf, jedes davon gemessen, und alle drei
machten den kleinen Wagen zur Dekoration: Im eigenen Depot lag im
Schnitt **0,2 Aufträge** (in neun von zwölf Spielen konnte er am ersten
Tag nichts laden), ihm wurde ein Lauf über **3.780 km** angeboten, und
eine volle Transporterladung brachte **0,42 DM je km** - unter den
recherchierten Vollkosten. Mit dem 24-Tonner fiel nichts davon auf.
Deshalb stehen sie in derselben Version.

**Erstens: der Frachtpreis hat eine Gewichtsstaffel.** Bisher war er
ein fester Satz je Tonnenkilometer - eine 1-t-Sendung brachte ein
Vierundzwanzigstel einer 24-t-Sendung. In den wirklichen Tarifen ist
das nie so gewesen. Gesetzt ist jetzt ein Referenzsatz von 3,40 DM je
km für eine Komplettladung auf 24 t, darunter eine Degression mit dem
Exponenten 0,57. Der Exponent ist nicht geraten: Er folgt aus dem
BME-Preisspiegel für Stückgut und Teilladungen, und die Probe gegen die
einzige belegte Preisangabe von 1994 stimmt - München-Hannover mit 24 t
kostet im Spiel jetzt **2.394 DM**, unter dem Tarif vor der Freigabe
waren es 2.500 DM. Das Spiel liegt also knapp darunter, was für den
01.03.1994 richtig ist: zwei Monate nach der Freigabe, in der
Preiserosion. Der Transporter bekommt damit 1,07 DM je km auf 400 km
statt 0,42 - und ein Sattelzug, der eine einzelne Kleinsendung fährt,
bekommt sie auch. Das ist die Stelle, an der die Beiladung ihren Sinn
bekommt: Zwei Sendungen auf einem Wagen bringen das Doppelte, gebremst
nur von der Standzeit an jeder Rampe.

**Zweitens: vor der eigenen Tür liegt immer Arbeit.** Die Börse würfelt
den Versandort nicht mehr gleichverteilt über 165 Städte. Mindestens
acht offene Aufträge liegen an einem Ort, an dem der Spieler steht, und
jeder zweite davon ist auf den kleinsten Wagen seiner Flotte
zugeschnitten - in Ware, Gewicht und Raum. Das ist kein Entgegenkommen,
sondern die Umkehrung einer unrealistischen Annahme: Ein Verlader, der
den Spediteur vor Ort kennt, weiß auch, was bei ihm auf dem Hof steht.
Die andere Hälfte bleibt ungeschnitten, sonst verschwände die
Versuchung, für den großen Auftrag den größeren Wagen anzuschaffen.

Dazu ein Aufruf an der richtigen Stelle: Die Börse steht voll, bevor
der Spieler sein Depot gewählt hat. `depotSetzen()` frischt sie
deshalb noch einmal auf - vorher begann jedes Spiel mit einer Börse,
in der das eigene Depot nicht vorkam.

**Drittens: die Entfernung hängt an der Sendungsgröße.** Ein Karton
Ersatzteile geht in den Nachbarkreis, eine Komplettladung rechtfertigt
den langen Lauf. Gewählt wird über einen Radius (400 / 900 / 2.000 km),
nicht über einen Anteil der Trefferliste. Der erste Versuch mit einem
Anteil ging schief, und die Messung sagte auch warum: Wenn nur fünf
Städte in Europa eine Ware brauchen, sind die nächstgelegenen zwölf
Prozent davon immer noch achthundert Kilometer weit weg. Auch der
Radius selbst ist an der Netzdichte gemessen - um Hamburg liegen 4
Städte bis 250 km, 12 bis 400 km, 27 bis 600 km. Mit 250 km ging jede
Transportersendung nach Hannover und sonst nirgendwohin.

**Und die Sendung wird als Raummaß gewürfelt, nicht als Gewicht.**
Eine Sendung ist in der Praxis eine Zahl von Palettenplätzen; was
darauf steht, entscheidet erst danach über die Tonnage. Über das
Gewicht zu würfeln ging schief: 1,4 t Dämmstoff sind 28 m³ und passen
in keinen 3,5-Tonner - der Auftrag sah klein aus und war es nicht.
Dazu ein Deckel von einer Tonne je Palette, sonst wog eine Palette
Stahlblech 3,75 t.

**Die Fixkosten hingen an keinem Fahrzeug.** Jeder Wagen zahlte 3.600
DM Kfz-Steuer und 9.000 DM Versicherung im Jahr - der Kastenwagen
ebenso wie der 40-Tonner. Die Steuer ist jetzt linear zum zulässigen
Gesamtgewicht (3,5 t: 315 DM), die Prämie degressiv über die Wurzel
(2.662 DM), und die Depotmiete hängt an der Flotte statt an einer
Konstanten: 350 DM Grundbetrag plus Fläche je Fahrzeug. Eine Spedition
mit einem Transporter zahlt 397 DM statt 2.500. Belegt ist daran die
Gewichtsstaffel des KraftStG, nicht das DM-Niveau.

**Das Startkapital ist von 250.000 auf 45.000 DM gesetzt**, die
Dispolinie von 50.000 auf 15.000. Das ist die eine Zahl in dieser
Version, die reine Einstellung ist und keine Herleitung hat - die
DM-Beträge des Eigenkapitalnachweises nach GüKG sind nicht greifbar.
Der Grund ist trotzdem zwingend: Ein Sattelzug kostet 165.000 DM und
war am ersten Spieltag bezahlbar. Der Transporter wäre Dekoration
gewesen, die man in der ersten Minute wegkauft.

Was am Ende gemessen herauskommt, jeweils gegen den Stand von 0.15.38:

| | vorher | jetzt |
|---|---|---|
| Spiele ohne ladbaren Auftrag im Depot | 9 von 12 | **0 von 30** |
| ladbare Aufträge im Depot | 0,2 | **4,2** |
| Erlös des Transporters je km | 0,42 DM | **0,99 DM** |
| längster Lauf, der ihm angeboten wird | 3.780 km | **623 km** |
| Fixkosten je Monat | 5.350 DM | **2.445 DM** |
| Nichtstun bis zur Pleite | 53 Monate | **18 Monate** |
| Sattelzug bezahlbar | am ersten Tag | **nach ~7 Monaten** |

**Was weiter offen bleibt.** Der Verschleißsatz steht unverändert bei
0,08 DM je km statt der hergeleiteten 0,30, und Fahrerkosten gibt es
nach wie vor nicht. Beide gehören zusammen und kommen mit dem
Personalmodul - solange der Fahrer fehlt, sieht jedes Fahrzeug zu
profitabel aus, und achtzehn Monate Ruhestand sind noch immer zu
viele. Ebenso fehlt weiterhin die 50-km-Nahverkehrsgrenze aus dem
Lizenzkapitel; der Radius oben tut so, als gäbe es sie, verbietet aber
nichts.

## Vorheriger Stand (v0.15.38)

**Stufe 2: die Stoppfolge ist die Tour.**

Bis hierher stand dieselbe Tour an zwei Stellen in zwei Modellen - im
Frachtbrief als Liste von Sendungen, auf der Durchsicht als Stoppfolge.
Der Spieler musste beide im Kopf haben. Jetzt ist es ein Modell in zwei
Auflösungen: im Frachtbrief eine Zeile je Halt, auf der Durchsicht
derselbe Halt mit allem, was dort wechselt.

**Die Reihenfolge lässt sich von Hand legen.** An jedem Halt stehen ▲
und ▼. Dafür musste `stoppfolge()` auseinander: Sie fand und bewertete
eine Reihenfolge in einem Zug. Jetzt findet `stationenFinden()` eine
(die Heuristik wie bisher), und `stationenAuswerten()` rechnet **jede**
durch - auch eine von Hand gelegte. Die Prüfung, die vorher implizit
galt, weil die Heuristik nie etwas Unmögliches erzeugte, steht jetzt
ausdrücklich da: laden vor abladen, Kapazität an jedem Punkt, Strecke
vorhanden.

Umsortiert werden **Halte, nicht Stationen**: Ein Halt, an dem zwei
Sendungen wechseln, ist ein Halt, und den verschiebt man als Ganzes.
Das ist auch das, was ein Disponent meint, wenn er sagt „Hannover vor
Bremen". Gemerkt wird die Reihenfolge nicht als Liste von Städtenamen -
eine Stadt kann zweimal vorkommen - sondern als Stationen mit einem
Schlüssel je Sendung.

Zwei Entscheidungen dazu:

- **Kommt eine Sendung dazu, bleibt die Handreihenfolge bestehen.** Die
  neue wird eingefügt, die bestehende Ordnung nicht weggeworfen. Alles
  neu zu rechnen wäre einfacher gewesen, hätte aber die Arbeit des
  Spielers zunichte gemacht, sobald er eine vierte Sendung dazunimmt.
- **Eine unfahrbare Reihenfolge bleibt sichtbar.** Der Grund steht
  dabei („Sendung 2 ist in Bremen noch nicht geladen"), Losschicken ist
  gesperrt, und daneben steht der Weg zurück zur berechneten. Vorher
  verschwand so ein Zustand hinter „nicht fahrbar, eine Sendung
  streichen" - solange ein Algorithmus die Reihenfolge bestimmte, war
  das in Ordnung. Wer sie von Hand legt, muss den kaputten Zustand
  sehen können, um ihn zu reparieren.

Der Hebel sitzt dort, wo das Problem auffällt: Neben „Liefertermin
nicht zu halten" steht ein `▲ früher anfahren`, das genau diesen Halt
vorzieht.

**`+ Sendung` hängt jetzt an jedem Halt.** Damit entfällt die
Ortsfrage aus 0.15.36 wieder - sie war die Brücke hierher. Der
Unterschied Beiladung/Anschluss ist endgültig keine Vokabel mehr,
sondern eine Stelle in der Tour. Löschen und Ändern hängen an den
Ladezeilen.

Zwei Fehler beim Bauen, beide im Stylesheet bzw. hier vermerkt:

- Die Pfeilnummer zeigte auf den falschen Halt. Die Stoppfolge zählt
  ab dem Standort des Fahrzeugs, die Stationsgruppen erst ab der ersten
  Station - beide fallen nur zusammen, wenn im Startort auch geladen
  wird. Ein Klick auf den letzten Halt verschob den vorletzten. Jetzt
  rechnet `gruppenVersatz()` das um.
- Beim Entfernen der Ortsfrage habe ich zu viel gelöscht:
  `stoppfolgeAnsicht`, `haltPfeile`, `gruppenVersatz` und
  `naechsteSendung` lagen zwischen den entfernten Funktionen. Die
  Syntaxprüfung ging durch, der Fehler fiel erst im Browser auf
  („naechsteSendung is not defined"). Lehre: Nach einer Löschung über
  Zeilenbereiche die Funktionsliste gegenprüfen, nicht nur die Syntax.

Geprüft mit `browsertest-reihenfolge.js` (umsortieren, Handreihenfolge
übersteht eine neue Sendung, unfahrbare Reihenfolge sichtbar und
erklärt, Losschicken gesperrt, Rückweg zur berechneten). Sechs
bestehende Tests lasen die Sendungen aus dem Frachtbrief und sind auf
die Stoppfolge umgestellt - die Verhaltensänderung ist gewollt.

## Vorheriger Stand (v0.15.37)

**Die Buchhaltung für Gelegenheitsspieler: Vorgänge statt Buchungen.**

Gemeldet wurde „zwei Abrechnungen für einen Kauf": ein Fahrzeugkauf
über 165.000 DM stand zweimal mit demselben Betrag im Journal.
Nachgemessen:

```
Kontostand vorher:  250.000 DM
Kontostand nachher:  85.000 DM
Abgegangen:         165.000 DM   (Kaufpreis: 165.000 DM)
```

Das Geld ging **einmal** ab - die zweite Zeile ist die Gegenbuchung im
Anlagevermögen und trägt `ohneBank`. Dahinter steckte aber ein echter
Fehler, ein anderer: Konto 320 „Fuhrpark" ist ein Bestandskonto, und
ein gekaufter Lkw **mehrt** das Anlagevermögen. Gebucht wurde `-preis`:

```
Konto 320 (Fuhrpark) aufsummiert: −144.115 DM
Summe der Restbuchwerte:           185.885 DM
```

Die Firma besaß zwei Lkw, und das Fuhrparkkonto stand bei minus
144.000. Im selben Modul widersprach sich das: Die Startflotte wurde
als Sacheinlage positiv gebucht - dasselbe Ereignis mit umgekehrtem
Vorzeichen -, und der Abgang beim Verkauf ebenfalls positiv. Jetzt
stimmen die Vorzeichen, und die Abschreibung bucht zusätzlich gegen
320 („4830 an 320"). Damit gilt eine prüfbare Zusage: **Konto 320 ist
immer genau die Summe der Restbuchwerte.** Der Test rechnet sie nach,
auch nach einem Monatswechsel.

**Die Anzeige war der zweite Teil des Problems.** Das Journal zeigt
Buchungen, der Spieler denkt in Vorgängen. Jede Buchung trägt jetzt
eine Vorgangskennung, und `Finanzen.vorgaenge()` fasst sie zusammen:

```
vorher                              jetzt
34 1200  −165.000  Zahlung F-SP 102
33  320  −165.000  Anschaffung …     18.03. Meridian 1830 S gekauft  −165.000 DM
32 4530     −109  Reifen …
31 4500     −699  613 l …            13.03. A-1278 · Praha → Rīga      +5.979 DM
30 8400   +6.787  A-1278 …                  6.787 Fracht · 699 Sprit · 109 Verschleiß
```

Der Betrag eines Vorgangs ist die Summe seiner **zahlungswirksamen**
Buchungen - sonst stünde bei einem Kauf eine Null, weil sich Zugang
und Zahlung aufheben: richtig gebucht, aber keine Auskunft.

**Vier Reiter statt sechs:** Kasse (mit der Bank darin, samt Formular
für ein Darlehen), Monat, Verlauf, Je Fahrzeug. Weg sind Kontonummern,
Belegnummern und das Wort BWA; die Posten heißen „Sprit", „Reifen und
Verschleiß", „Wertverlust der Fahrzeuge".

Die ausführlichen Ansichten - Journal mit Konten, BWA, Bank als
eigener Reiter und die Kostensätze mit Quellenangabe - stehen
weiterhin im Code und sind nur nicht erreichbar. Sie kommen zurück,
sobald es ein Einstellungen-Programm mit dem Schalter „ausführliche
Buchhaltung" gibt. Die Daten dahinter bleiben intakt; der Test prüft
das ausdrücklich mit.

## Vorheriger Stand (v0.15.36)

**Ladungen bearbeiten - Stufe 1 der Überarbeitung der Disposition.**

Ausgangspunkt war die Frage, warum sich das Zusammenstellen einer Tour
sperrig anfühlt. Beim Durchsehen des Ablaufs war der Befund eindeutig:
**Eine Sendung ließ sich anlegen und löschen, aber nicht ändern.** Die
Felder des Frachtbriefs sprangen nur in die gerade angefangene Sendung
zurück; wer bei Sendung 2 das Ziel anders wollte, musste sie streichen
und den Dreischritt neu gehen. Dazu gab es zwei Sorten Sendung, die
verschieden funktionierten - eine „in Arbeit" und die festgelegten -,
und aus genau dieser Unterscheidung kamen drei der gemeldeten Fehler
(0.15.31, 0.15.32 und die abgebrochene Beiladung).

Der Umbau geht in zwei Stufen. Diese ist die erste.

**1. Eine Sendung antippen heißt sie bearbeiten.** In der
Sendungsliste des Frachtbriefs und in der Stoppfolge der Durchsicht
ist jede Sendung anklickbar. Der Brief heißt dann „Sendung 2 ändern",
und es gilt derselbe Ablauf wie für eine neue.

Technisch wird die Sendung dafür aus `geplant` herausgenommen und wie
eine angefangene behandelt - dadurch rechnet der ganze Rest des Moduls
unverändert weiter, ohne Sonderfall. Gemerkt werden ihr Platz
(`tour.bearbeitet`) und ihre alte Fassung (`tour.urfassung`). Daraus
folgen zwei Eigenschaften, die den Unterschied ausmachen:

- **Das Bearbeiten ist nicht zerstörend.** Solange die neue Fassung
  nicht vollständig ist, gilt die alte; „↺ Änderung" stellt sie her.
- **Die Sendung bleibt an ihrem Platz.** Sie wandert nicht ans Ende
  der Tour, nur weil man eine Kleinigkeit geändert hat. Dafür gibt es
  jetzt `alleSendungen()` als die eine Stelle, die Tour und
  Bearbeitung zusammensetzt - Durchsicht, Stoppfolge und Losschicken
  benutzen sie gemeinsam.

Ändert man eine Sendung, wird die ganze Tour neu durchgerechnet. Eine
andere Sendung kann dadurch einen Warnhinweis bekommen, ohne selbst
angefasst worden zu sein - das ist richtig so und im Test ausdrücklich
festgehalten.

**2. Die Menge ist einstellbar - bei Spotware.** Ein Schieberegler von
1 t bis zu dem, was hineinpasst, voreingestellt wie bisher das
Maximum. Der Restplatzbalken steht direkt darunter und wandert beim
Schieben mit, man sieht also sofort, was für eine Beiladung frei
bliebe.

Bei einem **Auftrag** gibt es nichts einzustellen: 23,4 t Papier des
Kunden sind 23,4 t, und wer teilte, ließe den Rest liegen und müsste
den Termin trotzdem halten. Spotware kauft der Disponent dagegen
selbst ein - dort ist die Menge die eigentliche Entscheidung.

Beim Ziehen wird bewusst **nicht** alles neu gezeichnet - der Schieber
wäre sonst mitten in der Bewegung weg. Es wandern nur Anzeige und
Restplatzbalken mit; erst beim Loslassen rechnet die Liste komplett
neu. Eine von Hand eingestellte Menge bleibt danach stehen und wird
nur gekappt, wenn ein kleinerer Wagen gewählt wird.

**3. Aus zwei Knöpfen wird einer.** Statt „+ Beiladung ab Hamburg" und
„+ Sendung ab Le Mans" gibt es einen „+ Sendung" und danach die Frage
„Wo soll geladen werden?" mit den Halten der Tour:

```
1  Hamburg     noch 20,0 t frei
2  Hannover    Ende der Tour · Auflieger leer
```

Der Unterschied Beiladung/Anschluss ist damit kein Fachwort mehr,
sondern eine Stelle in der Tour - und was dort frei ist, steht
daneben. Die Frage tritt an die Stelle des Knopfes und wird in den
Blick gerollt: Sie steht am Ende einer langen Durchsicht, und eine
Frage, die man nicht sieht, ist keine.

Was Stufe 1 **nicht** anfasst und was in Stufe 2 kommt: die
Stoppreihenfolge von Hand umsortieren, und der Umzug auf die
Stoppfolge als einzige Darstellung der Tour.

Geprüft mit `browsertest-sendung-aendern.js`. Drei bestehende Tests
(`beiladung`, `etappen`, `karte`) benutzten die alten Knöpfe und sind
auf den neuen Weg umgestellt - die Verhaltensänderung ist gewollt.
Dabei fiel auf, dass mehrere Tests Städte ansprachen, die es gar nicht
gibt (`Dortmund`, `Kassel`); `Auftraege.erzeugen` nimmt dann eine
beliebige, und der Test prüfte etwas anderes als gedacht. Jetzt stehen
dort nur Städte aus `js/data/staedte.js`. Die ganze Suite - 21 Tests -
läuft grün.

## Vorheriger Stand (v0.15.35)

**Der Tooltip blieb stehen.** Gemeldet mit Bild: ein Kasten
„Frankfurt am Main (DE) · 2.895.000 Einw." über einer Karte, die
längst woanders war. Nachgestellt im Browser, und es waren zwei
Ursachen:

```
nach mouseover:                 sichtbar
nach Neuzeichnen der Marken:    sichtbar   <- bleibt hängen
nach Wegbewegen der Maus:       weg
nach Fingertipp:                sichtbar   <- bleibt hängen
```

Der Kasten hing an `mouseover`/`mouseout`. Ein **Fingertipp** erzeugt
ein künstliches `mouseover`, aber nie ein `mouseout` - der Finger
schwebt ja nirgendwohin. Und **`markenZeichnen()`** ersetzt die ganze
Markenebene; wird die Marke unter dem Zeiger dabei weggeworfen, kommt
ebenfalls kein `mouseout`. Deshalb überlebte er Verschieben, Zoomen
und jeden Uhrentakt.

Dazu ein dritter Punkt: Die Position ist in Rahmenkoordinaten
gerechnet und wandert beim Verschieben nicht mit. Auch ein Kasten, der
sich schlösse, zeigte nach dem Verschieben auf die falsche Stadt.
Verbergen beim Ansichtswechsel ist also nicht nur Reparatur.

Neu: Er verschwindet bei jedem Neuzeichnen der Marken, bei jeder
Ansichtsänderung und beim Verlassen der Karte. Am Finger hängt er
jetzt am Aufliegen - aufsetzen zeigt den Namen, loslassen nimmt ihn
weg. Ein Tipp wählt die Stadt ohnehin, und dann steht ihr Name unten
im Bereich; ein Kasten, der danach noch zwei Sekunden nachhängt, wäre
genau der Geist gewesen, der repariert werden sollte.

**Fahrzeuge zeigen, wohin sie fahren.** Statt runder Punkte sind
rollende Wagen jetzt langgezogene Dreiecke mit der Spitze in
Fahrtrichtung. Wer an einer Rampe steht oder Ruhezeit hat, bleibt ein
Quadrat - er hat in diesem Augenblick keine Fahrtrichtung, und eine
Spitze würde eine behaupten. Die Form trägt damit eine Aussage, die
vorher nur in der Liste stand.

Zwei Entscheidungen dahinter:

- Der Kurs wird aus den **Bildkoordinaten** gerechnet, nicht aus Länge
  und Breite. Die Karte ist eine Plattkarte, in der derselbe
  geographische Kurs weiter oben anders aussieht als weiter unten; wer
  geographisch peilt, bekommt eine Spitze, die neben der Straße zeigt.
- Der Umriss kommt über `drop-shadow`, nicht über `border` oder
  `box-shadow`: `clip-path` beschneidet den Rahmen mit und schneidet
  äußere Schatten ganz weg, ein `drop-shadow` folgt dagegen der
  beschnittenen Form.

Geprüft mit `browsertest-karte-marken.js`. Er stellt den gemeldeten
Fehler nach (Fingertipp, Neuzeichnen, Ansichtswechsel) und rechnet für
das Dreieck eine Richtungsprobe: Kurs laut Marke gegen die Strecke,
die der Wagen in den nächsten zwei Stunden tatsächlich zurücklegt -
zuletzt 57° gegen 77°, also 20° Abweichung, wie es bei einer kurvigen
Straße sein soll. Die ganze Suite - 20 Tests - läuft grün.

## Vorheriger Stand (v0.15.34)

**Platz beim Zusammenstellen einer Tour.** Gemeldet wurde: Mit vier
Etappenzielen bleibt unten von der Auftragsliste nichts mehr übrig.
Nachgemessen auf einem Telefon (400×880) im Frachtschritt:

| im Frachtbrief | Frachtbrief | Fenster der Liste | Inhalt der Liste |
|---|---|---|---|
| leer | 71 px | 294 px | 954 px |
| 1 Sendung | 128 px | 237 px | 954 px |
| 2 Sendungen | 160 px | 205 px | 954 px |
| 3 Sendungen | 192 px | 173 px | 954 px |

Der Dispositionsbereich war mit 391 px fest - weniger als die Hälfte
des Bildschirms. Bei drei Sendungen rollte man 954 px durch ein
173-px-Fenster. Warnhinweise machen es schlimmer: Eine Etappenzeile
misst 32 px, mit Hinweis rund das Doppelte. Drei Gegenmaßnahmen:

**1. Ein Fensterteiler zwischen Karte und Disposition.** Eine Leiste
mit Griffrillen, wie sie jedes Fenster dieser Zeit hatte. Ziehen teilt
neu auf, Doppeltippen springt durch drei Rasten (Karte groß ·
halbe-halbe · Liste groß), die Teilung wird gemerkt. Die Untergrenzen
stehen in `teilungSetzen()` und rechnen in Pixeln gegen die echte
Fensterhöhe - ein `min-height` im Stylesheet hätte beim Ziehen
dagegengearbeitet und den Teiler vom Finger abgekoppelt. Nach jeder
Höhenänderung werden Marken und Route neu gesetzt, weil sie außerhalb
der gezoomten Bühne liegen und aus der Rahmengröße berechnet werden.

**2. Die Sendungsliste im Frachtbrief klappt ab zwei Sendungen ein.**
Stehen bleibt eine Zeile: `▸ 3 Sendungen · 12.000 DM · 15,0 t` und,
wenn es welche gibt, die Zahl der Hinweise. Die angefangene Sendung
bleibt immer sichtbar - sie trägt den Verwerfen-Knopf. Aufgeklappt hat
die Liste einen Deckel von 96 px und rollt darüber hinaus selbst.

Kurz war der Deckel auf dem ganzen Frachtbrief - das war falsch und
ist im Stylesheet als Warnung vermerkt: Weggerollt wurde dann auch die
Feldzeile *Ab · Ladung · Nach · Wagen*, und die ist der einzige Rückweg
in einen früheren Schritt. Gedeckelt wird jetzt nur das eine Stück,
das wächst; alles andere im Brief hat feste Höhe. `browsertest-platz.js`
prüft genau das mit.

Nebenbei aufgefallen: Die Überschrift zählte `Frachtbrief · 4
Sendungen`, die Zusammenfassung darunter `3 Sendungen` - die eine
zählte die angefangene Sendung mit, die andere nicht. Zwei
verschiedene Zahlen übereinander sind schlimmer als keine, deshalb
schweigt die Überschrift jetzt, sobald es die Zusammenfassung gibt.

**3. Der Ladungsbalken sagt, was noch draufpasst.** Bisher stand dort
der Stand (`15,0 / 24,0 t`), gebraucht wird beim Zusammenstellen aber
die Gegenfrage. Neu darüber eine Zeile:

> Ab Rostock frei · **10,0 t** · 47 m³

Zwei Dinge daran sind wichtig. Erstens gilt der Rest **am Ladeort**,
nicht für die Tour: Nach einem Abladestopp ist wieder Platz, auch wenn
der Auflieger vorher randvoll war. Die Balken zeigen weiterhin den
vollsten Abschnitt, also die Grenze der Tour als Ganzes - beides zu
vermengen wäre der häufigste Irrtum. Zweitens wird die Grenze
hervorgehoben, die **zuerst** greift: Dämmstoff füllt den Laderaum,
Stahl das Gewicht, und wer nur auf die Tonnen schaut, wundert sich.

Ist es am Ladeort eng und weiter hinten in der Tour wieder frei, kommt
`ab Hannover 19,0 t` dazu - aber nur dann, sonst wäre es eine Zeile,
die immer dasteht und nie etwas sagt. Vor dem Fahrzeugschritt gibt es
noch keinen Wagen; gerechnet wird dann gegen den Wagen, mit dem auch
der Zielschritt rechnet, und das steht als `gegen F-SP 101` dabei.

In der Frachtliste schließlich sagen die Zeilen, die passen, jetzt
auch etwas: `5,0 t blieben frei`. Den umgekehrten Fall gab es schon
(`Neben der bisherigen Ladung nur noch 9,0 t frei`), den positiven
nicht - man musste jede Zeile einzeln probieren.

Ergebnis derselben Messung nach dem Umbau: Die Liste bleibt bei 223 px,
gleichgültig ob zwei, drei oder vier Sendungen im Brief stehen, und
mit dem Teiler auf „Liste groß" sind es rund 380 px.

Geprüft mit `browsertest-platz.js` (Rasten, Ziehen, gemerkte Teilung,
gleichbleibende Listenhöhe, Ein- und Ausklappen, Höhendeckel,
erreichbare Feldzeile, Restmenge auf die Nachkommastelle). Die ganze
Suite - 19 Tests - läuft grün.

## Vorheriger Stand (v0.15.33)

**Die Auftragsübersicht - und aus „Tourenplanung" wird „Disposition".**

Bisher sah man Aufträge nur, wenn man in der Planung eine Stadt
angetippt hatte. Wer wissen wollte, wo überhaupt etwas zu holen ist,
musste Stadt für Stadt durchprobieren. Das neue Programm **Aufträge**
legt alle offenen Aufträge in eine Liste.

Jede Zeile rechnet mit: Zu jedem Auftrag wird das nächste freie,
passende Fahrzeug gesucht, die Anfahrt dazugerechnet, Sprit und
Standzeit abgezogen - und daraus **DM je Tag** gebildet. Das ist
dieselbe Kennzahl wie in der Disposition, damit beide Programme
dieselbe Sprache sprechen. Aufträge, für die kein passender Wagen
frei ist, bleiben sichtbar, treten aber grau zurück und haben keinen
Übernehmen-Knopf: Man soll sehen, was es gäbe, ohne es für eine
Möglichkeit zu halten. Hinter der Schrift liegt wie in der Disposition
ein Balken, hier für die verbleibende Frist am Markt.

Dazu drei Filter (alle / ab meinen Standorten / ladbar), eine Suche
über Städte, Ware und Auftraggeber, und Sortierung nach DM je Tag,
Entgelt, Frist, Entfernung oder Nähe. **Übernehmen** öffnet die
Disposition mit gesetzter Ladestadt und Fracht direkt beim Ziel.

Zwei Dinge fielen beim Bauen auf und sind mitrepariert:

- Nach „Neues Spiel" war die Börse leer. Der Auftragstakt hängt an der
  Uhr, und die läuft nur, solange Fahrzeuge unterwegs sind - beim
  Neustart also nie. `Speicher.neuBeginnen()` füllt die Börse jetzt
  selbst.
- **Tourenplanung heißt jetzt Disposition**, auf dem Schreibtisch, im
  Fenstertitel und in der Taskleiste. Intern bleibt alles
  `tourenplanung` bzw. `tour-*`: Der Name steckt in Fenster-Ids,
  CSS-Klassen und Tests, und eine Umbenennung dort wäre viel Risiko
  für null Gewinn.

Geprüft mit `browsertest-auftragsuebersicht.js` (Umbenennung, gefüllte
Börse, vollständige Liste, gesperrte Zeilen, drei Filter, Suche, beide
Sortierungen, Übernehmen landet bei Schritt 2). Die ganze Suite - 18
Tests - läuft grün.

## Vorheriger Stand (v0.15.32)

**Nachtrag zu 0.15.31: Nach „❮ Zur Tour" tat „+ Sendung ab …" nichts.**
Der Knopf begann damit, die offene Sendung zu übernehmen - und brach
ab, wenn es keine gab. Genau das ist nach „Zur Tour" aber der Zustand.
Beide Knöpfe gehen jetzt durch dieselbe Funktion, die eine offene
Sendung übernimmt, falls es eine gibt, und in der genannten Stadt die
nächste beginnt.

Dazu: Auf der Durchsicht selbst steht „❮ Zur Tour" nicht mehr - dort
ist man ja schon.

## Vorheriger Stand (v0.15.31)

**„+ Beiladung" war eine Falle.** Wer sie drückte und es sich anders
überlegte, stand im Frachtschritt ohne gewählte Fracht - und die
einzige Schaltfläche, die dort hinausführte, war das Kreuz, das die
ganze Tour wegwarf. Der Knopf „↺ Sendung" erschien erst, wenn schon
etwas gewählt war, also genau dann nicht, wenn man ihn brauchte.

Jetzt steht im Kopf des Frachtbriefs immer einer von beiden:

- **„↺ Sendung"**, solange an einer Sendung gearbeitet wird - verwirft
  nur diese.
- **„❮ Zur Tour"**, solange noch nichts gewählt ist - führt ohne
  weitere Sendung zurück zur Durchsicht.

Beide landen auf der Durchsicht, nicht in einer leeren Frachtliste:
Nach dem Verwerfen will man sehen, was die Tour jetzt ist. Das Kreuz
rechts wirft weiterhin alles weg.

Nebenbei: Nach einer Anschlusssendung zeigte die Startleiste zwei
Knöpfe, die dasselbe taten - „Beiladung ab München" und „Anschluss ab
München". Der Unterschied besteht nur, solange die Ladestadt eine
andere ist als der letzte Halt; sonst steht dort jetzt ein Knopf.

## Vorheriger Stand (v0.15.30)

**Die Zielliste hat Reiter statt zweier Listen untereinander.** „In der
Nähe" und „Fernverkehr" als Registerkarten, wie Windows 98 sie hatte -
immer nur eine Liste sichtbar, die andere einen Klick entfernt. Der
aktive Reiter steht etwas höher und geht unten offen in das Blatt
über.

Zwei Vorteile gegenüber den Abschnitten: Man scrollt nicht mehr an der
einen Liste vorbei, um zur anderen zu kommen, und weil nur eine
sichtbar ist, passen 15 statt 10 Ziele hinein. Die Zahl neben dem
Reiternamen sagt, wie viele Möglichkeiten dahinterliegen; ist ein
Reiter leer, ist er abgeblendet und der andere öffnet sich von selbst.
Welcher Reiter offen ist, bleibt über den Schritt hinaus stehen - wer
im Fernverkehr sucht, sucht meist weiter dort.

Unter der Reiterleiste steht, was der Reiter bedeutet: „bis 400 km ·
abends wieder greifbar" gegen „über 400 km · bindet den Wagen mehrere
Tage".

## Vorheriger Stand (v0.15.29)

**Anlass: „Warum kann ich kein Stückgut von Leipzig nach Berlin
fahren?"** Man konnte - die Liste zeigte es nur nie. Von Leipzig aus
fragen 83 Städte Stückgut nach, Berlin war Platz 83 davon, und die
Liste brach nach 25 Einträgen ab. Die ersten 25 lagen sämtlich auf der
iberischen Halbinsel.

**Der Grund lag tiefer als die Sortierung: Laden und Abladen kosteten
nichts.** Ein Fahrzeug hielt, die Ware war drin, weiter. Damit war
jeder Kurzlauf rechnerisch dreimal so gut wie eine Ferntour - nicht
weil Kurzläufe so gut sind, sondern weil die Rampe fehlte.

**Standzeit je Stopp.** Rund zwei Stunden laden, zwei abladen; Silo
und Tank brauchen zum Pumpen länger, ein Kipper ist in Minuten leer.
Die Zeit vergeht wirklich: Das Fahrzeug steht, bevor es losrollt, und
die Tourenliste zeigt „an der Rampe". Was das mit den Zahlen macht:

| Ziel | vorher je Tag | mit Standzeit |
|---|---|---|
| Berlin, 180 km | 9.400 DM | 3.854 DM |
| Lisboa, 2.957 km | 3.226 DM | 3.107 DM |

Aus einem Faktor 3 wird ein Unterschied von 20 %. Das ist kein
Balancing-Regler, sondern eine fehlende Tatsache - und sie trägt sich
selbst: Wer zehn Kurzläufe hintereinander fährt, verliert zwei
Arbeitstage an Rampen. Die Sätze stehen in `kostensaetze.js` und sind
als nicht belegt gekennzeichnet.

**Die Zielliste hat zwei Abschnitte** statt eines Schnitts bei 25: „In
der Nähe, bis 400 km" und „Fernverkehr", jeder für sich sortiert,
jeder mit seinen besten zehn. Damit steht Berlin oben in seinem
Abschnitt und Wien oben in seinem, und keine 58 Möglichkeiten
verschwinden stillschweigend.

**Sortiert wird nach Deckungsbeitrag je Tag**, und beide Zahlen stehen
da. Der Deckungsbeitrag sagt, was in die Kasse kommt; der Tageswert
sagt, was die Tour wert war - nur er lässt sich zwischen 180 und 2.900
km vergleichen. Der Gütebalken hängt jetzt am Tageswert. Bewusst
keine Formel, die beides zu einer Punktzahl verrechnet: Dann
optimierte der Spieler eine Zahl, die es in der Wirklichkeit nicht
gibt, statt eine Entscheidung zu treffen.

**Rückfracht-Aussicht je Ziel.** Eine Ferntour in eine Stadt ohne
Rückladung heißt, denselben Weg leer zurück - das gehört in die
Entscheidung, nicht in die Überraschung danach. Gewertet wird die Güte
des Frachtplatzes (Frachtknoten und Großstadt gegen Landstädtchen),
nicht die Zahl der offenen Aufträge: Die Börse erzeugt für jede
angesteuerte Stadt mindestens sechs, sobald man hinsieht - „keine
Rückfracht" wäre dort schlicht falsch gewesen.

**Bindungsdauer.** Jede Zielzeile sagt „bindet 13 Std", die
Zusammenfassung nennt die Gesamtdauer samt Rampenanteil. Bei einem
Fahrzeug ist das die härteste Währung, härter als DM.

Nebeneffekt, der so gewollt ist: Der Tageswert hat sein Maximum jetzt
bei 500 bis 600 km - ein Lenktag hin, laden, abladen. Ferntouren
lohnen sich nur noch mit guter Rückladung, und genau dafür gibt es die
Anschluss- und Beiladungsplanung.

## Vorheriger Stand (v0.15.28)

**Beiladung: mehrere Sendungen zugleich an Bord.** Auf dem
Abschlussbildschirm stehen jetzt zwei Wege weiter - „+ Beiladung ab
*Stadt*" nimmt noch eine Sendung ab demselben Ort mit, „+ Anschluss ab
*Ziel*" hängt eine hinter der letzten an. Bis zu vier Sendungen je
Tour; darüber wird der Frachtbrief unübersichtlich.

Damit ist eine Tour keine Kette von Etappen mehr, sondern eine **Liste
von Sendungen**, aus der die Stoppfolge berechnet wird:

    Hamburg  ▲ 8,0 t → Frankfurt am Main
             ▲ 8,0 t → Hannover        16,0 t an Bord
    Hannover ▼ 8,0 t                    8,0 t an Bord
    Frankfurt am Main ▼ 8,0 t

Zwei Regeln begrenzen die Reihenfolge: Abgeladen werden kann nur, was
vorher geladen wurde, und geladen nur, was noch hineinpasst. Gesucht
wird nicht das Optimum, sondern der jeweils nächstgelegene zulässige
Schritt - die Nächster-Nachbar-Heuristik, wie ein Disponent sie im
Kopf auch anwendet: Was auf dem Weg liegt, kommt zuerst. Hannover vor
Frankfurt, ohne dass man es sagen muss.

**Zwei Grenzen, zwei Balken.** Gewicht und Laderaum laufen
unterschiedlich schnell voll - fünf Tonnen Dämmstoff füllen den
Auflieger, fünf Tonnen Stahl liegen in einer Ecke. Der Frachtbrief
zeigt beides für den vollsten Abschnitt der Tour. Die Frachtliste
rechnet mit dem, was noch frei ist, und begründet die Sperre
entsprechend („Neben der bisherigen Ladung nur noch 4,2 t frei").

Was dabei an Bord ist, hängt vom Ort ab: Wer in derselben Stadt
dazulädt, teilt sich den Auflieger; wer am Ziel der letzten Sendung
weiterlädt, findet ihn leer vor. Genau darin unterscheiden sich
Beiladung und Anschluss.

**Der Sprit wird je Teilstrecke einmal gebucht**, nicht je Sendung -
sonst zahlte eine Tour mit drei Sendungen ihn dreimal. Beim Abladen
teilt sich jede Sendung die Kosten der Strecken, auf denen sie
mitgefahren ist, nach Tonnage. Leerfahrten gehen zulasten dessen,
wofür sie gefahren wurden: der Sendung, die am Ende der Leerstrecke
zusteigt. Der Verbrauch je Etappe steht im Spielstand, sonst stünde
eine Sendung nach dem Neuladen ohne ihre Vorgeschichte da.

**Spicken auf dem Telefon.** Die Kartenvorschau hing bisher am Zeiger
und fiel ohne Maus aus. Jetzt hält man eine Zeile kurz gedrückt: Nach
250 ms leuchtet die Karte auf, und der Klick, der die Zeile sonst
auswählen würde, wird verschluckt. Wer scrollt, spickt nicht - eine
Fingerbewegung über zehn Bildpunkte bricht ab.

## Vorheriger Stand (v0.15.27)

**Die Karte nimmt vorweg, wohin eine Fracht ginge.** Fährt der Zeiger
über eine Zeile der Frachtliste, zeigt die Karte sofort, wer sie
annimmt - ohne dass man sich festlegt:

- **Fester Auftrag** (Frachtbörse oder Kunde): Genau die eine
  vorgegebene Stadt bekommt einen roten Ring, dazu die Strecke als
  gestrichelte Vorschau. Der Auftraggeber bestimmt das Ziel, also gibt
  es auch nur eines zu zeigen.
- **Spotware**: Alle Städte mit Bedarf leuchten auf. Hier sucht man
  sich den Abnehmer selbst, und wie viele infrage kommen, entscheidet
  über den Wert der Ladung.

Die Spotzeile nennt die Zahl der Abnehmerstädte gleich mit, und Ware,
die niemand nachfragt, ist gesperrt statt erst im nächsten Schritt in
eine leere Zielliste zu führen.

Dazu eine **Legende** unter der Karte: Depot, eigenes Fahrzeug, Ziel,
Abnehmer. Ringe ohne Erklärung sind nur hübsch. Ihre Farben sind
dieselben wie auf der Karte.

Die Vorschau baut die Karte nicht neu auf, sondern schaltet nur die
Klassen der vorhandenen Marken um. 165 Marken bei jeder Zeigerbewegung
neu zu erzeugen kostete auf Telefon-Niveau ein Vielfaches und ließe
die Liste ruckeln.

**Eine angefangene Etappe lässt sich einzeln verwerfen.** Bisher gab es
nur das Kreuz, das die ganze Planung wegwarf. Jetzt steht die Etappe in
Arbeit als eigene, gelb gestrichelte Zeile in der Etappenliste, und im
Kopf des Frachtbriefs sitzt „↺ Etappe". Beides verwirft nur die offene
Etappe; die festgelegten bleiben stehen, und die Planung steht danach
wieder dort, wo die letzte festgelegte endet.

## Vorheriger Stand (v0.15.26)

**Eine Tour kann mehrere Frachten nacheinander fahren.** Auf dem
Abschlussbildschirm steht neben „Losschicken" jetzt „+ Anschlussfracht
ab *Ziel*". Sie führt zurück in Schritt 1 - mit der Zielstadt der
eben geplanten Etappe und dem Fahrzeug, das schon feststeht. Der
Rhythmus bleibt derselbe, er wiederholt sich nur. Damit endet die
Leerrückfahrt als Normalfall.

Der Frachtbrief wird dabei zum **Ladeverzeichnis**: über den vier
Feldern steht die Liste der festgelegten Etappen, jede mit Weg,
Ladung, Entgelt und - falls die nächste Fracht woanders beginnt - den
Leerkilometern dahin. Jede Zeile lässt sich einzeln streichen. Auf der
Karte liegen die festgelegten Etappen gestrichelt, die in Arbeit
durchgezogen.

**Das Datenmodell: Stopps statt einer Fahrt mit einem Auftrag.** Bis
Fassung 2 trug eine Tour genau eine Auftragsnummer - sie konnte
deshalb nur eine einzige Sendung befördern. Jetzt ist eine Tour eine
Folge von Stopps, zwischen denen die Etappen liegen:

    stopps[0] --etappen[0]--> stopps[1] --etappen[1]--> stopps[2]

An jedem Stopp wird zu- und abgeladen, beides als **Liste**, auch wenn
0.15.26 je Stopp nur einen Eintrag erzeugt. Die Beiladung mehrerer
Sendungen zugleich füllt dieselben Listen, ohne dass das Modell noch
einmal umgebaut werden muss. Abgerechnet wird an jedem Stopp einzeln:
Verschleiß für die gefahrene Strecke, Erlös in die Buchhaltung, Kunde
bewertet, Eintrag ins Protokoll.

Die Rückrufe an den Stopps fangen bewusst **keine Umgebung** ein,
sondern lesen alles aus der Stoppliste. Nur so überleben sie das Laden
eines Spielstands - vorher ging bei einer wiederhergestellten Tour der
Rückruf für die Beladung verloren.

**Feste Buchung mit Risiko.** Beim Losschicken werden alle Aufträge
der Tour reserviert und stehen niemandem sonst mehr zur Verfügung. Dafür
rechnet die Planung jede Etappe der Reihe nach durch und warnt, bevor
man sich bindet: verpasstes Ladefenster, nicht zu haltender
Liefertermin, lange Standzeit bis zur Ladebereitschaft. `terminMachbar`
nimmt dazu einen Startzeitpunkt entgegen - ohne den ließe sich eine
Fahrt, die erst in drei Tagen beginnt, nur raten.

Spielstand auf **Fassung 3**. Fuhrpark und Tourenliste zeigen „Etappe
2 von 3" und den nächsten Halt.

## Vorheriger Stand (v0.15.25)

**Die Tourenplanung ist ein Frachtbrief geworden.** Vier Schritte,
immer dieselben, immer an derselben Stelle:

    Stadt (Karte) -> 1 Fracht -> 2 Ziel -> 3 Fahrzeug -> 4 Losschicken

Das Fahrzeug steht jetzt am Ende. Erst dort sind alle Randbedingungen
bekannt - Aufbau, Tonnage, Entfernung, Termin -, und die Liste kann
sortiert werden statt nur aufgezählt: je Zeile Erlös, Spritkosten und
Deckungsbeitrag genau für diesen Wagen, der beste oben.

**Die Fahrzeugliste im Dispositionsbereich ist ersatzlos entfallen.**
Die Flotte steht als Ring auf der Karte, dort, wo sie hingehört. Wer
Einzelheiten will, öffnet den Fuhrpark.

**Gestaltungsregeln, die jetzt im ganzen Ablauf gelten:**

*Die Zeile ist der Knopf.* Antippen wählt und schaltet weiter. Es gibt
keinen Weiter-Knopf mehr; der einzige echte Knopf im Ablauf ist
„Losschicken" - dadurch bekommt er Gewicht. Vier Klicks, vier
Entscheidungen, kein Beiwerk.

*Der Frachtbrief ersetzt Schrittleiste und Zurück-Knopf.* Vier Felder
über der Liste, die sich füllen: Ab · Ladung · Nach · Wagen. Jede
getroffene Wahl bleibt sichtbar stehen, jedes gefüllte Feld ist
anklickbar und springt zu genau diesem Schritt zurück. Die Felder
haben feste Höhe, damit beim Füllen nichts springt.

*Ein Balken hinter der Schrift bedeutet überall dasselbe: lang ist
gut.* Bei der Fracht die Restfrist, beim Ziel der Deckungsbeitrag im
Verhältnis zum besten Ziel, beim Fahrzeug der Deckungsbeitrag im
Verhältnis zum besten Wagen - rot, sobald der Liefertermin fällt. Man
lernt es einmal und liest danach jede Liste, ohne zu lesen.

*Der feste Auftrag bekommt keine Sonderbehandlung.* Sein Ziel steht
fest, also zeigt Schritt 2 genau eine Zeile: den vorgegebenen Ort mit
Frist und Entgelt. Derselbe Handgriff an derselben Stelle. Ein Ablauf,
der je nach Frachtart mal drei und mal vier Schritte hat, lässt sich
nicht einüben.

*Nie eine Sackgasse.* Kann kein Fahrzeug vor Ort die Fracht nehmen,
zeigt Schritt 3 die Leerfahrt-Anforderung statt einer Absage.

*Die Karte antwortet auf jeden Schritt.* Stadt gewählt → Ausschnitt
zoomt hin. Fracht gewählt → Bedarfsstädte pulsieren. Ziel gewählt →
Route wird gezeichnet.

Bei Spotladung hängt der Erlös an der Menge und damit am Fahrzeug, das
im Zielschritt noch nicht gewählt ist. Gerechnet wird dort deshalb mit
dem Kandidaten größter Zuladung; der Schrittkopf sagt, mit welcher
Menge. Schritt 3 beziffert es dann je Zeile genau.

## Vorheriger Stand (v0.15.24)

**Der Fuhrpark zeigte nur ein Fahrzeug, wenn man ihn zuerst öffnete.**
Das Laden des Spielstands hing am ersten Öffnen der Tourenplanung. Wer
stattdessen mit dem Fuhrpark anfing, bekam nicht seine Flotte zu
sehen, sondern eine frisch angelegte Startflotte mit einem einzigen
Fahrzeug - der Fuhrpark legt sie nämlich selbst an, wenn keine da ist.
Die übrigen Fahrzeuge tauchten erst auf, sobald die Tourenplanung den
Stand nachlud. Der Spielstand wird jetzt beim Seitenaufruf geladen,
unabhängig davon, welches Programm zuerst geöffnet wird.

Dabei kam ein zweiter Fehler mit heraus: Ankunfts- und
Nachholmeldungen liefen durch Zeichenfunktionen, die ein offenes
Fenster voraussetzten. Ohne Fenster warf das eine Ausnahme und brach
die Nachholsimulation mittendrin ab - aus vier nachzuholenden
Spieltagen wurde einer. Die Funktionen prüfen jetzt erst, ob es
überhaupt etwas zu zeichnen gibt.

**Die eigene Flotte steht in der Tourenplanung immer ganz oben**, in
jedem Schritt. Wer disponiert, muss jederzeit sehen, was er hat.
Ab etwa vier Zeilen scrollt die Liste in sich selbst, damit sie bei
wachsendem Fuhrpark nicht die halbe Seite frisst.

**Neuer Knopf "⌂ Übersicht"** neben dem Stadtnamen: hebt die
Stadtauswahl auf und führt zurück in den Zustand beim Öffnen.

**Vom Fuhrpark auf die Karte.** Die Detailansicht hat einen Knopf
"🗺 Auf der Karte". Er wechselt in die Tourenplanung: Fährt das
Fahrzeug gerade, wird seine Strecke hervorgehoben und der
Kartenausschnitt darauf gelegt; steht es, wird sein Standort gewählt,
sodass sich von dort sofort disponieren lässt. In beiden Fällen ist
seine Zeile in der Flottenliste markiert. Der bisherige Knopf im
Unterwegs-Block heißt jetzt "Tourkarte" - er zeigt weiterhin das
kleine Einzelfenster zur laufenden Fahrt.

## Vorheriger Stand (v0.15.23)

**Tourenplanung ohne Startknopf - die Karte ist der Einstieg.**
Eine Stadt antippen genügt: Darunter steht sofort, was von dort
ausgeht. Der Knopf "Tour planen" ist ersatzlos entfallen.

Neue Schrittfolge - die Fracht steht jetzt vor dem Fahrzeug:

    Stadt (Karte) -> 1 Fracht -> 2 Fahrzeug -> 3 Ziel -> 4 Start

Das entspricht der Disposition: Erst weiß man, was zu fahren ist, dann
sucht man den Wagen dazu. Die Frachtliste prüft jede Zeile gegen alle
Fahrzeuge, die für diese Stadt infrage kommen, und sperrt sie erst,
wenn keines die Ladung nehmen könnte - mit dem Grund daneben ("Kein
passender Aufbau verfügbar", "Zuladung reicht nicht"). Der Fristbalken
wird rot, sobald kein passendes Fahrzeug den Termin mehr halten kann,
Anfahrt eingerechnet.

Die Fahrzeugliste ist umgekehrt nach der Fracht gefiltert: Wer sie
nicht laden kann, steht gesperrt darunter, damit der Grund sichtbar
bleibt. Steht nichts Passendes vor Ort, folgt direkt die
Leerfahrt-Anforderung - und auch die bietet nur noch Fahrzeuge an, die
diese Ladung überhaupt nehmen dürfen. Ein Kipper, der 900 km leer
anrollt und dann keine Papierrollen laden darf, war kein Vorschlag,
sondern eine Falle.

Weiteres: Der Pfeil am Zeilenende wählt und schaltet in einem Zug
weiter - auch in der Frachtliste. "Planung abbrechen" heißt jetzt
"Auswahl verwerfen" und führt auf die Frachtliste der Stadt zurück;
eine andere Stadt auf der Karte tut dasselbe. Die Übersicht über
Flotte und laufende Fahrten steht unter der Frachtliste statt darüber:
zuerst die Entscheidung, dann der Bestand.

## Vorheriger Stand (v0.15.22)

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
      auftraege.css
      anzeige.css      Eigenschaften von Anzeige (Registerkarten)
  werkzeug/            Skripte zur Datenerzeugung (laufen nicht im Spiel)
    LIESMICH.md        Herkunft und Ablauf
    netz2.py           Straßengraph aus Natural Earth
    routen.py          Städte anbinden, Wege suchen
    strassen_zeichnen.py  Netz in die Karte malen
    css-auf-skala.py      Rechnet die Stylesheets von festen Pixeln auf
                          die eine Skalierungsgröße um
  docs/
    historischer-rahmen-1994.md   Zeitliche Gegebenheiten (zu verifizieren)
    kosten-1994.md                Kostendaten mit Quellen, offene Punkte markiert
    spieldesign.md                Was belegt gutes Spieldesign ausmacht, mit
                                  Prüffragen und der Anwendung auf dieses
                                  Projekt - vor Designentscheidungen lesen
    optik-und-bedienung.md        Optik und Bedienbarkeit: 74 Prüfregeln,
                                  32 Testfälle und der gemessene Stand des
                                  Nachbaus - vor Oberflächenarbeit lesen
  js/
    core/
      anzeige.js        Größe, Kontrast, Zeilendichte, Eingabeart -
                        liegt getrennt vom Spielstand
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
      anzeige/
        anzeige.js       Eigenschaften von Anzeige: Größe, Kontrast,
                         Zeilendichte, Eingabeart
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
