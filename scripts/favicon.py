#!/usr/bin/env python3
"""Generates public/{favicon.ico,apple-touch-icon.png,icon-192.png,icon-512.png} from public/favicon.svg (the master),
using only Pillow. The SVG is a background rect plus one <polygon>; the rasters use a full-bleed square background
instead of the rounded corners. Usage: python3 scripts/favicon.py"""
import re
from PIL import Image, ImageDraw

SVG = open('public/favicon.svg').read()
BG, INK = '#fafaf9', '#111111'
assert SVG.count('<polygon') == 1 and BG in SVG and INK in SVG
VIEW = float(re.search(r'viewBox="0 0 (\d+) ', SVG).group(1))
POINTS = [tuple(map(float, p.split(','))) for p in re.search(r'points="([^"]+)"', SVG).group(1).split()]

def render(px, ss=8):
    im = Image.new('RGB', (px * ss, px * ss), BG)
    ImageDraw.Draw(im).polygon([(x / VIEW * px * ss, y / VIEW * px * ss) for x, y in POINTS], fill=INK)
    return im.resize((px, px), Image.LANCZOS)

for name, px in (('apple-touch-icon', 180), ('icon-192', 192), ('icon-512', 512)):
    render(px).save(f'public/{name}.png', optimize=True)
ico = [render(s) for s in (48, 32, 16)]
ico[0].save('public/favicon.ico', format='ICO', sizes=[(48, 48), (32, 32), (16, 16)], append_images=ico[1:])
