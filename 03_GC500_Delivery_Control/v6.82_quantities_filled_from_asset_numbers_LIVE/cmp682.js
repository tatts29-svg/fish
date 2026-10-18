const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext()).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8814/v/viewtokenviewtoken1/#today', {waitUntil: 'load'}); await p.waitForTimeout(3500);
  const R = await p.evaluate(() => { const m = moneySummary(todayIso()); const LP = labourPlan().all; const Q = questionsList();
    return {charge: m.charge.total, labour: m.charge.labour, ticks: m.charge.labour_ticks, unknown: m.charge.labour_unknown, card_hire: m.charge.card_hire, card_transport: m.charge.card_transport, known: m.cost.known, diff: m.difference,
      plan: [LP.charged, Math.round(LP.expected), Math.round(LP.tocome), Math.round(LP.later), LP.unpriced], qtyQs: Q.filter(q => /quantity/i.test(q.q)).map(q => q.q.slice(0, 120)),
      p09: chargeLines(allAssets().find(a => a.key === 'P09')).map(l => [l.item, l.quantity, l.quantity_state.slice(0, 160)]), wc05: chargeLines(allAssets().find(a => a.key === 'WC05')).map(l => [l.item, l.quantity, l.quantity_state.slice(0, 160)]),
      auto: allAssets().filter(a => chargeLines(a).some(l => l.quantity_auto)).map(a => a.key)}; });
  console.log(JSON.stringify({R, errs}, null, 1)); await b.close(); })();
