const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => { const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500}); await p.waitForTimeout(8000);
  for (const tab of ['today', 'timeline']) {
    await p.evaluate(k => go(k), tab); await p.waitForTimeout(5000);
    const r = await p.evaluate(() => { const A = document.getAnimations(); const by = {};
      A.forEach(a => { const t = a.effect && a.effect.target; const card = t && t.closest && t.closest('.bc984-day'); const vis = card ? card.dataset.bc984Visible : 'n/a'; const motion = card ? card.dataset.bc984Motion : 'n/a';
        const kf = a.effect && a.effect.getKeyframes ? Object.keys(a.effect.getKeyframes()[0] || {}).filter(k => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)).join('+') : '';
        const k = (a.constructor.name) + ' ' + a.playState + ' ' + (a.animationName || '') + ' [' + kf + '] vis=' + vis + ' motion=' + motion + ' ' + (t ? ((t.getAttribute && t.getAttribute('class')) || t.nodeName) : '').toString().slice(0, 30);
        by[k] = (by[k] || 0) + 1; });
      return {n: A.length, tab: state.tab, top: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 25), motionAttr: document.documentElement.dataset.motion}; });
    console.log(JSON.stringify(r));
  }
  await s.browser.close(); })();
