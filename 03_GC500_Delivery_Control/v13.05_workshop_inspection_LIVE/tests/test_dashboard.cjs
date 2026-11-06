// Author: Andrew Fisher. Exact-candidate dashboard/iframe acceptance; GET-only live reads.
// CANDIDATE_DIR=<frozen build1305 output> PAGE=<exact v13.01 page> OUT=<fresh private dir>
// [MOB=1] [CHROMIUM_PATH=/usr/bin/chromium] node tests/test_dashboard.cjs
// Run serially with other browser suites under flock /tmp/gc500-browser.lock.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, devices} = require('playwright');
const TOOLCHAIN = process.env.GC500_TOOLCHAIN || path.resolve(__dirname, '../../toolchain');
const {curlFetch} = require(path.join(TOOLCHAIN, 'harness/curlfetch'));
const {prepareMachine, machineAsset, deepLinkHashMatches} = require(path.join(TOOLCHAIN, 'harness/release_sweep.cjs'));
const HOST = 'https://gc500-production.up.railway.app';
const PUBLIC = 'Coates-GC500-2026';
const VIEW = '/v/' + PUBLIC + '/';
const MACHINE = '/w/' + PUBLIC + '/';
const BASE = 'f139782e513a360ab87e05b7899defb02348355a4e7e09e7ae06fdfcedba9aad';
const PAGE_SHA = '2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b';
const SCOPE_PATH = path.resolve(__dirname, '../release/scope1305.json');
const SCOPE_BYTES = fs.readFileSync(SCOPE_PATH);
const SCOPE = JSON.parse(SCOPE_BYTES);
const REQUIRED = [...SCOPE.replacements, ...SCOPE.additions];
const TABS = ['today', 'progress', 'map', 'docs', 'register', 'plant', 'demob', 'fencing',
  'prestarts', 'coatesway', 'journal', 'breakdowns', 'variances', 'costs', 'edit', 'change',
  'add', 'pricing', 'timeline', 'subhired', 'nights', 'vmsoff', 'fenceclose', 'servicing', 'vms', 'questions', 'about'];
const ALIASES = {progress: 'today', register: 'plant', journal: 'today', breakdowns: 'today',
  variances: 'today', edit: 'today', change: 'today', add: 'today', pricing: 'costs',
  nights: 'today', vmsoff: 'today', fenceclose: 'today'};
const LINKS = ['#timeline', '#day/2026-09-28', '#change/2026-09-28',
  '#print/drivers/2026-09-28', '#sheet/__satellite3d', '#plant', '#today'];
const sha = body => crypto.createHash('sha256').update(body).digest('hex');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
    : JSON.stringify(value);
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));

async function publicGet(route) {
  const response = await curlFetch(HOST + route, {'x-gc500-token': PUBLIC, 'cache-control': 'no-cache'}, 'GET');
  assert.equal(response.status, 200, 'Public read failed: ' + route.split('?')[0]);
  return response;
}

async function liveBase() {
  const response = await publicGet(VIEW);
  assert.equal(sha(response.body), PAGE_SHA, 'Live dashboard changed; reconcile before accepting candidate');
  const status = JSON.parse((await publicGet('/api/machine')).body);
  assert.equal(status.sha256, BASE, 'Live machine changed; rebuild candidate');
  assert.equal(status.files, 246, 'Live machine count changed');
  return response.headers;
}

