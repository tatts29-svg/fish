/* Portable tests. All records below are invented fixtures, never site records. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'work_metrics840_src.js'), 'utf8');
const required = ['delivery', 'supplied', 'added', 'items', 'qtys', 'aside', 'moves',
  'givenRefs', 'descs', 'rental', 'fenceDockets', 'deleted', 'assetNumbers', 'accessories', 'units'];
const cleanType = 'Temporary Fence (m) — Clean';
const syntheticDay = '2026-09-08';
const line = (item, quantity) => ({item, quantity});
const asset = (key, product, lines, extra = {}) => ({key, name: 'Synthetic ' + key, product,
  discipline: product, charge_lines: lines, ...extra});
function fixture(overrides = {}) {
  const base = {
    assets: [], deliveries: {}, shorts: {}, dockets: [], moved: [],
    weeks: [{sheet: 'Synthetic Build A', phase: 'Build', start: '2026-09-01', end: '2026-09-10'},
      {sheet: 'Synthetic Build B', phase: 'Build', start: '2026-09-11', end: '2026-09-20'},
      {sheet: 'Synthetic Event', phase: 'Event', start: '2026-09-21', end: '2026-09-23'},
      {sheet: 'Synthetic Demob', phase: 'Demob', start: '2026-09-24', end: '2026-10-01'}],
    plans: {
      'Synthetic Build A': {sheet: 'Synthetic plan A', year: 2026, rolled_forward: true, totals: {[cleanType]: 120}},
      'Synthetic Build B': {sheet: 'Synthetic plan B', year: 2026, rolled_forward: true, totals: {[cleanType]: 80}},
      'Synthetic Event': {sheet: 'Synthetic event plan', year: 2026, rolled_forward: true, totals: {[cleanType]: 700}},
      'Synthetic Demob': {sheet: 'Synthetic demob plan', year: 2026, rolled_forward: true, totals: {[cleanType]: 900}}
    }, edition: 'hosted', first: new Set(required), status: 'live', ...overrides
  };
  const calls = [];
  const context = vm.createContext({
    DATA: {edition: base.edition, weeks: base.weeks},
    SYNC: {first: base.first, status: base.status},
    FCOL: [{key: 'clean', unit: 'm', programme_type: cleanType},
      {key: 'scrim', unit: 'm', programme_type: 'Temporary Fence (m) — Braced for Scrim'}],
    todayIso: () => syntheticDay,
    allAssets: () => base.assets,
    chargeLines: a => a.charge_lines,
    qtyOf: l => l.quantity == null || String(l.quantity).trim() === '' || !Number.isFinite(Number(l.quantity)) ? null : Number(l.quantity),
    deliveryAsOf: (key, day) => { calls.push({key, day}); const d = base.deliveries[key]; return typeof d === 'function' ? d(day) : (d || {recorded: false, done: false}); },
    shortOf: a => base.shorts[a.key] || [],
    movedAway: key => base.moved.includes(key),
    allDockets: () => base.dockets,
    progSheetOf: name => base.plans[name] || null
  });
  vm.runInContext(source, context, {filename: 'work_metrics840_src.js'});
  const before = JSON.stringify(base);
  const result = context.todayWorkMetrics840(overrides.asOf || syntheticDay);
  assert.equal(JSON.stringify(base), before, 'metric reads must not mutate source records');
  return {result, get: id => result.find(a => a.id === id), calls, context};
}
let checks = 0;
function test(name, body) {
  body(); checks++; process.stdout.write('PASS ' + name + '\n');
}
test('explicit completion counts the entire scope, not delivery dates or rental status', () => {
  const f = fixture({assets: [asset('SYN_B1', 'Portable Building', [line('Building 6m', 2)]),
    asset('SYN_B2', 'Portable Building', [line('Building 6m', 3)]),
    asset('SYN_B3', 'Portable Building', [line('Building 6m', 1)], {first_date: '2026-10-01'})],
    deliveries: {SYN_B1: {done: true}, SYN_B2: {recorded: true, state: 'on site', where: 'rental', done: false}, SYN_B3: {done: true}}});
  const a = f.get('buildings'); assert.equal(a.total, 6); assert.equal(a.done, 3); assert.equal(a.remaining, 3); assert.equal(a.pct, 50);
  assert.equal(a.rows[1].status, 'On site · completion not recorded');
});
test('cancelled, relocation, follow-up and moved references do not add scope', () => {
  const extras = [{_cancelled: true}, {relocation: true}, {rest_of: 'SYN_PARENT'}, {}];
  const f = fixture({assets: extras.map((e, i) => asset('SYN_X' + i, 'Generator', [line('Generator 50kva', 7)], e)), moved: ['SYN_X3']});
  assert.equal(f.get('generators').total, 0); assert.equal(f.get('generators').pct, null); assert.equal(f.get('generators').rows.length, 0);
});
test('missing or invalid quantities never become one unit or a percent', () => {
  for (const q of [null, '', 'unconfirmed', -1, 1.5]) {
    const a = fixture({assets: [asset('SYN_B', 'Portable Building', [line('Building 6m', q)])], deliveries: {SYN_B: {done: true}}}).get('buildings');
    assert.equal(a.total, null); assert.equal(a.done, 0); assert.equal(a.pct, null); assert.equal(a.rows[0].quantity, null);
    assert.equal(a.unknownQuantityRefs, 1);
  }
});
test('product classification keeps a tower out of generator totals', () => {
  const f = fixture({assets: [asset('SYN_T', 'Light Tower', [line('Light Tower', 4)], {discipline: 'Generators'}),
    asset('SYN_G', 'Generator', [line('Generator 50kva', 2)])], deliveries: {SYN_T: {done: true}}});
  assert.equal(f.get('lighting').total, 4); assert.equal(f.get('lighting').done, 4); assert.equal(f.get('generators').total, 2);
});
test('toilets include pee panels and blocks, while separate tanks stay outside the count', () => {
  const a = fixture({assets: [asset('SYN_W', 'Toilet', [line('FWF', 2), line('Pee Panel', 3), line('16Pan Block', 1), line('Waste tank', 8)])],
    deliveries: {SYN_W: {done: true, levelled: true, steps: false}}}).get('toilets');
  assert.equal(a.total, 6); assert.equal(a.done, 6); assert.equal(a.pct, 100); assert.equal(a.rows[0].steps, false);
});
test('unknown mixed toilet/tank scope stays explicit', () => {
  const a = fixture({assets: [asset('SYN_W', 'Toilet', [line('Toilet and waste tank package', 3)])]}).get('toilets');
  assert.equal(a.total, null); assert.equal(a.pct, null); assert.ok(a.issues.length);
});
test('a short delivery contradicting complete does not fabricate partial completion', () => {
  const a = fixture({assets: [asset('SYN_W', 'Toilet', [line('FWF', 5)])], deliveries: {SYN_W: {done: true}},
    shorts: {SYN_W: [{item: 'FWF', q: 5, g: 2}]}}).get('toilets');
  assert.equal(a.total, 5); assert.equal(a.done, 0); assert.equal(a.pct, null); assert.equal(a.remaining, null);
  assert.equal(a.rows[0].recordedComplete, true); assert.equal(a.rows[0].complete, false); assert.equal(a.shortConflictRefs, 1);
});
test('short ancillary tank does not silently change the selected toilet units', () => {
  const a = fixture({assets: [asset('SYN_W', 'Toilet', [line('FWF', 5), line('Waste tank', 2)])], deliveries: {SYN_W: {done: true}},
    shorts: {SYN_W: [{item: 'Waste tank', q: 2, g: 1}]}}).get('toilets');
  assert.equal(a.total, 5); assert.equal(a.done, 5); assert.equal(a.shortConflictRefs, 0);
});
test('Equipment excludes attachments and does not absorb VMS or track mat', () => {
  const f = fixture({assets: [asset('SYN_F', 'Access', [line('Forklift 5T', 2), line('Forklift tynes', 4)]),
    asset('SYN_V', 'VMS', [line('VMS', 10)]), asset('SYN_M', 'Trakmat', [line('Track mat', 20)])], deliveries: {SYN_F: {done: true}}});
  assert.equal(f.get('equipment').total, 2); assert.equal(f.get('equipment').done, 2);
});
test('partial, levelling and steps records do not manufacture a whole-reference complete tick', () => {
  const a = fixture({assets: [asset('SYN_B', 'Portable Building', [line('Building 6m', 4)])],
    deliveries: {SYN_B: {recorded: true, state: 'on site', done: false, levelled: true, steps: true}}}).get('buildings');
  assert.equal(a.done, 0); assert.equal(a.total, 4); assert.equal(a.rows[0].levelled, true);
});
test('as-of date goes to the native history replay, including early completions', () => {
  const f = fixture({asOf: '2026-09-02', assets: [asset('SYN_G', 'Generator', [line('Generator 50kva', 2)])],
    deliveries: {SYN_G: day => ({done: day >= '2026-09-05'})}});
  assert.equal(f.get('generators').done, 0); assert.equal(f.calls[0].day, '2026-09-02');
});
test('initial and partial hydration show unknown values, never false zero', () => {
  for (const status of ['file', 'connecting', 'live', 'unreachable']) {
    const f = fixture({first: new Set(['delivery']), status});
    assert.equal(f.result.health.ready, false);
    f.result.forEach(a => { assert.equal(a.total, null); assert.equal(a.done, null); assert.equal(a.pct, null); assert.equal(a.rows.length, 0); });
  }
});
test('loaded records survive a connection outage with a stale label', () => {
  const f = fixture({status: 'unreachable', assets: [asset('SYN_G', 'Generator', [line('Generator 50kva', 2)])], deliveries: {SYN_G: {done: true}}});
  assert.equal(f.result.health.ready, true); assert.equal(f.result.health.stale, true); assert.equal(f.get('generators').pct, 100);
});
test('fence numerator and denominator use clean Build programme work only', () => {
  const docket = (id, extra) => ({id, docket_no: id, date: '2026-09-04', week: 'Synthetic Build A', scope: 'programme', usable: true, quantities: {clean: 25}, ...extra});
  const f = fixture({asOf: '2026-09-30', dockets: [docket('SYN_D1'),
    docket('SYN_D2', {scope: 'compound'}), docket('SYN_D3', {quantities: {scrim: 60, removal: 20}}),
    docket('SYN_D4', {date: '2026-09-25', week: 'Synthetic Demob'}),
    docket('SYN_D5', {date: '2026-09-22', week: 'Synthetic Event'}),
    docket('SYN_D6', {date: '2026-09-25', week: 'Synthetic Build A'}),
    docket('SYN_D7', {date: null}), docket('SYN_D8', {usable: false}),
    docket('SYN_D9', {date: '2026-10-02'}), docket('SYN_D10', {week: 'Unmapped synthetic week'})]});
  const a = f.get('fencing'); assert.equal(a.total, 200); assert.equal(a.done, 25); assert.equal(a.remaining, 175); assert.equal(a.pct, 12.5);
  assert.equal(a.rows.length, 1); assert.equal(a.rows[0].key, null); assert.ok(a.issues.length >= 3);
});
test('missing, stale or duplicate Build plans suppress fencing percentage', () => {
  for (const plans of [{},
    {'Synthetic Build A': {sheet: 'Old plan', year: 2025, rolled_forward: false, totals: {[cleanType]: 100}}},
    {'Synthetic Build A': {sheet: 'Duplicate', year: 2026, totals: {[cleanType]: 100}}, 'Synthetic Build B': {sheet: 'Duplicate', year: 2026, totals: {[cleanType]: 100}}}]) {
    const a = fixture({plans, dockets: [{id: 'SYN_D', date: '2026-09-04', week: 'Synthetic Build A', usable: true, quantities: {clean: 12}}]}).get('fencing');
    assert.equal(a.total, null); assert.equal(a.done, 12); assert.equal(a.pct, null); assert.equal(a.remaining, null);
  }
});
test('overscope fence work is retained and flagged instead of hidden in the bar', () => {
  const a = fixture({dockets: [{id: 'SYN_D', date: '2026-09-04', week: 'Synthetic Build A', usable: true, quantities: {clean: 220}}]}).get('fencing');
  assert.equal(a.done, 220); assert.equal(a.total, 200); assert.equal(a.remaining, 0); assert.equal(a.pct, 100);
  assert.ok(a.issues.some(x => /exceeds/.test(x)));
});
process.stdout.write(checks + ' synthetic metric checks passed.\n');
