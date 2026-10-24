const {open} = require('/tmp/claude-0/stage18/lh18au');
const MOB = !!process.env.MOB, O = '/tmp/claude-0/stage11/split_' + (process.env.TAG || '') + (MOB ? 'm_' : '');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-29', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, dpr: MOB ? 2 : 1, mobile: MOB, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof chOpen === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 const labs = () => p.evaluate(() => { openAsset('WC01'); const d = document.querySelector('#drawer'); const boxes = [...d.querySelectorAll('input[data-lab]')].map(i => i.dataset.lab); const blocks = [...d.querySelectorAll('.labunits, .labticks')].length;
   const txt = (d.innerText.match(/Accessible Toilet[^\n]*\n?[^\n]*/g) || []).slice(0, 3); return {n: boxes.length, installs: boxes.filter(b => /install/i.test(b)), txt}; });
 const R = {};
 R.split = await p.evaluate(() => ['WC01', 'WC05', 'WC09', 'WC20', 'WC27', 'WC31', 'WC51'].map(k => { const a = assetOf(k); return [k, buildingNumbersOf(a), typeof lineNumbersOf === 'function' ? lineNumbersOf(a) : null]; }));
 R.before = await labs();
 if (process.env.TAG !== 'old') {
  await p.evaluate(() => { document.querySelector('#drawer .close, #drawer [data-close]') && document.querySelector('#drawer .close, #drawer [data-close]').click(); chOpen('2026-09-28'); }); await p.waitForTimeout(1200);
  await p.evaluate(() => chChoose('WC01')); await p.waitForTimeout(900);
  R.selects = await p.evaluate(() => [...document.querySelectorAll('#pane-change [data-chnumit]')].map(s => [s.dataset.chnumit, s.value]));
  await p.fill('#pane-change [data-chgot="Accessible Toilet"]', '0'); await p.dispatchEvent('#pane-change [data-chgot="Accessible Toilet"]', 'change'); await p.waitForTimeout(900);
  R.afterNone = await labs();
  const d = await p.$('#drawer'); await p.evaluate(() => { const x = [...document.querySelectorAll('#drawer *')].find(e => /Labour on this reference/i.test(e.textContent) && e.children.length < 3); if (x) x.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(400); await p.screenshot({path: O + 'drawer.png'});
  /* move one number to Accessible by hand */
  await p.evaluate(() => { document.querySelector('#drawer .close, #drawer [data-close]') && document.querySelector('#drawer .close, #drawer [data-close]').click(); }); await p.waitForTimeout(300);
  await p.fill('#pane-change [data-chgot="Accessible Toilet"]', ''); await p.dispatchEvent('#pane-change [data-chgot="Accessible Toilet"]', 'change'); await p.waitForTimeout(700);
  await p.selectOption('#pane-change [data-chnumit="1211967"]', 'Accessible Toilet'); await p.waitForTimeout(900);
  R.moved = await p.evaluate(() => ({map: lineNumbersOf(assetOf('WC01')), sup: (S.supplied || {}).WC01}));
  R.afterMove = await labs();
  const f = await p.$('#pane-change .chside .card'); await p.evaluate(() => { document.querySelector('#drawer .close, #drawer [data-close]') && document.querySelector('#drawer .close, #drawer [data-close]').click(); document.querySelector('#pane-change .chnums').scrollIntoView({block: 'center'}); }); await p.waitForTimeout(400); await p.screenshot({path: O + 'form.png'});
 }
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
