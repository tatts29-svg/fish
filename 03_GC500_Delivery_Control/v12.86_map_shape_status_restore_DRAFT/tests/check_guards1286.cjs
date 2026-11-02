/* Author: Andrew Fisher. Execute the actual parent mount guards against reviewed
   and unknown Explorer identities. Read-only: no browser, network or record writes.
   BASE_PAGE and CANDIDATE_PAGE are private dashboard snapshots; OUT is private. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

for (const key of ['BASE_PAGE', 'CANDIDATE_PAGE', 'OUT']) assert(process.env[key], key + ' is required');
const OUT = path.resolve(process.env.OUT);
const repository = path.resolve(__dirname, '../../..');
assert(OUT !== repository && !OUT.startsWith(repository + path.sep), 'OUT must be outside the repository');
const base = fs.readFileSync(process.env.BASE_PAGE, 'utf8');
const candidate = fs.readFileSync(process.env.CANDIDATE_PAGE, 'utf8');
const CURRENT = [
  'explorer.js?v=641db3a7b324',
  'explorer-merge.js?v=c62854961e0d',
  'fencing-map-core.js?v=0c26c3b7777f',
  'fencing-map-explorer.js?v=e3a4bef6c17d',
  'explorer-fix864.js?v=d7041320fc3f',
  'explorer-fix887.js?v=6996471a6a0f'
];
const previous = CURRENT.map(s => s.replace('641db3a7b324', 'e175ec073b2d').replace('c62854961e0d', '7c276bb18154'));
const prior1064 = previous.map(s => s.replace('e175ec073b2d', 'c096837cb410').replace('7c276bb18154', '97a4087210f3'));
const prior1060 = prior1064.map(s => s.replace('c096837cb410', '8586cb7d5008'));
const ORIGIN = 'https://gc500-production.up.railway.app';
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const result = {
  author: 'Andrew Fisher', checkedAt: new Date().toISOString(),
  baseSha256: sha(base), candidateSha256: sha(candidate),
  currentIdentity: CURRENT.join('|'), cases: [],
  limits: 'Executes actual parent mount functions with a controlled frame DOM; functional shapes, doors and status require the separate browser check.'
};

function loadLayer(page, scriptId, apiName) {
  const opening = '<script id="' + scriptId + '">';
  const start = page.indexOf(opening);
  assert(start >= 0, 'Missing parent layer ' + scriptId);
  assert.equal(page.indexOf(opening, start + opening.length), -1, 'Duplicate parent layer ' + scriptId);
  const end = page.indexOf('</script>', start);
  assert(end > start, 'Unterminated parent layer ' + scriptId);
  const body = page.slice(start + opening.length, end);
  const window = {};
  vm.runInNewContext(body, {
    window, document: {getElementById: () => null}, URL,
    location: {href: ORIGIN + '/v/Coates-GC500-2026', origin: ORIGIN}
  }, {filename: scriptId, timeout: 5000});
  assert.equal(typeof window[apiName]?.mount, 'function', 'Actual layer mount must exist');
  return window[apiName];
}

function attempt(layer, frameApi, scripts, options = {}) {
  const win = {drawMarks() {}, screenToSource() {}, sheetToDevice() {}, northOnSheet() {}};
  if (options.already) win[frameApi] = {};
  if (options.missingFunction) delete win.drawMarks;
  let injections = 0;
  const doc = {
    URL: options.url || ORIGIN + '/w/Coates-GC500-2026/explorer/index.html',
    readyState: options.loading ? 'loading' : 'complete',
    querySelectorAll: () => scripts.map(src => ({getAttribute: () => src})),
    getElementById: () => options.missingDom ? null : {},
    createElement: () => ({}),
    // This test exercises the parent guard, not the injected equipment renderer.
    head: {appendChild() { injections++; win[frameApi] = {}; }}
  };
  return {ok: layer.mount({contentDocument: doc, contentWindow: win}), injections};
}

try {
  for (const [scriptId, apiName, frameApi] of [
    ['shapes1060-script', 'gc500ShapeLayer1060', 'GC500Shape1060'],
    ['spot1117-script', 'gc500SpotLayer1117', 'GC500Spot1117']
  ]) {
    const original = loadLayer(base, scriptId, apiName);
    const patched = loadLayer(candidate, scriptId, apiName);
    const baseline = attempt(original, frameApi, CURRENT);
    assert.equal(baseline.ok, false, scriptId + ': baseline reproduces rejection of v12.85');
    assert.equal(baseline.injections, 0, scriptId + ': rejected baseline never injects');

    const cases = [
      ['current', CURRENT, {}, true],
      ['previous', previous, {}, true],
      ['mixed', CURRENT.map((s, i) => i === 0 ? previous[0] : s), {}, false],
      ['unknown', CURRENT.map((s, i) => i === 0 ? s.replace('641db3a7b324', 'aaaaaaaaaaaa') : s), {}, false],
      ['extra', [...CURRENT, 'extra.js?v=123'], {}, false],
      ['missing', CURRENT.slice(1), {}, false],
      ['reordered', [CURRENT[1], CURRENT[0], ...CURRENT.slice(2)], {}, false],
      ['foreign origin', CURRENT, {url: 'https://elsewhere.example/explorer/index.html'}, false],
      ['wrong path', CURRENT, {url: ORIGIN + '/explorer/other.html'}, false],
      ['loading', CURRENT, {loading: true}, false],
      ['missing DOM', CURRENT, {missingDom: true}, false],
      ['missing function', CURRENT, {missingFunction: true}, false],
      ['unknown already mounted', CURRENT.map(s => s + 'x'), {already: true}, false],
      ['current already mounted', CURRENT, {already: true}, true],
      ['prior1064', prior1064, {}, scriptId === 'shapes1060-script'],
      ['prior1060', prior1060, {}, scriptId === 'shapes1060-script']
    ];
    for (const [name, scripts, options, expected] of cases) {
      const observed = attempt(patched, frameApi, scripts, options);
      const label = scriptId + ': ' + name;
      assert.equal(observed.ok, expected, label);
      assert.equal(observed.injections, expected && !options.already ? 1 : 0, label + ' injection count');
      result.cases.push({layer: scriptId, case: name, passed: true});
    }
  }
  assert.equal(result.cases.length, 32);
  result.passed = true;
} catch (error) {
  result.passed = false;
  result.failure = String(error.message).slice(0, 300);
  process.exitCode = 1;
} finally {
  fs.mkdirSync(OUT, {recursive: true});
  fs.writeFileSync(path.join(OUT, 'guard-review1286.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({passed: result.passed, cases: result.cases.length, candidateSha256: result.candidateSha256, failure: result.failure}));
}
