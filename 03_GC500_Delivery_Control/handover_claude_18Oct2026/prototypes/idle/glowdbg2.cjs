const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const INIT = `window.__as = {}; for (const t of ['animationstart','animationiteration']) document.addEventListener(t, e => { const k = t + ':' + e.animationName; window.__as[k] = (window.__as[k] || 0) + 1; }, true); window.addEventListener('animationstart', e => { window.__as['win:' + e.animationName] = (window.__as['win:' + e.animationName] || 0) + 1; }, true);`;
(async () => {
 const s = await open({pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true, init: INIT}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000}); await sleep(10000);
 await p.evaluate(() => go('plant')); await sleep(15000);
 const r = await p.evaluate(async () => { const ring0 = [...document.querySelectorAll('.complete1008-ring')].find(x => x.getAnimations().length), ring = ring0.closest('.complete1008-badge,.complete1008-done') || ring0;
  const ents = await new Promise(res => { const io = new IntersectionObserver(es => { res(es.map(e => [e.isIntersecting, Math.round(e.boundingClientRect.top), e.intersectionRatio])); io.disconnect(); }, {root: null, rootMargin: '200px 0px'}); io.observe(ring); });
  return {as: window.__as, ents, anims: ring0.getAnimations().map(a => [a.animationName, a.playState, a.startTime])}; });
 console.log(JSON.stringify(r));
 await s.browser.close();
})();
