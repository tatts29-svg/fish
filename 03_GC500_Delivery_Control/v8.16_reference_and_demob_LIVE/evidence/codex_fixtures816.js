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
// ---- Two toilet runs (the project manager, 3 Oct 2026: sub-hired on the supplier's own run, Coates' own run "if any",
// 12-14 a Coates load), branch-flagged oversize per the QLD Access Conditions Guide v6.0
const fixed = (c, keys, iso) => keys.forEach(k => { c.S.delivery[k] = {state: 'on site', out_date: iso, out_by: 'A', out_at: '2026-10-03T00:00:00Z'}; });
const loadsOf = (c, iso) => run(c, `JSON.parse(JSON.stringify(demob816().day['${iso}'].loads.map(l => ({stream: l.stream, units: l.units, cap: l.cap, capWarn: l.capWarn, keys: l.rows.map(x => x.r.key)}))))`);
const stubs = "esc = s => String(s); refPlate = k => k; dashLeds = () => ''; kindWord = () => 'toilet'; canEdit = () => false; dest782 = () => null; srcWords816 = () => ''; fmtStamp = x => x; dayWords816 = x => x; ovNote816 = () => ''; DATA.brand = {}; DATA.driver_rules = {}; wayIn816 = () => ''";
block('H: sub-hire and Coates toilets on separate runs', () => {
  const c = ctx([asset('HS1', [{asked: 'FWF', qty_supplied: 10}]), asset('HC1', [{asked: 'FWF', qty_supplied: 5}], {owner: 'coates'}), asset('HS2', [{asked: 'FWF', qty_supplied: 4}]), asset('HC2', [{asked: 'FWF', qty_supplied: 3}], {owner: 'coates'})]);
  fixed(c, ['HS1', 'HC1', 'HS2', 'HC2'], '2026-10-27');
  const L = loadsOf(c, '2026-10-27'), mixed = L.filter(l => new Set(l.keys.map(k => k[1])).size > 1);
  ok(L.length === 2 && !mixed.length && L.find(l => l.stream === 'sub').units === 14 && L.find(l => l.stream === 'coates').units === 8, 'H1 sub-hire and Coates toilets never share a load (14 sub-hire on one, 8 Coates on another)', L);
  const s30 = ctx([asset('HS30', [{asked: 'FWF', qty_supplied: 30}])]); fixed(s30, ['HS30'], '2026-10-27');
  const L30 = loadsOf(s30, '2026-10-27');
  ok(L30.length === 2 && L30.map(l => l.units).join('+') === '24+6' && L30.every(l => l.stream === 'sub' && l.cap === 24), 'H2 30 sub-hire toilets make 2 loads (24 + 6), at up to 24', L30);
  const c26 = ctx([asset('HC26', [{asked: 'FWF', qty_supplied: 26}], {owner: 'coates'})]); fixed(c26, ['HC26'], '2026-10-27');
  const L26 = loadsOf(c26, '2026-10-27');
  ok(L26.map(l => l.units).join('+') === '12+12+2' && L26.every(l => l.stream === 'coates' && l.cap === 12), 'H3a 26 Coates toilets make 3 loads (12 + 12 + 2), planned at 12', L26);
  const c12 = ctx([asset('HC12', [{asked: 'FWF', qty_supplied: 12}], {owner: 'coates'})]); fixed(c12, ['HC12'], '2026-10-27');
  ok(loadsOf(c12, '2026-10-27').length === 1, 'H3b 12 Coates toilets make 1 load');
  run(s30, stubs); const h0 = String(run(s30, "toiletHtml816(demob816().day['2026-10-27'])"));
  ok(!/Coates toilet run/.test(h0) && /Sub-hire pick-up/.test(h0) && !loadsOf(s30, '2026-10-27').some(l => l.stream === 'coates'), 'H3c 0 Coates toilets: no Coates run is shown');
  run(c26, stubs); const h26 = String(run(c26, "toiletHtml816(demob816().day['2026-10-27'])"));
  ok(/12–14 per load/.test(h26) && !/to confirm - capacity/.test(h26), 'H3d the Coates run shows its capacity as 12–14 per load, planned at 12', (h26.match(/12–14[^<]*/) || [])[0]);
  c26.localStorage.setItem('gc500.demob816.cap.2026-10-27.coates1', '15'); run(c26, 'RENDER_MEMO.clear()');
  const L15 = loadsOf(c26, '2026-10-27'), h15 = String(run(c26, "toiletHtml816(demob816().day['2026-10-27'])"));
  ok(L15[0].cap === 15 && L15[0].capWarn === true && /over 14 - check the truck/.test(h15) && L15.slice(1).every(l => !l.capWarn), 'H4 a Coates load edited to 15 carries the "over 14" warning; the others do not', L15);
  c26.localStorage.setItem('gc500.demob816.cap.2026-10-27.coates1', '14'); run(c26, 'RENDER_MEMO.clear()');
  ok(loadsOf(c26, '2026-10-27')[0].capWarn === false, 'H4b a load set to 14 (a truck the branch confirmed) carries no warning');
  const own = ctx([asset('HU', [{asked: 'FWF', qty_supplied: 6}], {owner: 'unknown'}), asset('HS', [{asked: 'FWF', qty_supplied: 2}])]); fixed(own, ['HU', 'HS'], '2026-10-27'); run(own, stubs);
  const LU = loadsOf(own, '2026-10-27'), hu = String(run(own, "toiletHtml816(demob816().day['2026-10-27'])"));
  ok(!LU.some(l => l.keys.includes('HU')) && /Owner to confirm - on neither run/.test(hu) && run(own, "demobOf816('HU').ownerUnk") === 6, 'H5 a portable nobody recorded as Coates\' or the supplier\'s is "owner to confirm" and on neither run', LU);
});
block('H: travel time per run; the supplier\'s pick-up has none', () => {
  const c = ctx([asset('HS', [{asked: 'FWF', qty_supplied: 8}]), asset('HC', [{asked: 'FWF', qty_supplied: 8}], {owner: 'coates'})]); fixed(c, ['HS', 'HC'], '2026-10-27'); run(c, stubs);
  const tv = run(c, "JSON.parse(JSON.stringify(travel816('coates')))"), T = run(c, "JSON.parse(JSON.stringify(trucks816('2026-10-27', 'all').map(L => ({kind: L.kind, dep: L.t.dep, travel: L.t.travel, back: L.t.back}))))");
  const coates = T.find(x => x.kind === 'toilets'), supl = T.find(x => x.kind === 'supplier');
  const hT = String(run(c, "trucksHtml816(demob816().day['2026-10-27'], trucks816('2026-10-27', 'all'))")), supCard = hT.split('sup816')[1] ? hT.split('sup816')[1].split('<div class="card load816 truck816 nosfold">')[0] : '';
  ok(tv.v === 70 && /planning figure, not a live time/.test(tv.words) && coates && coates.travel === 70 && coates.dep != null && /planning figure, not a live time/.test(hT), 'H6 the Coates run starts from the page\'s 70 min Kingston figure, labelled "planning figure, not a live time", and gets departure times', {tv, coates});
  ok(supl && supl.dep === null && supl.travel === null && supl.back === null && supCard && !/Leave Kingston|travel time to confirm|data-trv816/.test(supCard), 'H7 the sub-hire pick-up has no departure, no travel time and no travel-time field', {supl, card: supCard.slice(0, 160)});
  c.localStorage.setItem('gc500.demob816.travel', JSON.stringify({coates: ''})); run(c, 'RENDER_MEMO.clear()');
  const T2 = run(c, "JSON.parse(JSON.stringify(trucks816('2026-10-27', 'all').filter(L => L.kind === 'toilets').map(L => ({dep: L.t.dep, back: L.t.back, travel: L.t.travel}))))");
  const h2 = String(run(c, "trucksHtml816(demob816().day['2026-10-27'], trucks816('2026-10-27', 'all'))"));
  ok(T2.length && T2.every(x => x.dep === null && x.back === null && x.travel === null) && /Leave Kingston travel time to confirm/.test(h2), 'H8 a blank travel time never produces a computed departure or return - "travel time to confirm"', T2);
  const sheet = String(run(c, "(() => { const L = trucks816('2026-10-27', 'all').find(L => L.kind === 'supplier'); return sheet816('2026-10-27', L); })()"));
  ok(/pick-up list/.test(sheet) && !/Leave Kingston/.test(sheet) && /Supplier's own/.test(sheet) && /NOT READY: empty first/.test(sheet), 'H9 the supplier\'s printed sheet is a pick-up list: no departure, its transport is the supplier\'s, emptied status shown', sheet.length);
});
block('H: oversize (only when the branch flags it) and the gate on both runs', () => {
  const a = run(ctx([]), "JSON.parse(JSON.stringify([ovCheck816(930, 70), ovCheck816(600, null), ovCheck816(600, 70), ovCheck816(480, 70)]))");
  ok(a[0].latest === 890 && a[0].flags.some(f => /after the latest departure 14:50/.test(f)), 'H10 an oversize load leaving site at 15:30 with 70 min to travel is flagged (latest departure 14:50)', a[0]);
  ok(a[1].latest === null && a[1].flags.some(f => /travel time to confirm/.test(f)), 'H11 a blank travel time gives no latest departure, only "travel time to confirm"', a[1]);
  ok(!a[2].flags.length && a[3].flags.some(f => /Gold Coast peak/.test(f)), 'H12 leaving at 10:00 is clear; leaving at 08:00 is flagged for the Gold Coast peak', [a[2], a[3]]);
  const pk = run(ctx([]), "JSON.parse(JSON.stringify([ovCheck816(360, 50), ovCheck816(360, 70)]))");
  ok(!pk[0].flags.length && pk[1].flags.some(f => /07:00-09:00/.test(f)), 'H12b the peak flag is the guide\'s window exactly: 06:00 with 50 min on the road is clear; 06:00 with 70 min runs into 07:00 and is flagged', pk);
  const c = ctx([asset('HB1', [{asked: 'Building 6m', qty_supplied: 1}], {kind: 'building', owner: 'coates'}), asset('HB2', [{asked: 'Building 6m', qty_supplied: 1}], {kind: 'building', owner: 'coates', branch: 'NVAC'})]);
  run(c, "refKind = a => a.kind || 'toilet'"); fixed(c, ['HB1', 'HB2'], '2026-10-27'); run(c, stubs);
  const before = run(c, "trucks816('2026-10-27', 'all').filter(L => L.ov).length");
  run(c, "trucks816('2026-10-27', 'all').forEach(L => ovFlag816(L.ovId, true)); RENDER_MEMO.clear()");
  const T = run(c, "JSON.parse(JSON.stringify(trucks816('2026-10-27', 'all').map(L => ({leave: L.t.leave, ov: L.ov, flags: L.ovc ? L.ovc.flags : null}))))");
  const same = T.length === 2 && T[0].leave === T[1].leave;
  ok(before === 0 && T.every(x => x.ov) && same && T.every(x => x.flags.some(f => /stagger departures/.test(f))), 'H13 nothing is oversize until the branch flags it; two flagged loads leaving together are told to stagger departures', {before, T});
  const h = String(run(c, "trucksHtml816(demob816().day['2026-10-27'], trucks816('2026-10-27', 'all'))"));
  ok(/Check TMR Conditions of Operation Database before each trip/.test(h) && /pilot \/ escort: check permit/.test(h) && /s11\.2 Table 3/.test(h) && !/pilot[^<]{0,20}\d/.test(h), 'H14 a flagged load says check the TMR database, pilot / escort "check permit" (never a number), and cites the guide in a tooltip');
  const g = ctx([asset('HG', [{asked: 'FWF', qty_supplied: 4}]), asset('HGC', [{asked: 'FWF', qty_supplied: 4}], {owner: 'coates'})]);
  vm.runInContext(pageFn('setLight', '\nfunction ') , g);
  g.S.delivery.HG = {state: 'on site', history: [{state: 'on site', at: '2026-10-20T00:00:00Z'}]}; g.S.delivery.HGC = {state: 'on site', history: [{state: 'on site', at: '2026-10-20T00:00:00Z'}]};
  ok(run(g, "collect816('HG') === false && collect816('HGC') === false && emptyGate816('HG','in transit',true) === false && emptyGate816('HGC','in transit',true) === false") === true, 'H15 the emptied gate still blocks loading on both runs (sub-hire and Coates) until it is recorded as emptied');
  const w = ctx([asset('HW', [{asked: 'Building 6m', qty_supplied: 1}], {kind: 'building', owner: 'coates'})]); w.S.delivery.HW = {out_date: '2026-10-31', out_by: 'A', out_at: '2026-10-03T00:00:00Z'};
  ok(run(w, "demob816().outside.some(r => r.key === 'HW' && r.iso === '2026-10-31')") === true, 'H16 a reference dated on a weekend inside the window is shown as outside the demob days (flagged), never lost');
});
block('I: a reference split between owners, its dates per run (Codex abbb01b #1)', () => {
  const c = ctx([asset('MIX', [{asked: 'FWF', qty_supplied: 25}])]);
  run(c, "owner816 = (a, u, n, unk) => a.key === 'MIX' ? {streams: [{s: 'sub', n: 24}, {s: 'coates', n: 1}], ownerUnk: 0, co: 'Event Portables'} : {streams: [], ownerUnk: n, co: ''}");
  run(c, "days816 = () => (DM816.days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'])"); run(c, 'RENDER_MEMO.clear()');
  vm.runInContext(pageFn('setDate', '\n/* ------------------------------------------------------------------ typed over the schedule') + '\n' + pageFn('deliveryEmpty', '\n/* The tick as a chip'), c);
  const byRun = () => run(c, "JSON.parse(JSON.stringify(demob816().days.flatMap(d => demob816().day[d].loads.filter(l => l.rows.some(x => x.r.key === 'MIX')).map(l => ({d, s: l.stream, n: l.rows.filter(x => x.r.key === 'MIX').reduce((a, x) => a + x.n, 0)})))))");
  const pre = byRun(), days = [...new Set(pre.map(x => x.d))];
  const listed = run(c, `${JSON.stringify(days)}.every(d => demob816().day[d].list.some(r => r.key === 'MIX'))`);
  ok(pre.length === 2 && pre.some(x => x.s === 'sub' && x.n === 24) && pre.some(x => x.s === 'coates' && x.n === 1) && listed === true, 'I1 24 supplier units and 1 Coates unit each have a run and a day, and the reference is on every one of those days\' pick-up lists', {pre, listed});
  const n = run(c, `confirm816('${days[0]}', 'all')`); run(c, 'RENDER_MEMO.clear()');
  const post = byRun(), rec = run(c, "JSON.parse(JSON.stringify(S.delivery.MIX))");
  ok(n === 1 && JSON.stringify(post) === JSON.stringify(pre) && rec.out_portions.every(p => p.stream), 'I2 confirming on its first day finds it, writes each portion with its run, and every run keeps its day', {n, post, rec: rec.out_portions});
  c.S.delivery = JSON.parse(JSON.stringify(c.S.delivery)); run(c, 'RENDER_MEMO.clear()');
  ok(JSON.stringify(byRun()) === JSON.stringify(pre), 'I3 after a reload (the record read back) the runs and days are the same');
  run(c, "owner816 = (a, u, n, unk) => a.key === 'MIX' ? {streams: [{s: 'sub', n: 22}, {s: 'coates', n: 3}], ownerUnk: 0, co: 'Event Portables'} : {streams: [], ownerUnk: n, co: ''}; RENDER_MEMO.clear()");
  const moved = byRun(), w = run(c, "demobOf816('MIX').qtyChange && demobOf816('MIX').qtyChange.words");
  ok(moved.filter(x => x.s === 'sub').reduce((a, x) => a + x.n, 0) === 22 && moved.filter(x => x.s === 'coates').reduce((a, x) => a + x.n, 0) === 3 && /owners changed/.test(w), 'I4 when the split between owners changes after confirmation, each run is reconciled on its own and the change is said', {moved, w});
});
block('I: supplier print, travel overrides, the permit status and the supplier hold (Codex abbb01b #3, roads #2-#4)', () => {
  const c = ctx([asset('PS', [{asked: 'FWF', qty_supplied: 5}])]); fixed(c, ['PS'], '2026-10-27'); run(c, stubs);
  run(c, "window = {print: () => {}, addEventListener: () => {}}; document = {getElementById: () => null, createElement: () => ({classList: {add() {}, remove() {}}, dataset: {}, remove() {}}), body: {appendChild: e => e, classList: {add() {}, remove() {}}}, querySelectorAll: () => [], head: {appendChild() {}}}; setTimeout = () => 0");
  ok(run(c, "printDay816('2026-10-27', 'all', 'load', 'sub1')") === 1 && run(c, "printDay816('2026-10-27', 'all', 'load', 1)") === 1, 'I5 "Print this load" on a supplier load prints it (by its run-aware id, or by its number)');
  const kinds = ctx([asset('PS', [{asked: 'FWF', qty_supplied: 5}]), asset('PC', [{asked: 'FWF', qty_supplied: 5}], {owner: 'coates'}), asset('PB', [{asked: 'Building 6m', qty_supplied: 1}], {kind: 'building', owner: 'coates'}), asset('PN', [{asked: 'Generator', qty_supplied: 1}], {kind: 'generator', owner: 'coates'})]);
  run(kinds, "refKind = a => a.kind || 'toilet'"); fixed(kinds, ['PS', 'PC', 'PB', 'PN'], '2026-10-27'); run(kinds, stubs);
  const sh = run(kinds, "(() => { const T = trucks816('2026-10-27', 'all'); return T.map(L => { try { const h = sheet816('2026-10-27', L); return {kind: L.kind, ok: h.length > 500 && !/00:00/.test(h.replace(/\d\d:00–\d\d:00/g, ''))}; } catch (e) { return {kind: L.kind, err: e.message}; } }); })()");
  ok(['supplier', 'toilets', 'single', 'normal'].every(k => sh.some(x => x.kind === k && x.ok)), 'I6 a non-empty run sheet prints for every run type - supplier pick-up, Coates toilet run, single big piece, branch truck - with no midnight times', sh);
  const o = ctx([]); o.localStorage.setItem('gc500.demob816.assume', JSON.stringify({run: 120}));
  const mig = run(o, "JSON.parse(JSON.stringify({b: travel816('branch'), c: travel816('coates'), old: JSON.parse(localStorage.getItem(ASSUME816_KEY) || '{}').run}))");
  ok(mig.b.v === 120 && mig.c.v === 120 && /carried over from the earlier Kingston-run setting/.test(mig.b.words) && mig.old === undefined, 'I7 a Kingston-run figure saved under the earlier draft (120 min) is carried over once into both runs, said so, and the old setting removed - never applied silently', mig);
  run(kinds, "ovFlag816(trucks816('2026-10-27', 'all').find(L => L.kind === 'single').ovId, false); RENDER_MEMO.clear()");
  const hk = String(run(kinds, "trucksHtml816(demob816().day['2026-10-27'], trucks816('2026-10-27', 'all'))"));
  ok(/oversize\? the branch to say - permit not checked/.test(hk) && /data-ov816=/.test(hk) && /data-trv816="branch"/.test(hk) && /data-trv816="coates"/.test(hk), 'I8 an unflagged big piece says "oversize? the branch to say - permit not checked"; the oversize tick and both travel fields are on the page');
  const t2 = ctx([asset('TT', [{asked: 'FWF', qty_supplied: 2}, {asked: 'Waste tank', qty_supplied: 1}])]); fixed(t2, ['TT'], '2026-10-27'); run(t2, stubs);
  const ht = String(run(t2, "trucksHtml816(demob816().day['2026-10-27'], trucks816('2026-10-27', 'all'))")), st = String(run(t2, "(() => { const L = trucks816('2026-10-27', 'all').find(L => L.kind === 'normal'); return sheet816('2026-10-27', L); })()"));
  ok(/hold: after the supplier has lifted the toilet off it, and the tank is emptied/.test(ht) && /<td class="t" data-label="Time">after the supplier<\/td>/.test(ht) && /HOLD: only after the supplier/.test(st), 'I9 a tank under a supplier\'s toilet carries a hold, not a clock time: after the supplier\'s pick-up, and emptied');
});
block('J: a Coates truck that takes fewer (Codex 8c821da)', () => {
  const c = ctx([asset('C12', [{asked: 'FWF', qty_supplied: 12}], {owner: 'coates'})]); fixed(c, ['C12'], '2026-10-27'); run(c, stubs);
  c.localStorage.setItem('gc500.demob816.cap.2026-10-27.coates1', '8'); run(c, 'RENDER_MEMO.clear()');
  const L = loadsOf(c, '2026-10-27'), h = String(run(c, "toiletHtml816(demob816().day['2026-10-27'])"));
  ok(L.map(l => l.units + '/' + l.cap).join(' ') === '8/8 4/12' && !/overloaded/.test(h) && /re-packed/.test(h), 'J1 a 12-unit Coates load on a truck set to 8 is re-packed 8 + 4; neither is over its truck', L);
  const over = run(c, "(() => { const Dy = demob816().day['2026-10-27'], L = Object.assign({}, Dy.loads[0], {units: 10, free: -2}); return loadCard816(Dy, L, null); })()");
  ok(/overloaded - 2 over this truck's 8/.test(over) && !/>full</.test(over), 'J2 a load over its truck is never "full": it says "overloaded" and by how many', String(over).match(/<span class="chip[^"]*">[^<]*/g));
});
console.log(fails ? `\n${fails} FAILED, ${passes} passed` : `\nALL PASSED (${passes})`); process.exitCode = fails ? 1 : 0;
