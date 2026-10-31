/* Author: Andrew Fisher. Synthetic offline candidate regression matrix; no network or application writes. */
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const assert = require('assert/strict');

const REF = 'SYNTHETIC-REF', OTHER = 'SYNTHETIC-OTHER';
const A = 'synthetic|A', B = 'synthetic|B';
const EARLY = '2026-01-01T10:00:00.000Z', LATE = '2026-01-01T10:01:00.000Z';
const DAY = '2026-01-02T09:00:00+10:00';
const clone = x => JSON.parse(JSON.stringify(x));
const ready = (on, at, by) => ({on, at, by, why: ''});
const booking = (at, set, by) => ({at, set, by, note: ''});
const rh = (unit, on, at, by) => ({unit, ready: on, at, by});
const ph = (unit, pickup, at, by) => ({unit, pickup, at, by});
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const same = (a, b, message) => assert.deepEqual(sorted(clone(a)), sorted(clone(b)), message);

function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--candidate', '--expect-sha'].includes(argv[i]) || !argv[i + 1] || out[argv[i]]) {
      throw new Error('Usage: node candidate_sync_matrix.cjs --candidate <candidate.html> [--expect-sha <sha256>]');
    }
    out[argv[i]] = argv[i + 1];
  }
  if (!out['--candidate']) throw new Error('--candidate is required.');
  if (out['--expect-sha'] && !/^[a-f0-9]{64}$/.test(out['--expect-sha'])) throw new Error('Invalid expected SHA-256.');
  return out;
}

