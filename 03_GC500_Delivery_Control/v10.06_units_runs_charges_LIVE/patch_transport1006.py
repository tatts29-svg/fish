"""Author: Andrew Fisher. Transport Revenue moves with received equipment once."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="transport1006-script"' in html: raise ValueError('Transport v10.06 already applied')
    if 'function onsiteComplete979()' not in html: raise ValueError('Wrong transport baseline')
    changes={
        'subhire: C.subhire.charge, delivery: C.transport.charge,':'subhire: C.subhire.charge, delivery: cents(C.transport.charge + buildingTransportModel831().actualAdditional1006), transportArrived1006: buildingTransportModel831().actualAdditional1006,',
        'charge.fencing + charge.other + charge.servicing);':'charge.fencing + charge.other + charge.servicing + charge.transportArrived1006);',
        'const hire = r2(n(c.contracts) - n(c.delivery) - rehireLines + fire)':'const hire = r2(n(c.contracts) - (n(c.delivery) - n(c.transportArrived1006)) - rehireLines + fire)',
        " add('fencing', X.fd.charged || null, 'charge');":" add('transport', X.charge.transportArrived1006 || null, 'charge');\n add('fencing', X.fd.charged || null, 'charge');",
        'const ratio=t.quantity>0?Math.min(1,i.arrived/t.quantity):0;cartage+=':'if(Number.isFinite(t.actualAdditional1006)){cartage+=t.actualAdditional1006+t.actualCovered1006;continue;}\n const ratio=t.quantity>0?Math.min(1,i.arrived/t.quantity):0;cartage+=',
        'transportToCome: buildingTransport.uncoveredAdditional':'transportToCome: buildingTransport.remainingAdditional1006',
        '+ F.revenue +buildingTransport.uncoveredAdditional + labourRevenue858()':'+ F.revenue +buildingTransport.remainingAdditional1006 + labourRevenue858()',
        "(X.buildingTransport.rows||[]).filter(r=>r.additional>0).forEach(r=>revenueForecastRows.push({branch:branchOf(r.ref).code,amount:r.additional}));":"(X.buildingTransport.rows||[]).filter(r=>r.remainingAdditional1006>0).forEach(r=>revenueForecastRows.push({branch:r.branch,amount:r.remainingAdditional1006}));",
        "const prov = Object.fromEntries((BT.byBranch || []).map(b => [b.branch || '—', b.uncoveredAdditional || 0]));":"const prov = Object.fromEntries((BT.byBranch || []).map(b => [b.branch || '—', b.remainingAdditional1006 || 0]));",
        'revenueTotal: cents(CF.transport.charge || 0), provisionalTotal: cents(BT.uncoveredAdditional || 0)':'revenueTotal: cents((CF.transport.charge || 0) + BT.actualAdditional1006), provisionalTotal: cents(BT.remainingAdditional1006 || 0)',
        "cents((BT.byBranch || []).reduce((s, b) => s + (b.uncoveredAdditional || 0), 0))":"cents((BT.byBranch || []).reduce((s, b) => s + (b.remainingAdditional1006 || 0), 0))",
        "part('Transport — the contracts’ charge lines', V.revenueTotal)":"part('Transport — contract lines and arrived charges', V.revenueTotal)",
        " /* the carrier plan of 7 Sep and the pairings the record holds against it */":" for(const row of BT.rows.filter(r=>r.actualAdditional1006>0))lines.push({id:'arrived1006|'+row.id,contract:row.manualTransport1006?'Recorded rate':'2026 card',line:row.leg,branch:row.branch,description:row.ref+' · '+row.item+' · '+(row.leg==='delivery'?'Delivery':'Pickup'),qty:row.uncoveredQuantity*row.receivedRatio1006,charge:row.actualAdditional1006,how:row.manualTransport1006?'recorded':'card',basis:row.rateSource,docket:null,covers:[row.ref],card1006:true});\n /* the carrier plan of 7 Sep and the pairings the record holds against it */",
        "fin745Card('Transport Revenue on the contracts', money(V.revenueTotal)":"fin745Card('Transport Revenue included', money(V.revenueTotal)",
        '4. Transport Revenue — the contracts’ delivery and pickup lines':'4. Transport Revenue — contract and arrived charges',
        '<p>What is charged on, by the branch on the contract. ${V.provisionalTotal':'<p>Contract charges plus uncovered transport charges for received equipment, by branch. ${V.provisionalTotal',
        "['Labour ticked per piece', ch.labour], ['Other charge lines', ch.other]":"['Per-piece charges included', ch.labour], ['Arrived delivery / pickup charges', ch.transportArrived1006], ['Other charge lines', ch.other]",
        'Transport Revenue is the contracts’ delivery and pickup lines by the branch on the contract; the provisional revenue to come is the Additional transport forecast on Costs to job end, by branch.':'Transport Revenue includes contract lines and uncovered transport charges for received equipment; remaining equipment stays forecast. Each uses its recorded branch.',
        "what: 'recorded delivery and pickup, plus provisional transport to job end'":"what: 'delivery and pickup charges for arrived equipment; remaining equipment forecast'",
        "basis: 'the delivery and pickup lines on the contracts — cartage internal and external; job end adds '":"basis: 'Contract delivery/pickup plus uncovered transport charges for received equipment, counted once. Job end adds '",
        '<h3>Additional transport forecast — delivery and pickup</h3><p>${esc(money(T.uncoveredAdditional))} additional to recorded Transport Revenue, pending branch confirmation. Current card charges apply to eligible ordered quantities and their listed transport units, per delivery and pickup leg. Matched contract charges replace the estimate, even below the card. This forecasts Revenue; it records no trip, completion or invoice.</p>':'<h3>Transport Revenue · delivery and pickup</h3><p>Arrived charges ${esc(money(T.actualAdditional1006))} · Remaining forecast ${esc(money(T.remainingAdditional1006))}. Existing contract charges are counted once. Card or recorded rates apply only to uncovered units and legs.</p>',
        "T.byBranch.filter(b=>b.uncoveredAdditional).map(b=>esc(b.branch||'Branch pending')+': '+esc(money(b.uncoveredAdditional))).join(' · ')":"T.byBranch.filter(b=>b.uncoveredAdditional).map(b=>esc(b.branch||'Branch pending')+': arrived '+esc(money(b.actualAdditional1006))+' · remaining '+esc(money(b.remainingAdditional1006))).join(' · ')",
        'Included transport and missing prices are identified below. Provisional estimates · AUD ex GST.':'Included transport and missing prices are identified below. Charge inclusion does not complete a pickup. AUD ex GST.',
        '<th class="num">Additional estimate</th>':'<th class="num">Arrived / remaining</th>',
        "amount(d.additional+p.additional)":"amount(d.actualAdditional1006+p.actualAdditional1006)+' / '+amount(d.remainingAdditional1006+p.remainingAdditional1006)",
        " // A tick's saved timestamp is its recording time, not a confirmed work date.":" // October customer invoice preparation: uncovered transport is separate from carrier Direct costs.\n if(month===String((eventWindow()||{}).from||'').slice(0,7))for(const row of buildingTransportModel831().rows.filter(r=>r.additional>0))addRev('Transport Revenue — October invoice allocation',row.branch,row.additional,row.ref+' · '+row.item+' · '+row.leg+' · '+row.rateSource,{id:'transport1006|'+row.id,ref:row.ref,item:row.item,source:'Shared received transport model',status:row.actualAdditional1006>0?'review':'forecast',forecastAmount:row.remainingAdditional1006,invoiceMonth:month});\n // A tick's saved timestamp is its recording time, not a confirmed work date.",
    }
    for old,new in changes.items(): html=rep(html,old,new,'Received transport Revenue split','v10.06')
    source=(HERE/'transport1006.js').read_text()+'\n'+(HERE/'transport_override1006.js').read_text()
    style='<style id="transport1006-style">[data-transport1006-form] label{display:flex;flex-direction:column;gap:5px}[data-transport1006-form] input{min-width:0;width:100%;box-sizing:border-box;min-height:44px;font-size:16px;background:#fff!important;color:#17272e!important;border:1px solid #7b8c95}[data-transport1006-form] input::placeholder{color:#53636c;opacity:1}[data-transport1006-result]{font-size:12px;font-weight:700}[data-transport1006-form] .units925-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}[data-transport1006-form] label:last-child{grid-column:1/-1}@media(max-width:520px){[data-transport1006-form] .units925-fields{grid-template-columns:1fr}}</style>'
    return rep(html,'</body>\n</html>\n',style+'<script id="transport1006-script">\n'+source+'\n</script>\n</body>\n</html>\n','Shared transport split','v10.06')
