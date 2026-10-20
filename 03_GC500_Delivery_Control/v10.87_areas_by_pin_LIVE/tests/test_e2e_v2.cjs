/* Author: Andrew Fisher. Servicing tracker v2 END TO END on a PRACTICE day (v10.87): the actual built page + the actual live server code (v5.91),
   on this machine only. Andrew, 20 Oct 2026: "ensure the links work to where they need to go ... make sure the persentages
   work. please make sure all qr codes work please ensure everything talks so when you click a complete everything talk to
   each other ... time stamp on cpompletion".

     node tests/test_e2e_v2.cjs [page]      (default build/GC500_v10.87/GC500_Delivery_Control_hosted.html)

   The record is a copy of the live /api/state (one GET on the view link) in a throw-away DATA_DIR; the server's clock is
   Fri 23 Oct 22:00 (fake_clock.js, test only). Every other page request is a GET to the live service through the harness
   or is answered empty; every write except POST /api/cards and the card's own ticks to 127.0.0.1 is aborted. Nothing
   here reaches the live record or the live tracker. Chain proved:
     GC500 edit link, Servicing tab -> Create event tracker -> download the QR bundle -> make_sheets.py builds the pack ->
     every printed QR decoded -> a phone opens the decoded Pump out and Clean & restock codes -> Complete -> Save & close ->
     the server holds each tick with its time -> the phone's area % and overall % -> GC500's Servicing tab shows the same. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
module.paths.unshift(path.join(ROOT, 'toolchain', 'node_modules'));
const { chromium } = require('playwright');
const { curlFetch } = require(path.join(ROOT, 'toolchain', 'harness', 'curlfetch.js'));
const SS = require(path.join(ROOT, 'servicing_tracker_DRAFT', 'panel_mockup', 'state.js'));
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'servicing_tracker_DRAFT', 'tracker_data.json'), 'utf8'));
const PAGE = process.argv[2] || path.join(ROOT, 'build', 'GC500_v10.87', 'GC500_Delivery_Control_hosted.html');
const SERVER = path.join(ROOT, 'server_v5.91_export_completeness_LIVE', 'server.js');
const CLOCK = path.join(ROOT, 'server_v5.89_servicing_tracker_DRAFT', 'fake_clock.js');
const HOST = 'https://gc500-production.up.railway.app', VIEW_LIVE = 'Coates-GC500-2026';
const E = 'local-edit-e2e-v2-' + crypto.randomBytes(6).toString('hex'), V = 'local-view-e2e-v2-' + crypto.randomBytes(6).toString('hex');
const EVID = path.join(__dirname, '..', 'evidence'); fs.mkdirSync(EVID, { recursive: true });
const ZX = process.env.ZXING || '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/zxing';
const wait = ms => new Promise(r => setTimeout(r, ms));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0; const fails = [];
const check = (n, ok, d) => { if (ok) { pass++; console.log('PASS ' + n); } else { fail++; fails.push(n); console.log('FAIL ' + n + ' — ' + JSON.stringify(d === undefined ? null : d).slice(0, 700)); } };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-e2e-v2-'));
let port, server, exited = false, browser; const blocked = [], posts = [], errors = [];
const req = (p, token = E, method = 'GET') => new Promise((resolve, reject) => {
  const r = http.request({ hostname: '127.0.0.1', port, path: p, method, headers: { 'x-gc500-token': token } }, res => { const a = []; res.on('data', x => a.push(x)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(a) })); });
  r.on('error', reject); r.end();
});
async function context(opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, locale: 'en-AU', timezoneId: 'Australia/Brisbane' }, opts || {}));
  await ctx.route('**/*', async route => {
    const r = route.request(), u = new URL(r.url()), m = r.method();
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    const local = u.hostname === '127.0.0.1' && Number(u.port) === port;
    if (local) {
      if (m === 'GET' || (m === 'POST' && (u.pathname === '/api/cards' || /^\/d\/[^/]+\/ticks$/.test(u.pathname)))) { if (m === 'POST' && u.pathname === '/api/cards') posts.push(r.postDataJSON()); return route.continue(); }
      blocked.push(m + ' ' + u.pathname); return route.abort();
    }
    if (m !== 'GET') { blocked.push(m + ' ' + u.href.slice(0, 80)); return route.abort(); }
    try { const res = await curlFetch(u.href, r.headers(), 'GET'); return route.fulfill(res); }
    catch (e) { return route.fulfill({ status: 200, contentType: 'text/plain', body: '' }); }
  });
  return ctx;
}
function curl(url, token) {
  const r = spawnSync('curl', ['-s', '--compressed', '-H', 'x-gc500-token: ' + token, '-H', 'cache-control: no-cache', url], { maxBuffer: 1 << 30 });
  if (r.status) throw new Error('curl failed'); return r.stdout;
}
const DAY = process.env.E2E_DAY || '2026-10-20';   /* Tue 20 Oct: a practice day (Andrew: "have a play with it") */
const pct = (a, b) => b ? Math.floor(a * 100 / b) : 0;

