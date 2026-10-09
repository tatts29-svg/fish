// Test harness for the explorer: opens the LIVE address in headless Chromium but serves chosen files from local folders
// (the staged fix, or the untouched live copy for "before"), everything else by GET through curl (the sandbox browser
// cannot reach the live site directly) with a small on-disk cache. Non-GET requests are always aborted: nothing is ever
// written to the live service. /api/map-key answers are passed through in memory only (never cached or logged).
const PW = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright';
const {chromium, devices} = require(PW); const {execFile} = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const HOST = 'gc500-production.up.railway.app', PREFIX = '/w/Coates-GC500-2026/explorer/';
const URL0 = 'https://' + HOST + PREFIX + 'index.html';
const CACHE = '/tmp/claude-0/stage/work/cache'; fs.mkdirSync(CACHE, {recursive: true});
const CT = {html: 'text/html; charset=utf-8', js: 'text/javascript', json: 'application/json', bin: 'application/octet-stream', webp: 'image/webp', png: 'image/png', md: 'text/markdown'};
let n = 0;
function curl(url, headers) {
  const cacheable = !/\/api\//.test(url), key = crypto.createHash('sha1').update(url + '|' + (headers.range || '')).digest('hex'), cf = path.join(CACHE, key);
  if (cacheable && fs.existsSync(cf + '.json')) return Promise.resolve({...JSON.parse(fs.readFileSync(cf + '.json', 'utf8')), body: fs.readFileSync(cf + '.body')});
  const id = ++n, hf = path.join(os.tmpdir(), 'hz_h' + process.pid + '_' + id), bf = path.join(os.tmpdir(), 'hz_b' + process.pid + '_' + id);
  const args = ['-sS', '--compressed', '-D', hf, '-o', bf, '--max-time', '90'];
  for (const [k, v] of Object.entries(headers)) { if (/^(accept-encoding|host|connection|content-length)$/i.test(k)) continue; args.push('-H', k + ': ' + v); }
  args.push(url);
  return new Promise((res, rej) => execFile('curl', args, {maxBuffer: 1 << 26}, err => {
    try {
      if (err) return rej(err);
      const raw = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(b => /^HTTP\//.test(b)), last = raw[raw.length - 1] || 'HTTP/1.1 502';
      const lines = last.split(/\r?\n/), status = +lines[0].split(' ')[1], hd = {};
      for (const l of lines.slice(1)) { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim().toLowerCase(); if (/^(content-encoding|content-length|transfer-encoding|set-cookie)$/.test(k)) continue; hd[k] = l.slice(i + 1).trim(); } }
      const body = fs.readFileSync(bf); const out = {status, headers: hd, body};
      if (cacheable && (status === 200 || status === 206)) { fs.writeFileSync(cf + '.body', body); fs.writeFileSync(cf + '.json', JSON.stringify({status, headers: hd})); }
      res(out);
    } finally { try { fs.unlinkSync(hf); fs.unlinkSync(bf); } catch (_) {} }
  }));
}
function local(dirs, rel, range) {
  for (const d of dirs) { const f = path.join(d, rel); if (f.startsWith(d) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    const buf = fs.readFileSync(f), ct = CT[path.extname(f).slice(1)] || 'application/octet-stream', m = /^bytes=(\d+)-(\d*)$/.exec(range || '');
    if (m) { const a = +m[1], b = m[2] ? Math.min(+m[2], buf.length - 1) : buf.length - 1; return {status: 206, headers: {'content-type': ct, 'content-range': `bytes ${a}-${b}/${buf.length}`, 'accept-ranges': 'bytes'}, body: buf.subarray(a, b + 1)}; }
    return {status: 200, headers: {'content-type': ct, 'accept-ranges': 'bytes', 'cache-control': 'no-cache'}, body: buf}; } }
  return null;
}
/* dirs: local folders standing in for PREFIX (first match wins); fail(url) may return a fulfil object, 'abort', or null */
async function open({dirs, W = 1440, H = 900, dpr = 1, mobile = false, hash = '', search = '', fail = null, log = console.log, storage = null}) {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: !process.env.GL ? ['--no-sandbox'] : ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const ctx = await browser.newContext(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr, acceptDownloads: true} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr, acceptDownloads: true});
  const counts = {local: 0, live: 0, blocked: 0, failed: 0};
  await ctx.route('**/*', async route => {
    const req = route.request(), url = req.url();
    if (req.method() !== 'GET') { counts.blocked++; return route.abort(); }
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    try {
      const f = fail && fail(url); if (f === 'hang') { counts.failed++; return; } if (f === 'abort') { counts.failed++; return route.abort('failed'); } if (f) { counts.failed++; return route.fulfill(f); }
      const u = new URL(url), h = req.headers();
      if (u.host === HOST && u.pathname.startsWith(PREFIX)) { const r = local(dirs, decodeURIComponent(u.pathname.slice(PREFIX.length)), h.range); if (r) { counts.local++; return route.fulfill(r); } }
      const r = await curl(url, h); counts.live++; return route.fulfill(r);
    } catch (e) { try { await route.abort('failed'); } catch (_) {} }
  });
  if (storage) await ctx.addInitScript(s => { try { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } catch (e) {} }, storage);
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => { errors.push(e.message); log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error') log('console.error', m.text().replace(/pk\.[\w.-]+/g, '[key]').slice(0, 200)); });
  await page.goto(URL0 + search + hash, {timeout: 120000});
  return {browser, ctx, page, errors, counts};
}
const settle = (page, ms = 120000) => page.waitForFunction(() => { const q = document.getElementById('qualText').textContent; return window.__bootError || (window.__ready && !/Rendering|Loading/.test(q)); }, null, {timeout: ms, polling: 300}).catch(() => {});
module.exports = {open, settle, URL0};
