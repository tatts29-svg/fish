// Author: Andrew Fisher.
// Offline native-function regression with fictional TEST-REF records only.
// Usage: node verify_flow891_windows.cjs /path/to/candidate.html --expect-fixed
// Omitting --expect-fixed asserts the two original defects instead. No embedded records run.
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), crypto = require('crypto');
const args = process.argv.slice(2), fixed = args.includes('--expect-fixed'), file = args.find(x => !x.startsWith('--'));
assert(file, 'Pass a candidate HTML file');
const html = fs.readFileSync(file, 'utf8');
function section(start, end) {
 const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
 assert(a >= 0 && b > a, 'Missing source section ' + start); return html.slice(a, b);
}
function declaration(start) {
 const a = html.indexOf(start); assert(a >= 0, 'Missing native declaration ' + start);
 let b = a;
 while ((b = html.indexOf('\n', b + 1)) >= 0 && b - a < 100000) {
  const code = html.slice(a, b);
  try { new vm.Script(code); return code; } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
 }
 throw Error('Cannot extract native declaration ' + start);
}
const fn = name => declaration('function ' + name + '(');
const clone = x => JSON.parse(JSON.stringify(x));
const day = {iso: '2030-01-15', deliveries: [], removals: [], loads: []};
const asset = {key: 'TEST-REF', product: 'Fictional test item', discipline: 'Fixture'};
const booking = {departure_order: 1, loads: ['test-truck-a', 'test-truck-b'].map(truck_id => ({truck_id, load_time: '05:00', carrier: 'Fictional carrier', quantity: 1, asset_numbers: []}))};
const event = {item: 'Fictional test item', movement: 'deliver', booking801: booking};
day.deliveries = [{a: asset, events: [event]}];
const data = {assets: [asset], weeks: [], transport: {arrival: {after: '08:00'}}};
const blocked = new Set(); let canWrite = true, operator = 'Fixture Reviewer', saves = 0;
const context = vm.createContext({
 DATA: data, S: {loads: {}, operator}, SYNC: {backend: {readVersion821: () => 1}},
 programmeDays: () => [day], assetOf: key => data.assets.find(a => a.key === key),
 mayWrite: () => canWrite, whoAmI: () => operator, flash() {}, save: () => true,
 bump() { saves++; context.RENDER_MEMO.clear(); },
 whereText: () => ({main: 'Fictional location'}), run782: () => 70,
 UNLOAD_MIN782: 30, LOAD_BY782: 300, PEAKS782: [[420, 540], [960, 1080]],
 zone816: () => ({zone: 'mbp'}), meetPoint819: () => null,
 dpItemsWords: () => '', hasTank782: () => false, etaSort: () => 0,
 localStorage: {getItem: () => null}, todayIso: () => '2030-01-14',
 crew883PrintDay: '', RENDER_MEMO: new Map(), rowOff: key => blocked.has(key), fmtDate: x => x,
 dpBasisShort: () => 'Fictional booking', ldState: () => ({word: 'Fixture', c: ''}), dest782: () => null,
 order782: () => null, entry782: () => null, daily821Plain: x => x,
 bookingNotes801: () => '', dpDeliveryNotes798: () => '', ldWhat: r => r.a.product,
 dpItems: () => [], ldPlace: () => 'Fictional location', sheet808What: () => '', dpNums: () => [],
 text747WayIn: () => '', dirs782: () => '', esc: x => String(x),
 IMPORT_MAX_TEXT: 20000, IMPORT_MAX_ITEMS: 50000, BRANCH_MAX: 80,
 safeNum: x => Number.isFinite(Number(x)) ? +x : null, MAX_RATE: 100000,
 webLink: x => /^https?:\/\//.test(x), fmtStamp: x => x,
});
const native = ['ldId','hhmm782','clock782','crew883Key','crew883Day','crew883Arrival','crew883Finish','crew883Plan','crew883Assess','crew883Summary','crew883Transport',
 'dpT','bookingRows801','bookingSort801','bookingGroups801','dpLoadsBefore801','dpLoads','daily821Date','daily821Model','docIdOf','toDocs','fromDocs','validateRecords'];
