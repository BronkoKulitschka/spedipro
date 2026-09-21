#!/usr/bin/env python3
"""
Bindet die Spielstädte an den Straßengraphen an und sucht für jede
Verbindung des bisherigen Netzes den echten Weg.

Ergebnis je Verbindung:
  - km: die tatsächliche Streckenlänge statt Luftlinie mal 1,2
  - weg: der Verlauf als Polylinie (lon/lat), vereinfacht
  - typ: strasse oder faehre, aus dem tatsächlich benutzten Weg
"""

import json
import math
import heapq
import re
from collections import defaultdict

WURZEL = "/home/claude"
PROJEKT = f"{WURZEL}/spedipro"

ANBINDUNG_MAX_KM = 80.0
FAEHRE_GEWICHT = 2.0      # Fähren nur, wenn kein Landweg da ist
VEREINFACHUNG_KM = 3.0    # Douglas-Peucker-Toleranz

# Grenze der Glaubwürdigkeit: Ist der gefundene Weg mehr als doppelt so
# lang wie die bisherige Schätzung, fehlt im Netz eine Straße und der
# Router hat einen absurden Umweg genommen (etwa Lille-London über
# Dänemark, weil die Fähre Calais-Dover in den Daten fehlt). Solche
# Verbindungen behalten die alte Schätzung und werden gekennzeichnet.
UMWEG_GRENZE = 2.0


def km(a, b):
    dlat = math.radians(b[1] - a[1])
    dlon = math.radians(b[0] - a[0])
    m = math.radians((a[1] + b[1]) / 2)
    return math.hypot(dlon * math.cos(m), dlat) * 6371.0


def graph_laden():
    with open(f"{WURZEL}/werkzeug/graph.json") as f:
        roh = json.load(f)
    raster = roh["raster"]
    kanten = {}
    for k, nb in roh["kanten"].items():
        a, b = k.split("|")
        kanten[(int(a), int(b))] = {
            tuple(int(x) for x in n.split("|")): (v[0], v[1])
            for n, v in nb.items()
        }
    return raster, kanten


def js_daten_lesen(pfad, name):
    """Liest ein const NAME = <json>; aus einer JS-Datei."""
    text = open(pfad, encoding="utf-8").read()
    i = text.index(f"const {name}")
    i = text.index("=", i) + 1
    ende = text.rindex(";")
    return json.loads(text[i:ende].strip())


def douglas_peucker(punkte, toleranz_km):
    if len(punkte) < 3:
        return punkte[:]

    def abstand(p, a, b):
        # Abstand Punkt zu Strecke, grob in km
        mx = math.cos(math.radians((a[1] + b[1]) / 2))
        ax, ay = a[0] * mx, a[1]
        bx, by = b[0] * mx, b[1]
        px, py = p[0] * mx, p[1]
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return math.hypot(px - ax, py - ay) * 111.0
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy)) * 111.0

    maxd, idx = 0, 0
    for i in range(1, len(punkte) - 1):
        d = abstand(punkte[i], punkte[0], punkte[-1])
        if d > maxd:
            maxd, idx = d, i

    if maxd <= toleranz_km:
        return [punkte[0], punkte[-1]]
    links = douglas_peucker(punkte[:idx + 1], toleranz_km)
    rechts = douglas_peucker(punkte[idx:], toleranz_km)
    return links[:-1] + rechts


