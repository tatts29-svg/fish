#!/usr/bin/env python3
"""Author: Andrew Fisher. A certificate of thanks for each of the ten on the fencing crew, GC500 2026, in the showpiece's style
(A4 landscape, full bleed, dark, no money).

Names, roles and company exactly as the crew's sign-on sheet reads on the record's team page (Wayne Woods marked supervisor);
the figures are the showpiece's (build_showpiece.py), the record's own reading on 24 Oct 2026. Each says "for your part in",
so no one is credited with more than the crew did together. Each name is sized to fit its line once the fonts have loaded.

    python3 build_certificates.py      -> certificates.html, then: node render.cjs certificates.html
"""
from pathlib import Path
import build_showpiece as S

HERE = Path(__file__).resolve().parent
CREW = [('Wayne Woods', 'Supervisor')] + [(n, 'Fencing crew') for n in S.CREW]

CSS = """
@page { size: 297mm 210mm; margin: 0; }
:root { --bg:#07090B; --ink:#F3EEE7; --mute:#939CA3; --o:#FF6B1A; --o2:#FF8A3D; }
* { box-sizing:border-box; }
html, body { margin:0; padding:0; background:var(--bg); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Inter Print', Arial, sans-serif; color:var(--ink); }
.cert { width:297mm; height:210mm; position:relative; overflow:hidden; background:var(--bg); page-break-after:always; break-after:page; }
.cert:last-child { page-break-after:auto; break-after:auto; }
.cg1 { position:absolute; left:-70mm; top:-80mm; width:270mm; height:230mm; border-radius:50%; background:radial-gradient(closest-side, rgba(255,107,26,.22), rgba(255,107,26,0)); }
.cg2 { position:absolute; right:-50mm; top:20mm; width:180mm; height:200mm; border-radius:50%; background:radial-gradient(closest-side, rgba(255,107,26,.13), rgba(255,107,26,0)); }
.frame { position:absolute; inset:9mm; border:.3mm solid rgba(243,238,231,.15); }
.cn { position:absolute; width:13mm; height:13mm; border:0 solid var(--o); }
.cn.tl { left:9mm; top:9mm; border-left-width:.9mm; border-top-width:.9mm; }
.cn.tr { right:9mm; top:9mm; border-right-width:.9mm; border-top-width:.9mm; }
.cn.bl { left:9mm; bottom:9mm; border-left-width:.9mm; border-bottom-width:.9mm; }
.cn.br { right:9mm; bottom:9mm; border-right-width:.9mm; border-bottom-width:.9mm; }
.body { position:absolute; left:24mm; top:23mm; width:166mm; z-index:2; }
.kick { margin:0; font:700 7pt/1 'Inter Print'; letter-spacing:.36em; text-transform:uppercase; color:var(--o); }
.kick span { color:rgba(243,238,231,.5); margin:0 .6em; }
h1 { margin:7mm 0 0; font:900 italic 27pt/.9 'Barlow Condensed'; text-transform:uppercase; letter-spacing:.06em; }
.to { margin:12mm 0 2.6mm; font:300 10pt/1 'Inter Print'; letter-spacing:.04em; color:var(--mute); }
.name { display:block; width:166mm; margin:0; font:900 italic 76pt/.88 'Barlow Condensed'; text-transform:uppercase; white-space:nowrap; letter-spacing:-.005em; }
.bar { width:46mm; height:1.4mm; background:var(--o); margin:5mm 0 4mm; border-radius:1mm; }
.role { margin:0; font:700 7.6pt/1 'Inter Print'; letter-spacing:.26em; text-transform:uppercase; }
.role span { color:var(--o); margin:0 .5em; }
.text { margin:7mm 0 0; max-width:160mm; font:300 11pt/1.62 'Inter Print'; color:rgba(243,238,231,.88); }
.stats { display:grid; grid-template-columns:repeat(4, auto); justify-content:start; gap:0 10mm; margin-top:10mm; }
.stats b { display:block; font:900 italic 25pt/.9 'Barlow Condensed'; }
.stats b small { font-size:11pt; color:var(--o); margin-left:.8mm; text-transform:uppercase; }
.stats span { display:block; margin-top:1.6mm; font:700 5.8pt/1.2 'Inter Print'; letter-spacing:.2em; text-transform:uppercase; color:var(--mute); }
.sign { position:absolute; left:24mm; bottom:25mm; width:74mm; z-index:2; }
.sign .ln { height:13mm; border-bottom:.35mm solid rgba(243,238,231,.6); }
.sign b { display:block; margin-top:2.2mm; font:800 italic 14pt/1 'Barlow Condensed'; text-transform:uppercase; letter-spacing:.03em; }
.sign span { display:block; margin-top:1.2mm; font:500 6.8pt/1 'Inter Print'; letter-spacing:.12em; color:var(--mute); }
.side { position:absolute; right:9mm; top:9mm; bottom:9mm; width:88mm; border-left:.3mm solid rgba(243,238,231,.1);
        background:linear-gradient(180deg, rgba(255,107,26,.07), rgba(255,107,26,0) 62%); }
.side svg { position:absolute; left:50%; top:15mm; width:58mm; height:116mm; transform:translateX(-50%); overflow:visible; }
.side svg path { fill:none; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
.t1 { stroke:rgba(255,107,26,.11); stroke-width:22; } .t2 { stroke:rgba(255,107,26,.26); stroke-width:9; } .t3 { stroke:var(--o2); stroke-width:2.2; }
.side .cap { position:absolute; left:0; right:0; bottom:15mm; text-align:center; }
.side .cap b { display:block; font:900 italic 46pt/.82 'Barlow Condensed'; color:var(--o); letter-spacing:-.01em; }
.side .cap b small { font-size:24pt; margin-left:.6mm; }
.side .cap span { display:block; margin-top:2.6mm; font:700 6pt/1.5 'Inter Print'; letter-spacing:.3em; text-transform:uppercase; color:rgba(243,238,231,.78); }
.foot { position:absolute; left:24mm; bottom:13.5mm; margin:0; font:400 5.2pt/1 'Inter Print'; color:rgba(243,238,231,.38); z-index:2; }
"""

