const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const vp of [{width: 1400, height: 1000}, {width: 400, height: 860}]) {
  const p = await (await b.newContext({viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500})).newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('response', r => { if (r.status() >= 400 && /\/m\//.test(r.url())) bad.push(r.status()); });
  await p.goto(process.argv[2] + '#today', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(5000);
  await p.evaluate(() => openAsset('P38')); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const box = document.querySelector('.mlocpics'); if (!box) return 'no pics block'; box.scrollIntoView({block: 'center'}); return [...box.querySelectorAll('img')].map(i => [i.complete, i.naturalWidth]); });
  await p.waitForTimeout(2500);
  const r2 = await p.evaluate(() => [...document.querySelectorAll('.mlocpics img')].map(i => [i.complete, i.naturalWidth]));
  await p.screenshot({path: `locfind/v686_${vp.width}.png`});
  console.log(vp.width, JSON.stringify({r, r2, errs, bad})); }
  await b.close(); })();
