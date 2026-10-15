/* Author: Andrew Fisher. Read-only browser checks for the 3D equipment map.
 * PAGE=<candidate.html> MAP_ROOT=<prepared machine> OUT=<private directory>
 * MOB=1 CHROMIUM_PATH=<chromium> node tests/test_browser1027.cjs
 * The shared harness intercepts the public view with local files and blocks
 * every operational write. Evidence contains view facts, never the full record.
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {open} = require('../../release_review1021/readonly1021.cjs');
const mobile = process.env.MOB === '1';
const out = process.env.OUT || '/tmp/private-gc500-3d1027/browser-' + (mobile ? 'phone' : 'desktop');
const gate = ['P60', 'P62', 'P63', 'WC49', 'GN06'];
const report = {author: 'Andrew Fisher', mobile, checks: [], measurements: {}};
const check = (name, pass, detail) => report.checks.push({name, pass: !!pass, ...(detail === undefined ? {} : {detail})});
const cameraSame = (a, b) => a.length === b.length && a.every((n, i) => Math.abs(n - b[i]) < (i < 3 ? .001 : .000001));
fs.mkdirSync(out, {recursive: true});
let harness;

async function camera(frame) {
  return frame.evaluate(() => {
    const c = viewer.camera, p = c.positionWC;
    return [p.x, p.y, p.z, c.heading, c.pitch, c.roll];
  });
}

async function settle(frame) {
  await frame.waitForFunction(() => !ADAPT.moving && !viewer.camera._currentFlight, null, {timeout: 20000});
  // Readiness can precede the last render of the camera flight by one frame.
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function readyModels(frame, refs) {
  await frame.waitForFunction(keys => {
    const rows = GC500EquipmentView1027.state.models;
    return keys.every(ref => rows.some(row => row.ref === ref && (row.ready || row.failed)));
  }, refs, {timeout: 60000});
  return frame.evaluate(keys => GC500EquipmentView1027.state.models.filter(row => keys.includes(row.ref)), refs);
}

async function saveScreenshots(page, frame, name) {
  // Give streamed tiles and the model's sampled ground height time to settle.
  // A slow external tile service cannot hold a read-only review indefinitely.
  await frame.evaluate(() => scheduleHeights());
  await frame.waitForTimeout(1800);
  await frame.waitForFunction(() => window.__allLoaded && !HQ.busy && !ADAPT.moving,
    null, {timeout: 15000}).catch(() => {});
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  report.measurements[name] = await frame.evaluate(() => ({tilesSettled: !!window.__allLoaded,
    heightSampling: !!HQ.busy, modelCount: GC500EquipmentView1027.state.models.length,
    sampledPins: PINS.filter(pin => pin._hd != null).length}));
  // The scene shot shows model detail; the host shot retains real mobile chrome/layout.
  await frame.locator('body').screenshot({path: path.join(out, name + '-scene.png')});
  await page.screenshot({path: path.join(out, name + '-page.png')});
}

async function selectedFacts(page, frame, ref) {
  const expected = await page.evaluate(key => {
    const a = assetOf(key), status = mapStatus1009Classify(a, deliveryOf(key), timeline841State(a), gc500IsComplete897(key));
    const q = mapQuantity1010(a, status.state), row = GC500Equipment1027.get(key);
    return {
      nativeStatus: status.state, nativeQuantity: q.items.reduce((n, item) => n + item.quantity, 0),
      ref: row.ref, quantity: row.quantity, complete: row.complete, status: row.status,
      quantityLabel: row.quantityLabel, completionLabel: row.completionLabel,
      items: row.items.map(item => ({description: item.description, kind: item.kind, quantity: item.quantity}))
    };
  }, ref);
  const actual = await frame.evaluate(() => {
    const card = document.querySelector('.equipment1027-card');
    return {
      ref: GC500EquipmentView1027.state.active, visible: !card.hidden,
      heading: card.querySelector('[data-ref]').textContent,
      status: card.querySelector('[data-status]').textContent,
      pending: card.querySelector('.equipment1027-status').classList.contains('pending')
    };
  });
  check(ref + ' quantity and explicit completion match the native record',
    expected.nativeQuantity === expected.quantity && expected.nativeStatus === expected.status &&
    expected.complete === (expected.nativeStatus === 'complete') && actual.ref === ref && actual.visible &&
    actual.heading === expected.quantityLabel && actual.status === expected.completionLabel && actual.pending !== expected.complete,
    {expected, actual});
  return expected;
}

(async () => {
  try {
    if (!process.env.PAGE || !process.env.MAP_ROOT) throw Error('Set PAGE and MAP_ROOT to the locally prepared candidate.');
    report.pageSha256 = crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
    report.machineSha256 = Object.fromEntries(['poc3d/equipment_viewer1027.js', 'poc3d/equipment_layout1027.js',
      'poc3d/equipment_geometry1027.js', 'explorer/explorer-merge.js'].map(file => [file,
      crypto.createHash('sha256').update(fs.readFileSync(path.join(process.env.MAP_ROOT, file))).digest('hex')]));
    harness = await open({pageFile: process.env.PAGE, hash: '#sheet/__explorer', gl: true,
      mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1050, dpr: mobile ? 2 : 1});
    const page = harness.page;
    await page.waitForFunction(() => SYNC.status === 'live' && window.GC500Equipment1027 &&
      EXP.frame?.contentWindow?.__ready, null, {timeout: 120000});
    const explorer = page.frames().find(frame => /\/explorer\/index\.html(?:\?|$)/.test(frame.url()));
    if (!explorer) throw Error('Embedded explorer not found.');
    await explorer.evaluate(() => GC500Explorer.mode3d(true));
    await page.waitForFunction(() => {
      const frame = EXP.frame?.contentWindow?.document.querySelector('iframe');
      return !!frame?.contentWindow?.GC500EquipmentView1027;
    }, null, {timeout: 120000});
    const scene = page.frames().find(frame => /\/poc3d\/index\.html(?:\?|$)/.test(frame.url()));
    if (!scene) throw Error('Embedded 3D scene not found.');
    await scene.waitForFunction(() => window.__ready && window.GC500EquipmentView1027, null, {timeout: 120000});
    await page.locator('iframe').first().scrollIntoViewIfNeeded();
    await scene.locator('[data-gate]').click();
    await settle(scene);
    await scene.evaluate(() => GC500EquipmentView1027.refresh());
    const gateModels = await readyModels(scene, gate);
    check('Gate 6 renders all five recorded equipment groups', gateModels.length === gate.length &&
      gateModels.every(row => row.ready && !row.failed), gateModels.map(({ref, quantity, kind, ready, failed, error}) => ({ref, quantity, kind, ready, failed, error})));
    await saveScreenshots(page, scene, 'gate6-overview');

    await explorer.evaluate(() => GC500Explorer.find('WC49'));
    await scene.waitForFunction(() => GC500EquipmentView1027.state.active === 'WC49', null, {timeout: 15000});
    await settle(scene);
    const wc49 = await selectedFacts(page, scene, 'WC49');
    const wc49Models = await readyModels(scene, ['WC49']);
    check('WC49 has exactly its three recorded toilets in the model', wc49.quantity === 3 &&
      wc49Models.length === 1 && wc49Models[0].ready && !wc49Models[0].failed && wc49Models[0].quantity === wc49.quantity,
      wc49Models.map(({ref, quantity, kind, ready, failed}) => ({ref, quantity, kind, ready, failed})));
    await saveScreenshots(page, scene, 'wc49-selected');

    const card = scene.locator('.equipment1027-card');
    await card.locator('summary').click();
    const before = await scene.evaluate(() => {
      stopMotion813();
      const card = document.querySelector('.equipment1027-card'), summary = card.querySelector('summary');
      summary.focus({preventScroll: true});
      card.scrollTop = Math.min(63, card.scrollHeight - card.clientHeight);
      return {scrollTop: card.scrollTop, maxScroll: card.scrollHeight - card.clientHeight,
        open: card.querySelector('details').open, focused: document.activeElement === summary};
    });
    const beforeCamera = await camera(scene);
    // Normal polling and same-position pin replacement must not collapse details,
    // reset scrolling, move the camera or discard the selected reference.
    await scene.evaluate(() => {
      GC500EquipmentView1027.refresh();
      GC500_3D.setPins(PINS.map(pin => ({...pin, ll: pin.ll.slice()})));
      GC500EquipmentView1027.refresh();
    });
    await page.waitForTimeout(2300);
    const after = await scene.evaluate(() => {
      const card = document.querySelector('.equipment1027-card');
      return {active: GC500EquipmentView1027.state.active, visible: !card.hidden, scrollTop: card.scrollTop,
        open: card.querySelector('details').open, focused: document.activeElement === card.querySelector('summary')};
    });
    check('Refresh and identical pins preserve More info, selection and focus', before.open && after.open &&
      after.active === 'WC49' && after.visible && before.focused && after.focused, {before, after});
    check('Refresh and identical pins preserve the card scroll position', Math.abs(before.scrollTop - after.scrollTop) < 1,
      {before: before.scrollTop, after: after.scrollTop, maxScroll: before.maxScroll});
    check('Refresh and identical pins preserve the exact camera', cameraSame(beforeCamera, await camera(scene)));
    report.measurements.moreInfo = {maxScroll: before.maxScroll, testedScrollTop: before.scrollTop};

    await card.locator('.equipment1027-close').click();
    await scene.evaluate(() => {
      GC500EquipmentView1027.refresh();
      GC500_3D.setPins(PINS.map(pin => ({...pin, ll: pin.ll.slice()})));
    });
    await page.waitForTimeout(2300);
    const closed = await scene.evaluate(() => ({active: GC500EquipmentView1027.state.active,
      hidden: document.querySelector('.equipment1027-card').hidden, selected: ringPin?.k || null,
      parentCardSuppressed: parent.document.body.classList.contains('equipment-card1027')}));
    check('A closed card stays closed across polling and pin refresh', closed.active === null && closed.hidden &&
      closed.selected === null && !closed.parentCardSuppressed, closed);

    const toggle = scene.locator('[data-models]');
    await toggle.click();
    const disabled = await scene.evaluate(() => ({enabled: GC500EquipmentView1027.state.enabled,
      pressed: document.querySelector('[data-models]').getAttribute('aria-pressed'),
      visible: GC500EquipmentView1027.state.models.filter(row => GC500EquipmentView1027.samplingVisible(row.ref)).length}));
    check('Equipment toggle hides the models and reports its state', !disabled.enabled && disabled.pressed === 'false' && disabled.visible === 0, disabled);
    await toggle.click();
    const enabled = await scene.evaluate(() => ({enabled: GC500EquipmentView1027.state.enabled,
      pressed: document.querySelector('[data-models]').getAttribute('aria-pressed'),
      visible: GC500EquipmentView1027.state.models.filter(row => GC500EquipmentView1027.samplingVisible(row.ref)).length}));
    check('Equipment toggle restores the models', enabled.enabled && enabled.pressed === 'true' && enabled.visible > 0, enabled);

    await explorer.evaluate(() => GC500Explorer.find('WC51'));
    await scene.waitForFunction(() => GC500EquipmentView1027.state.active === 'WC51', null, {timeout: 15000});
    await settle(scene);
    const wc51 = await selectedFacts(page, scene, 'WC51');
    const wc51Models = await readyModels(scene, ['WC51']);
    const mixed = wc51Models[0];
    const kinds = {};
    for (const part of mixed?.stats?.parts || []) kinds[part.kind] = (kinds[part.kind] || 0) + part.quantity;
    check('WC51 keeps six FWF and one accessible toilet as distinct equipment', wc51.quantity === 7 && mixed?.ready &&
      !mixed.failed && mixed.quantity === wc51.quantity && kinds.toilet === 6 && kinds.accessible_toilet === 1,
      {items: wc51.items, modelQuantity: mixed?.quantity, kinds});
    await saveScreenshots(page, scene, 'wc51-mixed-equipment');

    for (const closeAction of [{name: 'Close', selector: '#drawer #dclose'},
      {name: 'Back', selector: '#drawer [data-nav934-back]'}]) {
      const drawerCamera = await camera(scene);
      await card.locator('[data-action="details"]').click();
      await page.locator('#drawer.on').waitFor({state: 'visible', timeout: 15000});
      const title = await page.locator('#drawerTitle').innerText();
      check('Details opens the native WC51 drawer (' + closeAction.name + ')', /WC51/.test(title), {title});
      await page.locator(closeAction.selector).click();
      await page.waitForFunction(() => !document.querySelector('#drawer').classList.contains('on'), null, {timeout: 15000});
      const restored = await scene.evaluate(() => ({active: GC500EquipmentView1027.state.active,
        hidden: document.querySelector('.equipment1027-card').hidden}));
      check('Native drawer ' + closeAction.name + ' retains the selected 3D equipment and camera',
        restored.active === 'WC51' && !restored.hidden && cameraSame(drawerCamera, await camera(scene)), restored);
    }

    // Move away from the automatic selection framing before leaving 3D. A
    // reentry which flies to the pin would otherwise look like camera retention.
    await scene.evaluate(() => {stopMotion813(); viewer.camera.zoomIn(8); viewer.scene.requestRender();});
    await settle(scene);
    const reentryCamera = await camera(scene);
    await explorer.evaluate(() => GC500Explorer.mode3d(false));
    await explorer.waitForFunction(() => !document.body.classList.contains('in3d'));
    await explorer.evaluate(() => GC500Explorer.mode3d(true));
    await settle(scene);
    const reentry = await scene.evaluate(() => ({active: GC500EquipmentView1027.state.active,
      hidden: document.querySelector('.equipment1027-card').hidden}));
    check('2D to 3D reentry retains selected equipment and adjusted camera', reentry.active === 'WC51' &&
      !reentry.hidden && cameraSame(reentryCamera, await camera(scene)), reentry);

    const layout = await scene.evaluate(() => {
      const card = document.querySelector('.equipment1027-card'), r = card.getBoundingClientRect();
      const controls = [...document.querySelectorAll('.equipment1027-tools button,.equipment1027-card button')]
        .filter(button => !button.hidden).map(button => {const b = button.getBoundingClientRect();return {label: button.textContent.trim(), height: b.height};});
      return {width: innerWidth, height: innerHeight, card: {left: r.left, right: r.right, top: r.top, bottom: r.bottom},
        overflow: document.documentElement.scrollWidth - innerWidth, controls};
    });
    check('Selected equipment card stays within the 3D viewport', layout.card.left >= -1 && layout.card.right <= layout.width + 1 &&
      layout.card.top >= -1 && layout.card.bottom <= layout.height + 1 && layout.overflow <= 1, layout);
    check('Equipment buttons keep a 44 px touch target', layout.controls.every(button => button.height >= 44), layout.controls);
    report.measurements.layout = layout;
    report.measurements.scene = await scene.evaluate(() => ({models: GC500EquipmentView1027.state.models.length,
      records: GC500EquipmentView1027.state.records, failed: GC500EquipmentView1027.state.models.filter(row => row.failed).map(row => ({ref: row.ref, error: row.error}))}));
    check('No equipment GLB load fails', report.measurements.scene.failed.length === 0, report.measurements.scene.failed);
    check('No operational write attempts', harness.counts.blocked === 0, harness.counts);
    check('No browser JavaScript errors', harness.errors.length === 0, harness.errors);
  } catch (error) {
    report.failure = String(error.stack || error);
    process.exitCode = 1;
  } finally {
    if (report.checks.some(row => !row.pass)) process.exitCode = 1;
    if (harness) {
      report.counts = harness.counts;
      report.errors = harness.errors;
      await harness.browser.close();
    }
    fs.writeFileSync(path.join(out, 'browser1027.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({mobile, pageSha256: report.pageSha256, checks: report.checks.length,
      failed: report.checks.filter(row => !row.pass), errors: report.errors, failure: report.failure, out}));
  }
})();
