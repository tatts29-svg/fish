/* Author: Andrew Fisher. GC500 servicing tracker — END TO END on the REAL server v5.89 (not the mock).
   Andrew, 18 Oct 2026: "purely just a track" · "There is a compmetion qr code for their refernece. They scan. It whe all
   done. And click tap. This only alows them to complete the refernce qr code. Must shows percentage complete for the area.
   And again for everything" · "Sunday night will need a extra. locked and confirmed empty. No water will be needed".

     TMPDIR=<scratch folder> node test_integration.cjs

   Local only: ../../server_v5.89_servicing_tracker_DRAFT/server.js (the bytes that are live, cb32d00e…) on 127.0.0.1 with
   fake tokens and a throw-away DATA_DIR from mkdtemp; its clock set by that folder's fake_clock.js (test only), restarted
   on the same port to step the clock (Fri 22:00, Fri 22:30, Sun 21:00). Never calls the live service, sends no message,
   stops only the server it started. The card is ../card/build_card.js's HTML and tracker block, made through
   POST /api/cards on the edit link, exactly as page v10.63 will. Expected figures come from ../panel_mockup/state.js (the
   main page's copy of the rule) applied to what the server holds (GET /api/ticks on the edit link), so the server, the
   main page's rule and both phones are checked against each other. Two phone contexts (A and B, own addresses). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
let pw;
try { pw = require(path.join(__dirname, '..', '..', 'toolchain', 'node_modules', 'playwright')); }
catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = pw;

const HERE = __dirname, TRACK = path.join(HERE, '..');
const SRV_DIR = path.join(TRACK, '..', 'server_v5.89_servicing_tracker_DRAFT');
const SRV = path.join(SRV_DIR, 'server.js'), CLOCK = path.join(SRV_DIR, 'fake_clock.js');
const OLD = path.join(TRACK, '..', 'server_v5.87_pictures_from_shared_number_LIVE', 'server.js');   /* the rollback target, v5.87 */
const LIVE_SHA = 'cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c';   /* server v5.89 as deployed 18 Oct 07:35 (STATUS.md) */
const { buildCardHtml, trackerConfig, cardScriptHash } = require(path.join(TRACK, 'card', 'build_card.js'));
const SS = require(path.join(TRACK, 'panel_mockup', 'state.js'));
const PANEL = require(path.join(TRACK, 'panel_mockup', 'panel_render.js'));   /* the main page's panel (mock-up renderer) */
const DATA = JSON.parse(fs.readFileSync(path.join(TRACK, 'tracker_data.json'), 'utf8'));
const EVID = path.join(HERE, 'evidence'); fs.mkdirSync(EVID, { recursive: true });
const MAKE_SHEETS = path.join(TRACK, 'print', 'make_sheets.py');
const LIVE_BASE = 'https://gc500-production.up.railway.app';   /* what the print pack writes into its QR codes */
/* decodes every QR code on some pages of a PDF: pdftoppm at 300 dpi, then zxing-cpp (pip-installed in the scratch folder;
   ZXING names its folder, default <TMPDIR>/pylib). Prints [{page, texts}] as JSON. */
const DECODE_PY = [
  'import sys, json, subprocess, tempfile, glob, os',
  'sys.path.insert(0, sys.argv[4])',
  'import zxingcpp',
  'from PIL import Image',
  'pdf, first, last = sys.argv[1], sys.argv[2], sys.argv[3]',
  'out = []',
  'with tempfile.TemporaryDirectory() as d:',
  '    subprocess.run(["pdftoppm", "-r", "300", "-f", first, "-l", last, "-png", pdf, os.path.join(d, "p")], check=True)',
  '    for f in sorted(glob.glob(os.path.join(d, "p*.png"))):',
  '        res = zxingcpp.read_barcodes(Image.open(f), formats=zxingcpp.BarcodeFormat.QRCode)',
  '        out.append({"page": int(os.path.basename(f)[2:-4]), "texts": [r.text for r in res]})',
  'print(json.dumps(out))'].join('\n');
const E = 'local-edit-token-integration', V = 'local-view-token-integration';   /* fake, local only */
const FRI = '2026-10-23', SUN = '2026-10-25';
const wait = ms => new Promise(r => setTimeout(r, ms));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0; const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' — ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 700)); }
};
const section = t => console.log('\n== ' + t);

/* ---- what the data says (never typed in here) */
const CFG = { days: DATA.days, plans: DATA.plans };
const ALL_REFS = [].concat(...DATA.areas.map(a => a.refs));
const REF = Object.fromEntries(ALL_REFS.map(r => [r.ref, r]));
const AREA_OF = Object.fromEntries([].concat(...DATA.areas.map(a => a.refs.map(r => [r.ref, a]))));
const words = (line, d) => SS.tasksFor(CFG, line, d).map(t => DATA.tasks[t]);
const hm = SS.hm;

/* ---- the local server */
function req(port, method, p, headers, body) {
  return new Promise(resolve => {
    const data = body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    const h = Object.assign({}, headers || {}); if (data != null) h['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: h, agent: false }, res => {
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => { const t = Buffer.concat(c).toString(); let j = null; try { j = JSON.parse(t); } catch (e) {} resolve({ status: res.statusCode, headers: res.headers, json: j, text: t }); });
    });
    r.on('error', e => resolve({ status: 0, error: e.code || e.message, headers: {}, json: null, text: '' }));
    if (data != null) r.write(data); r.end();
  });
}
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
let PORT = 0, DIR = null, server = null;
async function startServer(fakeNow, file) {
  const log = fs.openSync(path.join(DIR, 'server.log'), 'a');
  const env = { PATH: process.env.PATH, PORT: String(PORT), DATA_DIR: DIR, VIEW_TOKEN: V, EDIT_TOKEN: E, PUBLIC_BASE: 'http://127.0.0.1:' + PORT, FAKE_NOW: fakeNow };
  const proc = spawn(process.execPath, ['-r', CLOCK, file || SRV], { env, stdio: ['ignore', log, log] });
  let exited = null; proc.on('exit', code => { exited = code; });
  let health = null;
  for (let i = 0; i < 200 && !health && exited === null; i++) { const r = await req(PORT, 'GET', '/health'); if (r.status === 200) health = r.json; else await wait(100); }
  server = { proc, health, exited: () => exited,
    stop: async () => { if (exited === null) { proc.kill('SIGTERM'); for (let i = 0; i < 200 && exited === null; i++) await wait(50); } } };
  return server;
}
const EH = { 'x-gc500-token': E, 'Content-Type': 'application/json', 'x-gc500-who': 'integration test', 'x-real-ip': '10.9.0.1' };
const edit = (method, p, body) => req(PORT, method, p, EH, body);
const phoneApi = (method, p, body, ip) => req(PORT, method, p, { 'Content-Type': 'application/json', 'x-real-ip': ip || '10.7.0.' + (1 + Math.floor(Math.random() * 200)) }, body);

