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
    add('FWF remaining aggregate coverage', anchor, "  const fullTargetCents=sources.reduce((n,s)=>n+s.amountCents,0);\n  if(fullTargetCents!==approvedCents)throw Error('FWF source no longer matches the existing approved charge');\n  const coveredCents=RuledFinance1255.installation['9968955|146'];\n  const targetCents=fullTargetCents-coveredCents;")
    anchor = "source:ids.slice(),recorded:money(recordedCents),approved:money(targetCents),delta:money(targetCents-recordedCents),basis:'Existing Baseplan FWF install and demob charge; combined amount only'"
    add('FWF coverage evidence', anchor, "source:['9994954|23'],recorded:money(recordedCents),approved:money(targetCents),delta:money(targetCents-recordedCents),ruled1255:{coveredSource:'9968955|146',coveredAmount:money(coveredCents),fullApproved:money(fullTargetCents)},basis:'Remaining Baseplan FWF install and demob; source 9968955/146 now charged once in contract Installation'")
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
