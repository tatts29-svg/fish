// v8.16 - the nine offline fixtures from Codex's independent review (commit 88a716e, review_v816_release/evidence/
// demob_cpu_audit.js), kept as they were written and turned into pass/fail checks against the fixed source. Author:
// Andrew Fisher. No browser, no network, no record: small isolated contexts only.
//   node v8.16_reference_and_demob_DRAFT/evidence/codex_fixtures816.js [demob816_src.js] [built page]
// setLight and mergeRecords are read from the BUILT page (they carry the v8.16 changes); Codex's original ran them from
// the v8.13 base, which is how it showed the failures.
const fs = require('fs'), vm = require('vm'), path = require('path');
const HERE = __dirname, ROOT = path.join(HERE, '..', '..');
const source = fs.readFileSync(process.argv[2] || path.join(HERE, '..', 'demob816_src.js'), 'utf8');
const page = fs.readFileSync(process.argv[3] || path.join(ROOT, 'build/GC500_v8.16/GC500_Delivery_Control_hosted.html'), 'utf8');
let fails = 0, passes = 0; const ok = (c, what, d) => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== undefined ? '  - ' + JSON.stringify(d).slice(0, 400) : '')); };
function ctx(assets = []) {
  const c = vm.createContext({console, Date, Map, Set, Math, JSON, Number, String, isFinite, isNaN, assets,
    S: {delivery: {}}, CROW: new Map(), RENDER_MEMO: new Map(), DATA: {depot: {planning: {precinct_min: 10}}},
    localStorage: {getItem: () => null}, todayIso: () => '2026-10-26', allAssets: () => assets,
    assetOf: k => assets.find(a => a.key === k), itemRows: a => a.rows, refKind: a => a.kind || 'toilet',
    rowOff: () => false, subhireOf: () => null, onhireForAsset: () => [], branchOf: k => assets.find(a => a.key === k).branch || 'KINP',
    effectiveDates: a => ({out_plan: a.out || null}), flash: () => {}, mayWrite: () => true, whoAmI: () => 'Fixture operator',
    isRef: k => assets.some(a => a.key === k), bump: () => {}, buzz: () => {}, blank: () => ({}), tombed: () => false,
    fmtStamp: x => x});
  vm.runInContext(source, c);
  vm.runInContext(`zone816=a=>({zone:a.zone||'gate1',side:a.side||'outside'});
    deliveryOf=k=>S.delivery[k]||{state:'on site'};`, c);
  return c;
}
const run = (c, s) => { try { return vm.runInContext(s, c); } catch (e) { return {__err: e.message}; } };
const block = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ' (threw: ' + e.message + ')'); } };
const asset = (key, rows, extra = {}) => ({key, rows, item_types: rows.map(r => r.asked), ...extra});
block('gate fixtures 1-5', () => {
  const c = ctx([asset('WC01', [{asked: 'FWF', qty_supplied: 1}])]);
  c.todayIso = () => '2026-10-18';
  ok(run(c, "emptyGate816('WC01','in transit')") === false, '1 gate_before_event_week: no date exception (refused on 18 Oct)');
  c.todayIso = () => '2026-10-26'; c.S.delivery.WC01 = {state: 'not on site'};
  ok(run(c, "emptyGate816('WC01','in transit') === true && incoming816('WC01') === true && emptyGate816('WC01','in transit',true) === false") === true, '2 gate_unrecorded_or_non_green_light: an incoming trip is named (incoming816), and the collection path is still refused');
  c.S.delivery.WC01 = {state: 'not on site', history: [{state: 'on site', at: '2026-10-01T00:00:00Z'}]};
  ok(run(c, "emptyGate816('WC01','in transit')") === false, '2b a unit that has been on site and now shows red is refused (no light shortcut)');
  c.S.delivery.WC01 = {state: 'on site', emptied: true};
  ok(run(c, "emptyGate816('WC01','in transit',true)") === false, '3 gate_without_actor_or_time: emptied with no person or time is refused');
  c.S.delivery.WC01 = {state: 'on site', emptied: true, emptied_by: 'Older operator', emptied_at: '2026-10-25T00:00:00Z'};
  c.CROW.set('WC01', {delivery: {emptied: false, emptied_by: 'Newer operator', emptied_at: '2026-10-26T00:00:00Z'}});
  const nu = run(c, "emptiedOf816('WC01')");
  ok(nu.on === false && nu.by === 'Newer operator', '4 newer_committed_untick: the newer committed un-tick wins', nu);
  c.CROW.clear(); c.LIGHT = {'on site': {label: 'On site'}, 'in transit': {label: 'In transit'}, 'not on site': {label: 'Not on site'}};
  const start = page.indexOf('function setLight(key, state){'), end = page.indexOf('\n/* Typed fields save', start);
  if (!(start >= 0 && end > start)) throw new Error('setLight not found in the built page');
  vm.runInContext(page.slice(start, end), c);
  c.S.delivery.WC01.state = 'in transit'; run(c, "setLight('WC01','on site')");
  const re = run(c, "({emptied:emptiedOf816('WC01'),nextCollectionAllowed:emptyGate816('WC01','in transit',true)})");
  ok(re.emptied.on === false && re.nextCollectionAllowed === false, '5 reused_reference_old_pumpout: set on site again, the earlier pump-out no longer clears it', re);
  c.S.delivery.WC01 = {state: 'on site', set_at: '2026-10-27T00:00:00Z', history: [{state: 'on site', at: '2026-10-27T00:00:00Z'}], emptied: true, emptied_by: 'Earlier visit', emptied_at: '2026-10-20T00:00:00Z'};
  ok(run(c, "emptiedOf816('WC01').on") === false, '5b a pump-out recorded before the last arrival (an earlier visit) clears nothing');
  c.S.delivery.WC01 = {state: 'on site', set_at: '2026-10-01T00:00:00Z', emptied: true, emptied_by: 'This visit', emptied_at: '2026-10-26T00:00:00Z'};
  ok(run(c, "emptiedOf816('WC01').on && emptyGate816('WC01','in transit',true)") === true, '5c a pump-out after the last arrival, with a person and a time, clears the collection');
});
block('fixture 6', () => {
  const c = ctx([asset('WC01', [{asked: 'FWF', qty_asked: null, qty_supplied: null}])]);
  const u = run(c, "JSON.parse(JSON.stringify(demob816().day['2026-10-26'].loads.map(l=>({units:l.units,uncertain:l.uncertain,rows:l.rows.map(x=>({key:x.r.key,n:x.n,unknown:x.r.units[0].unknown}))}))))");
  ok(u.length === 1 && u[0].uncertain === true && u[0].units === 0 && u[0].rows[0].n === 0 && u[0].rows[0].unknown === true, '6 unknown_quantity: kept unknown, not a one-unit load; the load says its total is not certain', u);
});
block('fixture 7', () => {
  const c = ctx([asset('WC25', [{asked: 'FWF', qty_supplied: 25}])]);
  const s = run(c, "JSON.parse(JSON.stringify(demob816().days.flatMap(d=>demob816().day[d].loads.map(l=>({day:d,units:l.units,rowDay:l.rows[0].iso,onDayList:demob816().day[d].list.some(r=>r.key==='WC25'),onPumpList:demob816().day[d].pump.some(x=>x.r.key==='WC25'),proposedHere:demob816().day[d].list.some(r=>r.key==='WC25'&&r.src==='proposed')})))))");
  ok(s.length === 2 && s.every(x => x.units <= 24 && x.rowDay === x.day && x.onDayList && x.onPumpList && x.proposedHere) && s.reduce((n, x) => n + x.units, 0) === 25, '7 split_reference_dates: each portion on its own day, in its load, on that day\'s list, pump-out and confirmation', s);
});
block('fixture 8', () => {
  const c = ctx([asset('WC02', [{asked: 'FWF', qty_supplied: 1}, {asked: 'Waste tank', qty_supplied: 1}], {out: '2026-10-26'})]);
  const m = run(c, "JSON.parse(JSON.stringify(trucks816('2026-10-26','all').map(l=>({kind:l.kind,group:l.group,stops:l.t.st.map(s=>({at:s.at,end:s.end,tank:!!s.s.tankOnly,parts:s.s.parts.map(p=>p.type)}))}))))");
  const st = m.flatMap(l => l.stops), top = st.filter(x => !x.tank), tank = st.filter(x => x.tank);
  ok(tank.length === 1 && top.length >= 1 && tank[0].at >= Math.max(...top.map(x => x.end)), '8 mixed_toilet_tank_order: the tank starts after the toilet on it is off, across separate runs', m);
});
block('fixture 9', () => {
  const c = ctx([asset('WC01', [{asked: 'FWF', qty_supplied: 1}])]);
  const start = page.indexOf('function mergeRecords(mine, theirs){'), end = page.indexOf('\nfunction applyImport(', start);
  if (!(start >= 0 && end > start)) throw new Error('mergeRecords not found in the built page');
  vm.runInContext(page.slice(start, end), c);
  run(c, "deliveryEmpty=d=>!d.state && typeof d.emptied!=='boolean'");
  const g = run(c, "JSON.parse(JSON.stringify(mergeRecords({delivery:{WC01:{emptied:true,emptied_by:'Fixture operator',emptied_at:'2026-10-26T00:00:00Z',emptied_history:[{emptied:true,by:'Fixture operator',at:'2026-10-26T00:00:00Z'}]}}},{}).merged.delivery))");
  ok(g.WC01 && g.WC01.emptied === true && g.WC01.emptied_by === 'Fixture operator' && g.WC01.emptied_at && (g.WC01.emptied_history || []).length === 1, '9 merge_emptied_evidence: value, who, when and history survive a merge', g);
  const h = run(c, "JSON.parse(JSON.stringify(mergeRecords({delivery:{WC01:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z'}}},{delivery:{WC01:{emptied:false,emptied_by:'B',emptied_at:'2026-10-26T01:00:00Z'}}}).merged.delivery))");
  const h2 = run(c, "JSON.parse(JSON.stringify(mergeRecords({delivery:{WC01:{emptied:false,emptied_by:'B',emptied_at:'2026-10-26T01:00:00Z'}}},{delivery:{WC01:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z'}}}).merged.delivery))");
  ok(h.WC01.emptied === false && h2.WC01.emptied === false && h.WC01.emptied_by === 'B', '9b a newer un-tick wins the merge, whichever copy is named first', {h, h2});
  const once = run(c, "JSON.stringify(mergeRecords({delivery:{WC01:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z',emptied_history:[{emptied:true,by:'A',at:'2026-10-26T00:00:00Z'}]}}},{}).merged.delivery)");
  const twice = run(c, "JSON.stringify(mergeRecords({delivery:JSON.parse(" + JSON.stringify(once) + ")},{delivery:JSON.parse(" + JSON.stringify(once) + ")}).merged.delivery)");
  ok(once === twice, '9c merging the result with itself changes nothing');
});
console.log(fails ? `\n${fails} FAILED, ${passes} passed` : `\nALL PASSED (${passes})`); process.exitCode = fails ? 1 : 0;
