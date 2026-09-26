#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
css-auf-skala.py - rechnet die Stylesheets von festen Pixeln auf eine
einzige Skalierungsgroesse um.

Warum ueberhaupt: docs/optik-und-bedienung.md, Regel 66 und A23. Die
Oberflaeche muss sich auf 200 % stellen lassen, ohne dass Text
abgeschnitten wird oder Funktion verlorengeht (XAG 101). Mit 190
Schriftgroessen in festen Pixelwerten und keiner einzigen relativen
Einheit gab es keine Stelle, an der man drehen konnte.

Die Rechnung:

    html { font-size: calc(18px * var(--skala)) }

Damit ist 1rem bei --skala 1 gleich 18 px - die Mindestschriftgroesse
aus XAG 101 fuer 1080p. Die alte Oberflaeche war auf 11 px aufgebaut.
Alle Laengen werden deshalb durch 11 geteilt, nicht durch 18:

    1rem entspricht 11 alten Pixeln

Dadurch waechst ALLES um denselben Faktor 18/11 = 1,636. Die
Proportionen bleiben exakt erhalten - das ist Regel 67: dieselbe
98er-Formensprache, nur bei etwa 150 dpi statt 96.

Was NICHT umgerechnet wird, und warum:

1. Werte unter 3 px. Der 1-px-Bevel ist der Look. Ein Bevel von 1,6 px
   waere ein halbes Pixel und damit unscharf.
2. Raender, Schatten, stroke-width, background-size/-position. Dort
   stehen die Bevel-Kanten und das Dither-Raster.
3. Alles, was Pixelgrafik bemisst (Karte, Fahrzeugbild, Kartenmarken).
   Regel 68: Pixelgrafik wird nur ganzzahlig skaliert, sonst flimmert
   sie. Diese Groessen laufen ueber eigene Pfade (transform-Zoom).
4. Media-Query-Bedingungen. Ein `max-width: 480px` ist eine Aussage
   ueber das Geraet, nicht ueber die Oberflaeche.

Schriftgroessen werden nicht umgerechnet, sondern auf vier Marken
abgebildet. Die alten zehn Groessen (8 bis 22 px) waren gewachsener
Wildwuchs; Windows 98 selbst kannte praktisch zwei. Die Marken behalten
die alten Verhaeltnisse:

    11 -> --fs-klein  1rem     (18 px)
    13 -> --fs-basis  1.18rem  (21 px)
    16 -> --fs-kopf   1.45rem  (26 px)
    22 -> --fs-gross  2rem     (36 px)

Aufruf:
    python3 werkzeug/css-auf-skala.py           # schreibt
    python3 werkzeug/css-auf-skala.py --probe   # zeigt nur, was kaeme