function extractFunction(html, name) {
  const starts = [...html.matchAll(new RegExp('^function ' + name + '\\(', 'gm'))];
  if (starts.length !== 1) throw new Error('Expected one native function: ' + name);
  const tail = html.slice(starts[0].index);
  const next = /\nfunction [A-Za-z_$][\w$]*\(/.exec(tail);
  if (!next) throw new Error('Native function boundary not found: ' + name);
  const source = tail.slice(0, next.index);
  new vm.Script(source, {filename: 'candidate-native-' + name});
  return source;
}

function extract(html) {
  const modules = [...html.matchAll(/<script\b[^>]*\bid=["']singles1238-script["'][^>]*>([\s\S]*?)<\/script>/g)];
  if (modules.length !== 1) throw new Error('Expected one candidate Singles1238 script.');
  const footers = [...html.matchAll(/\+' · (v\d+\.\d+)'; \/\* v8\.19 release922/g)];
  if (footers.length !== 1) throw new Error('Expected one native release footer.');
  const names = ['docIdOf', 'toDocs', 'fromDocs', 'syncPush', 'syncStage', 'syncStageLive', 'syncFold'];
  return {module: modules[0][1], native: names.map(name => extractFunction(html, name)).join('\n'), names, footer: footers[0][1]};
}

function wire(record) {
  const out = {[OTHER]: {_k: OTHER, note: 'unrelated reference'}};
  if (record !== undefined) out[REF] = {...clone(record), _k: REF};
  return out;
}

function run(source, fixture) {
  const timers = new Map();
  let nextTimer = 1, networkAttempts = 0, cacheChanges = 0;
  const current = {[OTHER]: {note: 'unrelated reference'}};
  if (fixture.local !== undefined) current[REF] = clone(fixture.local);
  const queue = fixture.deleted ? {[REF]: null} : fixture.queued ? {[REF]: {...clone(fixture.local), _k: REF}} : {};
  const beforeQueue = clone(queue);
  const context = {
    document: {addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; }},
    S: {delivery: current}, VER: 0,
    SYNC: {on: true, db: {doc() { networkAttempts++; throw new Error('Network write refused.'); }}, readonly: !!fixture.view,
      first: new Set(['delivery']), last: {}, queue: {delivery: queue}, inflight: {}, timer: null},
    setTimeout(fn, delay = 0) { const id = nextTimer++; timers.set(id, {fn, delay}); return id; },
    clearTimeout(id) { timers.delete(id); },
    syncSend() { networkAttempts++; throw new Error('Native sender must not run in this matrix.'); },
    syncFooter() {}, sharedCache975() { cacheChanges++; },
    fetch() { networkAttempts++; throw new Error('Network access refused.'); },
    console
  };
  context.window = context;
  context.SYNC_COLLS = {delivery: {kind: 'map', get: () => context.S.delivery, set: value => { context.S.delivery = value; }}};
  vm.createContext(context);
  vm.runInContext(source.module + '\n' + source.native, context, {timeout: 1000});
  assert.equal(typeof context.Singles1238?.keepUnits, 'function', 'Candidate lacks Singles1238.keepUnits.');
  const incoming = wire(fixture.remote), incomingBefore = clone(incoming);
  context.syncFold('delivery', incoming);
  // Run only immediate repair callbacks. Native sender timers remain inert.
  for (let pass = 0; pass < 10; pass++) {
    const due = [...timers.entries()].filter(([, t]) => t.delay === 0);
    if (!due.length) break;
    for (const [id, timer] of due) { timers.delete(id); timer.fn(); }
    if (pass === 9) throw new Error('Immediate repair callbacks did not settle.');
  }
  context.syncStage(); // Inspect exactly what the native next send would stage; never run its sender.
  assert.equal(networkAttempts, 0, 'No sender or network call may run.');
  same(incoming, incomingBefore, 'Caller-owned incoming documents must not be mutated.');
  same(context.S.delivery[OTHER], {note: 'unrelated reference'}, 'Unrelated references must be preserved.');
  const result = {
    moduleRelease: context.Singles1238.release,
    record: context.S.delivery[REF] === undefined ? null : clone(context.S.delivery[REF]),
    queued: context.SYNC.queue.delivery[REF] === undefined ? 'ABSENT' : clone(context.SYNC.queue.delivery[REF]),
    queueBefore: beforeQueue, queueAfter: clone(context.SYNC.queue.delivery),
    timers: timers.size, networkAttempts, cacheChanges
  };
  return result;
}

const cases = [];
function add(id, local, remote, expected, extra = {}) {
  cases.push({id, fixture: {local, remote, ...extra}, expected});
}
const readyA = {ready1238_units: {[A]: ready(true, EARLY, 'Phone A')}};
const readyB = {ready1238_units: {[B]: ready(true, LATE, 'Phone B')}};
const readyBoth = {ready1238_units: {...readyA.ready1238_units, ...readyB.ready1238_units}};
const bookA = {pickup1238_units: {[A]: booking(DAY, EARLY, 'Phone A')}};
const bookB = {pickup1238_units: {[B]: booking(DAY, LATE, 'Phone B')}};
const bookBoth = {pickup1238_units: {...bookA.pickup1238_units, ...bookB.pickup1238_units}};
add('ready.queue-empty-union', readyA, readyB, readyBoth);
add('ready.pending-queue-union', readyA, readyB, readyBoth, {queued: true});
add('booking.queue-empty-union', bookA, bookB, bookBoth);
add('booking.pending-queue-union', bookA, bookB, bookBoth, {queued: true});

const localHist = {ready1238_history: [rh(A, true, EARLY, 'Phone A')], pickup1238_history: [ph(A, DAY, EARLY, 'Phone A')]};
const remoteHist = {ready1238_history: [rh(B, true, LATE, 'Phone B')], pickup1238_history: [ph(B, DAY, LATE, 'Phone B')]};
const bothHist = {ready1238_history: [...localHist.ready1238_history, ...remoteHist.ready1238_history], pickup1238_history: [...localHist.pickup1238_history, ...remoteHist.pickup1238_history]};
add('histories.queue-empty-union', localHist, remoteHist, bothHist);
add('histories.pending-queue-union', localHist, remoteHist, bothHist, {queued: true});
add('histories.exact-duplicates-once', localHist, localHist, localHist, {queued: true});

const untick = {ready1238_units: {[A]: ready(false, LATE, 'Phone B')}};
add('ready.newer-remote-untick-queue-empty', readyA, untick, untick);
add('ready.newer-remote-untick-pending', readyA, untick, untick, {queued: true});
add('ready.newer-local-untick-pending', untick, readyA, untick, {queued: true});
const cleared = {pickup1238_units: {[A]: booking('', LATE, 'Phone B')}};
add('booking.newer-remote-clear-queue-empty', bookA, cleared, cleared);
add('booking.newer-remote-clear-pending', bookA, cleared, cleared, {queued: true});
add('booking.newer-local-clear-pending', cleared, bookA, cleared, {queued: true});

add('unrelated-fields.keep-local-pending-fields', {...readyA, note: 'local pending note'}, {...readyB, note: 'server note'}, {...readyBoth, note: 'local pending note'}, {queued: true});
add('unrelated-fields.keep-server-fields-without-queue', {...readyA, note: 'older local note'}, {...readyB, note: 'server note'}, {...readyBoth, note: 'server note'});
add('deletion.pending-null-must-not-resurrect', undefined, {...readyB, ...bookB, ...remoteHist}, null, {deleted: true});
add('new-reference.local-pending-create-retained', readyA, undefined, readyA, {queued: true});
add('view.server-wins-no-local-repair', {...readyA, ...bookA, ...localHist}, {...readyB, ...bookB, ...remoteHist}, {...readyB, ...bookB, ...remoteHist}, {view: true});
add('view.ignores-pending-local-document', readyA, readyB, readyB, {view: true, queued: true});

function main() {
  const input = options(process.argv.slice(2));
  const bytes = fs.readFileSync(input['--candidate']);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (input['--expect-sha'] && sha256 !== input['--expect-sha']) throw new Error('Candidate SHA-256 mismatch.');
  const source = extract(bytes.toString('utf8'));
  const bootstrap = run(source, {local: readyA, remote: readyB, view: true});
  const results = cases.map(test => {
    try {
      const result = run(source, test.fixture);
      same(result.record, test.expected, 'Folded record differs from required preservation result.');
      if (test.fixture.view) {
        same(result.queueAfter, result.queueBefore, 'View-only must not alter or stage a write queue.');
        assert.equal(result.timers, 0, 'View-only must not schedule a repair send.');
      } else if (test.expected === null) {
        assert.equal(result.queued, null, 'A pending deletion must remain a deletion.');
      } else if (result.queued !== 'ABSENT') {
        const staged = {...result.queued}; delete staged._k;
        same(staged, test.expected, 'Native send queue differs from the preserved record.');
      }
      return {id: test.id, ok: true};
    } catch (error) { return {id: test.id, ok: false, reason: error.message}; }
  });

  // Equal clocks with conflicting values need an explicit owner policy. Observe, but do not invent one.
  const conflict = {ready1238_units: {[A]: ready(false, EARLY, 'Phone B')}};
  const observations = [];
  for (const queued of [false, true]) {
    try {
      const result = run(source, {local: readyA, remote: conflict, queued});
      observations.push({id: queued ? 'equal-clock.pending' : 'equal-clock.queue-empty', requiresOwnerConfirmation: true, record: result.record});
    } catch (error) { observations.push({id: 'equal-clock', requiresOwnerConfirmation: true, reason: error.message}); }
  }
  const failed = results.filter(r => !r.ok).length;
  console.log(JSON.stringify({author: 'Andrew Fisher', candidateSha256: sha256, candidateFooter: source.footer,
    moduleRelease: bootstrap.moduleRelease, nativeFunctions: source.names,
    module: 'singles1238-script', synthetic: true, networkAndRecordWrites: 0,
    passed: results.length - failed, total: results.length, failed, results, observations,
    limitation: 'This proves only offline fold/stage preservation. Browser, service, multi-device and release checks remain required.'}, null, 2));
  process.exitCode = failed ? 1 : 0;
}
try { main(); } catch (error) { console.error('Matrix could not run: ' + error.message); process.exitCode = 2; }
