#!/usr/bin/env python3
"""Author: Andrew Fisher. A certificate of thanks for each of the ten on the fencing crew, GC500 2026 (A4 landscape, no money).

Names, roles and company exactly as the crew's sign-on sheet reads on the record's team page (Wayne Woods marked supervisor);
the figures are the book's (build_crew_book.py), the record's own reading on 24 Oct 2026. Each says "for your part in", so no
one is credited with more than the crew did together.

    python3 build_certificates.py      -> certificates.html, then: node render.cjs certificates.html
"""
from pathlib import Path
import build_crew_book as B

HERE = Path(__file__).resolve().parent
CREW = [('Wayne Woods', 'Supervisor')] + [(n, 'Fencing crew') for n in B.CREW]

CSS = """
@page { size: 297mm 210mm; margin: 0; }
* { box-sizing:border-box; }
html, body { margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Inter Print', Arial, sans-serif; color:#14181B; }
.cert { width:297mm; height:210mm; position:relative; overflow:hidden; page-break-after:always; break-after:page; background:#fff; }
.cert:last-child { page-break-after:auto; break-after:auto; }
.edge { position:absolute; inset:8mm; border:1.4mm solid #FF6B1A; border-radius:2mm; }
.edge::after { content:''; position:absolute; inset:2.2mm; border:.35mm solid #14181B; border-radius:1mm; }
.ck { position:absolute; width:14mm; height:14mm; }
.ck.tl { left:8mm; top:8mm; } .ck.tr { right:8mm; top:8mm; } .ck.bl { left:8mm; bottom:8mm; } .ck.br { right:8mm; bottom:8mm; }
.side { position:absolute; right:8mm; top:8mm; bottom:8mm; width:92mm; background:#14181B; border-radius:0 2mm 2mm 0; overflow:hidden; }
.side .trk { position:absolute; left:50%; top:50%; width:62mm; height:124mm; transform:translate(-50%,-52%); }
.side .trk path { fill:none; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
.side .glow { stroke:rgba(255,107,26,.28); stroke-width:9; } .side .line { stroke:#FF8A3D; stroke-width:2.6; }
.side .cap { position:absolute; left:0; right:0; bottom:9mm; text-align:center; color:#fff; }
.side .cap b { display:block; font:900 italic 34pt/.9 'Barlow Condensed'; color:#FF6B1A; }
.side .cap span { display:block; margin-top:1.2mm; font:800 6pt/1.3 'Inter Print'; letter-spacing:.22em; text-transform:uppercase; color:rgba(255,255,255,.8); }
.side .top { position:absolute; left:0; right:0; top:10mm; text-align:center; font:800 6pt 'Inter Print'; letter-spacing:.28em; text-transform:uppercase; color:rgba(255,255,255,.6); }
.body { position:absolute; left:24mm; top:22mm; width:160mm; }
.kick { margin:0; font:700 7.4pt/1.2 'Inter Print'; letter-spacing:.32em; text-transform:uppercase; color:#FF6B1A; }
h1 { margin:5mm 0 0; font:900 italic 30pt/.95 'Barlow Condensed'; text-transform:uppercase; letter-spacing:.01em; }
.to { margin:8mm 0 1mm; font:600 9pt 'Inter Print'; color:#69737B; }
.name { margin:0; font:900 italic 58pt/.9 'Barlow Condensed'; text-transform:uppercase; letter-spacing:-.005em; }
.name.one { font-size:66pt; }
.bar { width:48mm; height:1.6mm; background:#FF6B1A; margin:4mm 0 3mm; border-radius:1mm; }
.role { margin:0; font:800 8pt 'Inter Print'; letter-spacing:.16em; text-transform:uppercase; }
.text { margin:6mm 0 0; font:400 10.4pt/1.6 'Inter Print'; color:#262D32; max-width:150mm; }
.stats { display:grid; grid-template-columns:repeat(4, auto); justify-content:start; gap:0 7mm; margin-top:8mm; }
.stats b { display:block; font:900 italic 22pt/.9 'Barlow Condensed'; }
.stats b small { font-size:11pt; color:#FF6B1A; margin-left:.8mm; text-transform:uppercase; }
.stats span { display:block; margin-top:1mm; font:700 5.8pt/1.2 'Inter Print'; letter-spacing:.14em; text-transform:uppercase; color:#69737B; }
.sign { position:absolute; left:24mm; bottom:22mm; display:flex; gap:12mm; align-items:flex-end; }
.sign div { width:66mm; }
.sign .ln { border-bottom:.35mm solid #14181B; height:13mm; }
.sign b { display:block; margin-top:1.6mm; font:900 italic 13pt/1 'Barlow Condensed'; text-transform:uppercase; }
.sign span { display:block; margin-top:.6mm; font:600 6.6pt 'Inter Print'; color:#69737B; }
.foot { position:absolute; left:24mm; bottom:12.5mm; font:500 5.4pt 'Inter Print'; color:#8A939A; }
"""


def chequer(cols, rows, sq):
    return ''.join('<rect x="%d" y="%d" width="%d" height="%d" fill="#14181B"/>' % (c * sq, r * sq, sq, sq) for r in range(rows) for c in range(cols) if (r + c) % 2 == 0)


def build():
    lap = B.lap_path()
    ck = '<svg viewBox="0 0 28 28">%s</svg>' % chequer(4, 4, 7)
    pages = []
    for name, role in CREW:
        pages.append(f'''<section class="cert">
 <div class="edge"></div>
 <div class="side"><div class="top">Surfers Paradise street circuit</div>
  <svg class="trk" viewBox="0 0 50 100"><path d="{lap}" class="glow"/><path d="{lap}" class="line"/></svg>
  <div class="cap"><b>100%</b><span>of the build · Fri 23 Oct 2026</span></div></div>
 <div class="ck tl">{ck}</div><div class="ck bl">{ck}</div>
 <div class="body">
  <p class="kick">Boost Mobile Gold Coast 500 · 2026 build</p>
  <h1>Certificate of thanks</h1>
  <p class="to">Presented to</p>
  <p class="name{' one' if len(name) <= 14 else ''}">{name}</p>
  <div class="bar"></div>
  <p class="role">{role} · Advanced Temporary Fencing</p>
  <p class="text">For your part in building 20.8 km of fence and crowd control around the Surfers Paradise street circuit, Wed 9 September to Fri 23 October 2026. Every panel, foot and clamp carried and stood up by hand, in the wind and the rain, and done right.</p>
  <div class="stats"><div><b>13.3<small>km</small></b><span>temporary fence</span></div><div><b>7.3<small>km</small></b><span>crowd-control barrier</span></div>
   <div><b>4.4<small>km</small></b><span>scrim</span></div><div><b>233</b><span>signed papers</span></div></div>
 </div>
 <div class="sign"><div><div class="ln"></div><b>Andrew Fisher</b><span>Shutdown Manager · Coates · GC500 2026</span></div></div>
 <p class="foot">Author: Andrew Fisher, Coates · Name and company as the crew's sign-on sheet reads · Figures from the GC500 Delivery Control record, read 24 Oct 2026</p>
</section>''')
    html = ('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Certificates of thanks — GC500 2026 fencing crew</title>'
            '<meta name="author" content="Andrew Fisher"><style>%s%s</style></head><body>%s</body></html>') % (B.FONTS, CSS, '\n'.join(pages))
    (HERE / 'certificates.html').write_text(html, encoding='utf-8')
    print('certificates.html: %d certificates, %d bytes' % (len(CREW), len(html)))


if __name__ == '__main__':
    build()
