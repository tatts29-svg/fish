// Author: Andrew Fisher. A shared test cache must not replay an old mutable map index.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto'), vm = require('node:vm');

function fixture(t, responseHeaders = 'Cache-Control: no-cache') {
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-curl-cache-test-'));
  t.after(() => fs.rmSync(cache, {recursive:true, force:true}));
  let calls = 0;
  const module = {exports:{}};
  const requireLocal = name => name === 'child_process' ? {execFile: (command, args, options, callback) => {
    assert.equal(command, 'curl');
    calls++;
    fs.writeFileSync(args[args.indexOf('-D') + 1], 'HTTP/1.1 200 OK\r\n' + responseHeaders + '\r\n\r\n');
    fs.writeFileSync(args[args.indexOf('-o') + 1], 'version-' + calls);
    callback(null);
  }} : name === './candidate_media.cjs' ? {fromEnvironment: () => () => null} : require(name);
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../harness/curlfetch.js'), 'utf8'), {
    module, require:requireLocal, process:{env:{GC500_CACHE:cache}, pid:process.pid}, console, setTimeout, Buffer
  });
  const url = 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html?embed=1';
  const key = crypto.createHash('sha1').update(url).digest('hex'), prefix = path.join(cache, key);
  return {cache, prefix, get calls() {return calls;}, get:(headers = {}) => module.exports.curlFetch(url, headers, 'GET'),
    seed: headers => {
      fs.writeFileSync(prefix + '.json', JSON.stringify({status:200, headers}));
      fs.writeFileSync(prefix + '.body', 'old-index');
    }};
}

for (const control of ['no-cache', 'private, no-store', 'max-age=3600, No-Cache="etag"']) {
  test('refetches an existing forbidden cache entry and subsequent responses: ' + control, async t => {
    const f = fixture(t, 'Cache-Control: ' + control);
    f.seed({'Cache-Control':control});
    assert.equal((await f.get()).body.toString(), 'version-1');
    assert.equal((await f.get()).body.toString(), 'version-2');
    assert.equal(f.calls, 2);
    assert.equal(fs.existsSync(f.prefix + '.json'), false);
    assert.equal(fs.existsSync(f.prefix + '.body'), false);
  });
}

test('an immutable asset response remains reusable without another network call', async t => {
  const f = fixture(t, 'Cache-Control: public, max-age=31536000, immutable');
  assert.equal((await f.get()).body.toString(), 'version-1');
  assert.equal((await f.get()).body.toString(), 'version-1');
  assert.equal(f.calls, 1);
});

test('an explicit refresh request bypasses an otherwise reusable old response', async t => {
  const f = fixture(t, 'Cache-Control: private, max-age=3600');
  f.seed({'cache-control':'private, max-age=3600'});
  assert.equal((await f.get({'Cache-Control':'no-cache'})).body.toString(), 'version-1');
  assert.equal(f.calls, 1);
  assert.equal(fs.existsSync(f.prefix + '.json'), false);
});
