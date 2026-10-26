/* Author: Andrew Fisher. Offline synthetic reproduction; no network or record writes. */
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const cp = require('child_process');
const assert = require('assert/strict');

const SOURCE = '7d84b522ab249c31df647f3b02a16ee40c322c12';
const BASE_SHA256 = 'e106502b347cb51519f6aaed1eec5b6ba20a301b06490df04e3d29569d55b422';
const SOURCE_DIR = '03_GC500_Delivery_Control/v12.42_demob_cards_DRAFT/';

function args(values) {
  const out = {};
  for (let i = 0; i < values.length; i += 2) {
    const key = values[i];
    if (!['--repo', '--base'].includes(key) || !values[i + 1] || out[key]) {
      throw new Error('Usage: node queued_unit_sync_repro.cjs --repo <checkout> --base <verified-v12.41.html>');
    }
    out[key] = values[i + 1];
  }
  if (!out['--repo'] || !out['--base']) {
    throw new Error('Both --repo and --base are required.');
  }
  return out;
}

function span(source, start, end) {
  const a = source.indexOf(start);
  const b = a < 0 ? -1 : source.indexOf(end, a + start.length);
  if (a < 0 || b < 0 || source.indexOf(start, a + start.length) >= 0) {
    throw new Error('Expected unique source span was not found: ' + start);
  }
  return source.slice(a, b);
}

function main() {
  const input = args(process.argv.slice(2));
  const bytes = fs.readFileSync(input['--base']);
  const baseSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (baseSha256 !== BASE_SHA256) throw new Error('Base SHA-256 does not match the pinned v12.41 release.');
  const base = bytes.toString('utf8');
  const get = file => cp.execFileSync('git', ['show', SOURCE + ':' + SOURCE_DIR + file], {
    cwd: input['--repo'], encoding: 'utf8', maxBuffer: 32 * 1024 * 1024
  });
  const singles = get('singles1238_src.js');
  const patch = get('patch_v1242.py');
  const keep = span(singles, 'const um = ', 'let raf = 0;');
  const foldBase = span(base, 'function syncFold(name, docs){', 'function syncFirst(){');
  const additions = [...patch.matchAll(/SYNC_NEW = SYNC_OLD \+ """([\s\S]*?)"""/g)];
  if (additions.length !== 1) throw new Error('Expected one v12.42 sync hook.');
  const anchor = ' const next = fromDocs(name, shown);';
  if (foldBase.split(anchor).length !== 2) throw new Error('Expected one native sync insertion point.');
  const fold = foldBase.replace(anchor, anchor + additions[0][1]);
  const fromSource = span(base, 'function fromDocs(name, docs){', 'function syncPush(){');
  const fromEnd = fromSource.indexOf('\n}') + 2;
  if (fromEnd < 2) throw new Error('Native fromDocs function boundary was not found.');
  const fromDocs = fromSource.slice(0, fromEnd);

  const localDoc = {
    _k: 'SYNTHETIC-REF',
    ready1238_units: {'synthetic|A': {on: true, at: '2026-01-01T10:00:00.000Z', by: 'Phone A'}}
  };
  const remoteDoc = {
    _k: 'SYNTHETIC-REF',
    ready1238_units: {'synthetic|B': {on: true, at: '2026-01-01T10:01:00.000Z', by: 'Phone B'}}
  };
  const copy = value => JSON.parse(JSON.stringify(value));

  function run(queued) {
    const local = copy(localDoc);
    delete local._k;
    const context = {
      S: {delivery: {'SYNTHETIC-REF': local}},
      SYNC: {readonly: false, last: {}, queue: {delivery: queued ? {'SYNTHETIC-REF': copy(localDoc)} : {}}},
      VER: 0,
      sharedCache975() {},
      syncPush() {},
      setTimeout() { return 1; },
      console
    };
    context.SYNC_COLLS = {delivery: {
      kind: 'map', get: () => context.S.delivery, set: value => { context.S.delivery = value; }
    }};
    context.window = context;
    vm.createContext(context);
    vm.runInContext(keep + '\nthis.Singles1238 = {keepUnits};\n' + fromDocs + '\n' + fold, context);
    context.syncFold('delivery', {'SYNTHETIC-REF': copy(remoteDoc)});
    return Object.keys(context.S.delivery['SYNTHETIC-REF'].ready1238_units).sort();
  }

  const expected = ['synthetic|A', 'synthetic|B'];
  const queueEmpty = run(false);
  const queuePending = run(true);
  assert.deepEqual(queueEmpty, expected, 'The queue-empty control must retain both units.');
  const ok = JSON.stringify(queuePending) === JSON.stringify(expected);
  console.log(JSON.stringify({
    author: 'Andrew Fisher', source: SOURCE, baseSha256,
    expectedUnits: expected, queueEmpty, queuePending, ok,
    result: ok ? 'Both units retained.' : 'REPRODUCED FAILURE: the pending local document masks the incoming remote unit.'
  }, null, 2));
  process.exitCode = ok ? 0 : 1;
}

try { main(); } catch (error) {
  console.error('Reproduction could not run: ' + error.message);
  process.exitCode = 2;
}
