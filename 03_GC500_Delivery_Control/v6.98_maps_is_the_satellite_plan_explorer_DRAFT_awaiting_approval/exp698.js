const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/';
const PAGE = process.env.PAGE, TAG = process.env.TAG || 'e698', MOB = !!process.env.MOB;
(async () => { const s = await open(MOB ? {pageFile: PAGE, W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: PAGE}); const p = s.page; const res = {};
  await p.waitForFunction(() => typeof go === 'function' && typeof renderExplorerTab === 'function', null, {timeout: 120000});
  res.moveBefore = await p.evaluate(() => typeof document.body.moveBefore === 'function');
  await p.evaluate(() => { window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({type: 'longtask', buffered: true}); });
  await p.waitForTimeout(12000);   // idle: the warm-up should have started
  res.warmLongTasks = await p.evaluate(() => ({n: window.__lt.length, max: Math.max(0, ...window.__lt), total: window.__lt.reduce((a, b) => a + b, 0)}));
  res.warm = await p.evaluate(() => { const f = document.querySelector('#expPark iframe'); return f ? {parked: true, src: f.src.replace(/^.*\/w\/[^/]+\//, '')} : null; });
  const t0 = Date.now(); await p.evaluate(() => go('map'));
  await p.waitForFunction(() => { const f = document.querySelector('#expwrap iframe'); try { return f && f.contentWindow && f.contentWindow.__ready; } catch (e) { return false; } }, null, {timeout: 240000});
  res.mapToReadyMs = Date.now() - t0;
  res.hash = await p.evaluate(() => location.hash);
  res.buttons = await p.evaluate(() => [...document.querySelectorAll('#pane-map .exptools button')].filter(b => b.offsetParent).map(b => b.textContent.trim() + (b.classList.contains('primary') ? ' [on]' : '')));
  await p.evaluate(() => { document.querySelector('#expwrap iframe').contentWindow.__stay = 42; });
  await p.waitForTimeout(3000);
  try { await p.screenshot({path: OUT + TAG + '_map.png', timeout: 150000}); } catch (e) { res.shot1 = 'timeout'; }
  // leave for the satellite pins and come back
  await p.evaluate(() => document.querySelector('#pane-map .exptools [data-sheet="__satellite"]').click()); await p.waitForTimeout(4000);
  res.onPins = await p.evaluate(() => ({hash: location.hash, parked: !!document.querySelector('#expPark iframe')}));
  await p.evaluate(() => document.querySelector('#pane-map [data-sheet="__explorer"]').click()); await p.waitForTimeout(1500);
  res.back = await p.evaluate(() => { const f = document.querySelector('#expwrap iframe'); return {same: !!(f && f.contentWindow.__stay === 42), hash: location.hash}; });
  // other tabs and back
  await p.evaluate(() => go('timeline')); await p.waitForTimeout(1500); await p.evaluate(() => go('map')); await p.waitForTimeout(1500);
  res.tabBack = await p.evaluate(() => { const f = document.querySelector('#expwrap iframe'); return !!(f && f.contentWindow.__stay === 42); });
  // search lands in the explorer
  await p.evaluate(() => go('today')); await p.waitForTimeout(800);
  await p.evaluate(() => mapLocate('MASTER', 'GN04', 'GN04')); await p.waitForTimeout(5000);
  res.search = await p.evaluate(() => { const f = document.querySelector('#expwrap iframe'); const w = f && f.contentWindow; return {tab: state.tab, sheet: state.sheet, selected: w && w.__marksCount ? w.__marksCount().selected : null}; });
  try { await p.screenshot({path: OUT + TAG + '_gn04.png', timeout: 150000}); } catch (e) { res.shot2 = 'timeout'; }
  // a pick in the explorer opens the drawer
  await p.evaluate(() => document.querySelector('#expwrap iframe').contentWindow.parent.gc500ExplorerPicked('GN04')); await p.waitForTimeout(1500);
  res.drawer = await p.evaluate(() => { const d = document.querySelector('#drawer'); return d ? d.classList.contains('on') || d.getAttribute('aria-hidden') === 'false' : null; });
  await p.evaluate(() => { if (typeof closeDrawer === 'function') closeDrawer(); });
  // full screen
  await p.evaluate(() => document.getElementById('expFull').click()); await p.waitForTimeout(800);
  res.full = await p.evaluate(() => { const r = document.getElementById('expwrap').getBoundingClientRect(); return {cls: document.getElementById('expcard').classList.contains('expfull'), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight}; });
  try { await p.screenshot({path: OUT + TAG + '_full.png', timeout: 150000}); } catch (e) { res.shot3 = 'timeout'; }
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  res.fullOff = await p.evaluate(() => !document.getElementById('expcard').classList.contains('expfull'));
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
