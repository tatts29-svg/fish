// v8.19 - the load plan card and the meet point drawer at phone widths. Author: Andrew Fisher.
// READ ONLY (GET-only harness, every write aborted). At 390 and 400 px wide, with every load and every fold open, no part
// of the Event Portables card may reach past the screen or past the card (nothing clipped, no sideways scroll), and the
// meet point box in the WC02 and WC61 drawers must sit inside the screen. Screenshots go to SHOTS.
//   cd 03_GC500_Delivery_Control && PAGE=<build> SHOTS=<dir> node v8.19_meet_points_ep_plan_DRAFT/evidence/phone819.js
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.19/GC500_Delivery_Control_hosted.html');
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, {recursive: true});
const wait = ms => new Promise(r => setTimeout(r, ms));
let passes = 0, fails = 0; const ok = (c, what, d = '') => { c ? passes++ : fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' ? '  - ' + JSON.stringify(d).slice(0, 600) : '')); };
async function run(W) {
  const name = `phone ${W}`; console.log(`\n== ${name}`);
  const s = await open({pageFile: BUILD, hash: '#timeline', W, H: 844, dpr: 2, mobile: true}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length && typeof ep819Html === 'function', null, {timeout: 240000});
  await wait(2500); await p.evaluate(() => { window.print = () => {}; go('timeline'); }); await wait(2000);
  await p.evaluate(() => { document.querySelectorAll('#ep819 [data-ep819-ld]').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); }); document.querySelectorAll('#ep819 details').forEach(d => { d.open = true; }); });
  await wait(800);
  const M = await p.evaluate(() => { const c = document.getElementById('ep819'), cr = c.getBoundingClientRect(), vw = document.documentElement.clientWidth; let worst = null;
    c.querySelectorAll('*').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; const over = Math.max(r.right - vw, r.right - cr.right);
      if (over > 0.5 && (!worst || over > worst.over)) worst = {over: Math.round(over), right: Math.round(r.right), tag: e.tagName.toLowerCase() + '.' + String(e.className).split(' ').join('.'), text: (e.textContent || '').slice(0, 50)}; });
    return {vw, card: Math.round(cr.right), open: c.querySelectorAll('.ep819-b:not([hidden])').length, folds: c.querySelectorAll('details[open]').length, page: document.documentElement.scrollWidth, worst,
      stops: [...c.querySelectorAll('.ep819-st tbody tr')].length}; });
  ok(M.open === 5 && M.folds >= 1, `${name}: all 5 loads and the fold are open`, {open: M.open, folds: M.folds});
  ok(!M.worst && M.card <= M.vw, `${name}: nothing in the card reaches past the screen or the card (${M.stops} stop rows)`, M);
  ok(M.page <= M.vw, `${name}: the page does not scroll sideways`, {page: M.page, vw: M.vw});
  for (const sel of ['.ep819-ld', '.ep819-qt']) { const el = await p.$(`#ep819 ${sel}`); await el.scrollIntoViewIfNeeded(); await wait(300); await p.screenshot({path: path.join(SHOTS, `phone${W}_${sel.slice(1)}.png`)}); }
  await p.evaluate(() => document.querySelectorAll('#ep819 [data-ep819-ld]').forEach((b, i) => { if (i > 0 && b.getAttribute('aria-expanded') === 'true') b.click(); }));
  for (const k of ['WC02', 'WC61']) {
    await p.evaluate(k => openAsset(k), k); await wait(1400);
    const D = await p.evaluate(() => { const b = document.querySelector('#drawer .mp819'); if (!b) return null; b.scrollIntoView({block: 'center'}); const r = b.getBoundingClientRect(); let worst = 0;
      b.querySelectorAll('*').forEach(e => { const q = e.getBoundingClientRect(); if (q.width) worst = Math.max(worst, q.right - r.right, q.right - document.documentElement.clientWidth); });
      return {right: Math.round(r.right), vw: document.documentElement.clientWidth, worst: Math.round(worst), park: !!b.querySelector('.mp819-park')}; });
    ok(D && D.right <= D.vw && D.worst <= 0.5 && D.park === (k === 'WC02'), `${name}: ${k} drawer - the meet point box fits the screen${k === 'WC02' ? ' and carries the parkland rules' : ''}`, D);
    await wait(300); await p.screenshot({path: path.join(SHOTS, `phone${W}_drawer_${k}.png`)});
    await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(400);
  }
  ok(!s.errors.length && !cons.length && !s.counts.blocked, `${name}: no page errors, no console errors, no write attempted`, {errors: s.errors, cons, counts: s.counts});
  await s.browser.close();
}
(async () => { await run(390); await run(400); console.log(`\n${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
