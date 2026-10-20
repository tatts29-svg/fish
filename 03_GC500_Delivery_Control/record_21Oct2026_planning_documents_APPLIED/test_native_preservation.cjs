// Author: Andrew Fisher. Synthetic native-concurrency guard tests; no network or server writes.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('./document_guards.cjs');
const clone = value => JSON.parse(JSON.stringify(value));
const results = [];
let networkCalls = 0;
global.fetch = () => { networkCalls++; throw Error('Network forbidden in synthetic tests'); };
const T = {
  before: '2026-01-02T03:04:00.000Z',
  photo: '2026-01-02T03:04:01.000Z',
  stamp: '2026-01-02T03:04:02.400Z',
  observed: '2026-01-02T03:04:05.000Z'
};
const options = () => ({since: T.before, observedAt: T.observed, operator: 'Fixture upload operator'});
const newId = 'drop_SITE_A_1_fixture.jpg';
const provenanceId = 'photoLinks~2f~' + newId;
function docs() {
  return {
    delivery: {SITE_A: {_k: 'SITE_A', state: 'on site', note: 'Keep exactly', details: {qty: 2, complete: false}}},
    purchaseOrders: {PO_FIXTURE: {_k: 'PO_FIXTURE', amount: 123.45, source: {keep: [0, false, null, '']}}},
    photoLinks: {'old.jpg': {id: 'old.jpg', _k: 'old.jpg', name: 'old.jpg', ref: 'SITE_A',
      slot: 0, by: 'Earlier recorder', at: '2026-01-01T00:00:00.000Z', caption: 'Existing'}},
    stamps: {'photoLinks~2f~old.jpg': {_k: 'photoLinks/old.jpg', v: '2026-01-01T00:00:01.000Z'}},
    by: {'photoLinks~2f~old.jpg': {_k: 'photoLinks/old.jpg', v: 'Earlier recorder'}}
  };
}
function addTriplet(target, id = newId, who = 'Fixture photo recorder') {
  const companion = 'photoLinks~2f~' + id;
  target.photoLinks[id] = {id, _k: id, name: id, ref: 'SITE_A', slot: 0, by: who, at: T.photo, caption: ''};
  target.stamps[companion] = {_k: 'photoLinks/' + id, v: T.stamp};
  target.by[companion] = {_k: 'photoLinks/' + id, v: who};
  return target;
}
function fixture() {
  const before = docs();
  return {before, after: addTriplet(clone(before)), opts: options()};
}
function stateFixture() {
  const f = fixture();
  return {
    before: {version: 40, updated: T.before, level: 'view', docs: f.before},
    after: {version: 43, updated: T.stamp, level: 'view', docs: f.after},
    opts: options()
  };
}
function snapshot(values) { return values.map(value => G.canonical(value)); }
function unchanged(values, before) { assert.deepEqual(snapshot(values), before, 'The guard mutated an input'); }
function test(name, fn) {
  try { fn(); results.push({name, pass: true}); }
  catch (error) { results.push({name, pass: false, error: error.message}); }
}
function rejectsDocs(name, mutate) {
  test(name, () => {
    const f = fixture(); mutate(f);
    const values = [f.before, f.after, f.opts], frozen = snapshot(values);
    assert.throws(() => G.verifyNativeDocs(f.before, f.after, f.opts));
    unchanged(values, frozen);
  });
}
function rejectsState(name, mutate) {
  test(name, () => {
    const f = stateFixture(); mutate(f);
    const values = [f.before, f.after, f.opts], frozen = snapshot(values);
    assert.throws(() => G.verifyNativeState(f.before, f.after, f.opts));
    unchanged(values, frozen);
  });
}

