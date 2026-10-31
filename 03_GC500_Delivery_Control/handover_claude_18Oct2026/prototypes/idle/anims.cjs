/* list running animations per tab and what they animate */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const MOB = process.env.MOB === '1';
 const s = await open({pageFile: process.env.PAGE, cpu: +(process.env.CPU || 0), ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
 const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000});
 await sleep(+(process.env.WAIT || 15000));
 for (const tab of (process.env.TABS || 'today,plant').split(',')) {
  if (tab !== 'today') { await p.evaluate(k => go(k), tab); await sleep(8000); }
  const r = await p.evaluate(() => {
   const key = n => { if (!n) return '?'; const parts = []; for (let x = n, d = 0; x && d < 4; x = x.parentElement, d++) parts.push(x.id ? '#' + x.id : (x.nodeName.toLowerCase() + (x.classList && x.classList.length ? '.' + [...x.classList].slice(0, 2).join('.') : ''))); return parts.join('<'); };
   const vis = el => { if (!el || !el.getBoundingClientRect) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !(el.closest && el.closest('[hidden]')); };
   const out = {}; for (const a of document.getAnimations()) {
    const t = a.effect && a.effect.target; let props = [];
    try { const kf = a.effect.getKeyframes(); props = [...new Set(kf.flatMap(k => Object.keys(k).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))]; } catch (e) {}
    const name = a.animationName || a.transitionProperty || a.id || a.constructor.name;
    const k = name + ' [' + props.join(',') + '] ' + (a.playState) + ' iter=' + (a.effect && a.effect.getTiming().iterations) + ' vis=' + vis(t) + ' ' + key(t);
    out[k] = (out[k] || 0) + 1; }
   return {n: document.getAnimations().length, running: document.getAnimations().filter(a => a.playState === 'running').length, list: Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 60)};
  });
  console.log('=== ' + tab, r.n, 'running', r.running); r.list.forEach(([k, n]) => console.log('  ' + n + ' x ' + k.slice(0, 230)));
 }
 await s.browser.close();
})();
