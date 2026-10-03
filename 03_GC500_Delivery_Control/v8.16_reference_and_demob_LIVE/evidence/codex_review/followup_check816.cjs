// v8.16: Codex's follow-up fixtures (commit 0019508, followup_cpu_968aefb.cjs, unchanged) run against the current source,
// with each observation checked against its stated requirement. Author: Andrew Fisher. Synthetic fixtures only.
//   node followup_check816.cjs <demob816_src.js> <patched page>
const {execFileSync} = require('child_process'), path = require('path');
const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'followup_cpu_968aefb.cjs'), process.argv[2], process.argv[3]], {encoding: 'utf8', maxBuffer: 1 << 26}));
const R = Object.fromEntries(out.results.map(r => [r.name, r.observed]));
let fails = 0; const ok = (c, w, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + w + (d !== undefined ? '  - ' + JSON.stringify(d).slice(0, 300) : '')); };
{ const o = R.confirm_split_collapses_dates, k = x => x.map(l => l.day + ':' + l.units).sort().join(' ');
  ok(k(o.before) === k(o.after) && Array.isArray(o.stored.out_portions) && o.stored.out_portions.length === o.before.length, 'confirm_split: confirming keeps each portion on its day and quantity, on the record', {before: k(o.before), after: k(o.after), stored: o.stored.out_portions}); }
{ const o = R.split_early_load_without_pump_task; ok(o.length >= 2 && o.every((d, i) => o.slice(0, i + 1).some(e => e.pumpKeys.includes('WC49'))), 'split_pump: every portion day has a pump task on or before it, the first included', o); }
{ const o = R.unknown_confirmed_vanishes_from_run; ok(o.after.some(l => l.keys.includes('WCUNK') && l.uncertain) && o.list.includes('WCUNK') && o.trucks > 0, 'unknown_confirmed: the unknown quantity stays on its load, marked, and on a truck', o); }
{ const o = R.unknown_toilet_tank_without_predecessor, st = o.flatMap(l => l.stops), top = st.filter(s => s.parts.includes('FWF')), tank = st.find(s => s.parts.includes('Waste tank'));
  ok(top.length && tank && tank.at >= Math.max(...top.map(s => s.end)), 'unknown_toilet_tank: the tank waits for its (unknown-quantity) toilet stop', o); }
{ const o = R.merge_equal_time_order_dependent, a = o.ab.merged.delivery.WC01, b = o.ba.merged.delivery.WC01;
  ok(a.emptied === false && b.emptied === false && o.ab.report.clashes.some(x => /emptied/.test(x)) && o.ba.report.clashes.some(x => /emptied/.test(x)), 'merge_equal_time: not emptied in either order, the clash written down', {a, b}); }
ok(R.prior_onsite_amber_gate === false, 'prior_onsite_amber_gate: refused');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED (6)'); process.exitCode = fails ? 1 : 0;
