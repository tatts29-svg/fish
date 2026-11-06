/* Author: Andrew Fisher. Actual pumpVT code, controlled network/decode promises and a fake clock. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const sourcePath = process.argv[2];
assert(sourcePath, 'Usage: node test_tiles1064.cjs /private/path/to/current/explorer.js');
const original = fs.readFileSync(sourcePath, 'utf8');
const transformer = path.join(__dirname, 'patch_tiles1064.py');
const patched = spawnSync('python3', [transformer, sourcePath], {encoding: 'utf8', maxBuffer: 4e6});
assert.equal(patched.status, 0, patched.stderr);
const current = patched.stdout;

function sliceOnce(text, start, end) {
  assert.equal(text.split(start).length, 2, 'unique start');
  const at = text.indexOf(start), to = text.indexOf(end, at);
  assert(to > at, 'end exists');
  return text.slice(at, to);
}
function tileCode(text) {
  return sliceOnce(text, 'function requestVT(', '/* a packed level file');
}
const flush = async () => { for (let n = 0; n < 20; n++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return {promise, resolve, reject};
}
function bitmap() { return {closed: 0, close() { this.closed++; }}; }

function harness(text, options = {}) {
  let now = 0, timerID = 0;
  const timers = new Map(), requests = [], decodes = [], warnings = [], drops = [];
  const c = {
    ready: true, firstSharp: false, interacting: false, zAnim: null, sceneReady: true,
    shown887: () => true, under3d: () => false, pyrHas: () => true,
    PHONE: false, VT: 512, dpr: 1, camera: {z: 17}, perf: {},
    vtQueue: new Map(), vtInflight: new Map(), vtWanted: new Set(), vtGoal: new Set(),
    vtiles: new Map(), vtRetry: new Map(), vtBusy: 0, svgBusy: 0,
    PYR: {packed: options.packed !== false}, AbortController, DOMException,
    performance: {now: () => now},
    console: {warn: (...args) => warnings.push(args)},
    setTimeout(fn, ms) { const id = ++timerID; timers.set(id, {at: now + ms, fn}); return id; },
    clearTimeout(id) { timers.delete(id); },
    paints: 0, requestPaint() { c.paints++; }, evictVT() {},
    dropLevelFile: L => drops.push(L),
    vtKey: (m, L, x, y) => [m, L, x, y].join('|'),
    ensureScene: () => Promise.resolve(),
    fetchVT(q, signal) {
      const d = deferred(); requests.push({...d, q, signal});
      if (options.fetch) return options.fetch(q, signal, d);
      return d.promise;
    },
    createImageBitmap(b) {
      const d = deferred(); decodes.push({...d, blob: b});
      if (options.decode) return options.decode(b, d);
      const bm = bitmap(); d.resolve(bm); return d.promise;
    },
    svgFromWorker: () => { throw new Error('unexpected SVG path'); },
    rasterSvg: () => { throw new Error('unexpected SVG decode'); }
  };
  vm.createContext(c); vm.runInContext(tileCode(text), c);
  const key = x => c.vtKey('vt', 0, x, 0);
  return {
    c, requests, decodes, warnings, drops, timers, key,
    queue(x) { c.requestVT(0, x, 0, x, false); },
    start() { c.pumpVT(); },
    response(i, status = 200, blob = Promise.resolve({id: i})) {
      requests[i].resolve({status, ok: status >= 200 && status < 300, blob: () => blob});
    },
    get now() { return now; },
    async tick(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
      }
      now = end; await flush();
    }
  };
}

let checks = 0;
async function test(name, action) { await action(); checks++; console.log('PASS ' + name); }

(async () => {
  await test('original reproduces a permanent six-slot freeze', async () => {
    const h = harness(original); for (let x = 0; x < 7; x++) h.queue(x); h.start(); await flush();
    assert.equal(h.requests.length, 6); await h.tick(60000);
    assert.equal(h.c.vtBusy, 6); assert.equal(h.c.vtQueue.size, 1);
    assert.equal(h.requests.length, 6); assert.equal(h.c.vtRetry.size, 0);
  });
  await test('six timed-out fetches release slots, keep retryable holes and start waiting work', async () => {
    const h = harness(current); for (let x = 0; x < 7; x++) h.queue(x); h.start(); await flush();
    assert.equal(h.requests.length, 6); await h.tick(19999); assert.equal(h.c.vtBusy, 6);
    await h.tick(1); assert.equal(h.requests.length, 7); assert.equal(h.c.vtBusy, 1);
    assert.equal(h.c.vtInflight.size, 1); assert.equal(h.c.vtiles.size, 0);
    for (let x = 0; x < 6; x++) { assert(h.requests[x].signal.aborted); assert.equal(h.c.vtRetry.get(h.key(x)).at, 21000); }
    h.queue(0); assert(!h.c.vtQueue.has(h.key(0))); await h.tick(1000); h.queue(0); assert(h.c.vtQueue.has(h.key(0)));
    h.start(); await flush(); assert.equal(h.requests.length, 8); assert.equal(h.c.vtBusy, 2);
  });
  await test('a response body that never settles cannot occupy a slot after its deadline', async () => {
    const h = harness(current), body = deferred(); h.queue(1); h.start(); await flush();
    h.response(0, 200, body.promise); await flush(); assert.equal(h.decodes.length, 0);
    await h.tick(20000); assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtiles.size, 0);
    body.resolve({id: 'late body'}); await flush(); assert.equal(h.decodes.length, 0); assert.equal(h.c.vtBusy, 0);
  });
  await test('a stuck bitmap decode releases its slot and closes a late bitmap exactly once', async () => {
    const h = harness(current, {decode: (b, d) => d.promise}); h.queue(2); h.start(); await flush();
    h.response(0); await flush(); assert.equal(h.decodes.length, 1);
    await h.tick(20000); assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtiles.size, 0);
    const bm = bitmap(); h.decodes[0].resolve(bm); await flush();
    assert.equal(bm.closed, 1); assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtiles.size, 0); assert.equal(h.c.perf.vtFetched, undefined);
  });
  await test('explicit abort releases once even when the network ignores it', async () => {
    const h = harness(current); h.queue(3); h.start(); await flush();
    h.requests[0].signal.addEventListener('abort', () => {});
    const ac = h.c.vtInflight.get(h.key(3)); ac.abort(); h.c.vtInflight.delete(h.key(3));
    assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtRetry.size, 0); ac.abort();
    await h.tick(40000); assert.equal(h.c.vtBusy, 0); assert.equal(h.timers.size, 0);
    h.requests[0].reject(new DOMException('cancelled', 'AbortError')); await flush(); assert.equal(h.c.vtBusy, 0);
  });
  await test('cancelling before network startup skips stale work and keeps the replacement slot', async () => {
    const h = harness(current); h.queue(3); h.start();
    h.c.vtInflight.get(h.key(3)).abort(); h.c.vtInflight.delete(h.key(3)); h.queue(3); h.start();
    await flush(); assert.equal(h.requests.length, 1); assert.equal(h.c.vtBusy, 1);
    assert.equal(h.c.vtInflight.size, 1); h.response(0); await flush(); assert.equal(h.c.vtBusy, 0);
  });
  await test('late failure from an old request cannot drop a level or remove its replacement', async () => {
    const h = harness(current); h.queue(4); h.start(); await flush();
    h.c.vtInflight.get(h.key(4)).abort(); h.c.vtInflight.delete(h.key(4)); h.queue(4); h.start(); await flush();
    const replacement = h.c.vtInflight.get(h.key(4)); assert.equal(h.c.vtBusy, 1);
    h.requests[0].reject(new Error('vt 404')); await flush();
    assert.equal(h.drops.length, 0); assert.equal(h.warnings.length, 0); assert.equal(h.c.vtRetry.size, 0);
    assert.equal(h.c.vtInflight.get(h.key(4)), replacement); assert.equal(h.c.vtBusy, 1);
    h.response(1); await flush(); assert.equal(h.c.vtBusy, 0); assert(h.c.vtiles.has(h.key(4)));
  });
  await test('late cancelled bitmap cannot replace new pixels or clear new retry history', async () => {
    const h = harness(current, {decode: (b, d) => d.promise}); h.queue(5); h.start(); await flush(); h.response(0); await flush();
    h.c.vtInflight.get(h.key(5)).abort(); h.c.vtInflight.delete(h.key(5)); h.queue(5); h.start(); await flush();
    h.response(1, 503); await flush(); const retry = h.c.vtRetry.get(h.key(5));
    const bm = bitmap(); h.decodes[0].resolve(bm); await flush();
    assert.equal(bm.closed, 1); assert.equal(h.c.vtRetry.get(h.key(5)), retry); assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtiles.size, 0);
  });
  await test('network retry backoff remains 1, 2, 4, 8, 16, 30, 30 seconds and success resets it', async () => {
    const h = harness(current), waits = [1000, 2000, 4000, 8000, 16000, 30000, 30000];
    for (let i = 0; i < waits.length; i++) {
      h.queue(6); h.start(); await flush(); h.response(i, 500); await flush();
      const rt = h.c.vtRetry.get(h.key(6)); assert.equal(rt.n, i + 1); assert.equal(rt.at - h.now, waits[i]);
      assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtiles.size, 0); h.queue(6); assert.equal(h.c.vtQueue.size, 0);
      await h.tick(waits[i]);
    }
    h.queue(6); h.start(); await flush(); h.response(7); await flush();
    assert.equal(h.c.vtRetry.size, 0); assert.equal(h.c.perf.vtFetched, 1); assert.equal(h.c.vtBusy, 0);
  });
  await test('packed missing levels and ignored ranges keep their existing fallback', async () => {
    for (const cause of [404, 410, 'vt range not honoured']) {
      const h = harness(current); h.queue(7); h.start(); await flush();
      if (typeof cause === 'number') h.response(0, cause); else h.requests[0].reject(new Error(cause));
      await flush(); assert.deepEqual(h.drops, [0]); assert.equal(h.c.vtRetry.size, 0); assert.equal(h.c.vtiles.size, 0); assert.equal(h.c.vtBusy, 0);
    }
  });
  await test('only manifest omissions and unpacked 404 responses become empty tiles', async () => {
    for (const kind of ['manifest', 'unpacked']) {
      const h = harness(current, {packed: kind !== 'unpacked'}); h.queue(8); h.start(); await flush();
      if (kind === 'manifest') h.requests[0].resolve(null); else h.response(0, 404);
      await flush(); assert.equal(h.c.vtiles.get(h.key(8)).empty, true); assert.equal(h.decodes.length, 0);
      assert.equal(h.c.vtBusy, 0); assert.equal(h.drops.length, 0); assert.equal(h.c.vtRetry.size, 0);
    }
  });
  await test('successful tiles keep pixels, release their timer and are counted once', async () => {
    const bm = bitmap(), h = harness(current, {decode: () => Promise.resolve(bm)});
    h.queue(9); h.start(); await flush(); h.response(0); await flush();
    assert.equal(h.c.vtiles.get(h.key(9)).canvas, bm); assert.equal(h.c.perf.vtFetched, 1);
    assert.equal(h.c.perf.lastRender.from, 'pyramid'); assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtInflight.size, 0);
    assert.equal(h.timers.size, 0); await h.tick(30000); assert.equal(bm.closed, 0); assert.equal(h.warnings.length, 0);
  });
  await test('synchronous fetch setup exceptions also release and back off', async () => {
    const h = harness(current, {fetch() { throw new Error('network setup failed'); }}); h.queue(10); h.start(); await flush();
    assert.equal(h.c.vtBusy, 0); assert.equal(h.c.vtInflight.size, 0); assert.equal(h.c.vtRetry.get(h.key(10)).n, 1);
  });
  await test('the patch leaves all source outside the non-SVG branch byte-for-byte intact', async () => {
    const start = '    if (!svg) {', end = '    svgBusy++; vtInflight.set(q.key, null);';
    const a = original.indexOf(start, original.indexOf('function pumpVT()'));
    const b = current.indexOf(start, current.indexOf('function pumpVT()'));
    assert.equal(original.slice(0, a), current.slice(0, b));
    assert.equal(original.slice(original.indexOf(end, a)), current.slice(current.indexOf(end, b)));
    assert(current.includes('else if (vtBusy >= 6) continue;'));
    new vm.Script(current);
  });
  await test('the transformer rejects a repeated patch and missing or duplicate base blocks', async () => {
    const code = "import importlib.util,sys; s=importlib.util.spec_from_file_location('tilepatch',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.apply(sys.stdin.read())";
    const repeated = spawnSync('python3', ['-c', code, transformer], {input: current, encoding: 'utf8'});
    assert.notEqual(repeated.status, 0); assert(repeated.stderr.includes('already present'));
    const wrong = spawnSync('python3', ['-c', code, transformer], {input: original.replace('fetchVT(q, ac.signal).then(r =>', 'fetchVT(q, ac.signal).then(changed =>'), encoding: 'utf8'});
    assert.notEqual(wrong.status, 0); assert(wrong.stderr.includes('found 0'));
    const block = sliceOnce(original, '    if (!svg) {', '    svgBusy++; vtInflight.set(q.key, null);');
    const duplicate = spawnSync('python3', ['-c', code, transformer], {input: original + block, encoding: 'utf8'});
    assert.notEqual(duplicate.status, 0); assert(duplicate.stderr.includes('found 2'));
  });
  console.log(`PASS ${checks} tile recovery regression scenarios`);
})().catch(e => { console.error(e); process.exitCode = 1; });
