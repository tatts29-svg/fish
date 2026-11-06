// Author: Andrew Fisher. Changed road/travel/render paths only; synthetic CPU fixtures.
// node followup_8c821da_roads.cjs /path/to/frozen/8c821da/demob816_src.js
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
assert(process.argv[2], 'Usage: node followup_8c821da_roads.cjs <frozen 8c821da demob816_src.js>');
const source = fs.readFileSync(process.argv[2], 'utf8');
const sha256 = crypto.createHash('sha256').update(source).digest('hex');
assert.equal(sha256, 'bafd51d93afd3716c4e277eec4a93d56f358d94820f17e485e2a64dd0745d143');
const saved = new Map(), calls = {redraw: 0, capability: 0};
const ctx = {
  DATA: {brand: {}, transport: {kingston_run: {basis: 'fixture planning basis'}}},
  S: {locations: {}, delivery: {WC1: {emptied: true, emptied_by: 'Fixture', emptied_at: '2026-10-26T00:00:00Z'}}},
  localStorage: {getItem: k => saved.get(k) || null, setItem: (k, v) => saved.set(k, String(v)), removeItem: k => saved.delete(k)},
  run782: () => 70, esc: x => String(x).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'),
  fmtDate: String, fmtStamp: () => '26 Oct 10:00', fmtDay: () => ({dow: 'Mon', dm: '26 Oct'}), refPlate: String,
  deliveryOf: () => ({state: 'not on site', history: []}),
  RENDER_MEMO: new Map(), applyCapability: () => calls.capability++, flash: () => {}
};
vm.createContext(ctx); vm.runInContext(source, ctx);
const evaluate = code => vm.runInContext(code, ctx);
ctx.redrawFixture = () => calls.redraw++;
evaluate('renderDemob816 = redrawFixture');
const checkNames = [];
const check = (name, condition) => { assert(condition, name); checkNames.push(name); };
const r = {key: 'WC1', a: {key: 'WC1', locations: ['Fixture location']}, zone: 'none', side: 'outside', empty: true, emptied: true};
const stop = {r, area: 'none', parts: [{type: 'portable toilet', n: 1, tank: false}]};
const base = {kind: 'single', run: 'branch', group: 'KINP', truck: 1, n: 1, of: 1, stops: [stop], t: {dep: 350, arrive: 420, leave: 540, back: 610, travel: 70, st: [{s: stop, at: 420, end: 450}]}, ovId: '2026-10-26|WC1', ov: false};
ctx.load = base;
let html = evaluate("sheet816('2026-10-26', load)");
check('ordinary run sheet renders without the removed A.run dereference', html.includes('Demob run sheet') && html.includes('travel 70 min each way'));
ctx.load = {...base, kind: 'toilets', run: 'coates', toilet: {units: 1, cap: 12, rows: [{r}]}};
html = evaluate("sheet816('2026-10-26', load)");
check('Coates toilet run sheet renders with per-run travel', html.includes('travel 70 min each way') && html.includes('each event portable 5 min'));
ctx.load = {...base, ov: true, ovc: {latest: 890, flags: ['stagger departures - fixture convoy warning']}};
html = evaluate('trucksHtml816({}, [load])');
check('oversize checkbox and warning render for a flagged single load', html.includes('data-ov816=') && html.includes(' checked') && html.includes('Oversize: check permit') && html.includes('fixture convoy warning'));
html = evaluate("sheet816('2026-10-26', load)");
check('oversize permit and computed warning survive into the sheet', html.includes("Oversize (the branch's flag)") && html.includes('fixture convoy warning') && html.includes('14:50'));
ctx.load = base;
html = evaluate('trucksHtml816({}, [load])');
check('unflagged branch load offers a checkbox without an oversize declaration', html.includes('data-ov816=') && !html.includes('Oversize: check permit / travel window'));
check('travel editor is now rendered in Trucks and times', html.includes('data-trv816="branch"') && html.includes('value="70"') && html.includes('planning figure, not a live time'));
const travelInput = {dataset: {trv816: 'branch'}, value: '120'};
const oversizeInput = {dataset: {ov816: base.ovId}, checked: true};
const pane = {
  querySelectorAll: selector => selector === 'input[data-trv816]' ? [travelInput] : selector === 'input[data-ov816]' ? [oversizeInput] : [],
  querySelector: () => null
};
ctx.fixturePane = pane; evaluate('wireDemob816(fixturePane)');
check('actual travel and oversize change handlers are attached', typeof travelInput.onchange === 'function' && typeof oversizeInput.onchange === 'function');
travelInput.onchange();
check('travel handler saves the entered run value and redraws', evaluate("travel816('branch').v") === 120 && calls.redraw === 1 && calls.capability === 1);
check('editing branch travel leaves Coates run independent', evaluate("travel816('coates').v") === 70);
oversizeInput.onchange();
check('oversize handler persists the checked flag and redraws', evaluate("ovFlag816('2026-10-26|WC1')") === true && calls.redraw === 2);
oversizeInput.checked = false; oversizeInput.onchange();
check('oversize handler can clear the flag', evaluate("ovFlag816('2026-10-26|WC1')") === false);
travelInput.value = ''; travelInput.onchange();
check('blank travel entry remains explicitly unconfirmed', evaluate("travel816('branch').v") === null && evaluate('travelHtml816([load])').includes('travel time to confirm'));
ctx.load = {...base, t: {...base.t, dep: null, back: null, travel: null}};
html = evaluate("sheet816('2026-10-26', load)");
check('blank Coates/branch travel prints unconfirmed without invented midnight', html.includes('travel time to confirm') && !html.includes('00:00'));
ctx.load = {...base, kind: 'supplier', run: undefined, group: 'Sub-hire pick-up', co: 'Fixture supplier', ov: false, toilet: {units: 1, rows: [{r}]}, t: {dep: null, arrive: null, leave: null, back: null, travel: null, st: [{s: stop, at: null, end: null}]}};
html = evaluate('trucksHtml816({}, [load])');
check('supplier screen omits Kingston truck movements and midnight times', !html.includes('Leave Kingston') && !html.includes('00:00') && html.includes('No departure or travel time is planned here'));
html = evaluate("sheet816('2026-10-26', load)");
check('supplier sheet renders a pick-up list without fabricated movement times', html.includes('Demob pick-up list') && !html.includes('Leave Kingston') && !html.includes('00:00') && !html.includes('<th>Time</th>'));
check('supplier sheet keeps the recorded emptying attribution', html.includes('emptied · Fixture') && html.includes('26 Oct 10:00'));
console.log(JSON.stringify({author: 'Andrew Fisher', source: '8c821da439027bd09b01d4dbc2e84b53c966c397', demob_sha256: sha256, scope: 'Changed sheet/UI renderer and event-handler CPU paths. Synthetic records and minimal selector stubs; no browser, live record, network, capacity/stream tests or legal validation.', passes: checkNames.length, checks: checkNames, remaining: ['Legacy gc500.demob816.assume.run migration remains absent in the unchanged travel816 implementation.', 'Owner excerpts are not the original guide; the legal scope of the displayed 09:00–16:00-only statement is not established.']}, null, 2));
