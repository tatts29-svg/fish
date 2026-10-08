// Author: Andrew Fisher.
// Read-only release sweep. PAGE is required; MOB=1 uses the shared phone profile.
// CHROMIUM_PATH and request blocking are provided by ./open_page.
// Emits one JSON result, with a nonzero exit status on any failed check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const CONTROL = path.resolve(__dirname, '../..');
const HOST = 'https://gc500-production.up.railway.app';
const VIEW = '/v/Coates-GC500-2026/';
const EXPLORER = '/w/Coates-GC500-2026/explorer/';
const MACHINE = '/w/Coates-GC500-2026/';
const MEDIA = '/m/Coates-GC500-2026/';
const POC_UNITS = '/w/Coates-GC500-2026/poc3d/units3d.json';
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.bin': 'application/octet-stream', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg'};
const sha256 = body => crypto.createHash('sha256').update(body).digest('hex');

function prepareMachine(environment) {
  assert.ok(environment.MACHINE_MANIFEST, 'MACHINE_MANIFEST must name the exact final machine set');
  const manifestPath = fs.realpathSync(environment.MACHINE_MANIFEST);
  const raw = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(raw);
  assert.equal(manifest.schema, 'gc500-machine-v1', 'Invalid machine manifest schema');
  assert.ok(Array.isArray(manifest.files), 'Invalid machine file list');
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
    : value !== null && typeof value === 'object'
      ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
      : JSON.stringify(value);
  const digest = sha256(Buffer.from(canonical({schema: manifest.schema, entry: manifest.entry, files: manifest.files})));
  assert.equal(manifest.sha256, digest, 'Machine manifest does not reproduce its claimed digest');
  const roots = {};
  for (const key of ['CODE', 'ASSETS', 'POC3D', 'MACHINE_ROOT']) {
    if (environment[key]) {
      roots[key] = fs.realpathSync(environment[key]);
      assert.ok(fs.statSync(roots[key]).isDirectory(), key + ' must be a directory');
    }
  }
  if (environment.LOCAL) assert.equal(fs.realpathSync(environment.LOCAL), roots.CODE, 'LOCAL must resolve to CODE');
  const files = {};
  for (const descriptor of manifest.files) {
    const name = descriptor && descriptor.path;
    assert.ok(typeof name === 'string' && name && !name.includes('\\') &&
      !name.split('/').some(part => !part || part === '.' || part === '..') &&
      !Object.hasOwn(files, name), 'Invalid or duplicate machine manifest path');
    assert.ok(/^[a-f0-9]{64}$/.test(descriptor.sha256) && Number.isSafeInteger(descriptor.bytes) &&
      descriptor.bytes > 0 && typeof descriptor.type === 'string' && descriptor.type,
      'Invalid machine descriptor: ' + name);
    const choices = [];
    for (const [prefix, key] of [['explorer/assets/', 'ASSETS'], ['explorer/', 'CODE'], ['poc3d/', 'POC3D']]) {
      if (name.startsWith(prefix) && roots[key]) { choices.push([roots[key], name.slice(prefix.length)]); break; }
    }
    if (roots.MACHINE_ROOT) choices.push([roots.MACHINE_ROOT, name]);
    let source;
    for (const [root, relative] of choices) {
      if (fs.existsSync(path.resolve(root, relative))) { source = localFile(root, relative); break; }
    }
    assert.ok(source, 'Missing local machine file: ' + name);
    // Define a data property even for a literal __proto__ filename.
    Object.defineProperty(files, name, {value: {...descriptor, source}, enumerable: true});
    machineAsset({files}, name);
  }
  assert.ok(Object.hasOwn(files, manifest.entry), 'Machine entry is missing from its files');
  const binding = {schema: 'gc500-machine-inputs-v1', manifest: manifestPath,
    manifest_sha256: sha256(raw), machine_sha256: digest, roots, files};
  if (environment.MACHINE_BINDING) {
    const captured = JSON.parse(fs.readFileSync(environment.MACHINE_BINDING, 'utf8'));
    assert.equal(captured.schema, 'gc500-browser-inputs-v1', 'Unknown browser-input binding');
    assert.deepEqual(binding, captured.machine, 'Machine inputs changed since the captured browser attempt');
  }
  return binding;
}

