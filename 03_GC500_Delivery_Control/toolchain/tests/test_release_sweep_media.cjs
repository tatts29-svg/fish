// Author: Andrew Fisher. Network-free release preflight and local-route coverage for new candidate images.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const {prepareMedia, installAssets} = require('../harness/release_sweep.cjs');
const HOST = 'https://gc500-production.up.railway.app', PREFIX = '/m/Coates-GC500-2026/';
function fixture(t, extension = 'webp', type = 'image/webp') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-release-media-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const directory = path.join(root, 'media'); fs.mkdirSync(directory);
  const body = Buffer.from('fictional reviewed candidate image');
  const sha = crypto.createHash('sha256').update(body).digest('hex'), file = sha + '.' + extension;
  const descriptor = {file, sha256: sha, bytes: body.length, type, scope: 'view'};
  const page = path.join(root, 'candidate.html'), base = path.join(root, 'base_live.html');
  const write = (filename, table) => fs.writeFileSync(filename, '<script>const DATA = ' + JSON.stringify({media: table}) + ';\n</script>');
  write(page, {[sha]: descriptor}); write(base, {}); fs.writeFileSync(path.join(directory, file), body);
  return {root, directory, body, sha, file, descriptor, page, base, write,
    prepare: (environment = {MEDIA: directory}, sources) => prepareMedia(page, environment, sources)};
}

test('unknown release images are eagerly verified from MEDIA with the shared resolver', t => {
  for (const [extension, type] of [['webp', 'image/webp'], ['png', 'image/png'], ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'], ['gif', 'image/gif'], ['avif', 'image/avif']]) {
    const f = fixture(t, extension, type), {media} = f.prepare();
    assert.equal(media.size, 1); assert.deepEqual(media.get(PREFIX + f.file), {body: f.body, type});
  }
});

test('unchanged live descriptors need no local MEDIA root or file', t => {
  const f = fixture(t); f.write(f.base, {[f.sha]: f.descriptor}); fs.unlinkSync(path.join(f.directory, f.file));
  assert.equal(f.prepare({}).media.size, 0);
});

test('new media fails before browser startup when MEDIA or its image is missing', t => {
  const f = fixture(t);
  assert.throws(() => f.prepare({}), /MEDIA is required/);
  assert.throws(() => f.prepare({MEDIA: path.join(f.root, 'absent')}), /local media directory is unavailable/);
  fs.unlinkSync(path.join(f.directory, f.file));
  assert.throws(() => f.prepare(), /Missing new candidate media/);
});

test('new media never falls through when its bytes are truncated or corrupted', t => {
  const f = fixture(t), file = path.join(f.directory, f.file);
  fs.writeFileSync(file, 'short'); assert.throws(() => f.prepare(), /byte length mismatch/);
  fs.writeFileSync(file, Buffer.alloc(f.body.length)); assert.throws(() => f.prepare(), /SHA-256 mismatch/);
});

test('new descriptor hash, byte count and MIME must match the hash-named image', t => {
  const f = fixture(t);
  for (const change of [{sha256: '0'.repeat(64)}, {bytes: 0}, {bytes: f.body.length + 1},
    {bytes: String(f.body.length)}, {type: 'text/html'}, {type: 'image/png'}]) {
    f.write(f.page, {[f.sha]: {...f.descriptor, ...change}});
    assert.throws(() => f.prepare(), /Invalid candidate media descriptor|byte length mismatch/);
  }
});

test('new media rejects traversal, alternate hash filenames and unsupported formats', t => {
  const f = fixture(t);
  for (const file of ['../' + f.file, '..\\' + f.file, '%2e%2e%2f' + f.file,
    path.join(f.directory, f.file), '0'.repeat(64) + '.webp', f.sha + '.svg', f.file + '?copy=1']) {
    f.write(f.page, {[f.sha]: {...f.descriptor, file}});
    assert.throws(() => f.prepare(), /single SHA-256 filename/);
  }
  f.write(f.page, {['invalid-key']: f.descriptor});
  assert.throws(() => f.prepare(), /single SHA-256 filename/);
});

test('new media cannot use a symlink escaping MEDIA even when its bytes are correct', t => {
  const f = fixture(t), outside = path.join(f.root, 'outside.webp');
  fs.writeFileSync(outside, f.body); fs.unlinkSync(path.join(f.directory, f.file));
  fs.symlinkSync(outside, path.join(f.directory, f.file));
  assert.throws(() => f.prepare(), /escapes its configured directory/);
});

test('known release descriptor checks remain authoritative over generic MEDIA', t => {
  const f = fixture(t), sources = new Map([[f.sha, {descriptor: f.descriptor, directory: f.directory, name: 'REVIEWED_MEDIA'}]]);
  assert.deepEqual(f.prepare({MEDIA: f.directory}, sources).media.get(PREFIX + f.file).body, f.body);
  for (const change of [{file: '0'.repeat(64) + '.webp'}, {sha256: '0'.repeat(64)},
    {bytes: f.body.length + 1}, {type: 'image/png'}, {scope: 'edit'}]) {
    f.write(f.page, {[f.sha]: {...f.descriptor, ...change}});
    assert.throws(() => f.prepare({MEDIA: f.directory}, sources), /differs from its release descriptor/);
  }
  f.write(f.page, {[f.sha]: f.descriptor});
  sources.get(f.sha).directory = null;
  assert.throws(() => f.prepare({MEDIA: f.directory}, sources), /REVIEWED_MEDIA is required/);
});

test('known source corruption cannot be rescued by a valid generic MEDIA copy', t => {
  const f = fixture(t), reviewed = path.join(f.root, 'reviewed'); fs.mkdirSync(reviewed);
  fs.writeFileSync(path.join(reviewed, f.file), Buffer.alloc(f.body.length));
  const sources = new Map([[f.sha, {descriptor: f.descriptor, directory: reviewed, name: 'REVIEWED_MEDIA'}]]);
  assert.throws(() => f.prepare({MEDIA: f.directory}, sources), /Wrong local asset SHA-256/);
});

test('preflighted new media is fulfilled locally and its non-GET route is blocked', async t => {
  const f = fixture(t), {media} = f.prepare(); let handler;
  const session = {counts: {blocked: 0}, page: {context: () => ({route: async (_pattern, callback) => { handler = callback; }})}};
  const result = {failures: []};
  await installAssets(session, {media, tileFiles: 0, poc: null, machine: {files: {}, machine_sha256: 'fixture', manifest_sha256: 'fixture'}}, result);
  let response, aborted;
  const route = method => ({request: () => ({url: () => HOST + PREFIX + f.file, method: () => method, headers: () => ({})}),
    fulfill: async value => { response = value; }, abort: async reason => { aborted = reason; },
    fallback: () => { throw Error('New candidate media must never fall through to network'); }});
  await handler(route('GET')); assert.equal(response.status, 200); assert.equal(response.headers['content-type'], 'image/webp');
  assert.deepEqual(response.body, f.body); assert.equal(result.assets.mediaRequests, 1);
  await handler(route('POST')); assert.equal(aborted, 'blockedbyclient'); assert.equal(session.counts.blocked, 1);
  assert.deepEqual(result.failures, []);
});
