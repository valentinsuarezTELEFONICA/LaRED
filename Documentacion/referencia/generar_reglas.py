#!/usr/bin/env python3
"""Regenera coordenadas_4k_reglas.jpg a partir de coordenadas_4k.json.

Uso (desde cualquier carpeta):
    python3 Documentacion/referencia/generar_reglas.py

Necesita Pillow (pip install pillow). Lee, en esta misma carpeta:
  - coordenadas_4k.json          cajas y zona visible en píxeles reales 4K
  - pantallazo_4k_original.jpg   captura de referencia del usuario (la parte roja no se ve)
y escribe coordenadas_4k_reglas.jpg.

Reglas: marcas cada 100 px en rojo, múltiplos de 500 en negro y más gruesas.
El 0,0 de las reglas es la esquina superior izquierda de la pantalla 4K
(las reglas viven en un margen blanco fuera de la imagen).
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
W, H = 3840, 2160          # pantalla real
L, T = 150, 70             # margen izquierdo / superior para las reglas
CYAN = (0, 255, 200, 255)
RED, BLK = (220, 0, 0, 255), (0, 0, 0, 255)


def fuente(tam):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
              'C:/Windows/Fonts/arialbd.ttf', '/Library/Fonts/Arial Bold.ttf'):
        try:
            return ImageFont.truetype(p, tam)
        except Exception:
            pass
    return ImageFont.load_default()


F, FS, FR, FRB = fuente(34), fuente(30), fuente(26), fuente(30)
datos = json.load(open(os.path.join(AQUI, 'coordenadas_4k.json'), encoding='utf-8'))
im = Image.open(os.path.join(AQUI, 'pantallazo_4k_original.jpg')).convert('RGB').resize((W, H), Image.LANCZOS)

# --- cajas y zona visible -------------------------------------------------
ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
d = ImageDraw.Draw(ov)
for c in datos['cajas']:
    x, y, w, h = c['x'], c['y'], c['ancho'], c['alto']
    d.rectangle([x, y, x + w, y + h], outline=CYAN, width=5, fill=(0, 255, 200, 28))
    t1, t2 = f"{c['n']} {c['id']}", f"{x},{y}  {w}x{h}"
    tw = max(d.textlength(t1, font=F), d.textlength(t2, font=FS)) + 24
    d.rectangle([x, y, x + tw, y + 84], fill=(0, 0, 0, 215))
    d.text((x + 12, y + 6), t1, font=F, fill=CYAN)
    d.text((x + 12, y + 46), t2, font=FS, fill=(255, 255, 255, 255))
sw, sh = datos['zona_visible']['ancho'], datos['zona_visible']['alto']
d.rectangle([0, sh, W, H], fill=(255, 0, 0, 70))
d.rectangle([sw, 0, W, sh], fill=(255, 0, 0, 70))
d.text((20, sh + 10), f'LIMITE VISIBLE DEL PROYECTO: y={sh} (x={sw})', font=F, fill=(255, 255, 0, 255))
d.line([0, sh, W, sh], fill=(255, 255, 0, 255), width=6)
im = Image.alpha_composite(im.convert('RGBA'), ov)

# --- lienzo con margen + cuadrícula ---------------------------------------
cv = Image.new('RGBA', (W + L, H + T), (250, 250, 250, 255))
cv.paste(im, (L, T))
g = Image.new('RGBA', cv.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(g)
for v in range(0, W + 1, 100):
    grande, x = v % 500 == 0, L + v
    gd.line([x, T, x, T + H], fill=(255, 255, 255, 110), width=7 if grande else 5)
    gd.line([x, T, x, T + H], fill=(0, 0, 0, 210) if grande else (230, 0, 0, 150), width=3 if grande else 1)
for v in range(0, H + 1, 100):
    grande, y = v % 500 == 0, T + v
    gd.line([L, y, L + W, y], fill=(255, 255, 255, 110), width=7 if grande else 5)
    gd.line([L, y, L + W, y], fill=(0, 0, 0, 210) if grande else (230, 0, 0, 150), width=3 if grande else 1)
cv = Image.alpha_composite(cv, g)
d = ImageDraw.Draw(cv)

# --- reglas ---------------------------------------------------------------
d.rectangle([0, 0, L + W, T - 1], fill=(255, 255, 255, 255))
d.rectangle([0, 0, L - 1, T + H], fill=(255, 255, 255, 255))
d.line([0, T - 1, L + W, T - 1], fill=BLK, width=2)
d.line([L - 1, 0, L - 1, T + H], fill=BLK, width=2)
for v in range(0, W + 1, 100):
    grande, x = v % 500 == 0, L + v
    col, f, s = (BLK if grande else RED), (FRB if grande else FR), str(v)
    d.line([x, T - (44 if grande else 24), x, T - 1], fill=col, width=4 if grande else 2)
    tw = d.textlength(s, font=f)
    d.text((min(max(x - tw / 2, 2), L + W - tw - 2), 4), s, font=f, fill=col)
for v in range(0, H + 1, 100):
    grande, y = v % 500 == 0, T + v
    col, f, s = (BLK if grande else RED), (FRB if grande else FR), str(v)
    d.line([L - (44 if grande else 24), y, L - 1, y], fill=col, width=4 if grande else 2)
    tw = d.textlength(s, font=f)
    d.text((L - (48 if grande else 28) - tw, y - (16 if grande else 14)), s, font=f, fill=col)
d.text((6, T // 2 - 14), 'px 4K', font=FR, fill=BLK)

salida = os.path.join(AQUI, 'coordenadas_4k_reglas.jpg')
cv.convert('RGB').save(salida, quality=93)
print('Generado', salida, cv.size)
