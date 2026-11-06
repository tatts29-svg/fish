// v8.19 - the screenshots for Andrew, desktop and phone. Author: Andrew Fisher. READ ONLY (GET-only harness, every write
// aborted; window.print is stubbed). Writes to OUT: the reference drawer for a parkland location (WC02) and a normal one
// (WC61), the Event Portables delivery plan card with Load 1 open, the Load 1 run sheet (screen preview and the printed
// A4 as a PDF; render it to PNG with pymupdf), and the 6 Oct driver sheet, Load 1.
//   cd 03_GC500_Delivery_Control && PAGE=<build> OUT=<dir> node v8.19_meet_points_ep_plan_DRAFT/evidence/shots819.js
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const OUT = process.env.OUT; fs.mkdirSync(OUT, {recursive: true});
const wait = ms => new Promise(r => setTimeout(r, ms));
async function run(tag, dev) {
  const s = await open({pageFile: process.env.PAGE, hash: '#timeline', ...dev}); const p = s.page; const cons = [];
  p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length && typeof ep819Html === 'function', null, {timeout: 240000});
  await wait(2500); await p.evaluate(() => { window.print = () => {}; });
  const shot = async (name, el) => { const f = path.join(OUT, `${tag}_${name}.png`); if (el) await el.screenshot({path: f}); else await p.screenshot({path: f}); console.log(f); };
  for (const k of ['WC02', 'WC61']) {
    await p.evaluate(k => openAsset(k), k); await wait(1800);
    await p.evaluate(() => { const b = document.querySelector('#drawer .where816') || document.querySelector('#drawer .mp819'); if (b) b.scrollIntoView({block: 'start'}); }); await wait(600);
    await shot(`drawer_${k}`);
    await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(500);
  }
  await p.evaluate(() => go('timeline')); await wait(2000);
  await p.evaluate(() => { const b = document.querySelector('[data-ep819-ld="1"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); document.getElementById('ep819').scrollIntoView({block: 'start'}); }); await wait(800);
  await shot('load_panel');
  if (!dev.mobile) { await p.setViewportSize({width: dev.W, height: 2600}); await wait(600); await shot('load_panel_card', await p.$('#ep819')); await p.setViewportSize({width: dev.W, height: dev.H}); await wait(400); }
  await p.evaluate(() => ep819Print(1, {hold: true})); await wait(900);
  await shot('runsheet_load1_preview');
  if (!dev.mobile) {
    await p.setViewportSize({width: dev.W, height: 1300}); await wait(500); await shot('runsheet_load1_page', await p.$('#ep819print .rs819')); await p.setViewportSize({width: dev.W, height: dev.H}); await wait(300);
    await p.emulateMedia({media: 'print'}); const pdf = path.join(OUT, `${tag}_runsheet_load1_printed.pdf`);
    await p.pdf({path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true}); await p.emulateMedia({media: 'screen'}); console.log(pdf);
  }
  await p.evaluate(() => ep819Close()); await wait(400);
  await p.evaluate(() => { window.__dpLast = null; dpPrint('2026-10-06', 'drv', {link: true}); });
  await p.waitForFunction(() => window.__dpLast, null, {timeout: 40000}).catch(() => {}); await wait(1500);
  if (!dev.mobile) { await p.setViewportSize({width: dev.W, height: 1300}); await wait(500); }
  const pg = await p.$('#dayprint .dp-page.dp-drv'); await pg.scrollIntoViewIfNeeded(); await wait(400);
  await shot('driver_sheet_06Oct_load1', dev.mobile ? null : pg);
  if (dev.mobile) await shot('driver_sheet_06Oct_load1_page', pg);
  console.log(tag, 'page errors', s.errors.length, 'console errors', cons.length, JSON.stringify(s.counts));
  await s.browser.close();
  return !s.errors.length && !cons.length && !s.counts.blocked;
}
(async () => {
  const a = await run('desktop', {W: 1440, H: 900, dpr: 1}), b = await run('phone', {W: 390, H: 844, dpr: 2, mobile: true});
  process.exit(a && b ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
