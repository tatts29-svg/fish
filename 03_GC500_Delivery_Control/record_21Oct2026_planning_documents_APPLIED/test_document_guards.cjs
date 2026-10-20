// Author: Andrew Fisher. Synthetic guard checks only; no network or server writes.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('./document_guards.cjs');
const bytes = Buffer.from('%PDF-1.7\nSynthetic planning document fixture\n%%EOF\n');
const operator = 'Andrew Fisher';
const host = 'https://fixture.invalid';
const clone = value => JSON.parse(JSON.stringify(value));
const results = [];
let networkCalls = 0;
global.fetch = () => { networkCalls++; throw Error('Network forbidden in pure guard tests'); };

function spec() {
  return {schema: 1, author: 'Andrew Fisher',
    source: {path: '/private/synthetic-plan.pdf', name: 'Synthetic plan.pdf',
      type: 'application/pdf', bytes: bytes.length, sha256: G.hash(bytes)},
    metadata: {kind: 'map', ref: '', title: 'Synthetic planning source',
      note: 'Planning context only; no asset assignment or completion established.'}};
}
function existingIndex() {
  return {files: [
    {id: 'existing-a.pdf', name: 'existing-a.pdf', kind: 'map', title: 'Existing source',
      note: null, ref: null, branch: null, invoice_no: null, type: 'application/pdf',
      bytes: 51, sha256: 'a'.repeat(64), uploaded: '2026-01-02T03:04:05.000Z',
      by: 'Fixture operator', extra: {keep: [0, false, null, '']}},
    {id: 'existing-b.pdf', name: 'existing-b.pdf', kind: 'pack', title: 'Existing report',
      note: 'Preserve exactly', ref: null, branch: null, invoice_no: null,
      type: 'application/pdf', bytes: 79, sha256: 'b'.repeat(64),
      uploaded: '2026-02-03T04:05:06.000Z', by: null}
  ]};
}
function savedFile(s = spec()) {
  return {id: G.fileId(s.source.name), name: s.source.name, kind: 'map', ref: null,
    branch: null, invoice_no: null, title: s.metadata.title, note: s.metadata.note,
    bytes: s.source.bytes, sha256: s.source.sha256, type: 'application/pdf',
    uploaded: '2026-03-04T05:06:07.000Z', by: operator};
}
function requestHeaders(s = spec()) {
  return {'Content-Type': 'application/pdf', 'X-File-Name': encodeURIComponent(s.source.name),
    'X-File-Kind': 'map', 'X-File-Title': encodeURIComponent(s.metadata.title),
    'X-File-Note': encodeURIComponent(s.metadata.note), 'X-GC500-Who': operator};
}
function test(name, run) {
  try { run(); results.push({name, pass: true}); }
  catch (error) { results.push({name, pass: false, error: error.message}); }
}
function rejectsUnchanged(run, fixtures) {
  const before = fixtures.map(x => G.canonical(x));
  assert.throws(run);
  assert.deepEqual(fixtures.map(x => G.canonical(x)), before, 'Rejection changed a fixture');
}
function rejectSpec(name, mutate, body = bytes) {
  test(name, () => {
    const s = spec(); mutate(s);
    rejectsUnchanged(() => G.validateSpec(s, body), [s]);
  });
}
function rejectIndex(name, mutate) {
  test(name, () => {
    const s = spec(), before = existingIndex(), saved = savedFile(s);
    const after = {files: [...clone(before.files), clone(saved)]};
    mutate({s, before, after, saved});
    rejectsUnchanged(() => G.verifyIndex(before, after, saved, s, operator), [s, before, after, saved]);
  });
}

