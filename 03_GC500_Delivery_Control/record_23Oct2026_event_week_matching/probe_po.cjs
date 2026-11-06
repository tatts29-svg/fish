'use strict';
const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => {
 const h = await open({hash: '#fencing', W: 1440, H: 1000}); const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const out = {}; const src = S.purchaseOrders || S.pos || {}; out.keys = Object.keys(S).filter(k => /po|order/i.test(k));
   out.pos = Object.values(src).map(o => o && ({number: o.number || o.po, amount: o.amount, period: o.period, sheet: o.programme_sheet, receipted: o.receipted, invoice_no: o.invoice_no, pricing: o.supplier_pricing ? {source: (o.supplier_pricing.source || {}).file, date: (o.supplier_pricing.source || {}).date, records: (o.supplier_pricing.records || []).map(x => ({book: x.book, number: x.number, date: x.date, lines: x.lines})), extras: o.supplier_pricing.extras} : null})).filter(Boolean);
   return out; });
  fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1)); console.log('keys', JSON.stringify(r.keys), 'pos', r.pos.length, r.pos.map(o => o.number + (o.pricing ? '*' : '')).join(' '));
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
