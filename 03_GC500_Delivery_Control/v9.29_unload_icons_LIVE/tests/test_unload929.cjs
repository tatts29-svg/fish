// Author: Andrew Fisher. v9.29 unload-order icons: pure checks on the built page's own code (no browser, no network).
//   node tests/test_unload929.cjs build/GC500_v9.29/GC500_Delivery_Control_hosted.html
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const html = fs.readFileSync(process.argv[2], 'utf8');
const block = id => { const m = html.match(new RegExp('<script id="' + id + '">([\\s\\S]*?)</script>')); assert(m, 'script ' + id + ' missing'); return m[1]; };
const shapes = (() => { const i = html.indexOf('/* Author: Andrew Fisher. Current physical units beside sourced master-plan shapes.'); assert(i > 0, 'v9.26 Shapes926 missing'); const j = html.indexOf('</script>', i); return html.slice(i, j); })();
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b)); // arrays made inside the page's own context
let pass = 0; const t = (name, fn) => { fn(); pass++; console.log('ok', pass, name); };

function load(env) {
  const ctx = Object.assign({console, window: {}}, env); vm.createContext(ctx);
  vm.runInContext(shapes, ctx);
  if (!('Shapes926' in env)) ctx.Shapes926 = ctx.window.Shapes926;
  vm.runInContext(block('unload929-script') + '\nthis.U=Unload929;', ctx);
  return ctx;
}
const realKind = load({}).window.Shapes926;
assert(realKind && realKind.kind, 'could not load Shapes926.kind');

t('patched once, footer advanced, hook in the row and once per list', () => {
  assert.strictEqual((html.match(/id="unload929-script"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="unload929-style"/g) || []).length, 1);
  assert(html.includes(" · v9.29'; /* v8.19") && !html.includes(" · v9.28'; /* v8.19"));
  assert.strictEqual((html.match(/Unload929\.forDay\(model\.day\)/g) || []).length, 1);
  assert.strictEqual((html.match(/\(icons929 \? icons929\(load\) : ''\)/g) || []).length, 1);
  assert(html.indexOf('id="unload929-script"') < html.indexOf('<script id="drops911-script">'));
});
const UK = load({dpItems: r => r.items}).U;