function machineAsset(binding, name) {
  const descriptor = Object.hasOwn(binding.files, name) && binding.files[name];
  assert.ok(descriptor, 'Machine dependency is absent from the frozen manifest: ' + name);
  const body = fs.readFileSync(descriptor.source);
  assert.equal(body.length, descriptor.bytes, 'Wrong machine asset length: ' + name);
  assert.equal(sha256(body), descriptor.sha256, 'Wrong machine asset SHA-256: ' + name);
  return {body, type: descriptor.type};
}

function candidateData(filename) {
  const match = /const DATA = (\{.*?\});\r?\n/s.exec(fs.readFileSync(filename, 'utf8'));
  assert.ok(match, 'Candidate/base page must contain the DATA declaration');
  const data = JSON.parse(match[1]);
  assert.ok(data.media && typeof data.media === 'object', 'Candidate/base media table is missing');
  return data;
}

function localFile(root, relative) {
  assert.ok(root, 'A local asset directory is required for ' + relative);
  const directory = fs.realpathSync(root);
  assert.ok(fs.statSync(directory).isDirectory(), 'Local asset root must be a directory');
  const filename = fs.realpathSync(path.resolve(directory, relative));
  assert.ok(filename.startsWith(directory + path.sep) && fs.statSync(filename).isFile(),
    'Local asset must be a file within its configured directory: ' + relative);
  return filename;
}

function verifiedFile(root, descriptor) {
  assert.ok(descriptor && /^[a-f0-9]{64}$/.test(descriptor.sha256) &&
    Number.isSafeInteger(descriptor.bytes) && descriptor.bytes > 0 &&
    descriptor.file === path.basename(descriptor.file), 'Invalid candidate media descriptor');
  const body = fs.readFileSync(localFile(root, descriptor.file));
  assert.equal(body.length, descriptor.bytes, 'Wrong local asset length: ' + descriptor.file);
  assert.equal(sha256(body), descriptor.sha256, 'Wrong local asset SHA-256: ' + descriptor.file);
  return {body, type: descriptor.type || TYPES[path.extname(descriptor.file)]};
}

function prepareAssets(pageFile, environment) {
  const machine = prepareMachine(environment);
  const candidate = candidateData(pageFile);
  const base = candidateData(path.join(path.dirname(pageFile), 'base_live.html'));
  const read = relative => JSON.parse(fs.readFileSync(path.join(CONTROL, relative), 'utf8'));
  const changes889 = read('v8.89_master_map_DRAFT/changes889.json');
  const changes893 = read('v8.93_maps_aligned_DRAFT/changes893.json');
  const atlas = read('v8.96_today_scene_DRAFT/atlas896.json');
  const sources = new Map();
  for (const [rows, directory, name] of [
    [changes889.media, environment.MEDIA889, 'MEDIA889'],
    [changes893.media, environment.MEDIA893 || environment.MEDIA, 'MEDIA893'],
    [atlas.cells, environment.ATLAS896 || path.join(CONTROL, 'v8.96_today_scene_DRAFT/assets'), 'ATLAS896']
  ]) {
    for (const descriptor of rows) sources.set(descriptor.sha256, {descriptor, directory, name});
  }
  const media = new Map();
  for (const [sha, descriptor] of Object.entries(candidate.media)) {
    const previous = base.media[sha];
    if (previous && ['file', 'sha256', 'bytes', 'type', 'scope'].every(key => descriptor[key] === previous[key])) continue;
    const source = sources.get(sha);
    assert.ok(source, 'No known local source for new candidate media: ' + sha);
    assert.ok(source.directory, source.name + ' is required for new candidate media');
    for (const key of ['file', 'sha256', 'bytes', 'type', 'scope']) {
      assert.equal(descriptor[key], source.descriptor[key], 'Candidate media differs from its release descriptor: ' + sha);
    }
    assert.equal(sha, descriptor.sha256, 'Candidate media key does not match its SHA-256');
    media.set(MEDIA + descriptor.file, verifiedFile(source.directory, descriptor));
  }
  // Every explorer request is local, including files absent from a supplied set.
  // Validate the scene and all tile references before opening a browser.
  const code = environment.CODE, assets = environment.ASSETS;
  localFile(code, 'index.html');
  localFile(code, 'explorer.js');
  const scene = localFile(assets, 'drawing-scene.bin');
  const pyramid = JSON.parse(fs.readFileSync(localFile(assets, 'vt/manifest.json'), 'utf8'));
  assert.ok(Array.isArray(pyramid.levels) && pyramid.levels.length, 'Local tile manifest has no levels');
  const tiles = new Set(pyramid.levels.map(level => level.file));
  for (const tile of tiles) {
    assert.ok(typeof tile === 'string' && tile === path.basename(tile), 'Invalid local tile filename');
    localFile(assets, 'vt/' + tile);
  }
  const aligned893 = !!candidate.media[changes893.sheet_media.sha256];
  if (aligned893) {
    assert.equal(sha256(fs.readFileSync(scene)), changes893.scene_sha256, 'Local scene is not the candidate v8.93 drawing');
    assert.ok([...tiles].every(tile => tile.includes(changes893.explorer_token)), 'Local tiles do not carry the candidate v8.93 token');
  }
  let poc = null;
  if (aligned893 || environment.POC3D) {
    const directory = environment.POC3D || path.join(CONTROL, 'v8.93_maps_aligned_DRAFT/assets_small/poc3d');
    const body = fs.readFileSync(localFile(directory, 'units3d.json'));
    assert.ok(Array.isArray(JSON.parse(body).pins), 'Local 3D units must contain pins');
    if (aligned893) {
      const manifest = read('v8.93_maps_aligned_DRAFT/evidence/candidate_manifest893.json');
      const descriptor = manifest.files.find(file => file.path === 'poc3d/units3d.json');
      assert.ok(descriptor, 'Reviewed v8.93 manifest lacks its 3D unit descriptor');
      assert.equal(body.length, descriptor.bytes, 'Wrong local v8.93 3D unit length');
      assert.equal(sha256(body), descriptor.sha256, 'Wrong local v8.93 3D unit SHA-256');
    }
    poc = {body, type: TYPES['.json']};
  }
  return {code, assets, media, poc, machine, tileFiles: tiles.size};
}

