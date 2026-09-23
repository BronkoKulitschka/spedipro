# Kostendaten Spedition 1994

Grundlage für das Finanzmodul. Anders als
`historischer-rahmen-1994.md` ist dies **keine Gedächtnisnotiz**:
Jeder Wert hier hat eine Quelle, oder er ist ausdrücklich als
ungeklärt gekennzeichnet.

Recherchestand: 21.09.2026, ergänzt am 23.09.2026 (Abschnitte 9 bis 12).
Spielstart ist der 01.03.1994.

Kennzeichnung:
- **belegt** — Quelle genannt, Wert gilt für den angegebenen Zeitraum
- **hergeleitet** — aus belegten Werten gerechnet, Rechenweg genannt
- **offen** — noch kein belegter Wert; darf nicht als Zahl ins Spiel

---

## 1. Kraftstoff

**belegt.** Durchschnittlicher Dieselpreis in Deutschland, DM je Liter:

| Jahr | DM/l |
|------|------|
| 1990 | 1,02 |
| 1991 | 1,07 |
| 1992 | 1,06 |
| 1993 | 1,08 |
| **1994** | **1,14** |
| 1995 | 1,12 |
| 1996 | 1,22 |
| 1997 | 1,24 |
| 1998 | 1,14 |

Quelle: was-war-wann.de, Dieselpreise 1950 bis heute
<https://www.was-war-wann.de/historische_werte/dieselpreise.html>

**Folge für den Code:** `DIESELPREIS_DM` in
`js/apps/tourenplanung/tourenplanung.js` steht auf 1,05 und ist dort
selbst als ungeprüfte Größenordnung markiert. Der belegte Wert für 1994
ist **1,14**. Gehört ins Finanzmodul, nicht in die Tourenplanung, und
sollte dem Spieljahr folgen statt fest zu sein — die Tabelle deckt
1990 bis 1998 ab.

Offen: Ob es sich um Tankstellenpreise inklusive Umsatzsteuer handelt.
Eine Spedition zieht die Vorsteuer ab und tankt zu Großabnehmer-
konditionen. Der Einkaufspreis eines Fuhrparkbetriebs lag darunter —
um wie viel, ist **offen**.

---

## 2. Abschreibung

**belegt.** AfA-Tabelle für den Wirtschaftszweig "Personen- und
Güterbeförderung", Fassung vom 26.01.1998:

| Anlagegut | Nutzungsdauer |
|-----------|---------------|
| Lastkraftwagen unter 7,5 t | 6 Jahre |
| Lastkraftwagen ab 7,5 t, Sattelschlepper | 5 Jahre |
| Anhänger | 6 Jahre |

Quelle: Bundesministerium der Finanzen, AfA-Tabelle Personen- und
Güterbeförderung
<https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/Weitere_Steuerthemen/Betriebspruefung/AfA-Tabellen/AfA-Tabelle_Personen-und-Gueterbefoerderung.html>

Die allgemeine AfA-Tabelle für Anlagegüter nennt für nach dem
31.12.2000 angeschaffte Fahrzeuge längere Zeiten (Lkw und
Sattelschlepper 9 Jahre, Auflieger und Anhänger 11 Jahre). Für ein
Speditionsunternehmen gilt die Branchentabelle, also die kürzeren
Zeiten. Quelle: abschreibung.de, Abschreibungstabelle
<https://www.abschreibung.de/abschreibungstabelle.htm>

**Offen:** Die Branchentabelle stammt von 1998, das Spiel beginnt 1994.
Ob die Vorgängerfassung dieselben Zeiten nannte, ist nicht geprüft.
Fünf Jahre für die Zugmaschine decken sich aber mit der gängigen
Fahrzeugkostenrechnung des Gewerbes, sind also plausibel.

---

## 3. Zinsen

**belegt.** Leitzinsen der Deutschen Bundesbank:

| gültig ab | Diskontsatz | Lombardsatz |
|-----------|-------------|-------------|
| 05.02.1993 | 8 % | 9 % |
| 18.02.1994 | 5,25 % | 6,75 % |
| 15.04.1994 | 5,00 % | 6,50 % |
| 13.05.1994 | 4,50 % | 6,00 % |
| 31.03.1995 | 4,00 % | 6,00 % |
| 15.12.1995 | 3,00 % | 5,00 % |
| 19.04.1996 | 2,50 % | 4,50 % |

