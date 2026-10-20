const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const MOB = process.env.MOB === '1';
 const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000}); await sleep(12000);
 for (const tab of (process.env.TABS || 'today,plant').split(',')) {
  if (tab !== 'today') { await p.evaluate(k => go(k), tab); await sleep(8000); }
  const r = await p.evaluate(() => document.getAnimations().map(a => { const t = a.effect && a.effect.target; let props = ''; try { props = [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)))].filter(x => !/offset|easing|composite/.test(x)).join(','); } catch (e) { props = 'ERR'; }
   const r = t && t.getBoundingClientRect ? t.getBoundingClientRect() : null;
   return [a.constructor.name, a.animationName || a.transitionProperty || '', props, a.playState, a.effect && a.effect.pseudoElement || '', t ? (t.nodeName + '.' + (t.getAttribute('class') || '').split(' ').slice(0, 2).join('.')) : '', t && t.parentElement ? t.parentElement.nodeName + '.' + (t.parentElement.getAttribute('class') || '').split(' ')[0] : '', r ? Math.round(r.top) + ',' + Math.round(r.width) + 'x' + Math.round(r.height) : ''].join(' | '); }));
  const c = {}; r.forEach(x => { const k = x.replace(/ \| [-\d]+,\d+x\d+$/, ''); c[k] = (c[k] || 0) + 1; });
  console.log('=== ' + tab, r.length); Object.entries(c).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log('  ' + n + ' x ' + k));
 }
 await s.browser.close();
})();
