# Werkzeug

Skripte, mit denen Spieldaten erzeugt wurden. Sie laufen nicht im
Spiel — sie werden einmal ausgeführt und schreiben ihr Ergebnis in
`js/data/` bzw. `assets/sprites/`. Hier, damit nachvollziehbar bleibt,
woher die Daten kommen, und damit sie sich neu erzeugen lassen.

## Straßennetz

Quelle: **Natural Earth 10m roads**, Public Domain — dieselbe Quelle
wie Küsten, Flüsse und Städte des Spiels.

    https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_roads.geojson

Ablauf:

1. `netz2.py` baut aus den Straßen im Ausschnitt Europa einen Graphen.
   Natural Earth erfasst Abschnitte als einzelne Linienzüge, die sich
   an Kreuzungen überschneiden, ohne einen gemeinsamen Stützpunkt zu
   haben. Deshalb zwei Ausgleichsschritte: Knoten unter 2,5 km
   Abstand werden verbunden (Kreuzungen), danach werden übrige Inseln
   über Nähte bis 12 km angeschlossen. Ergebnis: 131.202 Knoten,
   97,8 % davon zusammenhängend.

2. `routen.py` bindet die 165 Spielstädte an den Graphen an — nur an
   Knoten mit echter Straßenkante, sonst hängt eine Hafenstadt am
   Fährnetz — und sucht je Verbindung den kürzesten Weg. Das Ergebnis
   geht als `km` und `weg` nach `js/data/strassennetz.js`.

   Verbindungen, deren gefundener Weg mehr als doppelt so lang ist wie
   die alte Luftlinienschätzung, behalten die Schätzung: Dort fehlt im
   Datensatz eine Straße oder Fähre, und der Router hat einen absurden
   Umweg genommen.

3. `strassen_zeichnen.py` malt genau dieses Netz in die Europakarte.
   Nicht alles, was Natural Earth kennt — nur das, was auch gefahren
   wird. Nur so können Bild und Routenlinie nicht auseinanderlaufen.

Ergebnis: 435 von 452 Verbindungen mit echtem Verlauf, 6.463
Stützpunkte. Die Streckenlängen weichen im Median 0,8 % von der alten
Schätzung ab — die Faustregel „Luftlinie mal 1,2" war also im Mittel
gut, im Einzelfall aber deutlich daneben.

**Einschränkung:** Natural Earth bildet das Netz von heute ab, nicht
das von 1994.

## sprite-aufbereiten.py

Macht aus einem generierten Bild ein Sprite: misst das nachgeahmte
Pixelraster, rechnet darauf zurück, quantisiert ohne Dithering, setzt
den Hintergrund auf reines Weiß und vergrößert ganzzahlig auf die
Leinwand von 560x436. Prüft zum Schluss, welche Pixel `lackierung.js`
umfärben würde, und schlägt den `miniaturAusschnitt` für
`fahrzeugtypen.js` vor.

    python3 werkzeug/sprite-aufbereiten.py quelle.png \
        assets/sprites/transporter-generisch.png --breite 160 --faktor 2

Die `calloutAnker` bleiben Handarbeit - sie gelten immer nur für genau
ein Bild.
