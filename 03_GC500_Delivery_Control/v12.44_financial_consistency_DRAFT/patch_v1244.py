"""Author: Andrew Fisher. Reconcile included customer water across financial views."""
import hashlib, os, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
from fwf_labour1244_patch import patch as patch_fwf
CHANGES = [
    (
        ' ${sv.lines.map(l => `<tr><td>${esc(l.description)}',
        ' ${sv.lines.map(l => `<tr><td>${esc(CustomerWater1244.description(l,fmtNum))}',
        'describe approved customer service quantity separately from site record',
    ),
    (
        ' ${sv ? `<h4>Toilet servicing and water — priced by us at our pump-out rates, the water at what we are charged</h4>',
        ' ${sv ? `<h4>Toilet servicing — water included in pump-out charges</h4>',
        ' ${sv ? `<h4>Toilet servicing and water',
    ),
    (
        ' <p class="hint">Site quantities × event nights: the pump-outs and cleans at the card\'s rates; the water truck, the pre-fill, the deliveries and the drinking-water tank — no line on the card — at what Event Portables charge us (Andrew, 1 Oct 2026: "what we charge should cover what we get charged").${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${esc(money(sv.their_water))} ex GST; both are included once in supplier cost. Type a rate to change one; an empty box puts the card\'s, or the supplier\'s, back; a rate under the supplier\'s figure is not applied.${ro ? \' Rates are changed on the editing link.\' : \'\'}</p>',
        ' <p class="hint">Customer pump-outs and cleaning use the selected service quantities and rates, including the recorded Baseplan adjustments. Water is included in the pump-out charges and has no separate customer charge.${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${esc(money(sv.their_water))} ex GST in supplier cost. Supplier costs and site quantities are unchanged.${ro ? \' Rates are changed on the editing link.\' : \'\'}</p>',
        ' <p class="hint">Site quantities × event nights:',
    ),
    (
        "${l.from === 'card' ? 'card: '",
        "${l.included1244 ? 'Included in pump-out charges' : l.from === 'card' ? 'card: '",
        "${l.from === 'card' ? 'card: '",
    ),
    (
        '${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), String(l.card_rate != null ? l.card_rate : l.their_rate))}',
        "${l.included1244 ? 'Included' : esc(money(l.rate)) + ' ' + box(l.key, lr748Typed(l.key), String(l.card_rate != null ? l.card_rate : l.their_rate))}",
        '${esc(money(l.rate))} ${box(l.key, lr748Typed(l.key), S',
    ),
    (
        ' ${sv.at_cost.length ? `<p class="hint">The water lines are charged on at the supplier\'s figure — ${esc(money0(sv.at_cost_total))} — because what we charge should cover what we get charged (Andrew, 1 Oct 2026). A rate typed above stands in; one under the supplier\'s figure is not applied and says so.</p>` : \'\'}` : \'\'}',
        ' ${sv.at_cost.length ? `<p class="hint">Water is included in the pump-out charges. The supplier water cost of ${esc(money(sv.their_water))} remains separate and is counted once in Direct costs.</p>` : \'\'}` : \'\'}',
        ' ${sv.at_cost.length ? `<p class="hint">The water lines',
    ),
    (
        " if (sv.at_cost && sv.at_cost.length) done({group: 'By branch', id: 'water-service-rate753', q: 'Water services — charged on at what we are charged',",
        " if (sv.at_cost && sv.at_cost.length) done({group: 'By branch', id: 'water-service-rate753', q: 'Water services — included in pump-out charges',",
        ' if (sv.at_cost && sv.at_cost.length) done({group:',
    ),
    (
        ' why: `Andrew, 1 Oct 2026: “all our cost — what we charge should cover what we get charged.” The water lines on the Event Portables quotes have no line on the card, so each is charged to the V8s at the quote’s own figure — ${money0(sv.at_cost_total)} ex GST in all — until the branch puts a rate on (a rate typed on Costs stands in; one under the supplier’s figure is not applied). Revenue; the same cost stays in the Rehire cost.`,',
        ' why: `Water is included in the pump-out charges, with no separate customer charge (Andrew, 27 Oct 2026). Supplier water cost remains ${money(sv.their_water)} ex GST, counted once in Direct costs.`,',
        ' why: `Andrew, 1 Oct 2026: “all our cost',
    ),
    (
        " if (water753.length) { const sv769 = servicing748(); caveats.push(`the water services (${water753.map(l => l.description).join(', ')}) are charged on at what Event Portables charge us, ${money0(sv769 ? sv769.at_cost_total : 0)} — the project manager, 1 Oct: “what we charge should cover what we get charged” — until the branch puts a rate on`); caveats_short.push('water charged on at cost'); }",
        " if (water753.length) { caveats.push('Water is included in the pump-out charges, with no separate customer charge; supplier water costs remain in Direct costs (Andrew, 27 Oct 2026).'); caveats_short.push('water included in pump-outs'); }",
        ' if (water753.length) { const sv769',
    ),
    (
        "  {key: 'pump', code: '1032', line: 'Toilet Pumpouts', what: 'servicing at our pump-out rates; the water truck and the pre-fill at what we are charged', now: pump, job: pump,",
        "  {key: 'pump', code: '1032', line: 'Toilet Pumpouts', what: 'customer pump-outs and cleaning; water included with no separate customer charge', now: pump, job: pump,",
        "  {key: 'pump', code: '1032', line:",
    ),
    (
        "   basis: sv ? `Site quantities × event nights at the card’s pump-out rates ${money0(sv.card_total)} + the water truck and the pre-fill at cost ${money0(waterPump)} · on no contract line yet: the branch adds the lines when it bills` : 'no servicing on the record'},",
        "   basis: sv ? `Selected customer servicing quantities and rates, including the recorded Baseplan adjustments: ${money(sv.card_total)}. Water is included; supplier costs remain separate.` : 'no servicing on the record'},",
        '   basis: sv ? `Site quantities × event nights',
    ),
    (
        "  {name: 'Consumables Recovery', what: 'Consumables ÷ Consumables cost', now: ratio(rv('cons').now, co('cons').now), job: ratio(rv('cons').job, co('cons').job), words: co('cons').now > rv('cons').now ? `the water is charged on at the quote’s line figures; the quote’s delivery and pickup (${money0(r2(co('cons').now - rv('cons').now))}) are not charged on yet` : 'the water charged on at what we are charged'},",
        "  {name: 'Consumables Recovery', what: 'Consumables Revenue ÷ recorded consumables cost', now: null, job: null, words: 'Not comparable yet: customer consumables are the separate contract paper, hand towel and shade-cloth lines; this supplier cost contains water. Water is included in customer pump-outs. Finance must align the scopes before a recovery ratio is shown.'},",
        "  {name: 'Consumables Recovery',",
    ),
    (
        '(the water lines are beside, at what we are charged)',
        '(water is included, with no separate customer charge)',
        '(the water lines are beside, at what we are charged)',
    ),
    (
        'servicing and water ${money0(M.charge.servicing)} in it (pump-outs at our rates, water at what we are charged), on no contract line yet',
        'servicing ${money(M.charge.servicing)} in it; water included with no separate customer charge',
        'servicing and water ${money0(M.charge.servicing)} in it',
    ),
    (
        "servicing and water ${money0(X.charge.servicing)} — pump-outs at our card's rates, water at what we are charged — is in the revenue; on no contract line yet",
        'servicing ${money(X.charge.servicing)} is in Revenue; water included with no separate customer charge',
        'servicing and water ${money0(X.charge.servicing)} — pum',
    ),
    (
        'Toilet servicing and water charged on — pump-outs and cleans at the card, water at cost (on no contract yet)',
        'Toilet servicing — selected customer quantities and rates; water included',
        'Toilet servicing and water charged on — pump-outs and c',
    ),
    (
        'Toilet servicing, cleaning and water — ${esc(pl760ToiletBranch())} rehire, priced by us at our pump-out rates · the water at what we are charged',
        'Toilet servicing and cleaning — ${esc(pl760ToiletBranch())}; water included in pump-out charges',
        'Toilet servicing, cleaning and water — ${esc(pl760Toile',
    ),
    (
        "tag('priced by us · the card + at cost', 'est')",
        "tag('selected customer servicing rates', 'est')",
        "tag('priced by us · the card + at cost', 'est')",
    ),
    (
        "return `Site quantities × event nights, with the quoted water lines: ${parts.join(' · ')}. The pump-outs and cleans are at our card’s rates. The water is at what Event Portables charge us — Andrew, 1 Oct: “what we charge should cover what we get charged” — until the branch puts a rate on; a rate typed on Costs stands in.${under}${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${money(sv.their_water)} ex GST, inside supplier cost. Rehire Revenue on no contract line yet: the branch adds the lines when it bills. Servicing and cleaning are not labour.`;",
        "return `Selected customer servicing quantities and rates: ${parts.join(' · ')}. Recorded Baseplan adjustments apply to customer charges. Water is included in the pump-out charges and has no separate customer charge.${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${money(sv.their_water)} ex GST inside supplier cost. Servicing and cleaning are not labour.`;",
        'return `Site quantities × event nights, with the quoted',
    ),
    (
        'The water lines have no line on the card and are charged on at what we are charged (Andrew, 1 Oct 2026: “what we charge should cover what we get charged”). Included in the revenue estimate at these selected rates — see From the Street Rate Card 2026, below — and on no contract line yet.',
        'Water is included in the pump-out charges with no separate customer charge. Its supplier cost remains separate. Customer servicing uses the selected rates and recorded Baseplan adjustments.',
        'The water lines have no line on the card and are charge',
    ),
    (
        'of servicing and water the P&L posts to Toilet Pumpouts and Consumables below',
        'of customer servicing the P&L posts to Toilet Pumpouts below; water is included',
        'of servicing and water the P&L posts to Toilet Pumpouts',
    ),
]

