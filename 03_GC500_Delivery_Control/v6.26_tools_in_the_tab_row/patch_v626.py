#!/usr/bin/env python3
"""v6.26 - TOOLS IN THE TAB ROW, THE CAR OUT OF THE BANNER (Andrew Fisher, 26 Sep 2026: "Tools can go down next to Coates
way. And remove the car"). The Tools button moves to the right end of the tab row (renderTabs puts it back after every
rebuild); its menu hangs off the body, placed under the button, so the tab strip's sideways scroll never clips it (the
reason the old More menu left the strip). The phone's search button stays in the top row. The car leaves the banner.

  python3 patch_v626.py <page.html> [builder.py]
"""
import re, sys
page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None
def rep(text, old, new, what):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what}: expected once, found {len(ms)}: {old[:80]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]
OLD_TABS = """  $('#tabs').innerHTML = tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('') + (here ? tabBtn(here) : '');"""
NEW_TABS = """  /* v6.26 - Tools lives at the right end of the tab row (Andrew Fisher, 26 Sep 2026); the strip is rebuilt here, so the button
     is taken out first and put back after; its menu hangs off the body so the strip's sideways scroll never clips it; the
     phone's search button stays in the top row */
  const toolsNode = $('.tools'); if (toolsNode && toolsNode.parentElement) toolsNode.parentElement.removeChild(toolsNode);
  $('#tabs').innerHTML = tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('') + (here ? tabBtn(here) : '');
  { const sb = toolsNode ? toolsNode.querySelector('#searchBtn') : null, menu = toolsNode ? toolsNode.querySelector('#moreMenu') : null;
    if (sb) { sb.classList.add('sbtop'); $('.brandrow').appendChild(sb); }
    if (menu) document.body.appendChild(menu);
    if (toolsNode) $('#tabs').appendChild(toolsNode); }"""
OLD_OPEN = """$('#moreBtn').onclick = () => { const m = $('#moreMenu'); m.hidden = !m.hidden; $('#moreBtn').setAttribute('aria-expanded', String(!m.hidden)); if (!m.hidden) { const f = m.querySelector('input, button'); if (f) f.focus(); } };"""
NEW_OPEN = """function moreMenuPlace(){ const m = $('#moreMenu'), b = $('#moreBtn'); if (!m || !b || m.hidden) return; const r = b.getBoundingClientRect();
  m.style.top = Math.round(r.bottom + 8) + 'px'; m.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px'; m.style.left = 'auto'; m.style.maxHeight = Math.max(200, Math.round(innerHeight - r.bottom - 20)) + 'px'; }
window.addEventListener('resize', moreMenuPlace);
$('#moreBtn').onclick = () => { const m = $('#moreMenu'); m.hidden = !m.hidden; $('#moreBtn').setAttribute('aria-expanded', String(!m.hidden)); moreMenuPlace(); if (!m.hidden) { const f = m.querySelector('input, button'); if (f) f.focus(); } };"""
OLD_WHO = """  if (m && m.hidden && b) { m.hidden = false; b.setAttribute('aria-expanded', 'true'); }"""
NEW_WHO = """  if (m && m.hidden && b) { m.hidden = false; b.setAttribute('aria-expanded', 'true'); moreMenuPlace(); }"""
OLD_END = """@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap} .tpodwrap,.hzpod,.recstrip{flex:1 1 30%} .hzpod.hztd{flex:1 1 100%} }
</style></head>"""
NEW_END = """@media (min-width:641px) and (max-width:1180px){ .hzcluster{flex-wrap:wrap} .tpodwrap,.hzpod,.recstrip{flex:1 1 30%} .hzpod.hztd{flex:1 1 100%} }
/* v6.26 - Tools in the tab row, the car out of the banner (Andrew Fisher, 26 Sep 2026) */
.hzcar{display:none!important} .lockup{gap:8px}
nav.tabs .tools{margin-left:auto;order:99;flex:0 0 auto;align-self:center;position:static;padding-left:10px;flex-wrap:nowrap}
nav.tabs .tools .hmore{height:32px;padding:0 12px;font-size:12.5px}
.moremenu{position:fixed;top:auto;right:auto;z-index:80;overflow:auto;overscroll-behavior:contain}
.brandrow .sbtop{order:4;margin-left:auto}
@media (max-width:640px){ nav.tabs .tools{padding-left:6px;padding-right:2px} .hbar{padding-right:12px} }
</style></head>"""
for path in [page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for what, o, n in (('tabs', OLD_TABS, NEW_TABS), ('open', OLD_OPEN, NEW_OPEN), ('who', OLD_WHO, NEW_WHO), ('style', OLD_END, NEW_END)): t = rep(t, o, n, what)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', path.split('/')[-1], n0, '->', len(t))
