# Kostendaten Spedition 1994

Grundlage für das Finanzmodul. Anders als
`historischer-rahmen-1994.md` ist dies **keine Gedächtnisnotiz**:
Jeder Wert hier hat eine Quelle, oder er ist ausdrücklich als
ungeklärt gekennzeichnet.

Recherchestand: 21.09.2026. Spielstart ist der 01.03.1994.

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

## 8. Noch nicht recherchiert

- Kfz-Versicherung: Haftpflicht- und Kaskoprämien für Sattelzug-
  maschinen im gewerblichen Güterverkehr, 1994, in DM
- Anschaffungspreise: Sattelzugmaschine und Auflieger, Neupreis 1994.
  Gebrauchtmarktangebote von heute helfen nicht
- Fahrerlöhne: Tariflohn im Güterkraftverkehr 1994, plus Spesen und
  Auslöse — wird mit dem Personalmodul gebraucht
- Hallen- und Stellplatzmieten 1994
- Reifenpreise und Laufleistung, Reparaturkostensätze je Werkstatt-
  stunde
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
