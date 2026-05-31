#!/usr/bin/env python3
"""Genera imatges 1270×760px per a Product Hunt a partir dels screenshots existents."""

from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(BASE, 'screenshots')
OUT   = os.path.join(BASE, 'screenshots', 'producthunt')
os.makedirs(OUT, exist_ok=True)

W, H = 1270, 760

BG_DARK  = '#1a1a1a'
BG_LIGHT = '#f5f5f5'
WHITE    = '#ffffff'
GRAY     = '#888888'
ACCENT   = '#222222'

def load_font(size, bold=False):
    candidates = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/Arial.ttf',
        '/Library/Fonts/Arial.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def phone_frame(img, corner=40):
    """Afegeix cantonades arrodonides i un fons fosc de mòbil."""
    mask = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.width, img.height], radius=corner, fill=255)
    result = img.copy().convert('RGBA')
    result.putalpha(mask)
    return result

def paste_alpha(canvas, layer, pos):
    canvas.paste(layer, pos, layer.split()[3])

# ─── Imatge 1: Hero ──────────────────────────────────────────────────────────
# Fons fosc, títol a l'esquerra, 3 mòbils a la dreta
def hero():
    img = Image.new('RGB', (W, H), BG_DARK)
    d   = ImageDraw.Draw(img)

    # Títol i tagline
    f_title = load_font(72)
    f_tag   = load_font(28)
    f_feat  = load_font(22)

    d.text((70, 120), 'Cuida', fill=WHITE, font=f_title)
    d.text((70, 210), 'Home care coordination', fill='#aaaaaa', font=f_tag)
    d.text((70, 260), 'for dependent people', fill='#aaaaaa', font=f_tag)

    features = [
        'Medication push reminders',
        'Emergency protocols step-by-step',
        '"I\'m alone" SOS safety mode',
        'Caregiver weekly schedule',
        'Data in your own private GitHub repo',
        'Free, open source, no subscriptions',
    ]
    f_feat2 = load_font(21)
    y = 340
    for feat in features:
        d.ellipse([70, y+7, 79, y+16], fill='#555555')
        d.text((90, y), feat, fill='#cccccc', font=f_feat2)
        y += 38

    # 3 screenshots a la dreta
    names   = ['01-inici.png', '02-medicacio.png', '03-urgencies.png']
    ph_h    = 520
    offsets = [80, 20, 80]   # vertical offset per donar profunditat

    # Amplada de cada mòbil
    src0 = Image.open(os.path.join(SHOTS, names[0]))
    ph_w = int(ph_h * src0.width / src0.height)

    total_phones_w = len(names) * ph_w + (len(names) - 1) * 20
    x_start = W - total_phones_w - 50

    for i, (name, voff) in enumerate(zip(names, offsets)):
        src  = Image.open(os.path.join(SHOTS, name)).convert('RGB')
        src  = src.resize((ph_w, ph_h), Image.LANCZOS)
        framed = phone_frame(src, corner=30)
        x = x_start + i * (ph_w + 20)
        y = (H - ph_h) // 2 + voff
        paste_alpha(img, framed, (x, y))

    img.save(os.path.join(OUT, '01-hero.png'))
    print('Generat: 01-hero.png')

# ─── Imatge 2: Features grid ─────────────────────────────────────────────────
# Fons clar, 6 mòbils en 2 files de 3, amb etiquetes
def features():
    img = Image.new('RGB', (W, H), BG_LIGHT)
    d   = ImageDraw.Draw(img)

    f_label = load_font(22)
    f_title = load_font(30)

    # Títol
    d.text((W//2, 24), 'Cuida — all screens', fill=ACCENT, font=f_title, anchor='mt')

    all_shots = [
        ('01-inici.png',     'Home'),
        ('02-medicacio.png', 'Medication'),
        ('03-urgencies.png', 'Emergencies'),
        ('04-contactes.png', 'Contacts'),
        ('05-diari.png',     'Diary'),
        ('06-graella.png',   'Schedule'),
    ]

    cols    = 3
    rows    = 2
    padding = 30
    label_h = 34
    top     = 70

    cell_w = (W - padding * (cols + 1)) // cols
    cell_h = (H - top - padding * (rows + 1) - label_h * rows) // rows

    src0   = Image.open(os.path.join(SHOTS, all_shots[0][0]))
    ph_h   = cell_h
    ph_w   = int(ph_h * src0.width / src0.height)
    ph_w   = min(ph_w, cell_w)
    ph_h   = int(ph_w * src0.height / src0.width)

    for idx, (name, label) in enumerate(all_shots):
        col = idx % cols
        row = idx // cols
        x0  = padding + col * (cell_w + padding)
        y0  = top + padding + row * (ph_h + label_h + padding)

        src    = Image.open(os.path.join(SHOTS, name)).convert('RGB')
        src    = src.resize((ph_w, ph_h), Image.LANCZOS)
        framed = phone_frame(src, corner=24)
        cx     = x0 + (cell_w - ph_w) // 2
        paste_alpha(img, framed, (cx, y0))

        lx = x0 + cell_w // 2
        ly = y0 + ph_h + 8
        d.text((lx, ly), label, fill='#444444', font=f_label, anchor='mt')

    img.save(os.path.join(OUT, '02-features.png'))
    print('Generat: 02-features.png')

hero()
features()
print(f'\nImatges a: {OUT}')