test('Unchanged native documents return no additions and remain exact', () => {
  const before = docs(), after = clone(before), opts = options(), values = [before, after, opts], frozen = snapshot(values);
  assert.deepEqual(G.verifyNativeDocs(before, after, opts), []);
  unchanged(values, frozen);
});
test('One complete independent photo triplet is accepted and reported precisely', () => {
  const f = fixture(), values = [f.before, f.after, f.opts], frozen = snapshot(values);
  assert.deepEqual(G.verifyNativeDocs(f.before, f.after, f.opts), [{
    id: newId, reference: 'SITE_A', by: 'Fixture photo recorder', photoAt: T.photo, stampedAt: T.stamp
  }]);
  unchanged(values, frozen);
});
test('Two complete photo triplets from independent recorders are accepted', () => {
  const f = fixture(); addTriplet(f.after, 'drop_SITE_B_1_fixture.jpg', 'Another photo recorder');
  const found = G.verifyNativeDocs(f.before, f.after, f.opts);
  assert.equal(found.length, 2);
  assert.deepEqual(found.map(row => row.id).sort(), [newId, 'drop_SITE_B_1_fixture.jpg'].sort());
});
test('Optional photo unit and caption remain intact', () => {
  const f = fixture(); f.after.photoLinks[newId].unit = 'fixture-unit'; f.after.photoLinks[newId].caption = 'Recorded context';
  const frozen = snapshot([f.after]); assert.equal(G.verifyNativeDocs(f.before, f.after, f.opts).length, 1);
  unchanged([f.after], frozen);
});
test('Empty page-only collection is tolerated without changing existing documents', () => {
  const before = docs(), after = clone(before); after.pageOnly = {};
  assert.deepEqual(G.verifyNativeDocs(before, after, options()), []);
});
test('Omitted empty page-only collection is tolerated', () => {
  const before = docs(), after = clone(before); before.pageOnly = {};
  assert.deepEqual(G.verifyNativeDocs(before, after, options()), []);
});
test('Photo at baseline and stamp at observation satisfy inclusive bounds', () => {
  const f = fixture(); f.after.photoLinks[newId].at = T.before; f.after.stamps[provenanceId].v = T.observed;
  assert.equal(G.verifyNativeDocs(f.before, f.after, f.opts).length, 1);
});
test('Same photo and stamp time are allowed', () => {
  const f = fixture(); f.after.stamps[provenanceId].v = T.photo;
  assert.equal(G.verifyNativeDocs(f.before, f.after, f.opts).length, 1);
});
test('Unchanged complete native state is accepted', () => {
  const f = stateFixture(); f.after = clone(f.before);
  assert.deepEqual(G.verifyNativeState(f.before, f.after, f.opts), []);
});
test('Complete native state advances with allowed photo triplet only', () => {
  const f = stateFixture(), values = [f.before, f.after, f.opts], frozen = snapshot(values);
  assert.equal(G.verifyNativeState(f.before, f.after, f.opts).length, 1);
  unchanged(values, frozen);
});
test('State version need only advance; no invented exact write-count rule', () => {
  const f = stateFixture(); f.after.version = 41;
  assert.equal(G.verifyNativeState(f.before, f.after, f.opts).length, 1);
});
test('State helper defaults an omitted operation baseline to native updated time', () => {
  const f = stateFixture(); delete f.opts.since;
  assert.equal(G.verifyNativeState(f.before, f.after, f.opts).length, 1);
});
test('Earlier operation baseline covers capture before a later checkpoint', () => {
  const f = stateFixture(); f.opts.since = '2026-01-02T03:03:58.000Z';
  f.after.docs.photoLinks[newId].at = '2026-01-02T03:03:59.999Z';
  assert.equal(G.verifyNativeState(f.before, f.after, f.opts).length, 1);
});
test('An accepted photo becomes protected baseline on the next comparison', () => {
  const f = fixture(); G.verifyNativeDocs(f.before, f.after, f.opts);
  const accepted = clone(f.after), later = addTriplet(clone(accepted), 'drop_SITE_C_1_fixture.jpg');
  assert.equal(G.verifyNativeDocs(accepted, later, f.opts).length, 1);
  later.photoLinks[newId].caption = 'Changed after acceptance';
  assert.throws(() => G.verifyNativeDocs(accepted, later, f.opts));
});

