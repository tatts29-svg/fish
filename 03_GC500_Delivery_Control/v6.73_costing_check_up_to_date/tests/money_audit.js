// every dollar figure: the summary's own sums, and the lines each page shows with a $ in them
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1280, height: 800}, ignoreHTTPSErrors: true})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 180000}); await page.waitForTimeout(2000);
  const M = await page.evaluate(() => holdAssets(() => { const m = moneySummary(todayIso()), c = m.charge, k = m.cost;
    const r2 = n => Math.round((n || 0) * 100) / 100;
    const chargeSum = r2(c.contracts + c.labour + (c.race.amount || 0) + c.fencing + c.other);
    const costSum = r2((k.transport.ours || 0) + k.transport.schedule.counted + (k.accommodation ? k.accommodation.amount : 0) + (k.meals ? k.meals.amount : 0) + (k.misc ? k.misc.amount : 0) + (k.fencing_paid || 0) + (k.fencing_labour && k.fencing_labour.rate != null ? k.fencing_labour.amount : 0) + (k.rehire_approved ? k.rehire_quoted : 0));
    const branchSum = r2(c.by_branch.reduce((s, b) => s + (b.charge || 0), 0));
    return {charge: {total: c.total, sum: chargeSum, contracts: c.contracts, byBranchSum: branchSum, labour: c.labour, race: c.race.amount, fencing: c.fencing, other: c.other, card_hire: c.card_hire, card_transport: c.card_transport, subhire: c.subhire, delivery: c.delivery, lines: c.contracts_lines, unknown: c.contracts_unknown, differs: c.contracts_differs},
      cost: {known: k.known, sum: costSum, transport: k.transport.amount, t_ours: k.transport.ours, t_sched: k.transport.schedule.counted, acc: k.accommodation && k.accommodation.amount, meals: k.meals && k.meals.amount, misc: k.misc && k.misc.amount, fencing_paid: k.fencing_paid, fencing_labour: k.fencing_labour && k.fencing_labour.amount, rehire: k.rehire},
      margin: m.margin != null ? m.margin : m.difference, keys: Object.keys(m)}; }));
  console.log(JSON.stringify(M, null, 1));
  const out = {};
  for (const t of ['progress', 'costs', 'pricing', 'fencing', 'plant', 'today']) { await page.evaluate(t => go(t), t); await page.waitForTimeout(1500);
    out[t] = await page.evaluate(() => { const p = document.querySelector('.pane.on'); return p.innerText.split('\n').map(s => s.trim()).filter(s => /\$\s?[\d,]+/.test(s)); }); }
  require('fs').writeFileSync('money_lines.json', JSON.stringify(out, null, 1));
  for (const [t, L] of Object.entries(out)) console.log(t, L.length, 'lines with $');
  console.log('errors', JSON.stringify(errs)); await browser.close(); })();
