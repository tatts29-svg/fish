#!/usr/bin/env python3
"""Author: Andrew Fisher. Contact sheets from rendered full-lap test captures.

These are test-frame summaries, not a continuous gameplay recording or a claim
about animation frame rate. Reads only the offline preview's screenshot files.
"""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw

root = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/private-v788-full-lap')
data = json.loads((root / 'full-lap-checks.json').read_text())
for name, case in data['cases'].items():
    samples = [row for row in case.get('samples', []) if row.get('screenshot')]
    if not samples or not case.get('finished'):
        print(f'{name}: full-lap checks not finished; no completion contact sheet written')
        continue
    # Include the grid and the completed-lap frame, evenly spaced in distance.
    targets = [case['lapLengthM'] * i / 11 for i in range(12)]
    chosen = [min(samples, key=lambda row: abs(row['distanceM'] - at)) for at in targets]
    phone = name == 'phone'
    tile_w, tile_h = (195, 422) if phone else (320, 180)
    cols = 3 if phone else 4
    gutter, header, label_h = 10, 60, 24
    rows = (len(chosen) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (tile_w + gutter) + gutter,
                              header + rows * (tile_h + label_h + gutter)), '#101618')
    draw = ImageDraw.Draw(sheet)
    draw.text((gutter, 12), f'GC500 v7.88 draft | {name} | original complete circuit', fill='white')
    draw.text((gutter, 32), '12 sampled views; accelerated physics check, not a video/FPS benchmark', fill='#bdc5c8')
    for i, row in enumerate(chosen):
        with Image.open(root / row['screenshot']['file']) as source:
            frame = source.convert('RGB')
        frame.thumbnail((tile_w, tile_h), Image.Resampling.LANCZOS)
        x = gutter + (i % cols) * (tile_w + gutter)
        y = header + (i // cols) * (tile_h + label_h + gutter)
        sheet.paste(frame, (x, y))
        draw.text((x, y + tile_h + 4), f"{row['distanceM']:.0f} m | t={row['simulationTimeS']:.1f} s", fill='#ff9b51')
    target = root / f'{name}-coverage-contact.png'
    sheet.save(target)
    print(target)
