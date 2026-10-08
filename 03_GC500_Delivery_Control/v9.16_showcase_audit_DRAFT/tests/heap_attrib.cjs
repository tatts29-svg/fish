// Author: Andrew Fisher. v9.16 showcase audit, M2 helper: WHAT the JS heap holds once the Showcase is closed.
//   PAGE=<html> OUT=<json> [PROFILE=laptop|phone] node tests/heap_attrib.cjs
// Opens the page (open_page.js, GETs only, writes aborted), reads the heap, opens the Showcase for 25 s, closes it with
// Back, forces GC, reads the heap again, then walks window.GC3D's own properties (depth-limited, each object counted
// once) and adds up the typed arrays and plain arrays each one reaches. Read only.
const path = require('path'), fs = require('fs');
const HARN = path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js');
const {open} = require(HARN);
const PAGE = process.env.PAGE, OUT = process.env.OUT, PHONE = process.env.PROFILE === 'phone';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const s = await open(PHONE ? {pageFile: PAGE, W: 390, H: 844, dpr: 3, mobile: true, gl: true} : {pageFile: PAGE, W: 1440, H: 900, dpr: 1, gl: true});
  const p = s.page, R = {author: 'Andrew Fisher', profile: PHONE ? 'phone' : 'laptop'};
  try {
    const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
    const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); const m = await cdp.send('Performance.getMetrics'); return +(m.metrics.find(x => x.name === 'JSHeapUsedSize').value / 1048576).toFixed(1); };
    for (let i = 0; i < 240; i++) { if (await p.evaluate(() => typeof showOpen === 'function' && !!window.GC3D && typeof SYNC !== 'undefined' && SYNC.status === 'live').catch(() => false)) break; await sleep(1000); }
    R.heapBeforeMB = await heap();
    R.walkBefore = await p.evaluate(walk);
    await p.evaluate(() => showOpen());
    await sleep(25000);
    R.heapOpenMB = await heap();
    await p.evaluate(() => showClose());
    await sleep(3000);
    R.heapAfterCloseMB = await heap();
    R.walkAfter = await p.evaluate(walk);
    R.blocked = s.counts.blocked;
  } catch (e) { R.error = String(e && e.stack || e).slice(0, 500); }
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log(JSON.stringify({before: R.heapBeforeMB, open: R.heapOpenMB, afterClose: R.heapAfterCloseMB, top: R.walkAfter && R.walkAfter.top.slice(0, 12), blocked: R.blocked, error: R.error}, null, 1));
  await s.browser.close();
})();
function walk() {
  const seen = new WeakSet();
  const size = (o, d) => {
    if (o == null || typeof o !== 'object' && typeof o !== 'function') return 0;
    if (seen.has(o)) return 0; seen.add(o);
    if (ArrayBuffer.isView(o)) return o.byteLength; if (o instanceof ArrayBuffer) return o.byteLength;
    if (typeof Node !== 'undefined' && o instanceof Node) return 0;
    if (typeof WebGLObject !== 'undefined' && o instanceof WebGLObject) return 0;
    if (d > 9) return 0;
    let b = 0;
    if (Array.isArray(o)) { b += o.length * 8; for (let i = 0; i < o.length; i++) { const v = o[i]; if (v && typeof v === 'object') b += size(v, d + 1); } return b; }
    if (o instanceof Map) { for (const [k, v] of o) { b += 16 + size(k, d + 1) + size(v, d + 1); } return b; }
    if (typeof o === 'function') return 0;
    let keys = []; try { keys = Object.keys(o); } catch (e) { return 0; }
    b += keys.length * 8;
    for (const k of keys) { let v; try { v = o[k]; } catch (e) { continue; } if (v && typeof v === 'object') b += size(v, d + 1); else if (typeof v === 'string') b += v.length * 2; }
    return b;
  };
  const G = window.GC3D || {}; const out = [];
  for (const k of Object.keys(G)) { let v; try { v = G[k]; } catch (e) { continue; } if (v && typeof v === 'object') out.push([k, +(size(v, 0) / 1048576).toFixed(2)]); }
  out.sort((a, b) => b[1] - a[1]);
  const extra = {}; for (const k of ['DATA']) { try { extra[k + '.surrounds'] = +(size(window.DATA && DATA.surrounds, 0) / 1048576).toFixed(2); } catch (e) {} }
  return {top: out.filter(x => x[1] > 0.05).slice(0, 25), totalMB: +out.reduce((a, x) => a + x[1], 0).toFixed(1), sceneUp: !!G.S, extra};
}
