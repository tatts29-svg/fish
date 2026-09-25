#!/usr/bin/env python3
"""v5.92 - THE PRESENTATION PASS (Andrew Fisher, 25 Sep 2026: everything sharp, everything standing out, animate
where it earns it). Plant has a glyph in the bar like every other primary view. The delivery gauge sweeps up on
every arrival at Today, not once per session. The big figures on the race cards and data cards count up when a
page arrives (once per arrival, off for reduced motion). Cards lift a touch under the pointer. Text is
antialiased and legibility-optimised so the 4K screens Andrew reads on get every edge.  python3 patch_v592.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

rep("""  register: '<path d="M2.5 3.5h11M2.5 8h11M2.5 12.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 2.5v11" stroke="currentColor" stroke-width="1.2"/>',""",
    """  register: '<path d="M2.5 3.5h11M2.5 8h11M2.5 12.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.5 2.5v11" stroke="currentColor" stroke-width="1.2"/>',
  plant: '<path d="M2.5 13.5h11M3 13.5V7h4.5v6.5M9.5 13.5V4.5h3.5v9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.6 9.2h1.3M4.6 11.2h1.3M11 6.5h.8M11 8.7h.8M11 10.9h.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',   /* v5.92 - a plant yard: two sheds */""", 'plant glyph')
# the gauge sweeps up on every arrival at Today; the big figures count up once per arrival
rep("""  if (changed) delete RACE_RAN[tab];""",
    """  if (changed) delete RACE_RAN[tab];
  if (changed) GI_SEEN.clear();   /* v5.92 - the gauge sweeps up on every arrival, not once a session */""", 'gauge each visit')
rep("""  render();
  /* Every view gets a heading it is named by, put there after render so no page has to remember to add one,""",
    """  render();
  if (changed) countUpFigures(tab);   /* v5.92 */
  /* Every view gets a heading it is named by, put there after render so no page has to remember to add one,""", 'count up on arrival')
rep("""const TAB_SCROLL = {};   /* each tab's reading position, by tab key (v5.79) */""",
    """const TAB_SCROLL = {};   /* each tab's reading position, by tab key (v5.79) */
/* v5.92 - the big figures on the race cards and the data cards count up when a page arrives: whole numbers only,
   the final text put back exactly as rendered, 640 ms, once per arrival; nothing for reduced motion or print */
function countUpFigures(tab){
  if (motionOff()) return;
  const pane = $('#pane-' + tab); if (!pane) return;
  /* the big figures are found by size, not by class: any bold whole number set 22 px or larger in the arriving pane */
  const els = [...pane.querySelectorAll('b, strong')].filter(el => /^[\\d,]{1,7}$/.test(el.textContent.trim()) && !el.closest('.gidig, table, svg') && !el.dataset.counting && parseFloat(getComputedStyle(el).fontSize) >= 22).slice(0, 80);
  const t0 = performance.now(), D = 640;
  const items = els.map(el => { const txt = el.textContent.trim(), n = parseInt(txt.replace(/,/g, ''), 10); el.dataset.counting = '1'; return {el, txt, n, comma: txt.includes(',')}; }).filter(x => Number.isFinite(x.n) && x.n > 0);
  if (!items.length) return;
  const step = () => { const k = Math.min(1, (performance.now() - t0) / D), e = 1 - Math.pow(1 - k, 3);
    for (const it of items) { if (!it.el.isConnected) continue; const v = Math.round(it.n * e); it.el.textContent = k >= 1 ? it.txt : (it.comma ? v.toLocaleString('en-AU') : String(v)); }
    if (k < 1) requestAnimationFrame(step); else items.forEach(it => { delete it.el.dataset.counting; }); };
  requestAnimationFrame(step);
}""", 'count-up helper')
# the pane's first paint after a count-up has to be the final figure: any re-render mid-count is fine since the text is
# written by the renderer and the step only writes to connected elements
rep(""".hubcard{--face:#fff;border-radius:14px;box-shadow:0 12px 28px -20px rgba(0,0,0,.45)}""",
    """.hubcard{--face:#fff;border-radius:14px;box-shadow:0 12px 28px -20px rgba(0,0,0,.45);transition:transform .18s cubic-bezier(.2,.7,.2,1),box-shadow .18s}
/* v5.92 - a card lifts a touch under the pointer; every edge is antialiased for the big screens */
@media (hover:hover){.hubcard[data-go]:hover,.photocat:hover,.card.island:hover{transform:translateY(-2px);box-shadow:0 18px 34px -18px rgba(0,0,0,.55)}}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
.hubbig b,.pstat b,.tkpi b,.kpi b{font-variant-numeric:tabular-nums lining-nums}
@media (prefers-reduced-motion:reduce){.hubcard,.photocat,.card.island{transition:none!important;transform:none!important}}""", 'lift and smoothing')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.92', n0, '->', len(s))