Quelle: Deutsche Bundesbank, Diskont- und Lombardsatz
<https://www.bundesbank.de/resource/blob/650692/4c494f43a79b5d3ef351b575017711eb/472B63F073F071307366337C94F8C870/s510ttdiskont-data.pdf>

Zum Spielstart am 01.03.1994 galt also **Diskontsatz 5,25 %**.

**Offen:** Der Zins, den eine mittelständische Spedition 1994 für einen
Investitionskredit zahlte, nicht der Leitzins. Üblich ist ein
Aufschlag auf den Leitzins; die Höhe ist hier **nicht belegt**. Ebenso
offen: der Kontokorrent-/Dispozins, der deutlich darüber lag.

---

## 4. Straßenbenutzungsgebühren

Das ist der Punkt, an dem Raten am teuersten gewesen wäre.

**belegt: In Deutschland gab es 1994 keine Lkw-Maut.** Deutschland nahm
**von 1995 bis 2003** am Eurovignettensystem teil. Die Eurovignette
startete zum **01.01.1995** mit Belgien, Dänemark, Deutschland,
Luxemburg, den Niederlanden und Schweden.
Quelle: Wikipedia, Maut <https://de.wikipedia.org/wiki/Maut>

**Österreich:** Die Vignettenpflicht auf Autobahnen und Schnellstraßen
gilt **seit 1997**. Quelle: ebenda. Was 1994 für Lkw im Transit galt,
ist **offen** — Österreich war zu diesem Zeitpunkt noch nicht in der
EU (Beitritt 01.01.1995) und Transitland mit Grenzabfertigung.

**Schweiz:** Seit **1985** eine *pauschale* Schwerverkehrsabgabe für
Fahrzeuge über 3,5 t, nicht leistungsabhängig. Die kilometerabhängige
LSVA kam erst zum 01.01.2001. Die Höhe der Pauschale Mitte der 1990er
ist **offen**.
Quelle: Wikipedia, Schwerverkehrsabgabe (Schweiz)
<https://de.wikipedia.org/wiki/Schwerverkehrsabgabe_(Schweiz)>

**Wichtig fürs Spiel, belegt:** In der Schweiz galt bis zu den
bilateralen Verträgen eine **Gewichtslimite von 28 t**. Ein
40-Tonnen-Sattelzug durfte die Schweiz 1994 nicht durchfahren. Das ist
keine Kostenfrage, sondern eine Routenfrage — und betrifft `route.js`
direkt.

**Offen:** Autobahnmaut Frankreich und Italien 1994 (streckenbezogen,
existierte), Tarife für Lkw.

---

## 5. Kraftfahrzeugsteuer

**Mechanik belegt, Beträge offen.** Die Steuer für schwere
Nutzfahrzeuge bemisst sich nach § 9 Abs. 1 Nr. 4 KraftStG in
**200-kg-Stufen des zulässigen Gesamtgewichts**, mit fünf progressiven
Sätzen und einem Höchstbetrag. Der Höchstbetrag hängt von der
Schadstoff- und Geräuschklasse ab.
Quelle: smartsteuer, Kraftfahrzeugsteuer
<https://www.smartsteuer.de/online/lexikon/k/kraftfahrzeugsteuer/>

Die Einteilung in Schadstoffgruppen geht auf eine Reform von **1985**
zurück; **sechs Schadstoffklassen** kamen **1997**.
Quelle: Wikipedia, Kraftfahrzeugsteuer (Deutschland)
<https://de.wikipedia.org/wiki/Kraftfahrzeugsteuer_(Deutschland)>

**Offen und wichtig:** Die DM-Beträge je 200-kg-Stufe und der
Höchstbetrag in der 1994 geltenden Fassung. Ohne die bleibt die
Kfz-Steuer im Spiel eine erfundene Zahl. Die heutigen Euro-Beträge
(556 € bis 1.681 € je nach Klasse) taugen **nicht** als Ersatz.

Nächster Rechercheweg: Bundesgesetzblatt-Archiv, KraftStG in der
Fassung von 1994; oder Bundestagsdrucksachen zur Kfz-Steuer 1993/94.

---

## 6. Struktur der Fahrzeugkostenrechnung

**Belegt ist die Struktur, nicht die Höhe.** Das Gewerbe rechnet in
vier Blöcken: zeitabhängige Fixkosten, laufleistungsabhängige Kosten,
Personalkosten, Gemeinkosten.

