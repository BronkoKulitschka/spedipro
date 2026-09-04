#!/usr/bin/env python3
"""Platzhalter-Icons fuer das Hauptmenue.

24x16 Pixel, vierfach vergroessert auf 96x64 (Asset-Spezifikation).
Bewusst einfach gehalten - sie sind zum Ersetzen gedacht. Alle Farben
stammen aus der 95er-Palette.
"""
from PIL import Image, ImageDraw
import os

OUT = "public/assets/tiles"
os.makedirs(OUT, exist_ok=True)

W, H, SCALE = 24, 16, 4

BG      = (192, 192, 192)
BLUE    = (0, 0, 128)
BLUE_L  = (64, 96, 200)
RED     = (192, 0, 0)
RED_L   = (232, 80, 80)
GREEN   = (0, 128, 0)
GREEN_L = (96, 176, 96)
YELLOW  = (200, 168, 0)
GREY    = (128, 128, 128)
GREY_L  = (224, 224, 224)
WHITE   = (255, 255, 255)
BLACK   = (0, 0, 0)
SKIN    = (232, 192, 152)
BROWN   = (128, 88, 40)


def new():
    im = Image.new("RGB", (W, H), BG)
    return im, ImageDraw.Draw(im)


def truck(d):
    d.rectangle([1, 4, 13, 11], fill=GREY_L, outline=GREY)
    d.rectangle([14, 5, 21, 11], fill=RED, outline=BLACK)
    d.rectangle([16, 6, 20, 8], fill=(160, 200, 240))
    for cx in (4, 8, 18):
        d.rectangle([cx - 1, 11, cx + 1, 13], fill=BLACK)
    d.line([(0, 14), (23, 14)], fill=GREY)


def clipboard(d):
    d.rectangle([5, 1, 18, 15], fill=WHITE, outline=BLACK)
    d.rectangle([9, 0, 14, 2], fill=GREY, outline=BLACK)
    for y in (5, 7, 9, 11):
        d.line([(7, y), (16, y)], fill=BLUE_L)
    d.line([(7, 13), (12, 13)], fill=BLUE_L)


def maproute(d):
    d.rectangle([1, 2, 22, 13], fill=GREEN_L, outline=GREEN)
    d.line([(4, 12), (8, 8), (14, 9), (19, 4)], fill=BLUE, width=1)
    d.rectangle([3, 11, 5, 13], fill=GREEN)
    d.rectangle([18, 3, 20, 5], fill=RED)
    d.rectangle([13, 8, 15, 10], fill=YELLOW)


def people(d):
    # Zwei Figuren, damit bei 24x16 noch Kopf und Schultern erkennbar sind.
    for x, col in ((7, BLUE), (16, GREEN)):
        d.rectangle([x - 1, 1, x + 2, 1], fill=col)        # Muetzenschirm
        d.rectangle([x - 2, 2, x + 3, 3], fill=col)        # Muetze
        d.rectangle([x - 2, 4, x + 3, 7], fill=SKIN,
                    outline=BROWN)                          # Kopf
        d.rectangle([x, 5, x + 1, 5], fill=BLACK)          # Augen
        d.rectangle([x - 2, 5, x - 2, 5], fill=BLACK)
        d.rectangle([x - 4, 8, x + 5, 14], fill=col,
                    outline=BLACK)                          # Rumpf
        d.rectangle([x - 1, 9, x + 2, 14], fill=GREY_L)    # Hemd


def wrench(d):
    # Maulschluessel diagonal: Maul oben rechts, Griff nach unten links.
    d.polygon([(15, 1), (21, 1), (21, 7), (18, 7), (18, 4), (15, 4)],
              fill=GREY_L, outline=BLACK)
    for i in range(11):
        d.rectangle([15 - i, 5 + i, 17 - i, 7 + i], fill=GREY, outline=None)
    d.rectangle([2, 12, 6, 15], fill=BLUE, outline=BLACK)
    d.rectangle([3, 13, 5, 14], fill=BLUE_L)


def cashbook(d):
    d.rectangle([2, 3, 13, 13], fill=GREY_L, outline=BLACK)
    d.rectangle([4, 5, 11, 7], fill=(120, 200, 120), outline=GREY)
    for y in (9, 11):
        for x in (4, 7, 10):
            d.rectangle([x, y, x + 1, y + 1], fill=GREY)
    for i, y in enumerate((5, 8, 11)):
        d.ellipse([15, y, 21, y + 3], fill=YELLOW, outline=BROWN)


def handshake(d):
    d.rectangle([2, 6, 10, 9], fill=SKIN, outline=BROWN)
    d.rectangle([13, 6, 21, 9], fill=SKIN, outline=BROWN)
    d.rectangle([9, 5, 14, 10], fill=SKIN, outline=BROWN)
    d.rectangle([0, 7, 3, 12], fill=BLUE)
    d.rectangle([20, 7, 23, 12], fill=GREY)


def chart(d):
    d.line([(2, 14), (22, 14)], fill=BLACK)
    d.line([(2, 1), (2, 14)], fill=BLACK)
    for x, h, col in ((5, 5, BLUE), (9, 9, RED), (13, 7, YELLOW), (17, 12, GREEN)):
        d.rectangle([x, 14 - h, x + 2, 13], fill=col, outline=BLACK)


def envelope(d):
    d.rectangle([2, 3, 21, 13], fill=WHITE, outline=BLACK)
    d.line([(2, 3), (11, 9)], fill=GREY)
    d.line([(21, 3), (12, 9)], fill=GREY)
    d.rectangle([17, 1, 22, 5], fill=RED, outline=BLACK)


def gear(d):
    d.ellipse([6, 3, 17, 13], fill=GREY, outline=BLACK)
    d.ellipse([9, 6, 14, 10], fill=BG, outline=BLACK)
    for x, y in ((11, 1), (11, 14), (3, 7), (19, 7)):
        d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=GREY, outline=BLACK)


ICONS = {
    "tile_fuhrpark": truck,
    "tile_auftraege": clipboard,
    "tile_touren": maproute,
    "tile_personal": people,
    "tile_werkstatt": wrench,
    "tile_kassenbuch": cashbook,
    "tile_kunden": handshake,
    "tile_statistik": chart,
    "tile_nachrichten": envelope,
    "tile_einstellungen": gear,
}

for name, fn in ICONS.items():
    im, d = new()
    fn(d)
    im.resize((W * SCALE, H * SCALE), Image.NEAREST).save(f"{OUT}/{name}.png")

print(f"{len(ICONS)} Platzhalter-Icons in {OUT} ({W*SCALE}x{H*SCALE})")
