#!/usr/bin/env python3
"""v7.69 - What we are charged, we charge on. Andrew, 1 Oct 2026, 16:40 AEST, reading the Questions page's "Water services -
customer rates still required ... no Revenue is assumed": "all our cost - what we charge should cover what we get charged."
Apply after v7.68 (on the live v7.67 build: v7.68 then v7.69).

  The four water lines on the Event Portables quotes (Water Truck $6,800, Water Truck - Pre fill $2,800, Water delivery
  $2,250, 3000 Ltr Free Drinking Water Tank $350 - $12,200 ex GST) are in the approved Rehire cost but had no line on the
  card, so the page charged the V8s nothing for them and named the gap. Andrew's rule: every Rehire cost has a Rehire
  Revenue at least equal to it. So each water line is charged on at what Event Portables charge us - the floor, never
  less - until the branch puts a rate on; a rate typed on Costs (From the Street Rate Card 2026) stands in for it.
    1. servicing748(): the water lines priced at cost, with a typed-rate override, inside the servicing total - so the
       P&L's revenue, the Rehire by branch toilets group, the accrual forecast and the card all follow.
    2. The P&L line and its working say so; the gap "water services have no customer rate" becomes a caveat.
    3. The Costs card lists the water lines with a rate box each ("at cost - what Event Portables charge us").
    4. The Questions item is answered in Andrew's words.
    5. The Rehire by branch card says, per group and for the business, whether what we charge covers what we are
       charged (Rehire Revenue ÷ Rehire cost to job end), or that the supplier's cost is not on the record.
    python3 patch_v769.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'at_cost_total' in t: sys.exit('v7.69 already applied')
if 'tank768LinesFor' not in t: sys.exit('needs v7.68 first')

# 1. servicing748(): the water lines at cost, typed rate stands in
t = rep(t, """ return {lines, total: cents(lines.reduce((t, l) => t + l.amount, 0)), their_total: TS.their_total, not_on_the_card: TS.not_on_the_card || []};
}
function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }""",
""" /* v7.69 - WHAT WE ARE CHARGED, WE CHARGE ON (Andrew, 1 Oct 2026: "all our cost - what we charge should cover what we get
 charged"). The quote's lines with no line on the card - the water truck, the pre-fill, the water deliveries, the
 drinking-water tank - are charged to the V8s at what Event Portables charge us, the floor and never less, until the
 branch puts a rate on; a rate typed on Costs stands in for it. */
 const atCost = (TS.not_on_the_card || []).map(l => { const k = 'service|' + l.description, typed = lr748Typed(k), rate = typed != null ? typed : (l.their_rate || 0);
 return Object.assign({}, l, {key: k, card_line: null, card_rate: null, rate, from: typed != null ? 'typed' : 'at cost', amount: cents((l.qty || 0) * rate), covered: rate >= (l.their_rate || 0)}); });
 const all = lines.concat(atCost);
 return {lines: all, card_lines: lines, at_cost: atCost, total: cents(all.reduce((t, l) => t + l.amount, 0)), card_total: cents(lines.reduce((t, l) => t + l.amount, 0)), at_cost_total: cents(atCost.reduce((t, l) => t + l.amount, 0)),
 their_total: TS.their_total, their_water: cents(atCost.reduce((t, l) => t + (l.their_amount || 0), 0)), under: atCost.filter(l => !l.covered), not_on_the_card: TS.not_on_the_card || []};
}
function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }""", 'servicing at cost', p, True)

# 2a. the P&L line
t = rep(t, "${servicing ?line(`Toilet servicing and cleaning — ${esc(pl760ToiletBranch())} rehire, priced by us at our pump-out rates`, pl767Servicing(), m0(servicing), CARD) : ''}",
 "${servicing ?line(`Toilet servicing, cleaning and water — ${esc(pl760ToiletBranch())} rehire, priced by us at our pump-out rates · the water at what we are charged`, pl767Servicing(), m0(servicing), CARD) : ''}", 'P&L line title', p, True)

# 2b. the working under it
t = rep(t, """ const parts = sv.lines.map(l => `${fmtNum(l.qty)} × ${esc(l.card_line || l.description)} at ${money(l.rate)}${l.from === 'typed' ? ' (typed)' : ''}`);
 return `Event Portables’ quantities on Q6844 — ${parts.join(' · ')} — at our card’s pump-out rates; Event Portables charge us ${money0(sv.their_total)} for the same work, inside the Rehire cost · Rehire Revenue on no contract line yet: the branch adds the servicing lines when it bills · servicing and cleaning are not labour`;""",
""" const parts = sv.lines.map(l => `${fmtNum(l.qty)} × ${esc(l.card_line || l.description)} at ${money(l.rate)}${l.from === 'typed' ? ' (typed)' : l.from === 'at cost' ? ' (at cost)' : ''}`);
 const under = (sv.under || []).length ? ` · <span class="pl-todo">UNDER what we are charged: ${sv.under.map(l => esc(l.description) + ' ' + money(l.rate) + ' against ' + money(l.their_rate)).join(', ')}</span>` : '';
 return `Event Portables’ quantities on Q6844 and Q6846 — ${parts.join(' · ')} — the pump-outs at our card’s rates, the water at what Event Portables charge us (Andrew, 1 Oct: what we charge covers what we get charged; a rate typed on Costs stands in); Event Portables charge us ${money0(sv.their_total)} for the same servicing and ${money0(sv.their_water)} for the water, inside the Rehire cost${under} · Rehire Revenue on no contract line yet: the branch adds the lines when it bills · servicing and cleaning are not labour`;""", 'P&L working', p, True)

# 2c. the gap becomes a caveat
t = rep(t, """ if (water753.length) miss(`customer revenue for ${water753.map(l => l.description).join(', ')} — no agreed customer rate or card line. The ${money(water753.reduce((sum, l) => sum + (l.their_amount || 0), 0))} supplier cost is already in the approved rehire costs; it is not a customer rate`, 'water services have no customer rate');""",
""" /* v7.69 - charged on at what we are charged (Andrew, 1 Oct); said beside the figure, no longer missing */
 if (water753.length) { caveats.push(`the water services (${water753.map(l => l.description).join(', ')}) are charged on at what Event Portables charge us, ${money0(water753.reduce((sum, l) => sum + (l.their_amount || 0), 0))} — Andrew, 1 Oct: what we charge covers what we get charged — until the branch puts a rate on`); caveats_short.push('water charged on at cost'); }""", 'gap to caveat', p, True)

# 3. the Costs card: the water lines in the servicing table, with a rate box each
t = rep(t, """ ${sv ? `<h4>Toilet servicing — priced by us at our pump-out rates</h4>
 <p class="hint">Event Portables' quantities on quote Q6844, charged at the card's pump-out rates. Event Portables charge us ${esc(money0(sv.their_total))} for the same three; that is in the rehire cost. Type a rate to change one; an empty box puts the card's back.${ro ? ' Rates are changed on the editing link.' : ''}</p>""",
""" ${sv ? `<h4>Toilet servicing and water — priced by us at our pump-out rates, the water at what we are charged</h4>
 <p class="hint">Event Portables' quantities on quotes Q6844 and Q6846: the pump-outs and cleans at the card's rates; the water truck, the pre-fill, the deliveries and the drinking-water tank — no line on the card — at what Event Portables charge us (Andrew, 1 Oct 2026: "what we charge should cover what we get charged"). Event Portables charge us ${esc(money0(sv.their_total))} for the servicing and ${esc(money0(sv.their_water))} for the water; both are in the rehire cost. Type a rate to change one; an empty box puts the card's, or the supplier's, back.${ro ? ' Rates are changed on the editing link.' : ''}</p>""", 'card heading', p, True)
t = rep(t, """ <td>${l.from === 'card' ? 'card: ' + esc(l.card_line) : 'typed' + ((S.by || {})['lineRates/' + l.key] ? ' by ' + esc(S.by['lineRates/' + l.key]) : '') + ` <span class="w">(card ${esc(money(l.card_rate))})</span>`}</td>
 <td class="num">${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), String(l.card_rate))}</td><td class="num"><b>${esc(money(l.amount))}</b></td></tr>`).join('')}""",
""" <td>${l.from === 'card' ? 'card: ' + esc(l.card_line) : l.from === 'at cost' ? 'at cost — what Event Portables charge us <span class="w">(no line on the card)</span>' : 'typed' + ((S.by || {})['lineRates/' + l.key] ? ' by ' + esc(S.by['lineRates/' + l.key]) : '') + ` <span class="w">(${l.card_rate != null ? 'card ' + esc(money(l.card_rate)) : 'theirs ' + esc(money(l.their_rate))})</span>`}${l.covered === false ? ' <span class="chip cand">under what we are charged</span>' : ''}</td>
 <td class="num">${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), String(l.card_rate != null ? l.card_rate : l.their_rate))}</td><td class="num"><b>${esc(money(l.amount))}</b></td></tr>`).join('')}""", 'card rows', p, True)
t = rep(t, """ ${sv.not_on_the_card.length ? `<p class="hint">Not charged — no line on the card: ${esc(sv.not_on_the_card.map(l => l.description + ' (theirs ' + money0(l.their_amount) + ')').join(', '))}. Needs a price agreed.</p>` : ''}` : ''}""",
""" ${sv.at_cost.length ? `<p class="hint">The water lines are charged on at the supplier's figure — ${esc(money0(sv.at_cost_total))} — because what we charge covers what we get charged (Andrew, 1 Oct 2026). A rate typed above stands in; one under the supplier's figure is flagged.</p>` : ''}` : ''}""", 'card hint', p, True)

# 4. the Questions item, answered in Andrew's words
t = rep(t, """ if (sv.not_on_the_card.length) Q.push({group: 'By branch', id: 'water-service-rate753', st: QH_OPEN,
 q: 'Water services — customer rates still required',
 why: 'The supplier quote contains these costs, but the card has no customer rate for them. Supplier cost is not the rate charged to the V8s, so no Revenue is assumed.',
 need: 'Confirm what to charge the V8s for each service, or explicitly confirm which service is included in another agreed charge.',
 rows: sv.not_on_the_card.map(l => l.description + ' · supplier cost ' + money(l.their_amount) + ' ex GST'), go: 'costs'});""",
""" if (sv.at_cost && sv.at_cost.length) done({group: 'By branch', id: 'water-service-rate753', q: 'Water services — charged on at what we are charged',
 why: `Andrew, 1 Oct 2026: "all our cost — what we charge should cover what we get charged." The water lines on the Event Portables quotes have no line on the card, so each is charged to the V8s at the supplier's figure — ${money0(sv.at_cost_total)} ex GST in all — until the branch puts a rate on (a rate typed on Costs stands in). Revenue; the same cost stays in the Rehire cost.`,
 rows: sv.at_cost.map(l => l.description + ' · ' + money(l.rate) + (l.from === 'typed' ? ' typed' : ' at cost') + ' · supplier ' + money(l.their_amount) + ' ex GST'), go: 'costs'});""", 'question answered', p, True)

# 5. the Rehire by branch card: does what we charge cover what we are charged
t = rep(t, """ <td class="rh766-basis"><span>${esc(g.basis)}</span>${g.notes.length ?""",
""" <td class="rh766-basis"><span class="rh766-cover">${esc(rh769Cover(g.revJob != null ? g.revJob : g.rev, g.costJob != null ? g.costJob : g.cost))}</span><br><span>${esc(g.basis)}</span>${g.notes.length ?""", 'cover per group', p, True)
t = rep(t, """ <p class="fin745-basis">By branch, to job end: ${R.byBranch.map(b =>""",
""" <p class="fin745-basis"><b>Andrew’s rule (1 Oct 2026): what we charge covers what we get charged.</b> For the business, to job end: ${esc(rh769Cover(T.revJob, T.costJob))}${T.costMissing ? ` — before the ${esc(fmtNum(T.costMissing))} supplier cost${T.costMissing === 1 ? '' : 's'} not on the record` : ''}. Each group below says whether it does.</p>
 <p class="fin745-basis">By branch, to job end: ${R.byBranch.map(b =>""", 'cover for the business', p, True)
t = rep(t, "function rh766Card(){",
"""/* v7.69 - does what we charge cover what we are charged: Rehire Revenue against Rehire cost, as the business reads it (Rehire Recovery) */
function rh769Cover(rev, cost){
 if (cost == null) return 'supplier cost not on the record — cover cannot be checked';
 if (!cost) return 'no cost to cover';
 const r = (rev || 0) / cost;
 return r >= 1 ? `covers what we are charged: ×${r.toFixed(2)} (${money0(rev || 0)} charged against ${money0(cost)} paid)` : `SHORT of what we are charged by ${money0(cost - (rev || 0))} (×${r.toFixed(2)})`;
}
function rh766Card(){""", 'cover helper', p, True)

# 6. the accrual row's name
t = rep(t, "addRev('Toilet servicing — event forecast'", "addRev('Toilet servicing and water — event forecast'", 'accrual row', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print("v7.69 applied: the water lines are charged on at what we are charged; the Rehire by branch card says whether each group covers its cost")
