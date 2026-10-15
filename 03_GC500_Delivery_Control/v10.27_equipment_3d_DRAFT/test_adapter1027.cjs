/* Author: Andrew Fisher. Real shared-record reads; the standard rig aborts writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {open} = require('../toolchain/harness/open_page.js');

(async () => {
  assert(process.env.PAGE, 'Set PAGE to the candidate or exact live base HTML');
  const rig = await open({pageFile: process.env.PAGE, hash: '#today'});
  try {
    await rig.page.waitForFunction(() => typeof todayWorkHealth840 === 'function' && todayWorkHealth840().ready &&
      ['subhire', 'loads'].every(k => SYNC.first.has(k)), null, {timeout: 90000});
    if (!(await rig.page.evaluate(() => !!window.GC500Equipment1027)))
      await rig.page.addScriptTag({content: fs.readFileSync(path.join(__dirname, 'adapter1027.js'), 'utf8')});
    const result = await rig.page.evaluate(() => {
      const api = window.GC500Equipment1027, before = JSON.stringify(S), shapesBefore = JSON.stringify(MASTER_SHAPES926_DATA);
      const start = performance.now(), snapshot = api.snapshot(), duration = performance.now() - start;
      const canonical = window.gc500MapStatus1009(snapshot.pilot);
      const expected = canonical.states.map(s => ({ref: s.key, status: s.state, quantity: s.quantity.items.reduce((n, r) => n + r.quantity, 0)}));
      const projected = api.snapshot((x, y) => [-28 + y / 100000, 153 + x / 100000]);
      const invalid = api.snapshot(() => [Infinity, NaN]);
      snapshot.items[0].components[0].sheetPolygon[0][0] = 999;
      const clean = api.snapshot();
      return {
        available: snapshot.available, expected, duration,
        actual: clean.items.map(s => ({ref: s.ref, status: s.status, quantity: s.quantity})),
        mainCounts: clean.items.map(s => ({ref: s.ref, kind: s.items[0].kind, count: s.quantity})),
        projected: projected.items.every(i => i.components.every(c => c.polygon.length >= 3 && c.polygon.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lon)))),
        invalid: invalid.items.every(i => i.components.every(c => c.polygon.length === 0)),
        detached: clean.items[0].components[0].sheetPolygon[0][0] !== 999,
        noHeightsGuessed: clean.items.every(i => i.items.every(x => x.dimensions?.heightMm == null || x.dimensions.verified)),
        unchanged: before === JSON.stringify(S) && shapesBefore === JSON.stringify(MASTER_SHAPES926_DATA),
        invalidOpen: api.open('NOT-A-REFERENCE', 'details'), invalidAction: api.open('WC49', 'write'),
        knownOnly: api.get('NOT-A-REFERENCE') === null,
        expanded: api.get('P33')?.ref === 'P33' && api.catalogue().length > 5,
        supplier: clean.items.find(i => i.ref === 'WC49').supplier
      };
    });
    assert(result.available);
    assert.deepEqual(result.actual.sort((a, b) => a.ref.localeCompare(b.ref)), result.expected.sort((a, b) => a.ref.localeCompare(b.ref)));
    for (const field of ['projected', 'invalid', 'detached', 'noHeightsGuessed', 'unchanged', 'knownOnly', 'expanded']) assert(result[field], field);
    assert.equal(result.invalidOpen, false); assert.equal(result.invalidAction, false);
    assert.equal(result.supplier, 'Event Portables');
    assert.equal(await rig.page.evaluate(() => GC500Equipment1027.open('WC49', 'photos')), true);
    await rig.page.waitForSelector('#drawer.on .fwf1010-gallery[open]', {timeout: 10000});
    assert.equal(await rig.page.evaluate(() => state.sel), 'WC49');
    assert.deepEqual(rig.errors, []); assert.equal(rig.counts.blocked, 0);
    console.log(JSON.stringify({pass: true, snapshotMs: result.duration, counts: result.mainCounts, errors: rig.errors, blockedWrites: rig.counts.blocked}));
  } finally { await rig.browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
