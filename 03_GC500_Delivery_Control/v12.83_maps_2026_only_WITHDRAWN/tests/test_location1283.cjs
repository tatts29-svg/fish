'use strict';
// Author: Andrew Fisher. Run the candidate's actual coordinate helper and host routing in isolation.
// Usage: node test_location1283.cjs <candidate/explorer/explorer-merge.js> <georeferencing.json> [dashboard.html]
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const [mergePath, geoPath, dashboardPath] = process.argv.slice(2);
if (!mergePath || !geoPath) throw new Error('Pass candidate explorer-merge.js and its actual georeferencing.json');
const source = fs.readFileSync(mergePath, 'utf8');
const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'));
assert.equal(geo.pdf_sha256, '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d');
function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a);
  assert(a >= 0 && b > a, 'Candidate source anchors exist');
  return text.slice(a, b);
}
const math = between(source, '  function z18Of(', '  /* a latitude and longitude as a point');
const helper = between(source, '    G.gotoLatLon1283 = ', '    G.mode3d = ');
const moves = [], notices = [];let selectionsCleared=0;
const ctx = vm.createContext({ GEO: geo, W18: 2 ** 18 * 512, G: {},
  clearSelection813:()=>{selectionsCleared++;},
  gotoRect: (rect, label) => moves.push({rect: Array.from(rect), label}),
  toast: text => notices.push(text), Number, Math });
vm.runInContext(math + '\n' + helper, ctx, {filename: mergePath});
const locate = ctx.G.gotoLatLon1283;
function near(a, b, tolerance = 0.005) { assert(Math.abs(a - b) <= tolerance, `${a} should be close to ${b}`); }
function centre(move) { return [(move.rect[0] + move.rect[2]) / 2, (move.rect[1] + move.rect[3]) / 2]; }
function llFromSheet(x, y, matrix) {
  const px = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2];
  const py = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2];
  return [Math.atan(Math.sinh(Math.PI * (1 - 2 * py / (2 ** 18 * 512)))) * 180 / Math.PI,
    px / (2 ** 18 * 512) * 360 - 180];
}
// Synthetic inset position: main-only conversion falls beyond the map region.
const inset=llFromSheet(2160,1260,geo.inset.sheet_to_z18px);
assert.equal(locate(...inset,'Inset reference'),true);
let c=centre(moves.at(-1));near(c[0],2160);near(c[1],1260);
// A normal main-plan coordinate must retain its actual position.
const main = llFromSheet(1000, 500, geo.main.sheet_to_z18px);
assert.equal(locate(...main, 'Main reference'), true);
c = centre(moves.at(-1)); near(c[0], 1000); near(c[1], 500);
// A blank paper position is not a real map position, even inside whole-sheet bounds.
const legend = llFromSheet(1000, 1600, geo.main.sheet_to_z18px);
const before = moves.length;
assert.equal(locate(...legend, 'Legend'), false);
assert.equal(locate(-33.8688, 151.2093, 'Outside area'), false);
for (const args of [[NaN, 153.42], [-27.98, Infinity], [null, 153.42], ['-27.98', 153.42],
  [inset[0]+360, inset[1]], [inset[0]-360, inset[1]], [90, 153.42], [-90, 153.42], [-27.98, 181]]) {
  assert.equal(locate(...args), false);
}
assert.equal(moves.length, before, 'Rejected coordinates never move the camera');assert.equal(selectionsCleared,before,'Successful locations clear previous reference cards; rejected ones do not');
assert(notices.some(s => /outside the 2026 plan/.test(s)));
// No ready geometry must fail cleanly without inventing a location.
ctx.GEO = null;
assert.equal(locate(...main), false);
assert.equal(moves.length, before);
async function hostTests() {
  if (!dashboardPath) return;
  const dashboard = fs.readFileSync(dashboardPath, 'utf8');
  const route = between(dashboard, 'W.gate1156Zoom = function (lat, lon, id) {', '\nfunction ring(M, svg, lat, lon, id)');
  function harness(api) {
    const hostMoves = [], flashes = [], timers = [], W = {};
    const frame = {contentWindow: {GC500Explorer: api}};
    const state = {tab: 'map'}, EXP = {frame};
    const hc = vm.createContext({W, state, EXP, Number, Promise, String,
      expOpen2d: () => { W.mapLocate1283Seq = (W.mapLocate1283Seq || 0) + 1; },
      expFrame: () => frame,
      flash: text => flashes.push(text),
      setTimeout: callback => timers.push(callback)});
    vm.runInContext(route, hc, {filename: dashboardPath});
    return {W, frame, state, EXP, hostMoves, flashes, timers};
  }
  const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return {promise, resolve}; };
  const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
  let ready = deferred(), called = 0;
  let h = harness({ready: ready.promise, gotoLatLon1283: () => {called++; return true;}});
  assert.equal(h.W.gate1156Zoom(...main, 'Main'), true);
  assert.equal(called, 0, 'Cold route must wait for the ready promise');
  assert.equal(h.flashes.length, 0, 'Do not claim success while loading');
  ready.resolve(); await tick(); assert.equal(called, 1); assert.match(h.flashes[0], /located/);
  ready = deferred(); called = 0;
  h = harness({ready: ready.promise, gotoLatLon1283: () => {called++; return true;}});
  h.W.gate1156Zoom(...main, 'Old'); h.W.mapLocate1283Seq++;
  ready.resolve(); await tick(); assert.equal(called, 0, 'New navigation cancels a pending coordinate request');
  ready = deferred(); called = 0;
  h = harness({ready: ready.promise, gotoLatLon1283: () => {called++; return true;}});
  h.W.gate1156Zoom(...main, 'Old'); h.state.tab = 'today';
  ready.resolve(); await tick(); assert.equal(called, 0, 'Leaving Map cancels a pending request');
  h = harness({ready: Promise.resolve(), gotoLatLon1283: () => false});
  h.W.gate1156Zoom(...main, 'Rejected'); await tick();
  assert.equal(h.flashes.length, 0, 'Rejected or off-sheet locations never claim success');
  h = harness(null);
  h.W.gate1156Zoom(...main, 'Late API'); assert.equal(h.timers.length, 1);
  for(let i=0;i<35;i++) {assert(h.timers.length,'Keep pending beyond six seconds');h.timers.shift()();}
  h.frame.contentWindow.GC500Explorer = {ready: Promise.resolve(), gotoLatLon1283: () => true};
  h.timers.shift()(); await tick(); assert.match(h.flashes[0], /located/);
  h=harness(null);h.W.gate1156Zoom(...main,'Timeout');for(let i=0;i<230&&h.timers.length;i++)h.timers.shift()();assert.match(h.flashes[0],/still loading/);assert.equal(h.timers.length,0);
}
hostTests().then(() => console.log('PASS: actual 2026 location helper: main, inset, off-sheet, invalid coordinates; host readiness and cancellation.'))
  .catch(error => { console.error(error); process.exitCode = 1; });