rejectsDocs('Existing delivery change is rejected even with a valid new photo', f => { f.after.delivery.SITE_A.state = 'not on site'; });
rejectsDocs('Existing nested financial value change is rejected', f => { f.after.purchaseOrders.PO_FIXTURE.amount += 0.01; });
rejectsDocs('Deleting an existing native record is rejected', f => { delete f.after.delivery.SITE_A; });
rejectsDocs('Deleting an existing nonempty collection is rejected', f => { delete f.after.delivery; });
rejectsDocs('Changing an existing photo is rejected', f => { f.after.photoLinks['old.jpg'].ref = 'SITE_B'; });
rejectsDocs('Changing an existing provenance stamp is rejected', f => { f.after.stamps['photoLinks~2f~old.jpg'].v = T.stamp; });
rejectsDocs('Changing an existing provenance author is rejected', f => { f.after.by['photoLinks~2f~old.jpg'].v = 'Another recorder'; });
rejectsDocs('Unrelated collection addition is rejected', f => { f.after.notes = {SITE_A: {_k: 'SITE_A', v: 'Unrelated'}}; });
rejectsDocs('Unrelated record addition within existing collection is rejected', f => { f.after.delivery.SITE_B = {_k: 'SITE_B', state: 'on site'}; });
rejectsDocs('Missing new stamp is rejected', f => { delete f.after.stamps[provenanceId]; });
rejectsDocs('Missing new author is rejected', f => { delete f.after.by[provenanceId]; });
rejectsDocs('Orphan stamp without photo is rejected', f => { delete f.after.photoLinks[newId]; });
rejectsDocs('Orphan author without photo or stamp is rejected', f => { delete f.after.photoLinks[newId]; delete f.after.stamps[provenanceId]; });
rejectsDocs('Equal triplet counts cannot disguise a mismatched companion key', f => {
  f.after.stamps['photoLinks~2f~different.jpg'] = f.after.stamps[provenanceId]; delete f.after.stamps[provenanceId];
});
rejectsDocs('Photo identity must match its original key', f => { f.after.photoLinks[newId]._k = 'different.jpg'; });
rejectsDocs('Photo identity must match the stored native document key', f => { f.after.photoLinks.wrong = f.after.photoLinks[newId]; delete f.after.photoLinks[newId]; });
rejectsDocs('Missing photo identity is rejected', f => { delete f.after.photoLinks[newId].id; });
rejectsDocs('Photo identity cannot be an array', f => { f.after.photoLinks[newId] = []; });
rejectsDocs('Stamp original key must name the same photo', f => { f.after.stamps[provenanceId]._k = 'photoLinks/different.jpg'; });
rejectsDocs('Author original key must name the same photo', f => { f.after.by[provenanceId]._k = 'photoLinks/different.jpg'; });
rejectsDocs('Extra stamp fields are rejected', f => { f.after.stamps[provenanceId].extra = true; });
rejectsDocs('Extra author fields are rejected', f => { f.after.by[provenanceId].extra = true; });
rejectsDocs('Photo author and provenance author must match', f => { f.after.by[provenanceId].v = 'Different recorder'; });
rejectsDocs('Runner cannot label its own photo addition as independent', f => {
  f.after.photoLinks[newId].by = f.opts.operator; f.after.by[provenanceId].v = f.opts.operator;
});
rejectsDocs('Empty photo author is rejected', f => { f.after.photoLinks[newId].by = ''; f.after.by[provenanceId].v = ''; });
rejectsDocs('Photo author outer whitespace is rejected', f => { f.after.photoLinks[newId].by = ' Recorder '; f.after.by[provenanceId].v = ' Recorder '; });
rejectsDocs('Missing runner operator cannot establish independent provenance', f => { delete f.opts.operator; });
rejectsDocs('Blank runner operator cannot establish independent provenance', f => { f.opts.operator = ''; });
rejectsDocs('Non-string runner operator is rejected', f => { f.opts.operator = {}; });
rejectsDocs('Missing photo reference is rejected', f => { delete f.after.photoLinks[newId].ref; });
rejectsDocs('Whitespace-only photo reference is rejected', f => { f.after.photoLinks[newId].ref = ' '; });
rejectsDocs('Removed photo association is rejected', f => { f.after.photoLinks[newId].removed = T.photo; });
rejectsDocs('Removal author on a new association is rejected', f => { f.after.photoLinks[newId].removed_by = 'Fixture remover'; });
rejectsDocs('Removal reason on a new association is rejected', f => { f.after.photoLinks[newId].removed_why = 'Fixture reason'; });
for (const key of ['removed', 'removed_by', 'removed_why']) {
  rejectsDocs('Presence of empty ' + key + ' still violates active-new-association shape', f => { f.after.photoLinks[newId][key] = ''; });
}
rejectsDocs('Photo timestamp before baseline is rejected', f => { f.after.photoLinks[newId].at = '2026-01-02T03:03:59.999Z'; });
rejectsDocs('Stamp timestamp before photo is rejected', f => { f.after.stamps[provenanceId].v = T.before; });
rejectsDocs('Stamp after observation is rejected', f => { f.after.stamps[provenanceId].v = '2026-01-02T03:04:05.001Z'; });
rejectsDocs('Photo time with timezone offset is not canonical UTC', f => { f.after.photoLinks[newId].at = '2026-01-02T03:04:01.000+00:00'; });
rejectsDocs('Stamp time without milliseconds is rejected', f => { f.after.stamps[provenanceId].v = '2026-01-02T03:04:02Z'; });
rejectsDocs('Impossible calendar date is rejected', f => { f.after.photoLinks[newId].at = '2026-02-30T03:04:01.000Z'; });
rejectsDocs('Observation before baseline is rejected', f => { f.opts.observedAt = '2026-01-02T03:03:59.999Z'; });
rejectsDocs('Invalid baseline timestamp is rejected', f => { f.opts.since = 'yesterday'; });
rejectsDocs('Invalid observation timestamp is rejected', f => { f.opts.observedAt = 'later'; });
rejectsDocs('Array collection is rejected', f => { f.after.photoLinks = []; });
rejectsDocs('Null collection is not an empty page collection', f => { f.after.pageOnly = null; });
rejectsDocs('False collection is not an empty page collection', f => { f.after.pageOnly = false; });
rejectsDocs('Array document root is rejected', f => { f.after = []; });
rejectsDocs('Missing document root is rejected', f => { f.after = null; });

