#!/usr/bin/env python3
r"""v7.96 - Plant and Inventory as one Equipment tab. Author: Andrew Fisher.

Andrew, 2 Oct 2026: "merge plant and inventory together. They are basically the same thing. Keeping th same look as
inventory i think. We need to start to tidy up things now to ensure we dont double up on information. Layout needs to be
perfection now." Shown the mock-up on the real page: "Lets do it".

  - The Plant tab is called Equipment (its address stays #plant, so every link and bookmark still opens it).
  - Top: one Equipment heading with one row of trade buttons, the List/Cards switch and Share PDF.
  - Then the Inventory, in its own look, for the trade chosen: on site now by type, press a number for its locations,
    still to come with maps and codes, spares. Its own trade buttons are the heading's now.
  - Then Every reference: Plant's colour code, its lights filter and its reference rows, folded to one line that says
    how many references and how many asked-for lines are recorded. Open, it is Plant exactly as it was.
  - Then Rental contracts, and Branches folded to one line.
  - Repeats left off: the counts on the trade buttons (the Ordered column carries them), the "Plant - what was asked
    for" heading, and, when one trade is shown, that trade's own heading and progress line (the fold's line says them).
  - The Inventory leaves Change deliveries; its button there opens Equipment.
  - Equipment opens on the first trade the first time it is opened in a session, so its light counts are that trade's
    and not a second copy of Today's lights - unless a light, a search or a trade was asked for on the way in.

    python3 patch_v796.py <page.html>     (after v7.91, v7.93 and v7.95, on the live page)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function eq796(' in t: sys.exit('v7.96 already applied')
if 'function pack795(' not in t: sys.exit('v7.96 needs v7.95 applied first (patch_v795.py)')

# 1. the name, wherever the page names the tab
t = rep(t, "['plant','Plant']", "['plant','Equipment']", 'tab name', p)
t = rep(t, "title=\"Open ${go === 'plant' ? 'Plant' : 'the Timeline'}\"", "title=\"Open ${go === 'plant' ? 'Equipment' : 'the Timeline'}\"", 'pod title', p)
for old, new, what in [
        ("Open Plant →", "Open Equipment →", 'set-aside card link'),
        ("Nothing is listed to put a branch on — open the Plant page first.", "Nothing is listed to put a branch on — open the Equipment page first.", 'branch words'),
        ("still on Plant, on the drawings and in the history", "still on Equipment, on the drawings and in the history", 'cancelled words'),
        ("s — open Plant to put the code on them.</p>", "s — open Equipment to put the code on them.</p>", 'branch code words'),
        (">Press one to list it on Plant. The lamps are decoration", ">Press one to list it on Equipment. The lamps are decoration", 'lamps words'),
        ("Off-hire dates and contract numbers are on the Plant page.", "Off-hire dates and contract numbers are on the Equipment page.", 'off-hire words'),
        ("<div class=\"l\">Plant on the job</div>", "<div class=\"l\">Equipment on the job</div>", 'kpi words'),
        ("${fig('Plant on the job',", "${fig('Equipment on the job',", 'pod words'),
        ("' on Plant'", "' on Equipment'", 'on Plant'),
        ("A spare can go onto a location from here (Use), or through Swap on a location's form above.",
         "A spare can go onto a location from here (Use), or through Swap on a location's form on Change deliveries.", 'spare words')]:
    t = rep(t, old, new, what, p, False)

# 2. Equipment is drawn from Plant's own draw, then laid out; the first visit opens on the first trade
t = rep(t, " const groups = plantGroups();\n const only = state.plantGroup",
        " const groups = plantGroups();\n eq796First(groups); /* v7.96 */\n const only = state.plantGroup", 'first trade', p)
t = rep(t, " plantPump();\n}\nfunction plantTable(group, list){", " eq796(); /* v7.96 - Plant and Inventory as one Equipment tab */\n plantPump();\n}\nfunction plantTable(group, list){", 'equipment layout', p)

# 3. the Inventory leaves Change deliveries; its button there opens Equipment
t = rep(t, "</div>${walkHtml(ro)}${invHtml(ro)}${subRegHtml(ro)}`;", "</div>${walkHtml(ro)}${subRegHtml(ro)}`; /* v7.96 - the Inventory is on Equipment */", 'inventory off change', p)
t = rep(t, " chBind(pane); chSwapBind(pane); invBind(pane);",
        " chBind(pane); chSwapBind(pane); invBind(pane); pane.querySelectorAll('[data-invjump]').forEach(b => { b.title = 'The Inventory is on the Equipment tab'; b.onclick = () => go('plant'); }); /* v7.96 */",
        'inventory button opens equipment', p)

# An explicit reference/filter link reveals its existing results fold. Routine visits keep the chosen fold state.
t = rep(t, "state.light = b.dataset.lfGo || null; state.disc = null; go('register');", "state.light = b.dataset.lfGo || null; state.disc = null; state.plantGroup = null; go('register');", 'Today light shortcuts cover every trade', p)
t = rep(t, "function go793(tab){\n", "function go793(tab){\n if (typeof eq796s === 'function' && (tab === 'register' || tab === 'plant' && (state.light || String(state.q || '').trim()))) eq796s().reveal = true; /* v7.96 - requested reference results must be visible */\n", 'reveal requested Equipment results', p)
t = rep(t, " state.plantGroup = (a && (a.product || a.discipline)) || null;\n go('plant');", " state.plantGroup = a ? (PLANT_GROUP_WORDS[a.product] || a.product || a.discipline) : null;\n eq796s().reveal = true; /* v7.96 - a reference link opens its rows */\n go('plant');", 'reference link reveals its rows', p)

JS = r"""/* v7.96 - Plant and Inventory as one Equipment tab (Andrew, 2 Oct 2026: "merge plant and inventory together ... Keeping
   th same look as inventory ... ensure we dont double up on information"). Plant draws as it always has; this lays it
   out: one heading with the trade buttons, the Inventory for the trade chosen, Plant's reference rows in one fold,
   then the contracts and the branches. Nothing is redrawn; repeats are left off. */
