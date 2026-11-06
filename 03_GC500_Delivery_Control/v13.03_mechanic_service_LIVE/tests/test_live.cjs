// Author: Andrew Fisher. Actual published v13.03 machine: fresh GETs, no candidate substitution.
// Root runs after publication under flock /tmp/gc500-browser.lock.
// MANIFEST=<published candidate manifest> OUT=<fresh private directory>
// GC500_CACHE=<fresh empty directory> CHROMIUM_PATH=<browser> node tests/test_live.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require('playwright');
if (!process.env.GC500_CACHE) throw Error('Set a fresh GC500_CACHE for actual live verification');
if (fs.existsSync(process.env.GC500_CACHE) && fs.readdirSync(process.env.GC500_CACHE).length) throw Error('Live verification cache must be empty');
if (process.env.PAGE && ['MEDIA', 'MEDIA893', 'MEDIA889', 'ATLAS896'].some(key => process.env[key])) throw Error('Remove local candidate media overrides before actual live verification');
const TOOLCHAIN = process.env.GC500_TOOLCHAIN || path.resolve(__dirname, '../../toolchain');
const {curlFetch} = require(path.join(TOOLCHAIN, 'harness/curlfetch'));
const HOST = 'https://gc500-production.up.railway.app';
const PUBLIC = 'Coates-GC500-2026';
const PREFIX = '/w/' + PUBLIC + '/';
const PAGE_SHA = '2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b';
const CHANGED = ['car-app.js', 'engine-lift-preview.js', 'index.html', 'workshop-lessons.js',
  'workshop-mechanic.js', 'workshop-service.js', 'workshop-showcase.js', 'workshop-ui.js'];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
    : JSON.stringify(value);

function readManifest(filename) {
  assert.ok(filename, 'MANIFEST must identify the exact published candidate');
  const manifest = JSON.parse(fs.readFileSync(filename));
  assert.equal(manifest.schema, 'gc500-machine-v1');
  assert.equal(manifest.entry, 'index.html');
  assert.equal(manifest.version, 'v13.03-mechanic-service');
  assert.equal(manifest.files?.length, 245);
  const paths = manifest.files.map(file => file.path);
  assert.deepEqual(paths, [...new Set(paths)].sort(), 'Manifest paths must be unique and sorted');
  for (const file of manifest.files) {
    assert.deepEqual(Object.keys(file).sort(), ['bytes', 'path', 'sha256', 'type']);
    assert.ok(/^[a-f0-9]{64}$/.test(file.sha256) && Number.isSafeInteger(file.bytes) && file.bytes > 0);
  }
  assert.ok(CHANGED.every(name => paths.includes(name)), 'The complete changed module set is required');
  assert.equal(sha(Buffer.from(canonical({schema: manifest.schema, entry: manifest.entry, files: manifest.files}))), manifest.sha256, 'Manifest canonical digest differs');
  return manifest;
}

