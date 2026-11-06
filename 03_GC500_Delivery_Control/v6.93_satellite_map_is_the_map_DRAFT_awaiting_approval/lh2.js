// the live address in headless Chromium, with the dashboard page itself served from a local file (the draft);
// every other request is a GET to the live service or the map/tile hosts through curl. Writes are aborted.
const PW = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright';
const {chromium, devices} = require(PW); const fs = require('fs'); const {curlFetch} = require('./curlf');
const HOST = 'https://gc500-production.up.railway.app';
async function open({pageFile, hash = '', W = 1440, H = 900, dpr = 1, mobile = false, gl = true}) {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: gl ? ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--no-sandbox']});
  const ctx = await browser.newContext(mobile ? {...devices['iPhone 13'], viewport: {width: W, height: H}, deviceScaleFactor: dpr} : {viewport: {width: W, height: H}, deviceScaleFactor: dpr});
  const counts = {page: 0, live: 0, blocked: 0};
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (pageFile && r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) { counts.page++; return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(pageFile)}); }
    const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');
    if (r.method() !== 'GET' && !okPost) { counts.blocked++; return route.abort(); }
    try { counts.live++; return route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { return route.abort('failed'); } });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.goto(HOST + '/v/Coates-GC500-2026/' + hash, {waitUntil: 'load', timeout: 180000}); return {browser, page, errors, counts};
}
module.exports = {open};
