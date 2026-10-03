#!/usr/bin/env python3
"""v6.73 - COSTING CHECKED, AND SAID MORE SIMPLY (Andrew, 26 Sep 2026: "check all costing, check everything adds up, make sure
everything makes sense, make sure we are not over complicating the amount of info we give").
Every figure reconciled (see CHANGELOG): the streams, the eight cost categories, the branches and the headline all add to
the cent. Three things said more simply:
  * Today's money card showed "Toilets and servicing · Coates pays $118,575 / $69,092" with nothing beside it - it read as a
    $49k loss. The servicing is on no contract yet (Costs & charges says so in its notes); Today now says it in a line.
  * The branch plates listed Labour, Transport, Damages and Subhire on every branch whether anything was charged or not - rows
    of dashes. Only the kinds with something on them are listed; a branch with none says so once.
  * On Costs & charges each of the 58 fencing docket lines repeated the same sentence under it ("filled in from the fencing
    docket - what Coates charges the V8s for it, the same figure as the Fencing tab"); the line's own description already
    says docket and card. The sentence is gone from the rows (the table's source column still says where they come from).
  python3 patch_v673.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, """${top.map(s => `<li><span class="w">${esc(s.name)}${s.cost_known ? ` <span style="color:var(--mute)">· Coates pays ${esc(money0(s.cost0))}</span>` : ''}</span><span class="tm">${esc(money0(s.charge0))}</span></li>`).join('')}</ul>""",
      """${top.map(s => `<li><span class="w">${esc(s.name)}${s.cost_known ? ` <span style="color:var(--mute)">· Coates pays ${esc(money0(s.cost0))}</span>` : ''}${
 /* v6.73 - a stream costing more than it charges says why, when the record says why */
 s.key === 'toilets' && s.cost_known && s.cost0 > s.charge0 && DATA.toilet_servicing && DATA.toilet_servicing.at_card_total ? `<br><small style="color:var(--mute)">servicing is on no contract yet — ${esc(money0(DATA.toilet_servicing.at_card_total))} at our card rates, not charged</small>` : ''}</span><span class="tm">${esc(money0(s.charge0))}</span></li>`).join('')}</ul>""", 'today toilets', path, need)
    t = rep(t, """const kindRows = g => kinds.filter(k => g.kinds[k.key].lines || ['labour', 'transport', 'damages', 'subhire'].includes(k.key))""",
      """const kindRows = g => { const ks = kinds.filter(k => { const v = g.kinds[k.key]; return v.lines || v.amount || v.hours; });   /* v6.73 - only the kinds with something on them */
 if (!ks.length) return '<span class="none">nothing else charged yet</span><b class="none">—</b>';
 return ks""", 'kindRows open', path, need)
    t = rep(t, """return `<span>${esc(k.label)}${v.lines ? ` <small>· ${v.lines} line${v.lines === 1 ? '' : 's'}</small>` : ''}</span><b${val ? '' : ' class="none"'}>${val ? esc(val) : '—'}</b>`; }).join('');""",
      """return `<span>${esc(k.label)}${v.lines ? ` <small>· ${v.lines} line${v.lines === 1 ? '' : 's'}</small>` : ''}</span><b${val ? '' : ' class="none"'}>${val ? esc(val) : '—'}</b>`; }).join(''); };""", 'kindRows close', path, need)
    t = rep(t, """note: 'filled in from the fencing docket — what Coates charges the V8s for it, the same figure as the Fencing tab' + dated,""",
      """note: dated ? dated.trim().replace(/^\\(|\\)$/g, '') : null,   /* v6.73 - the row's description already says docket and card */""", 'docket note', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
