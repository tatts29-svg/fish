/* Author: Andrew Fisher. Synthetic tests only; no job records or network access. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'linked_references844_src.js'), 'utf8');
const REQUIRED = ['photoLinks', 'dropPhotos', 'fixes', 'places', 'units', 'subhire', 'locations', 'supplied'];
const normal = value => JSON.parse(JSON.stringify(value));
function harness(change = {}) {
  const data = {assets: [{key: 'REF-A', name: 'Synthetic mixed reference', quantity: 2, item_types: ['Type A', 'Type B']},
    {key: 'REF-B', name: 'Synthetic second reference', quantity: 2}],
    destinations: {}, targets: {}, maps: {}, sheets: {}, masters: {}, deliveries: {}, stages: {}, units: {}, rehire: {}, numbers: {}, associations: {}, drops: {}, filed: {}, photos: {}, ...change};
  const calls = {assets: 0, holds: 0, photos: [], destinations: [], stages: []};
  const get = (map, key, fallback) => Object.hasOwn(map, key) ? map[key] : fallback;
  const context = {URL, DATA: {edition: 'hosted'}, SYNC: {first: new Set(REQUIRED)},
    todayIso: () => '2030-10-04', todayWorkHealth840: () => ({ready: true, status: 'live'}),
    holdAssets: fn => { calls.holds++; return fn(); },
    allAssets: () => { calls.assets++; return data.assets; },
    destinationOf: a => { calls.destinations.push(a.key); return get(data.destinations, a.key, {known: false, source: 'not recorded', fallback: 'Destination not recorded — confirm before dispatch.'}); },
    dest782: a => get(data.targets, a.key, null),
    mapPlaceFor: a => get(data.maps, a.key, null), mapSheetFor: a => get(data.sheets, a.key, null),
    masterLoc: k => get(data.masters, k, null), masterWords: m => m.words || '',
    deliveryOf: k => get(data.deliveries, k, {}),
    timeline841State: a => { calls.stages.push(a.key); return get(data.stages, a.key, {label: 'No delivery record', stage: 0, tone: 'none', why: 'No delivery status has been recorded.'}); },
    unitsOf: k => get(data.units, k, []), subOf: k => get(data.rehire, k, []), assetNumbersOf: a => get(data.numbers, a.key, []),
    itemNumbersOf: a => get(data.associations, a.key, null),
    dropPhotosOf: k => get(data.drops, k, []), filedPhotosOf: k => get(data.filed, k, {state: 'ready', files: []}),
    photoFor: p => { calls.photos.push(p.id); return get(data.photos, p.id, {state: 'missing'}); },
    DROP_SLOTS: [{lab: 'In position'}, {lab: 'Access and surrounds'}, {lab: 'Way in'}, {lab: 'Aerial — overhead', aerial: true}],
    ...change.globals};
  vm.createContext(context); vm.runInContext(source, context);
  return {data, calls, context, run: (keys = ['REF-A'], options) => normal(context.todayLinkedReferences844(keys, options))};
}
let passed = 0;
function test(name, fn) { fn(); passed++; process.stdout.write('PASS ' + name + '\n'); }

test('exact reference keys, stable order, deduplication and safe dictionary keys', () => {
  const h = harness({assets: [{key: 'REF-A'}, {key: '__proto__'}]});
  const got = h.run(['REF-A', 'ref-a', '__proto__', 'REF-A', '', null]);
  assert.deepEqual(got.rows.map(r => [r.key, r.found]), [['REF-A', true], ['ref-a', false], ['__proto__', true]]);
  assert.equal(got.rowsByKey.__proto__.key, '__proto__');
  assert.equal(got.rowsByKey['ref-a'].actions.referenceKey, null);
  assert.equal(h.calls.assets, 1); assert.equal(h.calls.holds, 1);
});
test('two multi-unit references do not become four invented unit rows or new counts', () => {
  const h = harness(); const got = h.run(['REF-A', 'REF-B']);
  assert.equal(got.rows.length, 2);
  got.rows.forEach(r => { assert.deepEqual(r.identifiers, []); ['quantity', 'done', 'left', 'remaining', 'pct'].forEach(k => assert.equal(Object.hasOwn(r, k), false)); });
});
test('all additional native metadata collections gate ready state', () => {
  REQUIRED.forEach(missing => {
    const h = harness({globals: {SYNC: {first: new Set(REQUIRED.filter(k => k !== missing))}}});
    const got = h.run(); assert.equal(got.ready, false); assert.equal(got.loading, true);
    assert.deepEqual(got.missing, [missing]); assert.equal(got.rows[0].photoState, 'loading');
    assert.match(got.rows[0].current.label, /Waiting/); assert.equal(h.calls.destinations.length, 0);
  });
});
test('base metadata health and failed connections are not represented as an empty record', () => {
  const h = harness({globals: {todayWorkHealth840: () => ({ready: false, status: 'unreachable'})}});
  const got = h.run(); assert.equal(got.ready, false); assert.equal(got.loading, false);
  assert.match(got.issues.join(' '), /unavailable/); assert.equal(got.rows[0].photoState, 'failed');
  assert.match(got.rows[0].current.label, /unavailable/);
});
test('local copies work without hosted hydration and stale copies disclose their basis', () => {
  const local = harness({globals: {DATA: {edition: 'file'}, SYNC: {first: new Set()}}}).run(); assert.equal(local.ready, true);
  const stale = harness({globals: {todayWorkHealth840: () => ({ready: true, stale: true, status: 'unreachable'})}}).run();
  assert.equal(stale.ready, true); assert.match(stale.issues.join(' '), /last received/);
});
test('master target wording wins while schedule wording remains attributed', () => {
  const h = harness({destinations: {'REF-A': {known: true, text: 'Scheduled area', source: 'schedule'}},
    masters: {'REF-A': {words: 'Beside the synthetic gate'}}, targets: {'REF-A': {kind: 'master', approx: false, sms: 'master plan'}}, maps: {'REF-A': {sheet: 'DEMO'}}});
  const r = h.run().rows[0]; assert.equal(r.destination.kind, 'master'); assert.equal(r.destination.text, 'Beside the synthetic gate');
  assert.match(r.destination.note, /Schedule wording: Scheduled area/); assert.equal(r.destination.fallback, ''); assert.equal(r.actions.mapKey, 'REF-A');
});
test('report point never claims a final destination even with schedule words', () => {
  const h = harness({destinations: {'REF-A': {known: true, text: 'Scheduled area'}}, targets: {'REF-A': {kind: 'report', label: 'pit lane', nav: 'No final drop-off; site directs the driver'}}});
  const r = h.run().rows[0]; assert.equal(r.destination.known, false); assert.match(r.destination.label, /final drop-off not set/);
  assert.match(r.destination.text, /Report to the pit lane/); assert.match(r.destination.note, /not a confirmed drop-off/);
  assert.equal(r.actions.mapKey, null);
});
test('origin-only wording remains a quotation and unknown destination', () => {
  const r = harness({destinations: {'REF-A': {known: false, text: 'from warehouse', quote: 'Schedule says from warehouse; confirm destination.', fallback: 'Destination not recorded', source: 'schedule words, unconfirmed'}}}).run().rows[0];
  assert.equal(r.destination.known, false); assert.equal(r.destination.text, 'Destination not recorded'); assert.match(r.destination.note, /confirm destination/);
});
test('approximate placement and drawing-area targets keep their qualifications', () => {
  for (const kind of ['placed', 'area', 'unverified']) {
    const r = harness({targets: {'REF-A': {kind, approx: true, nav: 'Check this source position on site'}}, sheets: {'REF-A': {sheet_id: 'DEMO'}}}).run().rows[0];
    assert.equal(r.destination.known, false); assert.equal(r.destination.approx, true); assert.equal(r.destination.kind, kind);
    assert.equal(r.destination.hasMap, true); assert.match(r.destination.note, /Check/);
  }
});
test('current status and reference-wide review remain separate from historic completion', () => {
  const h = harness({deliveries: {'REF-A': {done: true, state: 'on site', recorded: true, done_at: '2030-10-04T01:00:00Z'}},
    stages: {'REF-A': {stage: 2, label: 'Review required · Complete recorded', tone: 'amber', why: 'The current reference has a quantity conflict.'}}});
  const got = h.run(['REF-A'], {asOf: '2030-09-30', itemName: 'Type B'}), current = got.rows[0].current;
  assert.equal(got.asOf, '2030-09-30'); assert.equal(got.currentDay, '2030-10-04');
  assert.equal(current.done, true); assert.equal(current.review, true); assert.equal(current.stage, 2);
  assert.match(current.basis, /separate from completion as of 2030-09-30/); assert.match(current.label, /Review required/);
});
test('rental-only status retains native arrival-unconfirmed wording', () => {
  const h = harness({deliveries: {'REF-A': {recorded: true, state: 'on site', where: 'rental'}},
    stages: {'REF-A': {stage: 0, label: 'On hire · delivery unconfirmed', tone: 'none'}}});
  const r = h.run().rows[0]; assert.equal(r.current.done, false); assert.equal(r.current.where, 'rental'); assert.match(r.current.label, /delivery unconfirmed/);
});
test('identifiers retain reference scope and exact native type association without invented splits', () => {
  const h = harness({units: {'REF-A': [{asset_no: 'DEMO-1', label: 'Recorded unit'}, {label: 'Unnumbered site unit'}]},
    numbers: {'REF-A': ['DEMO-1', 'DEMO-2', 'MISCITEM']}, associations: {'REF-A': {'Type A': ['DEMO-1'], 'Type B': ['DEMO-2']}}});
  const r = h.run(['REF-A'], {itemName: 'Type A'}).rows[0];
  assert.equal(r.identifiers.length, 3); assert.equal(r.identifiers.find(i => i.value === 'DEMO-1').scope, 'native-item-association');
  assert.equal(r.identifiers.find(i => i.value === 'DEMO-2').scope, 'reference');
  assert.match(r.identifiers[0].source, /may allocate by order capacity/); assert.match(r.identifierBasis, /neither identifies which units remain/);
  assert.equal(h.run(['REF-A'], {itemName: 'type a'}).rows[0].identifiers.every(i => i.scope === 'reference'), true);
});
test('rehire fleet numbers keep their source rather than becoming Coates asset numbers', () => {
  const r = harness({rehire: {'REF-A': [{no: 'HIRE-7', co: 'Synthetic supplier', source: 'Hire note'}]}}).run().rows[0];
  assert.equal(r.identifiers[0].label, 'Synthetic supplier fleet number'); assert.equal(r.identifiers[0].source, 'Hire note');
});
test('drop and filed photos deduplicate by exact opaque id without rebinding filenames', () => {
  const h = harness({drops: {'REF-A': [{id: 'Opaque-ID', slot: 0}, {id: 'gone', removed: true}, {id: 'opaque-id', name: 'same.jpg'}]},
    filed: {'REF-A': {state: 'ready', files: [{id: 'Opaque-ID', kind: 'photo', ref: 'REF-A'}, {id: 'FILED', kind: 'photo', ref: 'REF-A'}, {id: 'OTHER', kind: 'photo', ref: 'REF-B'}, {id: 'PDF', kind: 'invoice', ref: 'REF-A'}]}}});
  const r = h.run().rows[0]; assert.deepEqual(r.photos.map(p => p.id), ['Opaque-ID', 'opaque-id', 'FILED']);
  assert.deepEqual(h.calls.photos, ['Opaque-ID', 'opaque-id', 'FILED']); assert.equal(r.photos[0].source, 'drop'); assert.equal(r.photos[2].source, 'filed');
});
test('removed drop can only reappear as separately filed neutral reference context', () => {
  const r = harness({drops: {'REF-A': [{id: 'REMOVED', removed: true, slot: 0, unit: 'OLD'}]},
    filed: {'REF-A': {state: 'ready', files: [{id: 'REMOVED', kind: 'photo', ref: 'REF-A'}]}}}).run().rows[0];
  assert.equal(r.photos[0].kind, 'reference'); assert.equal(r.photos[0].unit, null); assert.equal(r.photos[0].slot, null);
  assert.equal(r.photos[0].caption, 'Photo filed against REF-A');
});
test('preview uses only verified derivative and original remains an explicit-open URL', () => {
  const h = harness({drops: {'REF-A': [{id: 'READY'}, {id: 'ORIGINAL'}]}, photos: {
    READY: {state: 'ready', thumb: '/thumb/ready.webp', url: '/file/ready.jpg'}, ORIGINAL: {state: 'ready', url: '/file/original.jpg'}}});
  const r = h.run().rows[0]; assert.equal(r.photos[0].src, '/thumb/ready.webp'); assert.equal(r.photos[0].fullSrc, '/file/ready.jpg');
  assert.equal(r.photos[1].src, null); assert.equal(r.photos[1].previewAvailable, false); assert.equal(r.photos[1].fullSrc, '/file/original.jpg');
  assert.equal(r.readyPhotoCount, 2);
});
test('all unresolved photo states have no media URL and do not substitute stock', () => {
  const states = ['checking', 'unchecked', 'ambiguous', 'missing', 'none'];
  const h = harness({drops: {'REF-A': states.map(id => ({id}))}, photos: Object.fromEntries(states.map(state => [state, {state, thumb: '/must-not-load.webp', url: '/must-not-load.jpg'}])),
    globals: {productPhoto: () => { throw Error('Stock image must not be requested'); }}});
  const r = h.run().rows[0]; assert.deepEqual(r.photos.map(p => p.availability), states);
  r.photos.forEach(p => { assert.equal(p.src, null); assert.equal(p.fullSrc, null); }); assert.equal(r.readyPhotoCount, 0);
});
test('unsafe URLs are rejected for both previews and original links', () => {
  const h = harness({drops: {'REF-A': [{id: 'BAD'}, {id: 'RASTER'}]}, photos: {
    BAD: {state: 'ready', thumb: 'javascript:alert(1)', url: 'data:image/svg+xml;base64,PHN2Zz4='},
    RASTER: {state: 'ready', thumb: 'data:image/png;base64,AAAA', url: 'https://example.invalid/photo.jpg'}}});
  const r = h.run().rows[0]; assert.equal(r.photos[0].src, null); assert.equal(r.photos[0].fullSrc, null);
  assert.equal(r.photos[1].src, 'data:image/png;base64,AAAA'); assert.equal(r.readyPhotoCount, 1);
});
test('aerial slots and recorded unit association are captioned without unfinished-unit claims', () => {
  const r = harness({drops: {'REF-A': [{id: 'AIR', slot: 3, unit: 'DEMO-1', capturedAt: '2030-10-01T01:00:00Z'}]}}).run().rows[0];
  assert.equal(r.photos[0].kind, 'aerial'); assert.equal(r.photos[0].unit, 'DEMO-1'); assert.match(r.photos[0].caption, /Aerial — overhead/);
  assert.match(r.photos[0].caption, /recorded for unit DEMO-1/); assert.match(r.photoNote, /not proof/);
});
test('cold and failed registry states are distinct from confirmed no photographs', () => {
  const h = harness({filed: {'REF-A': {state: 'loading', files: []}}});
  assert.equal(h.run().rows[0].photoState, 'loading'); assert.match(h.run().rows[0].photoNote, /Checking/);
  h.data.filed['REF-A'] = {state: 'failed', files: []}; assert.match(h.run().rows[0].photoNote, /does not mean none/);
  h.data.filed['REF-A'] = {state: 'ready', files: []}; assert.match(h.run().rows[0].photoNote, /No current drop photographs/);
});
test('refresh rereads current metadata without mutating source objects', () => {
  const h = harness({numbers: {'REF-A': ['DEMO-1']}, drops: {'REF-A': [{id: 'P1'}]}});
  const before = JSON.stringify(h.data); h.run(['REF-A'], {itemName: 'Type A'}); assert.equal(JSON.stringify(h.data), before);
  h.data.stages['REF-A'] = {label: 'Finished', stage: 5, tone: 'green'}; h.data.deliveries['REF-A'] = {done: true, recorded: true};
  h.data.photos.P1 = {state: 'ready', thumb: '/thumb/p1.webp', url: '/file/p1.jpg'};
  const r = h.run().rows[0]; assert.equal(r.current.stage, 5); assert.equal(r.current.review, false); assert.equal(r.photos[0].src, '/thumb/p1.webp');
});
test('native helper failures disclose missing context without altering remaining quantities', () => {
  const r = harness({globals: {destinationOf: () => { throw Error('synthetic unavailable'); }}}).run().rows[0];
  assert.match(r.issues.join(' '), /Written destination could not be read/); assert.equal(r.destination.known, false);
});
process.stdout.write(passed + '/' + passed + ' linked-reference checks passed\n');