def main():
    raster, kanten = graph_laden()
    mitte = lambda k: (round(k[0] * raster, 4), round(k[1] * raster, 4))

    staedte = js_daten_lesen(f"{PROJEKT}/js/data/staedte.js", "STAEDTE")
    netz = js_daten_lesen(f"{PROJEKT}/js/data/strassennetz.js", "STRASSENNETZ")
    print(f"{len(staedte)} Städte, {len(netz)} Verbindungen")

    # --- Städte anbinden ---
    zelle = 0.5
    index = defaultdict(list)
    for k in kanten:
        p = mitte(k)
        index[(int(p[0] / zelle), int(p[1] / zelle))].append(k)

    # Nur Knoten mit echter Straßenkante kommen als Anschluss infrage.
    # Sonst hängt eine Hafenstadt wie Venezia oder Roscoff am
    # Fährnetz und der Router fährt quer über das Mittelmeer, statt
    # die Autobahn nebenan zu nehmen.
    auf_strasse = {k for k, nb in kanten.items()
                   if any(t == "strasse" for _, t in nb.values())}
    print(f"Knoten mit Straßenanschluss: {len(auf_strasse)} von {len(kanten)}")

    # Mehrere Anschlusspunkte je Stadt: Der nächstgelegene ist nicht
    # immer der richtige, etwa wenn eine Umgehungsstraße näher liegt
    # als die Autobahn. Der Router bekommt alle Kandidaten mit ihrem
    # Zubringerweg als Startkosten und sucht sich den besten aus.
    ANSCHLUESSE_JE_STADT = 4

    anschluss = {}
    weit = []
    for name, s in staedte.items():
        p = (s["lon"], s["lat"])
        kandidaten = []
        schritt = 1
        while not kandidaten and schritt <= 8:
            cx, cy = int(p[0] / zelle), int(p[1] / zelle)
            for dx in range(-schritt, schritt + 1):
                for dy in range(-schritt, schritt + 1):
                    for k in index.get((cx + dx, cy + dy), ()):
                        if k not in auf_strasse:
                            continue
                        d = km(p, mitte(k))
                        if d <= ANBINDUNG_MAX_KM:
                            kandidaten.append((d, k))
            schritt += 1
        kandidaten.sort()
        if not kandidaten:
            weit.append((name, None))
            continue
        anschluss[name] = kandidaten[:ANSCHLUESSE_JE_STADT]
        if kandidaten[0][0] > 20:
            weit.append((name, round(kandidaten[0][0], 1)))

    print(f"angebunden: {len(anschluss)} von {len(staedte)}")
    if weit:
        print("  weit entfernt oder ohne Anschluss:",
              ", ".join(f"{n} ({d} km)" for n, d in sorted(weit, key=lambda x: -(x[1] or 0))[:12]))

    # --- Wege suchen ---
    ziele_je_start = defaultdict(list)
    for v in netz:
        if v["von"] in anschluss and v["nach"] in anschluss:
            ziele_je_start[v["von"]].append(v["nach"])

    wege = {}
    for i, (start, ziele) in enumerate(sorted(ziele_je_start.items())):
        zielknoten = {}
        for z in ziele:
            for d, k in anschluss[z]:
                zielknoten.setdefault(k, []).append((d, z))

        offen = []
        best = {}
        vor = {}
        for d, k in anschluss[start]:
            if d < best.get(k, float("inf")):
                best[k] = d
                heapq.heappush(offen, (d, d, k))
        erledigt = set()
        fehlt = set(zielknoten)
        while offen and fehlt:
            g, echt, k = heapq.heappop(offen)
            if g > best.get(k, float("inf")):
                continue
            if k in fehlt:
                fehlt.discard(k)
                weg = [k]
                while weg[-1] in vor:
                    weg.append(vor[weg[-1]])
                weg = list(reversed(weg))
                for zugang, ziel in zielknoten[k]:
                    if ziel in erledigt:
                        continue
                    erledigt.add(ziel)
                    wege[(start, ziel)] = (echt + zugang, weg)
            for n, (laenge, typ) in kanten[k].items():
                neu = g + laenge * (FAEHRE_GEWICHT if typ == "faehre" else 1.0)
                if neu < best.get(n, float("inf")):
                    best[n] = neu
                    vor[n] = k
                    heapq.heappush(offen, (neu, echt + laenge, n))
        if (i + 1) % 25 == 0:
            print(f"  {i + 1} Startstädte abgearbeitet")

    print(f"Wege gefunden: {len(wege)}")

    # --- Neues Netz schreiben ---
    ergebnis = []
    ohne = 0
    abweichung = []
    for v in netz:
        paar = wege.get((v["von"], v["nach"])) or wege.get((v["nach"], v["von"]))
        if not paar:
            ohne += 1
            ergebnis.append({**v, "quelle": "schaetzung"})
            continue
        echt, knotenweg = paar
        punkte = [mitte(k) for k in knotenweg]
        # Stadt an Anfang und Ende setzen, damit der Weg am Marker beginnt
        punkte[0] = (staedte[v["von"]]["lon"], staedte[v["von"]]["lat"])
        punkte[-1] = (staedte[v["nach"]]["lon"], staedte[v["nach"]]["lat"])
        if wege.get((v["nach"], v["von"])) and not wege.get((v["von"], v["nach"])):
            punkte = punkte[::-1]
            punkte[0] = (staedte[v["von"]]["lon"], staedte[v["von"]]["lat"])
            punkte[-1] = (staedte[v["nach"]]["lon"], staedte[v["nach"]]["lat"])

        vereinfacht = douglas_peucker(punkte, VEREINFACHUNG_KM)
        laenge = sum(km(a, b) for a, b in zip(vereinfacht, vereinfacht[1:]))

        if laenge > v["km"] * UMWEG_GRENZE:
            ohne += 1
            ergebnis.append({**v, "quelle": "schaetzung"})
            continue
        faehre = any(kanten[a].get(b, (0, ""))[1] == "faehre"
                     for a, b in zip(knotenweg, knotenweg[1:]))
        abweichung.append((laenge - v["km"]) / v["km"])
        ergebnis.append({
            "von": v["von"],
            "nach": v["nach"],
            "km": round(laenge),
            "typ": "faehre" if faehre else "strasse",
            "weg": [[round(p[0], 3), round(p[1], 3)] for p in vereinfacht]
        })

    print(f"ohne echten Weg: {ohne}")
    if abweichung:
        abweichung.sort()
        print(f"Abweichung zur bisherigen Schätzung: "
              f"Median {abweichung[len(abweichung)//2]*100:+.1f} %, "
              f"Mittel {sum(abweichung)/len(abweichung)*100:+.1f} %")
    punkte_gesamt = sum(len(v.get("weg", [])) for v in ergebnis)
    print(f"Stützpunkte gesamt: {punkte_gesamt}")

    with open(f"{WURZEL}/werkzeug/netz_neu.json", "w") as f:
        json.dump(ergebnis, f)
    print("geschrieben: werkzeug/netz_neu.json")


if __name__ == "__main__":
    main()
