"""Author: Andrew Fisher. Restore priced service lines to the shared contract model."""
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


# These rows are already shared in the repository's Every line worksheet.
# Source prices stay on their original branch/category; there is no per-unit split.
SOURCE = 'review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx'
SOURCE_SHA = '8184c8f704d6efc9419411d211a191724c306e8ed22d4db3598dfc83206d2b5c'
INPUT_SHA = '23e565f685131bc0f4c8df96d1d8133c4c769bbde7039aa50ddbf00884a2016d'
ADDITIONS = (
    ('9994996', 1, 'Pending', 'LABOUR', 'Labour Charge WFB Install & Removal', 1, 7700, 'STPS-INS', 'STPS', '2026-10-23', 351, 'water-filled-barriers'),
    ('9994996', 2, 'Pending', 'TRANSPORT', 'Transport Charge WFB Delivery & Removal', 1, 17900, 'STPS-FRI', 'STPS', '2026-10-23', 352, 'water-filled-barriers'),
    ('9992300', 13, 'Delivered', 'TRANSPORT', "Transport Charge 60' Straight", 2, 500, 'MEAD-FRI', 'MEAD', '2026-10-19', 335, 'straight-boom-60ft'),
    ('9961265', 41, 'Pending', 'TRANSPORT', 'Transport Charge', 48, 150, 'STPS-FRI', 'STPS', '2026-10-19', 312, 'vms-transport'),
    ('9968862', 136, 'Delivered', 'MISC', 'Site Shift for Supply', 1, 500, 'KINP-MIS', 'KINP', '2026-10-19', 227, 'site-shift'),
)


def source_row(values):
    contract, line, status, item, description, quantity, price, sales, branch, start, sheet_row, scope = values
    category = 'installation' if sales.endswith('-INS') else 'service' if sales.endswith('-MIS') else 'transport'
    row = dict.fromkeys(('serial', 'register_type', 'booked_delivery_date', 'delivery_number', 'return_number',
        'expected_term_date', 'term_date', 'booked_pickup_date', 'location', 'start_date', 'start_time',
        'demob_date', 'rate_1', 'rate_2', 'rate_3', 'rate_4', 'rate_5', 'flat_monthly_charge', 'rate_type',
        'rate_classification', 'rate_id', 'sell_price', 'number_of_days', 'minimum_days', 'term_number',
        'billing_option', 'start_time_as_written', 'expected_offrental_time', 'package_name', 'swap_from_line',
        'billed_amount', 'last_total_amount', 'billed_units', 'total_inc_sd_dw_gst', 'supplier_sub_rental'))
    row.update(rental_contract=contract, branch_code=branch, line=line, item_type_code=2, item=item,
        asset_no=item, asset_no_is_plant_number=False, description=description, what=description,
        family=category, kind=category, quantity=quantity, status_as_written=status, contract_start=start,
        delivered=False, hold_billing=False, main_item=False, sales_analysis_code=sales, subhired=False,
        subhire_rule=None, charge_line=True, price=price,
        match={'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None,
            'basis': 'Priced contract service scope; no per-reference allocation or physical completion inferred.'},
        sourceAddition1224={'source': SOURCE, 'sha256': SOURCE_SHA, 'sheet': 'Every line', 'row': sheet_row,
            'scope': scope, 'combined': True, 'allocation': 'Whole contract scope; no per-reference or movement split.'})
    return row


