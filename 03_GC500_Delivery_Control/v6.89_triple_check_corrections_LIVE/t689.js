const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const vp of [{width: 1400, height: 1000}, {width: 400, height: 860}]) {
  const p = await (await b.newContext({viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500})).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await p.goto(process.argv[2] + '#map', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(5000);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('#pane-map .mk')].filter(e => getComputedStyle(e).display !== 'none').length);
  const base = {sheet: await p.evaluate(() => state.sheet), vis: await vis(), show: await p.evaluate(() => [...document.querySelectorAll('[data-maplayer]')].map(b => b.textContent.trim().replace(/\s+/g, ' '))),
    p27: await p.evaluate(() => [...document.querySelectorAll('#pane-map .mk')].filter(e => /P27|P29/.test(e.dataset.keys)).length),
    empty: await p.evaluate(() => emptyCallouts().filter(c => /MASTER/.test(c.sheet)).length), emptyAll: await p.evaluate(() => emptyCallouts().length)};
  const lay = {};
  for (const k of ['wb', 'gate', 'ep', 'screen', 'gens', 'iface', 'wcx', 'vms']) {
    await p.evaluate(k => document.querySelector(`[data-maplayer="${k}"]`).click(), k); await p.waitForTimeout(600);
    lay[k] = await p.evaluate(k => ({on: [...document.querySelectorAll('#pane-map .mk.ly-' + k)].filter(e => getComputedStyle(e).display !== 'none').length,
      other: [...document.querySelectorAll('#pane-map .mk.mkly:not(.ly-' + k + ')')].filter(e => getComputedStyle(e).display !== 'none').length, pressed: document.querySelector(`[data-maplayer="${k}"]`).getAttribute('aria-pressed')}), k);
    if (k === 'wb' || k === 'screen') await p.screenshot({path: `locfind/v689_${k}_${vp.width}.png`});
  }
  await p.evaluate(() => document.querySelector('[data-maplayer="screen"]').click()); await p.waitForTimeout(500);
  await p.evaluate(() => { state.mapLayer = 'wb'; renderMap(); }); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('#pane-map .mk.ly-wb:not(.lyhide)').click()); await p.waitForTimeout(600);
  const pop = await p.evaluate(() => { const d = document.querySelector('.mkpick'); return d ? {h: d.querySelector('b').textContent, txt: d.textContent.replace(/\s+/g, ' ').slice(0, 300), links: [...d.querySelectorAll('a')].map(a => a.textContent + '|' + a.href.slice(0, 90))} : null; });
  await p.screenshot({path: `locfind/v689_pop_${vp.width}.png`});
  await p.evaluate(() => { document.querySelectorAll('.mkpick').forEach(e => e.remove()); state.mapLayer = null; state.q = 'big screen'; renderMap(); }); await p.waitForTimeout(600);
  const q = await p.evaluate(() => ({hit: document.querySelectorAll('#pane-map .mk.hit').length}));
  await p.evaluate(() => { state.q = 'P27'; renderMap(); }); await p.waitForTimeout(600);
  const q2 = await p.evaluate(() => ({hit: document.querySelectorAll('#pane-map .mk.hit').length}));
  await p.evaluate(() => { state.q = ''; renderMap(); openAsset('T0243'); }); await p.waitForTimeout(4000);
  const d27 = await p.evaluate(() => ({pics: [...document.querySelectorAll('.mlocpics:not(.mlocphotos) img')].map(i => i.naturalWidth), master: /Where it is — master plan/.test(document.body.textContent), how: (document.body.textContent.match(/block tag P34[^.]*/) || [''])[0].slice(0, 140)}));
  console.log(vp.width, JSON.stringify({base, lay, pop, q, q2, d27, errs})); }
  await b.close(); })();
