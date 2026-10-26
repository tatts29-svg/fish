"""Author: Andrew Fisher. Explicit, source-bound customer-charge treatments."""
import os
import hashlib
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep
from navigation1243_patch import patch as patch_navigation1243
from identity_index1243_patch import patch as patch_identity1243
from local_reads1243_patch import patch as patch_local_reads1243
from event_window1243_patch import patch as patch_event_window1243


def patch(text, path, expected_base_sha=None):
    if 'id="charge1239-script"' in text:
        raise ValueError('v12.43 is already applied')
    if 'id="eventcrew1237-script"' not in text:
        raise ValueError('v12.43 requires the event-crew reconciliation release')
    expected = expected_base_sha or os.environ.get('GC500_V1243_BASE_SHA256', '')
    if not re.fullmatch(r'[a-f0-9]{64}', expected):
        raise ValueError('v12.43 requires an explicit reviewed base SHA-256')
    if hashlib.sha256(text.encode()).hexdigest() != expected:
        raise ValueError('v12.43 base SHA-256 changed; rebuild from the reviewed live source')
    if 'id="performance1241-script"' not in text:
        raise ValueError('v12.43 requires the performance release')
    versions = re.findall(r"\+' · v(12\.(?:41|42))';", text)
    if len(versions) != 1:
        raise ValueError('Expected exactly one v12.41 or v12.42 footer')

    def change(old, new, what):
        nonlocal text
        if text.count(old) != 1:
            raise ValueError(what + ': expected one exact source match, got ' + str(text.count(old)))
        start = text.index(old)
        text = text[:start] + rep(old, old, new, what, path) + text[start + len(old):]

    change("function qAnswer(id){ return (S.answers || {})[id] || ''; }",
           "function qAnswer(id){ const value=(S.answers || {})[id]; return typeof value==='string'?value:''; }",
           'question answers remain string-only')
    change("function setQAnswer(id, v){",
           "function setQAnswer(id, v){\n if(String(id).startsWith('charge-treatment1239|')){flash('Use the customer-charge treatment control for this decision.');return false;}",
           'financial decisions cannot be overwritten by a question note')
    change("function calculate(row,e,charge,actuals){\n  if(!e||!charge||charge.treatment||!['per day','whole event'].includes(charge.how))return null;",
           "function calculate(row,e,charge,actuals){\n  if(['own_use_hire','included_elsewhere_hire'].includes(charge?.treatment)&&charge.ordinary1239)charge=charge.ordinary1239;\n  if(!e||!charge||charge.treatment||!['per day','whole event'].includes(charge.how))return null;",
           'supplier period estimate retains its ordinary source basis')
    old="return Object.assign({}, l, {key: k, card_line: null, card_rate: null, their_amount: theirAmount, their_rate: floor, period: ql && ql.period ? ql.period : null, rate, from: typed != null && !under ? 'typed' : 'at cost', typed_under: under ? typed : null, amount: cents(qty * rate), covered: true}); });"
    new="const customer1239=Object.assign({}, l, {key: k, card_line: null, card_rate: null, their_amount: theirAmount, their_rate: floor, period: ql && ql.period ? ql.period : null, rate, from: typed != null && !under ? 'typed' : 'at cost', typed_under: under ? typed : null, amount: cents(qty * rate), covered: true}); return window.ChargeTreatment1239?ChargeTreatment1239.water(customer1239):customer1239; });"
    change(old,new,'only the separate customer service charge is treated')
    change("ownUse = rows.filter(r => ch.get(r).treatment === 'own_use');", "ownUse = rows.filter(r => ['own_use','own_use_hire'].includes(ch.get(r).treatment));", 'hire-only own-use classification')
    change("own_use: plant.filter(r => ch.get(r).treatment === 'own_use').length", "own_use: plant.filter(r => ['own_use','own_use_hire'].includes(ch.get(r).treatment)).length", 'plant reporting recognises hire-only treatment')
    change("const included = rows.filter(r => ch.get(r).treatment === 'included'), ownUse =", "const included = rows.filter(r => ch.get(r).treatment === 'included'), coveredHire1239 = rows.filter(r => ch.get(r).treatment === 'included_elsewhere_hire'), ownUse =", 'separate covered-hire reporting group')
    change("classified: included.length + ownUse.length, included:", "classified: included.length + ownUse.length + coveredHire1239.length, covered_hire: {lines: coveredHire1239.length, items: coveredHire1239.map(one)}, included:", 'covered hire stays visible and separately classified')
    change("included: plant.filter(r => ch.get(r).treatment === 'included').length, own_use:", "covered_hire: plant.filter(r => ch.get(r).treatment === 'included_elsewhere_hire').length, included: plant.filter(r => ch.get(r).treatment === 'included').length, own_use:", 'plant reporting keeps covered hire separate from own use')
    change("if (figures && figures.included && figures.included.lines) words.push", "if (figures && figures.covered_hire && figures.covered_hire.lines) words.push(figures.covered_hire.lines + ' hire lines included in another customer charge');\n if (figures && figures.included && figures.included.lines) words.push", 'covered-hire summary does not imply toilet-block or own-use treatment')
    change("' \\u2014 no separate customer hire charge. Confirmed by the project manager, 1 Oct 2026.</span>'", "' \\u2014 no separate customer hire charge. '+(figures?.covered_hire?.lines||figures?.own_use?.items?.some(x=>x.treatment==='own_use_hire')?'Confirmation and source are retained on each treated line.':'Confirmed by the project manager, 1 Oct 2026.')+'</span>'", 'current decisions never inherit a historical confirmation date')
    change("${c.included && c.included.lines ? `<span class=\"contract-coverage747\">Included in toilet-block hire", "${c.covered_hire && c.covered_hire.lines ? `<span class=\"contract-coverage747\">Hire included in another customer charge</span><b>${c.covered_hire.lines} lines</b>` : ''}\n${c.included && c.included.lines ? `<span class=\"contract-coverage747\">Included in toilet-block hire", 'existing contract plate shows the distinct covered-hire group')
    change("const box = (k, v, ph) => ro ? '' : `<input class=\"rate\" data-lr748=\"${esc(k)}\" inputmode=\"decimal\" value=\"${v != null ? esc(String(v)) : ''}\" placeholder=\"${esc(ph)}\" aria-label=\"Rate\">`;",
           "const box = (k, v, ph) => (ro ? '' : `<input class=\"rate\" data-lr748=\"${esc(k)}\" inputmode=\"decimal\" value=\"${v != null ? esc(String(v)) : ''}\" placeholder=\"${esc(ph)}\" aria-label=\"Rate\">`) + (window.ChargeTreatment1239?ChargeTreatment1239.control(k)+ChargeTreatment1239.details(k):'');", 'reuse each existing rate-row control')
    change("<h4>Toilet servicing and water — priced by us at our pump-out rates, the water at what we are charged</h4>", "<h4>${sv.at_cost.some(l=>l.chargeTreatment1239)?'Toilet servicing and water — confirmed customer-charge coverage':'Toilet servicing and water — priced by us at our pump-out rates, the water at what we are charged'}</h4>", 'servicing heading follows explicit coverage')
    old="<p class=\"hint\">Site quantities × event nights: the pump-outs and cleans at the card's rates; the water truck, the pre-fill, the deliveries and the drinking-water tank — no line on the card — at what Event Portables charge us (Andrew, 1 Oct 2026: \"what we charge should cover what we get charged\").${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${esc(money(sv.their_water))} ex GST; both are included once in supplier cost. Type a rate to change one; an empty box puts the card's, or the supplier's, back; a rate under the supplier's figure is not applied.${ro ? ' Rates are changed on the editing link.' : ''}</p>"
    new="<p class=\"hint\">${sv.at_cost.some(l=>l.chargeTreatment1239)?'Site quantities × event nights at the card’s pump-out rates. '+esc(ChargeTreatment1239.waterWords(sv)):'Site quantities × event nights: the pump-outs and cleans at the card’s rates; separate water services at the supplier figure or an eligible customer override.'} ${esc(supplierCostWords1068(sv.supplier1068))} Water remains ${esc(money(sv.their_water))} ex GST inside supplier cost. An ordinary rate under the supplier figure is not applied; a confirmed inclusion is recorded separately.${ro ? ' Rates and treatments are changed on the editing link.' : ''}</p>"
    change(old,new,'customer inclusions and supplier costs have distinct wording')
    change("${l.from === 'card' ? 'card: ' + esc(l.card_line)", "${l.chargeTreatment1239 ? esc(l.treatmentLabel1239) : l.from === 'card' ? 'card: ' + esc(l.card_line)", 'service rate basis names inclusion')
    change("${l.typed_under != null ? ` <span class=\"chip cand\">", "${l.typed_under != null && !l.chargeTreatment1239 ? ` <span class=\"chip cand\">", 'confirmed inclusion is not an ordinary under-floor rate')
    old="${sv.at_cost.length ? `<p class=\"hint\">The water lines are charged on at the supplier's figure — ${esc(money0(sv.at_cost_total))} — because what we charge should cover what we get charged (Andrew, 1 Oct 2026). A rate typed above stands in; one under the supplier's figure is not applied and says so.</p>` : ''}"
    new="${sv.at_cost.length ? `<p class=\"hint\">${sv.at_cost.some(l=>l.chargeTreatment1239)?esc(ChargeTreatment1239.waterWords(sv)):'Separate quoted water services are charged at the supplier figure or an eligible customer override.'} Additional water Revenue: ${esc(money(sv.at_cost_total))} ex GST.</p>` : ''}"
    change(old,new,'water subtotal explains separate customer amount')
    change("(the water lines are beside, at what we are charged). This is Revenue.", "(${sv.at_cost.some(l=>l.chargeTreatment1239)?'confirmed water inclusions are shown beside the separate customer charges':'the water lines are beside, at what we are charged'}). This is Revenue.", 'service question describes current treatment')
    change("q: 'Water services — charged on at what we are charged',", "q: sv.at_cost.some(l=>l.chargeTreatment1239)?'Water services — confirmed customer-charge coverage':'Water services — charged on at what we are charged',", 'water question heading')
    old="why: `Andrew, 1 Oct 2026: “all our cost — what we charge should cover what we get charged.” The water lines on the Event Portables quotes have no line on the card, so each is charged to the V8s at the quote’s own figure — ${money0(sv.at_cost_total)} ex GST in all — until the branch puts a rate on (a rate typed on Costs stands in; one under the supplier’s figure is not applied). Revenue; the same cost stays in the Rehire cost.`,"
    new="why: sv.at_cost.some(l=>l.chargeTreatment1239)?ChargeTreatment1239.waterWords(sv):`Separate water services use the supplier figure or an eligible customer override — ${money0(sv.at_cost_total)} ex GST. The supplier’s amount remains in Rehire cost.`,"
    change(old,new,'water question distinguishes inclusion from a rate change')
    change("l.description + ' · charged ' + money(l.amount) + (l.from === 'typed'", "l.description + ' · '+(l.chargeTreatment1239?'included in pump-out charges; additional ':'charged ') + money(l.amount) + (l.from === 'typed'", 'question row coverage')
    old="if (water753.length) { const sv769 = servicing748(); caveats.push(`the water services (${water753.map(l => l.description).join(', ')}) are charged on at what Event Portables charge us, ${money0(sv769 ? sv769.at_cost_total : 0)} — the project manager, 1 Oct: “what we charge should cover what we get charged” — until the branch puts a rate on`); caveats_short.push('water charged on at cost'); }"
    new="if (water753.length) { const sv769 = servicing748(),included1239=sv769?.at_cost?.some(l=>l.chargeTreatment1239); caveats.push(included1239?ChargeTreatment1239.waterWords(sv769):`Separate water services are charged at the supplier figure or an eligible customer override, ${money0(sv769 ? sv769.at_cost_total : 0)} ex GST.`); caveats_short.push(included1239?'water inclusion recorded':'water charged on at cost'); }"
    change(old,new,'financial caveat follows explicit inclusion')
    change('<h4 class="subhd">The staff <span>— people × hours a person, each day, at the rate an hour</span></h4>',
           '<h4 class="subhd">The staff <span>— ${F.chargeTreatment1239?"confirmed whole-crew customer hours where recorded; other lines retain their agreed people and hours":"people × hours a person, each day, at the rate an hour"}</span></h4>',
           'event customer aggregate is visibly separate from the individual source plan')
    change('<h4 class="subhd">The access plan <span>— the times every line is worked out from</span></h4>',
           '<h4 class="subhd">The access plan <span>— ${F.chargeTreatment1239?"original planned times; an explicitly confirmed crew total is shown separately below":"the times every line is worked out from"}</span></h4>',
           'access-plan wording distinguishes an approved customer aggregate')
    text=patch_navigation1243(text,path)
    text=patch_identity1243(text,path)
    text=patch_local_reads1243(text,path)
    text=patch_event_window1243(text,path)
    src=Path(__file__).with_name('charge1239_src.js').read_text()
    end=text.rfind('\n</body>')
    if end<0 or text[end:].strip()!='</body>\n</html>':
        raise ValueError('Expected the final page body boundary')
    tail=text[end:]
    text=text[:end]+rep(tail,tail,'\n<script id="charge1239-script">\n'+src+'\n</script>'+tail,'native customer-charge treatment module',path)
    change("+' · v"+versions[0]+"';","+' · v12.43';",'release footer')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text(), str(target)))
    print('v12.43 source-bound customer-charge treatments applied')
