const {chromium} = require('playwright');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await (await b.newContext()).newPage();
  await p.goto(process.argv[2] + '#today', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(6000);
  const R = await p.evaluate(() => { const td = todayIso();
    const asked = allAssets().filter(a => !a._cancelled && chargeLines(a).some(l => /forklift|telehandler/i.test(l.item))).map(a => { const cl = chargeLines(a); let dv = null; try { dv = deliveryView(a); } catch (e) {}
      return {k: a.key, name: a.name, items: cl.map(l => l.item + ' x' + l.quantity).join(', '), nums: a.asset_numbers, first: a.first_date, last: a.last_date, rec: dv ? {recorded: dv.recorded, negative: dv.negative, words: dv.words || dv.state || null} : null, notes: (a.asset_notes || []).concat(a.unparsed_notes || [])}; });
    const rows = ONHIRE_ROWS.filter(r => /forklift|telehandler|tyne|fork ext/i.test((r.what || '') + ' ' + (r.description || '') + ' ' + (r.family || ''))).map(r => ({br: r.branch_code, c: r.rental_contract, line: r.line, item: r.item, what: r.what, status: r.status_as_written, deliv: r.delivered, start: r.contract_start, pick: r.booked_pickup_date, loc: r.location, rate: r.rate_1, prebill: r.prebill_amount, match: r.match && (r.match.key || r.match.task_id || r.match.state), sub: !!(r.subhired || r.subhired_machine)}));
    return {asked, rows}; });
  console.log(JSON.stringify(R, null, 1)); await b.close(); })();
