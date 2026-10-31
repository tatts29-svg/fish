"""Author: Andrew Fisher. The 39 buildings that had no fire extinguisher before 20 Oct 2026, each with a QR code to its
spot on Google Maps (the point the page's Navigate uses). Andrew: "caan you give me qr code pinned next to each one".
    python3 -I make_fire_qr_sheet.py <pins.json> <audit.json> <out.pdf>"""
import json, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
pins, audit, out = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
typ = {r['ref']: r['items'] for r in audit['rows']}
W, H = A4; cols, rows = 3, 4; mx, top = 10 * mm, H - 24 * mm
cw, ch = (W - 2 * mx) / cols, (top - 14 * mm) / rows
ORANGE, INK, MUTE, RED = colors.HexColor('#E8641B'), colors.HexColor('#1d1d1b'), colors.HexColor('#5f6368'), colors.HexColor('#b3261e')
def qr(c, value, x, y, size):
    w = QrCodeWidget(value, barLevel='M'); b = w.getBounds(); d = Drawing(size, size, transform=[size / (b[2] - b[0]), 0, 0, size / (b[3] - b[1]), 0, 0]); d.add(w); renderPDF.draw(d, c, x, y)
c = canvas.Canvas(out, pagesize=A4); c.setAuthor('Andrew Fisher'); c.setTitle('GC500 fire extinguishers added 20 Oct 2026 - locations')
per = cols * rows; pages = (len(pins) + per - 1) // per
for pg in range(pages):
    c.setFont('Helvetica-Bold', 14); c.setFillColor(INK); c.drawString(mx, H - 13 * mm, 'GC500 · Buildings that had NO fire extinguisher before 20 Oct 2026')
    c.setFont('Helvetica', 8.5); c.setFillColor(MUTE)
    c.drawString(mx, H - 18.5 * mm, f'{len(pins)} buildings · each now has 1 attached on the record · scan a code for its spot on Google Maps · page {pg + 1} of {pages}')
    for i, p in enumerate(pins[pg * per:(pg + 1) * per]):
        x = mx + (i % cols) * cw; y = top - (i // cols + 1) * ch
        c.setStrokeColor(colors.HexColor('#c9c4b8')); c.setLineWidth(0.6); c.roundRect(x + 1.5 * mm, y + 1.5 * mm, cw - 3 * mm, ch - 3 * mm, 2 * mm)
        c.setFillColor(ORANGE); c.rect(x + 1.5 * mm, y + ch - 4 * mm, cw - 3 * mm, 2.5 * mm, stroke=0, fill=1)
        c.setFillColor(INK); c.setFont('Helvetica-Bold', 20); c.drawString(x + 5 * mm, y + ch - 13 * mm, p['ref'])
        c.setFont('Helvetica', 7.6); name = p['name'][:42]; c.drawString(x + 5 * mm, y + ch - 17.5 * mm, name)
        c.setFillColor(MUTE); c.drawString(x + 5 * mm, y + ch - 21.5 * mm, typ.get(p['ref'], '') + ' · fire extinguisher × 1')
        qs = min(cw - 22 * mm, ch - 34 * mm); qx = x + (cw - qs) / 2; qy = y + 9 * mm
        if p['lat'] is not None:
            qr(c, f"https://www.google.com/maps/search/?api=1&query={p['lat']},{p['lon']}", qx, qy, qs)
            c.setFillColor(MUTE); c.setFont('Helvetica', 6.6)
            c.drawCentredString(x + cw / 2, y + 5.8 * mm, f"{p['lat']:.6f}, {p['lon']:.6f} · {p['basis']}")
        else:
            c.setFillColor(colors.HexColor('#f6f3ee')); c.roundRect(qx, qy, qs, qs, 2 * mm, stroke=0, fill=1)
            c.setFillColor(RED); c.setFont('Helvetica-Bold', 11); c.drawCentredString(x + cw / 2, qy + qs / 2, 'No pin - ask on site')
    c.setFont('Helvetica', 6.5); c.setFillColor(MUTE); c.drawString(mx, 7 * mm, 'Author: Andrew Fisher · GC500 2026 · from the live record, 20 Oct 2026')
    c.showPage()
c.save(); print(out, pages)
