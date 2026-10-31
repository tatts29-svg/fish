"""Author: Andrew Fisher. Exact, reversible boundaries for the v12.55 labour DRAFT.

Never part of v12.54. This is a customer coverage draft, not a release authorization.
The shared predecessor gate and release process belong to the integrating patch.
"""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def replacements():
    """Return exact old/new tuples; reversed application restores the input bytes."""
    module = (ROOT / 'ruled_finance1255.js').read_text()
    out = []
    def add(label, old, new):
        out.append((label, old, new))
    anchor = 'function contractCharge(r){\n const generator1004='
    add('module and source charge route', anchor, module + '\nfunction contractCharge(r){\n const ruled1255=RuledFinance1255.contractCharge(r);if(ruled1255)return ruled1255;\n const generator1004=')
    anchor = "  function isInstallation(row){\n    if(!row||typeof row!=='object'||row.subhired||row.subhired_machine)return false;"
    add('source Installation classification', anchor, "  function isInstallation(row){\n    if(RuledFinance1255.isInstallation(row))return true;\n    if(!row||typeof row!=='object'||row.subhired||row.subhired_machine)return false;")
    anchor = " (r.lines || []).forEach(L => { if (L.key === 'fire_ext') { L.heading = fire914NoYear(L.heading); L.year = null; L.year_note = null; } });\n return r;"
    add('customer Installation coverage', anchor, anchor.replace('return r;', 'return RuledFinance1255.projectLabour(r,ref,item,DATA.rental_on_hire.assignments);'))
    anchor = "return {n, idx, host: idx >= 0 ? lines[idx] : null, rate, heading: L ? fire914NoYear(L.heading) : null,\n  amount: rate != null ? Math.round(rate * n * 100) / 100 : null, last: fire914Last(a.key)};"
    add('customer fire charge only', anchor, anchor.replace('return {', 'return RuledFinance1255.projectFire({').replace('last: fire914Last(a.key)};', 'last: fire914Last(a.key)});'))
    anchor = " const peopleExact = lines.reduce((s, l) => s + l.amount_exact, 0);"
    add('event labour included once', anchor, " lines.forEach((row,i)=>{lines[i]=RuledFinance1255.projectScopeLine(row);});\n" + anchor)
    anchor = "  const targetCents=sources.reduce((n,s)=>n+s.amountCents,0);\n  if(targetCents!==approvedCents)throw Error('FWF source no longer matches the existing approved charge');"
    add('FWF remaining aggregate coverage', anchor, "  const fullTargetCents=sources.reduce((n,s)=>n+s.amountCents,0);\n  if(fullTargetCents!==approvedCents)throw Error('FWF source no longer matches the existing approved charge');\n  const coveredCents=RuledFinance1255.installation['9968955|146']+RuledFinance1255.installation['9994954|23'];\n  const targetCents=fullTargetCents-coveredCents;")
    anchor = "source:ids.slice(),recorded:money(recordedCents),approved:money(targetCents),delta:money(targetCents-recordedCents),basis:'Existing Baseplan FWF install and demob charge; combined amount only'"
    add('FWF coverage evidence', anchor, "source:[],recorded:money(recordedCents),approved:money(targetCents),delta:money(targetCents-recordedCents),ruled1255:{coveredSources:ids.slice(),coveredAmount:money(coveredCents),fullApproved:money(fullTargetCents)},basis:'Baseplan FWF install and demob source lines are charged once in contract Installation; physical completion remains separate'")
    anchor = "slots.push({ref: a.key, branch: code, item: l.item, disc: l.discipline, line: L.name, key: L.key,unit: u, rate: L.rate, qty: n, value, state, by: L.by, at: L.at});"
    add('retain physical allocation basis', anchor, "slots.push(RuledFinance1255.allocationSlot({ref: a.key, branch: code, item: l.item, disc: l.discipline, line: L.name, key: L.key,unit: u, rate: L.rate, qty: n, value, state, by: L.by, at: L.at},L));")
    anchor = " const zero = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: {charged: 0, expected: 0, tocome: 0, later: 0}, unpriced: 0});"
    add('preserve allocation cents', anchor, " RuledFinance1255.shareAllocation(slots);\n" + anchor)
    anchor = "LP.slots.filter(sl=>['install','steps','levelling','demob'].includes(sl.key)&&sl.value!=null&&sl.branch).forEach(sl=>{labW[sl.branch]=((labW[sl.branch]||0)+sl.value);});"
    add('preserve Direct cost branch weights', anchor, "LP.slots.filter(sl=>['install','steps','levelling','demob'].includes(sl.key)&&RuledFinance1255.allocationValue(sl)!=null&&sl.branch).forEach(sl=>{labW[sl.branch]=((labW[sl.branch]||0)+RuledFinance1255.allocationValue(sl));});")
    anchor = "if(r.qty===null||r.qty>0)slots.push({...common,qty:r.qty,value:r.value,state:'charged',automaticCharge1006:r.automatic});"
    add('native charged allocation basis', anchor, "if(r.qty===null||r.qty>0)slots.push(RuledFinance1255.onsiteAllocationSlot({...common,qty:r.qty,value:r.value,state:'charged',automaticCharge1006:r.automatic},r));")
    anchor = "if(r.qty!==null&&(r.remainingQty==null||r.remainingQty>0))slots.push({...common,qty:r.remainingQty,value:r.forecastValue==null||r.value==null?null:OnsiteCharges1006.cents(r.forecastValue-r.value),state:'tocome'});"
    add('native forecast allocation basis', anchor, "if(r.qty!==null&&(r.remainingQty==null||r.remainingQty>0))slots.push(RuledFinance1255.onsiteAllocationSlot({...common,qty:r.remainingQty,value:r.forecastValue==null||r.value==null?null:OnsiteCharges1006.cents(r.forecastValue-r.value),state:'tocome'},r));")
    anchor = "LP.slots.forEach(sl => { if (!LAB_KEYS.has(sl.key) || sl.value == null) return; const g = labBy[sl.branch || '—'] = labBy[sl.branch || '—'] || {charged: 0, toCome: 0}; if (sl.state === 'charged') g.charged = r2(g.charged + sl.value); else g.toCome = r2(g.toCome + sl.value); });"
    add('legacy Direct cost branch weights', anchor, "LP.slots.forEach(sl => { const allocation1255=RuledFinance1255.allocationValue(sl); if (!LAB_KEYS.has(sl.key) || allocation1255 == null) return; const g = labBy[sl.branch || '—'] = labBy[sl.branch || '—'] || {charged: 0, toCome: 0}; if (sl.state === 'charged') g.charged = r2(g.charged + allocation1255); else g.toCome = r2(g.toCome + allocation1255); });")
    anchor = "function finance928ContractOwner(row){\n const linked955="
    add('preserve Pee Panel Rehire coverage', anchor, "function finance928ContractOwner(row){\n const ruled1255=RuledFinance1255.peeOwner(row);if(ruled1255)return ruled1255;\n const linked955=")
    anchor = "const api={select};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ItemIdentity979=api;"
    add('retain existing Pee Panel drawer hire', anchor, "const api={select:(ref,item,contracts,current)=>RuledFinance1255.selectPee(select(ref,item,contracts,current),ref,item,contracts)};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ItemIdentity979=api;")
    anchor = " function calculate(row,e,charge,actuals){\n  if(!e||!charge||charge.treatment||!['per day','whole event'].includes(charge.how))return null;"
    add('preserve linked supplier charge basis', anchor, " function calculate(row,e,charge,actuals){\n  charge=RuledFinance1255.supplierCharge(row,charge,contractCharge);\n  if(!e||!charge||charge.treatment||!['per day','whole event'].includes(charge.how))return null;")
    anchor = "return Object.assign({}, out, {amount: 2176.65, days: 7, basis: '$310.95 a day x 7 days, 21 to 27 Oct 2026 - Baseplan (8) dates (Andrew, 28 Oct 2026)'});"
    add('approved outcome on existing financial association', anchor, "return RuledFinance1255.associationCharge(row,out);")
    anchor = "r.charges.map(c=>'<tr><td>'+esc975(c.name)+'</td><td>'+esc975(chargeRateDisplay977(c.rate))+'</td><td>'+(c.qty==null?'Allocation to confirm':c.qty)+'</td><td>'+esc975(c.qty==null?'Stairs allocation to confirm':price(c.value))+'</td></tr>').join('')"
    changed = "r.charges.map(c=>{const display1255=RuledFinance1255.coveredChargeDisplay(c,a.key,r.item,DATA.rental_on_hire.assignments);return '<tr><td>'+esc975(c.name)+'</td><td>'+esc975(display1255?display1255.rate:chargeRateDisplay977(c.rate))+'</td><td>'+(c.qty==null?'Allocation to confirm':c.qty)+'</td><td>'+esc975(c.qty==null?'Stairs allocation to confirm':display1255?display1255.charge:price(c.value))+'</td></tr>';}).join('')"
    add('show covered drawer components as included', anchor, changed)
    anchor = "+transportRowsHtml977(a,r.item)+'</tbody></table></div><p>Ordered quantity '"
    changed = "+transportRowsHtml977(a,r.item)+'</tbody></table></div>'+(()=>{const note1255=RuledFinance1255.coverageText(r.charges,a.key,r.item,DATA.rental_on_hire.assignments);return note1255?'<p data-installation-coverage1255>'+esc975(note1255)+'</p>':'';})()+'<p>Ordered quantity '"
    add('explain contract coverage apart from physical completion', anchor, changed)
    anchor = "esc(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':Number.isFinite(r.rate)?chargeRateDisplay977(r.rate):'Rate to confirm')"
    add('automatic work label retains contract coverage', anchor, "esc(RuledFinance1255.workLabel(r)||(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':Number.isFinite(r.rate)?chargeRateDisplay977(r.rate):'Rate to confirm'))")
    anchor = "esc(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':money(r.rate))"
    add('manual work label retains contract coverage', anchor, "esc(RuledFinance1255.workLabel(r)||(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':money(r.rate)))")
    anchor = "function onsiteItemSummary979(ref,item){const r=onsiteComplete979().rows.find(r=>r.ref===ref&&r.item===item);return r?money(r.total)+(r.pending.length?' · '+r.pending.length+' holds':''):'Allocation pending';}"
    changed = "function onsiteItemSummary979(ref,item){const r=onsiteComplete979().rows.find(r=>r.ref===ref&&r.item===item);return r?RuledFinance1255.itemSummary(money(r.total)+(r.pending.length?' · '+r.pending.length+' holds':''),ref,item,DATA.rental_on_hire.assignments):'Allocation pending';}"
    add('item subtotal distinguishes contract Installation', anchor, changed)
    return out


def patch_finance(text, path='page'):
    if 'root.RuledFinance1255=' in text:
        raise ValueError('v12.55 labour coverage already applied')
    for label, old, new in replacements():
        if text.count(old) != 1:
            raise ValueError(label + ': expected one exact source boundary')
        checked = rep(old, old, new, label, path)
        if checked != new:
            raise ValueError(label + ': shared replacement changed reviewed boundary')
        text = text.replace(old, checked, 1)
    return text


def reverse_finance(text):
    for label, old, new in reversed(replacements()):
        if text.count(new) != 1:
            raise ValueError(label + ': exact reverse boundary unavailable')
        text = text.replace(new, old, 1)
    return text
