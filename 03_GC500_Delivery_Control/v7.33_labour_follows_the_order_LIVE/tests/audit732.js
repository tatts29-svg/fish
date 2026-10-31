const {open} = require('/tmp/claude-0/stage18/lh18au');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#today', W: 1440, H: 900, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 await p.waitForFunction(() => typeof labourUnits === 'function' && typeof lineNumbersOf === 'function', null, {timeout: 150000}); await p.waitForTimeout(5000);
 const R = await p.evaluate(() => { const out = {multi: [], unitsVsQty: [], moreNumsThanQty: [], singleNumMulti: []};
  allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).forEach(a => {
   const L = chargeLines(a).filter(l => l.item); if (!L.length) return;
   const nums = buildingNumbersOf(a).filter(Boolean), tq = L.reduce((n, l) => n + (qtyOf(l) != null ? qtyOf(l) : 1), 0);
   const per = L.map(l => { const q = qtyOf(l), u = labourUnits(a, l.item); return {item: l.item, q, units: u.length, nums: u}; });
   if (L.length > 1) out.multi.push({k: a.key, name: a.name, nums, split: lineNumbersOf(a), per: per.map(x => x.item + ' q' + x.q + ' units' + x.units)});
   per.forEach(x => { if (x.units && x.q != null && x.units !== x.q) out.unitsVsQty.push({k: a.key, item: x.item, q: x.q, units: x.units, nums: x.nums}); });
   if (nums.length > tq) out.moreNumsThanQty.push({k: a.key, items: L.map(l => l.item + '×' + qtyOf(l)).join(' + '), nums});
  });
  return out; });
 console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })();