Aktuelles Beispiel für einen Sattelzug bei 120.000 km Jahresfahr-
leistung (Euro, heutige Preise — **nicht für 1994 verwendbar**, nur
als Gliederung und Größenverhältnis):

Fixkosten je Jahr: Abschreibung Zugmaschine 16.000, Abschreibung
Auflieger 3.750, kalkulatorische Zinsen 4.500, Kfz-Versicherung 5.200,
Kfz-Steuer 1.400, Stellplatz 1.800 — Summe 32.650, das sind 0,2721 je
km.

Variable Kosten je km: Kraftstoff 0,4640, Reifen 0,0400, Wartung und
Reparatur 0,0850, Maut 0,1900, Schmierstoffe 0,0100 — Summe 0,7890.

Selbstkosten gesamt rund 1,5939 je km einschließlich Personal und
Gemeinkosten. Nutzungsdauer Zugmaschine 5 Jahre, Auflieger 8 Jahre.

Quelle: verkehrsleiter-eu-lizenz-seminare.de, Fahrzeugkostenrechnung
<https://verkehrsleiter-eu-lizenz-seminare.de/ratgeber/gueterkraftverkehr/fahrzeugkostenrechnung>

**Verwendbar ist daraus:** die Gliederung, das Verhältnis von Fix- zu
variablen Kosten, und die Erkenntnis, dass Kraftstoff der mit Abstand
größte variable Posten ist. **Nicht verwendbar:** jeder einzelne
Betrag.

**Offen:** Eine Kostenstrukturerhebung des BGL oder des Bundesamts für
Güterverkehr aus den 1990ern mit DM-Beträgen. Der BGL führt ein
Branchenkostenmodell, im Netz frei zugänglich sind aber nur aktuelle
Rechnungen.

---

## 7. Marktrahmen

**belegt.** Der **Tarifzwang im deutschen Güterfernverkehr endete zum
01.01.1994.** Bis 1989 galt der Reichskraftwagentarif (RKT), von 1989
bis 1993 der Güterfernverkehrstarif (GFT). Zwei Gesetzesänderungen im
August und November 1993 beendeten die Tarifbindung. Die Bundesanstalt
für den Güterfernverkehr wurde zum Bundesamt für Güterverkehr
umgebaut; mit dem Wegfall der Tarifprüfung entfielen rund 800 Stellen.
Quelle: Wikipedia, Güterfernverkehrstarif
<https://de.wikipedia.org/wiki/G%C3%BCterfernverkehrstarif>

**Das ist für das Spiel ein Glücksfall:** Spielstart ist der
01.03.1994, also zwei Monate nach der Freigabe. Frei verhandelte
Frachtpreise sind für dieses Datum historisch korrekt — der
Spotmarkt-Ansatz in der Tourenplanung braucht keine Rechtfertigung.
Gleichzeitig ist der Preisverfall nach der Deregulierung ein
realistischer Spielfaktor.

---

## 9. Frachtpreisniveau unter dem Tarif

**belegt, aber nur ein Punkt.** Ein konkreter Tarifpreis aus der Zeit
vor der Freigabe: Ein Transport **München → Hannover** mit
hochwertigen **AB-Gütern** kostete unter dem Tarif **2.500 DM**.
Quelle: eurotransport, „Frachtpreise im Wandel"
<https://www.eurotransport.de/fahrer/bkf-news/frachtpreise-im-wandel-preisverfall/>

**hergeleitet.** München–Hannover sind rund 610 Straßenkilometer:

    2.500 DM / 610 km = 4,10 DM je Kilometer
    bei 24 t Nutzlast   = 0,17 DM je Tonnenkilometer

**Einordnung, wichtig:** AB ist eine hohe Tarifklasse, die Zahl ist
also eine **Obergrenze**, kein Durchschnitt. Und sie gilt für den
Zustand *vor* dem 01.01.1994. Das Spiel beginnt zwei Monate nach der
Freigabe, in der einsetzenden Preiserosion — der Marktpreis lag also
darunter, wie weit, ist offen.

**offen:** die Tarifstruktur des GFT selbst (Entfernungs- und
Gewichtsstaffel, Klassen A/B/C, Sätze je Tonne). Die Wikipedia-Seite
beschreibt nur die Rechtsgeschichte; das Tarifwerk selbst ist online
nicht greifbar. Ein Forum mit möglichen Angaben wies den Abruf ab
(403), die Springer-Aufsatzseite zum Tarifaufhebungsgesetz ebenfalls
(Rate-Limit) — beides nicht gelesen.

