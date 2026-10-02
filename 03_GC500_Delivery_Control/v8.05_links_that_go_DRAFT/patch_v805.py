#!/usr/bin/env python3
r"""v8.05 - links that go where they say. Author: Andrew Fisher.

Two faults found by the read-only audits of Map explorer and The Coates Way (2 Oct 2026; Andrew: "Proceed"). Both are
routing only: nothing is redrawn, no layout changes, no figure changes.

  - The Coates Way: none of its ten links went anywhere. The four pillars (People, Operations, Assets, Financials) and
    the red rows set the page's tab without moving to it, so the page stayed on The Coates Way while its address said
    otherwise; two pointed at pages that have been folded into others (Where we are, the register). They now go through
    go(), which already takes Where we are to Today and the register to Equipment, like every other link on the page.
  - Map explorer: a reload, bookmark or shared link (#sheet/__explorer) opened the old master-plan page and stayed on it,
    because the address was read before the page had its connection to the service, when the explorer is not yet
    available. The map now waits for the connection before choosing, and opens the explorer once it is there.


  - Today, Money (Andrew, 2 Oct 2026, shown the mock-up: "Approved"): the "Are we making money?" card leaves Today's
    screen - its revenue, direct costs and difference are on Costs & charges. What it held that is on no other tab moves
    into the Revenue by stream card: each stream's direct costs and difference (in its More info), and the line that
    says the forecast is incomplete, with a link to Costs. Paper prints as before.

    python3 patch_v805.py <page.html>     (on live v8.03; v7.99 before or after makes no difference)"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v8.05 - links' in t: sys.exit('v8.05 already applied')

# 1. The Coates Way: every link goes through go()
t = rep(t, "const go2 = () => { state.tab = b.dataset.cwgo; render(); };",
        "const go2 = () => go(b.dataset.cwgo); /* v8.05 - links that go where they say */", 'Coates Way pillars go', p)
n = len(re.findall(r"go: \(\) => \{ state\.tab = '\w+'; render\(\); \}", t))
if n != 5: sys.exit(f'Coates Way red rows: expected 5 links, found {n}')
t = re.sub(r"go: \(\) => \{ state\.tab = '(\w+)'; render\(\); \}", r"go: () => go('\1') /* v8.05 */", t)

# 2. Map explorer: a link to the explorer is remembered until the connection is up, then the explorer opens
t = rep(t, "(m[1] === SAT_EXPLORER && expOn())) { state.sheet = m[1]; state.sel = null; } go('map'); }",
        "(m[1] === SAT_EXPLORER && expOn())) { state.sheet = m[1]; state.sel = null; } else if (m[1] === SAT_EXPLORER) state.wantExp805 = true; /* v8.05 - links that go where they say: asked for before the connection is up */ go('map'); }",
        'explorer link remembered', p)
t = rep(t, "function renderMap_held(){\n",
        "function renderMap_held(){\n if (state.wantExp805 && expOn()) { state.wantExp805 = false; state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; state.found = null; } /* v8.05 - the explorer a link asked for, once it can open */\n",
        'explorer opens once it can', p)

# 2b. a link to a named drawing opens that drawing (the first visit no longer replaces it with the master plan)
t = rep(t, "if (!state.mapMasterSeen) { state.mapMasterSeen = true; if (!state.found) state.sheet = 'MASTER'; }",
        "if (!state.mapMasterSeen) { state.mapMasterSeen = true; if (!state.found && !(/^#sheet\\//.test(location.hash) && DATA.sheets.some(x => x.key === state.sheet))) state.sheet = 'MASTER'; } /* v8.05 - a link to a drawing opens that drawing */",
        'a link to a drawing opens it', p)

# 3. Today, Money: the three totals once (on Costs); what only this card held moves into the stream card, screen only
A = """the Pricing tab's estimate from the schedule, not the bill.</p>`)}
 </div>
 <div class="mcard ledgerc" data-go="costs\""""
B = """the Pricing tab's estimate from the schedule, not the bill.</p>`)}
 <div class="m805"><p class="mline"><b>Forecast incomplete</b> — not a margin: ${M.missing_short.length} thing${M.missing_short.length === 1 ? '' : 's'} not in it yet (${esc(M.missing_short.join(' · '))}). Direct costs and the difference for the whole job are on <button type="button" class="linkish" data-go805="costs">Costs &amp; charges →</button></p>
 ${moreInfo('money|streams805', `<div class="mtot streams">${M.streams.map(s => `<span>${esc(s.name)}</span><b>${s.charge_known ? esc(money0(s.charge0)) : '—'} · ${s.cost_known ? esc(money0(s.cost0)) : '—'} · <i class="${s.cost_known && s.difference0 < 0 ? 'neg' : ''}">${s.cost_known ? esc(sd(s.difference0)) : 'before direct costs'}</i></b>`).join('')}</div>
 <p class="mnote">Each stream: revenue · direct costs · the difference. <b>Not in it yet:</b> ${esc(M.missing.join('; '))}.${M.caveats.length ? ` <b>Provisional:</b> ${esc(M.caveats.join('; '))}.` : ''}</p>`)}</div>
 </div>
 <div class="mcard ledgerc" data-go="costs\""""
t = rep(t, A, B, 'stream card carries what only the money card held', p)
t = rep(t, "pane.querySelectorAll('.grp[data-go],.mcard[data-go]').forEach(g => plateNav(g, () => go(g.dataset.go)));",
        "pane.querySelectorAll('.grp[data-go],.mcard[data-go]').forEach(g => plateNav(g, () => go(g.dataset.go))); pane.querySelectorAll('[data-go805]').forEach(b => { b.onclick = e => { e.stopPropagation(); go(b.dataset.go805); }; }); /* v8.05 */",
        'Costs link in the stream card', p)
CSS = """/* v8.05 - Today, Money: the totals once, on Costs; the stream card carries the rest (screen only, paper as before) */
 .dsn .m805{display:none}
 @media screen{
  #pane-today.m793 .money-grid > .mcard.ledgerc{display:none!important}
  #pane-today.m793 .money-grid{grid-template-columns:minmax(0,1fr)!important}
  #pane-today.m793 .dsn .m805{display:block}
 }"""
A2 = "/* v7.93 - Today and Where we are on one tab: the repeats are left off on the screen (paper prints as before) */"
t = rep(t, A2, CSS + "\n" + A2, 'v8.05 css', p)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v8.05 applied: Coates Way links go; a link to Map explorer opens the explorer; Today Money totals once')
