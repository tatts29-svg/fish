#!/usr/bin/env python3
"""v5.95 - THE REGISTER, MERGED INTO PLANT (Andrew Fisher, 25 Sep 2026: "merge into plant — add what Plant does not
have but the Register did"). v5.91 stacked the Register's pane under the plant lines; that was two pages on one
tab, not a merge. Now every Plant row carries what the Register row carried and Plant did not: the name and item
types, the added / drawing-only marks, the scheduled dates (with the moved marks), the off-hire chip, the Rental
ID with its branch and what is inside it, and the drawing link. The Register's card view (photographs) is a
toggle on Plant, and its contracts and branch summaries close the page. The stacked pane is gone.
python3 patch_v595.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)

rep("""  else if (state.tab === 'plant') { renderPlant(); setTimeout(() => { if (state.tab === 'plant' && !$('#pane-plant #pane-register')) plantCarriesRegister(); }, 40); }   /* v5.93 - plant lines paint first, the register a moment later */""",
    """  else if (state.tab === 'plant') renderPlant();   /* v5.95 - the register's facts are on the plant rows themselves */""", 'no stacked register')
rep("""      <thead><tr><th>GC500 ID</th><th>Light</th><th>Due</th><th>Asset no.</th><th>Description asked for</th>
        <th>Description supplied</th><th>State</th>${isBuilding ? '<th>What comes with it</th>' : ''}</tr></thead>""",
    """      <thead><tr><th>GC500 ID</th><th>Light</th><th>Scheduled</th><th>Due</th><th>Off-hire</th><th>Asset no.</th><th>Contract</th><th>Description asked for</th>
        <th>Description supplied</th><th>State</th><th>Drawing</th>${isBuilding ? '<th>What comes with it</th>' : ''}</tr></thead>""", 'plant header')
rep("""              + `<br><span class="w" style="font-size:11px;color:var(--mute)">${esc(a.name || '')}</span>` : ''}""",
    """              + `<br><span class="w" style="font-size:11px;color:var(--mute)">${esc(a.name || '')}</span>`
              : `<br><span class="w" style="font-size:11px;color:var(--mute)">${esc(a.name || '')}${(a.item_types || []).length ? ' · ' + esc(a.item_types.join(', ')) : ''}</span>`}${
            a._added ? ' <span class="chip act">added</span>' : ''}${a.origin === 'drawing' ? ` <span class="chip cand" title="${esc(a.schedule_state || 'drawn on the sheet; no schedule row names it')}">drawing only</span>` : ''}""", 'identity and marks on the row')
rep("""          <td class="t" style="white-space:nowrap">${a.first_date ? esc(fmtDay(a.first_date).dm) : '<span class="todo">—</span>'}${
            d.eta ? ' <b>' + esc(d.eta) + '</b>' : ''}</td>""",
    """          <td style="white-space:nowrap">${(() => { const e = effectiveDates(a);
            return (e.in ? esc(e.in) : '—') + (e.in_moved ? ` <span class="chip act" title="the plan said ${esc(e.in_plan || 'nothing')}">moved</span>` : '')
              + (e.out && e.out !== e.in ? ' → ' + esc(e.out) + (e.out_moved ? ` <span class="chip act" title="the plan said ${esc(e.out_plan || 'nothing')}">moved</span>` : '') : ''); })()}</td>
          <td class="t" style="white-space:nowrap">${a.first_date ? esc(fmtDay(a.first_date).dm) : '<span class="todo">—</span>'}${
            d.eta ? ' <b>' + esc(d.eta) + '</b>' : ''}</td>
          <td>${offhireChip(a)}</td>""", 'scheduled and off-hire cells')
rep("""             : '<span class="todo" title="the schedule does not carry an asset number for this reference">—</span>'}</td>
          <td>${asked}</td><td>${sup}</td><td>${st}</td>""",
    """             : '<span class="todo" title="the schedule does not carry an asset number for this reference">—</span>'}</td>
          <td>${(() => { const c = contractOf(a.key), acc = a.accessories || [];
            return (c.id ? contractShort(c.c, c.id) : '<span class="todo" title="no Rental ID recorded">—</span>') + ' ' + branchChip(a.key)
              + (acc.length ? `<div class="w" style="font-size:11px;color:var(--mute)">${acc.reduce((s, x) => s + (x.qty || 1), 0)} inside it</div>` : ''); })()}</td>
          <td>${asked}</td><td>${sup}</td><td>${st}</td>
          <td>${(a.drawing_links || []).length ? `<span class="chip ${a.linked_to_2026_sheet === false ? 'crit' : 'cand'}">${esc(a.drawing_links[0].label)} ${a.linked_to_2026_sheet === false ? '2025 sheet only' : 'candidate'}</span>` : '<span class="chip">no link</span>'}</td>""", 'contract and drawing cells')
rep("""    <div class="tblwrap"><table>
      <thead><tr><th>GC500 ID</th><th>Light</th><th>Scheduled</th>""",
    """    ${state.plantView === 'cards' ? `<div class="eqgrid">${list.map(a => equipmentCard(a, {on: state.sel === a.key})).join('')}</div>` : `<div class="tblwrap"><table>
      <thead><tr><th>GC500 ID</th><th>Light</th><th>Scheduled</th>""", 'cards view open')
rep("""          ${isBuilding ? '<td>' + contentsCell(a) + '</td>' : ''}</tr>`;
      }).join('')}</tbody></table></div>""",
    """          ${isBuilding ? '<td>' + contentsCell(a) + '</td>' : ''}</tr>`;
      }).join('')}</tbody></table></div>`}""", 'cards view close')
rep("""     <h3>Plant — what was asked for, and what we supplied</h3>
     <p class="sub">One page per plant type. The asked-for column is the schedule and never changes. The
       supplied column is what people record on site. Open any reference on the Map or Register tab to fill
       it in.</p>""",
    """     <div class="hubtitle"><h3>Plant — what was asked for, and what we supplied</h3>
       <div class="regviewsw" role="group" aria-label="View"><button type="button" class="btn sm" data-plantview="list" aria-pressed="${state.plantView !== 'cards'}">List</button><button type="button" class="btn sm" data-plantview="cards" aria-pressed="${state.plantView === 'cards'}">Cards</button></div></div>
     <p class="sub">One page per plant type, every reference with its register facts: name and type, scheduled dates,
       due, off-hire, asset numbers, Rental ID and branch, what was asked for and what turned up, and its drawing
       link. Open any reference here or on the Map to fill it in.</p>""", 'view toggle and words')
rep("""   ${shown.map(([g, list]) => plantTable(g, list.filter(a => (!q || matches(a, q)) && lightMatches(a)))).join('')}`;
  $('#pane-plant').querySelectorAll('[data-pg]').forEach(b => b.onclick = () => {""",
    """   ${shown.map(([g, list]) => plantTable(g, list.filter(a => (!q || matches(a, q)) && lightMatches(a)))).join('')}
   <div class="regsum">${contractsCard(state.list)}${branchCard(state.list)}</div>`;
  /* v5.95 - the register's own views, on this page */
  $('#pane-plant').querySelectorAll('[data-plantview]').forEach(b => b.onclick = () => { state.plantView = b.dataset.plantview; renderPlant(); });
  $('#pane-plant').querySelectorAll('[data-eq]').forEach(b => b.onclick = () => openAsset(b.dataset.eq));
  $('#pane-plant').querySelectorAll('[data-k]').forEach(r => r.onclick = ev => { ev.stopPropagation(); openAsset(r.dataset.k); });
  $('#pane-plant').querySelectorAll('[data-pg]').forEach(b => b.onclick = () => {""", 'summaries and wiring')
rep("""#pane-register.inplant{margin-top:18px}""", """.regsum{margin-top:14px}.regviewsw{display:flex;gap:4px}.regviewsw .btn[aria-pressed="true"]{background:var(--orange);color:#1b1207;border-color:var(--orange)}
#pane-register.inplant{margin-top:18px}""", 'css')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.95', n0, '->', len(s))
