// Author: Andrew Fisher. Extracted request-gate checks; all I/O is synthetic.
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const dir = __dirname;
const G = require(dir + '/document_guards.cjs');
const runner = fs.readFileSync(dir + '/record_document.cjs', 'utf8');
const begin = "await context.route('**/*', async route => {";
const end = '      });\n      page = await context.newPage();';
const start = runner.indexOf(begin), finish = runner.indexOf(end, start);
assert(start >= 0 && finish > start, 'Exact apply-route source boundary is required');
const body = runner.slice(start + begin.length, finish);
const source = Buffer.from('%PDF-1.7\nSynthetic source fixture\n%%EOF\n');
const spec = {source: {name: 'Synthetic plan.pdf', bytes: source.length, sha256: G.hash(source)},
  metadata: {kind: 'map', ref: '', title: 'Synthetic plan', note: 'Planning only'}};
const HOST = 'https://fixture.invalid', OPERATOR = 'Andrew Fisher';
const beforeFiles = {files: [{id: 'existing.pdf', name: 'existing.pdf', sha256: 'a'.repeat(64)}]};
const beforeState = {version: 1, updated: '2026-01-01T00:00:00.000Z', level: 'view',
  docs: {notes: {existing: {text: 'Keep'}}}};
const template = {id: 'Synthetic_plan.pdf', name: spec.source.name, kind: 'map', ref: null,
  branch: null, invoice_no: null, title: spec.metadata.title, note: spec.metadata.note,
  bytes: source.length, sha256: spec.source.sha256, type: 'application/pdf',
  uploaded: '2026-01-02T03:04:05.000Z', by: OPERATOR};
