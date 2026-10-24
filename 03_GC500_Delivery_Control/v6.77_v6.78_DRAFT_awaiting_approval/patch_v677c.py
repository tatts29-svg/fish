#!/usr/bin/env python3
"""v6.77c (candidate) - accessibility from the 26 Sep re-audit (automated WCAG 2 A/AA check).
  A1  the tab strip: the tabs sit in their own tablist; Tools is beside them, not inside the list
  A2  the plates on Where we are: the plate stays clickable, and a keyboard reaches it through one hidden
      "Open" button at its start instead of the whole plate being a button with buttons inside it
  A3  text contrast: branch codes, the showcase button's small caption, the document cover status, the phase chip
  A4  a table box that scrolls sideways can be reached and scrolled from the keyboard
  python3 patch_v677c.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

CSS = """
/* v6.77 - contrast (A3): the same colours a shade deeper, so small text clears 4.5:1 */
.dsn .grp .k .code{background:var(--orange-ink)}
.showgo i{opacity:1}
.doccover .gc-media-status{color:#4a4038!important;opacity:1!important}
.card.island.racecard .pphase{color:var(--orange-ink)}
.doccard.offsvc .doccover{opacity:1} .doccard.offsvc .doccover img,.doccard.offsvc .doccover canvas{opacity:.55}
.platego:focus-visible{position:absolute;left:8px;top:8px;width:auto;height:auto;clip:auto;margin:0;padding:4px 10px;z-index:3;background:#fff;color:var(--ink);border:2px solid var(--orange);border-radius:6px;font-size:12px}
.grp:focus-within,.mcard:focus-within{outline:2px solid var(--orange);outline-offset:2px}
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    # A1
    t = R("""<nav class="tabs" id="tabs" role="tablist"></nav>""", """<nav class="tabs" id="tabs" aria-label="Views"></nav>""", 'nav role')
    t = R("""$('#tabs').innerHTML = tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('') + (here ? tabBtn(here) : '');""",
          """/* v6.77 (A1) - the tabs in a tablist of their own; display:contents keeps the strip laid out exactly as before */
 $('#tabs').innerHTML = '<div class="tabset" role="tablist" aria-label="Views" style="display:contents">' + tabPrimary().map(k => TABS.find(([x]) => x === k)).filter(Boolean).map(tabBtn).join('') + (here ? tabBtn(here) : '') + '</div>';""", 'tablist')
    # A2 - plates: no longer role=button with buttons inside; a hidden Open button carries the keyboard
    n = 0
    for m in list(re.finditer(r'(<div class="(?:grp|mcard)[^`\n]*?)" role="button" tabindex="0" title="([^"]*?)">', t)):
        pass
    def sub_plate(mo):
        return mo.group(1) + '" title="' + mo.group(2) + '"><button type="button" class="vh platego" data-plate>' + mo.group(2).replace('open ', 'Open ', 1) + '</button>'
    t, n = re.subn(r'(<div class="(?:grp|mcard)[^`\n]*?)" role="button" tabindex="0" title="([^"]*?)">', sub_plate, t)
    print('  plates', n)
    if need and n < 5: sys.exit('plates: %d' % n)
    t = R("""const inner = (e, g) => { const t = e.target.closest('details, summary, button, a, input, select, textarea'); return !!t && t !== g && g.contains(t); };""",
          """const inner = (e, g) => { const t = e.target.closest('details, summary, button:not([data-plate]), a, input, select, textarea'); return !!t && t !== g && g.contains(t); };""", 'plate inner')
    # A4 - a sideways-scrolling table box is keyboard-reachable
    t = R("""function render(){ return holdAssets(renderPass); }""",
          """function render(){ const r = holdAssets(renderPass); tblFocusSoon(); return r; }
/* v6.77 (A4) - a table box that scrolls sideways takes keyboard focus, so arrow keys can scroll it */
let TBLF = 0;
function tblFocusSoon(){ cancelAnimationFrame(TBLF); TBLF = requestAnimationFrame(() => { try { document.querySelectorAll('.pane.on .tblwrap:not([tabindex])').forEach(w => { if (w.scrollWidth > w.clientWidth + 2) { w.tabIndex = 0; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Table — scrolls sideways'); } }); } catch (e) {} }); }""", 'tbl focus')
    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