function eq796s(){ return eq796s.s || (eq796s.s = {seen: false, open: new Set()}); }
/* the first time Equipment is opened it shows the first trade, so its light counts are that trade's, not a second copy
   of Today's lights - unless a light, a search or a trade was asked for on the way in */
function eq796First(groups){
 const S = eq796s(); if (S.seen) return; S.seen = true;
 if (!state.plantGroup && !state.light && !String(state.q || '').trim() && groups.length) state.plantGroup = groups[0][0];
}
/* the Inventory's trade for a Plant trade: the one its references are counted under */
function eq796Disc(){
 const g = state.plantGroup; if (!g) return '*';
 const list = (plantGroups().find(([n]) => n === g) || [])[1] || []; const n = {};
 list.forEach(a => { const d = invTypeDisc(invTypeOf(a) || ''); if (d) n[d] = (n[d] || 0) + 1; });
 return Object.entries(n).sort((x, y) => y[1] - x[1]).map(x => x[0])[0] || '*';
}
/* A new filter or an explicit reference shortcut opens the result rows and brings them into view.
   Remember the filter separately so a record redraw respects a fold the person then closes. */
function eq796Results(refs){
 const S = eq796s(), query = String(state.q || '').trim(), filter = JSON.stringify([state.light || '', query]);
 const reveal = S.reveal || !!(state.light || query) && filter !== S.lastFilter;
 S.reveal = false; S.lastFilter = filter;
 if (!reveal) return;
 S.open.add('Every reference'); refs.open = true;
 requestAnimationFrame(() => { if (state.tab !== 'plant' || !refs.isConnected) return;
  const m = $('main'); if (m) m.scrollTop += refs.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; });
}
function eq796Fold(name, words, parts){
 const S = eq796s(), d = document.createElement('details'); d.className = 'fold96'; d.dataset.fold = name; d.open = S.open.has(name);
 const s = document.createElement('summary'); s.innerHTML = `<b>${esc(name)}</b><span>${esc(words)}</span><i>Open</i>`; d.appendChild(s);
 parts.forEach(x => x && d.appendChild(x));
 d.addEventListener('toggle', () => { if (d.dataset.print) return; if (d.open) S.open.add(name); else S.open.delete(name); });
 return d;
}
function eq796(){
 const pane = document.getElementById('pane-plant'); if (!pane) return;
 const cards = [...pane.querySelectorAll(':scope > .card')], top = cards.find(c => c.querySelector('.filters')); if (!top) return;
 const tables = cards.filter(c => c !== top), regsum = pane.querySelector(':scope > .regsum'), vms = pane.querySelector(':scope > [data-vms-requirement747], :scope > details.pfold'); /* the VMS note (folded after the draw) */
 const one = !!state.plantGroup, ro = typeof capability === 'function' ? capability() !== 'edit' : true;
 /* the heading: one title, one row of trade buttons (names only - the Ordered column carries the counts), the view switch, Share PDF */
 const chips = top.querySelector('.filters'), view = top.querySelector('.regviewsw');
 chips.querySelectorAll('[data-pg]').forEach(b => { b.textContent = b.textContent.replace(/\s+[\d,]+\s*$/, ''); });
 const head = document.createElement('div'); head.className = 'card eqhead nosfold';
 head.innerHTML = '<div class="eqtitle"><h3>Equipment</h3><span class="sub">what was ordered, what is on site, and where it goes</span><div class="eqtools"></div></div>';
 const tools = head.querySelector('.eqtools'); if (view) tools.appendChild(view);
 head.appendChild(chips);
 /* the Inventory, in its own look, for the trade chosen above */
 const disc = eq796Disc(); if (INV.disc !== disc) { INV.disc = disc; INV.drill = null; }
 const box = document.createElement('div'); box.innerHTML = invHtml(ro); const inv = box.firstElementChild;
 const ih = inv.querySelector('.invhead h3'); if (ih) ih.textContent = 'On site now';
 const ic = inv.querySelector('.invchips'); if (ic) ic.remove();
 const pdf = inv.querySelector('[data-inv83]'); if (pdf) tools.appendChild(pdf);
 /* every reference: Plant's colour code, lights filter and rows, folded to one line */
 const n = (state.list || []).length, prog = one && tables[0] ? ((tables[0].querySelector('.prog span') || {}).textContent || '') : '';
 const words = `${n} reference${n === 1 ? '' : 's'}${one ? '' : ' across ' + tables.length + ' trades'}${prog ? ' · ' + prog : ''} · lights, dates, asset numbers, contracts, asked and supplied`;
 const keep = [...top.children].filter(c => c !== chips && !c.classList.contains('hubtitle') && !(c.tagName === 'P' && c.classList.contains('sub')));
 if (one) tables.forEach(tb => { const h = tb.querySelector(':scope > h3'), pr = tb.querySelector(':scope > .prog'); if (h) h.remove(); if (pr) pr.remove(); });
 const refs = eq796Fold('Every reference', words, keep.concat(tables)); refs.classList.add('eqrefs');
 /* the order: heading, the VMS note, the Inventory, every reference, then contracts and branches */
 (vms || top).before(head); top.before(inv); inv.after(refs); top.remove();
 eq796Results(refs); /* a requested light, search or reference is never hidden in a closed fold */
 if (regsum) { const br = regsum.children[1]; if (br) { const f = eq796Fold('Branches', 'which branch each asset carries, and where the branch code is set', []); br.before(f); f.appendChild(br); } }
 invBind(pane);
 /* invHtml already schedules inv87Hydrate once; do not create a second observer for the same QR codes. */
 if (!eq796.print) { eq796.print = true; /* paper cannot be pressed open: the folds open for the print and close after */
  window.addEventListener('beforeprint', () => { eq796.shut = [...document.querySelectorAll('#pane-plant details.fold96:not([open])')]; eq796.shut.forEach(d => { d.dataset.print = '1'; d.open = true; }); });
  window.addEventListener('afterprint', () => { (eq796.shut || []).forEach(d => { d.open = false; delete d.dataset.print; }); eq796.shut = []; }); }
}
"""
t = rep(t, "function liveMapKey(){", JS + "function liveMapKey(){", 'v7.96 code', p)

CSS = """/* v7.96 - Plant and Inventory as one Equipment tab */
 @media screen{
  #pane-plant .eqhead{display:flex;flex-direction:column;gap:12px}
  #pane-plant .eqtitle{display:flex;align-items:baseline;gap:8px 14px;flex-wrap:wrap}
  #pane-plant .eqtitle h3{margin:0;font-size:24px;font-weight:800}
  #pane-plant .eqtitle .sub{color:var(--mute);flex:1;min-width:200px}
  #pane-plant .eqtools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  #pane-plant .eqhead .filters{margin:0}
  #pane-plant details.fold96{background:var(--paper,#fff);border:1px solid var(--rule,#e4e0dc);border-radius:14px;margin:0 0 14px;padding:0 14px}
  #pane-plant details.fold96 > summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:14px;padding:14px 4px;min-height:24px}
  #pane-plant details.fold96 > summary::-webkit-details-marker{display:none}
  #pane-plant details.fold96 > summary b{font-size:17px;font-weight:800;color:var(--ink,#14181d);white-space:nowrap}
  #pane-plant details.fold96 > summary span{color:var(--mute,#4b535b);font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pane-plant details.fold96 > summary i{font-style:normal;font-weight:800;font-size:12px;letter-spacing:.08em;color:#b34a0d;text-transform:uppercase}
  #pane-plant details.fold96 > summary i::after{content:" \\25BE"}
  #pane-plant details.fold96[open] > summary i{visibility:hidden}
  #pane-plant details.fold96[open] > summary{border-bottom:1px solid var(--rule,#e4e0dc);margin-bottom:10px}
  #pane-plant .eqrefs > .card{box-shadow:none;border:0;padding-left:0;padding-right:0;margin-left:0;margin-right:0}
  #pane-plant .regsum details.fold96 > .card{box-shadow:none;border:0;padding-left:0;padding-right:0;margin:0}
 }
 @media print{ #pane-plant details.fold96 > summary{display:none!important} }"""
A = "/* v7.95 - Today packed, with jump buttons and folding sections (\"We have a lot of dead space"
t = rep(t, A, CSS + "\n" + A, 'v7.96 css', p)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.96 applied: Plant and Inventory as one Equipment tab')
