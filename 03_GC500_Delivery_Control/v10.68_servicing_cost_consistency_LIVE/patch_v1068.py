"""Author: Andrew Fisher. Supplier servicing cost from the shared site count.

Apply only after the guarded v10.67 release. The quote remains original evidence;
cost views use a derived projection, not edited quote data or service ticks.
"""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

MARKER = '/* supplier-cost-consistency-1068 */'


def replacements():
    source = (HERE / 'supplier_cost1068_src.js').read_text()
    anchor = "/* the servicing: Event Portables' quantities, the card's pump-out rates (or a rate typed here) */"
    return [
        ('shared supplier projection', anchor,
         MARKER + '\n' + source + '\n/* Servicing quantities from the site record; customer rates remain separate. */'),
        ('decorate supplier cost without changing Revenue',
         'return Object.assign({}, base, {lines: all, card_lines: lines, total: cents(all.reduce((t, l) => t + l.amount, 0)), card_total: cents(lines.reduce((t, l) => t + l.amount, 0)), per1040: per, nights1040: N});',
         "const service1068 = Object.assign({}, base, {lines: all, card_lines: lines, total: cents(all.reduce((t, l) => t + l.amount, 0)), card_total: cents(lines.reduce((t, l) => t + l.amount, 0)), per1040: per, nights1040: N});\n return SupplierService1068.decorate(service1068, DATA.rehire_quotes, (DATA.toilet_servicing.lines || []).filter(l => NIGHT1040.some(n => n.card_line === l.card_line)), NIGHT1040.map(n => n.card_line), supplierServiceQuantities1068(service1068));"),
        ('Costs shared supplier amount',
         'const rq = DATA.rehire_quotes && DATA.rehire_quotes.totals ? cents((DATA.rehire_quotes.totals.sub_totals || 0) + (DATA.rehire_quotes.totals.delivery_and_pickup || 0)) : null;',
         'const supplier1068 = supplierService1068(), rq = supplier1068 ? supplier1068.knownTotal : null, rqQuoted1068 = supplier1068 ? supplier1068.quotedTotal : null;'),
        ('keep quoted and estimated amounts distinct',
         'rehire_quoted: rq, rehire_approved: rqApproved, rehire_auth: rqAuth, rehire: rqApproved ? rq : null, subhire_lines: C.subhire.lines',
         'rehire_quoted: rqQuoted1068, rehire_estimate1068: rq, rehire_complete1068: !!(supplier1068 && supplier1068.complete), rehire_approved: rqApproved, rehire_auth: rqAuth, rehire: rqApproved ? rq : null, subhire_lines: C.subhire.lines'),
        ('name incomplete supplier costs',
         "const miss = (l, sh) => { missing.push(l); short.push(sh); };",
         "const miss = (l, sh) => { missing.push(l); short.push(sh); };\n if (!supplier1068 || !supplier1068.complete) miss(supplierCostWords1068(supplier1068), 'supplier servicing cost incomplete');"),
        ('unapproved supplier basis',
         "if (rq != null && !rqApproved) miss(`rehire toilets — ${money0(rq)} ex GST quoted by ${DATA.rehire_quotes.supplier.name}, unsigned; a cost only if authorised`, `rehire quote ${money0(rq)} unsigned`);",
         "if (rq != null && !rqApproved) miss(`rehire toilets — ${money0(rq)} ex GST estimated from the site servicing count and supplier rates; a cost only if authorised. Original quotes: ${money0(rqQuoted1068)} ex GST, reference only`, 'supplier cost awaiting authorisation');"),
        ('approved supplier basis',
         "if (rqApproved) { caveats.push(`the rehire toilets are in at the quotes' figures (${money0(rq)}) — approved on ${fmtDay(rqAuth.stated_on).dm}, with the final total still able to change`); caveats_short.push('rehire toilet total not final'); }",
         "if (rqApproved) { caveats.push(`${supplierKnownWords1068(rq)}${supplier1068 && supplier1068.complete ? '' : '; full supplier cost unavailable'} — servicing on the site count at supplier rates; other quoted lines unchanged. ${supplierCostWords1068(supplier1068)} Approved scope dated ${fmtDay(rqAuth.stated_on).dm}; provisional until invoiced`); caveats_short.push('supplier cost estimate; invoice not confirmed'); }"),
        ('monthly cost uses derived supplier lines',
         "((DATA.rehire_quotes || {}).quotes || []).forEach(q => {\n const from = acc762Date(q.delivery) || acc762Date(q.use_on), to = acc762Date(q.collect) || acc762Date(q.use_on);\n const ex = acc762Round((Number(q.sub_total) || 0) + (Number(q.delivery_charge) || 0) + (Number(q.pickup) || 0));",
         "supplierCostQuotes1068().forEach(q => {\n const from = acc762Date(q.delivery) || acc762Date(q.use_on), to = acc762Date(q.collect) || acc762Date(q.use_on);\n const ex = q.knownCostTotal1068;\n if (ex == null) return unallocated(out.unallocatedCosts, 'Toilets — supplier cost incomplete', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', null, 'Supplier quote totals need reconciliation; full cost unavailable', {quote: q.quote, supplierIncomplete1068: true});"),
        ('monthly supplier description',
         "addCost('Toilets — supplier quote, provisional day-share', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', share.amount, q.quote + ' · ' + share.days + ' of ' + share.span + ' quoted days, including a provisional share of transport; Finance must confirm cost timing and invoice/payment coverage', {quote: q.quote, from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount, provisionalAllocation: true});",
         "addCost('Toilets — supplier cost estimate, provisional day-share', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', share.amount, q.quote + ' · servicing uses the site count; other quote lines unchanged · ' + share.days + ' of ' + share.span + ' quoted days, including a provisional share of transport; Finance must confirm cost timing and invoice/payment coverage. ' + supplierCostWords1068(), {quote: q.quote, from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount, provisionalAllocation: true, supplierIncomplete1068: !q.costComplete1068});"),
        ('ledger cost split uses derived supplier lines',
         'const Q = (DATA.rehire_quotes && DATA.rehire_quotes.quotes) || [];',
         'const Q = supplierCostQuotes1068();'),
        ('forecast supplier basis',
         "`the four approved quotes ex GST, counted whole on the P&L (${k.rehire_approved ? 'approved on Andrew’s word' : 'quoted'}); no invoice yet`",
         "`supplier cost ${k.rehire_complete1068 ? 'estimate' : 'known subtotal; full cost unavailable'} ex GST, counted once on the P&L (${k.rehire_approved ? 'approved scope' : 'awaiting approval'}); servicing uses the site count at supplier rates, other quote lines unchanged; no invoice yet`"),
        ('coverage supplier basis',
         "basis:'Contract revenue follows confirmed ownership. Approved quote totals and their existing costing branch are unchanged; quote coverage is not allocated to individual units.'",
         "basis:'Contract revenue follows confirmed ownership. Servicing cost follows the site count at supplier rates; other quoted costs and the costing branch are unchanged. Quote coverage is not allocated to individual units.'"),
        ('coverage cost state',
         "costState:RH.cost==null?'not on the record':RH.approved?(Supplier955.model().estimate?'approved quotes + provisional estimate':'approved — the final total may change'):'quoted, unsigned'",
         "costState:RH.costComplete1068===false?'Full supplier cost unavailable; '+supplierKnownWords1068(RH.knownCost1068):RH.cost==null?'not on the record':RH.approved?'supplier cost estimate — not an invoice':'supplier cost estimate; awaiting approval'"),
        ('ledger split description',
         "const inside = rqOn ? 'inside the Rehire figure above — the four quotes are carried whole because their lines did not split to the cent' : 'not counted until the quotes are approved';",
         "const inside = !k.rehire_complete1068 ? 'Full supplier cost unavailable; any verified subtotal is inside Rehire, not a zero pump-out or water cost.' : rqOn ? 'inside the Rehire figure above — supplier cost projections did not split to the cent' : 'not counted until the supplier scope is approved';"),
        ('ledger supplier whole description',
         "' — the Forecast P&L carries the four quotes as one Rehire cost of '",
         "' — the Forecast P&L carries the supplier cost estimate once as Rehire cost of '"),
        ('ledger quote label',
         ": 'four quotes ' + money0(rqOn ? rqAll : rqQuoted) + ' whole'",
         ": (rqOn ? 'supplier cost estimate ' : 'original quotes ') + money0(rqOn ? rqAll : rqQuoted) + ' whole'"),
        ('ledger servicing basis',
         "basis: qClean ? `${and(qWords.pump)}: the service visits, the tank pump-outs, the block cleans, the water truck and the pre-fill` : inside",
         "basis: qClean ? `${and(qWords.pump)}: servicing on the site count at supplier rates; the water truck and pre-fill unchanged. ${supplierCostWords1068()}` : inside"),
        ('Costs revenue and supplier explanation',
         "Event Portables' quantities on quotes Q6844 and Q6846: the pump-outs and cleans at the card's rates;",
         "Site quantities × event nights: the pump-outs and cleans at the card's rates;"),
        ('Costs supplier amount description',
         "Event Portables charge us ${esc(money0(sv.their_total))} for the servicing and ${esc(money0(sv.their_water))} for the water; both are in the rehire cost.",
         "${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${esc(money(sv.their_water))} ex GST; both are included once in supplier cost."),
        ('answer uses site quantity basis',
         'Quote Q6844’s servicing quantities are charged at the card’s pump-out rates or rates entered on Costs:',
         'The site quantities × event nights are charged at the card’s pump-out rates or rates entered on Costs:'),
        ('servicing Revenue no-data basis',
         "if (!sv) return 'Event Portables’ quantities on Q6844 at the card’s pump-out rates · Rehire Revenue · servicing and cleaning are not labour';",
         "if (!sv) return 'Site quantities × event nights at the card’s pump-out rates · Rehire Revenue · servicing and cleaning are not labour';"),
        ('servicing Revenue basis',
         'return `Event Portables’ quantities on Q6844 and Q6846: ${parts.join(\' · \')}.',
         'return `Site quantities × event nights, with the quoted water lines: ${parts.join(\' · \')}.') ,
        ('servicing cost description',
         'Event Portables charge us ${money0(sv.their_total)} for the servicing and ${money0(sv.their_water)} for the water, inside the Rehire cost.',
         '${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${money(sv.their_water)} ex GST, inside supplier cost.'),
        ('details supplier estimate description',
         'against ${esc(money0(TS.their_total))} Event Portables charge for the servicing and ${esc(money0(TS.their_water || 0))} for the water.',
         '${esc(supplierCostWords1068(TS.supplier1068))} Water remains ${esc(money(TS.their_water || 0))} ex GST.'),
        ('monthly Revenue basis only; amount unchanged',
         "'Quoted quantities at card pump-out rates; the water lines at the quotes’ own figures (what we charge should cover what we get charged, Andrew 1 Oct 2026); actual services and invoices require confirmation'",
         "'Site quantities × event nights at card pump-out rates; water lines at the quotes’ own figures; actual services and invoices require confirmation'"),
        ('pumpout Revenue basis only; amount unchanged',
         'Event Portables’ quantities on Q6844 at the card’s pump-out rates ${money0(sv.card_total)}',
         'Site quantities × event nights at the card’s pump-out rates ${money0(sv.card_total)}'),
        ('quote is reference evidence',
         'as the pricing for the rehire toilets. They are Coates\' <b>rehire cost</b> (${esc(PL_REHIRE)}); the revenue side stays the 2026 card. Every figure is as printed on page 1 of each quote, and each quote\'s own arithmetic adds up.',
         'as supplier pricing evidence. These are the <b>original quotes for reference</b>; supplier servicing cost uses the site count × event nights at these rates. Customer Revenue stays at our agreed rates. Every figure below remains as printed on the quote.'),
        ('quote approval wording',
         "so they are counted as rehire cost on the <button class=\"linkish\" data-go=\"costs\">Costs tab</button>'s ledger — at these figures, ex GST, provisional because the final total may change. In no charge on this page.",
         "with supplier cost estimated on the <button class=\"linkish\" data-go=\"costs\">Costs tab</button>: servicing uses our site quantities; other quoted costs are retained. These original quote totals are not added again. Estimates remain provisional until invoiced."),
        ('scope cost wording',
         "${k.rehire_approved ? ' and the approved rehire quotes' : ''}",
         "${k.rehire_approved ? ' and supplier cost estimates (site servicing quantities; other quote lines unchanged)' : ''}"),
        *consumer_replacements(),
        ('release footer', "+ ' · v10.67'", "+ ' · v10.68'"),
    ]


