"""Author: Andrew Fisher. FWF service labels, 17 Oct 2026, on Avery 959030 (template L7169: 4 per A4, 99.1 x 139 mm).

One label per FWF we pay event-night servicing on (pump out, clean and restock, Friday 23, Saturday 24 and Sunday 25 Oct
nights), plus a box for the final pump-out before it is picked up. Cleaners put a 14 mm dot in the box as each one is done.

    python3 -I make_labels.py fwf_service_units.json out_dir
Writes GC500_FWF_service_labels_L7169.pdf (the labels) and GC500_FWF_labels_alignment_test.pdf (one sheet with the
label outlines, to print on plain paper and hold against a label sheet before printing the lot).
"""
import json, re, sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# L7169: 2 across, 2 down; label 99.1 x 139; top/bottom margin 9.5; side margin 4.65; horizontal pitch 101.6
LW, LH, TOP, SIDE, HPITCH, VPITCH = 99.1 * mm, 139 * mm, 9.5 * mm, 4.65 * mm, 101.6 * mm, 139 * mm
PW, PH = A4
ORANGE = colors.HexColor('#E8641B'); INK = colors.HexColor('#1d1d1b'); MUTE = colors.HexColor('#5f6368')
NIGHTS = [('FRI', '23 OCT'), ('SAT', '24 OCT'), ('SUN', '25 OCT')]

def natural(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref)
    return (m.group(1), int(m.group(2))) if m else (ref, 0)

def labels(rows):
    out = []
    for r in sorted(rows, key=lambda x: natural(x['ref'])):
        units = r['units'] or [{'no': '', 'item': 'FWF'}] * max(1, r['fwfUnits'])
        n = len(units)
        for i, u in enumerate(units, 1):
            kind = 'ACCESSIBLE' if re.search('accessible', u.get('item') or '', re.I) else 'FWF'
            out.append({'ref': r['ref'], 'name': (r.get('name') or '').strip(), 'no': u.get('no') or '', 'kind': kind, 'i': i, 'n': n})
    return out

def box(c, x, y, w, h, top, bottom, big=False):
    c.setStrokeColor(INK); c.setLineWidth(1.2); c.roundRect(x, y, w, h, 2.5 * mm)
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 13 if not big else 12); c.drawCentredString(x + w / 2, y + h - 6.2 * mm, top)
    c.setFont('Helvetica', 8.5); c.drawCentredString(x + w / 2, y + h - 10.4 * mm, bottom)
    # the place for a 14 mm dot
    c.setStrokeColor(MUTE); c.setDash(1.5, 1.8); c.setLineWidth(0.6); c.circle(x + w / 2, y + (h - 12 * mm) / 2 + 0.5 * mm, 8 * mm); c.setDash()

def draw_label(c, x0, y0, L, outline=False):
    if outline:
        c.setStrokeColor(colors.HexColor('#9aa0a6')); c.setLineWidth(0.4); c.roundRect(x0, y0, LW, LH, 3 * mm)
    pad = 5 * mm; x = x0 + pad; w = LW - 2 * pad; top = y0 + LH
    # band
    c.setFillColor(ORANGE); c.roundRect(x0 + 2 * mm, top - 11 * mm, LW - 4 * mm, 9 * mm, 2 * mm, stroke=0, fill=1)  # inset 2 mm: a printer a little out still lands on the label
    c.setFillColor(colors.white); c.setFont('Helvetica-Bold', 9.5); c.drawString(x, top - 8 * mm, 'GC500 · EVENT SERVICING')
    c.drawRightString(x + w, top - 8 * mm, L['kind'])
    # reference, big
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 54 if len(L['ref']) <= 4 else 46); c.drawCentredString(x0 + LW / 2, top - 31 * mm, L['ref'])
    c.setFont('Helvetica', 10); c.setFillColor(MUTE)
    sub = ('Unit ' + L['no'] if L['no'] else 'Unit —') + (f"   ·   {L['i']} of {L['n']}" if L['n'] > 1 else '')
    c.drawCentredString(x0 + LW / 2, top - 37 * mm, sub)
    if L['name']: c.setFont('Helvetica', 8.5); c.drawCentredString(x0 + LW / 2, top - 42 * mm, L['name'][:46])
    # the three nights
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 9.5); c.drawString(x, top - 50 * mm, 'PUMP OUT · CLEAN · RESTOCK  (night)')
    bw, gap, bh = (w - 2 * 3 * mm) / 3, 3 * mm, 38 * mm; by = top - 52 * mm - bh
    for k, (d, dt) in enumerate(NIGHTS): box(c, x + k * (bw + gap), by, bw, bh, d, dt)
    # final pump-out
    fy = by - 4 * mm - 32 * mm
    c.setStrokeColor(INK); c.setLineWidth(1.2); c.roundRect(x, fy, w, 32 * mm, 2.5 * mm)
    c.setFillColor(INK); c.setFont('Helvetica-Bold', 13); c.drawString(x + 4 * mm, fy + 32 * mm - 8 * mm, 'FINAL PUMP-OUT')
    c.setFont('Helvetica', 8.5); c.drawString(x + 4 * mm, fy + 32 * mm - 13 * mm, 'before it is picked up.')
    c.drawString(x + 4 * mm, fy + 32 * mm - 17.5 * mm, 'Never load one that is not')
    c.drawString(x + 4 * mm, fy + 32 * mm - 21.5 * mm, 'pumped out.')
    c.setStrokeColor(MUTE); c.setDash(1.5, 1.8); c.setLineWidth(0.6); c.circle(x + w - 15 * mm, fy + 16 * mm, 8 * mm); c.setDash()
    # footer
    c.setFillColor(MUTE); c.setFont('Helvetica', 7.5)
    c.drawCentredString(x0 + LW / 2, y0 + 4.5 * mm, 'Put a dot in the box when it is done. Leave this label on.')

def place(i):
    col, row = i % 2, (i // 2) % 2
    return SIDE + col * HPITCH, PH - TOP - (row + 1) * VPITCH

def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    rows = json.load(open(src))['rows']; L = labels(rows)
    c = canvas.Canvas(str(out / 'GC500_FWF_service_labels_L7169.pdf'), pagesize=A4)
    c.setTitle('GC500 FWF service labels - Avery 959030 / L7169'); c.setAuthor('Andrew Fisher')
    for i, lab in enumerate(L):
        if i and i % 4 == 0: c.showPage()
        draw_label(c, *place(i), lab)
    c.showPage(); c.save()
    t = canvas.Canvas(str(out / 'GC500_FWF_labels_alignment_test.pdf'), pagesize=A4); t.setTitle('GC500 FWF labels - alignment test'); t.setAuthor('Andrew Fisher')
    for i, lab in enumerate(L[:4]): draw_label(t, *place(i), lab, outline=True)
    t.showPage(); t.save()
    print(len(L), 'labels on', (len(L) + 3) // 4, 'sheets;', len(rows), 'references')

if __name__ == '__main__':
    main()
