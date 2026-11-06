// node shot.js <hash> <out.png> [w] [h] [fullPage] [js-before]
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const w = +(process.argv[4] || 1366), h = +(process.argv[5] || 900);
  const p = await (await b.newContext({viewport: {width: w, height: h}, isMobile: w < 500, hasTouch: w < 500})).newPage();
  p.on('pageerror', e => console.log('PE', String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8814/v/viewtokenviewtoken1/' + process.argv[2], {waitUntil: 'load'}); await p.waitForTimeout(2500);
  if (process.argv[7]) { await p.evaluate(x => eval(x), process.argv[7]); await p.waitForTimeout(1200); }
  console.log(JSON.stringify(await p.evaluate(() => { const hd = document.querySelector('header.top'); const r = hd.getBoundingClientRect(); return {header: Math.round(r.height), kids: [...hd.querySelectorAll(':scope > *, .hbar > *')].map(e => (e.id || e.className || e.tagName).toString().slice(0, 20) + ':' + Math.round(e.getBoundingClientRect().height)).slice(0, 30)}; })));
  await p.screenshot({path: process.argv[3], fullPage: process.argv[6] === '1'}); await b.close(); })();