(async () => {
  try {
    /* ---- the record: a copy of live, read once */
    const state = curl(HOST + '/api/state', VIEW_LIVE); JSON.parse(state);
    fs.writeFileSync(path.join(dir, 'records.json'), state); fs.copyFileSync(PAGE, path.join(dir, 'app.html'));
    const recHash = hash(fs.readFileSync(path.join(dir, 'records.json')));
    port = await new Promise(res => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
    const log = fs.openSync(path.join(dir, 'server.log'), 'a');
    server = spawn(process.execPath, ['-r', CLOCK, SERVER], { env: { PATH: process.env.PATH, PORT: String(port), DATA_DIR: dir, VIEW_TOKEN: V, EDIT_TOKEN: E, FAKE_NOW: DAY + 'T22:00:00+10:00' }, stdio: ['ignore', log, log] });
    server.on('exit', () => { exited = true; });
    for (let n = 0; n < 150; n++) { try { if ((await req('/health')).status === 200) break; } catch (e) {} await wait(100); }
    check('the live server code (v5.91) runs locally on a copy of the live record, clock ' + DAY + ' 22:00 (practice day)', (await req('/health')).status === 200);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });

    /* ---- 1. GC500 edit link, Servicing tab: Create event tracker */
    const pc = await context(); const page = await pc.newPage();
    page.on('pageerror', e => errors.push('page: ' + e.message)); page.on('dialog', d => d.accept());
    await page.goto('http://127.0.0.1:' + port + '/e/' + E + '#servicing', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, { timeout: 180000 });
    await page.evaluate(() => go('servicing'));
    await page.waitForSelector('#svc1067-host:not([hidden])', { timeout: 30000 });
    check('GC500 opens on its Servicing tab, edit link: tracker panel and admin shown', await page.evaluate(() => state.tab === 'servicing' && !!document.querySelector('.svc1067-admin')));
    await page.locator('.svc1067-admin summary').first().click();
    await page.locator('[data-contact-name]').fill('Servicing supervisor (test)'); await page.locator('[data-contact-phone]').fill('0400 000 000');
    await page.evaluate(() => { document.getElementById('who').value = 'E2E operator'; });
    await page.locator('[data-test-checked]').check(); await page.locator('[data-site-checked]').check();
    await page.locator('[data-make="event"]').click();
    await page.waitForFunction(() => /Event tracker saved and read back/.test(document.querySelector('[data-admin-status]').textContent), null, { timeout: 40000 });
    const trackers = JSON.parse((await req('/api/ticks')).body).trackers.filter(t => t.load === 'servicing-tracker:GC500-2026');
    const token = trackers[0] && trackers[0].token;
    check('Create event tracker: one event tracker on the service, practice Tue-Thu then Fri/Sat/Sun, every line of the tracker data', trackers.length === 1 && posts.length === 1 &&
      JSON.stringify(posts[0].tracker.days.map(d => d.id)) === '["2026-10-20","2026-10-21","2026-10-22","2026-10-23","2026-10-24","2026-10-25"]' && posts[0].tracker.lines.length === [].concat(...DATA.areas.map(a => a.refs.map(r => r.lines))).flat().length, { n: trackers.length, days: posts[0] && posts[0].tracker.days });
    const sewer = posts[0].tracker.lines.filter(l => l.kind === 'sewer').map(l => l.ref + ':' + l.qty).sort();
    check('the tracker carries the 9 sewer-connected blocks (T0243, WC09, WC15, WC16, WC17)', JSON.stringify(sewer) === JSON.stringify(['T0243:1', 'WC09:2', 'WC15:2', 'WC16:2', 'WC17:2']), sewer);

    /* ---- 2. download the QR bundle, make the pack from it, decode every printed code */
    const dl = page.waitForEvent('download'); await page.locator('[data-download-links]').click(); const d1 = await dl;
    const bundleFile = path.join(dir, 'links.json'); await d1.saveAs(bundleFile);
    const bundle = JSON.parse(fs.readFileSync(bundleFile));
    check('the downloaded bundle is the event tracker, a signed link for every reference', bundle.token === token && Object.keys(bundle.links || {}).length === [].concat(...DATA.areas.map(a => a.refs)).length, Object.keys(bundle));
    const pack = path.join(dir, 'pack.pdf');
    const mk = spawnSync('python3', ['-I', path.join(ROOT, 'servicing_tracker_DRAFT', 'print', 'make_sheets.py'), '--links', bundleFile, '--base', 'http://127.0.0.1:' + port, '--out', pack], { encoding: 'utf8' });
    let base = HOST;
    if (mk.status !== 0) {   /* the pack only prints links on the live address; decode those and map them onto this local server */
      const mk2 = spawnSync('python3', ['-I', path.join(ROOT, 'servicing_tracker_DRAFT', 'print', 'make_sheets.py'), '--links', bundleFile, '--out', pack], { encoding: 'utf8' });
      check('make_sheets.py builds the pack from the downloaded bundle', mk2.status === 0 && fs.existsSync(pack), mk2.stderr.slice(-400));
    } else { base = 'http://127.0.0.1:' + port; check('make_sheets.py builds the pack from the downloaded bundle', fs.existsSync(pack)); }
    spawnSync('pdftoppm', ['-r', '300', '-png', pack, path.join(dir, 'pg')]);
    const dec = spawnSync('python3', ['-I', '-c', `import sys,glob,json;sys.path.insert(0,${JSON.stringify(ZX)});import zxingcpp;from PIL import Image
out=[]
for f in sorted(glob.glob(${JSON.stringify(path.join(dir, 'pg'))}+'*.png')):
  for r in zxingcpp.read_barcodes(Image.open(f),formats=zxingcpp.BarcodeFormat.QRCode): out.append(r.text)
print(json.dumps(out))`], { encoding: 'utf8', maxBuffer: 1 << 28 });
    const codes = JSON.parse(dec.stdout || '[]');
    const groupsFor = r => Object.keys(DATA.groups).filter(g => r.lines.some(l => DATA.days.some(dd => DATA.plans[l.kind][dd.plan].some(t => DATA.groups[g].tasks.includes(t)))));
    const want = new Set([].concat(...DATA.areas.map(a => a.refs.flatMap(r => groupsFor(r).map(g => base + '/d/' + token + '#r=' + r.ref + '.' + bundle.links[r.ref] + '~' + g)))));
    const got = new Set(codes.filter(c => c.includes('/d/')));
    check(`every job QR printed in the pack decodes to its reference's signed link + job (${want.size} codes)`, [...want].every(u => got.has(u)) && [...got].every(u => want.has(u)), { missing: [...want].filter(u => !got.has(u)).slice(0, 3), stray: [...got].filter(u => !want.has(u)).slice(0, 3) });
    const maps = codes.filter(c => c.startsWith('https://www.google.com/maps/'));
    check('every location QR is a Google Maps pin', maps.length > 0 && maps.every(u => /query=-?\d+\.\d+,\d+\.\d+$/.test(u)), maps.slice(0, 2));
    const local = u => u.replace(HOST, 'http://127.0.0.1:' + port);

    /* ---- 3. a phone opens the decoded codes: Complete, Save & close */
    const ph = await context({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const phone = await ph.newPage(); phone.on('pageerror', e => errors.push('card: ' + e.message));
    const open = async u => { await phone.goto('about:blank'); await phone.goto(local(u)); await phone.waitForFunction(() => /^Live/.test(document.getElementById('status').textContent), null, { timeout: 30000 }); };
    const jobs = () => phone.$$eval('[data-job]', bs => bs.map(b => ({ key: b.dataset.job, sub: b.querySelector('small').textContent, cls: b.className })));
    const settle = () => phone.waitForFunction(() => window.svc1067 && window.svc1067.outbox().length === 0, null, { timeout: 30000 });
    const code = (ref, g) => [...got].find(u => u.includes('#r=' + ref + '.') && u.endsWith('~' + g));
    const ticks = async () => JSON.parse((await req('/api/ticks?token=' + token)).body).ticks || [];

    await open(code('WC07', 'pump'));
    check('the WC07 Pump out code opens WC07 with Pump out only', JSON.stringify((await jobs()).map(j => j.key)) === '["WC07-FWF|pump"]', await jobs());
    await phone.click('[data-job="WC07-FWF|pump"]'); await settle();
    const j1 = (await jobs())[0];
    check('Complete logs the time on the phone ("Completed 22:0x")', /^Completed 22:0\d$/.test(j1.sub) && /done/.test(j1.cls), j1);
    await phone.click('#saveclose'); await phone.waitForFunction(() => /^Saved/.test((document.querySelector('.saved h2') || {}).textContent || ''), null, { timeout: 15000 });
    check('Save & close: "Saved", nothing waiting on the phone', /You can close this page/.test(await phone.textContent('.saved')));
    await open(code('WC07', 'clean'));
    await phone.click('[data-job="WC07-FWF|clean"]'); await phone.click('[data-job="WC07-FWF|refill"]'); await settle();
    await open(code('WC09', 'clean'));
    const w9 = (await jobs()).map(j => j.key);
    check('WC09 Clean & restock code: the sewer blocks are Clean & restock only; its FWF have Clean & restock + Refilled', w9.includes('WC09-TOILETBL|clean') && !w9.some(k => k.startsWith('WC09-TOILETBL|pump')) && w9.includes('WC09-FWF|clean'), w9);
    await phone.click('[data-job="WC09-TOILETBL|clean"]'); await settle();
    await open(code('WC09', 'pump'));
    check('WC09 Pump out code: only its FWF (the sewer blocks have no pump out)', JSON.stringify((await jobs()).map(j => j.key)) === '["WC09-FWF|pump"]', await jobs());
    const cardBars = await phone.$$eval('#bars > div', ds => ds.map(d => parseInt(d.querySelector('em').textContent, 10)));

    /* ---- 4. the service holds every tick with its time */
    const T = await ticks();
    const mine = T.filter(t => t.done);
    check('the service holds the 4 completions with their times (WC07 pump, clean, refill; WC09 block clean)', mine.length === 4 && mine.every(t => /T1[12]:0\d:\d\d/.test(t.tapped_at || t.at)), mine.map(t => [t.line, t.task, t.tapped_at]));

    /* ---- 5. the same rule on what the service holds = the phone = GC500's Servicing tab */
    const cfg = { plans: DATA.plans, days: DATA.days, extras: DATA.extras }, now = Date.parse(DAY + 'T22:10:00+10:00');
    const st = SS.jobStates(T, now), all = [].concat(...DATA.areas.map(a => a.refs)), area9 = DATA.areas.find(a => a.refs.some(r => r.ref === 'WC09'));
    const gAll = SS.groupStats(cfg, all, DAY, st), gA = SS.groupStats(cfg, area9.refs, DAY, st);
    check(`the phone shows area ${area9.n} ${gA.pct}% and everything ${gAll.pct}% - the rule on the service's ticks`, cardBars[0] === gA.pct && cardBars[1] === gAll.pct, { cardBars, area: gA.pct, all: gAll.pct });
    check('Refilled was recorded but is not in the % (WC07 is 2 of its 2 counted jobs, not 3)', SS.refStats(cfg, all.find(r => r.ref === 'WC07'), DAY, st).done && SS.taskStats(cfg, all, DAY, st).refill === undefined);
    check('practice ticks do not touch the event: Fri 23, Sat 24 and Sun 25 are each 0%', ['2026-10-23', '2026-10-24', '2026-10-25'].every(d => SS.groupStats(cfg, all, d, st).pct === 0 && SS.groupStats(cfg, all, d, st).d === 0));
    await page.evaluate(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    await page.waitForFunction(p => { const b = document.querySelector('#svc1067 .svc-big b'); return b && parseInt(b.textContent, 10) === p; }, gAll.pct, { timeout: 45000 }).catch(() => {});
    const panel = await page.evaluate(n => ({ all: parseInt((document.querySelector('#svc1067 .svc-big b') || {}).textContent, 10), area: parseInt((document.querySelector('#svc1067 details[data-svc-area="' + n + '"] .svc-pct') || {}).textContent, 10), text: (document.querySelector('#svc1067') || {}).innerText || '' }), area9.n);
    check(`GC500's Servicing tab shows the same: everything ${gAll.pct}%, area ${area9.n} ${gA.pct}%`, panel.all === gAll.pct && panel.area === gA.pct, { panel: [panel.all, panel.area], want: [gAll.pct, gA.pct] });
    check('GC500 shows the completion times (22:0x) beside the jobs', /22:0\d/.test(panel.text));
    await page.locator('#svc1067-host').screenshot({ path: path.join(EVID, 'e2e_servicing_tab.png') }).catch(() => {});
    await phone.screenshot({ path: path.join(EVID, 'e2e_phone_wc09.png') });

    /* ---- 6. the record untouched */
    check('no write to the job record was attempted; the record file is byte-for-byte unchanged', blocked.filter(b => !/tile|google|mapbox|createSession/i.test(b)).length === 0 && hash(fs.readFileSync(path.join(dir, 'records.json'))) === recHash, blocked.slice(0, 5));
    check('no page or card errors', errors.length === 0, errors.slice(0, 5));
  } catch (e) { console.error(e); fail++; fails.push(String(e.message || e).slice(0, 200)); }
  finally { if (browser) await browser.close(); if (server && !exited) { server.kill('SIGTERM'); for (let n = 0; n < 100 && !exited; n++) await wait(50); } }
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '\nFAILED: ' + fails.join(' | ') : '') + '\nevidence (private, local): ' + dir);
  process.exit(fail ? 1 : 0);
})();
