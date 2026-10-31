// Author: Andrew Fisher. Read-only: how the Event Portables cost of 101,747.00 is made up (quotes, counts, rates), line by line.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const out = {};
      const st = epCostStatus1094Model(); out.status = {currentCost: st.currentCost, knownCost: st.knownCost, originalQuoteCost: st.originalQuoteCost, combinedEstimate: st.combinedEstimate, additionalHireForecast: st.additionalHireForecast, lines: st.lines, pricedLines: st.pricedLines, quotes: st.quotes, evidence: st.evidenceLabel};
      out.hire = {rows: (st.hire.rows || []).map(x => ({item: x.item, description: x.description, quote: x.quote, quantity: x.quantity, received: x.received, quotedQuantity: x.quotedQuantity, rate: x.rate, amount: x.amount, basis: x.basis, issue: x.issue})),
        excluded: st.hire.excluded, retained: st.hire.retained, keys: Object.keys(st.hire)};
      try { const sv = supplierService1068(); out.svcKeys = Object.keys(sv); out.svc = JSON.parse(JSON.stringify(sv, (k, x) => Array.isArray(x) && x.length > 30 ? x.slice(0, 30) : x)); } catch (e) { out.svcErr = e.message; }
      try { const m = Supplier955.model(); out.s955Keys = Object.keys(m); out.s955 = JSON.parse(JSON.stringify(m, (k, x) => Array.isArray(x) && x.length > 30 ? x.slice(0, 30) : (typeof x === 'string' && x.length > 300 ? x.slice(0, 300) : x))); } catch (e) { out.s955Err = e.message; }
      try { out.quotes = (DATA.rehire_quotes || []).map(q => ({quote: q.quote, box: q.office_use_box, to: q.delivery_to, start: q.start_date, end: q.end_date, total: q.total || q.quote_total, groups: (q.groups || []).map(g => ({group: g.group, lines: (g.lines || []).map(l => ({d: l.description || l.item, qty: l.qty || l.quantity, rate: l.rate || l.unit_price || l.price, amt: l.amount || l.total}))}))})); } catch (e) { out.qErr = e.message; }
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/ep_detail.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
