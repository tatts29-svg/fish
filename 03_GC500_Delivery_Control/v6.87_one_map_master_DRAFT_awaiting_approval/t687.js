const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const vp of [{width: 1400, height: 1000}, {width: 400, height: 860}]) {
  const p = await (await b.newContext({viewport: vp, isMobile: vp.width < 500, hasTouch: vp.width < 500})).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto(process.argv[2] + '#map', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(5000);
  const r = await p.evaluate(() => ({sheet: (DATA.sheets.find(s => s.key === state.sheet) || {}).key || state.sheet, mk: document.querySelectorAll('#pane-map .mk').length, sec: document.querySelectorAll('#pane-map .mk.mksec').length, vms: document.querySelectorAll('#pane-map .mk.mkvms').length, area: document.querySelectorAll('#pane-map .mk.mkarea').length, btns: [...document.querySelectorAll('#pane-map .sheetbtn')].map(b => b.textContent.trim()), trades: [...document.querySelectorAll('[data-mapdisc]')].map(b => b.textContent.trim().replace(/\s+/g, ' ')), stands: document.querySelectorAll('.standbar [data-mapsec]').length}));
  await p.screenshot({path: `locfind/v687_map_${vp.width}.png`});
  await p.evaluate(() => { state.mapSec = 'S23'; renderMap(); }); await p.waitForTimeout(1200);
  const s23 = await p.evaluate(() => ({ring: document.querySelectorAll('#pane-map .mk.secring').length, off: document.querySelectorAll('#pane-map .mk.off').length}));
  await p.screenshot({path: `locfind/v687_s23_${vp.width}.png`});
  await p.evaluate(() => { state.mapSec = null; state.mapDisc = 'Toilets & amenities'; renderMap(); }); await p.waitForTimeout(1200);
  await p.screenshot({path: `locfind/v687_toilets_${vp.width}.png`});
  const tl = await p.evaluate(() => ({on: document.querySelectorAll('#pane-map .mk:not(.off)').length}));
  await p.evaluate(() => { state.mapDisc = null; renderMap(); showOnMap('P01'); }); await p.waitForTimeout(2500);
  const found = await p.evaluate(() => ({sheet: state.sheet, found: state.found && state.found.key}));
  await p.evaluate(() => openAsset('P33')); await p.waitForTimeout(5000);
  const ph = await p.evaluate(() => [...document.querySelectorAll('.mlocphotos img')].map(i => [i.alt, i.naturalWidth]));
  await p.evaluate(() => openAsset('P38')); await p.waitForTimeout(4000);
  const ph2 = await p.evaluate(() => [...document.querySelectorAll('.mlocphotos img')].map(i => [i.alt, i.naturalWidth]));
  console.log(vp.width, JSON.stringify({r, s23, tl, found, ph, ph2, errs})); }
  await b.close(); })();