(async () => {
  const t0 = Date.now();
  DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-integration-'));
  PORT = await freePort();
  let browser = null;
  try {
    /* ======================================================================== 0. the server is the live bytes */
    section('0. the server under test');
    const srvBytes = fs.readFileSync(SRV);
    check('server.js is the deployed v5.89 (' + srvBytes.length + ' bytes, sha256 ' + sha(srvBytes).slice(0, 12) + '…)', sha(srvBytes) === LIVE_SHA, sha(srvBytes));
    /* a record on disk that nothing in the tracker may touch */
    const REC = path.join(DIR, 'records.json');
    fs.writeFileSync(REC, JSON.stringify({ version: 77, updated: '2026-10-18T00:00:00.000Z', docs: { delivery: { WC07: { _k: 'WC07', status: 'delivered' }, WC20: { _k: 'WC20', status: 'delivered' } } } }));
    const recSha0 = sha(fs.readFileSync(REC));

    /* ======================================================================== 1. the edit link makes the tracker card (before the event) */
    section('1. making the tracker card through POST /api/cards (server clock Sun 18 Oct 08:00)');
    await startServer('2026-10-18T08:00:00+10:00');
    check('v5.89 starts on 127.0.0.1 (build v5.89, 0 ticks)', server.health && server.health.build === 'v5.89' && server.health.tracker_ticks === 0, server.health);
    const ver0 = (await edit('GET', '/api/version')).json;
    const html = buildCardHtml(DATA), cfg = trackerConfig(DATA);
    const cardBody = extra => Object.assign({ load: 'servicing-tracker:GC500-2026', title: 'GC500 servicing tracker', run_date: '2026-10-22', expires: '2026-10-26',
      keys: [], targets: [], html, tracker: cfg }, extra || {});
    const made = await edit('POST', '/api/cards', cardBody());
    const T = made.json && made.json.token, LINKS = (made.json && made.json.tracker && made.json.tracker.links) || {};
    check('POST /api/cards with the generator\'s HTML and tracker block: 200, a 32-character token, 75 signed links',
      made.status === 200 && /^[A-Za-z0-9_-]{32}$/.test(T || '') && Object.keys(LINKS).length === 75 && Object.values(LINKS).every(s => /^[A-Za-z0-9_-]{16}$/.test(s)),
      { status: made.status, error: made.json && made.json.error, links: Object.keys(LINKS).length });
    check('the server kept the generator\'s 83 lines and 4 days, keys and targets []', made.json && made.json.card.tracker.lines.length === 83 && made.json.card.tracker.days.length === 4 &&
      made.json.card.keys.length === 0 && made.json.card.targets.length === 0);
    /* the secret, read from the throw-away store only to prove the formula and that it never leaves; never printed */
    const keyLine = fs.readFileSync(path.join(DIR, 'tracker_ticks.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).find(e => e.e === 'key' && e.token === T);
    const SECRET = keyLine ? keyLine.key : null;
    const sigOf = ref => crypto.createHmac('sha256', Buffer.from(SECRET, 'base64url')).update(T + ':' + ref, 'utf8').digest('base64url').slice(0, 16);
    check('every link is base64url(HMAC-SHA256(secret, token:REF)) cut to 16', !!SECRET && Object.keys(LINKS).every(r => LINKS[r] === sigOf(r)));

    const BASE = 'http://127.0.0.1:' + PORT + '/d/' + T;
    const tickUrl = (ref, sig) => BASE + '#r=' + ref + '.' + (sig === undefined ? LINKS[ref] : sig);
    const cardGet = await req(PORT, 'GET', '/d/' + T, { 'x-real-ip': '10.9.0.5' });
    const csp = cardGet.headers['content-security-policy'] || '';
    check('GET /d/<token> serves the generator\'s HTML byte for byte', cardGet.status === 200 && cardGet.text === html, { status: cardGet.status, bytes: cardGet.text.length, want: html.length });
    check('the card CSP pins the generator\'s script hash (' + cardScriptHash(html).slice(0, 20) + '…), connect-src self only', csp.indexOf("script-src '" + cardScriptHash(html) + "'") >= 0 && /connect-src 'self'/.test(csp) && /default-src 'none'/.test(csp), csp);
    const ep0 = (await phoneApi('GET', '/d/' + T + '/ticks?since=0')).json;
    check('GET /d/<token>/ticks: now (the server\'s), epoch, seq 0, the 4 days, no ticks, service day 2026-10-18 (08:00 starts it)', ep0 && /^2026-10-17T22:00/.test(ep0.now) && ep0.epoch && ep0.seq === 0 && ep0.days.length === 4 && ep0.ticks.length === 0 && ep0.service_day === '2026-10-18', ep0);

    /* ---- the print pack made from this answer, and its QR codes read back off the paper */
    section('1b. the print pack (make_sheets.py --links) made from the server\'s answer; QR codes read off the PDF');
    const linksFile = path.join(DIR, 'tracker_links_LOCAL.json'), packPdf = path.join(DIR, 'pack_LOCAL.pdf');
    fs.writeFileSync(linksFile, JSON.stringify({ token: T, links: LINKS }));
    const mk = spawnSync('python3', ['-I', MAKE_SHEETS, '--links', linksFile, '--out', packPdf], { encoding: 'utf8', timeout: 180000 });
    const pagesOf = n => { const m = (mk.stdout || '').match(new RegExp('area\\s+' + n + ' [^\\n]*: pages (\\d+)-(\\d+)')); return m ? [m[1], m[2]] : null; };
    check('make_sheets.py builds the live-format pack from {token, links} (55 pages, LIVE QR codes)', mk.status === 0 && /55 pages · 75 locations · LIVE QR codes/.test(mk.stdout || ''), (mk.stderr || mk.stdout || '').slice(-400));
    const paper = {}, maps = {};
    const zx = process.env.ZXING || path.join(os.tmpdir(), 'pylib');
    for (const n of [5, AREA_OF.WC20.n]) {
      const pg = pagesOf(n); if (!pg) continue;
      const dq = spawnSync('python3', ['-I', '-c', DECODE_PY, packPdf, pg[0], pg[1], zx], { encoding: 'utf8', timeout: 180000 });
      let got = []; try { got = JSON.parse(dq.stdout); } catch (e) { console.log('(QR decode: ' + (dq.stderr || '').slice(-300) + ')'); }
      for (const g of got) for (const t of g.texts) {
        const m = t.match(/^https:\/\/gc500-production\.up\.railway\.app\/d\/([A-Za-z0-9_-]+)#r=([A-Za-z0-9]+)\.([A-Za-z0-9_-]+)$/);
        if (m) paper[m[2]] = t; else if (/^https:\/\/www\.google\.com\/maps\/search\//.test(t)) maps[t] = 1;
      }
    }
    fs.rmSync(packPdf, { force: true });   /* 22 MB of throw-away paper */
    const want = r => LIVE_BASE + '/d/' + T + '#r=' + r + '.' + LINKS[r];
    check('the completion QRs printed for WC06, WC07 and WC20 decode to exactly /d/<this token>#r=REF.<the server\'s sig>', ['WC06', 'WC07', 'WC20'].every(r => paper[r] === want(r)), { found: Object.keys(paper) });
    check('area 5 and area ' + AREA_OF.WC20.n + ' print a completion QR for each of their references and no other', AREA_OF.WC06.refs.concat(AREA_OF.WC20.refs).every(r => paper[r.ref] === want(r.ref)) && Object.keys(paper).length === AREA_OF.WC06.refs.length + AREA_OF.WC20.refs.length, Object.keys(paper));
    check('their location QRs are the contract\'s Google Maps pin for each pinned reference', ['WC06', 'WC07', 'WC20'].every(r => maps['https://www.google.com/maps/search/?api=1&query=' + REF[r].pin[0] + ',' + REF[r].pin[1]]), Object.keys(maps).slice(0, 4));
    /* a phone scanning the sheet: the printed link, pointed at this local server instead of the live one */
    const scanned = r => (paper[r] || want(r)).replace(LIVE_BASE, 'http://127.0.0.1:' + PORT);

    browser = await chromium.launch();
    const phones = [];
    async function phone(name, ip) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, extraHTTPHeaders: { 'X-Real-IP': ip } });
      await ctx.addInitScript(() => {
        window.__cspv = []; document.addEventListener('securitypolicyviolation', e => window.__cspv.push(e.violatedDirective + ' ' + e.blockedURI));
      });
      const page = await ctx.newPage();
      const P = { name, ctx, page, reqs: [], errors: [], posts: [], bodies: [] };
      page.on('request', r => { P.reqs.push({ url: r.url(), method: r.method() }); if (r.method() === 'POST') P.posts.push(r.postData()); });
      page.on('response', async r => { try { if (/\/ticks/.test(r.url())) P.bodies.push(await r.text()); } catch (e) { /* page moved on */ } });
      page.on('pageerror', e => P.errors.push('pageerror ' + e.message));
      page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) P.errors.push(m.text()); });
      phones.push(P); return P;
    }
    const live = (P, ms) => P.page.waitForFunction(() => /^Live/.test(document.getElementById('status').textContent), null, { timeout: ms || 25000 });
    const open = async (P, url) => { await P.page.goto('about:blank'); await P.page.goto(url); await live(P); };
    const scan = async (P, url, ref) => { await P.page.evaluate(u => { location.hash = u.slice(u.indexOf('#')); }, url); await P.page.waitForFunction(r => (document.getElementById('refh') || {}).textContent === r, ref); };
    const settle = P => P.page.waitForFunction(() => window.svc1063 && window.svc1063.outbox().length === 0, null, { timeout: 30000 });
    const kick = P => P.page.evaluate(() => window.dispatchEvent(new Event('online')));
    const jobs = P => P.page.$$eval('[data-job]', bs => bs.map(b => ({ key: b.dataset.job, word: b.querySelector('b').textContent, sub: b.querySelector('small').textContent, pressed: b.getAttribute('aria-pressed'), disabled: b.disabled })));
    const job = async (P, key) => (await jobs(P)).find(j => j.key === key) || {};
    const bars = P => P.page.$$eval('#bars > div', ds => ds.map(d => ({ label: d.querySelector('.pn').textContent, pct: d.querySelector('em').textContent, meta: d.querySelector('.pm').textContent })));
    const pressedDay = P => P.page.$eval('.day[aria-pressed="true"]', b => b.dataset.day);
    const banners = P => P.page.$eval('#banners', e => e.textContent);
    const tap = (P, key) => P.page.click('[data-job="' + key + '"]');
    const undo = async (P, key) => { await tap(P, key); await P.page.click('[data-undo="' + key + '"]'); };
    /* what the server holds, and what the main page's rule makes of it */
    const held = async () => { const r = await edit('GET', '/api/ticks?token=' + T); return { ticks: r.json.ticks, now: Date.parse(r.json.now), voids: r.json.voids }; };
    const find = (ticks, q) => ticks.filter(t => Object.keys(q).every(k => t[k] === q[k]));
    const metaOf = (g, word) => (g.finished ? (word === 'area' ? 'Area finished ' : 'All finished ') + hm(g.finished) + ' · ' : '') + g.refsDone + ' of ' + g.refs + ' references · ' + g.d + ' of ' + g.w + ' jobs';
    async function expected(refName, day) {
      const h = await held(), st = SS.jobStates(h.ticks, h.now), a = AREA_OF[refName];
      const ga = SS.groupStats(CFG, a.refs, day, st), go = SS.groupStats(CFG, ALL_REFS, day, st);
      return { area: { pct: ga.pct + '%', meta: metaOf(ga, 'area'), g: ga }, all: { pct: go.pct + '%', meta: metaOf(go, 'all'), g: go }, st, ticks: h.ticks };
    }
    /* wait (up to ms) until a phone's two bars read what the main page's rule makes of the server's ticks */
    async function agrees(P, refName, day, ms) {
      const x = await expected(refName, day);
      const want = [x.area.pct, x.area.meta, x.all.pct, x.all.meta];
      const ok = await P.page.waitForFunction(w => { const ds = [...document.querySelectorAll('#bars > div')]; if (ds.length < 2) return false;
        const got = [ds[0].querySelector('em').textContent, ds[0].querySelector('.pm').textContent, ds[1].querySelector('em').textContent, ds[1].querySelector('.pm').textContent];
        return JSON.stringify(got) === JSON.stringify(w); }, want, { timeout: ms || 20000 }).then(() => true, () => false);
      return { ok, want, got: await bars(P), x };
    }

    /* ---- before the event: the card opens on Friday, jobs shut (the day from the SERVER's clock) */
    section('1c. a phone before the event (server clock 18 Oct)');
    const C = await phone('C', '10.1.0.3');
    await open(C, tickUrl('WC07'));
    check('before the event (server 18 Oct): the card opens on Friday, every job shut "Opens Fri 23 08:00"', await pressedDay(C) === FRI && (await jobs(C)).length === 3 && (await jobs(C)).every(j => j.disabled && /Opens Fri 23 08:00/.test(j.sub)), await jobs(C));
    check('...and says servicing has not started', /Servicing has not started/.test(await banners(C)));
    const early = await phoneApi('POST', '/d/' + T + '/ticks', { ticks: [{ id: 'early' + crypto.randomBytes(9).toString('base64url'), ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'pump', day: FRI, done: true, undoes: [], tapped_at: new Date().toISOString() }] });
    check('the server refuses a Friday tick on 18 Oct (400 future_day)', early.status === 400 && early.json.code === 'future_day', early.json);
    await C.ctx.close(); phones.splice(phones.indexOf(C), 1);
    await server.stop();

    /* ======================================================================== 2. Friday night: two phones, two references, one area */
    section('2. Friday 23 Oct 22:00 — phone A on WC06, phone B on WC07 (both area 5)');
    await startServer('2026-10-23T22:00:00+10:00');
    check('restarted on the same port with the clock at Fri 22:00: the tracker card is still there', server.health && server.health.build === 'v5.89' && (await req(PORT, 'GET', '/d/' + T)).status === 200);
    const ep1 = (await phoneApi('GET', '/d/' + T + '/ticks?since=0')).json;
    check('the epoch survived the restart, service day is Friday', ep1.epoch === ep0.epoch && ep1.service_day === FRI, { before: ep0.epoch, after: ep1.epoch, day: ep1.service_day });
    const A = await phone('A', '10.1.0.1'), B = await phone('B', '10.1.0.2');
    await open(A, scanned('WC06')); await open(B, scanned('WC07'));   /* the links read off the printed sheets */
    const r06 = REF.WC06, r07 = REF.WC07;
    check('A: WC06 big, Area 5, "' + r06.lines[0].qty + ' units at WC06", its asset numbers, Navigate to the pin',
      await A.page.textContent('#refh') === 'WC06' && /Area 5/.test(await A.page.textContent('.refarea')) && (await A.page.textContent('.count')) === r06.lines[0].qty + ' units at WC06' &&
      (await A.page.textContent('.nos')).indexOf(r06.lines[0].nos.join(', ')) >= 0 && (await A.page.$eval('a.nav', a => a.href)) === 'https://www.google.com/maps/dir/?api=1&destination=' + r06.pin[0] + ',' + r06.pin[1]);
    check('B: WC07, "20 units at WC07", all 20 asset numbers', await B.page.textContent('#refh') === 'WC07' && (await B.page.textContent('.count')) === '20 units at WC07' && (await B.page.textContent('.nos')).indexOf(r07.lines[0].nos.join(', ')) >= 0 && r07.lines[0].nos.length === 20);
    check('both open on the server\'s day (Fri 23) with Friday\'s jobs in Andrew\'s words: ' + words(r06.lines[0], FRI).join(' · '),
      await pressedDay(A) === FRI && await pressedDay(B) === FRI && JSON.stringify((await jobs(A)).map(j => j.word)) === JSON.stringify(words(r06.lines[0], FRI)) &&
      (await jobs(A)).every(j => !j.disabled && j.key.startsWith('WC06-')) && (await jobs(B)).every(j => j.key.startsWith('WC07-')));
    let x = await agrees(A, 'WC06', FRI, 5000);
    check('nothing ticked: A reads ' + x.want[0] + ' / ' + x.want[2] + ', ' + x.want[1], x.ok, x);

    await tap(A, 'WC06-FWF|pump'); await settle(A);
    let H = await held();
    const a06p = find(H.ticks, { ref: 'WC06', task: 'pump' });
    check('A\'s tap reached the server once: WC06 · WC06-FWF · pump · Fri 23 · done, with the tap time', a06p.length === 1 && a06p[0].line === 'WC06-FWF' && a06p[0].day === FRI && a06p[0].done === true && !!a06p[0].tapped_at && !('sig' in a06p[0]), a06p);
    check('A\'s button: "Done ' + hm(SS.jobAt(SS.jobStates(H.ticks, H.now), 'WC06-FWF', 'pump', FRI)) + '"', (await job(A, 'WC06-FWF|pump')).sub === 'Done ' + hm(SS.jobAt(SS.jobStates(H.ticks, H.now), 'WC06-FWF', 'pump', FRI)) && (await job(A, 'WC06-FWF|pump')).pressed === 'true');
    x = await agrees(A, 'WC06', FRI, 5000);
    check('A after its tap: area 5 ' + x.want[0] + ', everything ' + x.want[2] + ' (' + x.want[3] + ')', x.ok, x);
    const tB = Date.now();
    x = await agrees(B, 'WC07', FRI, 19000);
    check('B shows A\'s tick within one 15 s poll (' + Math.round((Date.now() - tB) / 1000) + ' s): area 5 ' + x.want[0], x.ok, x);

    await tap(B, 'WC07-FWF|pump'); await tap(B, 'WC07-FWF|water'); await settle(B);
    x = await agrees(B, 'WC07', FRI, 8000);
    check('B ticks WC07 pump + water (20 units each): B reads area 5 ' + x.want[0] + ', everything ' + x.want[2], x.ok, x);
    await kick(A); x = await agrees(A, 'WC06', FRI, 15000);
    check('A reads the same: area 5 ' + x.want[0] + ' · ' + x.want[1], x.ok, x);

    for (const t of ['water', 'clean']) await tap(A, 'WC06-FWF|' + t);
    await tap(B, 'WC07-FWF|clean');
    await settle(A); await settle(B); await kick(A); await kick(B);
    x = await agrees(A, 'WC06', FRI, 15000);
    const fin1 = x.x.area.g.finished;
    check('area 5 all done: A reads 100% and "Area finished ' + hm(fin1 || 0) + '" (its last job), everything ' + x.want[2], x.ok && x.want[0] === '100%' && fin1 > 0, x);
    x = await agrees(B, 'WC07', FRI, 15000);
    check('B reads the same: 100%, Area finished ' + hm(fin1 || 0), x.ok && x.want[0] === '100%', x);
    await A.page.screenshot({ path: path.join(EVID, 'integration_A_area5_finished_390.png') });

    /* undo, asked first */
    await tap(A, 'WC06-FWF|clean');
    check('tapping a done job asks before it undoes', /Undo “Cleaned & restocked”/.test(await A.page.textContent('.confirm')));
    await A.page.click('[data-undo="WC06-FWF|clean"]'); await settle(A);
    H = await held();
    const a06c = find(H.ticks, { ref: 'WC06', task: 'clean', done: true }), u06c = find(H.ticks, { ref: 'WC06', task: 'clean', done: false });
    check('the undo reached the server as done:false naming exactly A\'s clean tick', a06c.length === 1 && u06c.length === 1 && JSON.stringify(u06c[0].undoes) === JSON.stringify([a06c[0].id]), u06c);
    x = await agrees(A, 'WC06', FRI, 5000);
    check('after the undo: A reads area 5 ' + x.want[0] + ', no finish time', x.ok && x.want[0] !== '100%' && !/finished/.test(x.want[1]) && (await job(A, 'WC06-FWF|clean')).pressed === 'false', x);
    await kick(B); x = await agrees(B, 'WC07', FRI, 15000);
    check('B follows the undo: ' + x.want[0], x.ok, x);

    /* ======================================================================== 3. B offline; A's newer tick; B reconnects */
    section('3. phone B offline while phone A ticks newer; B reconnects after a server restart (clock to 22:30)');
    await scan(A, tickUrl('WC07'), 'WC07');                        /* A scans WC07's sheet too */
    H = await held();
    const b1 = find(H.ticks, { ref: 'WC07', task: 'pump', done: true })[0];
    await B.ctx.setOffline(true);
    await undo(B, 'WC07-FWF|pump');                                 /* B, out of signal, takes its own pump-out back */
    const bq = await B.page.evaluate(() => window.svc1063.outbox());
    check('B (offline) queues an untick naming only its own tick b1', bq.length === 1 && bq[0].done === false && JSON.stringify(bq[0].undoes) === JSON.stringify([b1.id]), bq);
    await scan(B, tickUrl('WC06'), 'WC06');                        /* B scans WC06's sheet, still offline */
    await tap(B, 'WC06-FWF|clean');                                 /* and cleans WC06 now: an earlier tap than A's below */
    const bTap = Date.parse((await B.page.evaluate(() => window.svc1063.outbox())).find(e => e.task === 'clean').tapped_at);
    check('B: "No signal · 2 ticks waiting"', /No signal · 2 ticks waiting/.test(await B.page.textContent('#status')), await B.page.textContent('#status'));
    await undo(A, 'WC07-FWF|pump'); await settle(A);                /* A (online) also takes b1 back ... */
    await server.stop();
    await startServer('2026-10-23T22:30:00+10:00');                 /* ... half an hour passes */
    check('server back at Fri 22:30 (same port, same data)', server.health && server.health.build === 'v5.89');
    await kick(A);
    await A.page.waitForFunction(() => window.svc1063.now() > Date.parse('2026-10-23T22:29:00+10:00'), null, { timeout: 20000 });   /* A has read the server's new time */
    await tap(A, 'WC07-FWF|pump'); await settle(A);                 /* ... and A pumps WC07 again: the newer tick */
    await scan(A, tickUrl('WC06'), 'WC06');
    await tap(A, 'WC06-FWF|clean'); await settle(A);                /* A cleans WC06 too, not knowing B already did */
    H = await held();
    const a2 = find(H.ticks, { ref: 'WC07', task: 'pump', done: true }).find(t => t.id !== b1.id);
    check('the server holds A\'s untick of b1 and A\'s newer pump-out a2 (22:30)', !!a2 && find(H.ticks, { ref: 'WC07', task: 'pump', done: false }).length === 1 && hm(Date.parse(a2.at)) === '22:30', H.ticks.filter(t => t.ref === 'WC07' && t.task === 'pump'));
    await B.ctx.setOffline(false); await kick(B); await settle(B);
    H = await held();
    const ub = find(H.ticks, { ref: 'WC07', task: 'pump', done: false }).filter(t => JSON.stringify(t.undoes) === JSON.stringify([b1.id]));
    const bc = find(H.ticks, { ref: 'WC06', task: 'clean', done: true }).find(t => t.id !== a06c[0].id && Date.parse(t.tapped_at) < Date.parse(t.at) - 10 * 60000);
    check('B\'s queue drained: its late untick (naming b1 only) and its WC06 clean are on the server', ub.length === 2 && !!bc, { unticks: ub.length, bc });
    check('B\'s clean keeps B\'s tap time (' + hm(bTap) + '), not its arrival (' + (bc ? hm(Date.parse(bc.at)) : '?') + ')', !!bc && Math.abs(Date.parse(bc.tapped_at) - bTap) < 2000 && hm(Date.parse(bc.at)) === '22:30');
    const st3 = SS.jobStates(H.ticks, H.now);
    check('main page rule: WC07 pump-out still done, at A\'s newer time ' + hm(Date.parse(a2.tapped_at || a2.at)) + ' (B\'s late untick cancelled only b1)', SS.jobAt(st3, 'WC07-FWF', 'pump', FRI) === Math.min(Date.parse(a2.tapped_at || a2.at), Date.parse(a2.at)));
    check('main page rule: WC06 clean done at the earliest uncancelled tap, B\'s ' + hm(bTap), hm(SS.jobAt(st3, 'WC06-FWF', 'clean', FRI)) === hm(bTap));
    await kick(A); await kick(B); await wait(1500);
    await scan(B, tickUrl('WC07'), 'WC07');
    check('B (on WC07): Pumped out done at ' + hm(SS.jobAt(st3, 'WC07-FWF', 'pump', FRI)) + ', not wiped', (await job(B, 'WC07-FWF|pump')).pressed === 'true' && (await job(B, 'WC07-FWF|pump')).sub === 'Done ' + hm(SS.jobAt(st3, 'WC07-FWF', 'pump', FRI)), await job(B, 'WC07-FWF|pump'));
    check('A (on WC06): Cleaned & restocked done at B\'s earlier ' + hm(bTap), (await job(A, 'WC06-FWF|clean')).pressed === 'true' && (await job(A, 'WC06-FWF|clean')).sub === 'Done ' + hm(bTap), await job(A, 'WC06-FWF|clean'));
    x = await agrees(A, 'WC06', FRI, 15000);
    const fin3 = x.x.area.g.finished;
    check('A: area 5 100% again, "Area finished ' + hm(fin3 || 0) + '" (its latest job, A\'s 22:30), everything ' + x.want[2], x.ok && x.want[0] === '100%' && hm(fin3 || 0) === '22:30', x);
    x = await agrees(B, 'WC07', FRI, 15000);
    check('B: the same, ' + x.want[0] + ' · ' + x.want[1], x.ok, x);

    /* ======================================================================== 4. forged codes */
    section('4. a forged completion code is refused');
    const before4 = (await held()).ticks.length;
    await scan(A, tickUrl('WC41', LINKS.WC06), 'WC41');            /* WC06's code pasted onto WC41 */
    await tap(A, 'WC41-FWF|pump');
    await A.page.waitForFunction(() => /Not saved/.test(document.getElementById('banners').textContent), null, { timeout: 15000 }).catch(() => {});
    H = await held();
    check('WC06\'s code used on WC41: the server refuses it (403), stores nothing, the card says "Not saved" and drops the tick',
      H.ticks.length === before4 && /Not saved:.*WC41.*Pumped out.*(cannot complete WC41|not the one printed)/.test(await banners(A)) && (await job(A, 'WC41-FWF|pump')).pressed === 'false' &&
      (await A.page.evaluate(() => window.svc1063.outbox().length)) === 0, await banners(A));
    await A.page.click('[data-dismiss="n0"]');
    await scan(A, tickUrl('WC41', 'AAAAAAAAAAAAAAAA'), 'WC41');     /* a made-up code of the right shape */
    await tap(A, 'WC41-FWF|pump');
    await A.page.waitForFunction(() => /Not saved/.test(document.getElementById('banners').textContent), null, { timeout: 15000 }).catch(() => {});
    check('a made-up 16-character code: refused, nothing stored', (await held()).ticks.length === before4 && /Not saved:.*WC41/.test(await banners(A)));
    await A.page.click('[data-dismiss="n0"]');
    const forge = (o) => ({ ticks: [Object.assign({ id: 'forged' + crypto.randomBytes(9).toString('base64url'), ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'water', day: FRI, done: true, undoes: [], tapped_at: new Date(H.now).toISOString() }, o)] });
    const f1 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ sig: LINKS.WC06 }));
    const f2 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ sig: undefined }));
    const f3 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ ref: 'WC07', line: 'WC06-FWF' }));
    check('straight to the API: another reference\'s code 403 bad_sig, no code 403, WC07\'s code on WC06\'s line 400 line', f1.status === 403 && f1.json.code === 'bad_sig' && f2.status === 403 && f3.status === 400 && f3.json.code === 'line', [f1.json, f2.json, f3.json]);
    check('...and none of them stored anything', (await held()).ticks.length === before4);
    await A.page.evaluate(() => { location.hash = '#r=WC07'; });
    await A.page.waitForFunction(() => window.svc1063.mode() === 'view');
    check('a code with no signature: view only, no tick buttons', (await A.page.$$('[data-job]')).length === 0 && /no completion code/.test(await banners(A)));


    /* ======================================================================== 4b. 08:00 Saturday */
    section('4b. Sat 24 Oct 07:59:35 → 08:00 on the server\'s own clock: the day moves on; a crew still finishing Friday can stay on it');
    await server.stop();
    await startServer('2026-10-24T07:59:35+10:00');
    const SAT = '2026-10-24';
    await open(A, tickUrl('WC09'));
    check('07:59 Saturday is still Friday\'s service: A opens on Fri 23, "Open now · closes 08:00 Sat 24"', await pressedDay(A) === FRI && /Open now · closes 08:00 Sat 24/.test(await A.page.textContent('#window')), await A.page.textContent('#window'));
    await tap(A, 'WC09-FWF|pump'); await settle(A);
    check('a tick at 07:59 lands on Friday', find((await held()).ticks, { line: 'WC09-FWF', task: 'pump', day: FRI }).length === 1);
    await A.page.waitForFunction(() => window.svc1063.now() > Date.parse('2026-10-24T08:00:03+10:00'), null, { timeout: 45000 });
    await kick(A);
    await A.page.waitForFunction(d => (document.querySelector('.day[aria-pressed="true"]') || {}).dataset.day === d, SAT, { timeout: 20000 }).catch(() => {});
    const svcSat = (await phoneApi('GET', '/d/' + T + '/ticks?since=999999')).json.service_day;
    check('at 08:00 the server says Saturday (' + svcSat + ') and A moves on by itself: "Now Saturday 24\'s service"', svcSat === SAT && await pressedDay(A) === SAT && /Now Saturday 24's service/.test(await banners(A)), [svcSat, await banners(A)]);
    check('A ticked in the last hour, so it is offered "Stay on Friday 23"', await A.page.$('[data-stay="' + FRI + '"]') !== null);
    await A.page.click('[data-stay="' + FRI + '"]');
    check('staying: loud banner "You are on Friday 23\'s service"', await pressedDay(A) === FRI && /You are on Friday 23's service/i.test(await banners(A)));
    await tap(A, 'WC09-FWF|water'); await settle(A);
    check('a late Friday tick after 08:00 is accepted by the server (a past day)', find((await held()).ticks, { line: 'WC09-FWF', task: 'water', day: FRI }).length === 1);
    await A.page.click('[data-back]');
    await tap(A, 'WC09-FWF|pump'); await settle(A);
    check('back on Saturday: the same job is Saturday\'s now, a tick of its own', await pressedDay(A) === SAT && find((await held()).ticks, { line: 'WC09-FWF', task: 'pump', day: SAT }).length === 1);

    /* ======================================================================== 5. Sunday */
    section('5. Sunday 25 Oct 21:00 — locked & confirmed empty added, no water; tanks pumped out only');
    await server.stop();
    await startServer('2026-10-25T21:00:00+10:00');
    check('server back at Sun 21:00', server.health && server.health.build === 'v5.89');
    await kick(B);
    await B.page.waitForFunction(d => (document.querySelector('.day[aria-pressed="true"]') || {}).dataset.day === d, SUN, { timeout: 20000 }).catch(() => {});
    check('B, left open since Friday, moves itself to Sunday from the server\'s clock and says so', await pressedDay(B) === SUN && /Now Sunday 25's service/.test(await banners(B)), [await pressedDay(B), await banners(B)]);
    check('B (WC07 FWF) on Sunday: ' + words(r07.lines[0], SUN).join(' · ') + ' — no water', JSON.stringify((await jobs(B)).map(j => j.word)) === JSON.stringify(words(r07.lines[0], SUN)) &&
      words(r07.lines[0], SUN).indexOf('Locked & confirmed empty') >= 0 && words(r07.lines[0], SUN).indexOf('Fresh water refilled') < 0, (await jobs(B)).map(j => j.word));
    await open(A, scanned('WC20'));   /* read off the printed sheet */
    const wc20 = REF.WC20, blk = wc20.lines.find(l => l.kind === 'block'), tnk = wc20.lines.find(l => l.kind === 'tank');
    let J = await jobs(A);
    check('A opens WC20 on Sunday; the window says last night', await pressedDay(A) === SUN && /last night/.test(await A.page.textContent('#window')));
    check('WC20 toilet block: ' + words(blk, SUN).join(' · '), JSON.stringify(J.filter(j => j.key.startsWith(blk.id + '|')).map(j => j.word)) === JSON.stringify(words(blk, SUN)), J);
    check('WC20 waste tank: Pumped out only', JSON.stringify(J.filter(j => j.key.startsWith(tnk.id + '|')).map(j => j.word)) === JSON.stringify(['Pumped out']), J);
    check('no water anywhere on Sunday', !/Fresh water/.test(await A.page.textContent('#view')));
    await tap(A, blk.id + '|lock'); await tap(A, tnk.id + '|pump'); await tap(B, 'WC07-FWF|lock');
    await settle(A); await settle(B);
    H = await held();
    check('the server takes Locked & confirmed empty on Sunday (block and FWF) and the tank\'s pump-out', find(H.ticks, { line: blk.id, task: 'lock', day: SUN }).length === 1 && find(H.ticks, { line: tnk.id, task: 'pump', day: SUN }).length === 1 && find(H.ticks, { line: 'WC07-FWF', task: 'lock', day: SUN }).length === 1);
    const s1 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'water', day: SUN, tapped_at: new Date(H.now).toISOString() }));
    const s2 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ ref: 'WC20', sig: LINKS.WC20, line: tnk.id, task: 'clean', day: SUN, tapped_at: new Date(H.now).toISOString() }));
    const s3 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'lock', day: FRI, tapped_at: new Date(H.now).toISOString() }));
    check('the server refuses water on Sunday, a clean on a waste tank, and the lock on Friday (400 task)', [s1, s2, s3].every(r => r.status === 400 && r.json.code === 'task'), [s1.json, s2.json, s3.json]);
    await kick(A); x = await agrees(A, 'WC20', SUN, 15000);
    check('A: area ' + AREA_OF.WC20.n + ' ' + x.want[0] + ' and everything ' + x.want[2] + ' — Sunday counts ' + x.x.all.g.w + ' jobs', x.ok && x.x.all.g.w === SS.groupStats(CFG, ALL_REFS, SUN, {}).w, x);
    await kick(B); x = await agrees(B, 'WC07', SUN, 15000);
    check('B: area 5 on Sunday ' + x.want[0] + ' · ' + x.want[3], x.ok, x);
    await A.page.screenshot({ path: path.join(EVID, 'integration_A_sunday_WC20_390.png') });
    await B.page.click('#day-' + FRI);
    check('B picks Friday: loud banner, and Friday\'s area 5 still reads 100% finished 22:30 from the server', /You are on Friday 23's service/i.test(await banners(B)) && (await bars(B))[0].pct === '100%' && /Area finished 22:30/.test((await bars(B))[0].meta), await bars(B));
    await B.page.click('[data-back]');
    check('"Back to Sunday 25"', await pressedDay(B) === SUN);

    /* ======================================================================== 6. the main page's panel from the same server */
    section('6. the main page\'s panel (panel_render.js + state.js) drawn from GET /api/ticks on the edit link');
    H = await held();
    const panel = day => PANEL.svcPanelHtml({ D: DATA, S: SS, events: H.ticks, now: H.now, lastRead: H.now, day, open: {} });
    const areaRow = (html, n) => { const m = html.match(new RegExp('data-svc-area="' + n + '"[\\s\\S]*?<span class="svc-pct">(\\d+)%</span><span class="svc-meta">([^<]*(?:<span class="fin">[^<]*</span>)?[^<]*)</span>')); return m ? { pct: m[1] + '%', meta: m[2].replace(/<[^>]+>/g, '') } : null; };
    const pFri = panel(FRI), pSun = panel(SUN);
    const r5 = areaRow(pFri, 5);
    check('panel, Friday: area 5 100%, "2 of 2 locations · finished Fri 22:30" — what both phones showed', !!r5 && r5.pct === '100%' && r5.meta === '2 of 2 locations · finished Fri 22:30', r5);
    const allSun = (pSun.match(/<div class="svc-big"><b>(\d+)%<\/b>/) || [])[1];
    const barsA = await bars(A);
    check('panel, Sunday: everything ' + allSun + '% and area ' + AREA_OF.WC20.n + ' ' + (areaRow(pSun, AREA_OF.WC20.n) || {}).pct + ' — the same as phone A', allSun + '%' === barsA[1].pct && (areaRow(pSun, AREA_OF.WC20.n) || {}).pct === barsA[0].pct, { panel: [allSun, areaRow(pSun, AREA_OF.WC20.n)], phone: barsA });
    check('panel, Friday fold: WC07 Pumped out shows 22:30 (A\'s newer tick, after B\'s late untick)', /<b>WC07<\/b>[\s\S]*?<td class="ok">[\s\S]*?<time>22:30<\/time>/.test(pFri));

    /* ======================================================================== 7. a TEST tracker: void and withdraw */
    section('7. a TEST tracker on another load: its tick voided on the edit link, then the card withdrawn');
    const mainBefore = (await held()).ticks.length;
    const tm = await edit('POST', '/api/cards', cardBody({ load: 'servicing-tracker:TEST', title: 'TEST servicing tracker' }));
    const TT = tm.json && tm.json.token, TL = (tm.json && tm.json.tracker && tm.json.tracker.links) || {};
    check('a TEST tracker on load servicing-tracker:TEST is made beside the real one (own token, own 75 codes)', tm.status === 200 && TT && TT !== T && Object.keys(TL).length === 75 && TL.WC12 !== LINKS.WC12, tm.json && tm.json.error);
    const W = await phone('W', '10.1.0.7');
    await open(W, 'http://127.0.0.1:' + PORT + '/d/' + TT + '#r=WC12.' + TL.WC12);
    check('the real tracker\'s WC12 code does not work on the TEST card (403)', (await phoneApi('POST', '/d/' + TT + '/ticks', forge({ ref: 'WC12', sig: LINKS.WC12, line: 'WC12-FWF', task: 'pump', day: SUN, tapped_at: new Date(H.now).toISOString() }))).status === 403);
    await tap(W, 'WC12-FWF|pump'); await settle(W);
    const tt = (await edit('GET', '/api/ticks?token=' + TT)).json;
    const a12 = AREA_OF.WC12;
    check('W\'s tick is on the TEST tracker only; the real one is untouched', tt.ticks.length === 1 && tt.ticks[0].ref === 'WC12' && (await held()).ticks.length === mainBefore, tt.ticks);
    const wPct1 = (await bars(W))[0].pct;
    const postsBeforeVoid = W.posts.length;
    const vd = await edit('POST', '/api/ticks/void', { token: TT, ids: [tt.ticks[0].id] });
    check('the edit link voids it: one void line, the epoch moves on', vd.status === 200 && vd.json.voided.length === 1 && vd.json.epoch !== tt.epoch, vd.json);
    await kick(W);
    await W.page.waitForFunction(() => document.querySelector('[data-job="WC12-FWF|pump"]').getAttribute('aria-pressed') === 'false', null, { timeout: 15000 }).catch(() => {});
    await wait(1500);
    const tt2 = (await edit('GET', '/api/ticks?token=' + TT)).json;
    check('W drops the voided tick (area ' + a12.n + ' ' + wPct1 + ' -> ' + (await bars(W))[0].pct + '); the server still holds it, voided, and nothing new', (await job(W, 'WC12-FWF|pump')).pressed === 'false' && (await bars(W))[0].pct === '0%' && tt2.ticks.length === 1 && tt2.ticks[0].voided === true, { job: await job(W, 'WC12-FWF|pump'), ticks: tt2.ticks });
    const resends = W.posts.slice(postsBeforeVoid).length;
    check('after the void W re-sent its tick at most once (answered already + voided) and then stopped (' + resends + ' post' + (resends === 1 ? '' : 's') + ')', resends <= 1 && (await W.page.evaluate(() => window.svc1063.outbox().length)) === 0, W.posts.slice(postsBeforeVoid));
    const wd = await edit('DELETE', '/api/cards/' + TT);
    await kick(W);
    await W.page.waitForFunction(() => window.svc1063.final() === 'withdrawn', null, { timeout: 15000 }).catch(() => {});
    check('withdrawn on the edit link: W stops ("This tracker has been withdrawn"), its jobs shut', wd.status === 200 && await W.page.evaluate(() => window.svc1063.final()) === 'withdrawn' && /withdrawn/i.test(await banners(W)) && (await jobs(W)).every(j => j.disabled), await banners(W));
    const wReq = W.reqs.length; await wait(3000); await kick(W); await wait(500);
    check('...and makes no more requests, even on signal back', W.reqs.length === wReq, W.reqs.slice(wReq).map(r => r.method + ' ' + r.url));
    check('the real tracker still answers (200) with every tick', (await phoneApi('GET', '/d/' + T + '/ticks?since=0')).status === 200 && (await held()).ticks.length === mainBefore);


    /* ---- the card folder's mock answers the edit link the way the live server does (page v10.63 is tested on it) */
    section('7b. parity: ../card/mock_server.js answers the edit link with the live v5.89 shapes and codes');
    const realAll = (await edit('GET', '/api/ticks')).json;
    const real409 = await edit('POST', '/api/cards', cardBody());
    const real400 = await edit('POST', '/api/cards', cardBody({ tracker: { days: [], lines: [], plans: {} } }));
    const { createMock } = require(path.join(TRACK, 'card', 'mock_server.js'));
    const mock = createMock({ control: true }); await mock.listen();
    try {
      mock.setNow(new Date(H.now).toISOString());
      const ME = { 'Content-Type': 'application/json', 'x-gc500-token': mock.options.editToken };
      const mreq = (method, p, body, hdr) => fetch(mock.base + p, { method, headers: hdr || ME, body: body == null ? undefined : JSON.stringify(body) }).then(async r => ({ status: r.status, json: await r.json().catch(() => null) }));
      const mm = await mreq('POST', '/api/cards', cardBody({ load: 'servicing-tracker:TEST', title: 'TEST servicing tracker' }));
      const MT = mm.json.token, mid = 'mocktick' + crypto.randomBytes(9).toString('base64url');
      await mreq('POST', '/d/' + MT + '/ticks', { ticks: [{ id: mid, ref: 'WC12', sig: mm.json.tracker.links.WC12, line: 'WC12-FWF', task: 'pump', day: SUN, done: true, undoes: [], tapped_at: new Date(mock.now()).toISOString() }] }, { 'Content-Type': 'application/json' });
      const mt1 = await mreq('GET', '/api/ticks?token=' + MT), mv = await mreq('POST', '/api/ticks/void', { token: MT, ids: [mid] }), mt2 = await mreq('GET', '/api/ticks?token=' + MT);
      const mall = await mreq('GET', '/api/ticks'), mu = await mreq('GET', '/api/ticks?token=nosuchtokennosuchtokennosuch');
      const mx = await mreq('POST', '/api/cards', cardBody()), m409 = await mreq('POST', '/api/cards', cardBody()), m400 = await mreq('POST', '/api/cards', cardBody({ tracker: { days: [], lines: [], plans: {} } }));
      const md = await mreq('DELETE', '/api/cards/' + MT);
      const ru = await edit('GET', '/api/ticks?token=nosuchtokennosuchtokennosuch');
      const K = o => o && typeof o === 'object' ? Object.keys(o).sort().join(',') : String(o);
      const pairs = [
        ['POST /api/cards tracker block', K(tm.json.tracker), K(mm.json.tracker)],
        ['GET /api/ticks?token=', K(tt), K(mt1.json)],
        ['a tick in it', K(tt.ticks[0]), K(mt1.json.ticks[0])],
        ['a voided tick', K(tt2.ticks[0]), K(mt2.json.ticks[0])],
        ['a void', K(tt2.voids[0]), K(mt2.json.voids[0])],
        ['POST /api/ticks/void', K(vd.json) + ' voided:' + Array.isArray(vd.json.voided), K(mv.json) + ' voided:' + Array.isArray(mv.json.voided)],
        ['GET /api/ticks (no token)', K(realAll) + ' / ' + K(realAll.trackers[0]), K(mall.json) + ' / ' + K(mall.json.trackers[0])],
        ['unknown token', ru.status + ' ' + ru.json.code, mu.status + ' ' + mu.json.code],
        ['second tracker for a load', real409.status + ' ' + real409.json.code + ' token:' + (real409.json.token === T), m409.status + ' ' + m409.json.code + ' token:' + (m409.json.token === mx.json.token)],
        ['a bad tracker', real400.status + ' ' + real400.json.code, m400.status + ' ' + m400.json.code],
        ['DELETE /api/cards/<t>', K(wd.json) + ' ' + (wd.json.withdrawn === TT), K(md.json) + ' ' + (md.json.withdrawn === MT)],
      ];
      const off = pairs.filter(([, a, b]) => a !== b);
      check('the mock\'s edit-link answers have the live keys and codes (' + pairs.map(p => p[0]).join('; ') + ')', off.length === 0, off);
    } finally { await mock.close(); }

    /* ======================================================================== 8. too many from one address: 429 and Retry-After */
    section('8. 429 from the real limiter: the card waits as told, then sends (about a minute)');
    const R = await phone('R', '10.1.0.9');
    await open(R, BASE + '/#r=WC10.' + LINKS.WC10);   /* the address with a trailing slash */
    let junk = 0; for (let i = 0; i < 60; i++) { const j = await phoneApi('POST', '/d/' + T + '/ticks', { ticks: [] }, '10.1.0.9'); if (j.status === 400) junk++; }
    const over = await phoneApi('POST', '/d/' + T + '/ticks', { ticks: [] }, '10.1.0.9');
    check('(60 junk posts from R\'s address use its minute; the 61st is 429 with Retry-After ' + over.headers['retry-after'] + ' s)', junk === 60 && over.status === 429 && +over.headers['retry-after'] > 0, { junk, status: over.status });
    await tap(R, 'WC10-FWF|pump');
    await R.page.waitForFunction(() => /^Busy · trying again in \d+ s/.test(document.getElementById('status').textContent), null, { timeout: 10000 }).catch(() => {});
    check('R: "Busy · trying again in … s", the tick kept', /^Busy · trying again in \d+ s · 1 tick waiting/.test(await R.page.textContent('#status')) && (await R.page.evaluate(() => window.svc1063.outbox().length)) === 1, await R.page.textContent('#status'));
    const tR = Date.now();
    await R.page.waitForFunction(() => window.svc1063.outbox().length === 0, null, { timeout: 90000 }).catch(() => {});
    check('R sends it by itself once the server allows (' + Math.round((Date.now() - tR) / 1000) + ' s), stored once', find((await held()).ticks, { ref: 'WC10', task: 'pump', day: SUN }).length === 1);
    check('R opened /d/<token>/ and its ticks went to /d/<token>/ticks (never //ticks)', R.reqs.filter(r => r.method === 'POST').length >= 1 && R.reqs.filter(r => /ticks/.test(r.url)).every(r => new URL(r.url).pathname === '/d/' + T + '/ticks'), R.reqs.filter(r => /ticks/.test(r.url)).slice(-2).map(r => r.url));

    /* ======================================================================== 9. rollback to v5.87 and back */
    section('9. rollback: v5.87 on the same data answers /ticks with its HTML 404; the card waits, then sends on v5.89');
    await server.stop();
    await startServer('2026-10-25T21:30:00+10:00', OLD);
    check('v5.87 starts on v5.89\'s data (build ' + (server.health && server.health.build) + ')', server.health && server.health.build === 'v5.87', server.health);
    check('v5.87 still serves the tracker card page', (await req(PORT, 'GET', '/d/' + T, { 'x-real-ip': '10.9.0.6' })).status === 200);
    await kick(B);
    await B.page.waitForFunction(() => /being updated/.test(document.getElementById('banners').textContent), null, { timeout: 20000 }).catch(() => {});
    await tap(B, 'WC07-FWF|clean');
    await wait(1500);
    check('B: "Service being updated · 1 tick waiting", the tick kept, the card not stopped', /^Service being updated · 1 tick waiting/.test(await B.page.textContent('#status')) && await B.page.evaluate(() => window.svc1063.final()) === null && (await B.page.evaluate(() => window.svc1063.outbox().length)) === 1, await B.page.textContent('#status'));
    await server.stop();
    await startServer('2026-10-25T21:31:00+10:00');
    check('back on v5.89', server.health && server.health.build === 'v5.89');
    const tRb = Date.now();
    await B.page.waitForFunction(() => window.svc1063.outbox().length === 0 && /^Live/.test(document.getElementById('status').textContent), null, { timeout: 90000 }).catch(() => {});
    check('B carries on by itself (' + Math.round((Date.now() - tRb) / 1000) + ' s): the tick stored once, Live again', find((await held()).ticks, { ref: 'WC07', task: 'clean', day: SUN }).length === 1 && /^Live/.test(await B.page.textContent('#status')), await B.page.textContent('#status'));

    /* ======================================================================== 10. after the event */
    section('10. Tue 27 Oct 00:30: the tracker has finished (410)');
    await server.stop();
    await startServer('2026-10-27T00:30:00+10:00');
    await kick(A); await kick(B);
    await A.page.waitForFunction(() => window.svc1063.final() === 'expired', null, { timeout: 75000 }).catch(() => {});
    await B.page.waitForFunction(() => window.svc1063.final() === 'expired', null, { timeout: 75000 }).catch(() => {});
    check('both phones: "Servicing has finished", ticking stops', await A.page.evaluate(() => window.svc1063.final()) === 'expired' && await B.page.evaluate(() => window.svc1063.final()) === 'expired' && /Servicing has finished/.test(await banners(A)) && (await jobs(A)).every(j => j.disabled), await banners(A));
    const g410 = await req(PORT, 'GET', '/d/' + T, { 'x-real-ip': '10.9.0.6' }), p410 = await phoneApi('POST', '/d/' + T + '/ticks', forge({ ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'pump', day: SUN }));
    check('the card page is 410 "has finished", a tick is 410 expired', g410.status === 410 && /has finished/.test(g410.text) && p410.status === 410 && p410.json.code === 'expired');
    const after = await edit('GET', '/api/ticks?token=' + T);
    check('the edit link still reads every tick for the main page (expired: true)', after.status === 200 && after.json.expired === true && after.json.ticks.length === (await held()).ticks.length && after.json.ticks.length > 0);

    /* ======================================================================== 11. no record change, no secret out, a clean page */
    section('11. the record untouched, the secret kept, the pages clean');
    const ver1 = (await edit('GET', '/api/version')).json;
    check('records.json byte for byte the same (sha256 ' + recSha0.slice(0, 12) + '…)', sha(fs.readFileSync(REC)) === recSha0);
    check('/api/version unchanged (record version ' + (ver0 && ver0.version) + ')', JSON.stringify(ver0 && ver0.version) === JSON.stringify(ver1 && ver1.version) && ver0.version !== undefined, [ver0, ver1]);
    const logLines = fs.readFileSync(path.join(DIR, 'writes.log'), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return { what: '?' + l.slice(0, 40) }; } });
    const whats = [...new Set(logLines.map(l => l.what))].sort();
    check('writes.log holds only card and tracker lines: ' + whats.join(', '), whats.every(w => ['card made', 'card open', 'card withdrawn', 'tracker ticks', 'tracker ticks voided'].indexOf(w) >= 0), whats);
    const phoneText = phones.flatMap(P => P.bodies).join('\n');
    const listing = (await edit('GET', '/api/cards')).text + (await edit('GET', '/api/ticks')).text + (await edit('GET', '/api/ticks?token=' + T)).text + (await edit('GET', '/api/ticks?token=' + TT)).text + made.text + tm.text;
    const TSECRET = (fs.readFileSync(path.join(DIR, 'tracker_ticks.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).find(e => e.e === 'key' && e.token === TT) || {}).key;
    const files = ['cards.json', 'writes.log', 'server.log'].map(f => { try { return fs.readFileSync(path.join(DIR, f), 'utf8'); } catch (e) { return ''; } }).join('\n');
    check('neither tracker\'s secret is in a phone answer, a listing (cards, ticks), a card answer, cards.json, writes.log or the server log', [SECRET, TSECRET].every(k => !!k && phoneText.indexOf(k) < 0 && listing.indexOf(k) < 0 && files.indexOf(k) < 0));
    check('no completion code is handed back to a phone (no sig in any /ticks answer)', Object.values(LINKS).concat(Object.values(TL)).every(s => phoneText.indexOf(s) < 0));
    for (const P of phones) {
      check(P.name + ': no Content-Security-Policy violation', (await P.page.evaluate(() => window.__cspv)).length === 0, await P.page.evaluate(() => window.__cspv));
      check(P.name + ': every request stayed on 127.0.0.1:' + PORT, P.reqs.every(r => /^(about:|http:\/\/127\.0\.0\.1:)/.test(r.url) && (r.url.startsWith('about:') || new URL(r.url).port === String(PORT))), P.reqs.filter(r => !r.url.startsWith('http://127.0.0.1:' + PORT) && !r.url.startsWith('about:')).map(r => r.url));
      check(P.name + ': no script errors', P.errors.length === 0, P.errors);
      check(P.name + ': localStorage holds only gc500.svc1063.* keys', (await P.page.evaluate(() => Object.keys(localStorage))).every(k => k.startsWith('gc500.svc1063.')));
    }
    const sentKeys = [...new Set(phones.flatMap(P => P.posts).filter(Boolean).flatMap(b => JSON.parse(b).ticks.flatMap(t => Object.keys(t))))].sort();
    check('ticks the phones sent carry only the contract keys (no names): ' + sentKeys.join(', '), JSON.stringify(sentKeys) === JSON.stringify(['day', 'done', 'id', 'line', 'ref', 'sig', 'tapped_at', 'task', 'undoes']), sentKeys);
    check('every post the phones made stayed under 2 KB', phones.flatMap(P => P.posts).filter(Boolean).every(b => Buffer.byteLength(b) <= 2048));
    check('the server never stopped by itself', server.exited() === null);
  } catch (e) {
    check('the run finished without an exception', false, String(e && e.stack || e));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await server.stop();
  }
  console.log('\n' + pass + ' passed, ' + fail + ' failed in ' + Math.round((Date.now() - t0) / 1000) + ' s' + (fails.length ? '\nFAILED: ' + fails.join(' | ') : ''));
  console.log('(throw-away DATA_DIR: ' + DIR + ')');
  process.exit(fail ? 1 : 0);
})();
