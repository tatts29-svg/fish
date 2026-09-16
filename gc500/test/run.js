#!/usr/bin/env node
/* =====================================================================================================
   Local proof before anything is deployed.

     node gc500/test/run.js

   1. Starts dist/server.js on a free port with throwaway tokens and a throwaway DATA_DIR.
   2. Uploads a stand-in page through /api/admin/app — the real CSS and HTML shell of the live page with a
      stub in place of the app script, so the overlay can be seen doing its work without the 18 MB of
      embedded pictures the live page carries.
   3. Checks: /health names the overlay; /v/<view> and /e/<edit> carry the overlay tag and the right ETag;
      a wrong token is refused; gzip and plain bodies match; a second upload rebuilds the served copy;
      OVERLAY=off serves the page untouched.
   4. Opens the served page in Chromium (Playwright), records every console error, exercises a tab change,
      a press, a hover and a figure roll, and writes screenshots to gc500/test/out/.
   ===================================================================================================== */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib'), os = require('os');
const { spawn } = require('child_process');

const HERE = __dirname, DIST = path.join(HERE, '..', 'dist');
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true });
const VIEW = 'viewtoken_0123456789abcdef', EDIT = 'edittoken_0123456789abcdef';

function req(port, method, p, headers, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: headers || {} }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}
function must(cond, what) { if (!cond) throw new Error('FAILED: ' + what); console.log('ok   ' + what); }
async function waitHealth(port, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await req(port, 'GET', '/health'); if (r.status === 200) return JSON.parse(r.body.toString()); } catch (e) {} await new Promise(r => setTimeout(r, 150)); }
  throw new Error('server did not come up');
}
function startServer(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-'));
  const port = 18000 + Math.floor(Math.random() * 2000);
  const child = spawn(process.execPath, [path.join(DIST, 'server.js')], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: dir, VIEW_TOKEN: VIEW, EDIT_TOKEN: EDIT, NODE_ENV: 'production' }, env || {}), stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', d => { logs += d; }); child.stderr.on('data', d => { logs += d; });
  return { child, port, dir, logs: () => logs };
}
function standInPage() {
  /* the live page's own CSS and shell, then a stub for the app script: enough globals for the overlay to
     find, and a Today pane drawn with the page's own classes so every effect has something to land on */
  const shell = fs.readFileSync(path.join(HERE, 'shell.html'), 'utf8');
  const stub = fs.readFileSync(path.join(HERE, 'stub.js'), 'utf8');
  return shell + '\n<script>\n' + stub + '\n</script>\n</body></html>\n';
}