---

## 10. Vollkosten, Personalanteil und Fahrerlohn

**belegt für heute.** Eine vollständige Fahrzeugkostenrechnung für
einen **40-t-Lkw bei 120.000 km Jahresfahrleistung**, Bezugsjahr
2013/14:

| Posten | je Jahr | je km |
|---|---|---|
| Kraftstoff (36 l/100 km à 1,30 €) | 56.160 € | 0,468 € |
| Reparatur | 18.000 € | 0,150 € |
| Reifen | 8.571 € | 0,071 € |
| **Fahrer** (inkl. 24 % Sozialabgaben) | **50.640 €** | **0,422 €** |
| Versicherung | 3.500 € | — |
| Kfz-Steuer | 4.000 € | — |
| **Selbstkosten gesamt** | 223.748 € | **0,8826 €** |

Der **Personalanteil beträgt 22,6 %** der Fahrzeug-Selbstkosten.
Anschaffungswert 200.000 €, Wiederbeschaffungswert nach 5 Jahren
250.000 €. Quelle: Universität Hamburg, Einführung in Verkehr und
Logistik, Fahrzeugkosten
<https://www.bwl.uni-hamburg.de/vw/lehre/lehre-frueherer-semester/ws2013-14/vul-zwei-fahrzeugkosten.pdf>

Das ergänzt Abschnitt 6 um genau das, was dort fehlte: **die
Fahrerkosten und ihren Anteil.** Beides wird für das Personalmodul
gebraucht.

**hergeleitet für 1994.** Rückrechnung über den Verbraucherpreisindex
(1994 ≈ 73, 2013 ≈ 105 bei 2015 = 100, also Faktor 1,44) und den
Umrechnungskurs 1,95583 DM/€ — zusammen **× 1,358**:

    Reifen + Reparatur  0,221 €/km × 1,358 = 0,30 DM/km
    Selbstkosten gesamt 0,883 €/km × 1,358 = 1,20 DM/km

**Vorbehalt:** In den 0,8826 € steckt möglicherweise deutsche Maut,
die es 1994 nicht gab (siehe Abschnitt 4). Der Wert ist damit eher
eine Obergrenze. Und Löhne sind langsamer gestiegen als die
Verbraucherpreise — die Fahrerkosten über denselben Faktor
zurückzurechnen überschätzt sie.

**Fahrerlohn 1994, hergeleitet.** Der durchschnittliche
Bruttomonatsverdienst aller vollzeitbeschäftigten Arbeitnehmer in
Deutschland betrug 1994 **2.185 €, also 4.273 DM**. Quelle:
Statistisches Bundesamt, lange Reihe Bruttomonatsverdienste
<https://www.destatis.de/DE/Themen/Arbeit/Verdienste/Verdienste-Branche-Berufe/Tabellen/lange-reihe-deutschland.html>

Ein Fernfahrer lag mit Überstunden in dieser Größenordnung. Mit rund
22 % Arbeitgeberanteil ergibt das:

    ~4.300 DM brutto + Nebenkosten ≈ 5.200 DM je Monat
                                   ≈ 62.000 DM je Jahr
                                   ≈ 0,52 DM je km bei 120.000 km

**offen bleibt:** der Tariflohn im Güterkraftverkehr 1994 selbst,
Spesen und Auslöse. Der Durchschnitt aller Branchen ist ein Behelf.

---

## 11. Finanzielle Leistungsfähigkeit

**belegt für heute.** Der Nachweis verlangt **9.000 € für das erste**
und **5.000 € für jedes weitere Fahrzeug**; für Fahrzeuge zwischen 2,5
und 3,5 t seit 21.05.2022 1.800 € und 900 €. Grundlage ist die
EU-Verordnung 1071/2009. Das Kapital muss nicht bar vorgehalten
werden. Quelle: AVB-Seminare, Finanzielle Leistungsfähigkeit
<https://avb-seminare.de/information_fachkunde/selbst%C3%A4ndig_fachkunde_g%C3%BCterkraftverkehr_verkehrsleiter_finanzielle-leistungsf%C3%A4higkeit.php>

**offen:** die DM-Beträge nach GüKG in den 1990ern. Sie sind der
sinnvolle Startwert für das Eigenkapital des Spielers (siehe
Lizenzkapitel in der README) — bis dahin ist jede Zahl geschätzt.

---

## 12. Gegenrechnung: was im Spiel steht

