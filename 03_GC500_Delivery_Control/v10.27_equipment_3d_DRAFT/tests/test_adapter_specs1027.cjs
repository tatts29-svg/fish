/* Author: Andrew Fisher. Pure regression checks for verified specifications and
 * source door metadata. PAGE points to the final candidate for the native
 * identity helper regression. No browser, service or record writes are used. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../adapter1027.js'), 'utf8');
const checks = [];
const check = (name, run) => {run(); checks.push(name);};
const plain = value => JSON.parse(JSON.stringify(value));

function verified(massKg = 2150, overrides = {}) {
  return {item: 'Building 6m', actualVerified: true, owner: 'coates', source: {nominal: {lengthMm: 6000, widthMm: 3000}},
    record: {actual: {lengthMm: 6000, widthMm: 3000, heightMm: 2800, massKg, source: 'Verified unit specification', ...overrides}}};
}

function setup(products, shape = null) {
  const asset = {key: 'P60', name: 'Fixture building'};
  const context = {
    todayWorkHealth840: () => ({ready: true}), DATA: {edition: 'fixture'},
    refKind: () => 'building', masterUnit: () => ({ll: [-28, 153], how: 'Fixture drawing'}),
    gate6Revision1021: () => null, allAssets: () => [asset], assetOf: ref => ref === 'P60' ? asset : null,
    movedAway: () => false, deliveryOf: () => ({}), timeline841State: () => ({}), gc500IsComplete897: () => true,
    mapStatus1009Classify: () => ({state: 'complete', label: 'Complete'}),
    mapQuantity1010: () => ({items: [{item: 'Building 6m', quantity: 2, installed: 2, completed: 2}]}),
    chargeLines: () => [], todayIso: () => '2026-10-15', toiletRows962: () => ({rows: []}),
    ItemOwnership969: {read: () => ({rows: []})}, Units925: {company: owner => owner === 'coates' ? 'Coates' : owner},
    Loading931: {referenceProducts931: () => products, nominal931: () => ({lengthMm: 6000}), family931: () => 'building'},
    MasterShapes926: {shape: () => shape}, MASTER_SHAPES926_DATA: {sheet: [100, 100]},
    MASTER_LOC: {},
  };
  context.window = context;
  vm.runInNewContext(source, context, {filename: 'adapter1027.js'});
  return {api: context.GC500Equipment1027, item: () => plain(context.GC500Equipment1027.get('P60').items[0])};
}

check('native unit identity serialises instead of referring to returnJSON', () => {
  assert(process.env.PAGE, 'Set PAGE to the candidate containing the guarded native helper correction.');
  const page = fs.readFileSync(process.env.PAGE, 'utf8');
  const matches = [...page.matchAll(/^function fingerprintUnit\(u\)\{[^\n]*\}$/gm)];
  assert.equal(matches.length, 1, 'One exact native identity helper must be present.');
  const fingerprint = vm.runInNewContext('(' + matches[0][0] + ')', {
    ownerKey: value => String(value || 'unknown'), txt: value => String(value ?? '').trim()
  });
  const unit = Object.freeze({id: 'physical-fixture', ref: 'P60', owner: 'coates',
    recordedOwner944: 'event-portables', assetNo: ' 0012 ', item: 'Building 6m'});
  assert.deepEqual(JSON.parse(fingerprint(unit)), ['physical-fixture', 'P60', 'event-portables', '0012', 'Building 6m']);
  assert.notEqual(fingerprint(unit), fingerprint({...unit, assetNo: '0013'}), 'A changed asset must invalidate the recorded identity.');
});

check('matching verified masses are exposed per unit without multiplying quantity', () => {
  const item = setup([verified(), verified()]).item();
  assert.equal(item.quantity, 2);
  assert.equal(item.dimensions.massKg, 2150);
  assert.equal(item.dimensions.heightMm, 2800);
  assert.equal(item.dimensions.verified, true);
});

check('unverified saved mass and height are not presented as actual specifications', () => {
  const product = verified(); product.actualVerified = false;
  const d = setup([product]).item().dimensions;
  assert.equal(d.massKg, null); assert.equal(d.heightMm, null); assert.equal(d.verified, false);
  assert.equal(d.lengthMm, 6000); assert.equal(d.widthMm, 3000);
});

check('guide and nominal masses cannot become actual equipment weights', () => {
  const d = setup([{item: 'Building 6m', actualVerified: false,
    source: {nominal: {lengthMm: 6000, widthMm: 3000, massKg: 3000}},
    guide: {rows: [{massKg: 3000, heightMm: 2800}]}}]).item().dimensions;
  assert.equal(d.massKg, null); assert.equal(d.heightMm, null);
});

check('different verified masses keep common dimensions but no shared mass', () => {
  const d = setup([verified(2150), verified(2300)]).item().dimensions;
  assert.equal(d.lengthMm, 6000); assert.equal(d.heightMm, 2800); assert.equal(d.massKg, null);
});

check('one missing mass prevents a shared per-unit mass', () => {
  const d = setup([verified(2150), verified(null)]).item().dimensions;
  assert.equal(d.massKg, null); assert.equal(d.verified, true);
});

check('different physical dimensions cannot be collapsed into one specification', () => {
  assert.equal(setup([verified(2150), verified(2150, {widthMm: 2400})]).item().dimensions, null);
});

check('nonpositive or nonnumeric masses remain unknown', () => {
  for (const mass of [0, -1, Infinity, NaN, '2150', true]) assert.equal(setup([verified(mass)]).item().dimensions.massKg, null);
});

check('fresh native specifications are read on the next snapshot', () => {
  const product = verified(2150), fixture = setup([product]);
  assert.equal(fixture.item().dimensions.massKg, 2150);
  product.record.actual.massKg = 2250;
  assert.equal(fixture.item().dimensions.massKg, 2250);
});

const rawDoors = [{edge_index: 1, at: .2, mid: [.2, .3], bearing_deg: 85.8, width_m: .78,
  faces: 'east', opens: 'outward'}, {edge_index: 1, at: .8, mid: [.4, .5], bearing_deg: 85.8,
  width_m: .83, faces: 'east', opens: 'outward'}];
const shape = {placed: true, cancelled: false, components: [{geometry: 'polygon', kind: 'building',
  poly: [[.1,.1],[.2,.1],[.2,.2],[.1,.2]], centroid: [.15,.15], source: 'master',
  door: rawDoors[0], doors: rawDoors, door_note: '2 doors drawn, all on the same edge'}]};
const project = (x, y) => [-28 + y / 10000, 153 + x / 10000];

check('all native doors retain their separate midpoint, width, edge and evidence', () => {
  const fixture = setup([verified()], shape), component = plain(fixture.api.get('P60', project).components[0]);
  assert.equal(component.doorCount, 2); assert.equal(component.doors.length, 2);
  assert.equal(component.doorBearingDeg, 85.8); assert.equal(component.doorEdge, 1);
  assert.deepEqual(component.doors.map(door => [door.at, door.widthM, door.edgeIndex]), [[.2, .78, 1], [.8, .83, 1]]);
  assert.deepEqual(component.doors[0].mid, {lat: -27.997, lon: 153.002});
  assert.equal(component.doors[0].source, 'master');
  assert.equal(component.doors[0].basis, shape.components[0].door_note);
  component.doors[0].at = .9;
  assert.equal(fixture.api.get('P60', project).components[0].doors[0].at, .2, 'Returned metadata must not mutate source doors.');
});

check('an invalid projection keeps known door count but produces no false location', () => {
  const component = setup([verified()], shape).api.get('P60', () => [NaN, Infinity]).components[0];
  assert.equal(component.doorCount, 2); assert(component.doors.every(door => door.mid === null));
});

check('no doorway is invented for an outline without a master door', () => {
  const unknown = plain(shape); unknown.components[0].kind = 'toilet';
  unknown.components[0].door = null; unknown.components[0].doors = [];
  const component = setup([verified()], unknown).api.get('P60', project).components[0];
  assert.equal(component.doorCount, 0); assert.equal(component.doorBearingDeg, null);
});

console.log(JSON.stringify({author: 'Andrew Fisher', passed: checks.length, checks}));
