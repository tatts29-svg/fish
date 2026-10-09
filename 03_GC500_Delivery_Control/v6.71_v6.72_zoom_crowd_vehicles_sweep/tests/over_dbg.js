const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const W of [360, 390]) {
  const page = await (await browser.newContext({viewport: {width: W, height: 740}, isMobile: true, hasTouch: true})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(1500);
  for (const t of ['progress', 'plant', 'timeline', 'today', 'map', 'coatesway', 'docs']) { await page.evaluate(t => go(t), t); await page.waitForTimeout(900);
    const r = await page.evaluate(W => { const bad = [...document.querySelectorAll('.pane.on *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.tblwrap, .daystrip, .mapstage, .hscroll'); });
      const top = bad.filter(e => !bad.includes(e.parentElement)).slice(0, 3);
      return top.map(e => { const ch = []; for (let n = e; n && ch.length < 5; n = n.parentElement) ch.push(n.tagName + '.' + String(n.className).slice(0, 18)); const cs = getComputedStyle(e.parentElement); return {chain: ch.join('<'), right: Math.round(e.getBoundingClientRect().right), txt: e.innerText.slice(0, 60).replace(/\s+/g, ' '), parentOverflow: cs.overflowX}; }); }, W);
    if (r.length) console.log(W, t, JSON.stringify(r)); }
  }
  await browser.close(); })();
