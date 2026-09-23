#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sprite-aufbereiten.py - macht aus einem generierten Bild ein Sprite.

Bildmodelle zeichnen kein Pixelart. Sie zeichnen ein Bild, das wie
Pixelart aussieht: grosse Flaechen in Bloecken, aber weichgezeichnete
Kanten, zehntausende Farben und ein Hintergrund, der fast weiss ist.
Dieses Werkzeug rechnet das auf das Raster zurueck, das das Modell
nachgeahmt hat.

Warum in dieser Reihenfolge:

1. RASTER MESSEN statt raten. Die Farbunterschiede werden spaltenweise
   aufsummiert; wo ein Ausschlag liegt, ist eine Kante. Der haeufigste
   Abstand zwischen zwei Kanten ist die Blockgroesse.
2. FLAECHENMITTEL beim Verkleinern (Image.BOX). Damit verschwindet die
   Weichzeichnung in der Mittelung. Wer erst quantisiert und dann
   verkleinert, behaelt sie als Farbsaum.
3. QUANTISIEREN OHNE DITHERING. Dithering erzeugt genau die
   Rasterpunkte, die hier wegsollen.
4. FAST WEISS AUF WEISS. Sonst bleibt ein grauer Schleier stehen, den
   man erst sieht, wenn das Sprite auf einer farbigen Flaeche liegt.
5. GANZZAHLIG VERGROESSERN mit Nearest Neighbour. Ein Faktor von 1,4
   verdoppelt manche Pixel und andere nicht - das sieht man sofort.

Und eine Pruefung, die zum Spiel gehoert: lackierung.js faerbt jedes
Pixel um, das gesaettigt (> 0,25) und roetlich ist (Farbton unter 25
oder ueber 340 Grad). Alles, was nicht mitgefaerbt werden soll -
Reifen, Scheiben, Stossstange -, muss also neutral bleiben. Das
Werkzeug sagt am Ende, was es gefunden hat.

Aufruf:
    python3 werkzeug/sprite-aufbereiten.py quelle.png ziel.png \\
        --breite 160 --faktor 2

