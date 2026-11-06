#!/usr/bin/env node
// Author: Andrew Fisher. CPU request lifecycle checks; no browser or network.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const sourcePath = arg('--source'), outputPath = arg('--output');
if (!sourcePath || !outputPath) {
  console.error('Usage: node performance813_requests.cjs --source candidate.js --output report.json');
  process.exit(2);
}
const source = fs.readFileSync(sourcePath, 'utf8');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const report = {
  author: 'Andrew Fisher', sourcePath: path.resolve(sourcePath), sourceSha256: sha(source),
  testSha256: sha(fs.readFileSync(__filename)), checkedAtUtc: new Date().toISOString(),
  scope: 'Exact extracted candidate satellite/session functions, controlled fetch and bitmap promises, and a fake clock. No browser, network or service calls.',
  limits: 'These checks cover request ownership, retry state, slot accounting and cache bounds. They do not establish rendering quality, real network behaviour or device performance.',
  checks: []
};
function take(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'Source extraction anchors changed: ' + start + ' / ' + end);
  return source.slice(a, b);
}
let definitions;
try {
  definitions = [
    take('let gKey =', 'const TILE ='),
    take('const TILE =', 'function mat('),
    take('function tileKey(', '/* the tiles of zoom z'),
    take('function retrySatellite(', 'const mosaics ='),
    take('let keyPromise =', 'function alignmentPanel(')
  ].join('\n');
  report.extractedFunctionsSha256 = sha(definitions);
} catch (e) {
  report.checks.push({name: 'Extract exact request functions', pass: false, error: String(e)});
}
async function flush(n = 40) { for (let i = 0; i < n; i++) await Promise.resolve(); }
const abortError = () => new DOMException('Synthetic intentional cancellation', 'AbortError');
function rig({phone = true, autoFail = false, honourAbort = false, autoKey = false} = {}) {
  let now = 0, serial = 0, bitmapSerial = 0;
  const timers = new Map(), requests = [], decodes = [], nodes = new Map(), storage = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {hidden: false, className: '', textContent: '', innerHTML: '', classList: {add() {}, remove() {}, contains() { return false; }}});
    return nodes.get(id);
  };
  const clock = {
    setTimeout(fn, ms = 0) { const id = ++serial; timers.set(id, {fn, at: now + Math.max(0, Number(ms) || 0)}); return id; },
    clearTimeout(id) { timers.delete(id); },
    async advance(ms) {
      const target = now + ms;
      for (let count = 0; ; count++) {
        assert(count < 10000, 'Fake timer loop did not settle');
        const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        now = due[1].at; timers.delete(due[0]); due[1].fn(); await flush();
      }
      now = target; await flush();
    }
  };
  const bitmap = label => ({label: label || 'bitmap-' + ++bitmapSerial, closed: 0, close() { this.closed++; }});
  const response = (call, status = 200, json = {}) => ({
    ok: status >= 200 && status < 300, status, headers: {get() { return null; }},
    blob: async () => ({request: call}), json: async () => json
  });
  const ctx = vm.createContext({
    PHONE: phone, console, AbortController, DOMException, URL, Promise, queueMicrotask,
    performance: {now: () => now}, Date, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
    $: node, localStorage: {getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k)},
    fetch(url, options = {}) {
      const type = String(url).includes('createSession') ? 'session' : String(url).includes('/api/map-key') ? 'key' : String(url).includes('/viewport?') ? 'copyright' : 'tile';
      let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; });
      const call = {url: String(url), options, type, resolve, reject, respond(status = 200, body = {}) { resolve(response(call, status, body)); }};
      requests.push(call);
      if (honourAbort && options.signal) {
        if (options.signal.aborted) reject(abortError());
        else options.signal.addEventListener('abort', () => reject(abortError()), {once: true});
      }
      if (type === 'copyright') call.respond(200, {});
      if (autoKey && type === 'key') call.respond(200, {google: {key: 'AIzaSyntheticFixtureOnly'}});
      if (autoFail && type === 'tile') reject(new TypeError('Synthetic network failure'));
      return promise;
    },
    createImageBitmap(blob) {
      let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; });
      decodes.push({blob, resolve, reject}); return promise;
    }
  });
  ctx.window = ctx;
  vm.runInContext(`
    const PRE = {}, once = (k, f) => PRE[k] || (PRE[k] = f());
    let mapKey = 'synthetic-mapbox', keyState = 'ok', mode = 'hybrid', ready = false, zAnim = 0, interacting = false;
    const mosaics = new Map(), perf = {tileBytes: 0, tilesFetched: 0};
    function requestPaint() {} function toast() {} function hostedToken() { return ''; }
    function changeView() {} function setSatState() {} function esc(s) { return String(s); }
    ${definitions}
    globalThis.api = {
      requestTile, cancelTiles, pruneTiles, useSource, retrySatellite, ensureGoogle, ensureKey,
      get tiles() { return tiles; }, get tries() { return tileTries; }, get queue() { return queue; },
      get inflight() { return inflight; }, get running() { return running; }, get cap() { return TILE_CAP; },
      get wanted() { return satWanted; },
      get state() { return {SOURCE, gKey, gSession, gState, keyState, mapKey}; }
    };
  `, ctx, {filename: path.resolve(sourcePath) + ':request-fixture'});
  return {
    api: ctx.api, requests, decodes, clock, bitmap,
    run: code => vm.runInContext(code, ctx),
    tiles: () => requests.filter(r => r.type === 'tile'),
    sessions: () => requests.filter(r => r.type === 'session'),
    async startTile(z = 20, x = 1, y = 1) { ctx.api.requestTile(z, x, y, 0); await flush(); return requests.filter(r => r.type === 'tile').at(-1); },
    async sessionReply(call, session = 'synthetic-session') { call.respond(200, {session, tileWidth: 512, expiry: Date.now() / 1000 + 14 * 86400}); await flush(); }
  };
}
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({name, pass: true, ...(detail ? {detail} : {})}); console.log('PASS ' + name); }
  catch (e) { report.checks.push({name, pass: false, error: String(e), stack: e.stack}); console.log('FAIL ' + name + ': ' + e.message); }
}
async function main() {
  if (!definitions) return;
  await check('Stale provider decode closes its bitmap and cannot replace a newer tile', async () => {
    const r = rig(); r.run("SOURCE='google';gSession='old-session';gKey='AIzaSyntheticFixtureOnly';gState='ok';");
    const old = await r.startTile(); old.respond(); await flush(); assert.equal(r.decodes.length, 1);
    r.api.useSource('mapbox'); const fresh = await r.startTile(); fresh.respond(); await flush(); assert.equal(r.decodes.length, 2);
    const oldBitmap = r.bitmap('stale-google'), newBitmap = r.bitmap('current-mapbox');
    r.decodes[1].resolve(newBitmap); await flush(); r.decodes[0].resolve(oldBitmap); await flush();
    assert.equal(r.api.tiles.get('20/1/1').bm, newBitmap); assert.equal(oldBitmap.closed, 1); assert.equal(newBitmap.closed, 0);
    assert.equal(r.api.running, 0); return {oldBitmapClosed: oldBitmap.closed, currentBitmapClosed: newBitmap.closed};
  });
  await check('Stale provider error cannot clear a renewed session or downgrade its source', async () => {
    const r = rig(); r.run("SOURCE='google';gSession='old-session';gKey='AIzaSyntheticFixtureOnly';gState='ok';");
    const old = await r.startTile(); r.api.useSource('mapbox'); r.run("gSession='renewed-session';gState='ok';"); r.api.useSource('google');
    old.reject(new Error('tile 403')); await flush();
    assert.equal(r.api.state.SOURCE, 'google'); assert.equal(r.api.state.gSession, 'renewed-session'); assert.equal(r.api.state.keyState, 'ok');
    assert.equal(r.api.tiles.size, 0); assert.equal(r.api.tries.size, 0);
  });
  await check('Intentional cancellation records no failed tile or retry attempt', async () => {
    const r = rig(); const old = await r.startTile(); r.api.cancelTiles(); old.reject(abortError()); await flush();
    assert.equal(r.api.running, 0); assert.equal(r.api.inflight.size, 0); assert.equal(r.api.tiles.size, 0); assert.equal(r.api.tries.size, 0);
  });
  await check('Pruning a decode in the same generation closes and rejects its late bitmap', async () => {
    const r = rig(); const old = await r.startTile(); old.respond(); await flush();
    r.api.wanted.clear(); r.api.pruneTiles(true); const bm = r.bitmap('pruned'); r.decodes[0].resolve(bm); await flush();
    assert.equal(bm.closed, 1); assert.equal(r.api.tiles.size, 0); assert.equal(r.api.tries.size, 0); assert.equal(r.api.running, 0);
  });
  for (const phone of [true, false]) await check('Failed tile and retry caches stay bounded on ' + (phone ? 'phone' : 'desktop'), async () => {
    const r = rig({phone, autoFail: true}), total = r.api.cap * 3 + 17;
    for (let x = 0; x < total; x++) r.api.requestTile(20, x, 1, x);
    await flush(total * 12);
    assert.equal(r.api.running, 0); assert.equal(r.api.queue.size, 0); assert.equal(r.tiles().length, total);
    assert(r.api.tiles.size <= r.api.cap, 'failure cache exceeded ' + r.api.cap);
    assert(r.api.tries.size <= r.api.cap * 2, 'retry metadata exceeded twice the tile cap');
    return {configuredCap: r.api.cap, failedEntries: r.api.tiles.size, retryEntries: r.api.tries.size, requests: total};
  });
  await check('Cancel releases eight hung slots immediately and late finally cannot release newer slots', async () => {
    const r = rig(); for (let x = 0; x < 8; x++) r.api.requestTile(20, x, 1, x); await flush(); const old = r.tiles().slice();
    assert.equal(r.api.running, 8); r.api.cancelTiles(); assert.equal(r.api.running, 0); assert.equal(r.api.inflight.size, 0);
    assert(old.every(q => q.options.signal.aborted));
    for (let x = 10; x < 18; x++) r.api.requestTile(20, x, 1, x); await flush(); assert.equal(r.api.running, 8);
    old.forEach(q => q.reject(abortError())); await flush(); assert.equal(r.api.running, 8); assert.equal(r.api.inflight.size, 8);
    r.api.cancelTiles(); r.tiles().slice(8).forEach(q => q.reject(abortError())); await flush(); assert.equal(r.api.running, 0);
  });
  await check('Explicit Retry immediately releases all eight pending tile slots', async () => {
    const r = rig(); for (let x = 0; x < 9; x++) r.api.requestTile(20, x, 1, x); await flush(); const old = r.tiles().slice();
    assert.equal(r.api.running, 8); r.api.retrySatellite(); assert.equal(r.api.running, 0); assert.equal(r.api.inflight.size, 0);
    assert(old.every(q => q.options.signal.aborted)); old.forEach(q => q.reject(abortError())); await flush();
    assert.equal(r.api.running, r.api.inflight.size); assert.equal(r.api.tries.size, 0);
  });
  await check('Twenty-second deadlines release pending slots and register retryable failures', async () => {
    const r = rig(); for (let x = 0; x < 9; x++) r.api.requestTile(20, x, 1, x); await flush(); const old = r.tiles().slice();
    await r.clock.advance(19999); assert.equal(r.tiles().length, 8); assert(old.every(q => !q.options.signal.aborted));
    await r.clock.advance(2); assert(old.every(q => q.options.signal.aborted)); assert.equal(r.tiles().length, 9); assert.equal(r.api.running, 1);
    for (let x = 0; x < 8; x++) { const key = '20/' + x + '/1', t = r.api.tiles.get(key); assert(t && t.err); assert(t.retryAt > 20000); assert(r.api.tries.has(key)); }
    old.forEach(q => q.reject(abortError())); await flush(); assert.equal(r.api.running, 1);
    return {timedOutRequests: old.length, nextQueuedRequestStarted: r.tiles().length === 9};
  });
  await check('Concurrent Google session callers share one request', async () => {
    const r = rig({honourAbort: true}); r.run("gKey='AIzaSyntheticFixtureOnly';gState='unknown';mapKey=null;");
    const a = r.api.ensureGoogle(), b = r.api.ensureGoogle(); await flush(); assert.equal(r.sessions().length, 1);
    await r.sessionReply(r.sessions()[0]); const values = await Promise.all([a, b]); assert(values.every(v => v === 'synthetic-session'));
    assert.equal(r.api.state.SOURCE, 'google'); assert.equal(r.api.state.gSession, 'synthetic-session');
  });
  await check('Google session 503 recovers through explicit Retry', async () => {
    const r = rig({honourAbort: true, autoKey: true}); r.run("gKey='AIzaSyntheticFixtureOnly';gState='unknown';mapKey=null;keyState='none';");
    const first = r.api.ensureGoogle(); await flush(); r.sessions()[0].respond(503); await first.catch(() => {}); await flush(); assert.equal(r.api.state.gSession, null);
    r.api.retrySatellite(); await flush(); assert.equal(r.sessions().length, 2, 'Retry did not re-arm the Google session');
    await r.sessionReply(r.sessions()[1], 'after-retry'); assert.equal(r.api.state.gSession, 'after-retry'); assert.equal(r.api.state.SOURCE, 'google');
  });
  await check('Google session deadline settles and explicit Retry can start a fresh session', async () => {
    const r = rig({honourAbort: true, autoKey: true}); r.run("gKey='AIzaSyntheticFixtureOnly';gState='unknown';mapKey=null;keyState='none';");
    let settled = false; r.api.ensureGoogle().then(() => { settled = true; }, () => { settled = true; }); await flush(); const old = r.sessions()[0];
    await r.clock.advance(19999); assert.equal(settled, false); await r.clock.advance(2); assert(old.options.signal.aborted); assert.equal(settled, true);
    r.api.retrySatellite(); await flush(); assert.equal(r.sessions().length, 2); await r.sessionReply(r.sessions()[1], 'after-timeout');
    assert.equal(r.api.state.gSession, 'after-timeout'); assert.equal(r.api.state.SOURCE, 'google');
  });
}
main().catch(e => report.checks.push({name: 'Fixture execution', pass: false, error: String(e), stack: e.stack})).finally(() => {
  report.passed = report.checks.filter(c => c.pass).length; report.total = report.checks.length;
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), {recursive: true});
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(report.passed + '/' + report.total + ' request lifecycle checks passed');
  if (report.checks.some(c => !c.pass)) process.exitCode = 1;
});
