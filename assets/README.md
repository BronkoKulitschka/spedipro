# Eigene Grafiken

Alles hier ist freiwillig. Fehlt eine Datei, benutzt das Spiel das
Sinnbild 🚛 — es geht nichts kaputt.

## Sammelbild: trucks.png

Ein Bild mit allen elf Fahrzeugen in einem Raster.

* **Größe:** 256 × 192 Bildpunkte, vier Spalten mal drei Zeilen
* **Feld:** je 64 × 64 Bildpunkte
* **Hintergrund:** durchsichtig
* **Ausrichtung:** alle Fahrzeuge zeigen nach rechts

Belegung von links oben nach rechts unten:

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| **Zeile 1** | Kastenwagen | Kurier | Maxi lang | Kompakt 5t |
| **Zeile 2** | 7,5-Tonner | Verteiler 12t | Solo 18t | Sattelzug |
| **Zeile 3** | Gliederzug | Kühlsattelzug | Tieflader | *(leer)* |

Das Bild darf auch quadratisch sein, solange das Raster darin sauber
liegt — Bildgeneratoren liefern gern quadratische Vorlagen. Wichtig ist
nur, dass jedes Fahrzeug mittig in seinem Feld sitzt.

**Aus einer ungleichmäßigen Vorlage eine saubere machen:** Liegen die
Fahrzeuge nicht in gleichmäßigen Feldern, hilft ein kurzes Skript, das
sie einzeln ausschneidet und neu anordnet. Die mitgelieferte
`trucks.png` ist auf diese Weise entstanden.

## Einzelbilder: truck-<klasse>.png

Alternative oder Ergänzung. Je 64 × 64 Bildpunkte, durchsichtig,
nach rechts ausgerichtet.

```
truck-kastenwagen.png   truck-kurier.png       truck-maxi.png
truck-leicht.png        truck-siebenhalb.png   truck-verteiler.png
truck-motorwagen.png    truck-fern.png         truck-jumbo.png
truck-kuehlzug.png      truck-schwer.png
```

Auch einzelne genügen. Für Klassen ohne Bild bleibt das Sinnbild.

## Reihenfolge

1. `trucks.png`, wenn vorhanden und im richtigen Verhältnis
2. sonst `truck-<klasse>.png`
3. sonst 🚛

## Größe auf der Karte

Dargestellt wird mit 18 Bildpunkten, auf Geräten ohne Maus mit 22. Die
Vorlagen dürfen größer sein — sie werden verkleinert, die Kanten bleiben
durch `image-rendering: pixelated` scharf.

Nach dem Ablegen einer Datei die Seite einmal neu laden.


## Gesichter: gesichter.png

Sechs Porträts der Auftraggeber in einem Raster.

* **Größe:** 192 × 128 Bildpunkte, drei Spalten mal zwei Zeilen
* **Feld:** je 64 × 64, dargestellt wird mit 44
* **Hintergrund:** darf einfarbig sein, muss nicht durchsichtig sein

| | 1 | 2 | 3 |
|---|---|---|---|
| **Zeile 1** | Kaufmann | Großzügig | Kleinlich |
| **Zeile 2** | Eilig | Beständig | Misstrauisch |

Alternativ einzeln als `gesicht-kaufmann.png` und so weiter. Fehlt
beides, erscheint das Sinnbild des Charakters.

Die Zuordnung steht in `src/ui/sprites.js` unter `GESICHTER` — liefert
ein Bildgenerator die Köpfe in anderer Reihenfolge, lässt sie sich dort
anpassen, statt das Bild neu zu erzeugen.