test('Valid source returns expected sanitized identity without mutation', () => {
  const s = spec(), original = clone(s), beforeBytes = Buffer.from(bytes);
  const checked = G.validateSpec(s, bytes);
  assert.equal(checked.id, 'Synthetic_plan.pdf');
  assert.deepEqual(s, original); assert.deepEqual(bytes, beforeBytes);
});
test('Native metadata and filename length boundaries are accepted', () => {
  const s = spec();
  s.source.name = 'x'.repeat(196) + '.pdf';
  s.metadata.title = 't'.repeat(140); s.metadata.note = 'n'.repeat(300);
  assert.equal(G.validateSpec(s, bytes).id.length, 200);
});
rejectSpec('Wrong schema rejected', s => { s.schema = 2; });
rejectSpec('Unapproved author rejected', s => { s.author = 'Fixture operator'; });
rejectSpec('Missing source identity rejected', s => { delete s.source.path; });
rejectSpec('Empty filename rejected', s => { s.source.name = ''; });
rejectSpec('Overlength filename rejected before server truncation', s => { s.source.name = 'x'.repeat(197) + '.pdf'; });
rejectSpec('Outer filename whitespace rejected', s => { s.source.name += ' '; });
rejectSpec('Path separator in filename rejected', s => { s.source.name = 'folder/plan.pdf'; });
rejectSpec('Windows separator in filename rejected', s => { s.source.name = 'folder\\plan.pdf'; });
rejectSpec('Non-PDF extension rejected', s => { s.source.name = 'plan.txt'; });
rejectSpec('Wrong MIME type rejected', s => { s.source.type = 'image/png'; });
rejectSpec('Uppercase or invalid hash rejected', s => { s.source.sha256 = 'A'.repeat(64); });
rejectSpec('Wrong approved byte count rejected', s => { s.source.bytes++; });
rejectSpec('Wrong approved hash rejected', s => { s.source.sha256 = 'c'.repeat(64); });
rejectSpec('Zero source size rejected', s => { s.source.bytes = 0; });
rejectSpec('Oversize source rejected', s => { s.source.bytes = 167772161; });
rejectSpec('Noninteger source size rejected', s => { s.source.bytes += 0.5; });
rejectSpec('Non-Buffer source rejected', () => {}, bytes.toString());
test('Matching hash cannot disguise a non-PDF header', () => {
  const body = Buffer.from('TEXT synthetic content'), s = spec();
  s.source.bytes = body.length; s.source.sha256 = G.hash(body);
  rejectsUnchanged(() => G.validateSpec(s, body), [s]);
});
rejectSpec('Extra financial metadata rejected', s => { s.metadata.invoice_no = 'fixture'; });
rejectSpec('Missing note metadata rejected', s => { delete s.metadata.note; });
rejectSpec('Non-map kind rejected', s => { s.metadata.kind = 'invoice'; });
rejectSpec('Asset assignment rejected', s => { s.metadata.ref = 'REF01'; });
rejectSpec('Null reference rejected instead of silently normalizing', s => { s.metadata.ref = null; });
for (const [key, limit] of [['title', 140], ['note', 300]]) {
  rejectSpec(`Empty ${key} rejected`, s => { s.metadata[key] = ''; });
  rejectSpec(`Overlength ${key} rejected`, s => { s.metadata[key] = 'x'.repeat(limit + 1); });
  rejectSpec(`Outer whitespace in ${key} rejected`, s => { s.metadata[key] += ' '; });
  rejectSpec(`Newline in ${key} rejected`, s => { s.metadata[key] += '\nextra'; });
  rejectSpec(`Null byte in ${key} rejected`, s => { s.metadata[key] += '\0'; });
}

