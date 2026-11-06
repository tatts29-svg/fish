const {open} = require('/tmp/claude-0/stage18/lh18au');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#today', W: 1440, H: 900, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 await p.waitForFunction(() => typeof numberOwners === 'function', null, {timeout: 150000}); await p.waitForTimeout(5000);
 const R = await p.evaluate(() => { const n = '1327222', out = {};
  out.owners = allAssets().filter(a => assetNumbersOf(a).includes(n) || (a._numberSources || {})[n]).map(a => ({key: a.key, name: a.name, src: (a._numberSources || {})[n], listed: assetNumbersOf(a), bnums: buildingNumbersOf(a), state: deliveryOf(a.key).state, done: deliveryOf(a.key).done, due: effectiveDates(a).in, cancelled: !!a._cancelled, locnums: locNums(a)}));
  out.rental = ONHIRE_ROWS.filter(r => String(r.asset_no) === n).map(r => ({c: r.rental_contract, line: r.line, desc: r.description, st: r.status_as_written, ref: r.gc500_ref || r.ref || null}));
  out.rawS = {assetNumbers: Object.entries(S.assetNumbers || {}).filter(([k, v]) => (v || []).includes(n)), supplied: Object.entries(S.supplied || {}).filter(([k, v]) => JSON.stringify(v).includes(n)).map(([k]) => k),
   units: Object.entries(S.units || {}).filter(([k, v]) => JSON.stringify(v).includes(n)).map(([k]) => k), fixes: Object.keys(S.fixes || {}).filter(k => k.includes(n)), dropPhotos: Object.keys(S.dropPhotos || {}).filter(k => JSON.stringify(S.dropPhotos[k]).includes(n)),
   tombs: Object.keys(S.deleted || {}).filter(k => k.includes(n)), notes: Object.entries(S.notes || {}).filter(([k, v]) => String(v).includes(n) || k.includes(n))};
  out.p53 = (() => { const a = assetOf('P53'); return {name: a.name, items: chargeLines(a).map(l => l.item + '×' + l.quantity), due: effectiveDates(a), light: deliveryOf('P53'), sheetNums: a.asset_numbers, rental: (rentalOf('P53') || {}).lines}; })();
  out.qs = questionsList().filter(q => (q.rows || []).some(r => /P53|1327222/.test(r)) || /P53|1327222/.test(q.q + q.why)).map(q => ({id: q.id, q: q.q, rows: (q.rows || []).filter(r => /P53|1327222/.test(r))}));
  return out; });
 console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })();
