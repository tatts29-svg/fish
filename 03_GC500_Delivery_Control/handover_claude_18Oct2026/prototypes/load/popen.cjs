// Copy of toolchain/harness/open_page.js with a hook before navigation (to start browser-wide tracing).
// Read-only: every non-GET is aborted, exactly as the harness does.
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const HOST = 'https://gc500-production.up.railway.app'; const path = require('path'), crypto = require('crypto');
// FREEZE=<dir>: every GET (including /api/) is recorded once and replayed after, so runs compare on one fixed record.
const FREEZE = process.env.FREEZE; if (FREEZE) fs.mkdirSync(FREEZE, {recursive: true});
const DELAY_RE = process.env.DELAY_RE ? new RegExp(process.env.DELAY_RE) : null, DELAY_MS = +(process.env.DELAY_MS || 0); let delayed = 0;
async function frozenFetch(u, h, m, b) { if (DELAY_RE && DELAY_RE.test(u) && delayed++ === 0) await new Promise(r => setTimeout(r, DELAY_MS));
 if (!FREEZE || m !== 'GET') return curlFetch(u, h, m, b);
  const k = path.join(FREEZE, crypto.createHash('sha1').update(u.replace(/([?&])(_|t|ts|cb|nocache)=\d+/g, '$1$2=X')).digest('hex'));
  if (fs.existsSync(k + '.json')) return {...JSON.parse(fs.readFileSync(k + '.json', 'utf8')), body: fs.readFileSync(k + '.body')};
  const r = await curlFetch(u, h, m, b); if (r.status === 200) { fs.writeFileSync(k + '.body', r.body); fs.writeFileSync(k + '.json', JSON.stringify({status: r.status, headers: r.headers, url: u.slice(0, 300)})); } return r; }
async function open({pageFile, hash = '', W = 1440, H = 900, dpr = 1, mobile = false, init = '', cpu = 0, before = null, waitUntil = 'load'}) {
  const launch = {args: ['--no-sandbox', '--lang=en-AU'], env: Object.assign({}, process.env, {LANG: 'en_AU.UTF-8', LANGUAGE: 'en_AU'})};
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext(Object.assign(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  const counts = {page: 0, live: 0, blocked: 0}; const body = fs.readFileSync(pageFile);
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    let res; try { counts.live++; res = await frozenFetch(u, r.headers(), r.method(), r.postData()); } catch (e) { try { return await route.abort('failed'); } catch (_) { return; } } try { return await route.fulfill(res); } catch (e) {} });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); const errors = [];
  if (cpu > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', {rate: cpu}); } page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  if (before) await before({browser, ctx, page});
  await page.goto(HOST + '/v/Coates-GC500-2026/' + hash, {waitUntil, timeout: 240000}); return {browser, page, errors, counts, ctx};
}
module.exports = {open};
