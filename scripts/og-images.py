#!/usr/bin/env python3
"""Generates public/og/*.png (1200x630 link-preview images) with Pillow, using the design tokens in
src/styles/tokens.css and the bundled Plus Jakarta Sans. Run `npm ci` first, then: python3 scripts/og-images.py"""
from PIL import Image, ImageDraw, ImageFont

FONT = 'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-%d-normal.woff'
INK, MUTED, BG = '#111111', '#3a3a3a', '#f4f4f2'
W, H = 1200, 630
# name -> (background, accent, headline lines, subline)
CARDS = {
    'site': (BG, '#4c82fb', ['Propaganda and', 'manipulation analysis'], 'Paste a post or article. VEIL shows the signs.'),
    'verdict-detected': ('#e4f3e8', '#1f8a4c', ['Manipulation', 'detected'], 'VEIL verdict'),
    'verdict-not_detected': ('#e6f0ff', '#4c82fb', ['No manipulation', 'indicators'], 'VEIL verdict'),
    'verdict-uncertain': ('#fff0d9', '#c45a1a', ['Uncertain'], 'VEIL verdict'),
    'pending': (BG, '#4c82fb', ['Analysis in progress'], 'Open the link to follow it live.'),
    'unavailable': (BG, '#6b6b6b', ['Analysis unavailable'], 'No final assessment is available.'),
}

def font(weight, size):
    return ImageFont.truetype(FONT % weight, size)

for name, (bg, accent, lines, sub) in CARDS.items():
    im = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 24, H), fill=accent)
    d.text((100, 80), 'VEIL', font=font(800, 64), fill=INK)
    d.text((290, 98), '/ Intelligence', font=font(600, 40), fill=MUTED)
    y = 230
    for line in lines:
        d.text((100, y), line, font=font(800, 96), fill=INK)
        y += 120
    d.text((100, y + 30), sub, font=font(600, 40), fill=MUTED)
    im.save(f'public/og/{name}.png', optimize=True)
