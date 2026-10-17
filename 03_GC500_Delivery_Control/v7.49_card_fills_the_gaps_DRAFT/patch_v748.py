#!/usr/bin/env python3
"""v7.49 (built as patch_v748; internal names use 748) - the card fills the gaps. Andrew Fisher, 30 Sep 2026, with the Street Rate Card 2026: "Can you not use the
rate card to fill in the gaps. We can edit the hire rate later on if needed."
The Q6844 toilet servicing is charged at the card's pump-out rates; every contract line still with no rate gets a box
on the Costs tab (synced as lineRates, named and stamped) with the card's daily rate beside it as a guide. The
project manager's 1 Oct 2026 decisions (waste tanks included, 9968929 own use; Codex's live v7.47) always stand.
    python3 patch_v748.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function card748Html(' in t: sys.exit('v7.49 already applied')
if 'function contractTreatment747(' not in t: sys.exit('needs the live v7.47 (Codex: confirmed answers of 1 Oct 2026)')
JS = open(os.path.join(here, 'card748_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
CSS = ('\n/* v7.49 */\n.card748 input.rate{width:7em;margin-left:6px}.card748 .w{color:var(--mute);font-size:12px}'
       '.card748 tr.tot td{border-top:1px solid var(--line,#ddd)}.card748 h4{margin:14px 0 4px}.fold748 summary{cursor:pointer;margin-top:10px}\n')
# 1. the one charge rule: a line with no rate asks the card (or a typed rate) first
t = rep(t, "function contractCharge(r){", JS + "\n/* v7.49 - the contract's own rule, as it was */\nfunction contractCharge_747(r){", 'charge rule', p, True)
# 2. the servicing is in the revenue total
t = rep(t, " charge.total = cents(charge.contracts + charge.labour + (charge.race.amount || 0) + charge.fencing + charge.other);",
 " charge.servicing = servicing748Total(); /* v7.49 - Q6844 servicing at the card's pump-out rates */\n charge.total = cents(charge.contracts + charge.labour + (charge.race.amount || 0) + charge.fencing + charge.other + charge.servicing);", 'total', p, True)
# 3. and in the Toilets and servicing stream
t = rep(t, " if (X.charge.other_lines) add('other', X.charge.other, 'charge');",
 " if (X.charge.other_lines) add('other', X.charge.other, 'charge');\n if (X.charge.servicing) add('toilets', X.charge.servicing, 'charge'); /* v7.49 */", 'stream', p, True)
# 4. the words that said "not charged"
t = rep(t, " if (TS && TS.at_card_total) tl.notes.push(`servicing is on no contract line: the same servicing at our card's pump-out rates would be ${money0(TS.at_card_total)} — not charged yet`);",
 " if (X.charge.servicing) tl.notes.push(`servicing ${money0(X.charge.servicing)} at our card's pump-out rates is in the revenue — it is on no contract line yet`); /* v7.49 */", 'stream note', p, True)
t = rep(t, " if (s.key === 'toilets' && TS && TS.at_card_total) bits.push(`servicing not charged — ${money0(TS.at_card_total)} at our pump-out rates`);",
 " if (s.key === 'toilets' && M.charge && M.charge.servicing) bits.push(`servicing ${money0(M.charge.servicing)} at our pump-out rates in it, on no contract line yet`); /* v7.49 */", 'email bit', p, True)
t = rep(t, "DATA.toilet_servicing && DATA.toilet_servicing.at_card_total ? `<br><small style=\"color:var(--mute)\">servicing is on no contract yet — ${esc(money0(DATA.toilet_servicing.at_card_total))} at our card rates, not charged</small>` : ''}",
 "servicing748Total() ? `<br><small style=\"color:var(--mute)\">servicing ${esc(money0(servicing748Total()))} at our card rates is in it — on no contract yet</small>` : ''}", 'progress note', p, True)
t = rep(t, "A comparison only — never added, because it is on no contract and no invoice.</p>",
 "Charged in the revenue since v7.49 at these rates — see From the Street Rate Card 2026, below — and on no contract line yet.</p>", 'costs hint', p, True)
# 5. the card on the Costs tab, under the branch charges
t = rep(t, " ${branchCostCard()}\n <div class=\"card\">", " ${branchCostCard()}\n ${card748Html()}\n <div class=\"card\">", 'costs card', p, True)
# 6. typed rates are part of the shared record, and of the export
t = rep(t, " rates: {kind: 'value', get: () => S.rates, set: v => S.rates = v},",
 " rates: {kind: 'value', get: () => S.rates, set: v => S.rates = v},\n lineRates: {kind: 'value', get: () => S.lineRates, set: v => S.lineRates = v}, /* v7.49 */", 'sync', p, True)
t = rep(t, "rates:{}, accRates:{},", "rates:{}, lineRates:{}, accRates:{},", 'blank state', p, True)
t = rep(t, "answers: S.answers || {}, finance745: S.finance745 || {},", "answers: S.answers || {}, finance745: S.finance745 || {}, lineRates: S.lineRates || {},", 'export', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
