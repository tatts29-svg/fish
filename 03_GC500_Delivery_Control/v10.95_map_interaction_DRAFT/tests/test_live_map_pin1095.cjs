/* Author: Andrew Fisher. Exact page functions with synthetic map/record adapters; no network or native writes. */
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = process.argv[2];
if (!source) throw Error('Pass the exact candidate HTML path');
const html = fs.readFileSync(source, 'utf8');
function extract(name) {
  const found = new RegExp('^([ \\t]*)(?:async )?function ' + name + '\\(', 'm').exec(html);
  assert(found, 'Missing ' + name);
  const first = html.indexOf('\n', found.index), end = html.indexOf('\n' + found[1] + '}', first);
  assert(end > first, 'Missing boundary for ' + name);
  return html.slice(found.index, end + found[1].length + 2);
}
function context(approvedHere) {
  const record = {
    fixes: {
      'TEST-A': {lat: -28, lon: 153.5, master: true, by: 'Drawing source', acc: null},
      'TEST-A/u1': {lat: -27.91, lon: 153.41, by: 'Test operator', acc: 3},
      'TEST-A/u2': {lat: -27.92, lon: 153.42, by: 'Test operator', acc: 4},
      'TEST-B': {lat: -28.1, lon: 153.6, master: true, by: 'Drawing source', acc: null},
      'TEST-B/u3': {lat: -27.93, lon: 153.43, by: 'Test operator', acc: 5},
      'TEST-C': {lat: -28.2, lon: 153.7, master: true, by: 'Drawing source', acc: null}
    },
    places: {
      'TEST-A': {lat: -27.9, lon: 153.4},
      'TEST-B': {lat: -27.8, lon: 153.3}
    }
  };
  const original = JSON.stringify(record), markers = [], maps = [], notes = [];
  const assets = ['TEST-A', 'TEST-B', 'TEST-C'].map(key => ({key}));
  const ap = a => a && (a.key === 'TEST-B' || approvedHere && a.key === 'TEST-A')
    ? {key: a.key, place: record.places[a.key]} : null;
  class MapStub {
    constructor(opts) { this.options = opts; maps.push(this); }
    addControl() {}
    on() {}
    fitBounds(bounds) { this.bounds = bounds.points; }
    remove() {}
  }
  class Marker {
    constructor(opts) { this.options = opts; markers.push(this); }
    setLngLat(ll) { this.ll = ll; return this; }
    setPopup(p) { this.popup = p; return this; }
    addTo() { return this; }
  }
  class Popup { setText(text) { this.text = text; return this; } }
  class Bounds {
    constructor(...points) { this.points = points; }
    extend(point) { this.points.push(point); return this; }
  }
  const gl = {Map: MapStub, Marker, Popup, LngLatBounds: Bounds,
    NavigationControl: class {}, ScaleControl: class {}, GeolocateControl: class {}};
  const element = () => ({style: {}, innerHTML: '', remove() {}});
  const mapElement = element(), box = {querySelector: s => s === '.livemap' ? mapElement : null, appendChild() {}};
  const c = {
    S: record, LIVEMAP: {}, location: {origin: 'https://example.test'},
    document: {createElement: element}, liveMapNote: (_b, msg) => notes.push(msg),
    liveMapKeyFromService: async () => {}, liveMapKey: () => ({token: 'synthetic-test-token'}),
    loadMapboxGl: async () => gl, sheetBearing: () => 0,
    pinsNow: () => ({...record.fixes}), allAssets: () => assets, holdAssets: run => run(),
    assetOf: key => assets.find(a => a.key === key), andrewPin1084: ap,
    lonLatOf: () => approvedHere ? record.places['TEST-A'] : {lat: -28, lon: 153.5},
    navPoint917: a => ap(a) ? {ll: ap(a).place, label: 'Andrew’s pin', nav: 'the approved pin'}
      : {ll: {lat: -28, lon: 153.5}, label: 'master plan', nav: 'the master plan position'},
    fixParse: key => ({ref: key.split('/')[0], unit: key.split('/')[1] || ''}),
    fixLabel: key => key, fixQuality: acc => ({word: acc == null ? 'not measured' : 'within ' + acc + ' m'}),
    bestPlaceFor: a => ap(a), placeWords: () => 'placed on the map',
    masterUnit: () => ({how: 'Master plan position'}), masterWords: () => 'Master plan position',
    locSrc782: () => null, entryOf: () => null, esc: String, fmtStamp: String,
    mayWrite: () => { throw Error('Native write permission requested'); },
    capability: () => 'view'
  };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(extract('mountLiveMap'), c);
  vm.runInContext(extract('navSays'), c);
  return {c, record, original, markers, maps, box, assets};
}
const pair = p => JSON.stringify(Array.from(p));
async function run(approved) {
  const t = context(approved);
  await t.c.mountLiveMap(t.box, t.assets[0], {ax: 0.5, ay: 0.5});
  assert.equal(t.maps.length, 1);
  const at = ll => t.markers.filter(m => pair(m.ll) === pair(ll));
  for (const ll of [[153.41, -27.91], [153.42, -27.92], [153.43, -27.93]]) {
    assert.equal(at(ll).length, 1, 'Every separate unit fix stays visible exactly once');
  }
  assert.equal(at([153.3, -27.8]).length, 1, 'Other approved reference is at its saved pin');
  assert.equal(at([153.6, -28.1]).length, 0, 'Other approved reference has no stale synthetic master marker');
  assert.equal(at([153.7, -28.2]).length, 1, 'Unchanged ordinary master source remains visible');
  assert.match(at([153.7, -28.2])[0].popup.text, /master plan/i);
  assert.doesNotMatch(at([153.7, -28.2])[0].popup.text, /standing at|pinned on the ground/i);
  if (approved) {
    assert.equal(pair(t.maps[0].options.center), pair([153.4, -27.9]));
    assert.equal(at([153.4, -27.9]).length, 1, 'Selected approved pin has one primary marker');
    assert.equal(at([153.5, -28]).length, 0, 'Selected approved reference has no stale synthetic marker');
    assert.match(at([153.4, -27.9])[0].popup.text, /Andrew.?s pin/i);
    for (const ll of [[153.4, -27.9], [153.41, -27.91], [153.42, -27.92]])
      assert(t.maps[0].bounds.some(p => pair(p) === pair(ll)), 'Bounds retain primary and separate unit positions');
    t.c.dest782 = () => ({kind: 'pinned', andrew: true, nav: 'the spot Andrew pinned for TEST-A'});
    t.c.navTargetFor = () => ({andrew: true, placed: true, key: 'TEST-A', place: t.record.places['TEST-A']});
    const text = t.c.navSays(t.assets[0]);
    assert.match(text, /Andrew/i);
    assert.doesNotMatch(text, /Nobody has stood|replaces this|drawing.*area/i);
  } else {
    assert.equal(pair(t.maps[0].options.center), pair([153.5, -28]), 'Ordinary reference centre unchanged');
    for (const mark of at([153.5, -28]))
      assert.doesNotMatch(mark.popup.text, /standing at|pinned on the ground/i);
  }
  assert.equal(JSON.stringify(t.record), t.original, 'Native coordinates and metadata unchanged');
}
(async () => {
  await run(true);
  await run(false);
  console.log(JSON.stringify({pass: true, scenarios: 2, networkRequests: 0, nativeWrites: 0}));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