def patch(text,path='page',expected_base_sha=None):
    expected=expected_base_sha or os.environ.get('GC500_V1244_BASE_SHA256','')
    if not re.fullmatch(r'[a-f0-9]{64}',expected) or hashlib.sha256(text.encode()).hexdigest()!=expected:
        raise ValueError('v12.44 requires the exact reviewed base SHA-256')
    if 'CustomerWater1244' in text: raise ValueError('v12.44 already applied')
    if text.count("+' · v12.43';")!=1: raise ValueError('v12.44 requires verified v12.43')
    source=(ROOT/'customer_water1244.js').read_text()
    anchor="/* v10.43 - names-1043: exports and copies carry the person's name only, like the screen. */"
    wrapper="\n;(function(){const native=servicing748;servicing748=function(){return CustomerWater1244.project(native.apply(this,arguments));};try{window.servicing748=servicing748;}catch(e){}})();\n"
    text=rep(text,anchor,source+wrapper+anchor,'shared customer water projection',path)
    for old,new,name in CHANGES:
        text=rep(text,old,new,name,path)
    text=patch_fwf(text,rep,path)
    return rep(text,"+' · v12.43';","+' · v12.44';",'footer',path)

if __name__=='__main__':
    page=Path(sys.argv[1]);text=page.read_text();page.write_text(patch(text,str(page)));print('patch_v1244 applied')
