#!/usr/bin/env python3
"""Aus einem Bild mit mehreren Fahrzeugen eine gleichmäßige Vorlage machen.

Bildgeneratoren ordnen die Fahrzeuge selten in exakten Feldern an. Dieses
Skript sucht sie einzeln, schneidet sie aus und setzt sie in ein sauberes
Raster von vier Spalten und drei Zeilen.

    python3 tools/spritemap.py rohbild.png assets/trucks.png

Braucht Pillow:  pip install Pillow
"""

import sys
from PIL import Image
import numpy as np

FELD, SPALTEN, ZEILEN, RAND = 64, 4, 3, 2


def bloecke(maske, luecke):
    """Zusammenhängende Bereiche in einer Maske finden."""
    aus, start, leer = [], None, 0
    for i, gesetzt in enumerate(maske):
        if gesetzt:
            if start is None:
                start = i
            leer = 0
        elif start is not None:
            leer += 1
            if leer > luecke:
                aus.append((start, i - leer))
                start, leer = None, 0
    if start is not None:
        aus.append((start, len(maske) - 1))
    return aus


def fahrzeuge_finden(bild, anzahl=11):
    """Einzelne Fahrzeuge im Bild aufspüren."""
    feld = np.array(bild)
    weiss = (feld[:, :, 0] > 245) & (feld[:, :, 1] > 245) & (feld[:, :, 2] > 245)
    inhalt = (feld[:, :, 3] > 30) & ~weiss

    zeilen = bloecke(inhalt.any(axis=1), 20)

    # Die Trennlücke so weit verkleinern, bis die erwartete Zahl herauskommt
    for luecke in (30, 24, 18, 14, 10, 8, 6):
        gefunden = []
        for y1, y2 in zeilen:
            spalten = inhalt[y1:y2 + 1].any(axis=0)
            for x1, x2 in bloecke(spalten, luecke):
                teil = inhalt[y1:y2 + 1, x1:x2 + 1]
                zs = np.where(teil.any(axis=1))[0]
                gefunden.append((x1, y1 + zs[0], x2 + 1, y1 + zs[-1] + 1))
        if len(gefunden) >= anzahl:
            return gefunden[:anzahl], luecke

    return gefunden, None


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    quelle, ziel = sys.argv[1], sys.argv[2]
    bild = Image.open(quelle).convert('RGBA')
    print(f'Quelle: {bild.size[0]} x {bild.size[1]}')

    kaesten, luecke = fahrzeuge_finden(bild)
    print(f'{len(kaesten)} Fahrzeuge gefunden (Trennlücke {luecke})')

    if len(kaesten) != SPALTEN * ZEILEN - 1:
        print(f'  Achtung: erwartet waren {SPALTEN * ZEILEN - 1}.')
        print('  Die Zuordnung im Raster stimmt dann möglicherweise nicht.')

    blatt = Image.new('RGBA', (SPALTEN * FELD, ZEILEN * FELD), (0, 0, 0, 0))
    platz = FELD - 2 * RAND

    for i, kasten in enumerate(kaesten):
        teil = bild.crop(kasten)
        faktor = min(platz / teil.size[0], platz / teil.size[1])
        breite = max(1, round(teil.size[0] * faktor))
        hoehe = max(1, round(teil.size[1] * faktor))
        klein = teil.resize((breite, hoehe), Image.LANCZOS)

        spalte, zeile = i % SPALTEN, i // SPALTEN
        blatt.paste(klein,
                    (spalte * FELD + (FELD - breite) // 2,
                     zeile * FELD + (FELD - hoehe) // 2),
                    klein)
        print(f'  {i + 1:2}. {teil.size[0]:4} x {teil.size[1]:3}'
              f'  →  Feld {spalte + 1}/{zeile + 1}')

    blatt.save(ziel)
    print(f'\nGespeichert: {ziel} ({blatt.size[0]} x {blatt.size[1]})')


if __name__ == '__main__':
    main()