def add_source_rows(data):
    source = data['rental_on_hire']
    digest = hashlib.sha256(json.dumps(source, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    if digest != INPUT_SHA:
        raise SystemExit('v12.24 service import requires the exact reviewed contract source')
    keys = {(str(r['rental_contract']), int(r['line'])) for r in source['rows']}
    if any((v[0], v[1]) in keys for v in ADDITIONS):
        raise SystemExit('v12.24 service import refuses an existing contract line')
    rows = [source_row(v) for v in ADDITIONS]
    source['rows'].extend(rows)
    contracts = {str(c['rental_contract']): c for c in source['contracts']}
    new_contracts = 0
    for row in rows:
        number = row['rental_contract']
        if number not in contracts:
            contracts[number] = {'rental_contract': number, 'branch_code': row['branch_code'],
                'tab': number + '-' + row['branch_code'], 'assets': [], 'lines': 0, 'plant_numbers': [],
                'locations': [], 'start_dates': [], 'delivered_dates': [], 'demob_dates': [],
                'delivery_numbers': [], 'matched': 0}
            source['contracts'].append(contracts[number])
            new_contracts += 1
        metadata = contracts[number]
        metadata['lines'] += 1
        if row['contract_start'] not in metadata['start_dates']:
            metadata['start_dates'].append(row['contract_start'])
    summary = source['summary']
    summary['lines'] += len(rows)
    summary['miscellaneous_lines'] += len(rows)
    summary['unmatched'] += len(rows)
    summary['contracts'] = sorted(set(summary['contracts']) | {r['rental_contract'] for r in rows})
    source['contracts_count1026'] += new_contracts
    source['source_additions1224'] = {'source': SOURCE, 'sha256': SOURCE_SHA, 'sheet': 'Every line',
        'rows': [v[10] for v in ADDITIONS], 'basis': 'Priced service lines; existing site records and completion are unchanged.'}


HELPERS = """/* contract-service1224: one source charge, with its own ledger category. */
function contractChargeCategory1224(r){
 if(!r||!r.charge_line||r.subhired)return null;
 if(/-INS$/i.test(String(r.sales_analysis_code||''))||/^LABOUR$/i.test(String(r.item||'')))return 'installation';
 return /-MIS$/i.test(String(r.sales_analysis_code||''))||/^MISC$/i.test(String(r.item||''))?'service':'transport';
}
function contractChargeStream1224(r){
 const category=contractChargeCategory1224(r);
 return category==='installation'?'crew':category==='transport'?'transport':category==='service'?'other':(STREAM_OF_KIND[r.kind]||'other_hire');
}
function contractBulkCoverage1224(scope,category){
 const rows=ONHIRE_ROWS.filter(r=>r.sourceAddition1224?.scope===scope&&contractChargeCategory1224(r)===category);
 const items=rows.map(r=>{const c=contractCharge(r);return {contract:String(r.rental_contract),line:r.line,branch:r.branch_code,category,amount:c.amount,treatment:c.treatment||null,basis:c.basis,source:r.sourceAddition1224};});
 return {scope,category,items,covered:items.length>0&&items.every(x=>typeof x.amount==='number'&&Number.isFinite(x.amount)),
  basis:items.length?'Included in the priced contract scope; no per-reference or movement split. Physical work and movement status are recorded separately.':null};
}

"""


def apply(html):
    if 'contract-service1224' in html:
        raise SystemExit('v12.24 service import is already present')
    start = html.index('const DATA = ') + len('const DATA = ')
    data, length = json.JSONDecoder().raw_decode(html[start:])
    previous = html[start:start + length]
    add_source_rows(data)
    path = 'GC500 page'
    html = rep(html, 'const DATA = ' + previous, 'const DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')), 'Restore shared priced service rows', path)
    html = rep(html, 'function contractCharge_747(r){', HELPERS + 'function contractCharge_747(r){', 'Shared service category and coverage', path)
    html = rep(html,
        " if (r.charge_line) { out.amount = typeof r.price === 'number' ? cents(r.price * q) : null; out.how = 'charge line'; out.basis = out.amount != null ? 'a transport or delivery charge line — the price on it' + (q !== 1 ? ' × ' + q : '') + ' is the charge' : 'a charge line with no price on it yet'; return out; }",
        """ if (r.charge_line) {
 if(!r.sourceAddition1224){out.amount=typeof r.price==='number'?cents(r.price*q):null;out.how='charge line';out.basis=out.amount!=null?'a transport or delivery charge line — the price on it'+(q!==1?' × '+q:'')+' is the charge':'a charge line with no price on it yet';return out;}
 const typed=r.sourceAddition1224&&typeof lr748Typed==='function'?lr748Typed('c|'+r.rental_contract+'|'+r.line):null;
 const price=typeof typed==='number'?typed:r.price;
 out.amount=typeof price==='number'?cents(price*q):null;out.how='charge line';out.category1224=contractChargeCategory1224(r);
 out.basis=out.amount!=null?(typeof typed==='number'?'the recorded rate override':'the '+out.category1224+' charge line’s source price')+(q!==1?' × '+q:'')+' is the charge':'a charge line with no price on it yet';
 if(typeof typed==='number')out.filled='typed';
 if(r.sourceAddition1224)out.basis+=' · whole contract scope; no per-reference or movement split; physical completion is recorded separately';
 return out;
 }""", 'Price imported services through the existing charge rule', path)
    html = rep(html,
        "const sub = rows.filter(r => r.subhired), charge = rows.filter(r => r.charge_line && !r.subhired), plant = rows.filter(r => !r.charge_line && !r.subhired);",
        "const sub = rows.filter(r => r.subhired), charge = rows.filter(r => contractChargeCategory1224(r)==='transport'), installation = rows.filter(r => contractChargeCategory1224(r)==='installation'), services = rows.filter(r => contractChargeCategory1224(r)==='service'), plant = rows.filter(r => !r.charge_line && !r.subhired);",
        'Separate service categories in contract rollups', path)
    html = rep(html, ' transport: {lines: charge.length, charge: sum(charge, amt), items: charge.map(one)}};',
        ' installation: {lines: installation.length, charge: sum(installation, amt), items: installation.map(one)},\n services: {lines: services.length, charge: sum(services, amt), items: services.map(one)},\n transport: {lines: charge.length, charge: sum(charge, amt), items: charge.map(one)}};',
        'Expose installation source charges', path)
    html = rep(html, 'subhire: C.subhire.charge, delivery: cents(C.transport.charge + buildingTransportModel831().actualAdditional1006),',
        'subhire: C.subhire.charge, contractInstallation1224: C.installation.charge, contractServices1224: C.services.charge, delivery: cents(C.transport.charge + buildingTransportModel831().actualAdditional1006),',
        'Expose existing contract installation without double counting', path)
    html = rep(html, " const k = r.charge_line && !r.subhired ? 'transport' : (STREAM_OF_KIND[r.kind] || 'other_hire');",
        ' const k = contractChargeStream1224(r);', 'Customer stream category', path)
    html = rep(html, "(r.charge_line&&!r.subhired?'transport':(STREAM_OF_KIND[r.kind]||'other_hire'))===s.key",
        'contractChargeStream1224(r)===s.key', 'Supplier stream category consistency', path)
    html = rep(html, ' if (r.charge_line) { b.transport = cents(b.transport + ch.amount); return; }',
        " if (r.charge_line) { const category=contractChargeCategory1224(r);if(category==='installation'||category==='service'){b.contract=cents(b.contract+ch.amount);const key=category==='installation'?'installation1224':'services1224';b[key]=cents((b[key]||0)+ch.amount);}else b.transport=cents(b.transport+ch.amount);return; }",
        'Preserve contract branch and service category', path)
    html = rep(html, "th('Hire · by the rate', 'hire lines carrying a rate the branch put on the contract (the SUB lines’ Rehire Revenue among them)')",
        "th('Contract prices', 'source-priced hire and services; installation and miscellaneous services are identified separately and keep their ledger categories')",
        'Do not label source service prices as hire', path)
    html = rep(html, '<td class="num">${m(b.contract)}</td>',
        '<td class="num">${m(b.contract)}${b.installation1224 ? `<br><span class="w">includes Installation ${m(b.installation1224)}</span>` : \'\'}${b.services1224 ? `<br><span class="w">includes services ${m(b.services1224)} · ledger allocation pending</span>` : \'\'}</td>',
        'Identify branch contract service components', path)
    html = rep(html, "th('Labour Install', 'install, steps, levelling and demob ticked per piece — the Labour Install code')",
        "th('Per-piece Labour Install', 'install, steps, levelling and demob per piece; source-priced contract installation is in Contract prices')",
        'Distinguish per-piece labour from source contracts', path)
    html = rep(html, ' if (c.transport.lines) bits.push(`<b>Transport &amp; delivery:</b> ${c.transport.items.map(x => esc(contractItemWords(x))).join(\'; \')}.`);',
        ' if (c.transport.lines) bits.push(`<b>Transport &amp; delivery:</b> ${c.transport.items.map(x => esc(contractItemWords(x))).join(\'; \')}.`);\n if(c.installation?.lines)bits.push(`<b>Contract installation:</b> ${c.installation.items.map(x=>esc(contractItemWords(x))).join(\'; \')}.`);\n if(c.services?.lines)bits.push(`<b>Contract services — ledger allocation pending:</b> ${c.services.items.map(x=>esc(contractItemWords(x))).join(\'; \')}.`);',
        'Keep contract service source lines visible in branch details', path)
    html = rep(html, ' - (n(c.delivery) - n(c.transportArrived1006)) - rehireLines + fire)',
        ' - (n(c.delivery) - n(c.transportArrived1006)) - n(c.contractInstallation1224) - n(c.contractServices1224) - rehireLines + fire)',
        'Remove contract installation from hire ledger', path)
    html = rep(html, 'install = r2(labour - fire - cleaning + (racePeople || 0));',
        'install = r2(labour - fire - cleaning + (racePeople || 0) + n(c.contractInstallation1224));',
        'Route contract installation to existing installation ledger', path)
    html = rep(html, 'basis: `Charges included per piece ${money0(r2(labour - fire - cleaning))}',
        'basis: `Source-priced contract installation ${money0(n(c.contractInstallation1224))} + charges included per piece ${money0(r2(labour - fire - cleaning))}',
        'Explain installation source charge', path)
    html = rep(html, " if (raceUnallocated) rev.push({key: 'event_support',",
        " if(n(c.contractServices1224))rev.push({key:'contract_services1224',code:'—',line:'Contract services — ledger allocation pending',what:'Priced miscellaneous contract services; original branch and sales category retained',now:r2(n(c.contractServices1224)),job:r2(n(c.contractServices1224)),basis:'Source-priced miscellaneous services counted once. The source MIS category is retained; Finance confirms the ledger code. No per-reference or movement split is inferred.'});\n if (raceUnallocated) rev.push({key: 'event_support',",
        'Retain miscellaneous service revenue without inventing a ledger code', path)
    html = rep(html, "part('At a glance', cents((L.job || 0) + (Number(race.people_amount) || 0)))",
        "part('At a glance', cents((L.job || 0) + (Number(race.people_amount) || 0) + (Number(M.charge.contractInstallation1224) || 0)))",
        'Keep the existing installation reconciliation complete', path)
    html = rep(html, 'const chargeNow = r2(L.recorded + people), chargeJob = r2(L.job + people), costJob = r2(ALL.priced + allow), costNow = ALL.toDate;',
        'const sourceInstall1224=n(M.charge.contractInstallation1224), chargeNow = r2(L.recorded + people + sourceInstall1224), chargeJob = r2(L.job + people + sourceInstall1224), costJob = r2(ALL.priced + allow), costNow = ALL.toDate;',
        'Labour whole-job totals include their contract source', path)
    html = rep(html, '${money(L.remaining)} still to tick · per piece from the card ${money(L.job)} + the race weekend people ${money(people)}`)',
        '${money(L.remaining)} still to tick · per piece from the card ${money(L.job)} + source-priced contract installation ${money(sourceInstall1224)} + the race weekend people ${money(people)}`)',
        'Explain whole-job labour headline', path)
    html = rep(html, " ${row('<b>Total labour we charge</b>',",
        " ${row('Contract installation — combined scope', m(sourceInstall1224), m(0), m(sourceInstall1224), 'Source-priced contract scope, counted once. No per-reference split or physical completion inferred.')}\n ${row('<b>Total labour we charge</b>',",
        'Show the separate contract installation component', path)
    html = rep(html, 'const ppl = Number(race.people_amount) || 0, now = r2(L.recorded + ppl), job = r2(L.job + ppl);',
        'const ppl = Number(race.people_amount) || 0, sourceInstall1224=Number(M.charge.contractInstallation1224)||0, now = r2(L.recorded + ppl + sourceInstall1224), job = r2(L.job + ppl + sourceInstall1224);',
        'At-a-glance labour includes its source-priced component', path)
    html = rep(html, 'ticks) + the race weekend people ${esc(money(ppl))}',
        'ticks) + source-priced contract installation ${esc(money(sourceInstall1224))} + the race weekend people ${esc(money(ppl))}',
        'Explain at-a-glance source installation', path)
    html = rep(html, " if (r.charge_line) {\n const pickup = /pick[ -]?up|collect|return|demob/i.test(what);",
        """ if (r.charge_line) {
 if(r.sourceAddition1224){
  const kind=contractChargeCategory1224(r),category=kind==='installation'?'Labour Install':kind==='service'?'Contract services — ledger allocation pending':'Transport Revenue';
  return unallocated(out.unallocatedRevenue,category,br,amount,what+': combined contract scope has no confirmed split by work month',Object.assign(extra,{contract:r.rental_contract,line:r.line,source:r.sourceAddition1224.source,combinedScope1224:true}));
 }
 const pickup = /pick[ -]?up|collect|return|demob/i.test(what);""",
        'Keep combined work-month allocation explicit', path)
    html = rep(html, 'title="a transport or delivery line on the contract — a charge, not a thing on site"',
        'title="a priced service or transport line on the contract — a charge, not a thing on site"', 'Charge line label', path)
    return html
