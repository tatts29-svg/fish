// M1 spot check 2 (read-only): what else lives in the page while the Showcase runs — frames (the parked explorer),
// its heap cost, and the opening quality the engine picks per profile. No writes; counts.blocked must stay 0.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/showcase/m1_codemap/spot2_out.json';
(async () => {
  const res = {};
  for (const prof of [{name: 'laptop 1440x900 dpr1', W: 1440, H: 900, dpr: 1, mobile: false}, {name: 'phone 390x844 dpr3', W: 390, H: 844, dpr: 3, mobile: true}]) {
    const s = await open({pageFile: process.env.PAGE, W: prof.W, H: prof.H, dpr: prof.dpr, mobile: prof.mobile, gl: true});
    const {page} = s; const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const m = await cdp.send('Performance.getMetrics'); const g = n => (m.metrics.find(x => x.name === n) || {}).value; return {jsHeapMB: Math.round(g('JSHeapUsedSize') / 1e5) / 10, nodes: g('Nodes'), frames: g('Frames'), docs: g('Documents'), listeners: g('JSEventListeners')}; };
    await page.waitForTimeout(15000);
    const r = {profile: prof.name};
    r.frames = page.frames().map(f => f.url().replace(/\/w\/[^/]+\//, '/w/<view>/').slice(0, 140));
    r.parked = await page.evaluate(() => { const p = document.getElementById('expPark'); const f = p && p.querySelector('iframe');
      return {park: !!p, iframe: !!f, moveBefore: typeof document.body.moveBefore === 'function', src: f ? f.getAttribute('src').replace(/\/w\/[^/]+\//, '/w/<view>/') : null,
        canvasesInFrame: (() => { try { return f ? f.contentDocument.querySelectorAll('canvas').length : null; } catch (e) { return 'x-origin'; } })(),
        frameCanvasPx: (() => { try { return f ? [...f.contentDocument.querySelectorAll('canvas')].reduce((a, c) => a + c.width * c.height, 0) : null; } catch (e) { return null; } })()}; });
    r.opening = await page.evaluate(() => ({openingQuality: window.GC3D && GC3D.openingQuality ? GC3D.openingQuality() : null, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
      coarse: matchMedia('(pointer: coarse)').matches, hoverNone: matchMedia('(hover: none)').matches, backPref: typeof showBackPref === 'function' ? showBackPref() : null}));
    r.heapWithExplorer = await heap();
    r.heapWithoutExplorer = await page.evaluate(() => { const f = document.querySelector('#expPark iframe'); if (f) { f.src = 'about:blank'; f.remove(); } return !!f; }).then(async had => had ? heap() : 'no parked explorer');
    // open the showcase once to read the canvas and quality it settles on in the first seconds
    await page.evaluate(() => showOpen());
    await page.waitForTimeout(6000);
    r.afterOpen = await page.evaluate(() => { const S = window.GC3D && GC3D.S; return S ? {quality: S.quality.name, step: S.qualityStep || null, cv: [S.cv.width, S.cv.height], css: [S.cv.clientWidth, S.cv.clientHeight],
      samples: S.rt && S.rt.samples, shadow: S.sunShadow && S.sunShadow.size, frames: S.frames, failed: GC3D.failed || null} : {failed: window.GC3D && GC3D.failed}; });
    r.heapShowOpen = await heap();
    r.animsUnderShowcase = await page.evaluate(() => { const all = document.getAnimations(); const running = all.filter(a => a.playState === 'running');
      const where = a => { const t = a.effect && a.effect.target; if (!t) return '?'; const sc = t.closest && t.closest('#showcase'); return (sc ? 'showcase:' : 'page:') + (t.id ? '#' + t.id : (t.className && t.className.baseVal != null ? t.className.baseVal : String(t.className || t.tagName)).split(' ')[0]); };
      const tally = {}; running.forEach(a => { const k = where(a) + ' ' + (a.animationName || a.constructor.name); tally[k] = (tally[k] || 0) + 1; });
      return {total: all.length, running: running.length, infinite: running.filter(a => a.effect && a.effect.getComputedTiming().iterations === Infinity).length, tally}; });
    r.tab = await page.evaluate(() => state.tab);
    await page.evaluate(() => showClose());
    r.counts = s.counts; r.errors = s.errors.slice(0, 5);
    res[prof.name] = r;
    await s.browser.close();
  }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(Object.values(res).map(r => [r.profile, r.counts]), null, 0));
})().catch(e => { console.error('FAIL', e); process.exit(1); });
