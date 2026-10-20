const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/';
const PAGE = process.env.PAGE, TAG = process.env.TAG, MOB = !!process.env.MOB;
(async () => { const s = await open(MOB ? {pageFile: PAGE, W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: PAGE}); const p = s.page; const res = {};
  await p.waitForFunction(() => typeof go === 'function' && document.querySelector('nav, .tabs'), null, {timeout: 120000}); await p.waitForTimeout(3000);
  // tap the Map tab the way a person would
  const tab = p.locator('button, a', {hasText: /^\s*Map\s*$/}).first(); await tab.click();
  await p.waitForTimeout(4000);
  res.hash = await p.evaluate(() => location.hash);
  res.sheet = await p.evaluate(() => state.sheet);
  res.buttons = await p.evaluate(() => [...document.querySelectorAll('#pane-map .maptools .sheetbtn')].filter(b => b.offsetParent).map(b => b.textContent.trim() + (b.classList.contains('primary') ? ' [on]' : '')));
  res.selectShown = await p.evaluate(() => { const s = document.querySelector('#pane-map .sheetsel'); return !!(s && s.offsetParent); });
  res.masterHeading = await p.evaluate(() => /The master plan/.test(document.querySelector('#pane-map').innerText.slice(0, 400)));
  await p.waitForTimeout(40000);
  await p.evaluate(() => { const r = document.querySelector('#pane-map .maptools').getBoundingClientRect(); window.scrollBy(0, r.top - 60); });
  await p.waitForTimeout(3000);
  await p.screenshot({path: OUT + TAG + '.png'});
  // back to master and then Map tab again should keep the person's choice (no forced jump)
  for (const want of ['__satellite', 'MASTER']) { await p.evaluate(w => { location.hash = '#sheet/' + w; }, want); await p.waitForTimeout(5000);
    res['on_' + want] = await p.evaluate(() => [...document.querySelectorAll('#pane-map .maptools .sheetbtn')].filter(b => b.offsetParent).map(b => b.textContent.trim() + (b.classList.contains('primary') ? ' [on]' : ''))); }
  res.errors = s.errors; console.log(JSON.stringify(res)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
