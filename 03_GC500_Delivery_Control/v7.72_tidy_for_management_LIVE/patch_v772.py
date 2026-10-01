#!/usr/bin/env python3
r"""v7.72 - Tidy for management. Andrew, 1 Oct 2026, 16:51 AEST: "I have management looking at GC500 tonight. Please make
sure the costs are all up to date with as much data as possible. No bugs, it's clean and tidy and easy to understand."
Apply after v7.70 (on the live page: v7.70 then v7.72; Codex's v7.71 is the fencing forecast lookup, separate).

  From the management read of every tab (desktop and phone text, every fold open), the findings verified against the
  page source. Wording and display only; no figure, rule or record changes.
    1. No agent's name on the page: a recorder stamped "<name> via Codex" (or "via Claude") on the record shows as the
       person's name alone on recorder displays (Today's delivery updates, Progress's RECORDED BY column, the
       folds). The record itself is untouched - this is how the page shows it.
    2. Progress - "All branches together": the sentence under the branch bars added the scope and the labour ticked to
       the branches and called it the whole revenue; the toilets' servicing and water charged on at our rates was left
       unnamed. It is named now, so the parts add to the total.
    3. The working - the transport fold said "No transport cost of ours recorded yet" under a heading "our direct
       costs" while the Forecast P&L counts the carriers' figures from the schedule. The fold now says what it is:
       the lines typed here, and that the schedule's figures are counted above.
    4. Revenue to job end (Costs to job end tile, At a glance tile): says that labour per piece still to tick is
       charged as the work is done and is not carried forward - the Labour forecast fold gives it.
    5. Exact-once wording replacements from the verified punch list (evidence/punch_list.md), each checked to occur
       once in the build before it is applied; one that does not is skipped and printed.
    python3 patch_v772.py <page.html>"""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.72 - no agent name' in t: sys.exit('v7.72 already applied')
if 'pl770Model' not in t: sys.exit('needs v7.70 first')

# 1. Recorder names are display-only: keep the shared HTML escaper lossless.
helper = r"""/* v7.72 - no agent name on recorder displays; notes, forms and the stored record remain unchanged */
function recorderDisplay772(value){
 return esc(String(value == null ? '' : value).replace(/ via (?:Codex|Claude)(?: \([^)]*\))?$/, ''));
}
"""
t = rep(t, 'const esc = s =>', helper + 'const esc = s =>', 'recorder display helper', p, True)
recorder_sites = [
    ("'no branch recorded'} · ${esc(r.by || 'unnamed')}", "'no branch recorded'} · ${recorderDisplay772(r.by || 'unnamed')}", 'Today delivery updates'),
    ("esc(x.d.by || 'a person')", "recorderDisplay772(x.d.by || 'a person')", 'Progress recorded deliveries'),
    ("esc(deliveryOf(o.key).by || 'a person')", "recorderDisplay772(deliveryOf(o.key).by || 'a person')", 'on-hire confirmation label'),
    ("<td>${esc(r.by || 'unnamed')}${r.d.done ?", "<td>${recorderDisplay772(r.by || 'unnamed')}${r.d.done ?", 'recorded-by arrival column'),
    ("<td>${esc(r.by || 'unnamed')}</td></tr>", "<td>${recorderDisplay772(r.by || 'unnamed')}</td></tr>", 'printed arrival recorder'),
    ("+ ' (' + esc(r.by || 'unnamed') + ')'", "+ ' (' + recorderDisplay772(r.by || 'unnamed') + ')'", 'printed off-site recorder'),
    ("esc(t.by || 'unnamed')", "recorderDisplay772(t.by || 'unnamed')", 'typed-field attribution'),
    ("by <b>${esc(d.by || 'unnamed')}</b>", "by <b>${recorderDisplay772(d.by || 'unnamed')}</b>", 'delivery drawer recorder'),
    ("esc(h.by || 'unnamed')", "recorderDisplay772(h.by || 'unnamed')", 'delivery history recorder'),
    ("<em>${esc(h.by || '')}</em>", "<em>${recorderDisplay772(h.by || '')}</em>", 'delivery card history recorder'),
    ("<td>${esc(who || 'unnamed')}${at ?", "<td>${recorderDisplay772(who || 'unnamed')}${at ?", 'field-change recorder'),
]
for old, new, label in recorder_sites:
    t = rep(t, old, new, label, p, True)

# 2. Progress - the sentence under the branch bars names the servicing and water charged on, so its parts add
t = rep(t, """Not on a branch: the event labour scope, ${esc(money0(MS.charge.race.amount))}${MS.charge.labour_ticks ? `, and the labour ticked, ${esc(money0(MS.charge.labour))}` : ''} — the job's. With ${MS.charge.labour_ticks ? 'them' : 'it'}, ${esc(money0(MS.charge.total))} is the revenue charged to the V8s""",
 """Not on a branch: the event labour scope, ${esc(money0(MS.charge.race.amount))}${MS.charge.labour_ticks ? `, the labour ticked per piece, ${esc(money0(MS.charge.labour))}` : ''}${MS.charge.servicing ? `, and the toilets’ servicing and water charged on at our rates, ${esc(money0(MS.charge.servicing))}` : ''} — the job's. With ${MS.charge.labour_ticks || MS.charge.servicing ? 'them' : 'it'}, ${esc(money0(MS.charge.total))} is the revenue charged to the V8s""", 'progress branch paragraph', p, True)

# 3. the transport fold says what it is
t = rep(t, "const X = ourKindCard('transport', {empty: 'No transport cost of ours recorded yet.'});",
 "const X = ourKindCard('transport', {empty: 'No transport line typed here yet. The carriers’ figures on the schedule’s TPORT COST column are counted in the Forecast P&L above.'});", 'transport fold empty line', p, True)
t = rep(t, '<div class="hubtitle"><h3>Transport (cartage) — our direct costs <span class="chip ref">${X.list.length}</span>',
 '<div class="hubtitle"><h3>Transport (cartage) — lines typed here <span class="chip ref">${X.list.length}</span>', 'transport fold heading', p, True)

# 4. revenue to job end: the labour still to tick is not carried, and says so
t = rep(t, "on the record + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card`)}",
 "on the record + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card · labour per piece still to tick is charged as the work is done and is not carried here`)}", 'costs card revenue tile', p, True)
t = rep(t, "the dockets so far + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card`)}",
 "the dockets so far + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card · labour still to tick is not carried`)}", 'glance revenue tile', p, True)

# 5. exact-once wording replacements from the verified punch list, when the list is beside this patch
lst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence', 'replacements.json')
applied = skipped = 0
if os.path.exists(lst):
    for item in json.load(open(lst, encoding='utf-8')):
        old, new = item['old'], item['new']
        if not old or old == new: continue
        if t.count(old) == 1: t = t.replace(old, new); applied += 1
        else: skipped += 1; print(f"  skip (found {t.count(old)}): {item.get('tab', '')} - {old[:70]!r}")
    print(f"  punch list: {applied} applied, {skipped} skipped")

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.72 applied: tidy for management - no agent name shown, the branch paragraph adds, the transport fold says what it is, labour still to tick named on the revenue tiles' + (f', {applied} punch-list wordings' if applied else ''))
