const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page'); const fs = require('fs');
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(3000);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1000);
  const r = await p.evaluate(() => holdAssets(() => { const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
    // A. labourRevenue858 per asset (install+steps+levelling+demob at rate x qty), vs labourPlan slots per asset
    const A = {}; const keys = new Set(['install', 'steps', 'levelling', 'demob']);
    for (const a of allAssets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key))) { const seen = new Set();
      for (const line of chargeLines(a)) { const qty = qtyOf(line), info = labourLinesFor(a.key, line.discipline, line.item, a.key, undefined, a);
        for (const item of info.lines.filter(x => keys.has(x.key))) { const id = [a.key, line.discipline, line.item, item.key].join('|'); if (seen.has(id)) continue; seen.add(id);
          if (qty == null || !Number.isFinite(Number(item.rate))) continue; A[a.key] = (A[a.key] || 0) + qty * item.rate; } } }
    const P = {}; for (const sl of labourPlan().slots) if (keys.has(sl.key) && sl.value != null) P[sl.ref] = (P[sl.ref] || 0) + sl.value;
    const diffs = []; for (const k of new Set([...Object.keys(A), ...Object.keys(P)])) { const d = r2((A[k] || 0) - (P[k] || 0)); if (Math.abs(d) >= 0.01) { const a = allAssets().find(x => x.key === k) || {}; diffs.push({ref: k, rev858: r2(A[k] || 0), plan: r2(P[k] || 0), diff: d, relocation: !!a.relocation, rest_of: a.rest_of || null, cancelled: !!a._cancelled, units: labourUnits(a).length, lines: chargeLines(a).map(l => l.item + ' x' + qtyOf(l))}); } }
    // B. the one-cent: per-line labour totals vs pl760Ticks arithmetic
    let sumTotals = 0, sumTicks = 0; const odd = [];
    for (const a of allAssets().filter(a => !a._cancelled && !a.rest_of)) { const t = assetTotal(a); for (const l of (t.lines || [])) { const lab = l.labour; if (!lab || !lab.ticked || !lab.ticked.length || lab.total == null) continue; sumTotals += lab.total; let tk = 0;
        if (lab.perBuilding) { const units = (lab.units || []).map(q => q.unit), restN = labourRestN(a, l.item, units); (lab.units || []).forEach(q => (q.ticked || []).forEach(x => { tk += (x.rate || 0) * (q.unit === LAB_REST ? restN : 1); })); } else lab.ticked.forEach(x => { tk += (x.rate || 0) * (lab.qty || 0); });
        if (Math.abs(tk - lab.total) >= 0.001) odd.push({ref: a.key, item: l.item, total: lab.total, ticksArith: r2(tk), qty: lab.qty, perBuilding: !!lab.perBuilding, rates: lab.ticked.map(x => x.rate)}); } }
    return {diffs, sum858: r2(Object.values(A).reduce((a, b) => a + b, 0)), sumPlan: r2(Object.values(P).reduce((a, b) => a + b, 0)), sumTotals: r2(sumTotals), chargeLabour: moneySummary().charge.labour, ticks760: pl760Ticks().total, odd: odd.slice(0, 12), oddN: odd.length,
      cardHire: moneySummary().charge.card_hire, sumCardLabour: r2(moneySummary().charge.card_hire + moneySummary().charge.labour)}; }));
  fs.writeFileSync(process.env.OUT + '/labour_diff.json', JSON.stringify(r, null, 1)); console.log(JSON.stringify(r, null, 1).slice(0, 5000)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
