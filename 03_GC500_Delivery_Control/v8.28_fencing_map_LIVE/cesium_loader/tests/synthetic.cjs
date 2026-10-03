// Author: Andrew Fisher. Exact candidate inline code with synthetic DOM/CDN/graphics.
// No browser, network, credentials, real provider session or service writes.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
// Explicit input and optional report paths keep private HTML/results outside this package.
const candidate = process.argv[2], reportPath = process.argv[3];
if (!candidate) throw new Error('Usage: node tests/synthetic.cjs PRIVATE_CANDIDATE.html [PRIVATE_REPORT.json]');
const html = fs.readFileSync(candidate, 'utf8');
if (crypto.createHash('sha256').update(html).digest('hex') !== 'c463bf4afaa37c28a2b78e83e1c7461e569dea88a2f890948060b8af7e0a35ba') throw new Error('Expected the exact reviewed library candidate');
function saveReport(report) {
  if (!reportPath) return;
  fs.mkdirSync(path.dirname(path.resolve(reportPath)), {recursive: true});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}
const inline = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]);
const main = inline.find(x => x.includes('async function boot()'));
const checks = [];
function check(name, pass) {
  checks.push({name, pass: !!pass});
  if (!pass) throw new Error(name);
}
async function flush() { for (let i = 0; i < 8; i++) await new Promise(setImmediate); }

function setup(options = {}) {
  const calls = {scripts: [], keys: 0, viewers: 0, imagery: 0, ready: 0, failed: 0, reloads: 0, destroyed: 0, conditions: [], parentStops: 0};
  const timers = new Map(), windowEvents = new Map(), elements = new Map(), graphicEvents = {};
  let timerId = 0;
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {hidden: id === 'retry3d813', disabled: false, textContent: '',
        classList: {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle() {}},
        addEventListener() {}, setAttribute() {}, click() { if (!this.disabled && this.onclick) this.onclick(); }});
    }
    return elements.get(id);
  }
  const event = {addEventListener() {}};
  const tile = {tileFailed: event, tileLoad: event, allTilesLoaded: event, loadProgress: event, destroy() { calls.destroyed++; }};
  const fakeCesium = {
    DistanceDisplayCondition: function(near, far) { calls.conditions.push([near, far]); this.near = near; this.far = far; },
    Viewer: function(id, viewerOptions) {
      calls.viewers++; calls.viewerOptions = viewerOptions;
      if (options.graphicsFails) throw new Error('synthetic graphics failure');
      return {useDefaultRenderLoop: true, canvas: {addEventListener(name, cb) { graphicEvents[name] = cb; }},
        scene: {globe: {}, skyAtmosphere: {}, fog: {}, postProcessStages: {fxaa: {}}, screenSpaceCameraController: {},
          primitives: {add() {}}, postRender: event, renderError: {addEventListener(cb) { graphicEvents.renderError = cb; }}, requestRender() {}},
        camera: {changed: event, cancelFlight() { calls.parentStops++; }}};
    },
    Cesium3DTileset: {fromUrl: async () => { calls.imagery++; if (options.imageryPromise) return options.imageryPromise; if (options.imageryFails) throw new Error('synthetic imagery failure'); return tile; }},
    Color: {fromCssColorString: () => ({})},
    ScreenSpaceEventHandler: function() { this.setInputAction = () => {}; },
    ScreenSpaceEventType: {LEFT_CLICK: 1}
  };
  const context = {
    console, navigator: {userAgent: options.phone ? 'Android' : 'Desktop', maxTouchPoints: 0},
    matchMedia: q => ({matches: options.phone && q.includes('900px')}),
    performance: {now: () => 1}, URLSearchParams, AbortController, Date, Promise,
    location: {search: '?embed=1', pathname: '/synthetic-no-access-token', reload: () => { calls.reloads++; }},
    setTimeout(cb, ms) { const id = ++timerId; timers.set(id, {cb, ms}); return id; },
    clearTimeout: id => timers.delete(id), setInterval() { return 1; },
    addEventListener(name, cb) { if (!windowEvents.has(name)) windowEvents.set(name, new Set()); windowEvents.get(name).add(cb); },
    removeEventListener(name, cb) { windowEvents.get(name)?.delete(cb); },
    fetch: async url => {
      if (url !== '/api/map-key') throw new Error('Unexpected synthetic request: ' + url);
      calls.keys++;
      return {ok: !options.accessFails, json: async () => ({google: {key: 'AIzaSyntheticOfflineFixtureOnly'}})};
    },
    document: {
      hidden: false, body: element('body'), getElementById: element,
      querySelectorAll: () => [], addEventListener() {},
      createElement(tag) {
        if (tag !== 'script') throw new Error('Unexpected pre-library element: ' + tag);
        return {removed: false, remove() { this.removed = true; }};
      },
      head: {appendChild(script) { calls.scripts.push(script); if (options.appendFails) throw new Error('synthetic append failure'); }}
    },
    parent: {gc500Explorer3DReady813() { calls.ready++; }, gc500Explorer3DFailed813() { calls.failed++; }}
  };
  context.window = context;
  if (options.preloaded) context.Cesium = fakeCesium;
  vm.createContext(context);
  // Execute the complete production inline controller before fulfilling its CDN request.
  // Graphics-dependent helpers are replaced only after startup reached the real await.
  vm.runInContext(main, context);
  vm.runInContext('applyQuality = () => {}; fly = () => {}; loadPins = async () => {};', context);
  return {calls, timers, elements, graphicEvents, context, tile, fakeCesium,
    get script() { return calls.scripts[0]; }, element,
    load() { context.Cesium = fakeCesium; this.script.onload(); },
    fire(ms) { const selected = [...timers].filter(([, t]) => t.ms === ms); for (const [id, t] of selected) { timers.delete(id); t.cb(); } return selected.length; },
    hide() { for (const cb of [...(windowEvents.get('pagehide') || [])]) cb(); },
    read(expr) { return vm.runInContext(expr, context); }
  };
}