t('kinds from the schedule words', () => {
  const k = w => UK.kindOf(w, null);
  assert.strictEqual(k('FWF'), 'toilet'); assert.strictEqual(k('Toilet Block 6m'), 'toilet_block'); assert.strictEqual(k('16Pan Block'), 'toilet_block');
  assert.strictEqual(k('Waste tank'), 'waste_tank'); assert.strictEqual(k('Accessible Toilet'), 'accessible_toilet'); assert.strictEqual(k('Pee Panel'), 'pee_panel');
  assert.strictEqual(k('FWF Trailer'), 'fwf_trailer'); assert.strictEqual(k('60kva'), 'generator'); assert.strictEqual(k('200kva & cables'), 'generator');
  assert.strictEqual(k('Light Tower'), 'light_tower'); assert.strictEqual(k('VMS'), 'vms_board'); assert.strictEqual(k('3.5T Forklift Std'), 'forklift');
  assert.strictEqual(k('Trakmat'), 'trakmat'); assert.strictEqual(k('3.0m Cont'), 'container'); assert.strictEqual(k('6.0m Refrigerator Cont'), 'container');
  assert.strictEqual(k('Building 6m'), 'building'); assert.strictEqual(k('Ticket Box 4.8m'), 'building'); assert.strictEqual(k('TL2'), 'water_barrier');
  assert.strictEqual(k('Fridge Lge'), 'fridge'); assert.strictEqual(k('Pad Chair'), 'chair'); assert.strictEqual(k('Urn'), 'equipment');
  assert.strictEqual(k('Distribution Board Lifeguard 17'), 'distribution_board');
});
t('no item: the discipline decides; a named item never takes the discipline', () => {
  assert.strictEqual(UK.kindOf('', {discipline: 'Generators'}), 'generator');
  assert.strictEqual(UK.kindOf('', {discipline: 'Water-filled barriers'}), 'water_barrier');
  assert.strictEqual(UK.kindOf('', {discipline: 'Something new'}), 'equipment');
  assert.strictEqual(UK.kindOf('Aircon', {discipline: 'Portable buildings'}), 'equipment');
});
const row = (key, items, extra) => ({a: Object.assign({key, name: 'Toilets', discipline: 'Toilets & amenities'}, extra || {}), items});
t('a waste tank comes off before the block at the same stop; other items keep the schedule order', () => {
  const s = UK.stops({rows: [row('WC05', [{item: 'Toilet Block 6m', qty: ''}, {item: 'Waste tank', qty: '1'}])]});
  same(s[0].items.map(i => i.kind), ['waste_tank', 'toilet_block']);
  const s2 = UK.stops({rows: [row('WC31', [{item: 'Accessible Toilet', qty: '1'}, {item: '16Pan Block', qty: '2'}])]});
  same(s2[0].items.map(i => i.kind + i.qty), ['accessible_toilet1', 'toilet_block2']);
});
t('stops follow the load order; a tank at a later stop stays at that stop', () => {
  const s = UK.stops({rows: [row('GN01', [{item: '60kva', qty: '1'}], {discipline: 'Generators'}), row('WC20', [{item: 'Toilet Block 6m', qty: '1'}, {item: 'Waste tank', qty: '1'}])]});
  same(s.map(x => x.ref), ['GN01', 'WC20']);
  same(s[1].items.map(i => i.kind), ['waste_tank', 'toilet_block']);
});
t('same kind at one stop adds up; an unreadable count is never guessed', () => {
  const s = UK.stops({rows: [row('WC09', [{item: 'FWF', qty: '4'}, {item: 'FWF (blue)', qty: '2'}])]});
  assert.strictEqual(s[0].items.length, 1); assert.strictEqual(s[0].items[0].qty, 6); same(s[0].items[0].words, ['FWF', 'FWF (blue)']);
  const s2 = UK.stops({rows: [row('WC09', [{item: 'FWF', qty: '4'}, {item: 'FWF', qty: 'two'}])]});
  assert.strictEqual(s2[0].items[0].qty, null);
  const s3 = UK.stops({rows: [row('WC05', [{item: 'Toilet Block 6m', qty: ''}])]});
  assert.strictEqual(s3[0].items[0].qty, null);
});
t('a reference split over two rows of one load is one stop', () => {
  const s = UK.stops({rows: [row('WC09', [{item: 'FWF', qty: '4'}]), row('WC09', [{item: 'Pee Panel', qty: '6'}])]});
  assert.strictEqual(s.length, 1); same(s[0].items.map(i => i.kind + i.qty), ['toilet4', 'pee_panel6']);
});
t('html: counts over one shown, one hidden; tank says so; stops separated; label in words', () => {
  const h = UK.stripHtml(UK.stops({rows: [row('WC05', [{item: 'Toilet Block 6m', qty: '1'}, {item: 'Waste tank', qty: '1'}]), row('WC11', [{item: 'FWF', qty: '4'}])]}));
  assert(/aria-label="Unload order: 1 × Waste tank, 1 × Toilet Block 6m, then 4 × FWF"/.test(h), h);
  assert.strictEqual((h.match(/class="unload929-then"/g) || []).length, 1);
  assert(h.includes('<em>tank</em>')); assert(h.includes('<b>×4</b>')); assert(!h.includes('×1</b>'));
  assert(h.indexOf('data-unload929-kind="waste_tank"') < h.indexOf('data-unload929-kind="toilet_block"'));
});
t('text is escaped', () => {
  const h = UK.stripHtml(UK.stops({rows: [row('W<C>"1', [{item: '<img src=x onerror=alert(1)>', qty: '2'}])]}));
  assert(!h.includes('<img') && h.includes('&lt;img'));
  assert(!/data-unload929-ref="W<C>/.test(h));
});
t('nothing on the load or a failure leaves the row as it was', () => {
  assert.strictEqual(UK.stripHtml([]), '');
  const bad = load({programmeDays: () => { throw new Error('x'); }, dpItems: r => r.items}).U;
  assert.strictEqual(bad.forDay('2026-10-09')({id: 'a'}), '');
  const none = load({programmeDays: () => [], dpItems: r => r.items}).U;
  assert.strictEqual(none.forDay('2026-10-09')({id: 'a'}), '');
  const thr = load({programmeDays: () => [{iso: 'd'}], dpLoads: () => [{kind: 'deliveries', rows: [{a: {key: 'X'}}]}], ldId: () => 'L1', dpItems: () => { throw new Error('y'); }}).U;
  assert(thr.forDay('d')({id: 'L1'}).includes('data-unload929-ref="X"'));
  assert.strictEqual(thr.forDay('d')({id: 'other'}), '');
});
t('removals are never drawn; only the day\'s deliveries', () => {
  const U2 = load({programmeDays: () => [{iso: 'd'}], ldId: (d, g) => g.id, dpItems: r => r.items,
    dpLoads: () => [{id: 'R', kind: 'removals', rows: [row('WC01', [{item: 'FWF', qty: '1'}])]}, {id: 'D', kind: 'deliveries', rows: [row('WC02', [{item: 'FWF', qty: '3'}])]}]}).U;
  const f = U2.forDay('d'); assert.strictEqual(f({id: 'R'}), ''); assert(f({id: 'D'}).includes('×3'));
});
t('every kind has an icon; long items are wide', () => {
  UK.kinds.forEach(k => { const s = UK.icon(k); assert(/^<svg viewBox="0 0 (24|36) 24"/.test(s), k); assert(s.includes('aria-hidden="true"')); });
  ['toilet_block', 'waste_tank', 'building', 'container', 'water_barrier', 'fwf_trailer'].forEach(k => assert(UK.icon(k).includes('0 0 36 24'), k));
});
t('reads only: the module calls no setter and no network', () => {
  const src = block('unload929-script');
  ['loading872Set', 'bump(', 'SYNC.db', 'fetch(', 'XMLHttpRequest', 'localStorage', 'flow891Move', '.doc('].forEach(w => assert(!src.includes(w), w));
});
console.log(`PASS ${pass} checks`);
