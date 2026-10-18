# Author: Andrew Fisher. Build review copies only; never overwrites the draft.
import argparse
import difflib
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path, help='Owned v8.94 draft directory, read only')
parser.add_argument('output', type=Path, help='Private review directory')
args = parser.parse_args()
if args.source.resolve() == args.output.resolve() or args.source.resolve() in args.output.resolve().parents:
    raise SystemExit('Output must be outside the owned draft')
args.output.mkdir(parents=True, exist_ok=True)
helper = Path(__file__).with_name('lighting894_projection.js').read_text()

def once(s, old, new):
    assert s.count(old) == 1, 'Expected exactly one source match: ' + old[:90]
    return s.replace(old, new, 1)

old_js = (args.source / 'lighting894.js').read_text()
js = once(old_js, " if (typeof heldMemo !== 'function') missing.push('heldMemo');", " if (typeof heldMemo !== 'function') missing.push('heldMemo');\n if (typeof todayWorkMetrics840 !== 'function') missing.push('todayWorkMetrics840');")
start = js.index(' function audit(asOf){')
end = js.index('\n const W = {', start)
js = js[:start] + '\n' + helper + '''
 function audit(asOf, suppliedArea){
  const d = asOf || todayWorkDay841();
  const read = () => {
   const register = allAssets(), c = context();
   const towers = register.filter(a => !a._cancelled && a.discipline === 'Lighting towers' && !a.relocation && !a.rest_of && !movedAway(a.key));
   const native = suppliedArea || todayWorkMetrics840(d).find(a => a.id === 'lighting');
   const p = lighting894ProjectVerified(native && native.rows || [], towers, CONFIRMED, assetNumbersOf);
   const confirmed = scopeOk(CONFIRMED) && p.confirmed;
   const invalid = CONFIRMED && !confirmed ? 'the scope confirmation is invalid, so the scope stays unconfirmed' : null;
   const groups = p.groups.map(g => ({...g, records: g.records.map(r => {
    const dd = deliveryAsOf(r.key, d);
    return {...r, onSite: !!(dd && dd.recorded && (dd.state === 'on site' || dd.done)),
     state: r.review ? 'review required' : r.done ? 'complete' : dd && dd.recorded ? text(dd.state) : 'no record'};
   })}));
   const scope = confirmed ? Number(CONFIRMED.towers) : null;
   return {...p, asOf: d, keyed: c.keyed, symbols: c.symbols, screens: c.screens,
    aliases: c.aliases.concat(p.aliases.map(a => ({key: a.key, parent: a.parents.join(', ')}))), boq: BOQ,
    confirmed, confirmation: confirmed ? CONFIRMED : null, invalid, groups, scope,
    left: confirmed ? scope - p.credited : null,
    surplus: groups.filter(g => g.surplus > 0), state: confirmed ? 'confirmed' : 'unconfirmed'};
  };
  return suppliedArea ? read() : heldMemo('lighting894|' + d, read);
 }
''' + js[end:]
js = once(js, "const a = audit(args[0] || r.asOf); x.scope894 = a;", "const a = audit(args[0] || r.asOf, Array.isArray(args[1]) ? args[1].find(a => a.id === 'lighting') : null); x.scope894 = a;")
js = once(js, "x.pctKind = 'confirmed'; x.pctLabel = 'Confirmed complete against the map’s scope';", "x.pctKind = a.pctKind; x.pctLabel = a.review ? 'At least confirmed complete against the map’s scope' : 'Confirmed complete against the map’s scope';\n    x.reviewRefs = a.reviewRefs;\n    x.reviewQuantity = a.scopeRows.filter(row => row.recordedComplete && !row.complete).reduce((n, row) => n + row.quantity, 0);\n    x.issues = [...new Set([...(x.issues || []), ...a.issues])];")
js = once(js, "if (a.confirmed) row.basis = 'Confirmed completion against the map’s scope: ' + a.scope + ' towers keyed on D024, ' + W.who(a);", "if (a.confirmed) row.basis = (a.review ? 'At least confirmed completion' : 'Confirmed completion') + ' against the map’s scope: ' + a.scope + ' towers keyed on D024, ' + W.who(a);")
js = once(js, "rows: a => a.rows.map(r => r.key + (r.units > 1 ? ' ×' + r.units : '')).join(', ') || 'none',", "rows: a => a.rows.map(r => r.key + (r.units == null ? ' (quantity unconfirmed)' : r.units > 1 ? ' ×' + r.units : '')).join(', ') || 'none',")
# Keep review visible in location wording; an on-site conflict is never described
# as verified complete merely because the original Complete tick remains set.
js = once(js, "group: g => g.delivered > 0 ?", "group: g => g.records.some(r => r.review) ? W.keys(g) + ' requires review, ' + g.credited + ' verified complete credited'\n   : g.delivered > 0 ?")
js = once(js, "place: g => g.delivered > 0 ?", "place: g => g.records.some(r => r.review) ? W.keys(g) + ' at the ' + g.name + ' requires review, ' + g.credited + ' verified complete credited'\n   : g.delivered > 0 ?")

old_patch = (args.source / 'patch_v894.py').read_text()
patch = once(old_patch, "'heldMemo', 'holdAssets']", "'heldMemo', 'holdAssets', 'todayWorkMetrics840']")
old_line = "    const rows = (fence && !done ? [] : area.rows || []).filter(row => total || (done ? row.complete || number(row.done) && row.done > 0 : !row.complete || number(row.remaining) && row.remaining > 0));"
new_line = "    const scopeRows894 = area.id === 'lighting' && summary.scope894 && summary.scope894.confirmed ? summary.scope894.scopeRows : area.rows;\n    const rows = (fence && !done ? [] : scopeRows894 || []).filter(row => total || (done ? row.complete || number(row.done) && row.done > 0 : (!row.scope894 || row.quantity > 0) && (!row.complete || number(row.remaining) && row.remaining > 0)));"
patch = once(patch, '# 4. the page\'s own rows,', '# The Lighting drawer uses the same map-scope allocation as its headline.\n# Native work rows, linked record controls and financial readers are untouched.\ns = rep(s, ' + repr(old_line) + ',\n        ' + repr(new_line) + ",\n        'Lighting scope drilldown', str(p))\n\n# 4. the page's own rows,")
for name, original, corrected in [('lighting894.js', old_js, js), ('patch_v894.py', old_patch, patch)]:
    target = args.output / name
    if target.exists():
        raise SystemExit('Review copy already exists: ' + str(target))
    target.write_text(corrected)
    (args.output / (name + '.diff')).write_text(''.join(difflib.unified_diff(original.splitlines(True), corrected.splitlines(True), fromfile='a/v8.94_lighting_basis_DRAFT/' + name, tofile='b/v8.94_lighting_basis_DRAFT/' + name)))
(args.output / 'drawer_hook.json').write_text(__import__('json').dumps({'before': old_line, 'after': new_line}, indent=2) + '\n')
print('Review source and unified diffs prepared; the owned draft was not modified.')