function freezeInputs(candidate, pageFile) {
  assert.equal(SCOPE.confirmed, true, 'Final release whitelist is not confirmed');
  assert.equal(sha(fs.readFileSync(SCOPE_PATH)), sha(SCOPE_BYTES), 'Release scope changed during acceptance');
  const machineEnv = {MACHINE_MANIFEST: path.join(candidate, 'candidate-manifest.json'), MACHINE_ROOT: path.join(candidate, 'machine')};
  const machine = prepareMachine(machineEnv);
  const manifest = readJSON(machineEnv.MACHINE_MANIFEST);
  const retained = readJSON(path.join(candidate, 'retained-manifest.json'));
  const evidence = readJSON(path.join(candidate, 'source-evidence.json'));
  assert.equal(retained.sha256, BASE, 'Retained manifest must identify pinned live machine');
  assert.equal(sha(Buffer.from(canonical({schema: retained.schema, entry: retained.entry, files: retained.files}))), BASE);
  assert.equal(manifest.version, 'v13.05-workshop-inspection');
  assert.equal(manifest.files.length, 249);
  assert.equal(evidence.baseManifest, BASE);
  assert.equal(evidence.dashboardBaseSha256, PAGE_SHA);
  assert.equal(evidence.releaseScopeSha256, sha(SCOPE_BYTES), 'Candidate belongs to a different release scope');
  const names = Object.keys(evidence.files).sort();
  assert.ok(REQUIRED.every(name => names.includes(name)), 'Every workshop module must be bound');
  assert.deepEqual(names, [...REQUIRED].sort(), 'Only the exact reviewed workshop inspection paths may change');
  const old = Object.fromEntries(retained.files.map(file => [file.path, file]));
  const fresh = Object.fromEntries(manifest.files.map(file => [file.path, file]));
  const machineFiles = {};
  for (const name of names) {
    const detail = evidence.files[name];
    assert.equal(detail.base, old[name]?.sha256 || null, 'Evidence names wrong original: ' + name);
    assert.equal(detail.sha256, fresh[name]?.sha256, 'Evidence names wrong candidate: ' + name);
    assert.equal(detail.bytes, fresh[name]?.bytes, 'Evidence names wrong byte count: ' + name);
    machineFiles[name] = detail.sha256;
  }
  for (const [name, detail] of Object.entries(old)) if (!names.includes(name)) assert.deepEqual(fresh[name], detail, 'Retained file changed: ' + name);
  assert.deepEqual(Object.keys(fresh).sort(), [...new Set([...Object.keys(old), ...names])].sort());
  const page = fs.readFileSync(pageFile);
  assert.equal(sha(page), PAGE_SHA, 'Local dashboard must be byte-exact v13.01');
  return {machine, machineEnv, machineFiles, manifest, page,
    evidenceSha: sha(fs.readFileSync(path.join(candidate, 'source-evidence.json'))),
    retainedSha: sha(fs.readFileSync(path.join(candidate, 'retained-manifest.json')))};
}

async function snapshot(page) {
  return page.evaluate(() => {
    const panes = [...document.querySelectorAll('main > .pane')].filter(node => !node.hidden && node.offsetHeight > 0 && node.offsetWidth > 0 && getComputedStyle(node).visibility !== 'hidden');
    return {hash: location.hash, pane: panes.length === 1 ? panes[0].id : null,
      visiblePanes: panes.map(node => node.id), bar: !!document.getElementById('dpbar')};
  });
}

function tabHash(tab, hash) {
  if (tab === 'map') return hash === '#map' || hash === '#sheet/__explorer';
  if (tab === 'timeline') return hash === '#timeline' || /^#day\/\d{4}-\d{2}-\d{2}$/.test(hash);
  return hash === '#' + (ALIASES[tab] || tab);
}