(async () => {
  const page = standInPage();
  must(/GC500/.test(page.slice(0, 5000)) && /<\/html>\s*$/.test(page.slice(-200)), 'stand-in page passes the upload check');

  /* ---------------- overlay on */
  const S = startServer();
  try {
    const h = await waitHealth(S.port, 8000);
    must(h.build === 'v5.25' && /^[0-9a-f]{12}$/.test(h.overlay), '/health names build v5.25 and the overlay ' + h.overlay);
    let r = await req(S.port, 'GET', '/v/' + VIEW);
    must(r.status === 503, 'no app yet → 503');
    r = await req(S.port, 'POST', '/api/admin/app', { 'x-gc500-token': EDIT, 'Content-Type': 'text/html' }, page);
    must(r.status === 200, 'upload accepted: ' + r.body.toString().slice(0, 80));
    const meta = JSON.parse(r.body.toString());
    await new Promise(x => setTimeout(x, 400));
    r = await req(S.port, 'GET', '/v/' + VIEW);
    must(r.status === 200, '/v/<view> serves');
    must(r.headers['x-gc500-overlay'] === h.overlay, 'served page carries the overlay header');
    const html = r.body.toString();
    must(html.indexOf('id="gc500-overlay"') > 0 && html.indexOf('id="gc500-overlay-js"') > 0, 'overlay style and script are in the served page');
    must(html.lastIndexOf('</body>') > html.indexOf('id="gc500-overlay-js"'), 'overlay sits before </body>');
    must(html.indexOf('<script>\n/* GC500 stand-in') > 0, 'the uploaded page is intact around it');
    const et = r.headers.etag;
    must(et === meta.etag.replace(/"$/, '-' + h.overlay + '"'), 'ETag is the upload etag + overlay hash: ' + et);
    r = await req(S.port, 'GET', '/v/' + VIEW, { 'if-none-match': et });
    must(r.status === 304, 'If-None-Match with the overlaid etag → 304');
    r = await req(S.port, 'GET', '/v/' + VIEW, { 'accept-encoding': 'gzip' });
    must(r.headers['content-encoding'] === 'gzip' && zlib.gunzipSync(r.body).toString() === html, 'gzip body matches the plain body');
    r = await req(S.port, 'GET', '/e/' + EDIT);
    must(r.status === 200 && r.body.toString() === html, '/e/<edit> serves the same overlaid page');
    r = await req(S.port, 'GET', '/v/' + 'nottheviewtoken_00000000000');
    must(r.status === 404, 'a wrong token is refused');
    must(fs.existsSync(path.join(S.dir, 'app.html')) && fs.readFileSync(path.join(S.dir, 'app.html'), 'utf8') === page, 'app.html on disk is the upload, untouched');
    /* a second upload: the served copy is rebuilt */
    const page2 = page.replace('GC500 stand-in', 'GC500 stand-in TWO');
    r = await req(S.port, 'POST', '/api/admin/app', { 'x-gc500-token': EDIT, 'Content-Type': 'text/html' }, page2);
    must(r.status === 200, 'second upload accepted');
    await new Promise(x => setTimeout(x, 500));
    r = await req(S.port, 'GET', '/v/' + VIEW);
    must(r.body.toString().indexOf('GC500 stand-in TWO') > 0 && r.headers.etag !== et, 'served copy follows the new upload with a new etag');
    /* the record API still works around it */
    r = await req(S.port, 'PUT', '/api/doc/delivery/P01', { 'x-gc500-token': EDIT, 'Content-Type': 'application/json' }, JSON.stringify({ _k: 'P01', state: 'on site', set_at: new Date().toISOString(), by: 'test' }));
    must(r.status === 200 && JSON.parse(r.body.toString()).version === 1, 'a record write lands (version 1)');
    r = await req(S.port, 'GET', '/api/state', { 'x-gc500-token': VIEW });
    must(r.status === 200 && JSON.parse(r.body.toString()).docs.delivery.P01.state === 'on site', 'the record reads back');
    /* many writes in a burst: persist() serialises them and records.json ends whole */
    for (let i = 0; i < 25; i++) await req(S.port, 'PUT', '/api/doc/notes/N' + i, { 'x-gc500-token': EDIT, 'Content-Type': 'application/json' }, JSON.stringify({ _k: 'N' + i, v: 'note ' + i }));
    await new Promise(x => setTimeout(x, 700));
    const rec = JSON.parse(fs.readFileSync(path.join(S.dir, 'records.json'), 'utf8'));
    must(rec.version === 26 && Object.keys(rec.docs.notes).length === 25, 'records.json is whole after a burst of writes (version 26)');
    /* SIGTERM flushes what is still inside the debounce */
    await req(S.port, 'PUT', '/api/doc/notes/LAST', { 'x-gc500-token': EDIT, 'Content-Type': 'application/json' }, JSON.stringify({ _k: 'LAST', v: 'last' }));
    S.child.kill('SIGTERM');
    await new Promise(x => S.child.on('exit', x));
    const rec2 = JSON.parse(fs.readFileSync(path.join(S.dir, 'records.json'), 'utf8'));
    must(rec2.docs.notes.LAST && rec2.version === 27, 'a write inside the debounce survives SIGTERM');
    must(/record flushed/.test(S.logs()), 'the shutdown is logged');
    console.log('--- server log ---\n' + S.logs().trim().split('\n').slice(0, 8).join('\n'));
    fs.writeFileSync(path.join(OUT, 'served.html'), html);

    /* ---------------- overlay off: the page goes out untouched */
    const P = startServer({ OVERLAY: 'off', DATA_DIR: S.dir });
    try {
      const h2 = await waitHealth(P.port, 8000);
      must(h2.overlay === 'off', 'OVERLAY=off: /health says off');
      const r2 = await req(P.port, 'GET', '/v/' + VIEW);
      must(r2.headers['x-gc500-overlay'] === 'off' && r2.body.toString().indexOf('gc500-overlay') < 0 && r2.body.toString() === page2, 'OVERLAY=off serves the upload byte for byte');
    } finally { P.child.kill('SIGTERM'); }
  } finally { try { S.child.kill('SIGKILL'); } catch (e) {} }

  /* ---------------- in the browser */
  let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/pw-browsers/../node_modules/playwright'); } catch (e2) {} }
  if (!pw) { console.log('skip playwright: not installed (npm i -g playwright or npx playwright)'); return; }
  const S2 = startServer();
  try {
    await waitHealth(S2.port, 8000);
    await req(S2.port, 'POST', '/api/admin/app', { 'x-gc500-token': EDIT, 'Content-Type': 'text/html' }, page);
    await new Promise(x => setTimeout(x, 400));
    const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
    const errors = [];
    for (const [name, vp] of [['desktop', { width: 1440, height: 900, deviceScaleFactor: 2 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }]]) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
      const pg = await ctx.newPage();
      pg.on('console', m => { if (m.type() === 'error') errors.push(name + ': ' + m.text()); });
      pg.on('pageerror', e => errors.push(name + ': ' + e.message));
      await pg.goto('http://127.0.0.1:' + S2.port + '/e/' + EDIT + '#today', { waitUntil: 'load' });
      await pg.waitForTimeout(900);
      must(await pg.evaluate(() => document.documentElement.getAttribute('data-gc500-overlay') === 'on'), name + ': overlay script ran');
      must(await pg.evaluate(() => !!document.getElementById('gc500-overlay')), name + ': overlay style present');
      const rolled = await pg.evaluate(() => Array.from(document.querySelectorAll('.kpi .v')).map(v => v.firstChild && v.firstChild.data.trim()));
      must(rolled.length && rolled[0] === '146', name + ': the figure settled on its true value after rolling (' + rolled.join(', ') + ')');
      await pg.screenshot({ path: path.join(OUT, name + '-today.png'), fullPage: false });
      if (!vp.isMobile) {
        /* hover a card: it tilts and takes a shine; leave: it settles */
        const card = await pg.$('.kpi');
        const box = await card.boundingBox();
        await pg.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
        await pg.waitForTimeout(150);
        must(await pg.evaluate(() => { const k = document.querySelector('.kpi.gc-tilt'); return !!(k && k.querySelector('.gc-shine') && k.style.getPropertyValue('--gc-ry')); }), name + ': a card under the pointer tilts and carries a shine');
        await pg.screenshot({ path: path.join(OUT, name + '-tilt.png'), clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 } });
        await pg.mouse.move(5, 5);
        await pg.waitForTimeout(400);
        must(await pg.evaluate(() => !document.querySelector('.gc-tilt') && !document.querySelector('.gc-shine')), name + ': it settles when the pointer leaves');
      }
      /* a press ripples */
      const btn = await pg.$('#pane-today .btn');
      await btn.dispatchEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true });
      must(await pg.evaluate(() => !!document.querySelector('#pane-today .btn .gc-rip')), name + ': a press drops a ripple');
      await pg.waitForTimeout(1000);
      must(await pg.evaluate(() => !document.querySelector('.gc-rip')), name + ': the ripple is gone after its animation');
      /* a tab change marks the pane arriving, and the mark clears */
      await pg.evaluate(() => { location.hash = '#register'; });
      await pg.waitForTimeout(120);
      must(await pg.evaluate(() => !!document.querySelector('.pane.on.gc-arrive')), name + ': arriving on a tab is marked');
      await pg.waitForTimeout(1000);
      must(await pg.evaluate(() => !document.querySelector('.gc-arrive')), name + ': the arrival mark clears');
      /* the docs thumbnail repair: the thumbnail's URL opens a window, not the asset drawer */
      await pg.evaluate(() => { location.hash = '#docs'; });
      await pg.waitForTimeout(150);
      const popup = pg.waitForEvent('popup', { timeout: 2000 }).catch(() => null);
      await pg.click('#pane-docs img.thumb[data-open]');
      const pop = await popup;
      must(!!pop, name + ': a drawing thumbnail opens its file (repair R1)');
      must(await pg.evaluate(() => window.__openedAsset === undefined), name + ': and the asset drawer was not opened with a URL');
      if (pop) await pop.close();
      /* motion off: nothing decorative moves */
      await pg.evaluate(() => { localStorage.setItem('gc500.motion', 'off'); motionApply(); });
      await pg.evaluate(() => { location.hash = '#today'; });
      await pg.waitForTimeout(150);
      must(await pg.evaluate(() => getComputedStyle(document.querySelector('header.top'), '::before').animationName === 'none'), name + ': Motion: Off stops the speed line');
      await pg.evaluate(() => { localStorage.removeItem('gc500.motion'); motionApply(); });
      await ctx.close();
    }
    await browser.close();
    must(errors.length === 0, 'no console errors in the browser' + (errors.length ? ':\n  ' + errors.join('\n  ') : ''));
  } finally { try { S2.child.kill('SIGKILL'); } catch (e) {} }
  console.log('\nALL CHECKS PASSED — screenshots in ' + OUT);
})().catch(e => { console.error(e.stack || e); process.exit(1); });
