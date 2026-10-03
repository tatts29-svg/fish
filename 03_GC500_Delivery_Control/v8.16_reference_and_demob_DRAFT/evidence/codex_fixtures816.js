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
    S: {delivery: {}}, CROW: new Map(), RENDER_MEMO: new Map(), DATA: {depot: {planning: {precinct_min: 10}}, transport: {kingston_run: {minutes_rounded: 70, basis: '46.7 km straight line × 1.25 = about 58 km by road, at 60 km/h + 10 min in the precinct — a planning figure, not a live time'}}},
    localStorage: (() => { const m = new Map(); return {getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)}; })(), todayIso: () => '2026-10-26', allAssets: () => assets,
    /* who owns the portables (v7.29 inventory): an asset says owner 'coates' or 'unknown'; otherwise its units are the supplier's, as these fixtures were written */
    subOf: k => { const a = assets.find(x => x.key === k) || {}; if (a.owner === 'coates' || a.owner === 'unknown') return []; const n = (a.rows || []).reduce((s, r) => s + (Number(r.qty_supplied != null ? r.qty_supplied : r.qty_asked) || 0), 0); return Array.from({length: n}, () => ({co: 'Event Portables'})); },
    invCountNums: a => a.owner === 'coates' ? (a.rows || []).flatMap(r => Array.from({length: Number(r.qty_supplied) || 0}, (_, i) => String(100000 + i))) : [], itemNumbersOf: () => null,
    run782: () => 70,
    assetOf: k => assets.find(a => a.key === k), itemRows: a => a.rows, refKind: a => a.kind || 'toilet',
    rowOff: () => false, subhireOf: k => { const a = assets.find(x => x.key === k) || {}; return a.owner ? null : {co: 'Event Portables'}; }, onhireForAsset: () => [], branchOf: k => assets.find(a => a.key === k).branch || 'KINP',
    effectiveDates: a => ({out_plan: a.out || null, in: a.in || null}), flash: () => {}, mayWrite: () => true, whoAmI: () => 'Fixture operator',
    isRef: k => assets.some(a => a.key === k), bump: () => {}, buzz: () => {}, blank: () => ({}), tombed: () => false,
    fmtStamp: x => x, fmtDay: iso => ({dow: 'Day', dm: String(iso).slice(8, 10) + ' Oct'}), fmtDate: x => x});
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
  ok(run(c, "emptyGate816('WC01','in transit') === false && incoming816('WC01') === false && emptyGate816('WC01','in transit',true) === false") === true, '2 gate_unrecorded_or_non_green_light: from the collection window a move with no recorded arrival is outgoing - refused');
  c.todayIso = () => '2026-10-10'; c.assets[0].in = '2026-10-15'; /* the record holds its delivery date */
  ok(run(c, "incoming816('WC01') === true && emptyGate816('WC01','in transit') === true && emptyGate816('WC01','in transit',true) === false") === true, '2c before its collection window a unit never on site is an incoming trip (named), and the collection path is still refused');
  /* 968aefb #5: from the first event day a unit the record never had on site may have been used - not an incoming trip */
  run(c, "var EVENT_DAYS = ['2026-10-23','2026-10-24','2026-10-25']"); c.todayIso = () => '2026-10-23';
  ok(run(c, "incoming816('WC01') === false && emptyGate816('WC01','in transit') === false") === true, '2d [968aefb #5] from the first event day (23 Oct) a unit with no recorded arrival is not an incoming trip - refused until emptied');
  c.todayIso = () => '2026-10-22';
  ok(run(c, "incoming816('WC01') === true") === true, '2e the day before the event a unit never on site is still an incoming delivery');
  /* R1 (be47bb5): the rule both ways - an incoming delivery needs the record to say so */
  delete c.assets[0].in; c.todayIso = () => '2026-10-18';
  ok(run(c, "movePurpose816('WC01') === 'outgoing' && emptyGate816('WC01','in transit') === false && emptyGate816('WC01','not on site') === false") === true, 'R1a [be47bb5 R1] no recorded arrival and NO delivery date, before the event (18 Oct): outgoing - refused until emptied');
  c.assets[0].in = '2026-10-15';
  ok(run(c, "movePurpose816('WC01') === 'incoming delivery' && emptyGate816('WC01','in transit') === true && emptyGate816('WC01','in transit',true) === false") === true, 'R1b no recorded arrival, a delivery date in the record, before the event: its delivery (allowed), and a collection is still refused');
  c.S.delivery.WC01 = {state: 'not on site', history: [{state: 'on site', at: '2026-10-16T00:00:00Z'}]};
  ok(run(c, "movePurpose816('WC01') === 'outgoing' && emptyGate816('WC01','in transit') === false") === true, 'R1c an arrival on record, before the event, a delivery date too: outgoing - refused until emptied');
  c.S.delivery.WC01 = {state: 'not on site'}; c.todayIso = () => '2026-10-23';
  ok(run(c, "movePurpose816('WC01') === 'outgoing' && emptyGate816('WC01','in transit') === false") === true, 'R1d no arrival, a delivery date, but on the first event day: outgoing - refused until emptied');
  run(c, "EVENT_DAYS = []");
  c.todayIso = () => '2026-10-26';
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

