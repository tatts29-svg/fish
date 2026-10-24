#!/usr/bin/env python3
"""v5.96 - ONE MENU, AND IT IS THE TOOLBOX (Andrew Fisher, 25 Sep 2026: "we have More and Tools — have one or the
other; keep Tools; and Tools should look like opening the Coates supercar V8 toolbox"). The nav row's More button
and its menu are gone; every view is in Tools under Every view, the view you are on that is not in the bar takes
the bar's last place while you are on it, and the attention dot rides on Tools. Tools opens like a steel drawer:
orange lip, stamped label strip, the tools set in dark foam, a short slide as it opens.  python3 patch_v596.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

rep("""  const hidden = TABS.filter(([k]) => inMore(k) && !TABS_OFF.has(k));
  const here = hidden.find(([k]) => k === state.tab);
  const attnInMore = hidden.filter(([k]) => dot(k)).length;
  $('#tabs').innerHTML = tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('')
    + `<button type="button" class="tabmore${here ? ' on' : ''}" id="tabMore" aria-haspopup="menu" aria-expanded="false"
         aria-controls="tabMoreMenu" title="${esc(hidden.map(([, l]) => l).join(' · '))}"
         >${tabGlyph('more')}<span class="tw">${here ? esc(here[1]) : 'More'}</span><i class="cv" aria-hidden="true"></i>${
         attnInMore ? `<i class="dot" title="${attnInMore} view${attnInMore === 1 ? '' : 's'} behind More want attention"></i>` : ''}</button>`;""",
"""  const hidden = TABS.filter(([k]) => inMore(k) && !TABS_OFF.has(k));
  const here = hidden.find(([k]) => k === state.tab);
  const attnInMore = hidden.filter(([k]) => dot(k)).length;
  /* v5.96 - no More: the bar is the primary views, plus the one you are on when it is not one of them; every view
     is in Tools, and the attention behind the bar rides on the Tools button */
  $('#tabs').innerHTML = tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('') + (here ? tabBtn(here) : '');
  const tbtn = $('#moreBtn'); if (tbtn) { const d = tbtn.querySelector('.dot'); if (attnInMore && !d) tbtn.insertAdjacentHTML('beforeend', `<i class="dot" title="${attnInMore} view${attnInMore === 1 ? '' : 's'} want attention"></i>`); else if (!attnInMore && d) d.remove(); }""", 'no More in the bar')
rep("""  <div class="tabmoremenu" id="tabMoreMenu" role="menu" aria-label="More views" hidden></div>""", """  <!-- v5.96 - the nav row's More menu is gone; every view is in Tools -->""", 'More menu markup gone')
rep("""       <div class="mmsec" id="mmViewsHead">Views</div>""", """       <div class="mmsec" id="mmViewsHead">Every view</div>""", 'every view')
rep(""".moremenu .mmviews{display:grid;grid-template-columns:1fr 1fr;gap:3px}""",
""".moremenu .mmviews{display:grid;grid-template-columns:1fr 1fr;gap:3px}
/* v5.96 - TOOLS OPENS LIKE THE #26's V8 TOOLBOX: a steel drawer with an orange lip and a stamped label strip, the
   tools set in dark foam, a short slide out as it opens. The one menu in the header. */
.moremenu{background:linear-gradient(180deg,#252d31 0,#161c1f 18%,#0f1417 100%);border:1px solid #3a4448;border-top:4px solid var(--orange);border-radius:6px 6px 14px 14px;
  box-shadow:0 26px 48px -18px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.07);padding:0 10px 4px;gap:5px;color:#e9edec;transform-origin:top right;animation:tbxOpen .34s cubic-bezier(.2,.8,.2,1) both}
.moremenu::before{content:'COATES · V8 TOOLBOX';display:block;margin:0 -10px 4px;padding:8px 12px 7px;font:800 10px/1 'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);letter-spacing:.22em;color:#ffb27a;
  background:repeating-linear-gradient(90deg,#1c2327 0 10px,#151b1e 10px 20px);border-bottom:1px solid #3a4448}
.moremenu::after{content:'';display:block;height:8px;margin:6px -10px -4px;border-radius:0 0 12px 12px;background:linear-gradient(180deg,#2c3539,#0b0f11);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.moremenu .mmsec{color:#9fb0b2;padding:9px 2px 4px;border-top:1px dashed #2c3539}.moremenu .mmsec:first-child{border-top:0;padding-top:4px}
.moremenu .btn{background:linear-gradient(180deg,#1c2327,#12181b);color:#f1f4f3;border:1px solid #2f393d;box-shadow:inset 0 0 0 1px rgba(0,0,0,.55),inset 0 -2px 0 rgba(0,0,0,.45);min-height:38px}
.moremenu .btn:hover,.moremenu .btn:focus-visible{border-color:var(--orange);color:#fff;background:linear-gradient(180deg,#2c2118,#1a140f);outline:0}
.moremenu .btn[aria-current="page"]{border-color:var(--orange);color:#ffb27a;background:linear-gradient(180deg,#3a2a1c,#241a10)}
.moremenu .who{color:#9fb0b2}.moremenu .who input{background:#0b1013;color:#fff;border-color:#2f393d}
.moremenu .mmviews{gap:4px}
.hmore{background:linear-gradient(180deg,#2c3539,#151b1e);color:#fff;border:1px solid #3a4448;border-left:3px solid var(--orange)}
.hmore::before{content:'';display:inline-block;width:13px;height:9px;border:2px solid currentColor;border-radius:2px;box-shadow:inset 0 3px 0 -1px currentColor;margin-right:2px;position:relative;top:1px}
.hmore .dot{position:static;margin-left:4px}
@keyframes tbxOpen{from{transform:translateY(-14px) scaleY(.9);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.moremenu{animation:none}}""", 'toolbox look')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.96', n0, '->', len(s))