rejectsState('Native metadata level change is rejected', f => { f.after.level = 'edit'; });
rejectsState('Added unrelated top-level metadata is rejected', f => { f.after.extra = true; });
rejectsState('Deleted top-level metadata is rejected', f => { delete f.after.level; });
rejectsState('Version moving backwards is rejected', f => { f.after.version = 39; });
rejectsState('Non-integer version is rejected', f => { f.after.version = 43.5; });
rejectsState('Unsafe integer version is rejected', f => { f.after.version = Number.MAX_SAFE_INTEGER + 1; });
rejectsState('Negative baseline version is rejected', f => { f.before.version = -1; });
rejectsState('Photo additions require version advancement', f => { f.after.version = f.before.version; });
rejectsState('Updated time moving backwards is rejected', f => { f.after.updated = '2026-01-02T03:03:59.999Z'; });
rejectsState('Updated time before the latest photo stamp is rejected', f => { f.after.updated = T.photo; });
rejectsState('Updated time after observation is rejected', f => { f.after.updated = '2026-01-02T03:04:05.001Z'; });
rejectsState('Version cannot advance with no allowed addition', f => { f.after.docs = clone(f.before.docs); });
rejectsState('Updated time cannot change with no allowed addition', f => { f.after.docs = clone(f.before.docs); f.after.version = f.before.version; });
rejectsState('Operation baseline cannot follow the backed-up state', f => { f.opts.since = T.photo; });
rejectsState('Explicit invalid empty operation baseline is rejected', f => { f.opts.since = ''; });
rejectsState('Native state cannot gain an unrelated empty collection', f => { f.after.docs.pageOnly = {}; });
rejectsState('Native state cannot lose an existing empty collection', f => { f.before.docs.pageOnly = {}; });

const failed = results.filter(row => !row.pass);
console.log(JSON.stringify({
  author: 'Andrew Fisher', pass: failed.length === 0, cases: results.length,
  passed: results.length - failed.length, failed: failed.length, networkCalls, serverWrites: 0,
  guardsSha256: G.hash(fs.readFileSync(path.join(__dirname, 'document_guards.cjs'))),
  testSha256: G.hash(fs.readFileSync(__filename)), results
}, null, 2));
if (failed.length) process.exitCode = 1;