test('New source leaves the full index unchanged', () => {
  const s = spec(), index = existingIndex(), original = clone(index);
  assert.deepEqual(G.duplicates(index, s), []);
  assert.equal(G.requireNew(index, s), 'Synthetic_plan.pdf');
  assert.deepEqual(index, original);
});
const duplicateCases = [
  ['Same ID with different bytes', {id: 'Synthetic_plan.pdf', name: 'different.pdf', sha256: 'c'.repeat(64)}, 'native ID'],
  ['Sanitized whitespace-name collision', {id: 'other.pdf', name: 'Synthetic_plan.pdf', sha256: 'c'.repeat(64)}, 'sanitized name'],
  ['Repeated-dot collision', {id: 'other.pdf', name: 'Synthetic_plan..pdf', sha256: 'c'.repeat(64)}, 'sanitized name'],
  ['Leading-dot collision', {id: 'other.pdf', name: '..Synthetic_plan.pdf', sha256: 'c'.repeat(64)}, 'sanitized name'],
  ['Exact original name under another ID', {id: 'other.pdf', name: 'Synthetic plan.pdf', sha256: 'c'.repeat(64)}, 'original name'],
  ['Same source content under another name', {id: 'other.pdf', name: 'other.pdf', sha256: G.hash(bytes)}, 'source hash'],
  ['Exact duplicate rejects a second upload', savedFile(), 'source hash']
];
for (const [name, file, reason] of duplicateCases) {
  test(name, () => {
    const s = spec(), index = {files: [file]}, original = clone(index);
    const found = G.duplicates(index, s);
    assert.equal(found.length, 1); assert(found[0].reasons.includes(reason));
    rejectsUnchanged(() => G.requireNew(index, s), [s, index]);
    assert.deepEqual(index, original);
  });
}
test('Multiple aliases are all reported', () => {
  const s = spec(), index = {files: [
    {id: 'Synthetic_plan.pdf', name: 'first.pdf', sha256: 'c'.repeat(64)},
    {id: 'different.pdf', name: 'different.pdf', sha256: s.source.sha256}
  ]};
  assert.equal(G.duplicates(index, s).length, 2);
  rejectsUnchanged(() => G.requireNew(index, s), [s, index]);
});
test('Native filename identity remains case-sensitive', () => {
  const s = spec(), index = {files: [{id: 'synthetic_plan.pdf', name: 'synthetic plan.pdf', sha256: 'c'.repeat(64)}]};
  assert.equal(G.requireNew(index, s), 'Synthetic_plan.pdf');
});
test('Unavailable index rejected', () => assert.throws(() => G.indexMap(null)));
test('Non-array index rejected', () => assert.throws(() => G.indexMap({files: {}})));
test('Duplicate index IDs rejected', () => assert.throws(() => G.indexMap({files: [{id: 'a'}, {id: 'a'}]})));
test('Empty index ID rejected', () => assert.throws(() => G.indexMap({files: [{id: ''}]})));
test('Non-string index ID rejected', () => assert.throws(() => G.indexMap({files: [{id: 42}]})));
test('Index hash ignores array and object key order', () => {
  const a = existingIndex(), b = {files: [...clone(a.files)].reverse()};
  b.files[0] = Object.fromEntries(Object.entries(b.files[0]).reverse());
  assert.equal(G.indexHash(a), G.indexHash(b));
});
test('Index hash detects nested metadata changes', () => {
  const a = existingIndex(), b = clone(a); b.files[0].extra.keep[0] = 1;
  assert.notEqual(G.indexHash(a), G.indexHash(b));
});

test('Exact one-file append preserves every pre-existing field', () => {
  const s = spec(), before = existingIndex(), saved = savedFile(s);
  const after = {files: [clone(saved), ...clone(before.files).reverse()]};
  const originals = [s, before, after, saved].map(clone);
  assert.equal(G.verifyIndex(before, after, saved, s, operator), true);
  assert.deepEqual([s, before, after, saved], originals);
});
rejectIndex('No new file rejected', c => { c.after.files.pop(); });
rejectIndex('Wrong new native ID rejected', c => { c.after.files.at(-1).id = 'different.pdf'; });
rejectIndex('Two new files rejected', c => { c.after.files.push({id: 'unapproved.pdf'}); });
rejectIndex('Deletion hidden by unrelated append rejected', c => { c.after.files.shift(); c.after.files.push({id: 'unapproved.pdf'}); });
rejectIndex('Changed pre-existing title rejected', c => { c.after.files[0].title = 'Changed'; });
rejectIndex('Changed nested pre-existing metadata rejected', c => { c.after.files[0].extra.keep[0] = 1; });
rejectIndex('Omitted pre-existing null field rejected', c => { delete c.after.files[0].note; });
rejectIndex('Extra field on pre-existing entry rejected', c => { c.after.files[0].unexpected = true; });
rejectIndex('Duplicate fresh index ID rejected', c => { c.after.files.push(clone(c.after.files[0])); });
rejectIndex('Metadata mismatch in saved response rejected', c => { c.saved.title = 'Different'; });
rejectIndex('Response-only extra field rejected', c => { c.saved.unexpected = 'response only'; });
rejectIndex('Fresh-index-only extra field rejected', c => { c.after.files.at(-1).unexpected = 'index only'; });
rejectIndex('Timestamp disagreement between response and index rejected', c => { c.saved.uploaded = '2026-03-04T05:06:08.000Z'; });
test('Identical service-added metadata is retained in both views', () => {
  const s = spec(), before = existingIndex(), saved = savedFile(s);
  saved.serviceField = {preserve: true};
  const after = {files: [...clone(before.files), clone(saved)]};
  assert.equal(G.verifyIndex(before, after, saved, s, operator), true);
});
for (const [key, value] of Object.entries({
  id: 'wrong.pdf', name: 'wrong.pdf', kind: 'pack', ref: 'REF01', branch: 'FAKE',
  invoice_no: 'fixture', title: 'Wrong title', note: 'Wrong note',
  bytes: bytes.length + 1, sha256: 'c'.repeat(64), type: 'text/plain', by: 'Fixture operator'
})) {
  test(`Saved file rejects mismatched ${key}`, () => {
    const s = spec(), file = savedFile(s); file[key] = value;
    rejectsUnchanged(() => G.verifyFile(file, s, operator), [s, file]);
  });
}
test('Missing native null field rejected', () => {
  const s = spec(), file = savedFile(s); delete file.ref;
  rejectsUnchanged(() => G.verifyFile(file, s, operator), [s, file]);
});
test('Invalid upload timestamp rejected', () => {
  const s = spec(), file = savedFile(s); file.uploaded = 'not a date';
  rejectsUnchanged(() => G.verifyFile(file, s, operator), [s, file]);
});
test('Replacement marker rejected', () => {
  const s = spec(), file = savedFile(s); file.replaced = true;
  rejectsUnchanged(() => G.verifyFile(file, s, operator), [s, file]);
});

