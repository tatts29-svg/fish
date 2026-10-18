#!/usr/bin/env python3
"""v5.99 - THE TIDY AFTER THE SWEEP (25 Sep 2026). The automated sweep of every page on the view and edit links,
laptop and phone, found no script errors and no failed requests; it found copy that still named pages that are set
aside, a Plant table grown too wide for a laptop, the closure table pushing the phone sideways, and editors with no
way to Edit (put back, add an asset) once the page left the bar. Now: Plant's register facts sit in seven columns
(dates together, contract under the asset number, the drawing chip on the ID); Edit is reachable under Tools on an
editing link only; the copy names Plant and Tools; the closure table fits a phone.  python3 patch_v599.py <builder|page>"""
import sys, re as _r
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    if s.count(old) == count: s = s.replace(old, new); print('ok', label); return
    lines = old.split('\n'); pat = '\n'.join(r'[ \t]*' + _r.escape(l.lstrip()) for l in lines)
    ms = list(_r.finditer(pat, s)); assert len(ms) == count, (label, s.count(old), len(ms))
    for m in reversed(ms):
        indent = _r.match(r'[ \t]*', s[m.start():]).group(0); base = _r.match(r'[ \t]*', lines[0]).group(0)
        fixed = '\n'.join((indent + l[len(base):]) if l.startswith(base) else l for l in new.split('\n'))
        s = s[:m.start()] + fixed + s[m.end():]
    print('ok', label, '(indent-matched)')
# Edit under Tools for editors
rep("""  if (TABS_OFF.has(tab)) { const l = (TABS.find(([k]) => k === tab) || [])[1] || tab;""",
    """  if (TABS_OFF.has(tab) && !(tab === 'edit' && typeof canEdit === 'function' && canEdit())) { const l = (TABS.find(([k]) => k === tab) || [])[1] || tab;   /* v5.99 - Edit stays open to an editing link, under Tools */""", 'edit allowed for editors')
rep("""  const hidden = TABS.filter(([k]) => inMore(k) && !TABS_OFF.has(k));""",
    """  const editOk = k => k === 'edit' && typeof canEdit === 'function' && canEdit();   /* v5.99 */
  const hidden = TABS.filter(([k]) => inMore(k) && (!TABS_OFF.has(k) || editOk(k)));""", 'edit in the hidden set')
rep("""  if (mv) mv.innerHTML = TABS.filter(([k]) => !TABS_OFF.has(k)).map(([k, l]) =>""",
    """  if (mv) mv.innerHTML = TABS.filter(([k]) => !TABS_OFF.has(k) || editOk(k)).map(([k, l]) =>""", 'edit listed in Tools for editors')
# copy that named pages that are gone
rep("""      <div class="hubgo">Open the registers →</div>""", """      <div class="hubgo">Open Plant →</div>""", 'today hub label')
rep("""can be put back from the Edit tab.')) return;""", """can be put back from Tools → Edit.')) return;""", 'put back words', 3)
rep("""Put back is on the Edit tab.');""", """Put back is under Tools → Edit.');""", 'put back flash', 3)
rep("""Anything else is added on the Add tab.'); return false; }""", """Anything else is added under Tools → Edit, Add an asset.'); return false; }""", 'add words')
rep("""      <button type="button" class="mkpick-i" data-addhere><b>Add an asset the schedule does not carry</b><span class="w">opens the Add tab with this place filled in</span></button>`""",
    """      <button type="button" class="mkpick-i" data-addhere><b>Add an asset the schedule does not carry</b><span class="w">opens Edit, under Tools, with this place filled in</span></button>`""", 'add-here words')
rep("""  if (add) add.onclick = () => { close(); state.addPrefill = {loc: where, sheet: sh.sheet_id, callout: label}; go('add'); };""",
    """  if (add) add.onclick = () => { close(); state.addPrefill = {loc: where, sheet: sh.sheet_id, callout: label}; go('edit'); };   /* v5.99 - the Add page is set aside; Edit carries Add an asset */""", 'add-here goes to edit')
rep("""      Raise it on the <button class="linkish" data-go="variances">Variances tab</button> and get a name and a""",
    """      Raise it as a variance and get a name and a""", 'variances words')
rep("""register lists at once from the Register tab.""", """register lists at once from the Plant page.""", 'register words 1')
rep("""Off-hire dates and contract numbers stay on the Register tab.</p>""", """Off-hire dates and contract numbers are on the Plant page.</p>""", 'register words 2')
rep("""flash('Nothing is listed to put a branch on — open the Register or the Plant pages first.'); return; }""", """flash('Nothing is listed to put a branch on — open the Plant page first.'); return; }""", 'register words 3')
rep("""<p class="signote">Press one to list it on the Register. The lamps are decoration; the figures are the record.</p>""", """<p class="signote">Press one to list it on Plant. The lamps are decoration; the figures are the record.</p>""", 'register words 4')
s2 = s.replace("still on the Register, on the drawings and in the history", "still on Plant, on the drawings and in the history"); print('ok register words 5', s2 != s); s = s2
n = len(_r.findall(r"open the Register to", s)); s = s.replace("open the Register to", "open Plant to"); print('ok register words 6', n)
# Plant: seven columns again
rep("""      <thead><tr><th>GC500 ID</th><th>Light</th><th>Scheduled</th><th>Due</th><th>Off-hire</th><th>Asset no.</th><th>Contract</th><th>Description asked for</th>
        <th>Description supplied</th><th>State</th><th>Drawing</th>${isBuilding ? '<th>What comes with it</th>' : ''}</tr></thead>""",
    """      <thead><tr><th>GC500 ID</th><th>Light</th><th>Dates</th><th>Asset no. · contract</th><th>Description asked for</th>
        <th>Description supplied</th><th>State</th>${isBuilding ? '<th>What comes with it</th>' : ''}</tr></thead>""", 'plant header')
