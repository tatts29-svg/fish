// node probe.js '<js expression>' [hash] — evaluate on the local page after load
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext({viewport: {width: 1280, height: 800}})).newPage();
  p.on('pageerror', e => console.log('PE', String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8814/v/viewtokenviewtoken1/' + (process.argv[3] || '#today'), {waitUntil: 'load'}); await p.waitForTimeout(2500);
  const r = await p.evaluate(x => { try { const v = eval(x); return JSON.stringify(v, null, 1); } catch (e) { return 'ERR ' + e; } }, process.argv[2]);
  console.log(r && r.slice(0, 6000)); await b.close(); })();
