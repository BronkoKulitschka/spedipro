#!/usr/bin/env python3
"""
Zeichnet das Straßennetz des Spiels in die Europakarte.

Gezeichnet wird genau das Netz, das auch gefahren wird - nicht alles,
was Natural Earth kennt. Nur so stimmen Bild und Route überein: Die
Routenlinie, die beim Tourstart über die Karte läuft, folgt denselben
Stützpunkten wie die gemalte Straße darunter.

Gerendert wird vierfach vergrößert und dann verkleinert - das gibt
weiche Kanten ohne Weichzeichner, sonst sähen die Linien bei den
Diagonalen treppig aus.
"""
import json
from PIL import Image, ImageDraw

BASIS = "/home/claude/werkzeug/europa-basis.jpg"
ZIEL = "/home/claude/spedipro/assets/sprites/europa.jpg"
NETZ = "/home/claude/werkzeug/netz_neu.json"

BREITE, HOEHE = 700, 990
LON_MIN, LON_MAX = -11.0, 31.5
LAT_MIN, LAT_MAX = 34.5, 71.5
S = 4  # Überabtastung

# Warmes Ocker, wie Straßen auf Karten der Zeit gedruckt wurden -
# hell genug gegen das Grün, ohne die Städtemarken zu überstrahlen.
FARBE_STRASSE = (198, 168, 108)
FARBE_SAUM = (92, 78, 48)
FARBE_FAEHRE = (150, 170, 195)


def nach_bild(lon, lat, s=1):
    return (((lon - LON_MIN) / (LON_MAX - LON_MIN)) * BREITE * s,
            ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HOEHE * s)


def main():
    netz = json.load(open(NETZ))
    basis = Image.open(BASIS).convert("RGB")

    ebene = Image.new("RGBA", (BREITE * S, HOEHE * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(ebene)

    strassen = [v for v in netz if v.get("typ") != "faehre" and "weg" in v]
    faehren = [v for v in netz if v.get("typ") == "faehre" and "weg" in v]

    def linie(v, farbe, breite):
        pts = [nach_bild(x, y, S) for x, y in v["weg"]]
        d.line(pts, fill=farbe, width=breite, joint="curve")

    # Erst der dunkle Saum, dann die Straße darauf - so hebt sich die
    # Linie auch über hellem Untergrund ab.
    for v in strassen:
        linie(v, FARBE_SAUM + (170,), int(2.6 * S))
    for v in strassen:
        linie(v, FARBE_STRASSE + (235,), int(1.3 * S))

    # Fähren gestrichelt: Sie sind keine Straße, und das soll man sehen.
    for v in faehren:
        pts = [nach_bild(x, y, S) for x, y in v["weg"]]
        for a, b in zip(pts, pts[1:]):
            laenge = max(1.0, ((b[0]-a[0])**2 + (b[1]-a[1])**2) ** 0.5)
            schritte = max(1, int(laenge / (5 * S)))
            for i in range(schritte):
                t0, t1 = i / schritte, (i + 0.55) / schritte
                p0 = (a[0] + (b[0]-a[0]) * t0, a[1] + (b[1]-a[1]) * t0)
                p1 = (a[0] + (b[0]-a[0]) * t1, a[1] + (b[1]-a[1]) * t1)
                d.line([p0, p1], fill=FARBE_FAEHRE + (200,), width=int(1.2 * S))

    ebene = ebene.resize((BREITE, HOEHE), Image.LANCZOS)
    basis.paste(ebene, (0, 0), ebene)
    basis.save(ZIEL, quality=88, optimize=True)

    import os
    print(f"{len(strassen)} Straßen, {len(faehren)} Fähren gezeichnet")
    print(f"{ZIEL}: {os.path.getsize(ZIEL)//1024} KB")


if __name__ == "__main__":
    main()