(async () => {
  inline.forEach((js, i) => { new vm.Script(js, {filename: 'inline-' + i}); check('inline script ' + i + ' parses', true); });
  let q = setup();
  check('complete controller starts without Cesium or a top-level exception', q.calls.scripts.length === 1 && q.read('DDC') === null);
  check('recovery is wired before library completion', typeof q.element('retry3d813').onclick === 'function' && typeof q.context.GC500_3D === 'object');
  check('library wait does not request access or create a scene', q.calls.keys === 0 && q.calls.viewers === 0 && q.calls.imagery === 0);
  check('owned request is async and preserves exact CDN version', q.script.async === true && q.script.src === 'https://cdn.jsdelivr.net/npm/cesium@1.131.0/Build/Cesium/Cesium.js');
  check('concurrent loader callers share one promise and request', q.read('loadCesiumLibrary() === loadCesiumLibrary()') && q.calls.scripts.length === 1);
  q.load(); await flush();
  check('normal load opens access, scene and imagery exactly once', q.calls.keys === 1 && q.calls.viewers === 1 && q.calls.imagery === 1);
  check('normal completion publishes native readiness once', q.context.__ready === true && q.context.__bootError === null && q.calls.ready === 1);
  check('native loader and retry hide on normal success', q.element('loader').classList.contains('done') && q.element('retry3d813').hidden);
  check('desktop label distances retain original values', JSON.stringify(q.calls.conditions) === JSON.stringify([[0, 650], [0, 1500], [0, 1e7]]));
  check('success detaches CDN callbacks and deadlines', q.script.onload === null && q.script.onerror === null && q.timers.size === 0);
  q.hide(); await flush();
  check('completed library attempt ignores later pagehide', q.context.__ready === true && q.calls.failed === 0);

  q = setup({phone: true}); q.load(); await flush();
  check('phone label distances retain original values', JSON.stringify(q.calls.conditions) === JSON.stringify([[0, 450], [0, 1500], [0, 1e7]]));
  q = setup({preloaded: true}); await flush();
  check('existing library starts normally without another CDN request', q.calls.scripts.length === 0 && q.calls.keys === 1 && q.context.__ready === true);

  q = setup(); const errorScript = q.script;
  errorScript.onerror(); await flush();
  check('CDN error uses existing library recovery text and Retry', q.context.__bootError === 'library' && q.element('loadText').textContent.includes('viewer could not load') && !q.element('retry3d813').hidden);
  check('CDN error clears native and parent readiness', q.context.__ready === false && q.calls.failed === 1 && q.calls.ready === 0);
  check('CDN error sends no access or imagery request', q.calls.keys === 0 && q.calls.viewers === 0 && q.calls.imagery === 0);
  check('CDN error cleans request and deadline without automatic retry', errorScript.removed && errorScript.onload === null && errorScript.onerror === null && q.timers.size === 0 && q.calls.reloads === 0 && q.calls.scripts.length === 1);
  await q.context.loadCesiumLibrary().catch(() => {});
  check('failed loader stays failed until explicit page retry', q.calls.scripts.length === 1 && q.calls.reloads === 0);
  q.element('retry3d813').click(); q.element('retry3d813').click();
  check('existing explicit Retry reloads once and disables repeated user clicks', q.calls.reloads === 1 && q.element('retry3d813').disabled);
  const retryPage = setup(); retryPage.load(); await flush();
  check('fresh retry document starts exactly one normal session', retryPage.calls.scripts.length === 1 && retryPage.calls.keys === 1 && retryPage.calls.imagery === 1 && retryPage.context.__ready === true);

  q = setup(); const lateLoad = q.script.onload, lateError = q.script.onerror;
  check('stalled library has a bounded 30-second deadline', q.fire(30000) === 1);
  await flush();
  check('stalled library exposes Retry without map access', q.context.__bootError === 'library' && !q.element('retry3d813').hidden && q.calls.keys === 0 && q.calls.reloads === 0);
  q.context.Cesium = q.fakeCesium; lateLoad(); lateError(); await flush();
  check('late callbacks after timeout cannot resurrect native readiness', q.context.__ready === false && q.calls.ready === 0 && q.calls.failed === 1 && q.calls.keys === 0 && q.calls.viewers === 0 && q.calls.imagery === 0);
  await q.context.loadCesiumLibrary().catch(() => {});
  check('late global library does not bypass failed attempt ownership', q.calls.keys === 0 && q.calls.scripts.length === 1);

  q = setup(); q.script.onload(); await flush();
  check('load event without a Cesium global fails usefully', q.context.__bootError === 'library' && q.calls.keys === 0 && !q.element('retry3d813').hidden);
  q = setup({appendFails: true}); await flush();
  check('blocked script insertion cleans up and offers existing Retry', q.context.__bootError === 'library' && q.timers.size === 0 && q.script.removed && q.calls.keys === 0);
  q = setup(); const afterHide = q.script.onload; q.hide(); await flush(); q.context.Cesium = q.fakeCesium; afterHide(); await flush();
  check('page exit cancels pending library ownership without opening access', q.calls.keys === 0 && q.calls.viewers === 0 && q.calls.imagery === 0 && q.script.removed && q.timers.size === 0);

  q = setup({accessFails: true}); q.load(); await flush();
  check('existing access failure still classifies correctly', q.context.__bootError === 'access' && q.calls.keys === 1 && q.calls.viewers === 0 && q.calls.reloads === 0);
  q = setup({graphicsFails: true}); q.load(); await flush();
  check('existing graphics failure still classifies correctly', q.context.__bootError === 'graphics' && q.calls.viewers === 1 && q.calls.imagery === 0);
  q = setup({imageryFails: true}); q.load(); await flush();
  check('existing imagery failure still classifies correctly', q.context.__bootError === 'imagery' && q.calls.imagery === 1 && q.calls.reloads === 0);
  let resolveImagery;
  const imageryPromise = new Promise(resolve => { resolveImagery = resolve; });
  q = setup({imageryPromise}); q.load(); await flush(); q.fire(30000); await flush();
  check('existing runtime slow warning remains nonterminal', q.context.__bootError === 'slow' && q.calls.imagery === 1 && q.calls.reloads === 0);
  resolveImagery(q.tile); await flush();
  check('late imagery after runtime warning still recovers normally', q.context.__ready === true && q.context.__bootError === null && q.calls.ready === 1 && q.calls.imagery === 1);
  q.graphicEvents.webglcontextlost({preventDefault() {}});
  check('existing context loss invalidates ready and offers manual Retry', q.context.__ready === false && q.context.__bootError === 'context' && !q.element('retry3d813').hidden && q.calls.reloads === 0);

  const report = {author: 'Andrew Fisher', candidateSha256: crypto.createHash('sha256').update(html).digest('hex'),
    scope: 'Complete production inline controller initialization; native library/recovery/access/boot code with synthetic DOM, timers and graphics. Graphics helpers are stubbed after the library await. No browser, real network, credentials or writes.',
    total: checks.length, passed: checks.filter(x => x.pass).length, checks};
  saveReport(report);
  console.log(JSON.stringify({passed: report.passed, total: report.total, candidateSha256: report.candidateSha256}));
})().catch(error => {
  saveReport({author: 'Andrew Fisher', error: error.message, checks});
  console.error(error.message); process.exitCode = 1;
});