test('Exact original upload request accepted without mutation', () => {
  const s = spec(), h = requestHeaders(s), original = clone(h);
  assert.equal(G.verifyRequest('POST', host + '/api/files', h, bytes, s, operator, host), true);
  assert.deepEqual(h, original);
});
for (const [name, method, url] of [
  ['PUT rejected', 'PUT', host + '/api/files'],
  ['Different host rejected', 'POST', 'https://other.invalid/api/files'],
  ['Native record write rejected', 'POST', host + '/api/state'],
  ['Thumbnail request rejected', 'POST', host + '/api/files/fixture.pdf/thumb'],
  ['Query variation rejected', 'POST', host + '/api/files?replace=true']
]) {
  test(name, () => {
    const s = spec(), h = requestHeaders(s);
    rejectsUnchanged(() => G.verifyRequest(method, url, h, bytes, s, operator, host), [s, h]);
  });
}
test('Different upload bytes rejected', () => {
  const s = spec(), h = requestHeaders(s), body = Buffer.from(bytes); body[10] ^= 1;
  rejectsUnchanged(() => G.verifyRequest('POST', host + '/api/files', h, body, s, operator, host), [s, h]);
});
for (const key of ['X-File-Name', 'X-File-Kind', 'X-File-Title', 'X-File-Note', 'X-GC500-Who', 'Content-Type']) {
  test(`Upload request rejects changed ${key}`, () => {
    const s = spec(), h = requestHeaders(s); h[key] = 'incorrect';
    rejectsUnchanged(() => G.verifyRequest('POST', host + '/api/files', h, bytes, s, operator, host), [s, h]);
  });
}
for (const key of ['x-file-ref', 'x-file-branch', 'x-file-invoice']) {
  test(`Unapproved filing header ${key} rejected`, () => {
    const s = spec(), h = requestHeaders(s); h[key] = 'fixture';
    rejectsUnchanged(() => G.verifyRequest('POST', host + '/api/files', h, bytes, s, operator, host), [s, h]);
  });
}
test('Malformed encoded header rejected', () => {
  const s = spec(), h = requestHeaders(s); h['X-File-Name'] = '%invalid';
  rejectsUnchanged(() => G.verifyRequest('POST', host + '/api/files', h, bytes, s, operator, host), [s, h]);
});
test('No network calls from guard tests', () => assert.equal(networkCalls, 0));

const failed = results.filter(x => !x.pass);
const summary = {author: 'Andrew Fisher', pass: failed.length === 0, cases: results.length,
  passed: results.length - failed.length, failed: failed.length, networkCalls,
  serverWrites: 0, guardSha256: G.hash(fs.readFileSync(path.join(__dirname, 'document_guards.cjs'))),
  testSha256: G.hash(fs.readFileSync(__filename)), results};
console.log(JSON.stringify(summary, null, 2));
if (failed.length) process.exitCode = 1;
