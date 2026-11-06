const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => { const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500}); await p.waitForTimeout(8000);
  await p.evaluate(() => go('timeline')); await p.waitForTimeout(5000);
  const r = await p.evaluate(() => { const pane = document.getElementById('pane-timeline'), strip = pane.querySelector('.daystrip'); const cards = [...strip.children];
    const ws = new Map(), hs = new Map(); cards.forEach(c => { const b = c.getBoundingClientRect(); ws.set(Math.round(b.width), (ws.get(Math.round(b.width)) || 0) + 1); hs.set(Math.round(b.height), (hs.get(Math.round(b.height)) || 0) + 1); });
    const cs = getComputedStyle(cards[1]); return {paneEls: pane.getElementsByTagName('*').length, stripEls: strip.getElementsByTagName('*').length, cards: cards.length, widths: [...ws], heights: [...hs], cardCss: {width: cs.width, height: cs.height, flex: cs.flex, alignSelf: cs.alignSelf, display: cs.display}, stripCss: {display: getComputedStyle(strip).display, alignItems: getComputedStyle(strip).alignItems, overflowX: getComputedStyle(strip).overflowX}, stripW: strip.clientWidth, scrollW: strip.scrollWidth, scrollLeft: strip.scrollLeft,
      anims: document.getAnimations().length, animTargets: [...new Set(document.getAnimations().map(a => (a.effect && a.effect.target && (a.effect.target.className || a.effect.target.nodeName) + '') .slice(0, 40)))].slice(0, 20)}; });
  console.log(JSON.stringify(r)); await s.browser.close(); })();