--breite ist die LOGISCHE Breite (das gemessene Raster nennt einen
Vorschlag), --faktor die anschliessende Vergroesserung. Das Ergebnis
landet mittig auf einer Leinwand von 560x436, dem Mass der
vorhandenen Sprites.
"""

import argparse
import colorsys
import sys
from collections import Counter

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow fehlt:  pip install --break-system-packages pillow")

try:
    import numpy as np
except ImportError:
    sys.exit("numpy fehlt:  pip install --break-system-packages numpy")


LEINWAND = (560, 436)
MIN_SAETTIGUNG = 0.25   # dieselben Schwellen wie js/core/lackierung.js
MIN_HELLIGKEIT = 0.08
HUE_UNTEN = 25
HUE_OBEN = 340


def raster_messen(bild):
    """Schaetzt die Blockgroesse des nachgeahmten Pixelrasters."""
    a = np.asarray(bild).astype(int)
    werte = []
    for achse, summe in ((1, (0, 2)), (0, (1, 2))):
        d = np.abs(np.diff(a, axis=achse)).sum(axis=summe)
        pos = np.where(d > d.mean() * 1.2)[0]
        ab = np.diff(pos)
        ab = ab[ab > 1]
        if len(ab):
            werte.append(Counter(ab.tolist()).most_common(1)[0][0])
    return max(1, round(sum(werte) / len(werte))) if werte else 1


def aufbereiten(bild, logisch_breite, faktor, farben):
    hoehe = round(bild.size[1] * logisch_breite / bild.size[0])
    klein = bild.resize((logisch_breite, hoehe), Image.BOX)

    q = klein.quantize(colors=farben, method=Image.MEDIANCUT,
                       dither=Image.NONE).convert("RGB")

    a = np.asarray(q).copy()
    a[a.min(axis=2) > 232] = 255
    q = Image.fromarray(a)

    ys, xs = np.where(~(np.asarray(q).min(axis=2) > 250))
    if not len(ys):
        sys.exit("Das Bild ist leer - nichts ausser Weiss gefunden.")
    q = q.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    gross = q.resize((q.size[0] * faktor, q.size[1] * faktor), Image.NEAREST)
    if gross.size[0] > LEINWAND[0] or gross.size[1] > LEINWAND[1]:
        sys.exit(f"Zu gross fuer {LEINWAND[0]}x{LEINWAND[1]}: {gross.size}. "
                 "Kleinere --breite oder kleineren --faktor waehlen.")

    leinwand = Image.new("RGB", LEINWAND, (255, 255, 255))
    leinwand.paste(gross, ((LEINWAND[0] - gross.size[0]) // 2,
                           (LEINWAND[1] - gross.size[1]) // 2))
    return leinwand, q.size, gross.size


def lackprobe(bild):
    """Zaehlt, was lackierung.js umfaerben wuerde - und was nicht."""
    lack = sonst = 0
    lack_hues, sonst_hues = [], []
    for anzahl, (r, g, b) in bild.getcolors(10 ** 6):
        if r > 250 and g > 250 and b > 250:
            continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        grad = h * 360
        if s > MIN_SAETTIGUNG and v > MIN_HELLIGKEIT and (grad < HUE_UNTEN or grad > HUE_OBEN):
            lack += anzahl
            lack_hues.append(grad)
        else:
            sonst += anzahl
            sonst_hues.append(grad)
    return lack, sonst, lack_hues, sonst_hues


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("quelle")
    p.add_argument("ziel")
    p.add_argument("--breite", type=int, default=0,
                   help="logische Breite; ohne Angabe aus dem gemessenen Raster")
    p.add_argument("--faktor", type=int, default=2, help="Vergroesserung (ganzzahlig)")
    p.add_argument("--farben", type=int, default=46, help="Farben nach dem Quantisieren")
    args = p.parse_args()

    bild = Image.open(args.quelle).convert("RGB")
    block = raster_messen(bild)
    vorschlag = max(1, round(bild.size[0] / block))
    print(f"Quelle      {bild.size[0]}x{bild.size[1]}, "
          f"{len(bild.getcolors(10 ** 7) or [])} Farben")
    print(f"Raster      Blockgroesse ~{block} px -> logische Breite ~{vorschlag}")

    breite = args.breite or vorschlag
    fertig, logisch, inhalt = aufbereiten(bild, breite, args.faktor, args.farben)
    fertig.save(args.ziel)

    print(f"Logisch     {logisch[0]}x{logisch[1]} (--breite {breite})")
    print(f"Inhalt      {inhalt[0]}x{inhalt[1]} auf {LEINWAND[0]}x{LEINWAND[1]}")
    print(f"Farben      {len(fertig.getcolors(10 ** 6))}")

    lack, sonst, lh, sh = lackprobe(fertig)
    print(f"\nLackprobe   {lack} Pixel werden umgefaerbt, {sonst} nicht")
    if lh:
        print(f"            Lack   Farbton {min(lh):.0f}-{max(lh):.0f} Grad")
    if sh:
        print(f"            Uebrig Farbton {min(sh):.0f}-{max(sh):.0f} Grad")
    if not lack:
        print("  ACHTUNG: Nichts ist umfaerbbar. Die Karosserie muss rot sein.")

    ys, xs = np.where(~(np.asarray(fertig).min(axis=2) > 250))
    print(f"\nFuer fahrzeugtypen.js:")
    print(f"  Inhalt liegt bei x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}")
    rand = 10
    print(f"  miniaturAusschnitt: {{ x: {max(0, xs.min() - rand)}, "
          f"y: {max(0, ys.min() - rand)}, "
          f"breite: {min(LEINWAND[0], xs.max() + rand) - max(0, xs.min() - rand)}, "
          f"hoehe: {min(LEINWAND[1], ys.max() + rand) - max(0, ys.min() - rand)} }}")
    print("  calloutAnker muessen von Hand nachgemessen werden - sie gelten "
          "immer nur fuer genau dieses Bild.")


if __name__ == "__main__":
    main()