// ---- the follow-up review at 968aefb (review_968aefb.md, commit 6485fa9): seven cases
const pageFn = (name, endMark) => { const s = page.indexOf('function ' + name + '('), e = page.indexOf(endMark, s); if (!(s >= 0 && e > s)) throw new Error(name + ' not found'); return page.slice(s, e); };
block('follow-up 2 and 3: confirming a split keeps its portions; every portion has its pump-out', () => {
  const c = ctx([asset('WC25', [{asked: 'FWF', qty_supplied: 25}]), asset('WC49', [{asked: 'FWF', qty_supplied: 49}], {zone: 'surfers'})]);
  vm.runInContext(pageFn('setDate', '\n/* ------------------------------------------------------------------ typed over the schedule') + '\n' + pageFn('deliveryEmpty', '\n/* The tick as a chip'), c);
  const before = run(c, "JSON.parse(JSON.stringify(demob816().byKey.get('WC25').portions))");
  const first = before.map(p => p.iso).sort()[0];
  run(c, `confirm816('${first}', 'all'); RENDER_MEMO.clear(); 1`);
  const after = run(c, "JSON.parse(JSON.stringify({rec: S.delivery.WC25, r: {src: demobOf816('WC25').src, iso: demobOf816('WC25').iso, portions: demobOf816('WC25').portions}, loads: demob816().days.flatMap(d => demob816().day[d].loads.flatMap(l => l.rows.filter(x => x.r.key === 'WC25').map(x => ({day: d, n: x.n})))) }))");
  const same = JSON.stringify(after.loads.map(x => [x.day, x.n]).sort()) === JSON.stringify(before.map(p => [p.iso, p.n]).sort());
  ok(after.r.src === 'confirmed' && same && Array.isArray(after.rec.out_portions) && after.rec.out_portions.length === before.length, 'F2 confirming a split proposal keeps each portion on its own day, on the record', {before, after});
  const p49 = run(c, "JSON.parse(JSON.stringify((() => { const M = demob816(), r = M.byKey.get('WC49'); return {portions: r.portions, pumped: (r.portions || []).map(p => M.days.some(d => d <= p.iso && M.day[d].pump.some(x => x.r.key === 'WC49')))}; })()))");
  ok(p49.portions && p49.portions.length === 3 && p49.pumped.every(Boolean), 'F3 a 49-unit reference: every portion, the first included, has a pump-out on or before its own day', p49);
});
block('follow-up 4: unknown quantities stay on the trucks after confirmation; a tank waits for an unresolved toilet', () => {
  const c = ctx([asset('WCU', [{asked: 'FWF', qty_asked: null, qty_supplied: null}]), asset('WCM', [{asked: 'FWF', qty_asked: null, qty_supplied: null}, {asked: 'Waste tank', qty_supplied: 1}])]);
  c.S.delivery.WCU = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z'};
  c.S.delivery.WCM = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z'};
  const u = run(c, "JSON.parse(JSON.stringify({loads: demob816().day['2026-10-27'].loads.map(l => ({units: l.units, uncertain: l.uncertain, keys: l.rows.map(x => x.r.key)})), trucks: trucks816('2026-10-27', 'all').map(l => ({kind: l.kind, st: l.t.st.map(s => ({k: s.s.r.key, tank: !!s.s.tankOnly, at: s.at, end: s.end}))}))}))");
  const st = u.trucks.flatMap(l => l.st), toiletM = st.filter(x => x.k === 'WCM' && !x.tank), tankM = st.find(x => x.k === 'WCM' && x.tank);
  ok(u.loads.some(l => l.uncertain && l.keys.includes('WCU')) && st.some(x => x.k === 'WCU'), 'F4a a confirmed unknown-quantity portable stays on its load, marked, and on a truck', u);
  ok(toiletM.length && tankM && tankM.at >= Math.max(...toiletM.map(x => x.end)), 'F4b a tank under an unknown-quantity toilet waits for that toilet stop', {toiletM, tankM});
});
block('follow-up 6: an equal-time pump-out disagreement is settled the same way in either order, and written down', () => {
  const c = ctx([]);
  vm.runInContext(pageFn('mergeRecords', '\nfunction applyImport('), c); run(c, "deliveryEmpty=d=>!d.state && typeof d.emptied!=='boolean'");
  const A = "{delivery:{X:{emptied:true,emptied_by:'A',emptied_at:'2026-10-26T00:00:00Z'}}}", B = "{delivery:{X:{emptied:false,emptied_by:'B',emptied_at:'2026-10-26T00:00:00Z'}}}";
  const ab = run(c, `JSON.parse(JSON.stringify(mergeRecords(${A},${B})))`), ba = run(c, `JSON.parse(JSON.stringify(mergeRecords(${B},${A})))`);
  const again = run(c, `JSON.parse(JSON.stringify(mergeRecords(${JSON.stringify(ab.merged)}, ${JSON.stringify(ab.merged)}).merged))`);
  ok(ab.merged.delivery.X.emptied === false && ba.merged.delivery.X.emptied === false && ab.report.clashes.some(x => /emptied/.test(x)) && ba.report.clashes.some(x => /emptied/.test(x)) && JSON.stringify(again.delivery) === JSON.stringify(ab.merged.delivery),
    'F6 same time, two answers: not emptied on every copy, in either order, idempotent, the clash written down', {ab: ab.merged.delivery, ba: ba.merged.delivery, clashes: ab.report.clashes});
  c.S.delivery.Y = {emptied: true, emptied_by: 'A', emptied_at: '2026-10-26T00:00:00Z'}; c.CROW.set('Y', {delivery: {emptied: false, emptied_by: 'B', emptied_at: '2026-10-26T00:00:00Z'}});
  ok(run(c, "emptiedOf816('Y').on") === false, 'F6b the page itself reads an equal-time disagreement as not emptied');
});
block('follow-up 7: an added reference\'s dated removal event is its plan date out', () => {
  const c = ctx([asset('AD1', [{asked: 'Generator', qty_supplied: 1}], {kind: 'generator', _added: true, first_date: '2026-10-20', last_date: '2026-10-20', out: '2026-11-05', events: [{movement: 'place', date: '2026-10-20'}, {movement: 'remove', date: '2026-11-05'}]}),
    asset('AD2', [{asked: 'Generator', qty_supplied: 1}], {kind: 'generator', _added: true, first_date: '2026-10-20', last_date: '2026-10-20', out: '2026-10-20', events: []})]);
  const r = run(c, "JSON.parse(JSON.stringify([demobOf816('AD1'), demobOf816('AD2')].map(x => ({src: x.src, iso: x.iso}))))");
  ok(r[0].src === 'plan' && r[0].iso === '2026-11-05' && r[1].src === 'proposed', 'F7 an explicit removal event keeps its date (5 Nov); a one-day added reference without one is proposed', r);
});
// ---- Codex's follow-up after 6a0bb20 (relayed 3 Oct 2026): three cases, each failing on the source before the fix
const unitsOn = (c, key) => run(c, `JSON.parse(JSON.stringify(demob816().days.flatMap(d => demob816().day[d].loads.flatMap(l => l.rows.filter(x => x.r.key === '${key}').map(x => ({day: d, n: x.n, unplanned: !!x.unplanned, pid: x.pid || null}))))))`);
block('G1: two confirmed portions on the same day are both collected', () => {
  const c = ctx([asset('WS25', [{asked: 'FWF', qty_supplied: 25}])]);
  c.S.delivery.WS25 = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z', out_portions: [{date: '2026-10-27', units: 24}, {date: '2026-10-27', units: 1}]};
  const u = unitsOn(c, 'WS25'), sum = u.reduce((s, x) => s + x.n, 0);
  ok(sum === 25 && u.length === 2 && u.every(x => x.day === '2026-10-27') && new Set(u.map(x => x.pid)).size === 2, 'G1 [after 6a0bb20 #1] a 25-unit reference confirmed as 24 + 1 on the same day: both portions are on the day\'s loads (25 units, two portion ids)', u);
  /* the same through the real confirmation: a proposed 25 whose two loads land on one day */
  const c2 = ctx([asset('WS26', [{asked: 'FWF', qty_supplied: 25}])]);
  vm.runInContext(pageFn('setDate', '\n/* ------------------------------------------------------------------ typed over the schedule') + '\n' + pageFn('deliveryEmpty', '\n/* The tick as a chip'), c2);
  run(c2, "days816 = () => (DM816.days = ['2026-10-26'])"); run(c2, "RENDER_MEMO.clear()");
  const pre = unitsOn(c2, 'WS26'); run(c2, "confirm816('2026-10-26', 'all'); RENDER_MEMO.clear(); 1");
  const post = unitsOn(c2, 'WS26'), rec = run(c2, "JSON.parse(JSON.stringify(S.delivery.WS26))");
  ok(pre.reduce((s, x) => s + x.n, 0) === 25 && post.reduce((s, x) => s + x.n, 0) === 25 && rec.out_portions && rec.out_portions.every(p => p.id), 'G1b confirming a 25-unit proposal whose two loads share a day writes both portions (with ids) and keeps all 25 units', {pre, post, rec: rec.out_portions});
});
block('G2: a quantity corrected after portions were confirmed is reconciled and said', () => {
  const mk = q => { const c = ctx([asset('WQ', [{asked: 'FWF', qty_supplied: q}])]);
    c.S.delivery.WQ = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z', out_portions: [{date: '2026-10-26', units: 24}, {date: '2026-10-27', units: 1}]}; return c; };
  const up = mk(28), uu = unitsOn(up, 'WQ'), uw = run(up, "(demobOf816('WQ').qtyChange || {}).words || ''");
  ok(uu.reduce((s, x) => s + x.n, 0) === 28 && uu.some(x => x.unplanned && x.n === 3 && x.day === '2026-10-27') && /from 25 to 28 since confirmed: 3 units unplanned/.test(uw), 'G2a [after 6a0bb20 #2] 25 confirmed, now 28: all 28 on loads, 3 marked unplanned on the due-out day, and "quantity changed from 25 to 28 since confirmed: 3 units unplanned"', {uu, uw});
  const dn = mk(22), du = unitsOn(dn, 'WQ'), dw = run(dn, "(demobOf816('WQ').qtyChange || {}).words || ''");
  ok(du.reduce((s, x) => s + x.n, 0) === 22 && /from 25 to 22 since confirmed: 3 fewer/.test(dw), 'G2b 25 confirmed, now 22: 22 on loads (none counted twice), and the change is said', {du, dw});
  const un = ctx([asset('WQ', [{asked: 'FWF', qty_supplied: null, qty_asked: null}])]); un.S.delivery.WQ = mk(25).S.delivery.WQ;
  const nw = run(un, "(demobOf816('WQ').qtyChange || {}).words || ''"), nl = run(un, "demob816().day['2026-10-26'].loads.concat(demob816().day['2026-10-27'].loads).filter(l => l.rows.some(x => x.r.key === 'WQ')).every(l => l.uncertain)");
  ok(/now to confirm/.test(nw) && nl === true, 'G2c a confirmed split whose quantity is now unknown says so, and its loads are uncertain', {nw, nl});
  const same = mk(25); ok(run(same, "demobOf816('WQ').qtyChange") === null, 'G2d an unchanged quantity carries no change note');
  const html = run(up, "esc = s => String(s); refPlate = k => k; dashLeds = () => ''; kindWord = () => 'toilet'; canEdit = () => false; demob816(); toiletHtml816(demob816().day['2026-10-27'])");
  ok(/unplanned - quantity changed/.test(html) && /quantity changed from 25 to 28/.test(html), 'G2e the toilet run shows the unplanned units and the change', String(html).slice(0, 120));
});
block('G3: a load with an unknown quantity is never green "full"', () => {
  const c = ctx([asset('WF24', [{asked: 'FWF', qty_supplied: 24}]), asset('WFU', [{asked: 'FWF', qty_supplied: null, qty_asked: null}])]);
  c.S.delivery.WF24 = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z'};
  c.S.delivery.WFU = {state: 'on site', out_date: '2026-10-27', out_by: 'A', out_at: '2026-10-03T00:00:00Z'};
  run(c, "esc = s => String(s); refPlate = k => k; dashLeds = () => ''; kindWord = () => 'toilet'; canEdit = () => false");
  const html = String(run(c, "toiletHtml816(demob816().day['2026-10-27'])")), unc = run(c, "demob816().day['2026-10-27'].loads.filter(l => l.uncertain).length");
  ok(unc > 0 && !/chip ok">full/.test(html) && /chip cand[^"]*">to confirm/.test(html), 'G3 [after 6a0bb20 #3] a load holding an unknown quantity shows amber "to confirm", never green "full"', {unc, chips: html.match(/<span class="chip[^"]*">[^<]*/g)});
});
// ---- Codex e540cbc (commit 6ebb321): a confirmed quantity corrected to 0 is nothing to collect - no load, no truck, no 1
block('G4: a confirmed quantity corrected to 0 makes no load and no truck; unknown stays "to confirm"', () => {
  const c = ctx([asset('WZ', [{asked: 'FWF', qty_supplied: 6}])]);
  vm.runInContext(pageFn('setDate', '\n/* ------------------------------------------------------------------ typed over the schedule') + '\n' + pageFn('deliveryEmpty', '\n/* The tick as a chip'), c);
  const d0 = run(c, "demobOf816('WZ').iso"); run(c, `confirm816('${d0}', 'all'); RENDER_MEMO.clear(); 1`);
  const conf = run(c, "JSON.parse(JSON.stringify({src: demobOf816('WZ').src, iso: demobOf816('WZ').iso}))");
  const six = unitsOn(c, 'WZ').reduce((s, x) => s + x.n, 0);
  c.assets[0].rows[0].qty_supplied = 0; run(c, "RENDER_MEMO.clear()");
  const z = run(c, `JSON.parse(JSON.stringify((() => { const M = demob816(), r = M.byKey.get('WZ'), d = r.iso; const T = trucks816(d, 'all');
    return {nothing: r.nothing, onList: M.day[d].list.some(x => x.key === 'WZ'), loads: M.days.flatMap(x => M.day[x].loads.filter(l => l.rows.some(y => y.r.key === 'WZ')).map(l => l.units)),
      truckStops: T.flatMap(L => L.t.st.filter(s => s.s.r.key === 'WZ').map(s => s.s.parts.map(p => p.n + ' ' + p.type))), pump: M.day[d].pump.some(x => x.r.key === 'WZ')}; })()))`);
  ok(conf.src === 'confirmed' && six === 6 && z.nothing === true && z.onList && !z.loads.length && !z.truckStops.length && !z.pump, 'G4 [e540cbc] confirmed 6, corrected to 0: still listed ("nothing to collect"), no load, no truck stop, no pump-out, never a 1-unit fallback', {conf, six, z});
  c.assets[0].rows[0].qty_supplied = null; c.assets[0].rows[0].qty_asked = null; run(c, "RENDER_MEMO.clear()");
  const u = run(c, `JSON.parse(JSON.stringify((() => { const M = demob816(), r = M.byKey.get('WZ'); return {nothing: r.nothing, unk: r.evtUnk, loads: M.days.flatMap(x => M.day[x].loads.filter(l => l.rows.some(y => y.r.key === 'WZ')).map(l => ({units: l.units, uncertain: l.uncertain})))}; })()))`);
  ok(u.nothing === false && u.unk === true && u.loads.length === 1 && u.loads[0].uncertain, 'G4b the same reference with its quantity unknown: "to confirm" on an uncertain load - 0 and unknown stay distinct', u);
  const p0 = ctx([asset('WP0', [{asked: 'FWF', qty_supplied: 0}])]);
  const pz = run(p0, "JSON.parse(JSON.stringify({loads: demob816().planned.length, stops: demob816().days.flatMap(d => trucks816(d, 'all')).length}))");
  ok(pz.loads === 0 && pz.stops === 0, 'G4c a proposed reference with a known 0 makes no planned load and no truck', pz);
});
console.log(fails ? `\n${fails} FAILED, ${passes} passed` : `\nALL PASSED (${passes})`); process.exitCode = fails ? 1 : 0;