def consumer_replacements():
    # Keep every financial consumer on the same full/known cost contract.
    return [
        ('scope approval does not turn unknown into zero',
         "const rqApproved = !!(rq != null && rqAuth && rqAuth.state === 'approved');",
         "const rqApproved = !!(rqAuth && rqAuth.state === 'approved');"),
        ('coverage uses full estimate and retains known subtotal',
         'cost: k.rehire != null ? k.rehire : (k.rehire_quoted != null ? k.rehire_quoted : null), approved: !!k.rehire_approved, marked',
         'cost: k.rehire_complete1068 ? k.rehire_estimate1068 : null, knownCost1068: k.rehire_estimate1068, costComplete1068: !!k.rehire_complete1068, approved: !!k.rehire_approved, marked'),
        ('branch table names unknown full cost',
         "if (b.code === TB && rehireCost != null) { cost = rehireCost; costWords = (RH.co || 'Event Portables') + (RH.approved ? ', approved' : ', quoted, unsigned'); }",
         "if (b.code === TB && RH && !RH.costComplete1068) { costWords = 'Full supplier cost unavailable; ' + supplierKnownWords1068(RH.knownCost1068); }\n else if (b.code === TB && rehireCost != null) { cost = rehireCost; costWords = (RH.co || 'Event Portables') + (RH.approved ? ', supplier estimate' : ', supplier estimate awaiting approval'); }"),
        ('branch table known costs remain labelled',
         '${m(sum(r => r.cost))}</td></tr>',
         '${m(sum(r => r.cost))}${RH && !RH.costComplete1068 ? \'<br><span class="w">known costs only; full supplier cost unavailable</span>\' : \'\'}</td></tr>'),
        ('branch explanatory cost state',
         "${k.rehire_approved && k.rehire != null ? esc(money0(k.rehire)) + ', approved' : 'quoted cost awaiting approval'}",
         "${!k.rehire_complete1068 ? esc(supplierKnownWords1068(k.rehire_estimate1068)) + '; full supplier cost unavailable' : k.rehire_approved && k.rehire != null ? esc(money(k.rehire)) + ', supplier estimate' : 'supplier estimate awaiting approval'}"),
        ('branch source quote wording',
         'Supplier costs remain at their original quote scope; no unit allocation is inferred here.',
         'Supplier servicing cost follows the site count at quoted rates; other quoted costs retain their scope. No unit allocation is inferred here.'),
        ('visible Costs incomplete subtotal',
         '${k.rehire_approved ? ln(`<span title="${esc(PL_REHIRE)}">Rehire cost — toilets, approved</span>`, m0(k.rehire), `${esc(DATA.rehire_quotes.supplier.name)} · ${esc(PL_REHIRE)} · <b>provisional, the final total may change</b>`) : \'\'}',
         '${k.rehire_approved ? ln(`<span title="${esc(PL_REHIRE)}">${k.rehire_complete1068 ? \'Rehire cost — toilets, supplier estimate\' : \'Rehire — known supplier subtotal; incomplete\'}</span>`, k.rehire == null ? \'<span class="todo">Not confirmed</span>\' : esc(money(k.rehire)), `${esc((DATA.rehire_quotes.supplier || {}).name || \'Supplier\')} · ${esc(PL_REHIRE)} · <b>${k.rehire_complete1068 ? \'provisional until invoiced\' : \'Full supplier cost unavailable; missing amounts are not zero\'}</b>`) : \'\'}'),
        ('unsigned Costs current projection rather than quote cost',
         "${k.rehire_quoted != null && !k.rehire_approved ? ln('Rehire cost — toilets, quoted, unsigned', m0(k.rehire_quoted), 'a cost only if authorised; not added', 'faint') : ''}",
         '${!k.rehire_approved ? ln(\'Supplier cost estimate — awaiting approval\', k.rehire_estimate1068 == null ? \'<span class="todo">Not confirmed</span>\' : esc(money(k.rehire_estimate1068)), (k.rehire_complete1068 ? \'site servicing quantities at supplier rates\' : \'known subtotal only; full supplier cost unavailable\') + \'; not added without authorisation\', \'faint\') : \'\'}'),
        ('ledger split requires complete cost',
         'const qClean = rqOn && Math.abs(r2(qk.pump + qk.cons + qk.rehire) - rqAll) < 0.015;',
         'const qClean = rqOn && k.rehire_complete1068 === true && Math.abs(r2(qk.pump + qk.cons + qk.rehire) - rqAll) < 0.015;'),
        ('missing pumpout amount is not zero',
         'now: qClean ? qk.pump : 0, job: qClean ? qk.pump : 0,',
         'now: qClean ? qk.pump : k.rehire_complete1068 ? 0 : null, job: qClean ? qk.pump : k.rehire_complete1068 ? 0 : null,'),
        ('missing consumables split is not zero',
         'now: qClean ? qk.cons : 0, job: qClean ? qk.cons : 0,',
         'now: qClean ? qk.cons : k.rehire_complete1068 ? 0 : null, job: qClean ? qk.cons : k.rehire_complete1068 ? 0 : null,'),
        ('ledger coverage requires complete supplier scope',
         'const rhCover = RT.costJob != null && RT.revJob != null ? ratio(',
         'const rhCover = !RT.supplierIncomplete1068 && RT.costJob != null && RT.revJob != null ? ratio('),
        ('ledger incomplete recovery wording',
         "if (!qClean) { const wait775 = 'not readable yet: ' + (rqOn ?",
         "if (!qClean) { const wait775 = 'not readable yet: ' + (!k.rehire_complete1068 ? 'supplier costs are incomplete; known subtotals do not establish a recovery ratio' : rqOn ?"),
        ('coverage group carries missing scope explicitly',
         "costToCome:Supplier955.model().estimate,missing:RH.cost==null?['the Rehire cost']:[]",
         "costToCome:Supplier955.model().estimate,knownCost1068:RH.knownCost1068,supplierIncomplete1068:!RH.costComplete1068,missing:!RH.costComplete1068?['full supplier cost; missing amounts are not zero']:RH.cost==null?['the Rehire cost']:[]"),
        ('forecast cannot complete a missing base cost',
         'costJob: g.cost == null && !g.costToCome ? null : r2((g.cost || 0) + (g.costToCome || 0))',
         'costJob: g.supplierIncomplete1068 || (g.cost == null && !g.costToCome) ? null : r2((g.cost || 0) + (g.costToCome || 0))'),
        ('business supplier totals keep known and full scope separate',
         'T.revJob = r2(T.rev + T.revToCome); T.costJob = r2(T.cost + T.costToCome); T.share =',
         'T.supplierIncomplete1068 = groups.some(g => g.supplierIncomplete1068);\n T.knownCost1068 = r2(groups.reduce((s, g) => s + (g.cost != null ? g.cost : g.knownCost1068 || 0), 0));\n T.knownCostJob1068 = r2(T.knownCost1068 + T.costToCome);\n T.revJob = r2(T.rev + T.revToCome); T.costJob = r2(T.cost + T.costToCome);\n if (T.supplierIncomplete1068) { T.cost = null; T.costJob = null; }\n T.share ='),
        ('coverage explicitly blocks incomplete scope',
         'function rh769Cover(rev, cost, withCrew){\n if (cost == null)',
         "function rh769Cover(rev, cost, withCrew, complete1068 = true){\n if (!complete1068) return 'full supplier cost unavailable — coverage cannot be checked';\n if (cost == null)"),
        ('group coverage requires complete supplier scope',
         '!!g.installation))}</span>',
         '!!g.installation, !g.supplierIncomplete1068))}</span>'),
        ('business coverage requires complete supplier scope',
         'R.groups.some(g => g.installation)))}',
         'R.groups.some(g => g.installation), !T.supplierIncomplete1068))}'),
        ('show incomplete scope beside coverage subtotal',
         '${g.cost != null ? `<br><span class="acc761-w">${esc(g.costState)}</span>` : \'\'}',
         '${g.cost != null || g.supplierIncomplete1068 ? `<br><span class="acc761-w">${esc(g.costState)}</span>` : \'\'}'),
        ('coverage on-record metric names known subtotal',
         "fin745Card('Rehire cost — on the record', money0(T.cost), `Event Portables’ quotes and Advanced’s dockets ·",
         "fin745Card(T.supplierIncomplete1068 ? 'Rehire cost — known subtotal' : 'Rehire cost — on the record', money(T.supplierIncomplete1068 ? T.knownCost1068 : T.cost), `${T.supplierIncomplete1068 ? 'Full supplier cost unavailable; ' : ''}supplier estimates and Advanced’s dockets ·"),
        ('coverage job-end metric names known subtotal',
         "fin745Card('Rehire cost — to job end', money0(T.costJob), `+",
         "fin745Card(T.supplierIncomplete1068 ? 'Rehire to job end — known subtotal' : 'Rehire cost — to job end', money(T.supplierIncomplete1068 ? T.knownCostJob1068 : T.costJob), `${T.supplierIncomplete1068 ? 'Full supplier cost unavailable; ' : ''}+"),
        ('monthly undated cost keeps existing costing branch',
         "return unallocated(out.unallocatedCosts, 'Toilets — supplier quote', 'KINP', ex, acc762QuoteDateWarning(q), {quote: q.quote})",
         "return unallocated(out.unallocatedCosts, 'Toilets — supplier cost estimate', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', ex, acc762QuoteDateWarning(q) + (!q.costComplete1068 ? '; known subtotal only, full supplier cost unavailable' : ''), {quote: q.quote, supplierIncomplete1068: !q.costComplete1068})"),
        ('monthly unknowns cannot masquerade as fully priced rows',
         'row.extra.sourceCount++; row.extra.forecastAmount = acc762Round',
         'if (e.supplierIncomplete1068) row.extra.unpricedCount++;\n row.extra.sourceCount++; row.extra.forecastAmount = acc762Round'),
        ('monthly incomplete cost action precedes planned or accrual logic',
         "const st = acc762RowStatus(r), e = r.extra || {}, amt = r.kind === 'revenue' ? r.amount : r.candidate, fa = Number(e.forecastAmount) || 0;",
         "const st = acc762RowStatus(r), e = r.extra || {}, amt = r.kind === 'revenue' ? r.amount : r.candidate, fa = Number(e.forecastAmount) || 0;\n if (r.kind !== 'revenue' && (e.supplierIncomplete1068 || (e.sources || []).some(s => s.supplierIncomplete1068))) return {key: 'incomplete', badge: 'Incomplete', toDate: null, planned: null, words: 'Known subtotal only; confirm missing supplier amounts before deciding a full cost or accrual.'};"),
        ('monthly presentation follows renamed stream',
         ".replace('Toilets — supplier quote, provisional day-share', 'Toilets — Event Portables, rehire cost')",
         ".replace('Toilets — supplier cost estimate, provisional day-share', 'Toilets — Event Portables, supplier cost estimate')"),
        ('monthly full cost remains unavailable',
         "out.notes.push('Cost candidates are source amounts, not amounts to accrue. No automatic subtraction of unmatched invoices and no inference of payment from an invoice.');",
         "out.supplierIncomplete1068 = !supplierService1068() || !supplierService1068().complete;\n out.supplierFullCost1068 = out.supplierIncomplete1068 ? null : supplierService1068().total;\n if (out.supplierIncomplete1068) out.notes.push('Supplier cost is incomplete; displayed cost candidates include known subtotals only. Missing supplier amounts are not zero.');\n out.notes.push('Cost candidates are source amounts, not amounts to accrue. No automatic subtraction of unmatched invoices and no inference of payment from an invoice.');"),
        ('forecast supplier amount preserves unavailable value',
         "const rq = Number(k.rehire) || 0; push('Toilets — Event Portables, rehire cost', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', rq, 0,",
         "const rq = k.rehire; push(k.rehire_complete1068 ? 'Toilets — Event Portables, rehire cost' : 'Toilets — known supplier subtotal; incomplete', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', rq, rq == null ? null : 0,"),
        ('forecast supplier missing amount is a visible gap',
         "gap('Event Portables — invoice and PO reconciliation',",
         "if (!k.rehire_complete1068) gap('Supplier cost incomplete — full amount unavailable', supplierKnownWords1068(k.rehire_estimate1068) + '; ' + supplierCostWords1068(), 'Supplier source reconciliation');\n gap('Event Portables — invoice and PO reconciliation',"),
    ]


def patch(html):
    if MARKER in html:
        raise ValueError('v10.68 supplier cost patch already applied')
    if "+ ' · v10.67'" not in html:
        raise ValueError('v10.68 requires the verified v10.67 page')
    if 'shapes1060-script' not in html or 'function servicing748()' not in html:
        raise ValueError('v10.68 requires the current map and shared servicing model')
    for label, before, after in replacements():
        html = rep(html, before, after, label, 'v10.68')
    return html


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(patch(path.read_text()))
    print('Applied v10.68 supplier servicing cost consistency; source quotes and Revenue preserved.')
