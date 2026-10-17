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
         "return SupplierService1068.decorate(Object.assign({}, base, {lines: all, card_lines: lines, total: cents(all.reduce((t, l) => t + l.amount, 0)), card_total: cents(lines.reduce((t, l) => t + l.amount, 0)), per1040: per, nights1040: N}), DATA.rehire_quotes, (DATA.toilet_servicing.lines || []).filter(l => NIGHT1040.some(n => n.card_line === l.card_line)));"),
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
         "if (rqApproved) { caveats.push(`supplier cost ${money0(rq)} ex GST${supplier1068.complete ? '' : ' known subtotal; incomplete'} — servicing on the site count at supplier rates; other quoted lines unchanged. ${supplierCostWords1068(supplier1068)} Approved scope dated ${fmtDay(rqAuth.stated_on).dm}; provisional until invoiced`); caveats_short.push('supplier cost estimate; invoice not confirmed'); }"),
        ('monthly cost uses derived supplier lines',
         "((DATA.rehire_quotes || {}).quotes || []).forEach(q => {\n const from = acc762Date(q.delivery) || acc762Date(q.use_on), to = acc762Date(q.collect) || acc762Date(q.use_on);\n const ex = acc762Round((Number(q.sub_total) || 0) + (Number(q.delivery_charge) || 0) + (Number(q.pickup) || 0));",
         "supplierCostQuotes1068().forEach(q => {\n const from = acc762Date(q.delivery) || acc762Date(q.use_on), to = acc762Date(q.collect) || acc762Date(q.use_on);\n const ex = q.costTotal1068;\n if (ex == null) return unallocated(out.unallocatedCosts, 'Toilets — supplier cost incomplete', 'KINP', null, 'Supplier quote totals need reconciliation', {quote: q.quote});"),
        ('monthly supplier description',
         "addCost('Toilets — supplier quote, provisional day-share', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', share.amount, q.quote + ' · ' + share.days + ' of ' + share.span + ' quoted days, including a provisional share of transport; Finance must confirm cost timing and invoice/payment coverage', {quote: q.quote, from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount, provisionalAllocation: true});",
         "addCost('Toilets — supplier cost estimate, provisional day-share', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', share.amount, q.quote + ' · servicing uses the site count; other quote lines unchanged · ' + share.days + ' of ' + share.span + ' quoted days, including a provisional share of transport; Finance must confirm cost timing and invoice/payment coverage. ' + supplierCostWords1068(), {quote: q.quote, from, to, status: acc762Status(from, month, asAt), forecastAmount: share.forecastAmount, provisionalAllocation: true, supplierIncomplete1068: !supplierService1068().complete});"),
        ('ledger cost split uses derived supplier lines',
         'const Q = (DATA.rehire_quotes && DATA.rehire_quotes.quotes) || [];',
         'const Q = supplierCostQuotes1068();'),
        ('forecast supplier basis',
         "`the four approved quotes ex GST, counted whole on the P&L (${k.rehire_approved ? 'approved on Andrew’s word' : 'quoted'}); no invoice yet`",
         "`supplier cost estimate ex GST, counted once on the P&L (${k.rehire_approved ? 'approved scope' : 'awaiting approval'}); servicing uses the site count at supplier rates, other quote lines unchanged; no invoice yet`"),
        ('coverage supplier basis',
         "basis:'Contract revenue follows confirmed ownership. Approved quote totals and their existing costing branch are unchanged; quote coverage is not allocated to individual units.'",
         "basis:'Contract revenue follows confirmed ownership. Servicing cost follows the site count at supplier rates; other quoted costs and the costing branch are unchanged. Quote coverage is not allocated to individual units.'"),
        ('coverage cost state',
         "costState:RH.cost==null?'not on the record':RH.approved?(Supplier955.model().estimate?'approved quotes + provisional estimate':'approved — the final total may change'):'quoted, unsigned'",
         "costState:RH.cost==null?'not on the record':RH.approved?(!supplierService1068().complete?'known supplier costs; incomplete':'supplier cost estimate — not an invoice'):'quoted, unsigned'"),
        ('ledger split description',
         "const inside = rqOn ? 'inside the Rehire figure above — the four quotes are carried whole because their lines did not split to the cent' : 'not counted until the quotes are approved';",
         "const inside = rqOn ? 'inside the Rehire figure above — supplier cost projections did not split to the cent' : 'not counted until the supplier scope is approved';"),
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
        ('release footer', "+ ' · v10.67'", "+ ' · v10.68'"),
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
