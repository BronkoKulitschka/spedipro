#!/usr/bin/env python3
"""
Straßengraph bauen und zusammennähen.

Natural Earth erfasst Straßenabschnitte als einzelne Linienzüge, die
sich an Kreuzungen zwar überschneiden, aber keinen gemeinsamen
Stützpunkt haben. Ein reines Runden auf ein Raster verbindet deshalb
nur einen Teil: bei 0,02 Grad hängen 81 % der Knoten zusammen, der Rest
zerfällt in 540 Inseln.

Deshalb zwei Schritte:
  1. Geometrie fein rastern (0,02 Grad, rund 2 km) - der Verlauf bleibt
     erhalten
  2. Die verbliebenen Inseln über kurze Verbindungsstücke annähen, je
     Insel zum nächstgelegenen Punkt einer anderen Insel

Das Annähen erfindet keine Straßen, wo keine sind: Die Grenze liegt bei
wenigen Kilometern, also genau in der Größenordnung, in der zwei
Abschnitte derselben Straße getrennt erfasst wurden.
"""

import json
import math
import heapq
from collections import defaultdict

WURZEL = "/home/claude"
ROADS = f"{WURZEL}/werkzeug/ne_roads.geojson"

KLASSEN_STRASSE = {"Major Highway", "Secondary Highway", "Road", "Unknown"}
KLASSEN_FAEHRE = {"Ferry Route", "Ferry, seasonal"}

RASTER = 0.02
NAHT_MAX_KM = 12.0      # so weit darf eine Naht höchstens reichen
NAHT_RUNDEN = 12


def km(a, b):
    dlat = math.radians(b[1] - a[1])
    dlon = math.radians(b[0] - a[0])
    m = math.radians((a[1] + b[1]) / 2)
    return math.hypot(dlon * math.cos(m), dlat) * 6371.0


def schluessel(p):
    return (round(p[0] / RASTER), round(p[1] / RASTER))


def mitte(k):
    return (k[0] * RASTER, k[1] * RASTER)


def linien(geom):
    if geom["type"] == "LineString":
        return [geom["coordinates"]]
    if geom["type"] == "MultiLineString":
        return geom["coordinates"]
    return []


def graph_bauen():
    with open(ROADS, encoding="utf-8") as f:
        daten = json.load(f)

    # Nach Ausschnitt filtern statt nach Kontinent: Natural Earth führt
    # die Türkei unter Asien, wodurch İstanbul vom Netz abgeschnitten
    # blieb. Der Ausschnitt deckt alle 165 Spielstädte mit Rand ab.
    LON1, LON2, LAT1, LAT2 = -26.0, 46.0, 33.0, 72.0

    def im_ausschnitt(geom):
        for linie in linien(geom):
            for x, y in linie:
                if LON1 <= x <= LON2 and LAT1 <= y <= LAT2:
                    return True
        return False

    kanten = defaultdict(dict)
    for feature in daten["features"]:
        p = feature["properties"]
        if not im_ausschnitt(feature["geometry"]):
            continue
        art = p.get("type")
        if art in KLASSEN_FAEHRE:
            typ = "faehre"
        elif art in KLASSEN_STRASSE:
            typ = "strasse"
        else:
            continue

        for linie in linien(feature["geometry"]):
            vorher = None
            for punkt in linie:
                k = schluessel(punkt)
                if vorher is not None and k != vorher:
                    d = km(mitte(vorher), mitte(k))
                    if d > 0:
                        alt = kanten[vorher].get(k)
                        if alt is None or d < alt[0]:
                            kanten[vorher][k] = (d, typ)
                            kanten[k][vorher] = (d, typ)
                vorher = k
    return kanten


def komponenten(kanten):
    gesehen = set()
    teile = []
    for start in kanten:
        if start in gesehen:
            continue
        stapel = [start]
        gesehen.add(start)
        teil = []
        while stapel:
            k = stapel.pop()
            teil.append(k)
            for n in kanten[k]:
                if n not in gesehen:
                    gesehen.add(n)
                    stapel.append(n)
        teile.append(teil)
    teile.sort(key=len, reverse=True)
    return teile


def naehen(kanten):
    """Inseln über kurze Verbindungsstücke an den Hauptteil hängen."""
    zelle = 0.25  # Suchraster für Nachbarschaft, rund 25 km

    for runde in range(NAHT_RUNDEN):
        teile = komponenten(kanten)
        if len(teile) == 1:
            break
        zugehoerig = {}
        for i, teil in enumerate(teile):
            for k in teil:
                zugehoerig[k] = i

        # Räumlicher Index
        raster = defaultdict(list)
        for k in kanten:
            p = mitte(k)
            raster[(int(p[0] / zelle), int(p[1] / zelle))].append(k)

        genaeht = 0
        # Kleinste Inseln zuerst - sie hängen am ehesten an einer großen
        for i in range(len(teile) - 1, 0, -1):
            teil = teile[i]
            if zugehoerig[teil[0]] != i:
                continue  # schon verschmolzen
            bester = None
            for k in teil:
                p = mitte(k)
                cx, cy = int(p[0] / zelle), int(p[1] / zelle)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        for n in raster.get((cx + dx, cy + dy), ()):
                            if zugehoerig.get(n) == i:
                                continue
                            d = km(p, mitte(n))
                            if d <= NAHT_MAX_KM and (bester is None or d < bester[0]):
                                bester = (d, k, n)
            if bester:
                d, a, b = bester
                kanten[a][b] = (d, "strasse")
                kanten[b][a] = (d, "strasse")
                genaeht += 1
                ziel = zugehoerig[b]
                for k in teil:
                    zugehoerig[k] = ziel

        print(f"  Runde {runde + 1}: {len(teile)} Inseln, {genaeht} Nähte")
        if genaeht == 0:
            break

    return kanten


def main():
    print("Graph aufbauen...")
    kanten = graph_bauen()
    print(f"  Knoten {len(kanten)}, Kanten {sum(len(v) for v in kanten.values()) // 2}")

    teile = komponenten(kanten)
    print(f"  vorher: {len(teile)} Inseln, größte {len(teile[0])} "
          f"({100 * len(teile[0]) / len(kanten):.1f} %)")

    print("Inseln annähen...")
    naehen(kanten)

    teile = komponenten(kanten)
    print(f"  nachher: {len(teile)} Inseln, größte {len(teile[0])} "
          f"({100 * len(teile[0]) / len(kanten):.1f} %)")

    with open(f"{WURZEL}/werkzeug/graph.json", "w") as f:
        json.dump({
            "raster": RASTER,
            "kanten": {f"{k[0]}|{k[1]}": {f"{n[0]}|{n[1]}": [round(v[0], 3), v[1]]
                                          for n, v in nb.items()}
                       for k, nb in kanten.items()}
        }, f)
    print("Graph abgelegt.")


if __name__ == "__main__":
    main()
