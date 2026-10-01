#!/usr/bin/env python3
r"""v7.74 - Tidy, the second pass. The rest of the management read of 1 Oct 2026 (the readers' findings verified against the
page source by seven verifiers, each with the exact source string and its replacement) - wording only; no figure, rule or
record changes. Apply after v7.73.

  Every item in evidence/replacements.json is a verified finding: the quote as a manager read it, why it misleads, the
  exact source string (which occurs once in the build) and the replacement in the page's voice. The patch applies each
  only where the string still occurs exactly once; one that does not is skipped and printed, never guessed.
    python3 patch_v774.py <page.html>"""
import os, sys, json
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.73 - CRYSTAL' not in t: sys.exit('needs v7.73 first')
lst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence', 'replacements.json')
applied = skipped = 0
for item in json.load(open(lst, encoding='utf-8')):
    old, new = item['old'], item['new']
    if not old or old == new: continue
    if t.count(old) == 1: t = t.replace(old, new); applied += 1
    else: skipped += 1; print(f"  skip (found {t.count(old)}): {item.get('tab', '')} - {item.get('quote', '')[:70]!r}")
if not applied: sys.exit('v7.74: nothing applied')

# The review critic's fixes on the v7.70 card (the adversarial review of 1 Oct, critic at 18:08): CSS and words only.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
# 1. On a phone the card's first column was set nowrap, so the widest chip ("Temporary Staff · 3210 · 2143", 225 px of a
#    390 px screen) set the column for the whole table and pushed the figures off the screen. The column wraps on a phone,
#    and the wages chip is the codes alone - "Temporary Staff" moves into the words beside it.
t = rep(t, ".pl770-tbl td:first-child,.pl770-tbl th:first-child{width:1%;white-space:nowrap}.pl770-over td,.pl770-over td b{color:var(--mute)}",
 ".pl770-tbl td:first-child,.pl770-tbl th:first-child{width:1%;white-space:nowrap}.pl770-over td,.pl770-over td b{color:var(--mute)}@media (max-width:640px){.pl770-tbl td:first-child,.pl770-tbl th:first-child{white-space:normal;width:auto}.pl770-tbl td.acc761-why{min-width:240px}}", 'pl770 phone column', p, True)
t = rep(t, """<span class="chip ref mono">Temporary Staff · 3210 · 2143</span></td><td><b>Wages</b><br><span class="acc761-w">beside, never added — Finance says which line</span>""",
 """<span class="chip ref mono">3210 · 2143</span></td><td><b>Wages</b><br><span class="acc761-w">Temporary Staff on the P&amp;L · beside, never added — Finance says which line</span>""", 'wages chip', p, True)
# 2. The Direct costs tile hung the job-end split on the on-the-record figure ("$235,372 … of which $420,740").
t = rep(t, """`${esc(money0(P.costNow))} on the record today — the Costs to job end card’s figure · of which ${esc(money0(P.directJob))} on the ledger’s direct lines and ${esc(money0(P.overJob))} travel, accommodation, meals and printing`""",
 """`${esc(money0(P.costNow))} on the record today · to job end: ${esc(money0(P.directJob))} on the ledger’s direct lines + ${esc(money0(P.overJob))} travel, accommodation, meals and printing — the Costs to job end card’s figure`""", 'direct costs tile', p, True)
# 3. The 1010 basis bridges to the figure the Rehire by branch card prints (its total, fencing inside), names the toilet
#    lines that carry a Coates plant number (counted as Event Portables rehire, being checked), and both the 1010 and the
#    2126 lines name the fencing behind the programme inside their to-job-end figure, as the neighbouring cards do.
t = rep(t, """ const RT = R.totals || {};
 const rev = [""", """ const RT = R.totals || {};
 const rows752 = typeof pl752Rows === 'function' ? pl752Rows() : null; /* v7.74 */
 const CN = (Array.isArray(rows752) ? rows752 : []).reduce((s, b) => s + n(b && b.rehireCoatesNos), 0);
 const behind = !!(F.behind && F.behind.length);
 const rev = [""", 'pl770 model: coates numbers, behind', p, True)
t = rep(t, """${money0(rehireLines)} — the Rehire by branch card’s ${money0(rehireTotal)} less the ${money0(n(c.servicing))} of servicing and water the P&L posts to Toilet Pumpouts and Consumables below · Advanced’s fencing dockets at the 2026 card ${money0(fence)}${n(F.revenue) ? ' · to job end adds the fencing programme to come at the card, ' + money0(F.revenue) : ''}""",
 """${money0(rehireLines)} — the Rehire by branch card’s ${money0(r2(rehireTotal + fence))} less its fencing ${money0(fence)} and the ${money0(n(c.servicing))} of servicing and water the P&L posts to Toilet Pumpouts and Consumables below${CN ? ' · ' + fmtNum(CN) + ' of the toilet lines carry a Coates plant number and are counted as Event Portables rehire, as that card counts them — being checked' : ''} · Advanced’s fencing dockets at the 2026 card ${money0(fence)}${n(F.revenue) ? ' · to job end adds the fencing programme to come at the card, ' + money0(F.revenue) + (behind ? ' (of which ' + money0(n(F.behindRevenue)) + ' is behind the programme — weeks that ended with metres still on the plan; Advanced to confirm)' : '') : ''}""", '1010 basis', p, True)
t = rep(t, """${n(F.cost) ? ' · to job end adds the fencing programme to come at Advanced’s rates, ' + money0(F.cost) : ''}`,
   missing: 'the SUB lines’ and the sub-hired forklifts’ supplier costs'},""",
 """${n(F.cost) ? ' · to job end adds the fencing programme to come at Advanced’s rates, ' + money0(F.cost) + (behind ? ' (of which ' + money0(n(F.behindCost)) + ' is behind the programme — Advanced to confirm)' : '') : ''}`,
   missing: 'the SUB lines’ and the sub-hired forklifts’ supplier costs'},""", '2126 basis', p, True)

t = t.replace('/* v7.73 - CRYSTAL.', '/* v7.74 - tidy, the second pass: ' + str(applied) + ' verified wordings from the management read of 1 Oct 2026, and the review\'s fixes on the P&L-in-the-lines card (phone columns, the direct-costs tile, the 1010 bridge, the fencing behind the programme, the Coates-numbered toilet lines). */\n/* v7.73 - CRYSTAL.', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print(f'v7.74 applied: {applied} wordings from the management read, {skipped} skipped')
