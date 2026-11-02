/* Author: Andrew Fisher. Execute actual startup functions with controlled dependencies.
   No service/provider requests or record writes. These are ordering/failure checks,
   not a simulation of 3D imagery performance or image quality. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const page = fs.readFileSync(process.argv[2], 'utf8');
const between = (start, end) => {
  const a = page.indexOf(start), b = page.indexOf(end, a);
  assert(a >= 0 && b > a, 'required actual function bounds');
  return page.slice(a, b);
};
const source = between('async function key(signal1285)', '/* Auto:') + '\n' +
  between('async function boot()', 'function perfText()');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((r, j) => { resolve = r; reject = j; });
  return {promise, resolve, reject};
};
const tick = () => new Promise(r => setImmediate(r));
function harness() {
  const library = deferred(), response = deferred(), events = [], problems = [];
  const listeners = new Map(), timers = new Map(); let next = 0, requestSignal;
  const context = {
    URLSearchParams, AbortController, Promise, DDC: null, PHONE: true, LOWPOWER: true,
    terminalProblem813: null, graphicsLost813: false, bootPhase813: 'library', bootTimer813: 0,
    viewer: null, tileset: null, location: {pathname: '/w/Coates-GC500-2026/poc3d/index.html', search: '?embed=1'},
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); }
    },
    setTimeout(fn, ms) { const id = ++next; timers.set(id, {fn, ms}); return id; },
    clearTimeout(id) { timers.delete(id); },
    $: () => ({textContent: ''}),
    loadCesiumLibrary: () => { events.push('library-start'); return library.promise; },
    fetch: (_url, opts) => {
      events.push('access-start'); requestSignal = opts.signal;
      return new Promise((resolve, reject) => {
        const abort = () => { events.push('access-abort'); reject(new Error('aborted')); };
        if (opts.signal.aborted) return abort();
        opts.signal.addEventListener('abort', abort, {once: true});
        response.promise.then(resolve, reject).finally(() => opts.signal.removeEventListener('abort', abort));
      });
    },
    bootProblem813: kind => { problems.push(kind); context.clearTimeout(context.bootTimer813); },
    Cesium: {
      DistanceDisplayCondition: function () {},
      Color: {fromCssColorString: value => value},
      Viewer: function () {
        events.push('viewer-start');
        return {canvas: {addEventListener() {}}, scene: {renderError: {addEventListener() {}},
          globe: {}, skyAtmosphere: {}, fog: {}, postProcessStages: {fxaa: {}},
          screenSpaceCameraController: {}, shadowMap: {}}};
      },
      Cesium3DTileset: {fromUrl: () => {
        events.push('provider-start');
        // Stop here: the check concerns prerequisites and cancellation, not Cesium rendering.
        return Promise.reject(new Error('end of controlled provider boundary'));
      }}
    }
  };
  vm.createContext(context); vm.runInContext(source, context);
  return {context, events, problems, library, response, timers, listeners,
    signal: () => requestSignal,
    boot: () => vm.runInContext('boot()', context),
    accessOK: () => response.resolve({ok: true, json: async () => ({google: {key: 'AIza_test_only'}})}),
    leave: () => listeners.get('pagehide')?.()};
}
(async () => {
  const checks = [];
  {
    const h = harness(), job = h.boot();
    assert.deepEqual(h.events, ['access-start', 'library-start']);
    h.accessOK(); await tick();
    assert(!h.events.includes('provider-start'));
    h.library.resolve(); await job;
    assert.deepEqual(h.events, ['access-start', 'library-start', 'viewer-start', 'provider-start']);
    assert.equal(h.problems.at(-1), 'imagery');
    assert(!h.listeners.has('pagehide'));
    checks.push('access and library start together; provider waits for both');
  }
  {
    const h = harness(), job = h.boot(); h.library.resolve(); await tick();
    assert(!h.events.includes('provider-start')); h.accessOK(); await job;
    assert(h.events.includes('provider-start'));
    checks.push('library-first completion still waits for access');
  }
  {
    const h = harness(), job = h.boot(); h.library.reject(new Error('CDN failed')); await job; await tick();
    assert(h.signal().aborted); assert(h.events.includes('access-abort'));
    assert(!h.events.includes('provider-start')); assert.deepEqual(h.problems, ['library']);
    assert(!h.listeners.has('pagehide'));
    checks.push('failed library cancels pending access and never opens provider');
  }
  {
    const h = harness(), job = h.boot(); h.response.resolve({ok: false}); await tick();
    h.library.resolve(); await job;
    assert(!h.events.includes('viewer-start')); assert.deepEqual(h.problems, ['access']);
    checks.push('access rejection remains an access error without provider request');
  }
  {
    const h = harness(), job = h.boot(); h.leave(); await tick();
    assert(h.signal().aborted); h.library.resolve(); await job;
    assert(!h.events.includes('viewer-start')); assert.deepEqual(h.problems, []);
    checks.push('pagehide plus late library completion cannot start a scene');
  }
  {
    const h = harness(), job = h.boot(); h.library.resolve(); await tick(); h.leave(); await job;
    assert(h.signal().aborted); assert(!h.events.includes('viewer-start')); assert.deepEqual(h.problems, []);
    checks.push('pagehide during access join cancels the scene');
  }
  {
    const h = harness(), job = h.boot();
    const timer = [...h.timers.values()].find(t => t.ms === 20000); assert(timer); timer.fn();
    await tick(); h.library.resolve(); await job;
    assert(h.signal().aborted); assert.deepEqual(h.problems, ['access']);
    assert(!h.events.includes('provider-start'));
    checks.push('existing access timeout remains bounded and prevents provider use');
  }
  console.log(JSON.stringify({author: 'Andrew Fisher', passed: checks.length, checks, networkRequests: 0, recordWrites: 0}, null, 2));
})().catch(err => { console.error(err); process.exitCode = 1; });