"""

import re
import sys
from pathlib import Path

BASIS_ALT = 11.0          # Grundschriftgroesse der alten Oberflaeche
MIN_UMRECHNUNG = 3        # darunter bleibt es bei Pixeln

DATEIEN = ["css/win98.css", "css/desktop.css"] + \
          sorted(str(p) for p in Path("css/apps").glob("*.css"))

# Schriftgroesse -> Marke
SCHRIFT = {8: "--fs-klein", 9: "--fs-klein", 10: "--fs-klein",
           11: "--fs-klein", 12: "--fs-klein",
           13: "--fs-basis", 14: "--fs-basis",
           15: "--fs-kopf", 16: "--fs-kopf", 17: "--fs-kopf",
           22: "--fs-gross"}

# Eigenschaften, deren Pixelwerte die Groesse der Oberflaeche bestimmen.
LAENGEN = re.compile(r"""^(
    width|height|min-width|min-height|max-width|max-height|
    padding|padding-top|padding-right|padding-bottom|padding-left|
    margin|margin-top|margin-right|margin-bottom|margin-left|
    gap|row-gap|column-gap|
    top|right|bottom|left|inset|
    flex-basis|border-radius|text-indent|letter-spacing|
    grid-template-columns|grid-auto-rows|line-height
)$""", re.X)

# Selektoren, in denen Pixelgrafik bemessen wird - Regel 68.
PIXELGRAFIK = re.compile(
    r"karte-bild|karte-buehne|karte-marken|tourkarte-bild|tourkarte-ebene|"
    r"tourkarte-fahrzeug|tour-marke|marke-|#desktop\b|sprite|miniatur",
    re.I)


def rem(px: float) -> str:
    wert = round(px / BASIS_ALT, 4)
    text = f"{wert:.4f}".rstrip("0").rstrip(".")
    return f"{text}rem"


def wert_umrechnen(text: str) -> str:
    """Ersetzt px-Werte >= MIN_UMRECHNUNG durch rem, laesst calc() intakt."""
    def ersetzen(m):
        zahl = float(m.group(1))
        if abs(zahl) < MIN_UMRECHNUNG:
            return m.group(0)
        return rem(zahl)
    return re.sub(r"(-?\d+(?:\.\d+)?)px", ersetzen, text)


def bearbeiten(quelltext: str, name: str, protokoll: list) -> str:
    ergebnis = []
    pos = 0
    # Blockweise: alles zwischen dem letzten } / { und dem naechsten {
    for treffer in re.finditer(r"([^{}]*)\{([^{}]*)\}", quelltext):
        selektor, koerper = treffer.group(1), treffer.group(2)
        ergebnis.append(quelltext[pos:treffer.start()])
        pos = treffer.end()

        # At-Rule-Kopf (@media ...) bleibt unangetastet.
        if selektor.lstrip().startswith("@"):
            ergebnis.append(treffer.group(0))
            continue

        pixelgrafik = bool(PIXELGRAFIK.search(selektor))
        neu = []
        for teil in re.split(r"(;)", koerper):
            if teil == ";" or ":" not in teil:
                neu.append(teil)
                continue
            eigenschaft, _, wert = teil.partition(":")
            schluessel = eigenschaft.strip().lower()

            if schluessel == "font-size":
                m = re.fullmatch(r"\s*(\d+)px\s*", wert)
                if m and int(m.group(1)) in SCHRIFT:
                    marke = SCHRIFT[int(m.group(1))]
                    protokoll.append(f"  {name}: font-size {m.group(1)}px -> var({marke})")
                    neu.append(f"{eigenschaft}: var({marke})")
                    continue
                neu.append(teil)
                continue

            if pixelgrafik or not LAENGEN.match(schluessel) or "px" not in wert:
                neu.append(teil)
                continue
            if schluessel == "line-height" and "px" not in wert:
                neu.append(teil)
                continue

            umgerechnet = wert_umrechnen(wert)
            if umgerechnet != wert:
                protokoll.append(f"  {name}: {schluessel}:{wert.strip()} -> {umgerechnet.strip()}")
            neu.append(f"{eigenschaft}:{umgerechnet}")

        ergebnis.append(f"{selektor}{{{''.join(neu)}}}")

    ergebnis.append(quelltext[pos:])
    return "".join(ergebnis)


def main():
    probe = "--probe" in sys.argv
    gesamt = 0
    for name in DATEIEN:
        pfad = Path(name)
        if not pfad.exists():
            print(f"fehlt: {name}")
            continue
        alt = pfad.read_text(encoding="utf-8")
        protokoll = []
        neu = bearbeiten(alt, pfad.name, protokoll)
        gesamt += len(protokoll)
        print(f"{name}: {len(protokoll)} Aenderungen")
        if probe:
            for zeile in protokoll[:12]:
                print(zeile)
            if len(protokoll) > 12:
                print(f"  ... und {len(protokoll) - 12} weitere")
        else:
            pfad.write_text(neu, encoding="utf-8")
    print(f"\nsumme {gesamt} Aenderungen" + (" (nur Probe)" if probe else " geschrieben"))


if __name__ == "__main__":
    main()