async function fulfillLocal(route, asset) {
  const headers = {'content-type': asset.type || 'application/octet-stream',
    'cache-control': 'no-store', 'accept-ranges': 'bytes'};
  const range = route.request().headers().range;
  if (!range) return route.fulfill({status: 200, headers, body: asset.body});
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  assert.ok(match, 'Unsupported local asset byte range');
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), asset.body.length - 1) : asset.body.length - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= asset.body.length) {
    return route.fulfill({status: 416, headers: {...headers, 'content-range': 'bytes */' + asset.body.length}, body: ''});
  }
  return route.fulfill({status: 206, headers: {...headers,
    'content-range': `bytes ${start}-${end}/${asset.body.length}`}, body: asset.body.subarray(start, end + 1)});
}

async function installAssets(session, assets, result) {
  result.assets = {newMedia: assets.media.size, tileFiles: assets.tileFiles,
    machineSha256: assets.machine.machine_sha256, manifestSha256: assets.machine.manifest_sha256,
    machineFiles: Object.keys(assets.machine.files).length,
    machineRequests: 0, explorerRequests: 0, mediaRequests: 0, pocRequests: 0, failures: []};
  const cache = new Map();
  await session.page.context().route(HOST + '/**', async route => {
    const request = route.request();
    let relative;
    try {
      relative = decodeURIComponent(new URL(request.url()).pathname);
      const explorer = relative.startsWith(EXPLORER);
      const machine = relative.startsWith(MACHINE) || relative === MACHINE.slice(0, -1);
      const media = assets.media.get(relative);
      const poc = relative === POC_UNITS && assets.poc;
      if (!machine && !media) return route.fallback();
      if (request.method() !== 'GET') {
        session.counts.blocked++;
        return route.abort('blockedbyclient');
      }
      let asset = media;
      if (machine) {
        let file = relative.slice(MACHINE.length);
        if (!file || file.endsWith('/')) file += 'index.html';
        if (!cache.has(file)) cache.set(file, machineAsset(assets.machine, file));
        asset = cache.get(file);
        result.assets.machineRequests++;
        if (explorer) result.assets.explorerRequests++;
        if (poc) result.assets.pocRequests++;
      } else result.assets.mediaRequests++;
      return await fulfillLocal(route, asset);
    } catch (error) {
      const failure = {asset: relative || 'invalid local asset URL', message: String(error.message || error)};
      result.assets.failures.push(failure);
      result.failures.push({stage: 'local asset', ...failure});
      try {
        await route.abort('failed');
      } catch (abortError) {
        result.failures.push({stage: 'local asset abort', message: String(abortError.message || abortError)});
      }
    }
  });
}

