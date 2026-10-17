#!/usr/bin/env python3
"""v7.20 - Delivery pace as a race-car dash. Andrew Fisher, 28 Sep 2026: "Can the things on the right become those LEDs
so it then looks like a race car dashboard" (the four tiles beside the dial: Behind by, Recorded on site, The plan asks
for, units on the whole job). Each tile becomes a dark dash panel with a bank of ten LEDs, lit to its own figure:
 - Behind by: red LEDs for the share of today's plan not yet on site (green bank when nothing is behind);
 - Recorded on site: green LEDs for recorded ÷ planned by today;
 - The plan asks for: the full blue bank - the line the others are read against;
 - Whole job: orange for the share recorded, blue for the share planned by today, dark for the rest.
The figures, words and the Observed / Schedule marks are unchanged; the LEDs are the same figures drawn, never new
ones. The same block is on Today and Where we are, so both change together.   python3 patch_v720.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
JS = r"""/* v7.20 - a bank of ten LEDs, lit to a share: [share, tone] pairs, first match wins, the rest dark */
function dashLeds(parts, label, n){
 n = n || 10;
 const lit = [];
 for (let i = 0; i < n; i++) { let t = ''; for (const [f, tone] of parts) { if (i < Math.round(Math.max(0, Math.min(1, f || 0)) * n)) { t = tone; break; } } lit.push(t); }
 return '<span class="dled" role="img" aria-label="' + esc(label || '') + '">' + lit.map((t, i) => '<i class="' + (t ? 'on ' + t : '') + '" style="--d:' + (i * 40) + 'ms"></i>').join('') + '</span>';
}
"""
CSS = """/* v7.20 - Delivery pace: the tiles beside the dial as a race-car dash, each with a bank of LEDs */
.cside .ctile{background:linear-gradient(180deg,#20262a,#121517) !important;border:1px solid #2f383e !important;color:#eef1f0 !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.cside .ctile .ctk{color:#a9b4b3;opacity:1}
.cside .ctile b{color:#f7f8f6}
.cside .ctile span,.cside .ctile em{color:#b9c2c1}
.cside .ctile.lead.stop .ctbig,.cside .ctile.lead.stop .ctmark,.cside .ctile.lead.stop b{color:#ff6b5a}
.cside .ctile.lead.good .ctbig,.cside .ctile.lead.good .ctmark,.cside .ctile.lead.good b{color:#7ee08a}
.cside .ctile.lead{flex-wrap:wrap}
.cside .ctile.lead .dled{flex:1 1 100%;order:3}
.cside .ctile .dled{align-self:stretch;width:100%;box-sizing:border-box}
.cside .ctile.whole{flex-wrap:wrap}.cside .ctile.whole .dled{flex:1 1 100%;order:9;margin-top:10px}
.cside .ctile .sem{background:rgba(255,255,255,.06) !important;border-color:rgba(255,255,255,.18) !important;color:#dfe5e4 !important}
.cside .ctile.whole .cwpc i.on{background:#ff8a2a}.cside .ctile.whole .cwpc i.pl{background:#4f8bff}
.cside .ctile .dled{display:flex !important;opacity:1 !important;gap:4px;margin:9px 0 2px;padding:5px 6px;background:#0b1113;border:1px solid #334043;border-radius:6px;box-shadow:inset 0 1px 3px rgba(0,0,0,.6)}
.cside .dled i{display:block;flex:1 1 0;min-width:0;height:9px;border-radius:2px;background:#2a3331;box-shadow:inset 0 1px 1px rgba(255,255,255,.08)}
.cside .dled i.on{animation:dledOn .28s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:var(--d)}
.cside .dled i.on.g{background:#7ee08a;box-shadow:0 0 7px rgba(126,224,138,.55),inset 0 1px 1px rgba(255,255,255,.5)}
.cside .dled i.on.r{background:#ff5a4a;box-shadow:0 0 7px rgba(255,90,74,.6),inset 0 1px 1px rgba(255,255,255,.45)}
.cside .dled i.on.b{background:#4f8bff;box-shadow:0 0 7px rgba(79,139,255,.55),inset 0 1px 1px rgba(255,255,255,.45)}
.cside .dled i.on.o{background:#ff8a2a;box-shadow:0 0 7px rgba(255,138,42,.6),inset 0 1px 1px rgba(255,255,255,.45)}
@keyframes dledOn{from{opacity:.15;filter:brightness(.4)}to{opacity:1;filter:none}}
@media (prefers-reduced-motion:reduce){.cside .dled i.on{animation:none}}
html[data-motion="off"] .cside .dled i.on{animation:none}
@media print{.cside .dled i.on{animation:none;box-shadow:none}}
"""
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function dashLeds(' in t: sys.exit('v7.20 already applied')
if re.search(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in JS')
t = rep(t, "function completionBlock(asOf, C, opts){", JS + "function completionBlock(asOf, C, opts){", 'code', p, True)
# the verdict: red for what is behind, green bank when nothing is
t = rep(t, " <div class=\"ctbig\">${C.plan ? fmtNum(C.shortfall) : '—'}</div>\n </div>",
        " <div class=\"ctbig\">${C.plan ? fmtNum(C.shortfall) : '—'}</div>\n"
        " ${C.plan ? dashLeds(C.shortfall ? [[C.shortfall / C.plan, 'r']] : [[1, 'g']], C.shortfall ? fmtNum(C.shortfall) + ' of ' + fmtNum(C.plan) + ' behind' : 'nothing behind') : ''}\n </div>", 'lead leds', p, True)
t = rep(t, " <span>of the units due by today</span>\n ${sem('good',",
        " <span>of the units due by today</span>\n ${C.plan ? dashLeds([[C.onDue / C.plan, 'g']], fmtNum(C.onDue) + ' of ' + fmtNum(C.plan) + ' recorded') : ''}\n ${sem('good',", 'good leds', p, True)
t = rep(t, " <span>units on site by today</span>\n \n ${sem('plan',",
        " <span>units on site by today</span>\n ${C.plan ? dashLeds([[1, 'b']], 'the plan: ' + fmtNum(C.plan)) : ''}\n ${sem('plan',", 'plan leds', p, True)
t = rep(t, "<span><i class=\"pl\"></i>${pc1(C.planPct)}% planned by today</span></div>",
        "<span><i class=\"pl\"></i>${pc1(C.planPct)}% planned by today</span></div>\n ${dashLeds([[(C.pct || 0) / 100, 'o'], [(C.planPct || 0) / 100, 'b']], pc1(C.pct) + '% recorded, ' + pc1(C.planPct) + '% planned by today', 20)}", 'whole leds', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
