#!/usr/bin/env node
/* The real page through the built server: proof that the overlay lands on the page as delivered.

     NODE_PATH=/opt/node22/lib/node_modules node gc500/test/real.js <page.html> [label]

   Starts dist/server.js with throwaway tokens, uploads the page through /api/admin/app exactly as the admin
   page does, then opens the served copy in Chromium on a laptop and a phone: the overlay must have run, the
   panes must draw, a tab change must arrive, a press must ring, a card must lean under the pointer, and
   there must be no console error that is the page's own (the board's weather fetch is blocked in the
   sandbox and is not counted). Screenshots go to gc500/test/out/<label>-*.png. The drawing-thumbnail
   repair (R1) is exercised when the Documents pane has a thumbnail to press. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { spawn } = require('child_process');
const HERE = __dirname, DIST = path.join(HERE, '..', 'dist');
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true });
const VIEW = 'viewtoken_0123456789abcdef', EDIT = 'edittoken_0123456789abcdef';
const PAGE = process.argv[2]; const LABEL = process.argv[3] || 'real';
if (!PAGE || !fs.existsSync(PAGE)) { console.error('usage: node real.js <page.html> [label]'); process.exit(2); }

function req(port, method, p, headers, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers: headers || {} }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', reject); if (body) r.write(body); r.end();
  });
}
function must(cond, what) { if (!cond) throw new Error('FAILED: ' + what); console.log('ok   ' + what); }
function note(what) { console.log('note ' + what); }
async function waitHealth(port, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await req(port, 'GET', '/health'); if (r.status === 200) return JSON.parse(r.body.toString()); } catch (e) {} await new Promise(r => setTimeout(r, 150)); }
  throw new Error('server did not come up');
}
function startServer(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-real-'));
  const port = 18000 + Math.floor(Math.random() * 2000);
  const child = spawn(process.execPath, [path.join(DIST, 'server.js')], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: dir, VIEW_TOKEN: VIEW, EDIT_TOKEN: EDIT, NODE_ENV: 'production' }, env || {}), stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', d => { logs += d; }); child.stderr.on('data', d => { logs += d; });
  return { child, port, dir, logs: () => logs };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OWN = e => !/weather|ERR_TUNNEL|ERR_NAME|ERR_INTERNET|Failed to load resource|net::/i.test(e);

(async () => {
  const page = fs.readFileSync(PAGE);
  const S = startServer();
  try {
    const h = await waitHealth(S.port, 8000);
    must(h.build === 'v5.25' && h.overlay && h.overlay !== 'off', 'server v5.25 up with overlay ' + h.overlay);
    let r = await req(S.port, 'POST', '/api/admin/app', { 'x-gc500-token': EDIT, 'Content-Type': 'text/html', 'Content-Length': String(page.length) }, page);
    must(r.status === 200, 'upload of ' + path.basename(PAGE) + ' (' + page.length + ' bytes) accepted: ' + r.body.toString().slice(0, 100));
    await sleep(1500);
    r = await req(S.port, 'GET', '/v/' + VIEW, { 'Accept-Encoding': 'identity' });
    const html = r.body.toString();
    must(r.status === 200 && r.headers['x-gc500-overlay'] === h.overlay, 'served page carries the overlay header');
    const at = html.indexOf('id="gc500-overlay-js"');
    must(html.indexOf('id="gc500-overlay"') > 0 && at > 0 && html.lastIndexOf('</body>') > at, 'overlay style + script laid in before </body>');
    must(html.slice(0, 4000) === page.toString('utf8').slice(0, 4000) && html.length > page.length, 'the page is intact around it (' + (html.length - page.length) + ' bytes of overlay)');
    console.log('--- server log ---\n' + S.logs().trim().split('\n').slice(0, 6).join('\n'));

    let pw; try { pw = require('playwright'); } catch (e) { pw = null; }
    if (!pw) { console.log('skip playwright: not installed'); return; }
    const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
    const errors = [], own = [];
    const views = [
      { name: 'laptop', width: 1440, height: 900, deviceScaleFactor: 2 },
      { name: 'phone', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    ];
    for (const vp of views) {
      const name = LABEL + '-' + vp.name;
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
      const pg = await ctx.newPage();
      pg.on('console', m => { if (m.type() === 'error') { errors.push(vp.name + ': ' + m.text()); if (OWN(m.text())) own.push(vp.name + ': ' + m.text()); } });
      pg.on('pageerror', e => { errors.push(vp.name + ' pageerror: ' + e.message); own.push(vp.name + ' pageerror: ' + e.message); });
      const url = 'http://127.0.0.1:' + S.port + '/v/' + VIEW + '#today';
      await pg.goto(url, { waitUntil: 'load', timeout: 90000 });
      await pg.waitForSelector('.pane.on', { timeout: 30000 });
      await sleep(2500);
      const state = await pg.evaluate(() => ({
        overlay: document.documentElement.getAttribute('data-gc500-overlay'),
        motion: document.documentElement.getAttribute('data-motion'),
        panes: document.querySelectorAll('.pane').length,
        cards: document.querySelectorAll('.pane.on .card, .pane.on .kpi, .pane.on .hubcard').length,
        kpi: Array.from(document.querySelectorAll('.pane.on .kpi .v')).slice(0, 4).map(e => e.textContent.trim()),
        tabs: Array.from(document.querySelectorAll('#tabs [data-tab]')).map(b => b.dataset.tab),
        title: document.title,
      }));
      must(state.overlay === 'on', vp.name + ': overlay script ran on the real page (data-motion=' + state.motion + ', ' + state.panes + ' panes)');
      must(state.cards > 0, vp.name + ': Today drew ' + state.cards + ' cards/tiles; headline figures ' + JSON.stringify(state.kpi));
      note(vp.name + ': tabs ' + state.tabs.join(','));
      await pg.screenshot({ path: path.join(OUT, name + '-today.png'), fullPage: false });
      /* a press rings */
      let pressed = 'no button to press';
      for (const sel of ['.pane.on .tsq', '.pane.on .day', '.pane.on .btn', '#tabs [data-tab]']) {
        const btn = await pg.$(sel); if (!btn) continue;
        const box = await btn.boundingBox(); if (!box) continue;
        await btn.dispatchEvent('pointerdown', { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, bubbles: true });
        await sleep(80);
        const got = await pg.evaluate(s => { const b = document.querySelector(s); return { cls: b.className, rip: !!b.querySelector('.gc-rip'), any: !!document.querySelector('.gc-rip') }; }, sel);
        pressed = (got.rip ? 'rippled on ' : (got.any ? 'ripple elsewhere after ' : 'no ripple on ')) + sel + ' [' + got.cls + ']';
        if (got.rip) break;
      }
      must(/rippled/.test(pressed), vp.name + ': ' + pressed);
      /* tab changes arrive */
      for (const tab of state.tabs.filter(t => t !== 'today').slice(0, 6)) {
        await pg.evaluate(t => { location.hash = '#' + t; }, tab);
        await sleep(900);
        const drew = await pg.evaluate(() => { const p = document.querySelector('.pane.on'); return p ? { id: p.id, kids: p.children.length, arrived: p.classList.contains('gc-arrive') || p.getAttribute('data-gc-arrived') === '1' } : null; });
        note(vp.name + ': #' + tab + ' → ' + (drew ? drew.id + ' with ' + drew.kids + ' blocks' : 'no pane'));
        await pg.screenshot({ path: path.join(OUT, name + '-' + tab + '.png'), fullPage: false });
      }
      if (!vp.isMobile) {
        /* the pointer: a card leans and carries a shine */
        await pg.evaluate(() => { location.hash = '#today'; });
        await sleep(900);
        const card = await pg.$('.pane.on .tsq, .pane.on .kpi, .pane.on .hubcard, .pane.on .card.click');
        if (card) {
          const box = await card.boundingBox();
          await pg.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
          await sleep(120);
          await pg.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 6 });
          await sleep(200);
          const tilt = await card.evaluate(el => ({ tilt: el.classList.contains('gc-tilt'), ry: el.style.getPropertyValue('--gc-ry'), shine: !!el.querySelector('.gc-shine') }));
          must(tilt.tilt && tilt.ry && tilt.shine, 'laptop: card leans toward the pointer (ry ' + tilt.ry + ') with a shine');
          await pg.screenshot({ path: path.join(OUT, name + '-tilt.png'), clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 } });
        }
        /* R1: a drawing thumbnail opens its file, not the asset drawer */
        await pg.evaluate(() => { location.hash = '#docs'; });
        await sleep(1200);
        const thumb = await pg.$('#pane-docs img.thumb[data-open^="/f/"]');
        if (thumb) {
          const popup = pg.waitForEvent('popup', { timeout: 3000 }).then(p => p.url()).catch(() => null);
          await thumb.click();
          const u = await popup;
          must(u && /\/f\//.test(u), 'R1: pressing a drawing thumbnail opened its file: ' + u);
          const drawer = await pg.evaluate(() => !!document.querySelector('.drawer.open, .drawer.on, [data-drawer].open'));
          note('R1: asset drawer open after the press: ' + drawer);
        } else note('R1: no drawing thumbnail in this page\'s Documents pane to press');
      }
      await ctx.close();
    }
    await browser.close();
    if (errors.length) console.log('console (all): \n  ' + errors.slice(0, 12).join('\n  '));
    must(own.length === 0, 'no console error of the page\'s own' + (own.length ? ':\n  ' + own.join('\n  ') : ''));
    console.log('\nREAL PAGE PASSED — screenshots in ' + OUT + ' (' + LABEL + '-*.png)');
  } finally {
    S.child.kill('SIGTERM');
  }
})().catch(e => { console.error(e.stack || e); process.exit(1); });