Gemessen am 23.09.2026 in einem frischen Spielstand, Version 0.15.38:

| | im Spiel | recherchiert | |
|---|---|---|---|
| Frachterlös | 0,22 DM/tkm ≈ **5,28 DM/km** bei 24 t | 4,10 DM/km als **Obergrenze** unter dem Tarif | zu hoch |
| Reifen und Verschleiß | **0,08 DM/km** | 0,30 DM/km (hergeleitet) | zu niedrig |
| Fahrerkosten | **gibt es nicht** | ~5.200 DM je Monat | fehlt |
| Startkapital | **250.000 DM** | Eigenkapitalnachweis, Größenordnung Zehntausende | zu hoch |

Was daraus im Spiel folgte, ebenfalls gemessen:

    Fixkosten je Monat          5.350 DM
    Ein Wagen erwirtschaftet   32.084 DM je Monat
    Überschuss                 26.386 DM je Monat
    Nichtstun bis zur Pleite:     53 Monate
    Zweiter Wagen:                am ersten Tag bezahlbar

**Der Frachterlös lag über dem, was vor der Liberalisierung in der
höchsten Tarifklasse verlangt wurde** — und das Spiel beginnt nach der
Liberalisierung. Gleichzeitig kostete Verschleiß ein Viertel des
Wirklichen, und der größte Kostenblock des Gewerbes fehlte ganz.

---

## 12a. Was davon in 0.15.39 umgesetzt ist

**Der Frachtpreis folgt jetzt einer Gewichtsstaffel.** Bis dahin war er
ein fester Satz je Tonnenkilometer. Gesetzt ist ein Referenzsatz von
**3,40 DM je km für eine Komplettladung auf 24 t**, darunter eine
Degression mit dem Exponenten 0,57 (Herleitung in Abschnitt 12b).
Die Probe gegen die einzige belegte Preisangabe:

| | |
|---|---|
| München–Hannover, 24 t, 610 km, im Spiel | **2.394 DM** |
| derselbe Lauf unter dem Tarif vor 1994 (Klasse AB) | 2.500 DM |

Das Spiel liegt also knapp unter der Tarif-Obergrenze — richtig für den
01.03.1994, zwei Monate nach der Freigabe und in der Preiserosion.

Was daraus je Sendungsgröße folgt:

| Sendung | Strecke | Erlös | je km | je tkm |
|---|---|---|---|---|
| 24 t | 600 km | 2.360 DM | 3,93 DM | 0,164 DM |
| 12 t | 600 km | 1.639 DM | 2,73 DM | 0,228 DM |
| 5 t | 400 km | 768 DM | 1,92 DM | 0,384 DM |
| 1,4 t | 400 km | 428 DM | 1,07 DM | 0,764 DM |
| 1,4 t | 150 km | 259 DM | 1,73 DM | 1,233 DM |

**Kfz-Steuer und Versicherung hängen am zulässigen Gesamtgewicht.**
Vorher zahlte jedes Fahrzeug dieselben 3.600 DM Steuer und 9.000 DM
Prämie im Jahr — auch ein 3,5-Tonner. Die Steuer ist jetzt linear zum
zGG (3,5 t: **315 DM/Jahr**), die Prämie degressiv über die Wurzel
(3,5 t: **2.662 DM/Jahr**). Nur die Gewichtsstaffel ist belegt, das
DM-Niveau nicht.

**Die Depotmiete hängt an der Flotte.** 350 DM Grundbetrag plus Fläche
je Fahrzeug nach Gewicht; die bisherigen 2.500 DM entsprechen vier
Sattelzügen. Eine Spedition mit einem Transporter zahlt **397 DM**.

**Das Startkapital ist auf 45.000 DM gesetzt**, die Dispolinie auf
15.000 DM. Damit ist ein zweiter Transporter (38.000 DM) erreichbar,
ein Sattelzug (165.000 DM) nicht.

Gemessen im neuen Stand:

    Fixkosten je Monat          2.445 DM
    Nichtstun bis zur Pleite:      18 Monate (vorher 53)
    Sattelzug bezahlbar nach:    ~7 Monaten Überschuss (vorher: sofort)

**Weiterhin offen:** Der Verschleißsatz steht unverändert bei
0,08 DM/km statt der hergeleiteten 0,30, und Fahrerkosten gibt es nach
wie vor nicht. Beide gehören zusammen — der Fahrer ist der größte
Posten und kommt mit dem Personalmodul. Solange er fehlt, sieht **jedes**
Fahrzeug zu profitabel aus, und die 18 Monate Ruhestand sind noch
immer zu viele.