const TABS = [
  'today', 'progress', 'map', 'docs', 'register', 'plant', 'demob',
  'fencing', 'prestarts', 'coatesway', 'journal', 'breakdowns', 'variances',
  'costs', 'edit', 'change', 'add', 'pricing', 'timeline', 'questions', 'about'
];
const HASHES = [
  '#timeline', '#day/2026-09-28', '#change/2026-09-28',
  '#print/drivers/2026-09-28', '#sheet/__satellite3d', '#plant', '#today'
];
const ALIASES = {
  progress: 'today', journal: 'today', breakdowns: 'today', variances: 'today',
  edit: 'today', add: 'today', register: 'plant', pricing: 'costs'
};

// Inspect the visible top-level pane: Where we are is nested inside Today.
// Never collect pane text, figures, or records in release evidence.
async function snapshot(page) {
  return page.evaluate(() => {
    const panes = [...document.querySelectorAll('main > .pane')].filter(pane =>
      !pane.hidden && pane.offsetHeight > 0 && pane.offsetWidth > 0 &&
      getComputedStyle(pane).visibility !== 'hidden');
    return {
      hash: location.hash,
      pane: panes.length === 1 ? panes[0].id : null,
      visiblePanes: panes.map(pane => pane.id),
      shown: panes.length === 1,
      bar: !!document.getElementById('dpbar')
    };
  });
}

function tabHashMatches(tab, hash) {
  if (tab === 'map') return hash === '#map' || hash === '#sheet/__explorer';
  if (tab === 'timeline') return hash === '#timeline' || /^#day\/\d{4}-\d{2}-\d{2}$/.test(hash);
  if (tab === 'change') return hash === '#change' || /^#change\/\d{4}-\d{2}-\d{2}$/.test(hash);
  return hash === '#' + (ALIASES[tab] || tab);
}

