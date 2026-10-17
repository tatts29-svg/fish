// Author: Andrew Fisher. Independent semantic checks; synthetic destinations only, no browser or operational writes.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const api = require('../drops911.js');
const projector = require('../../v9.08_timeline_compact_LIVE/drops908.js').project;
const checks = [];
function test(name, fn) { fn(); checks.push(name); console.log('PASS ' + name); }
function destination(kind, extra = {}) { return Object.assign({kind, ll: {lat: -27.982, lon: 153.428}, approx: false}, extra); }
function locate(d, options = {}) {
 const a = {key: options.key || 'P01'}, m = options.master;
 return api.location(a, {master:m?{[a.key]:m}:{}, destination:()=>d, moved:()=>options.moved||null,
  sheet:{key:'D001'},frame:()=>({ax:1,ay:2}),toSheet:()=>options.outside?{fx:2,fy:3}:{fx:.42,fy:.37}});
}
const unit={prec:'unit',pt:[.9,.1]};
test('master-plan unit uses its exact drawing position, not a geographic approximation',()=>assert.deepEqual(locate(destination('master'),{master:unit}).point,[.9,.1]));
test('reported meeting point cannot become a delivery location',()=>assert.equal(locate(destination('report'),{master:unit}).point,null));
test('missing drop remains unplaced with a clear reason',()=>assert.match(locate(null).reason,/confirm/i));
test('moved reference cannot reuse its old drawing position',()=>assert.equal(locate(destination('master'),{master:unit,moved:{to:'New compound'}}).point,null));
test('independent confirmed GPS is transformed into the drawing frame',()=>assert.deepEqual(locate(destination('pinned',{nt:{fix:{acc:5}}}),{master:{...unit,unverified:true},moved:{to:'New compound'}}).point,[.42,.37]));
test('master-derived pin cannot bypass moved-location checks',()=>assert.equal(locate(destination('pinned',{nt:{fix:{master:true}}}),{master:unit,moved:{to:'New compound'}}).point,null));
test('unverified positions remain explicit',()=>{assert.equal(locate(destination('master'),{master:{...unit,unverified:true}}).point,null);assert.equal(locate(destination('unverified'),{master:unit}).point,null);});
test('approximate and area targets are not promoted to exact units',()=>{for(const d of [destination('desc',{approx:true}),destination('placed'),destination('area')])assert.equal(locate(d).point,null);});
test('an explicitly confirmed area still needs its actual sheet point',()=>{assert.equal(locate(destination('master'),{master:{prec:'area'}}).point,null);assert.deepEqual(locate(destination('confirmed'),{master:{prec:'area',confirmed:true,pt:[.2,.3]}}).point,[.2,.3]);});
test('inset references stay on their own actual printed master-plan positions',()=>{for(const key of ['CP1','T0265','WC81'])assert.deepEqual(locate(destination('master'),{key,master:unit}).point,[.9,.1]);});
test('out-of-sheet recorded positions are not fabricated on the drawing',()=>assert.equal(locate(destination('pinned'),{outside:true}).point,null));
test('master-fixed pins remain at the authoritative drawing point',()=>assert.deepEqual(locate(destination('pinned',{nt:{fix:{master:true}}}),{master:unit}).point,[.9,.1]));
test('confirmed description positions use the existing sheet transform',()=>assert.deepEqual(locate(destination('desc')).point,[.42,.37]));
test('unknown destination kinds do not create a point',()=>assert.equal(locate(destination('invented')).point,null));
test('invalid drawing coordinates are rejected rather than coerced',()=>{for(const point of [[.4,'0.9'],[Infinity,.2],[1.01,.2],[-.1,.2],[NaN,.2],null])assert.equal(api.validPoint(point),false);assert.equal(api.validPoint([.4,.6]),true);assert.equal(locate(destination('master'),{master:{prec:'unit',pt:[2,3]}}).point,null);assert.equal(locate(destination('pinned',{ll:{lon:153.4,lat:'bad'}})).point,null);});
const assets = {
 A: {key: 'A', name: 'Building', point: [153.428, -27.982], stage: 5},
 B: {key: 'B', name: 'Toilet block', point: [153.428, -27.982], stage: 3},
 C: {key: 'C', name: 'Generator', point: [153.429, -27.983], stage: 5},
 D: {key: 'D', name: 'Tank', point: [153.428, -27.982], stage: 5},
 E: {key: 'E', name: 'Fence', point: null, stage: 2}
};
const row = key => ({a: assets[key]});
const loads = [
 {id: 'truck-a', kind: 'deliveries', time: '05:00', rows: [row('A'), row('B'), row('A')]},
 {id: 'outbound', kind: 'removals', rows: [row('D')]},
 {id: 'truck-c', kind: 'deliveries', time: '05:30', rows: [row('C'), row('E')]},
 {id: 'truck-d', kind: 'deliveries', rows: [row('D')]}
];
function model(visible = loads.map((g, i) => ({g, n: i + 1})).filter(v => v.g.kind === 'deliveries'), replacements = {}) {
 return api.project(Object.assign({day: {iso: '2026-10-12'}, loads, visible, projector,
  idOf: (day, g) => day.iso + '/' + g.id,
  stateOf: a => ({stage: a.stage}),
  locationOf: a => a.point ? {point: a.point, source: 'Recorded GPS position'} : {point: null, reason: 'Drop to confirm'}
 }, replacements));
}
test('native full daily numbering preserves gaps occupied by other load kinds', () => assert.deepEqual(model().loads.map(l => l.n), [1, 3, 4]));
test('filtering a reference retains every full-day load and stable canonical identity', () => {
 const m = model([{n: 1, g: {...loads[0], rows: [row('B')]}}]);
 assert.deepEqual(m.loads.map(l => l.n), [1, 3, 4]);
 assert.deepEqual(m.loads[0].allRefs, ['A', 'B']);
 assert.deepEqual(m.loads[0].refs.map(r => r.key), ['A', 'B']);
 assert.deepEqual(m.loads.map(l => l.hiddenByFilter), [false, true, true]);
 assert.equal(m.loads[0].id, '2026-10-12/truck-a');
});
test('zero matching filtered rows retain the full day list with explicit hidden flags', () => assert.ok(model([]).loads.every(l => l.hiddenByFilter)));
test('partial completion cannot become finished when an unfinished reference is filtered away', () => {
 const m = model([{n: 1, g: {...loads[0], rows: [row('A')]}}]);
 assert.equal(m.loads[0].complete, false);
 assert.equal(api.markers(m).find(p => p.n === 1).complete, false);
});
test('native time and status are retained without inferred arrival times', () => {
 const m = model(); assert.equal(m.loads[0].time, '05:00'); assert.equal(m.loads[2].time, ''); assert.equal(m.loads[2].complete, true);
});
test('unplaced references remain in their load and the unplaced record', () => {
 const m = model(); assert.ok(m.loads[1].refs.some(r => r.key === 'E' && r.point === null)); assert.equal(m.unplaced[0].n, 3); assert.equal(m.unplaced[0].key, 'E');
});
test('same truck and destination share one badge with unique asset references', () => {
 const points = api.markers(model()); const same = points.filter(p => p.n === 1);
 assert.equal(same.length, 1); assert.deepEqual(same[0].refs, ['A', 'B']);
});
test('different trucks at the same point keep separate numbered badges', () => {
 const shared = api.markers(model()).filter(p => p.point[0] === 153.428); assert.deepEqual(shared.map(p => p.n), [1, 4]); assert.notEqual(shared[0].id, shared[1].id);
});
test('a truck with separate destinations keeps its number at each real drop', () => {
 const different = model(undefined, {locationOf: a => a.key === 'B' ? {point: [153.430, -27.984]} : {point: a.point}});
 assert.equal(api.markers(different).filter(p => p.n === 1).length, 2);
});
test('reordered native loads get new order numbers but preserve stable load identities', () => {
 const order = [loads[3], loads[0], loads[1], loads[2]], m = model([], {loads: order});
 assert.deepEqual(m.loads.map(l => [l.n, l.id]), [[1, '2026-10-12/truck-d'], [2, '2026-10-12/truck-a'], [4, '2026-10-12/truck-c']]);
});
test('coincident drops have distinct readable labels without changing geographic anchors', () => {
 const inputs = Array.from({length: 10}, (_, i) => ({id: 'truck-' + i, n: i + 1, x: 180, y: 210, point: [153.428, -27.982]}));
 const before = JSON.stringify(inputs), placed = api.labels(inputs, 390, 520);
 assert.equal(placed.length, 10); assert.equal(JSON.stringify(inputs), before);
 for (const p of placed) { assert.equal(p.anchorX, 180); assert.equal(p.anchorY, 210); assert.deepEqual(p.point, [153.428, -27.982]); assert.equal(p.crowded, false); assert.ok(p.x >= 25 && p.x <= 365 && p.y >= 25 && p.y <= 472); }
 for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) assert.ok(Math.abs(placed[i].x - placed[j].x) >= 47 || Math.abs(placed[i].y - placed[j].y) >= 44);
});
test('offscreen destinations keep the true offscreen anchor when labels are clamped', () => {
 const p = api.labels([{x: -900, y: 1200, n: 1}], 390, 520)[0]; assert.equal(p.anchorX, -900); assert.equal(p.anchorY, 1200); assert.ok(p.x >= 25 && p.y <= 472);
});
test('labels near the top-right leave the zoom controls accessible', () => {
 const inputs = Array.from({length: 10}, (_, i) => ({n: i + 1, x: 380, y: 15})), output = api.labels(inputs, 390, 520);
 assert.equal(output.length, 10);
 for (const p of output) { assert.ok(!(p.x > 320 && p.y < 125)); assert.equal(p.anchorX, 380); assert.equal(p.anchorY, 15); assert.equal(p.crowded, false); }
});
test('crowded tiny viewport is reported without dropping any load number', () => {
 const inputs = Array.from({length: 10}, (_, i) => ({n: i + 1, x: 50, y: 50})), output = api.labels(inputs, 100, 100);
 assert.deepEqual(output.map(p => p.n), inputs.map(p => p.n)); assert.ok(output.some(p => p.crowded));
});
test('projection and markers do not mutate loads, assets, filters or saved state', () => {
 const before = JSON.stringify({loads, assets}), m = model(); api.markers(m); assert.equal(JSON.stringify({loads, assets}), before);
});
test('loading the module does not access or write native state, storage or network', () => {
 const sandbox = {module: {exports: {}}, console};
 for (const name of ['S', 'localStorage', 'fetch', 'bump', 'save', 'setDelivery']) Object.defineProperty(sandbox, name, {get() { throw Error('Unexpected operational access: ' + name); }});
 vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../drops911.js'), 'utf8'), sandbox);
 assert.equal(typeof sandbox.module.exports.project, 'function');
});
console.log(checks.length + '/' + checks.length);
