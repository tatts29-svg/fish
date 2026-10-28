// Author: Andrew Fisher. 25 Oct 2026 - the P&L's toilet servicing lines, labour ticks by branch and generator lines, as the
// live page computes them. Read only (the harness aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_service.cjs
'use strict';
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => holdAssets(() => {
      const sv = servicing748();
      const lines = (sv && sv.lines || []).map(l => ({card_line: l.card_line, description: l.description, qty: l.qty, rate: l.rate, amount: l.amount, units: l.units1040, refs: l.refs1040, from: l.from, quote: l.quote}));
      const per = (sv && sv.per1040 || []).map(r => ({ref: r.ref || (r.a && r.a.key), lines: (r.lines || []).map(l => ({card_line: l.card_line, units: l.units}))}));
      const TK = pl760Ticks();
      const gens = allAssets().filter(a => a.discipline === 'Generators' && !a._cancelled).map(a => { let g = null; try { const l = (chargeLines(a) || [])[0]; g = l ? generatorLine1004(a, l) : null; } catch (e) { g = String(e).slice(0, 80); }
        return {ref: a.key, gen: g && typeof g === 'object' ? {daily: g.dailyRate, days: g.equivalentDays, forecast: g.forecast, state: g.rateState, source: g.rateSource, from: g.from || g.start || null} : g}; });
      return {total: sv && sv.total, card_total: sv && sv.card_total, nights: sv && sv.nights1040, lines, per, ticks: {byBranch: TK.byBranch, total: TK.total}, gens};
    }));
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    console.log(JSON.stringify({total: out.total, lines: out.lines.length, gens: out.gens.length, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