---

## 12b. Gewichtsstaffel der Frachtpreise

**belegt.** BME-Preisspiegel Stückgut und Teilladungen, Erhebung 2014,
rund 70 teilnehmende Unternehmen, über 106.000 Datensätze. Mittelwerte
je Sendung für die Entfernungsklasse bis 400 km:

| Sendung | Preis | je Tonne |
|---|---|---|
| 501–600 kg | 91,87 € | 167 €/t |
| 1.001–1.100 kg | 141,38 € | 135 €/t |
| 2.001–2.250 kg | 225,02 € | 106 €/t |
| 5.001–6.000 kg | 379,48 € | 69 €/t |
| 12.501–15.000 kg | 570,34 € | 41 €/t |

Quelle: BMEnet, Preisspiegel Stückgut und Teilladungen, Leseprobe
<https://shop.bme.de/system/public_downloads/files/000/000/213/original/bme_preisspiegel_stueckgut_teilladungen_LESEPROBE.pdf>

**hergeleitet.** Das ist eine Potenzkurve. Aus den Randpunkten:

    ln(570,34 / 91,87) / ln(13,75 / 0,55) = 1,826 / 3,219 = 0,567

also **Preis ~ Tonnen^0,57**. Die Zwischenwerte treffen damit auf
wenige Prozent genau (1,05 t: 133 statt 141; 5,5 t: 339 statt 379).

**Einordnung, wichtig:** Die Erhebung ist von 2014. Übernommen wird nur
die **Form** der Staffel, nicht ihr Niveau — das Niveau setzt der
Referenzsatz aus Abschnitt 9, der aus einer Quelle von 1994 stammt.
Dass die Staffel über zwanzig Jahre stabil ist, ist eine **Annahme**,
belegt: false. Das GFT-Tarifwerk mit der Gewichtsstaffel von 1994 ist
online nicht greifbar (Abschnitt 13).

Als zweiter, gröberer Beleg für dieselbe Richtung: ein heutiger
Frachtportal-Überschlag nennt Stückgut mit 18–45 €/100 kg
(= 180–450 €/t) gegen eine Komplettladung mit 500–2.500 € insgesamt
(bei 24 t also rund 21–104 €/t). Quelle: Frachtportal, Tarife und
Lademeter <https://www.frachtportal.com/de/information/lkw/tarife-lademeter>

---

## 13. Noch nicht recherchiert

- Kfz-Versicherung: Haftpflicht- und Kaskoprämien für Sattelzug-
  maschinen im gewerblichen Güterverkehr, 1994, in DM
- Anschaffungspreise: Sattelzugmaschine und Auflieger, Neupreis 1994.
  Gebrauchtmarktangebote von heute helfen nicht
- Fahrerlöhne: Tariflohn im Güterkraftverkehr 1994, plus Spesen und
  Auslöse. Eine Näherung steht in Abschnitt 10 (Durchschnitt aller
  Branchen), der Branchentarif fehlt weiter
- Hallen- und Stellplatzmieten 1994
- Reifenpreise und Laufleistung, Reparaturkostensätze je Werkstatt-
  stunde. Ein Summenwert ist in Abschnitt 10 hergeleitet
- GFT-Tarifwerk: Entfernungs- und Gewichtsstaffel, Tarifklassen,
  Sätze je Tonne. Online nicht greifbar, vermutlich nur gedruckt
- Marktpreise unmittelbar nach der Freigabe 1994: wie stark fielen
  die Sätze im ersten Jahr?
- Eigenkapitalnachweis nach GüKG in den 1990ern, in DM
- Autobahnmaut Frankreich und Italien 1994
- Umsatzsteuersatz 1994 (falls später doch gebraucht)

---

## Was das fürs Finanzmodul heißt

Sofort belegbar und damit baubar: Kraftstoff, Abschreibung, Zinsbasis,
und die Tatsache, dass 1994 in Deutschland keine Maut anfiel.

Nicht belegbar und damit noch nicht als Zahl einsetzbar: Kfz-Steuer,
Versicherung, Anschaffungspreise, Miete. Diese Posten gehören in den
Kontenrahmen und in die Auswertung — aber mit einem Wert, der im Code
sichtbar als vorläufig markiert ist, so wie es `DIESELPREIS_DM` heute
schon vormacht.
