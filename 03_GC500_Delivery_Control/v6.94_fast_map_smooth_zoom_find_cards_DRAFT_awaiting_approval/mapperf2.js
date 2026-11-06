// the same stopwatch on each build: open the Map (satellite) from Today, come back to it, zoom in and out, find GN04
const {open} = require('./lh2');
const SCR = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/';
const PAGES = {live690: null, v693: SCR + 'GC500_Delivery_Control_hosted_v693.html', v694: SCR + 'GC500_Delivery_Control_hosted_v694.html'};
(async () => { const which = process.env.WHICH, mob = process.env.PHONE === '1'; const res = {which, phone: mob};
  const s = await open({pageFile: PAGES[which], hash: '#today', mobile: mob, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1}); const p = s.page;
  await p.waitForTimeout(12000);   // the page has settled; v6.94 has warmed the map by now
  await p.evaluate(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(e.duration))).observe({type: 'longtask', buffered: false}); } catch (e) {} });
  const t0 = Date.now();
  await p.evaluate(() => { state.sheet = '__satellite'; state.mapMasterSeen = false; go('map'); });
  await p.waitForFunction(() => { try { return LIVEMAP.board && LIVEMAP.board.loaded() && LIVEMAP.board.areTilesLoaded() && LIVEMAP.board.getLayer('sb-drawn'); } catch (e) { return false; } }, null, {timeout: 180000, polling: 100});
  res.openMs = Date.now() - t0;
  await p.evaluate(() => go('today')); await p.waitForTimeout(3000);
  const t1 = Date.now(); await p.evaluate(() => go('map'));
  await p.waitForFunction(() => { try { const c = LIVEMAP.board.getCanvas(); return c.offsetWidth > 0; } catch (e) { return false; } }, null, {timeout: 180000, polling: 50});
  res.reopenMs = Date.now() - t1; res.reopenJs = await p.evaluate(() => { const t = performance.now(); go('today'); const a = performance.now() - t; const t2 = performance.now(); go('map'); return {leave: Math.round(a), back: Math.round(performance.now() - t2)}; });
  res.sameMap = await p.evaluate(() => !!LIVEMAP.board);
  // zoom burst: 12 wheel notches in, 12 out, over the map
  const box = await p.evaluate(() => { const r = LIVEMAP.board.getCanvas().getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.evaluate(() => { window.__lt = []; });
  await p.mouse.move(box[0], box[1]); const t2 = Date.now();
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(60); }
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); }
  await p.waitForTimeout(1500);
  res.zoom = await p.evaluate(() => ({longTasks: window.__lt.length, longestMs: Math.round(Math.max(0, ...window.__lt)), totalBlockedMs: Math.round(window.__lt.reduce((a, b) => a + Math.max(0, b - 50), 0)), zoomNow: LIVEMAP.board.getZoom()}));
  // find
  res.find = await p.evaluate(() => new Promise(res => { const f = document.querySelector('.wowfind'); if (!f) return res('no find box');
    const t = performance.now(); f.value = 'GN04'; f.dispatchEvent(new Event('input')); const sug = document.querySelector('.wowsug').innerText.split('\n').slice(0, 3);
    LIVEMAP.board.once('moveend', () => res({ms: Math.round(performance.now() - t), sug})); f.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'})); setTimeout(() => res({ms: 'timeout', sug}), 20000); }));
  res.errors = s.errors; console.log(JSON.stringify(res)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