FIT = """<script>
window.fitNames = function () {
  document.querySelectorAll('.name').forEach(function (el) {
    var s = 76; el.style.fontSize = s + 'pt';
    while (el.scrollWidth > el.clientWidth && s > 40) { s -= 1; el.style.fontSize = s + 'pt'; }
  });
};
document.fonts.ready.then(window.fitNames);
</script>"""


def build():
    trk = S.track_path(100, 200, 2)
    pages = []
    for name, role in CREW:
        pages.append(f'''<section class="cert">
 <div class="cg1"></div><div class="cg2"></div><div class="frame"></div>
 <div class="cn tl"></div><div class="cn tr"></div><div class="cn bl"></div><div class="cn br"></div>
 <div class="side"><svg viewBox="0 0 100 200"><path d="{trk}" class="t1"/><path d="{trk}" class="t2"/><path d="{trk}" class="t3"/></svg>
  <div class="cap"><b>100<small>%</small></b><span>of the build<br>Friday 23 October 2026</span></div></div>
 <div class="body">
  <p class="kick">Boost Mobile Gold Coast 500 <span>·</span> 2026 Build</p>
  <h1>Certificate of thanks</h1>
  <p class="to">Presented to</p>
  <p class="name">{name}</p>
  <div class="bar"></div>
  <p class="role">{role}<span>·</span>Advanced Temporary Fencing</p>
  <p class="text">For your part in building 20.8 km of fence and crowd control around the Surfers Paradise street circuit, Wed 9 September to Fri 23 October 2026. Every panel, foot and clamp carried and stood up by hand, in the wind and the rain, and done right.</p>
  <div class="stats"><div><b>13.3<small>km</small></b><span>temporary fence</span></div><div><b>7.3<small>km</small></b><span>crowd-control barrier</span></div>
   <div><b>4.4<small>km</small></b><span>scrim</span></div><div><b>8,235</b><span>feet</span></div></div>
 </div>
 <div class="sign"><div class="ln"></div><b>Andrew Fisher</b><span>Shutdown Manager · Coates</span></div>
 <p class="foot">Author: Andrew Fisher, Coates · Name and company as the crew's sign-on sheet reads · Figures from the GC500 Delivery Control record, read 24 Oct 2026</p>
</section>''')
    html = ('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Certificates of thanks — GC500 2026 fencing crew</title>'
            '<meta name="author" content="Andrew Fisher"><style>%s%s</style></head><body>%s%s</body></html>') % (S.FONTS, CSS, '\n'.join(pages), FIT)
    (HERE / 'certificates.html').write_text(html, encoding='utf-8')
    print('certificates.html: %d certificates, %d bytes' % (len(CREW), len(html)))


if __name__ == '__main__':
    build()