async function main() {
  const result = {
    author: 'Andrew Fisher', mobile: !!process.env.MOB,
    tabs: {}, hashes: {}, back: null, counts: null,
    allErrors: [], cons: [], failures: [], success: false
  };
  let session;
  let assets;
  let stage = 'open';
  const check = (condition, message) => {
    if (!condition) result.failures.push(message);
  };
  const recordException = error => {
    result.failures.push({stage, message: String(error.message || error), stack: error.stack || null});
  };
  try {
    assert.ok(process.env.PAGE, 'PAGE must name the local release candidate');
    assert.ok(fs.statSync(process.env.PAGE).isFile(), 'PAGE must be a file');
    stage = 'local asset preflight';
    assets = prepareAssets(process.env.PAGE, process.env);
    stage = 'open';
    const {open} = require('./open_page');
    session = await open(result.mobile
      ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true}
      : {pageFile: process.env.PAGE, W: 1440, H: 900});
    const page = session.page;
    stage = 'local asset routes';
    // Discard the setup document before recording the tested load. The shared
    // helper's blocked-write count remains intact across both navigations.
    await page.goto('about:blank', {waitUntil: 'load', timeout: 30000});
    await installAssets(session, assets, result);
    result.setupPageErrors = session.errors.length;
    session.errors.length = 0;
    page.on('console', message => {
      if (message.type() === 'error') {
        const location = message.location() || {};
        result.cons.push(message.text() + (location.url ? ' @ ' + location.url : ''));
      }
    });
    // Reload the candidate with local routes and error capture already in place.
    stage = 'startup';
    await page.goto(HOST + VIEW, {waitUntil: 'load', timeout: 180000});
    await page.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000});
    await page.waitForTimeout(3000);
    const declaredTabs = await page.evaluate(() => TABS.map(tab => tab[0]));
    result.declaredTabs = declaredTabs;
    check(JSON.stringify(declaredTabs) === JSON.stringify(TABS), 'TABS must contain the exact 21 expected routes in order');

    for (const tab of TABS) {
      stage = 'tab ' + tab;
      const e0 = session.errors.length, c0 = result.cons.length;
      await page.evaluate(key => go(key), tab);
      await page.waitForTimeout(tab === 'map' ? 6000 : 1600);
      const row = await snapshot(page);
      row.errors = session.errors.slice(e0);
      row.console = result.cons.slice(c0);
      row.ok = row.shown && row.pane === 'pane-' + (ALIASES[tab] || tab) &&
        tabHashMatches(tab, row.hash) && row.errors.length === 0 && row.console.length === 0;
      result.tabs[tab] = row;
      check(row.shown && row.pane === 'pane-' + (ALIASES[tab] || tab), stage + ': expected visible canonical pane');
      check(tabHashMatches(tab, row.hash), stage + ': unexpected hash ' + row.hash);
    }

    for (const hash of HASHES) {
      stage = 'link ' + hash;
      const e0 = session.errors.length, c0 = result.cons.length;
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForTimeout(hash.startsWith('#print') ? 9000 : 2500);
      const row = await snapshot(page);
      row.errors = session.errors.slice(e0);
      row.console = result.cons.slice(c0);
      result.hashes[hash] = row;
      const pane = hash.startsWith('#change/') ? 'change'
        : hash.startsWith('#sheet/') ? 'map'
          : hash === '#plant' ? 'plant' : hash === '#today' ? 'today' : 'timeline';
      row.ok = row.shown && row.pane === 'pane-' + pane && row.hash === hash &&
        row.bar === hash.startsWith('#print/') && row.errors.length === 0 && row.console.length === 0;
      check(row.shown && row.pane === 'pane-' + pane, stage + ': expected visible canonical pane');
      check(row.hash === hash, stage + ': unexpected hash ' + row.hash);
      check(row.bar === hash.startsWith('#print/'), stage + ': incorrect print toolbar state');
      await page.evaluate(() => {
        const close = document.querySelector('#dpbar [data-dpbar-x]');
        if (close) close.click();
      });
      await page.waitForTimeout(800);
    }

    stage = 'browser Back';
    await page.evaluate(() => go('plant'));
    await page.waitForTimeout(1000);
    const plant = await snapshot(page);
    check(plant.shown && plant.pane === 'pane-plant' && plant.hash === '#plant', 'Back setup: Equipment must be visible');
    await page.evaluate(() => go('timeline'));
    await page.waitForTimeout(1000);
    const timeline = await snapshot(page);
    check(timeline.shown && timeline.pane === 'pane-timeline' && tabHashMatches('timeline', timeline.hash), 'Back setup: Timeline must be visible');
    await page.goBack();
    await page.waitForTimeout(1500);
    result.back = await snapshot(page);
    check(result.back.shown && result.back.pane === 'pane-plant' && result.back.hash === '#plant', 'Browser Back must return from Timeline to Equipment');
  } catch (error) {
    recordException(error);
  } finally {
    if (session) {
      stage = 'browser close';
      try {
        await session.browser.close();
      } catch (error) {
        recordException(error);
      }
      result.allErrors = [...session.errors];
      result.counts = {...session.counts};
    }
    if (assets) {
      stage = 'final machine input check';
      try {
        assert.deepEqual(prepareMachine(process.env), assets.machine, 'Machine inputs changed during the sweep');
      } catch (error) { recordException(error); }
    }
    check(Object.keys(result.tabs).length === TABS.length, 'All 21 tab routes must complete');
    check(Object.keys(result.hashes).length === HASHES.length, 'All seven deep links must complete');
    check(result.back !== null, 'Browser Back check must complete');
    check(result.allErrors.length === 0, 'Page errors must be empty');
    check(result.cons.length === 0, 'Console errors must be empty');
    check(result.counts !== null && result.counts.blocked === 0, 'Blocked write attempts must be zero');
    result.success = result.failures.length === 0;
    process.stdout.write(JSON.stringify(result) + '\n');
  }
  assert.equal(result.success, true, 'Release sweep failed; see the JSON failures, allErrors and cons');
}

module.exports = {prepareMachine, machineAsset, installAssets};
if (require.main === module) main().catch(error => {
  process.stderr.write(String(error.stack || error) + '\n');
  process.exitCode = 1;
});