async function main() {
  const candidate = path.resolve(process.env.CANDIDATE_DIR || '/workspace/gc500-workshop-1305-private/release-candidate');
  const pageFile = path.resolve(process.env.PAGE || '/workspace/gc500-machine-5nov-private/page.html');
  assert.ok(process.env.OUT, 'OUT must name a fresh private evidence directory');
  const out = path.resolve(process.env.OUT);
  assert.ok(!fs.existsSync(out), 'Use a fresh OUT; never overwrite an acceptance attempt');
  fs.mkdirSync(out, {recursive: true, mode: 0o700});
  const mobile = process.env.MOB === '1';
  const result = {author: 'Andrew Fisher', suite: 'dashboard1305', viewport: mobile ? 'phone' : 'desktop',
    passed: false, errors: [], consoleErrors: [], recordWrites: 0, blockedRequests: [],
    routeFailures: [], checks: [], tabs: {}, links: {}, back: null, candidateStatusOverride: true,
    dashboardSha256: PAGE_SHA, machineManifestSha256: null, machineFiles: {}, releaseScopeSha256: sha(SCOPE_BYTES),
    loadedMachineFiles: [], machineRequests: 0, liveGETs: 0,
    harnessSha256: sha(fs.readFileSync(__filename)),
    sharedVerifierSha256: sha(fs.readFileSync(path.join(TOOLCHAIN, 'harness/release_sweep.cjs')))};
  let browser, inputs, closing = false, stage = 'freeze inputs';
  const startedAt = Date.now();
  const pendingRoutes = new Set();
  const check = (name, condition) => {
    result.checks.push({name, passed: !!condition});
    console.log(`[dashboard ${result.viewport} +${((Date.now() - startedAt) / 1000).toFixed(1)}s] ${condition ? 'PASS' : 'FAIL'} ${name}`);
    assert.ok(condition, name);
  };
  try {
    inputs = freezeInputs(candidate, pageFile);
    result.machineManifestSha256 = inputs.manifest.sha256;
    result.machineFiles = inputs.machineFiles;
    stage = 'verify live base';
    const pageHeaders = await liveBase();
    const machineHeaders = (await publicGet(MACHINE + '?header-check=' + Date.now())).headers;
    check('live machine HTML security policy present', !!machineHeaders['content-security-policy']);
    stage = 'open browser';
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--lang=en-AU', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
    const context = await browser.newContext({...mobile ? devices['iPhone 13'] : {},
      viewport: {width: mobile ? 390 : 1440, height: mobile ? 844 : 900}, deviceScaleFactor: 1,
      locale: 'en-AU', timezoneId: 'Australia/Brisbane', serviceWorkers: 'block'});
    // Match the proven actual-live budget without bypassing native hit-target checks.
    context.setDefaultTimeout(120000);
    const loaded = new Set();
    const status = {ready: true, version: inputs.manifest.version, label: inputs.manifest.label, built: null,
      entry: inputs.manifest.entry, files: inputs.manifest.files.length,
      bytes: inputs.manifest.files.reduce((sum, file) => sum + file.bytes, 0), sha256: inputs.manifest.sha256};
    await context.route('**/*', route => {
      const work = (async () => {
      const request = route.request();
      const url = new URL(request.url());
      try {
        if (['data:', 'blob:'].includes(url.protocol)) return await route.continue();
        if (request.method() !== 'GET') {
          result.blockedRequests.push({method: request.method(), origin: url.origin, path: url.pathname});
          if (url.origin === HOST) result.recordWrites++;
          return await route.abort('blockedbyclient');
        }
        if (closing) return await route.abort('aborted');
        if (url.origin === HOST && [VIEW, VIEW.slice(0, -1)].includes(url.pathname)) {
          return await route.fulfill({status: 200, headers: {...pageHeaders, 'cache-control': 'no-store'}, body: inputs.page});
        }
        if (url.origin === HOST && url.pathname === '/api/machine') {
          return await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(status)});
        }
        if (url.origin === HOST && (url.pathname.startsWith(MACHINE) || url.pathname === MACHINE.slice(0, -1))) {
          let name = decodeURIComponent(url.pathname.slice(MACHINE.length));
          if (!name || name.endsWith('/')) name += 'index.html';
          const asset = machineAsset(inputs.machine, name);
          loaded.add(name);
          result.machineRequests++;
          const headers = {'content-type': asset.type, 'cache-control': 'no-store', 'accept-ranges': 'bytes'};
          if (name.endsWith('.html')) for (const key of ['content-security-policy', 'x-frame-options', 'referrer-policy', 'x-content-type-options']) if (machineHeaders[key]) headers[key] = machineHeaders[key];
          const range = request.headers().range;
          if (range) {
            const match = /^bytes=(\d+)-(\d*)$/.exec(range);
            assert.ok(match, 'Unsupported machine byte range');
            const start = Number(match[1]), end = match[2] ? Math.min(Number(match[2]), asset.body.length - 1) : asset.body.length - 1;
            assert.ok(start <= end && start < asset.body.length, 'Invalid machine byte range');
            return await route.fulfill({status: 206, headers: {...headers, 'content-range': `bytes ${start}-${end}/${asset.body.length}`}, body: asset.body.subarray(start, end + 1)});
          }
          return await route.fulfill({status: 200, headers, body: asset.body});
        }
        result.liveGETs++;
        return await route.fulfill(await curlFetch(request.url(), request.headers(), 'GET'));
      } catch (error) {
        if (closing && /Target page, context or browser has been closed/.test(error.message)) return;
        result.routeFailures.push({path: url.pathname, error: error.message});
        try { await route.abort('failed'); } catch (_) {}
      }
      })();
      pendingRoutes.add(work);
      work.then(() => pendingRoutes.delete(work), () => pendingRoutes.delete(work));
      return work;
    });
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
    stage = 'dashboard startup';
    await page.goto(HOST + VIEW, {waitUntil: 'load', timeout: 180000});
    await page.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000});
    await page.waitForFunction(() => !window.GC500Refresh904 || window.GC500Refresh904.report().settled, null, {timeout: 60000});
    await page.waitForTimeout(2500);
    assert.deepEqual(await page.evaluate(() => TABS.map(tab => tab[0])), TABS, 'Exact27 current tab routes');
    check('dashboard remains view only', await page.evaluate(() => !canEdit() && capability() === 'view'));
    await page.evaluate(() => { window.__dashboard1305Functions = [go, renderCosts, financeTab857, renderCoatesWay, machineOpen, machineClose]; });
    stage = 'native machine opening';
    await page.evaluate(() => go('coatesway'));
    await page.waitForFunction(() => { const button = document.getElementById('cwOpenMachine'); return button && !button.disabled; }, null, {timeout: 60000});
    await page.locator('#cwOpenMachine').click();
    await page.waitForFunction(() => MACHINE.open && !document.getElementById('machine').hidden);
    const handle = await page.locator('#machineFrame iframe').elementHandle();
    const frame = await handle.contentFrame();
    await frame.waitForFunction(() => window.__cw?.ready && !!window.__workshop, null, {timeout: 180000});
    check('native embedded machine is ready', await frame.evaluate(() => __cw.ready));
    check('candidate workshop modules served', REQUIRED.every(name => loaded.has(name)));
    check('candidate version reaches dashboard frame', (await page.locator('#machineBuild').textContent()).includes('v13.05-workshop-inspection'));
    await frame.locator('#workshop-enter').click();
    await frame.waitForFunction(() => __workshop.active && __cw.drive.locked);
    check('service controller starts at the assembled stage', await frame.evaluate(() =>
      !!__workshop.service && __workshop.service.progress === 0));
    check('workshop opens through native iframe controls', await frame.locator('#workshop-panel').isVisible());
    check('workshop fits embedded viewport', await frame.evaluate(() => {
      const r = document.getElementById('workshop-panel').getBoundingClientRect();
      return r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
    }));
    stage = 'native embedded inspection controls';
    await frame.locator('#workshop-bench-open').click();
    await frame.waitForFunction(() => __workshop.learning.active && __workshop.service.benchReady
      && !__workshop.inspection.cameraMoving, null, {timeout:120000,polling:100});
    check('embedded bench opens through native controls', await frame.locator('#bench-crank').isVisible());
    await frame.locator('#bench-crank').scrollIntoViewIfNeeded();
    result.embeddedInspection = await frame.evaluate(() => {
      const canvas=document.getElementById('canvas'),c=canvas.getBoundingClientRect();
      const b=document.getElementById('bench-crank').getBoundingClientRect();
      const left=Math.max(0,c.left),right=Math.min(innerWidth,c.right),top=Math.max(0,c.top),bottom=Math.min(innerHeight,c.bottom);
      return {compact:__workshop.inspection.compact,visibleWidth:right-left,visibleHeight:bottom-top,
        canvasHit:document.elementFromPoint((left+right)/2,(top+bottom)/2)===canvas,
        controlVisible:b.left>=-1&&b.right<=innerWidth+1&&b.top>=-1&&b.bottom<=innerHeight+1};
    });
    if(mobile)check('embedded phone bench keeps the model and controls visible', result.embeddedInspection.compact
      && result.embeddedInspection.visibleWidth>=160 && result.embeddedInspection.visibleHeight>=120
      && result.embeddedInspection.canvasHit && result.embeddedInspection.controlVisible);
    const crankBefore=await frame.evaluate(()=>__workshop.learning.state.crankDegrees);
    await frame.locator('#bench-crank').click();
    check('embedded crank controls change the actual engine',await frame.evaluate(before=>
      (__workshop.learning.state.crankDegrees-before+720)%720===45,crankBefore));
    await page.screenshot({path: path.join(out, mobile ? 'phone-embedded-workshop.png' : 'desktop-embedded-workshop.png'), timeout: 120000});
    await frame.locator('#workshop-exit').click();
    await frame.waitForFunction(() => !__workshop.active && !__cw.drive.locked);
    check('native workshop exit restores machine controls', await frame.locator('.dock').isVisible());
    await page.locator('#machineClose').click();
    check('machine close restores dashboard', await page.evaluate(() => !MACHINE.open && document.getElementById('machine').hidden && !document.body.classList.contains('machining') && !document.querySelector('main[inert]')));
    check('machine close restores opener focus', await page.evaluate(() => document.activeElement?.id === 'cwOpenMachine'));
    check('parent navigation and finance functions unchanged', await page.evaluate(() => [go, renderCosts, financeTab857, renderCoatesWay, machineOpen, machineClose].every((fn, i) => fn === __dashboard1305Functions[i])));

    for (const tab of TABS) {
      stage = 'tab ' + tab;
      await page.evaluate(value => go(value), tab);
      await page.waitForTimeout(tab === 'map' ? 6000 : 1600);
      const row = await snapshot(page);
      result.tabs[tab] = row;
      check(tab + ' opens canonical pane', row.pane === 'pane-' + (ALIASES[tab] || tab));
      check(tab + ' uses expected address', tabHash(tab, row.hash));
      if (tab === 'costs' || tab === 'pricing') check(tab + ' selects its finance view', await page.evaluate(value => state.financeView857 === (value === 'pricing' ? 'pricing' : 'summary'), tab));
    }
    for (const link of LINKS) {
      stage = 'deep link ' + link;
      await page.evaluate(value => { location.hash = value; }, link);
      await page.waitForTimeout(link.startsWith('#print') ? 9000 : 2500);
      const row = await snapshot(page);
      result.links[link] = row;
      const pane = link.startsWith('#change/') ? 'today' : link.startsWith('#sheet/') ? 'map'
        : link === '#plant' ? 'plant' : link === '#today' ? 'today' : 'timeline';
      check(link + ' opens canonical pane', row.pane === 'pane-' + pane);
      check(link + ' retains supported address', deepLinkHashMatches(link, row.hash));
      check(link + ' has correct print toolbar state', row.bar === link.startsWith('#print/'));
      await page.evaluate(() => document.querySelector('#dpbar [data-dpbar-x]')?.click());
      await page.waitForTimeout(800);
    }
    stage = 'browser Back';
    await page.evaluate(() => go('plant'));
    await page.waitForTimeout(1000);
    await page.evaluate(() => go('timeline'));
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1500);
    result.back = await snapshot(page);
    check('browser Back restores Equipment', result.back.pane === 'pane-plant' && result.back.hash === '#plant');
    check('retained explorer was served from frozen candidate', loaded.has('explorer/explorer.js'));
    result.loadedMachineFiles = [...loaded].sort();
    stage = 'final input and live-base verification';
    assert.deepEqual(freezeInputs(candidate, pageFile), inputs, 'Input bytes changed during acceptance');
    await liveBase();
    check('all27 routes completed', Object.keys(result.tabs).length === 27);
    check('all7 deep links completed', Object.keys(result.links).length === 7);
    check('no runtime errors', result.errors.length === 0);
    check('no console errors', result.consoleErrors.length === 0);
    check('no blocked write attempts', result.blockedRequests.length === 0 && result.recordWrites === 0);
    check('no local asset or network failures', result.routeFailures.length === 0);
    result.passed = true;
  } catch (error) {
    result.failure = {stage, message: error.message};
  } finally {
    closing = true;
    if (browser) await browser.close();
    while (pendingRoutes.size) await Promise.allSettled([...pendingRoutes]);
    if (result.errors.length || result.consoleErrors.length || result.recordWrites || result.routeFailures.length || result.blockedRequests.length) result.passed = false;
    fs.writeFileSync(path.join(out, 'dashboard-' + result.viewport + '.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({suite: result.suite, viewport: result.viewport, passed: result.passed,
      checks: result.checks.length, tabs: Object.keys(result.tabs).length, deepLinks: Object.keys(result.links).length,
      errors: result.errors.length, consoleErrors: result.consoleErrors.length, recordWrites: result.recordWrites,
      routeFailures: result.routeFailures.length, failure: result.failure || null}));
  }
  assert.equal(result.passed, true, 'Dashboard acceptance failed; inspect private receipt');
}

module.exports = {freezeInputs, tabHash, snapshot};
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
