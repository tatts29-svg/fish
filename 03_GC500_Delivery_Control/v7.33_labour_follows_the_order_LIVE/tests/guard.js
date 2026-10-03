const {open} = require('/tmp/claude-0/stage18/lh18au');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#today', W: 1440, H: 900, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => typeof labourUnits === 'function', null, {timeout: 150000}); await p.waitForTimeout(5000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 const R = await p.evaluate(() => { const out = {};
  const a36 = assetOf('P36'), l36 = chargeLines(a36)[0]; out.p36 = {units: labourUnits(a36, l36.item), total: labourMoney('P36', l36, 'P36').total};
  out.wc05 = lineNumbersOf(assetOf('WC05'));
  const planFor = k => { RENDER_MEMO.clear && RENDER_MEMO.clear(); return labourPlan().slots.filter(x => x.ref === k).reduce((n, x) => n + (x.value || 0), 0); };
  const k = 'WC51'; out.before = {units: labourUnits(assetOf(k), 'FWF'), plan: Math.round(planFor(k) * 100) / 100};
  numberPutOn(k, '1299981', 'Andrew Fisher'); numberPutOn(k, '1299982', 'Andrew Fisher'); if (typeof bumpAssets === 'function') bumpAssets(); render();
  const a = assetOf(k); out.after = {nums: buildingNumbersOf(a), split: lineNumbersOf(a), units: labourUnits(a, 'FWF'), rest: labourRestN(a, 'FWF', labourUnits(a, 'FWF')), plan: Math.round(planFor(k) * 100) / 100};
  /* tick every FWF install at WC51 and read the money */
  setLabourAll('Toilets & amenities', 'FWF', 'install', true);
  const l = chargeLines(a).find(x => x.item === 'FWF'); const m = labourMoney(k, l, k); out.ticked = {total: m.total, n: m.ticked.length, rate: (m.ticked[0] || {}).rate};
  out.extra = (questionsList().find(q => q.id === 'sp-extra') || {}).rows;
  return out; });
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