async function main() {
  const manifest = readManifest(process.env.MANIFEST);
  assert.ok(process.env.OUT, 'OUT must name a fresh private evidence directory');
  const out = path.resolve(process.env.OUT);
  assert.ok(!fs.existsSync(out), 'Use a fresh OUT; do not overwrite a live verification attempt');
  fs.mkdirSync(out, {recursive: true, mode: 0o700});
  const expected = new Map(manifest.files.map(file => [file.path, file]));
  const nonce = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
  const result = {author: 'Andrew Fisher', suite: 'live-machine1303', viewport: 'phone', passed: false,
    errors: [], consoleErrors: [], recordWrites: 0, blockedRequests: [], checks: [],
    verifiedFiles: {}, verifiedChangedFiles: {}, machineManifestSha256: manifest.sha256,
    dashboardSha256: PAGE_SHA, candidateResponses: 0, emptyCacheRequired: true,
    harnessSha256: sha(fs.readFileSync(__filename))};
  const check = (name, ok) => { result.checks.push({name, passed: !!ok}); console.log(JSON.stringify({check:name,passed:!!ok})); assert.ok(ok, name); };
  let browser, completed = false, closing = false, stage = 'public status';
  const pending = new Set();

  async function freshGet(url, headers = {}) {
    const target = new URL(url);
    if (target.origin === HOST) target.searchParams.set('livecheck', nonce);
    const response = await curlFetch(target.href, {...headers, 'cache-control': 'no-cache'}, 'GET');
    assert.equal(response.status, 200, 'Public GET failed: ' + target.pathname);
    return response;
  }

  function verifyFile(name, response) {
    const detail = expected.get(name);
    assert.ok(detail, 'Undeclared live machine asset: ' + name);
    assert.equal(response.status, 200, 'Published file is not a complete200 response: ' + name);
    assert.equal(response.body.length, detail.bytes, 'Published byte count differs: ' + name);
    assert.equal(sha(response.body), detail.sha256, 'Published content differs: ' + name);
    return detail.sha256;
  }

  async function verifyPublicIdentity() {
    const status = JSON.parse((await freshGet(HOST + '/api/machine', {'x-gc500-token': PUBLIC})).body);
    assert.equal(status.ready, true);
    assert.equal(status.sha256, manifest.sha256, 'Active published manifest differs');
    assert.equal(status.files, 245, 'Active published file count differs');
    assert.equal(status.version, 'v13.03-mechanic-service');
    assert.equal(sha((await freshGet(HOST + '/v/' + PUBLIC + '/')).body), PAGE_SHA, 'Dashboard changed during machine publication');
  }

  try {
    await verifyPublicIdentity();
    check('actual service reports the exact245-file v13.03 manifest', true);
    stage = 'fresh changed public files';
    for (const name of CHANGED) {
      result.verifiedChangedFiles[name] = verifyFile(name, await freshGet(HOST + PREFIX + name));
    }
    check('all8 changed files match fresh public GETs', Object.keys(result.verifiedChangedFiles).length === 8);
    stage = 'phone browser startup';
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
    const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
      isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Brisbane', serviceWorkers: 'block'});
    // A cold SwiftShader compile can exceed Playwright's 30-second action budget.
    // Keep native visibility, stability and hit-target checks; never force the click.
    context.setDefaultTimeout(120000);
    await context.route('**/*', route => {
      const work = (async () => {
        const request = route.request(), url = new URL(request.url());
        try {
          if (request.method() !== 'GET') {
            result.recordWrites++;
            result.blockedRequests.push({method: request.method(), origin: url.origin, path: url.pathname});
            return await route.abort('blockedbyclient');
          }
          if (closing) return await route.abort('aborted');
          if (['blob:', 'data:'].includes(url.protocol)) return await route.continue();
          const headers = {...request.headers()};
          delete headers.range;
          delete headers['if-none-match'];
          delete headers['if-modified-since'];
          const response = await freshGet(request.url(), headers);
          if (url.origin === HOST && url.pathname.startsWith(PREFIX)) {
            let name = decodeURIComponent(url.pathname.slice(PREFIX.length));
            if (!name || name.endsWith('/')) name += 'index.html';
            result.verifiedFiles[name] = verifyFile(name, response);
          }
          return await route.fulfill(response);
        } catch (error) {
          if (closing && /Target page, context or browser has been closed/.test(error.message)) return;
          result.errors.push(error.message);
          try { await route.abort('failed'); } catch (_) {}
        }
      })();
      pending.add(work);
      work.then(() => pending.delete(work), () => pending.delete(work));
      return work;
    });
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
    await page.goto(HOST + PREFIX + '?release=' + manifest.sha256, {waitUntil: 'domcontentloaded', timeout: 180000});
    await page.waitForFunction(() => window.__cw?.ready && window.__workshop?.service && window.__workshop?.lessons, null, {timeout: 180000, polling: 500});
    stage = 'native service controls';
    await page.locator('#workshop-enter').click();
    await page.waitForFunction(() => __workshop.active && __workshop.service.active && __cw.drive.locked);
    check('service starts assembled and drive locked', await page.evaluate(() => __workshop.service.progress === 0 && __cw.drive.locked));
    result.startButton = await page.locator('#workshop-play').evaluate(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      return {disabled:element.disabled,display:style.display,visibility:style.visibility,
        rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
        hit:document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.id};
    });
    console.log(JSON.stringify({startButton:result.startButton}));
    await page.locator('#workshop-play').click();
    await page.waitForFunction(() => __workshop.service.progress > 0, null, {timeout: 30000});
    await page.locator('#workshop-play').click();
    check('service play advances and pauses through native control', await page.evaluate(() => __workshop.service.progress > 0 && !__workshop.service.playing));
    await page.screenshot({path: path.join(out, 'live-phone-service.png'), timeout: 120000});
    stage = 'supported bench and hand crank';
    await page.locator('#workshop-bench-open').click();
    await page.waitForFunction(() => __workshop.learning.active && __workshop.service.benchReady && __workshop.lift.benchReady);
    check('engine is supported with rigging clear', await page.evaluate(() => __workshop.service.progress === 1 && __workshop.service.diagnostics.rigging.attached === 0));
    const crank = await page.evaluate(() => __workshop.learning.state.crankDegrees);
    await page.locator('#bench-crank').click();
    check('live hand crank advances45 degrees', await page.evaluate(previous => (__workshop.learning.state.crankDegrees - previous + 720) % 720 === 45, crank));
    stage = 'four-stroke and component lessons';
    await page.locator('[data-bench-mode="cycle"]').click();
    await page.waitForFunction(() => __workshop.lessons.state.active && __workshop.lessons.state.kind === 'cycle');
    await page.locator('#lesson-angle').evaluate(element => { element.value = '450'; element.dispatchEvent(new Event('input', {bubbles: true})); });
    check('cycle slider moves actual lesson to the power stroke', await page.evaluate(() =>
      __workshop.lessons.state.phase.id === 'power' && Math.abs(__workshop.lessons.state.angleDegrees - 450) < .01));
    check('four-stroke controls are visible', await page.locator('#lesson-cycle').isVisible());
    await page.screenshot({path: path.join(out, 'live-phone-cycle.png'), timeout: 120000});
    await page.locator('[data-bench-mode="isolate"]').click();
    await page.waitForFunction(() => __workshop.lessons.state.active && __workshop.lessons.state.kind === 'isolate');
    await page.locator('#lesson-right').click();
    check('isolated component rotates through native control', await page.evaluate(() => Math.abs(__workshop.lessons.state.rotationDegrees - 45) < .01));
    stage = 'native exit and restoration';
    await page.locator('#workshop-exit').click();
    await page.waitForFunction(() => !__workshop.active && !__workshop.service.active && !__cw.drive.locked);
    check('exit clears bench lessons and restores the dock', await page.evaluate(() => !__workshop.learning.active && !__workshop.lessons.state.active && !__workshop.showcase.active) && await page.locator('.dock').isVisible());
    check('all8 changed modules were loaded from actual public responses', CHANGED.every(name => result.verifiedFiles[name] === expected.get(name).sha256));
    stage = 'final public identity';
    await verifyPublicIdentity();
    check('published manifest and unchanged dashboard still exact', true);
    assert.equal(sha(fs.readFileSync(__filename)), result.harnessSha256, 'Live harness changed during the run');
    completed = true;
  } catch (error) {
    result.failure = {stage, message: error.message};
  } finally {
    closing = true;
    if (browser) await browser.close();
    while (pending.size) await Promise.allSettled([...pending]);
    result.passed = completed && !result.errors.length && !result.consoleErrors.length && !result.recordWrites;
    fs.writeFileSync(path.join(out, 'live-browser.json'), JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify({suite: result.suite, passed: result.passed, checks: result.checks.length,
    verifiedChangedFiles: Object.keys(result.verifiedChangedFiles).length,
    verifiedFiles: Object.keys(result.verifiedFiles).length, errors: result.errors.length,
    consoleErrors: result.consoleErrors.length, recordWrites: result.recordWrites, failure: result.failure || null}));
  assert.equal(result.passed, true, 'Live verification failed; inspect private receipt');
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
