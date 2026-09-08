# Historischer Rahmen: Europa 1994

Sammelstelle für die zeitlichen Gegebenheiten, die das Spiel abbilden
soll. Spielstart ist der 01.03.1994 (siehe `js/core/spielzeit.js`).

**Alle Punkte hier sind aus dem Gedächtnis notiert und vor der
Umsetzung zu verifizieren.** Sie sind als Merkposten gedacht, nicht als
belegte Quelle.

## Politische Landkarte

- **Tschechoslowakei existiert nicht mehr.** Teilung zum Januar 1993,
  Tschechien und Slowakei sind getrennte Staaten mit eigener Grenze.
- **Jugoslawien zerfällt.** Der Bosnienkrieg läuft 1994 noch. Routen
  über den Balkan sind faktisch gesperrt oder gefährlich - relevant für
  die Streckenplanung Richtung Griechenland/Türkei.
- **Deutschland** ist seit 1990 vereint, der Straßenausbau in den neuen
  Ländern hinkt aber noch deutlich hinterher.

## EU / Zoll / Grenzen

- Die **EU hat 1994 zwölf Mitglieder**. Österreich, Schweden und
  Finnland treten erst zum Januar 1995 bei.
- **Österreich ist 1994 also noch Transitland** mit Grenzabfertigung -
  wichtig für alle Nord-Süd-Routen Richtung Italien.
- **Innerhalb der EU entfallen die Zollformalitäten seit 1993**
  (Binnenmarkt). Keine Warenabfertigung, aber Kontrollen bleiben
  möglich.
- **Richtung Osteuropa volle Grenzabfertigung** mit teils erheblichen
  Wartezeiten - ein eigener Zeitfaktor für die Tourenplanung.

## Infrastruktur

- **Straßenqualität West/Ost stark unterschiedlich.** Gut ausgebaute
  Autobahnnetze in Westeuropa, marode bis unbefestigte Strecken in
  Teilen Osteuropas. Bildet sich bereits in `verschleiss.js` über den
  Faktor `strassenqualitaet` ab.

## Offene Punkte zum Nachprüfen

- Maut- und Vignettensysteme: Wer erhob 1994 was? (Eurovignette,
  Österreich, Schweiz)
- Lenk- und Ruhezeiten: genaue Regelung Mitte der 90er, Auswertung über
  Diagrammscheiben statt digitalem Tachografen.
- KVO (national) und CMR (grenzüberschreitend) als Haftungsrahmen bei
  Lieferfristüberschreitung - siehe Notiz in `js/core/ausfall.js`.
- HU-/SP-Intervalle nach damaliger StVZO - siehe Notiz in
  `js/core/fristen.js`.
- Führerscheinklassen (Klasse 2 / Klasse 3) und ihre Gewichtsgrenzen -
  siehe Notiz in `js/data/fahrzeugtypen.js`.