rep("""          <td style="white-space:nowrap">${(() => { const e = effectiveDates(a);
            return (e.in ? esc(e.in) : '—') + (e.in_moved ? ` <span class="chip act" title="the plan said ${esc(e.in_plan || 'nothing')}">moved</span>` : '')
              + (e.out && e.out !== e.in ? ' → ' + esc(e.out) + (e.out_moved ? ` <span class="chip act" title="the plan said ${esc(e.out_plan || 'nothing')}">moved</span>` : '') : ''); })()}</td>
          <td class="t" style="white-space:nowrap">${a.first_date ? esc(fmtDay(a.first_date).dm) : '<span class="todo">—</span>'}${
            d.eta ? ' <b>' + esc(d.eta) + '</b>' : ''}</td>
          <td>${offhireChip(a)}</td>""",
    """          <td class="t" style="white-space:nowrap"><div>due ${a.first_date ? esc(fmtDay(a.first_date).dm) : '<span class="todo">—</span>'}${
            d.eta ? ' <b>' + esc(d.eta) + '</b>' : ''}</div><div class="w" style="font-size:11px;color:var(--mute)">${(() => { const e = effectiveDates(a);
            return 'scheduled ' + (e.in ? esc(e.in) : '—') + (e.in_moved ? ` <span class="chip act" title="the plan said ${esc(e.in_plan || 'nothing')}">moved</span>` : '')
              + (e.out && e.out !== e.in ? ' → ' + esc(e.out) + (e.out_moved ? ` <span class="chip act" title="the plan said ${esc(e.out_plan || 'nothing')}">moved</span>` : '') : ''); })()}</div><div style="margin-top:3px">${offhireChip(a)}</div></td>""", 'plant dates cell')
rep("""             : '<span class="todo" title="the schedule does not carry an asset number for this reference">—</span>'}</td>
          <td>${(() => { const c = contractOf(a.key), acc = a.accessories || [];
            return (c.id ? contractShort(c.c, c.id) : '<span class="todo" title="no Rental ID recorded">—</span>') + ' ' + branchChip(a.key)
              + (acc.length ? `<div class="w" style="font-size:11px;color:var(--mute)">${acc.reduce((s, x) => s + (x.qty || 1), 0)} inside it</div>` : ''); })()}</td>""",
    """             : '<span class="todo" title="the schedule does not carry an asset number for this reference">—</span>'}<div style="margin-top:3px">${(() => { const c = contractOf(a.key), acc = a.accessories || [];
            return (c.id ? contractShort(c.c, c.id) : '<span class="todo" title="no Rental ID recorded">—</span>') + ' ' + branchChip(a.key)
              + (acc.length ? `<div class="w" style="font-size:11px;color:var(--mute)">${acc.reduce((s, x) => s + (x.qty || 1), 0)} inside it</div>` : ''); })()}</div></td>""", 'plant asset and contract cell')
rep("""          <td>${asked}</td><td>${sup}</td><td>${st}</td>
          <td>${(a.drawing_links || []).length ? `<span class="chip ${a.linked_to_2026_sheet === false ? 'crit' : 'cand'}">${esc(a.drawing_links[0].label)} ${a.linked_to_2026_sheet === false ? '2025 sheet only' : 'candidate'}</span>` : '<span class="chip">no link</span>'}</td>""",
    """          <td>${asked}</td><td>${sup}</td><td>${st}</td>""", 'plant drawing column out')
rep("""            a._added ? ' <span class="chip act">added</span>' : ''}${a.origin === 'drawing' ? ` <span class="chip cand" title="${esc(a.schedule_state || 'drawn on the sheet; no schedule row names it')}">drawing only</span>` : ''}""",
    """            a._added ? ' <span class="chip act">added</span>' : ''}${a.origin === 'drawing' ? ` <span class="chip cand" title="${esc(a.schedule_state || 'drawn on the sheet; no schedule row names it')}">drawing only</span>` : ''}${
            (a.drawing_links || []).length ? `<br><span class="chip ${a.linked_to_2026_sheet === false ? 'crit' : 'cand'}" title="drawing link">${esc(a.drawing_links[0].label)}${a.linked_to_2026_sheet === false ? ' · 2025 sheet only' : ''}</span>` : ''}""", 'drawing chip on the id')
# the closure table fits a phone
rep(""".clotbl td{vertical-align:middle}""", """.clotbl td{vertical-align:middle}
@media(max-width:640px){.clotbl{width:100%;table-layout:fixed}.clotbl th,.clotbl td{white-space:normal;word-break:break-word}}""", 'closure table on a phone')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.99', n0, '->', len(s))
