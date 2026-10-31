// Author: Andrew Fisher. Read-only: every cost and service with its date, for the P&L by month (transport legs, toilets, accommodation, meals, allowance, contract lines on the record).
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o && o[k] !== undefined) r[k] = o[k]; }); return r; };
      const out = {};
      const T = transport888Core();
      out.tcs = (T.tcs || []).map(t => Object.assign(pick(t, ['ref', 'key', 'cost', 'fig', 'figure', 'amount', 'counted', 'inPl', 'branch', 'b', 'state', 'source', 'carrier', 'load', 'floor', 'and_more', 'kind']), {ev: pick(t.event || {}, ['task_id', 'date', 'phase', 'activity', 'item', 'carrier', 'dd', 'sheet', 'quantity_raw']), keys: Object.keys(t)}));
      out.tcsKeys = T.tcs && T.tcs[0] ? Object.keys(T.tcs[0]) : [];
      out.tFig = T.tFig; out.tCounted = T.tCounted; out.forecastKeys = Object.keys(T.forecast || {}); out.demob = T.demob ? Object.keys(T.demob) : null;
      out.planned = (T.planned || []).slice(0, 3); out.plannedN = (T.planned || []).length; out.plannedKeys = T.planned && T.planned[0] ? Object.keys(T.planned[0]) : [];
      try { const S = servicing748(); out.S = {total: S.total, card_total: S.card_total, at_cost_total: S.at_cost_total, their_total: S.their_total, their_water: S.their_water, quote: S.quote_their_total1068, nLines: (S.lines || []).length, line0: S.lines && S.lines[0], card0: S.card_lines && S.card_lines[0], atcost: S.at_cost, nights: S.nights1040, per: S.per1040}; } catch (e) { out.Serr = e.message; }
      try { out.allowance = labourAllowance858(); out.allowanceSrc = String(labourAllowance858).slice(0, 900); } catch (e) { out.allowErr = e.message; }
      try { const ep = epCostStatus1094Model(); out.ep = JSON.parse(JSON.stringify(ep, (k, x) => Array.isArray(x) && x.length > 40 ? x.slice(0, 40) : x)); } catch (e) { out.epErr = e.message; }
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/dated_all.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
