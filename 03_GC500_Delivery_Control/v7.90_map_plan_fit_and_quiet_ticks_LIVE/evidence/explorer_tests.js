// v7.90 - the map explorer: the plan fits when you switch to it, and the Done ticks are off until asked for.
// Read-only: GETs only, writes aborted. With LOCAL=1 the explorer's index.html and explorer.js come from ../release/explorer.
//   PAGE=<built page> [LOCAL=1] [MOB=1] TAG=<name> node explorer_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path'), REL = path.join(__dirname, '..', 'release', 'explorer');
(async () => { const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1333, H: 693}), p = s.page, tag = (process.env.TAG || 'run') + (MOB ? '_phone' : '_desktop');
  if (process.env.LOCAL) await p.route(/\/explorer\/(index\.html|explorer\.js)(\?.*)?$/, r => { const f = /explorer\.js/.test(r.request().url()) ? 'explorer.js' : 'index.html'; r.fulfill({status: 200, headers: {'content-type': f.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8', 'cache-control': 'no-store'}, body: fs.readFileSync(path.join(REL, f))}); });
  const T = [], ok = (n, pass, d) => T.push({name: n, pass: !!pass, detail: String(d)});
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 3000));
  // the finished units as the dashboard reports them (on an edit link this is every unit ticked Complete)
  const done = await p.evaluate(() => { const real = typeof gc500DoneKeys === 'function' ? gc500DoneKeys() : []; if (!real || real.length < 20) { const ks = allAssets().filter(a => !a._cancelled).slice(0, 80).map(a => a.key); window.gc500DoneKeys = () => ks; return {real: (real || []).length, used: ks.length}; } return {real: real.length, used: real.length}; });
  await p.evaluate(() => { location.hash = '#sheet/__explorer'; }); await new Promise(r => setTimeout(r, 12000));
  const f = p.frames().find(fr => /explorer\/index\.html/.test(fr.url())); if (!f) { console.log('no explorer frame'); await s.browser.close(); process.exit(1); }
  const st = () => f.evaluate(() => ({mode: document.querySelector('.modes button[aria-pressed="true"]') && document.querySelector('.modes button[aria-pressed="true"]').dataset.mode, ticks: document.querySelectorAll('#d782 i').length, chip: (document.getElementById('done782') || {}).textContent || '', on: (document.getElementById('done782') || {getAttribute: () => null}).getAttribute('aria-pressed'), cam: typeof camera !== 'undefined' ? {cx: Math.round(camera.cx), cy: Math.round(camera.cy), z: +camera.z.toFixed(4)} : null}));
  await new Promise(r => setTimeout(r, 5000)); const a0 = await st(); await p.screenshot({path: path.join(__dirname, tag + '_1_open.png')});
  ok('X1 the explorer opens on Satellite + plan', /sat|hybrid/.test(a0.mode || ''), JSON.stringify(a0));
  ok('X2 no Done ticks until asked for (' + done.used + ' finished units known)', a0.ticks === 0 && a0.on === 'false', JSON.stringify(a0));
  const click = m => f.evaluate(m => { const b = document.querySelector('.modes button[data-mode="' + m + '"]'); if (b) b.click(); return !!b; }, m);
  const modes = await f.evaluate(() => [...document.querySelectorAll('.modes button')].map(b => b.dataset.mode));
  await click('original'); await new Promise(r => setTimeout(r, 6000)); const a1 = await st(); await p.screenshot({path: path.join(__dirname, tag + '_2_original_plan.png')});
  const fitPlan = await f.evaluate(() => { const c = camera; fit(true); const want = {cx: Math.round(camera.cx), cy: Math.round(camera.cy), z: +camera.z.toFixed(4)}; camera = c; changeView(false); return want; });
  ok('X3 switching to Original plan shows the whole drawing (fitted, not carried over from satellite)', a1.mode === 'original' && a1.cam && fitPlan && Math.abs(a1.cam.cx - fitPlan.cx) < 2 && Math.abs(a1.cam.cy - fitPlan.cy) < 2 && Math.abs(a1.cam.z - fitPlan.z) < 1e-3, JSON.stringify({now: a1.cam, fitted: fitPlan}));
  await click(modes.find(m => /^sat/.test(m)) || 'satellite'); await new Promise(r => setTimeout(r, 6000)); const a2 = await st(); await p.screenshot({path: path.join(__dirname, tag + '_3_back_to_satellite.png')});
  const fitGeo = await f.evaluate(() => { const c = camera; fit(); const want = {cx: Math.round(camera.cx), cy: Math.round(camera.cy), z: +camera.z.toFixed(4)}; camera = c; changeView(false); return want; });
  ok('X4 back to satellite fits the whole circuit again', a2.cam && Math.abs(a2.cam.cx - fitGeo.cx) < 2 && Math.abs(a2.cam.cy - fitGeo.cy) < 2, JSON.stringify({now: a2.cam, fitted: fitGeo}));
  await f.evaluate(() => document.getElementById('done782') && document.getElementById('done782').click()); await new Promise(r => setTimeout(r, 2500)); const a3 = await st(); await p.screenshot({path: path.join(__dirname, tag + '_4_done_on.png')});
  ok('X5 tapping Done shows the finished units\' ticks', a3.on === 'true' && /Done/.test(a3.chip), JSON.stringify(a3));
  await f.evaluate(() => document.getElementById('done782') && document.getElementById('done782').click()); await new Promise(r => setTimeout(r, 1500)); const a4 = await st();
  ok('X6 tapping Done again hides them', a4.on === 'false' && a4.ticks === 0, JSON.stringify(a4));
  ok('E1 no page errors and nothing written', !s.errors.length && s.counts.blocked === 0, JSON.stringify({errors: s.errors, blocked: s.counts.blocked}));
  const pass = T.filter(t => t.pass).length; T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + (t.pass ? '' : ' :: ' + t.detail.slice(0, 260)))); console.log(tag + ': ' + pass + '/' + T.length);
  fs.writeFileSync(path.join(__dirname, tag + '.json'), JSON.stringify({tag, done, T}, null, 1)); await s.browser.close(); process.exit(pass === T.length ? 0 : 1); })();
