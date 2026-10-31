"""Author: Andrew Fisher. Reuse the small tick aggregate in the native lifecycle."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


OLD = """function pl760Ticks(){
 const mk = () => ({ticks: 0, amount: 0, unknown: 0});
 const out = {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk(), byBranch: {}, total: 0, ticks: 0, unknown: 0};
 const add = (grp, br, amt) => { const g = out[grp] || out.other; g.ticks++; out.ticks++; if (amt == null) { g.unknown++; out.unknown++; } else { g.amount += amt; out.total += amt; }
 const b = out.byBranch[br] = out.byBranch[br] || {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk(), amount: 0}; const bg = b[grp] || b.other; bg.ticks++; if (amt == null) bg.unknown++; else { bg.amount += amt; b.amount += amt; } };
 allAssets().filter(a => !a._cancelled && !a.rest_of).forEach(a => {
 const t = assetTotal(a); const br = (branchOf(a.key) || {}).code || 'no branch';
 (t.lines || []).forEach(l => { const lab = l.labour; if (!lab || !lab.ticked || !lab.ticked.length) return;
 /* v8.65 - the same rule as labourMoney: per card line, rate × pieces ticked, to the cent; every tick is still counted */
const by = new Map(), put = (x, n) => { n=x.chargeQty975 ?? n; const k = by.get(x.key) || {grp: PL760_GROUP[x.key] || 'other', rate: x.rate || 0, n: 0, ticks: 0}; k.n += n; k.ticks++; if (x.fire914 && x.rate == null) k.unk = true; by.set(x.key, k); }; /* v9.14 - unk: rate to confirm */
 if (lab.perBuilding) { const units = (lab.units || []).map(q => q.unit); const restN = labourRestN(a, l.item, units); (lab.units || []).forEach(q => (q.ticked || []).forEach(x => put(x, q.unit === LAB_REST ? restN : 1))); }
 else lab.ticked.forEach(x => put(x, x.fire914 ? x.n : (lab.qty || 0)));
 if (lab.perBuilding) (lab.ticked || []).filter(x => x.fire914).forEach(x => put(x, x.n)); /* v9.14 - the added pieces, at their own count */
 by.forEach(k => { const amt = lab.total == null || k.unk ? null : Math.round(k.rate * k.n * 100) / 100; for (let i = 0; i < k.ticks; i++) add(k.grp, br, amt == null ? null : i === 0 ? amt : 0); }); }); });
 VmsInstallation1228.model().slots.forEach(s=>add('install',s.branch,s.value));
 const r = v => Math.round(v * 100) / 100;
 ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { out[k].amount = r(out[k].amount); }); out.total = r(out.total);
 Object.values(out.byBranch).forEach(b => { b.amount = r(b.amount); ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { b[k].amount = r(b[k].amount); }); });
 return out;
}"""

WRAPPER = """/* Author: Andrew Fisher. Only the numeric tick aggregate follows the native
   hold/carry lifecycle. Every public result owns its groups and branch groups. */
function pl760Ticks(){
 if(!ASSETS_HELD)return pl760Ticks1243Uncached();
 const value=heldMemo('pl760Ticks1243',pl760Ticks1243Uncached);
 const copyGroups=source=>({...source,install:{...source.install},cleaning:{...source.cleaning},fire_ext:{...source.fire_ext},other:{...source.other}});
 return {...copyGroups(value),byBranch:Object.fromEntries(Object.entries(value.byBranch).map(([branch,groups])=>[branch,copyGroups(groups)]))};
}
"""

NEW = WRAPPER + OLD.replace('function pl760Ticks(){', 'function pl760Ticks1243Uncached(){', 1)


def patch(text, path):
    if 'function pl760Ticks1243Uncached()' in text:
        raise ValueError('v12.43 tick aggregate reuse is already applied')
    if text.count(OLD) != 1:
        raise ValueError('tick aggregate reuse requires one exact source match')
    start = text.index(OLD)
    return text[:start] + rep(OLD, OLD, NEW, 'native-lifecycle tick aggregate reuse', path) + text[start + len(OLD):]
