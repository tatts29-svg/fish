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
        "part('Transport — the contracts’ charge lines', V.revenueTotal)":"part('Transport — contract lines and arrived card charges', V.revenueTotal)",
        "what: 'recorded delivery and pickup, plus provisional transport to job end'":"what: 'delivery and pickup charges for arrived equipment; remaining equipment forecast'",
        "basis: 'the delivery and pickup lines on the contracts — cartage internal and external; job end adds '":"basis: 'Contract delivery/pickup plus uncovered card charges for received equipment, counted once. Job end adds '",
        '<h3>Additional transport forecast — delivery and pickup</h3><p>${esc(money(T.uncoveredAdditional))} additional to recorded Transport Revenue, pending branch confirmation. Current card charges apply to eligible ordered quantities and their listed transport units, per delivery and pickup leg. Matched contract charges replace the estimate, even below the card. This forecasts Revenue; it records no trip, completion or invoice.</p>':'<h3>Transport Revenue · delivery and pickup</h3><p>Arrived card charges ${esc(money(T.actualAdditional1006))} · Remaining forecast ${esc(money(T.remainingAdditional1006))}. Existing contract charges are counted once. Card rates apply only to uncovered units and legs.</p>',
        "T.byBranch.filter(b=>b.uncoveredAdditional).map(b=>esc(b.branch||'Branch pending')+': '+esc(money(b.uncoveredAdditional))).join(' · ')":"T.byBranch.filter(b=>b.uncoveredAdditional).map(b=>esc(b.branch||'Branch pending')+': arrived '+esc(money(b.actualAdditional1006))+' · remaining '+esc(money(b.remainingAdditional1006))).join(' · ')",
        'Included transport and missing prices are identified below. Provisional estimates · AUD ex GST.':'Included transport and missing prices are identified below. Charge inclusion does not complete a pickup. AUD ex GST.',
        '<th class="num">Additional estimate</th>':'<th class="num">Arrived / remaining</th>',
        "amount(d.additional+p.additional)":"amount(d.actualAdditional1006+p.actualAdditional1006)+' / '+amount(d.remainingAdditional1006+p.remainingAdditional1006)",
    }
    for old,new in changes.items(): html=rep(html,old,new,'Received transport Revenue split','v10.06')
    return rep(html,'</body>\n</html>\n','<script id="transport1006-script">\n'+(HERE/'transport1006.js').read_text()+'\n</script>\n</body>\n</html>\n','Shared transport split','v10.06')