const clone = x => JSON.parse(JSON.stringify(x));
function fixture(options = {}) {
  const counts = {forwards: 0, aborts: 0, fulfills: 0, actualNetwork: 0};
  const context = vm.createContext({
    G, URL, Buffer, Error, spec: clone(spec), source: Buffer.from(source), sourcePath: '/private/synthetic.pdf',
    HOST, OPERATOR, beforeFiles: clone(beforeFiles), beforeState: clone(beforeState),
    fs: {readFileSync: () => options.changedSource ? Buffer.from('changed') : Buffer.from(source)},
    save: () => {}, freezeNativeWriter: async () => {}, pageSha: 'unused',
    preserveNativeState: state => G.verifyNativeState(beforeState, state,
      {observedAt: '2026-01-03T00:00:00.000Z', operator: OPERATOR}),
    getJson: async endpoint => {
      if (endpoint === '/api/files') {
        const value = clone(beforeFiles);
        if (options.changedIndex) value.files.push({id: 'concurrent.pdf'});
        return value;
      }
      const value = clone(beforeState);
      if (options.changedState) value.docs.notes.existing.text = 'Concurrent change';
      if (options.concurrentPhoto) {
        const id = 'independent-photo.jpg', key = G.nativeId('photoLinks/' + id);
        value.docs.photoLinks = {[id]: {id, _k: id, ref: 'EXAMPLE', at: '2026-01-02T00:00:00.000Z', by: 'Independent operator'}};
        value.docs.stamps = {[key]: {_k: 'photoLinks/' + id, v: '2026-01-02T00:00:01.000Z'}};
        value.docs.by = {[key]: {_k: 'photoLinks/' + id, v: 'Independent operator'}};
        value.version = 4; value.updated = '2026-01-02T00:00:01.000Z';
        if (options.incompletePhoto) delete value.docs.by[key];
      }
      return value;
    },
    fetchSafe: async (url, headers, method, binary) => {
      counts.forwards++;
      assert.equal(method, 'POST'); assert.equal(url, HOST + '/api/files');
      assert(Buffer.isBuffer(binary), 'Forward the checked Buffer, never a mutable original path');
      assert.deepEqual(binary, source);
      if (options.transportFailure) throw Error('Synthetic response lost');
      const saved = clone(template);
      if (options.badMetadata) saved.note = 'Unexpected';
      return {status: options.status || 200, headers: {}, body: Buffer.from(JSON.stringify(saved))};
    }
  });
  vm.runInContext('let gate=true,attempted=false,fatal=null,saved; const requests=[]; ' +
    'const stop=message=>{gate=false;fatal=fatal||Error(message);};' +
    'const handler=async route=>{' + body + '};' +
    'globalThis.run=handler;globalThis.snapshot=()=>({gate,attempted,fatal:!!fatal,requests:requests.length});', context);
  function route(method = 'POST', endpoint = '/api/files') {
    return {
      request: () => ({
        url: () => HOST + endpoint, method: () => method, postDataBuffer: () => Buffer.from(source),
        headers: () => ({'content-type': 'application/pdf', 'x-file-name': encodeURIComponent(spec.source.name),
          'x-file-kind': 'map', 'x-file-title': encodeURIComponent(spec.metadata.title),
          'x-file-note': encodeURIComponent(spec.metadata.note), 'x-gc500-who': OPERATOR})
      }),
      fulfill: async () => { counts.fulfills++; },
      abort: async () => { counts.aborts++; },
      continue: async () => { throw Error('Unexpected bypass'); }
    };
  }
  return {run: (...args) => context.run(route(...args)), counts, snapshot: () => context.snapshot()};
}
const results = [];
async function test(name, run) {
  try { await run(); results.push({name, pass: true}); }
  catch (error) { results.push({name, pass: false, error: error.message}); }
}
(async () => {
  await test('One valid upload forwards the exact captured binary once', async () => {
    const f = fixture(); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.counts.fulfills, 1);
    assert.equal(f.snapshot().fatal, false); assert.equal(f.snapshot().gate, false);
  });
  await test('Concurrent valid requests cannot both cross the gate', async () => {
    const f = fixture(); await Promise.all([f.run(), f.run()]);
    assert(f.counts.forwards <= 1); assert.equal(f.snapshot().fatal, true);
    assert.equal(f.snapshot().gate, false);
  });
  await test('Later matching request cannot repeat an acknowledged upload', async () => {
    const f = fixture(); await f.run(); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.counts.aborts, 1);
  });
  for (const key of ['changedIndex', 'changedState', 'changedSource']) {
    await test(key + ' closes the gate before any forwarding', async () => {
      const f = fixture({[key]: true}); await f.run();
      assert.equal(f.counts.forwards, 0); assert.equal(f.snapshot().fatal, true);
      assert.equal(f.snapshot().gate, false);
    });
  }
  await test('A complete independent photo triplet preserves the single file upload', async () => {
    const f = fixture({concurrentPhoto: true}); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.snapshot().fatal, false);
  });
  await test('An incomplete concurrent photo triplet closes the upload gate', async () => {
    const f = fixture({concurrentPhoto: true, incompletePhoto: true}); await f.run();
    assert.equal(f.counts.forwards, 0); assert.equal(f.snapshot().fatal, true);
  });
  await test('Transport failure cannot trigger a second upload', async () => {
    const f = fixture({transportFailure: true}); await f.run(); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.counts.aborts, 2);
  });
  await test('Unsuccessful server response cannot trigger a second upload', async () => {
    const f = fixture({status: 500}); await f.run(); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.snapshot().fatal, true);
  });
  await test('Mismatched saved metadata fails after one attempt without retry', async () => {
    const f = fixture({badMetadata: true}); await f.run(); await f.run();
    assert.equal(f.counts.forwards, 1); assert.equal(f.snapshot().fatal, true);
  });
  await test('A native-state endpoint cannot pass the file-only gate', async () => {
    const f = fixture(); await f.run('POST', '/api/state');
    assert.equal(f.counts.forwards, 0); assert.equal(f.snapshot().fatal, true);
  });
  const failed = results.filter(x => !x.pass);
  const report = {author: 'Andrew Fisher', pass: failed.length === 0, cases: results.length,
    runnerSha256: G.hash(runner), guardsSha256: G.hash(fs.readFileSync(dir + '/document_guards.cjs')),
    testSha256: G.hash(fs.readFileSync(__filename)), actualNetworkCalls: 0, serverWrites: 0, results};
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
})();
