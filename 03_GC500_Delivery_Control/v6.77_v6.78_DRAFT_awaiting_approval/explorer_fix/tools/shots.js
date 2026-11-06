// Before/after evidence.   node shots.js before|after
// before = the untouched live file set (served locally from byte-identical copies); after = the staged fix over the same assets.
const {open, settle} = require('./harness'); const fs = require('fs'), path = require('path');
const V = process.argv[2] || 'after', OUT = '/tmp/claude-0/stage/shots/', WORK = '/tmp/claude-0/stage/work/';
const DIRS = V === 'before' ? [WORK + 'before_site'] : ['/tmp/claude-0/stage/explorer', WORK + 'before_site'];
const log = (...a) => console.log(V, ...a);
const ISLAND = [380, 520, 1110, 1090];
async function waitImages(page) { await page.waitForTimeout(2500); await settle(page); await page.waitForTimeout(1500); }
async function canvasPng(page, file) { const b64 = await page.evaluate(() => document.getElementById('display').toDataURL('image/png').split(',')[1]); fs.writeFileSync(file, Buffer.from(b64, 'base64')); }
async function exportPng(page, file) { const [d] = await Promise.all([page.waitForEvent('download', {timeout: 180000}), page.click('#exportBtn')]); await d.saveAs(file); return d.suggestedFilename(); }
(async () => {
  const only = process.argv[3];
  /* 1. first screen, 1440 x 900, no hash: which mode does it open in? */
  if (!only || only === 'first') {
    const s = await open({dirs: DIRS, W: 1440, H: 900, dpr: 1, log}); await s.page.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await s.page.waitForTimeout(6000); await settle(s.page); await s.page.waitForTimeout(3000);
    log('first screen mode', await s.page.evaluate(() => window.GC500Explorer.state.mode), '| status', await s.page.textContent('#qualText'), '| alignment', await s.page.textContent('#alText'), await s.page.getAttribute('#alDot', 'class'));
    await s.page.screenshot({path: OUT + V + '_first_screen_1440x900.png', timeout: 120000}); log('page errors', s.errors.length); await s.browser.close();
  }
  /* 2 + 3. Original plan at Fit and on Macintosh Island at 500 %, device scale 2; on-screen canvas vs the PNG export */
  if (!only || only === 'original') {
    const s = await open({dirs: DIRS, W: 1440, H: 900, dpr: 2, hash: '#original', log}); const p = s.page;
    await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await p.evaluate(() => window.GC500Explorer.setMode('original'));
    await p.evaluate(() => window.GC500Explorer.fit()); await waitImages(p);
    log('fit', JSON.stringify(await p.evaluate(() => ({mode: window.GC500Explorer.state.mode, zoom: window.GC500Explorer.state.zoom, view: window.GC500Explorer.state.view, dpr: window.devicePixelRatio, cw: document.getElementById('display').width, ch: document.getElementById('display').height, q: document.getElementById('qualText').textContent}))));
    await p.screenshot({path: OUT + V + '_original_fit_2x.png'}); await canvasPng(p, WORK + V + '_fit_canvas.png');
    fs.writeFileSync(WORK + V + '_fit_view.json', JSON.stringify(await p.evaluate(() => window.GC500Explorer.state.view)));
    log('fit export', await exportPng(p, WORK + V + '_fit_export.png'));
    await p.evaluate(r => { window.GC500Explorer.goto(r, 'Macintosh Island'); }, ISLAND); await p.waitForTimeout(300);
    await p.evaluate(() => window.GC500Explorer.zoom(5)); await waitImages(p);
    log('island', JSON.stringify(await p.evaluate(() => ({zoom: window.GC500Explorer.state.zoom, q: document.getElementById('qualText').textContent, view: window.GC500Explorer.state.view}))));
    await p.screenshot({path: OUT + V + '_original_island_500pct_2x.png'}); await canvasPng(p, WORK + V + '_island_canvas.png');
    fs.writeFileSync(WORK + V + '_island_view.json', JSON.stringify(await p.evaluate(() => window.GC500Explorer.state.view)));
    log('island export', await exportPng(p, WORK + V + '_island_export.png'));
    log('page errors', s.errors.length); await s.browser.close();
  }
  /* 4. phone 390 x 844 */
  if (!only || only === 'phone') {
    const s = await open({dirs: DIRS, W: 390, H: 844, dpr: 3, mobile: true, log}); const p = s.page; await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await p.waitForTimeout(5000); await settle(p); await p.waitForTimeout(2000);
    await p.screenshot({path: OUT + V + '_phone_390x844.png'});
    log('phone', JSON.stringify(await p.evaluate(() => ({docW: document.documentElement.scrollWidth, headerW: document.querySelector('header').scrollWidth, vw: innerWidth}))));
    await p.click('#navBtn'); await p.waitForTimeout(600); await p.screenshot({path: OUT + V + '_phone_390x844_menu.png'}); log('page errors', s.errors.length); await s.browser.close();
  }
  /* 5. satellite tiles failing (503) in Satellite + plan */
  if (!only || only === 'tiles') {
    const s = await open({dirs: DIRS, W: 1440, H: 900, dpr: 1, hash: '#hybrid', fail: u => /api\.mapbox\.com/.test(u) ? {status: 503, headers: {'access-control-allow-origin': '*'}, body: ''} : null, log}); const p = s.page;
    await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await p.evaluate(() => window.GC500Explorer.setMode('hybrid')); await p.waitForTimeout(9000);
    log('tiles 503', '| status', JSON.stringify(await p.textContent('#qualText')), await p.getAttribute('#qual', 'class'), '| banner', JSON.stringify(await p.evaluate(() => { const b = document.getElementById('satBanner'); return b && !b.hidden ? b.innerText : null; })));
    await p.screenshot({path: OUT + V + '_tile_failure.png'}); await s.browser.close();
  }
})().catch(e => { console.error(V, 'FATAL', e); process.exit(1); });
