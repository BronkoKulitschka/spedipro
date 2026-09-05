"""Erzeugt Platzhalter-Programmsymbole, 48x48, gezeichnet auf 24x24 und
verdoppelt - dadurch bleiben die Pixel hart."""
from PIL import Image, ImageDraw
import os

T=(0,0,0,0); BK=(0,0,0,255); WH=(255,255,255,255); GY=(192,192,192,255)
DG=(128,128,128,255); NB=(0,0,128,255); BL=(0,0,255,255); LB=(128,160,255,255)
RD=(128,0,0,255); LR=(255,0,0,255); GR=(0,128,0,255); LG=(0,224,0,255)
YE=(255,255,0,255); OL=(128,128,0,255); CY=(0,128,128,255); MG=(128,0,128,255)
TAN=(255,224,160,255); DTA=(200,160,96,255)

S=24
OUT="assets-src/icons"
os.makedirs(OUT, exist_ok=True)

def new():
    im=Image.new('RGBA',(S,S),T); return im, ImageDraw.Draw(im)

def outline(im):
    src=im.copy(); a=src.split()[3]; d=ImageDraw.Draw(im)
    for x in range(S):
        for y in range(S):
            if a.getpixel((x,y))==0 and any(
                0<=x+dx<S and 0<=y+dy<S and a.getpixel((x+dx,y+dy))>0
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                d.point((x,y),fill=BK)

def save(im,name):
    im.resize((48,48),Image.NEAREST).save(f'{OUT}/{name}.png')

# FUHRPARK - Sattelzug
im,d=new()
d.rectangle([0,9,13,17],fill=WH,outline=BK)
d.line([(2,11),(11,11)],fill=GY)
d.rectangle([14,6,22,17],fill=LR,outline=BK)
d.rectangle([16,8,20,11],fill=LB,outline=BK)
for cx in (4,8,19):
    d.rectangle([cx-2,16,cx+2,20],fill=BK)
    d.point((cx,18),fill=GY)
d.line([(0,21),(23,21)],fill=DG)
save(im,'fuhrpark')

# AUFTRAEGE - Klemmbrett
im,d=new()
d.rectangle([3,2,20,22],fill=OL,outline=BK)
d.rectangle([5,5,18,21],fill=WH,outline=BK)
d.rectangle([9,0,14,4],fill=GY,outline=BK)
for y in range(8,20,3): d.line([(7,y),(16,y)],fill=NB)
save(im,'auftraege')

# TOUREN - Karte mit Route
im,d=new()
d.rectangle([1,3,22,20],fill=GR,outline=BK)
d.line([(1,9),(22,10)],fill=WH); d.line([(8,3),(9,20)],fill=WH)
d.line([(4,17),(9,13),(15,14),(19,6)],fill=LR,width=2)
d.rectangle([2,16,5,19],fill=LG,outline=BK)
d.rectangle([17,4,20,7],fill=LR,outline=BK)
save(im,'touren')

# KARTE - Globus
im,d=new()
d.ellipse([1,1,22,22],fill=LB,outline=BK)
d.ellipse([3,6,10,12],fill=GR); d.ellipse([12,4,19,10],fill=GR)
d.ellipse([7,14,17,20],fill=GR)
d.line([(11,2),(11,21)],fill=NB)
d.arc([4,1,19,22],90,270,fill=NB)
d.ellipse([1,1,22,22],outline=BK)
save(im,'karte')

# PERSONAL - zwei Personen
im,d=new()
for x,col in ((7,NB),(16,GR)):
    d.ellipse([x-3,3,x+3,9],fill=TAN,outline=BK)
    d.rectangle([x-4,11,x+4,21],fill=col,outline=BK)
save(im,'personal')

# WERKSTATT - Maulschluessel
im,d=new()
for i in range(10):
    d.rectangle([6+i,17-i,8+i,19-i],fill=GY)
d.rectangle([14,2,21,9],fill=GY)
d.rectangle([16,0,19,5],fill=T)
d.rectangle([15,4,20,7],fill=T)
d.rectangle([16,6,19,8],fill=GY)
d.rectangle([2,15,8,21],fill=GY)
d.rectangle([4,17,6,19],fill=T)
outline(im)
save(im,'werkstatt')

# KASSENBUCH - Buch und Muenzen
im,d=new()
d.rectangle([0,6,11,21],fill=NB,outline=BK)
d.rectangle([2,8,9,19],fill=WH,outline=BK)
for i,y in enumerate((17,13,9,5)):
    d.ellipse([12+i,y,22-i,y+4],fill=YE,outline=BK)
save(im,'kassenbuch')

# KUNDEN - Handschlag
im,d=new()
d.rectangle([0,9,5,15],fill=NB,outline=BK)
d.rectangle([18,9,23,15],fill=RD,outline=BK)
d.rectangle([5,10,12,14],fill=TAN,outline=BK)
d.rectangle([11,10,18,14],fill=DTA,outline=BK)
d.rectangle([9,8,14,16],fill=TAN,outline=BK)
d.line([(10,10),(13,10)],fill=DTA); d.line([(10,13),(13,13)],fill=DTA)
save(im,'kunden')

# STATISTIK - Balken
im,d=new()
d.line([(2,1),(2,21)],fill=BK); d.line([(2,21),(22,21)],fill=BK)
for x,h,c in ((5,7,NB),(10,14,GR),(15,10,YE),(19,17,LR)):
    d.rectangle([x,21-h,x+3,20],fill=c,outline=BK)
save(im,'statistik')

# NACHRICHTEN - Briefumschlag
im,d=new()
d.rectangle([0,5,23,19],fill=WH,outline=BK)
d.line([(0,5),(11,14),(23,5)],fill=BK)
d.line([(0,19),(8,12)],fill=DG); d.line([(23,19),(15,12)],fill=DG)
save(im,'nachrichten')

# EINSTELLUNGEN - Zahnrad
im,d=new()
d.ellipse([4,4,19,19],fill=GY,outline=BK)
d.ellipse([9,9,14,14],fill=T,outline=BK)
for x,y in ((10,0),(10,20),(0,10),(20,10)):
    d.rectangle([x,y,x+3,y+3],fill=GY,outline=BK)
save(im,'einstellungen')

# ARBEITSPLATZ - Rechner
im,d=new()
d.rectangle([2,3,21,15],fill=GY,outline=BK)
d.rectangle([4,5,19,13],fill=CY,outline=BK)
d.rectangle([8,16,15,18],fill=GY,outline=BK)
d.rectangle([4,19,19,21],fill=GY,outline=BK)
save(im,'arbeitsplatz')

# PAPIERKORB
im,d=new()
d.polygon([(5,6),(18,6),(16,21),(7,21)],fill=GY,outline=BK)
d.rectangle([4,3,19,6],fill=GY,outline=BK)
d.rectangle([9,1,14,3],fill=GY,outline=BK)
for x in (9,11,14): d.line([(x,9),(x-1,18)],fill=DG)
save(im,'papierkorb')

print(sorted(os.listdir(OUT)))