vm.runInContext(native.map(fn).join('\n') + '\n' + declaration('const dpUniq ='), context);
vm.runInContext(section('const FLOW891 =', '/* the list moves smoothly'), context);
vm.runInContext(fn('flow891HeadLines') + '\n' + section('const daily821ModelBefore891 =', 'const daily821HtmlBefore891 ='), context);
context.SYNC_COLLS = {loads: {kind: 'map', get: () => context.S.loads}};
const ids = () => Array.from(context.dpLoads(day), g => context.ldId(day, g));
const windows = () => Array.from(context.flow891Build(day).deliveries, x => ({id: x.id, n: x.n, start: x.win.start, finish: x.win.finish}));
const originalIds = ids(); assert.equal(new Set(originalIds).size, 2);
const checks = [];
function check(name, body) { body(); checks.push(name); }
function reset() { context.S.loads = {}; context.RENDER_MEMO.clear(); blocked.clear(); canWrite = true; operator = 'Fixture Reviewer'; }
if (!fixed) {
 const before = windows(); const conflict = context.flow891Build(day).areas.find(a => a.key === 'mainBeach').conflicts[0];
 assert(context.flow891SetWindow(day.iso, conflict.move.id, conflict.to, conflict.len));
 const after = windows(); assert.notEqual(after[0].start, before[0].start); assert.equal(after[0].start, after[1].start);
 reset(); assert(context.crew883Summary(day.iso, asset.key).startsWith('People required to confirm'));
 assert(context.flow891SaveOrder(day.iso, originalIds.slice().reverse()));
 assert(context.crew883Summary(day.iso, asset.key).startsWith('0 people needed'));
 console.log(JSON.stringify({author: 'Andrew Fisher', mode: 'original-defects-reproduced', candidate_sha256: crypto.createHash('sha256').update(html).digest('hex'), checks: ['Shared-reference stagger moves both trucks', 'Order changes unknown people to zero']}, null, 2));
 process.exit(0);
}
check('Stagger isolates the selected native truck ID and removes the area conflict', () => {
 const before = windows(), conflict = context.flow891Build(day).areas.find(a => a.key === 'mainBeach').conflicts[0];
 assert.equal(conflict.move.id, originalIds[1]);
 assert(context.flow891SetWindow(day.iso, conflict.move.id, conflict.to, conflict.len));
 const after = windows(); assert.deepEqual(after[0], before[0]); assert.equal(after[1].start, before[0].finish);
 assert.equal(context.flow891Build(day).areas.find(a => a.key === 'mainBeach').conflicts.length, 0);
 assert.equal(Object.keys(context.S.loads).length, 1);
 assert(context.crew883Summary(day.iso, asset.key).startsWith('People required to confirm'));
});
check('Order changes native load numbering while preserving unknown people and the selected window', () => {
 assert(context.flow891SaveOrder(day.iso, originalIds.slice().reverse()));
 assert.deepEqual(ids(), originalIds.slice().reverse());
 const order = windows(); assert.equal(order[0].id, originalIds[1]); assert.equal(order[0].n, 1); assert.equal(order[0].start, 400);
 assert.equal(order[1].id, originalIds[0]); assert.equal(order[1].n, 2); assert.equal(order[1].start, 370);
 assert(context.crew883Summary(day.iso, asset.key).startsWith('People required to confirm'));
 assert(!context.S.loads[context.crew883Key(day.iso, asset.key)]);
});
check('Native message model and driver header retain each truck window after renumbering', () => {
 const model = context.daily821Model(day.iso);
 assert.deepEqual(Array.from(model.loads, x => x.id), originalIds.slice().reverse());
 model.loads.forEach((load, i) => {
  const expected = i === 0 ? '06:40–07:10' : '06:10–06:40';
  assert.equal(load.n, i + 1); assert(load.rows[0].notes.some(x => x.includes('Arrival window ' + expected)));
  assert(context.flow891HeadLines(day, context.dpLoads(day)[i], 'drv', i + 1, 2).includes(expected));
 });
});
check('Filtered native message rows retain identity instead of joining by display index', () => {
 const off = {key: 'TEST-REF-OFF', product: 'Fictional omitted item'}; data.assets.push(off);
 const e = {item: 'Fictional omitted item', booking801: {departure_order: 0, loads: [{truck_id: 'test-truck-filtered', load_time: '04:00', carrier: 'Fictional carrier', quantity: 1}]}};
 day.deliveries.unshift({a: off, events: [e]}); blocked.add(off.key);
 const allIds = ids(); const filteredId = allIds.find(x => x.endsWith('test-truck-filtered'));
 assert(context.flow891SaveOrder(day.iso, [filteredId, ...originalIds.slice().reverse()]));
 const model = context.daily821Model(day.iso);
 assert.deepEqual(Array.from(model.loads, x => x.id), originalIds.slice().reverse());
 assert(model.loads[0].rows[0].notes.some(x => x.includes('Arrival window 06:40–07:10')));
 assert.equal(model.loads[0].n, 1); day.deliveries.shift(); data.assets.pop(); blocked.clear();
});
check('Historical Crew windows remain the fallback; staggering leaves the entire Crew record unchanged', () => {
 reset(); const key = context.crew883Key(day.iso, asset.key);
 const crew = {kind: 'crew883', day: day.iso, ref: asset.key, people: [{slot: 1, roles: ['unloading'], name: 'Fictional Person'}], start: '09:00', finish: '09:40', location: 'Fictional location', order: 7, note: 'Fictional note to retain', by: 'Fixture Reviewer', at: '2029-01-01T00:00:00.000Z'};
 context.S.loads[key] = clone(crew); assert(windows().every(x => x.start === 540));
 assert(context.flow891SetWindow(day.iso, originalIds[1], 580, 40));
 assert.deepEqual(clone(context.S.loads[key]), crew);
 assert.equal(windows().find(x => x.id === originalIds[0]).start, 540);
 assert.equal(windows().find(x => x.id === originalIds[1]).start, 580);
 assert(context.flow891SaveOrder(day.iso, originalIds.slice().reverse()));
 const saved = context.S.loads[key]; assert.deepEqual(clone(saved.people), crew.people); assert.equal(saved.note, crew.note);
 ['start','finish','location'].forEach(k => assert.equal(saved[k], crew[k])); assert.equal(saved.order, 1);
 assert(context.crew883Summary(day.iso, asset.key).startsWith('1 people needed'));
});
check('Explicit zero people and notes remain recorded after order and window edits', () => {
 reset(); const key = context.crew883Key(day.iso, asset.key);
 context.S.loads[key] = {kind: 'crew883', day: day.iso, ref: asset.key, people: [], start: '', finish: '', location: '', order: null, note: 'Fictional explicit zero', by: 'Fixture Reviewer', at: '2029-01-01T00:00:00.000Z'};
 assert(context.flow891SaveOrder(day.iso, originalIds.slice().reverse())); assert(context.flow891SetWindow(day.iso, originalIds[1], 600, 30));
 assert(context.crew883Summary(day.iso, asset.key).startsWith('0 people needed')); assert.equal(context.S.loads[key].note, 'Fictional explicit zero');
});
check('Native document serialization and JSON reload preserve dedicated windows and order', () => {
 reset(); assert(context.flow891SetWindow(day.iso, originalIds[1], 600, 30)); assert(context.flow891SaveOrder(day.iso, originalIds.slice().reverse()));
 const before = clone(context.S.loads), docs = context.toDocs('loads');
 assert.equal(Object.keys(docs).length, 2); context.S.loads = context.fromDocs('loads', clone(docs));
 assert.deepEqual(clone(context.S.loads), before); assert.deepEqual(ids(), originalIds.slice().reverse()); assert.equal(windows()[0].start, 600);
});
check('Native merge keeps independent truck windows and takes the later stamp for the same truck', () => {
 vm.runInContext(declaration('const blank =') + '\n' + fn('mergeRecords'), context);
 const keyA = context.flow891WindowKey(day.iso, originalIds[0]), keyB = context.flow891WindowKey(day.iso, originalIds[1]);
 const base = clone(context.S.loads[keyB]);
 const a = {...base, loadId: originalIds[0], start: '09:00', finish: '09:30', at: '2030-01-01T00:00:00.000Z'};
 const b = {...base, start: '10:00', finish: '10:30', at: '2030-01-02T00:00:00.000Z'};
 const left = {loads: {[keyA]: a}}, right = {loads: {[keyB]: b}};
 const merged = context.mergeRecords(left, right).merged.loads;
 assert.deepEqual(clone(merged), {...left.loads, ...right.loads});
 assert.deepEqual(clone(context.mergeRecords(right, left).merged.loads), clone(merged));
 const newer = {...a, start: '11:00', finish: '11:30', at: '2030-01-03T00:00:00.000Z'};
 assert.deepEqual(clone(context.mergeRecords(left, {loads: {[keyA]: newer}}).merged.loads[keyA]), newer);
 assert.deepEqual(clone(context.mergeRecords({loads: {[keyA]: newer}}, left).merged.loads[keyA]), newer);
});
check('Window metadata passes native import validation; malformed or unrelated load records remain rejected', () => {
 const key = context.flow891WindowKey(day.iso, originalIds[1]), rec = clone(context.S.loads[key]);
 const validate = (k, r) => Array.from(context.validateRecords({loads: {[k]: r}}));
 assert.deepEqual(validate(key, rec), []);
 const cases = [
  {...rec, day: '2030-02-31'}, {...rec, kind: 'crew883'}, {...rec, ref: 'TEST-REF'}, {...rec, loadId: ''},
  {...rec, loadId: originalIds[0]}, {...rec, start: '24:00'}, {...rec, start: '10:00', finish: '09:00'},
  {...rec, finish: '09:99'}, {...rec, start: 600}, {...rec, by: ''}, {...rec, by: {}}, {...rec, at: null},
  {...rec, at: '2030-02-31T00:00:00.000Z'}, {...rec, people: []}, {...rec, loadId: 3}, {...rec, loadId: day.iso + '|deliveries|\ud800'}
 ];
 cases.forEach((r, i) => assert(validate(key, r).length, 'Malformed metadata case ' + i));
 assert(validate('flow891/' + day.iso + '/window/not-canonical', rec).length);
 assert(validate('arbitrary-load-key', {}).length);
 assert(validate('flow891/' + day.iso + '/other', rec).length);
 // The earlier Crew/order namespace import limitation stays visible in this bounded proposal.
 const orderKey = context.flow891OrderKey(day.iso);
 assert(validate(orderKey, context.S.loads[orderKey]).some(x => x.includes('not a load id')));
});
check('View mode, missing operator, invalid windows and invalid IDs never mutate records', () => {
 const before = JSON.stringify(context.S.loads), saveCount = saves;
 canWrite = false; assert.equal(context.flow891SetWindow(day.iso, originalIds[0], 700, 30), false); assert.equal(context.flow891SaveOrder(day.iso, originalIds), false);
 canWrite = true; operator = ''; assert.equal(context.flow891SetWindow(day.iso, originalIds[0], 700, 30), false); assert.equal(context.flow891SaveOrder(day.iso, originalIds), false); operator = 'Fixture Reviewer';
 for (const [start, len] of [[null,30],[NaN,30],[-1,30],[10.5,30],[1430,30],[600,0],[600,-30],[600,Infinity]]) assert.equal(context.flow891SetWindow(day.iso, originalIds[0], start, len), false);
 assert.equal(context.flow891SetWindow(day.iso, 'test-missing', 700, 30), false);
 assert.equal(context.flow891SaveOrder(day.iso, [...originalIds, originalIds[1]]), false);
 assert.equal(JSON.stringify(context.S.loads), before); assert.equal(saves, saveCount);
});
check('An overlong native identity is refused before document-ID truncation can collide', () => {
 const before = JSON.stringify(context.S.loads), original = booking.loads[0].truck_id;
 booking.loads[0].truck_id = 'test-truck-' + 'x'.repeat(180);
 const longId = ids().find(x => x.includes('x'.repeat(180)));
 assert(longId); assert.equal(context.flow891SetWindow(day.iso, longId, 700, 30), false);
 assert.equal(JSON.stringify(context.S.loads), before); booking.loads[0].truck_id = original;
});
check('Window audit timestamps advance and recover from a malformed prior timestamp', () => {
 reset(); const key = context.flow891WindowKey(day.iso, originalIds[0]);
 assert(context.flow891SetWindow(day.iso, originalIds[0], 700, 30));
 context.S.loads[key].at = '2099-01-01T00:00:00.000Z';
 assert(context.flow891SetWindow(day.iso, originalIds[0], 730, 30)); assert.equal(context.S.loads[key].at, '2099-01-01T00:00:00.001Z');
 context.S.loads[key].at = 'invalid'; assert(context.flow891SetWindow(day.iso, originalIds[0], 760, 30));
 assert(Number.isFinite(Date.parse(context.S.loads[key].at)));
});
check('Malformed saved overrides fall back without contaminating another truck or day', () => {
 reset(); const key = context.flow891WindowKey(day.iso, originalIds[1]);
 context.S.loads[key] = {kind: 'flow891', day: day.iso, loadId: originalIds[1], start: '24:00', finish: '25:00'};
 assert(windows().every(x => x.start === 370));
 context.S.loads[key] = {kind: 'flow891', day: '2030-01-16', loadId: originalIds[1], start: '10:00', finish: '10:30'};
 assert(windows().every(x => x.start === 370));
 const scheduled = context.flow891WindowOf(day.iso, '05:00', [asset.key], false);
 assert.equal(scheduled.start, 480); assert.equal(context.flow891WindowOf(day.iso, '', [asset.key], false).known, false);
});
console.log(JSON.stringify({author: 'Andrew Fisher', mode: 'expected-fixed', candidate_sha256: crypto.createHash('sha256').update(html).digest('hex'), native_functions: native.concat(['blank', 'mergeRecords']), checks, passed: checks.length, limitations: ['Offline native-function fixture, not browser/release acceptance', 'Existing Crew/order file-import namespace limitation remains separate']}, null, 2));
