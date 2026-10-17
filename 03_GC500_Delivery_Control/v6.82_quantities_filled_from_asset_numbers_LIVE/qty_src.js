const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext()).newPage();
  await p.goto(process.argv[2] + '#today', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(6000);
  const R = await p.evaluate(() => { const out = {};
    allAssets().filter(a => !a._cancelled && !a._added && !a.relocation).forEach(a => { const cl = chargeLines(a); if (cl.filter(l => l.quantity == null).length !== 1) return;
      out[a.key] = {kept: a.asset_numbers, bld: a._buildingNumbers, cont: a._contentsNumbers, sched: a._numbersOnTheSchedule, src: a._numberSources}; });
    // sanity: across refs WITH quantities, how often does kept count equal the total quantity?
    let eq = 0, ne = [], eqB = 0; allAssets().filter(a => !a._cancelled && !a._added && !a.relocation).forEach(a => { const cl = chargeLines(a); if (!cl.length || cl.some(l => l.quantity == null)) return; const q = cl.reduce((s, l) => s + Number(l.quantity), 0); const k = (a.asset_numbers || []).length; if (!k) return; if (k === q) eq++; else ne.push([a.key, q, k, (a._buildingNumbers || []).length]); if ((a._buildingNumbers || []).length === q) eqB++; });
    return {out, eq, eqB, ne: ne.slice(0, 40), neN: ne.length}; });
  console.log(JSON.stringify(R)); await b.close(); })();
