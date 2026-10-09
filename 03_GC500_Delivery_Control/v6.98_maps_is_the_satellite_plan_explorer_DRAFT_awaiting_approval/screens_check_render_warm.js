const {open} = require('./lh2');
(async () => { const s = await open({pageFile: process.env.PAGE, gl: false}); const p = s.page;
  await p.waitForFunction(() => typeof renderExplorerTab === 'function', null, {timeout: 120000}); await p.waitForTimeout(20000);
  const parked = await p.evaluate(() => !!document.querySelector('#expPark iframe'));
  await p.evaluate(() => go('map')); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const pane = document.getElementById('pane-map'), card = document.getElementById('expcard'), m = document.querySelector('main');
    const info = el => { if (!el) return null; const cs = getComputedStyle(el), b = el.getBoundingClientRect(); return {top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width), op: cs.opacity, vis: cs.visibility, disp: cs.display, tr: cs.transform, anim: cs.animationName}; };
    return {pane: info(pane), card: info(card), tools: info(document.querySelector('#pane-map .exptools')), head: info(pane.firstElementChild), mainScroll: m && m.scrollTop, mainH: m && m.scrollHeight, winScroll: scrollY, docH: document.documentElement.scrollHeight, paneHidden: pane.hasAttribute('hidden'), cls: pane.className}; });
  r.parked = parked; console.log(JSON.stringify(r)); await p.screenshot({path: '/tmp/claude-0/stage4/shots/blank698w.png'}); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
