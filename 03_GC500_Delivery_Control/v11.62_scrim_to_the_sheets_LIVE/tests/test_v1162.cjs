'use strict';
/* v11.62 practice test: every hire agreement on the five Commercial Approval sheets carries the sheet's scrim metres (36609 excepted:
   its signed scrim note of 22 Oct records 420 m, the week 1 sheet 125 m of it), the thirteen committed dockets read as corrected,
   the footer says v11.62, and the page runs without errors. On the build (PAGE=...) or on the live page (LIVE=1).
     PAGE=build/GC500_v11.62/GC500_Delivery_Control_hosted.html node v11.62_scrim_to_the_sheets_DRAFT/tests/test_v1162.cjs
     LIVE=1 node v11.62_scrim_to_the_sheets_DRAFT/tests/test_v1162.cjs            (MOB=1 for the phone) */
const fs = require('fs'), path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
const FIXES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'committed_fixes.json'), 'utf8')).ops;
const mobile = !!process.env.MOB; let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
(async () => {
 const h = await open(Object.assign({hash: '#fencing', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, mobile, dpr: mobile ? 2 : 1}, process.env.LIVE ? {} : {pageFile: process.env.PAGE}));
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(4000);
  const r = await p.evaluate(fixes => {
   const out = {};
   out.footer = /· v11\.62/.test(document.body.innerText);
   const all = allDockets(); const byNo = new Map(all.map(d => [String(d.docket_no), d]));
   out.committed = fixes.map(f => { const d = byNo.get(f.docket_no); const q = d ? d.quantities : null;
     const same = !!q && Object.keys(f.quantities).length === Object.keys(q).length && Object.entries(f.quantities).every(([k, v]) => Number(q[k]) === Number(v));
     return {no: f.docket_no, where: d && d._where, same, q, charged: d && d.cost_total, build: d && d.cost_total_build, noteOk: !!(d && /Numbers match up/.test(String(d.note || '')))}; });
   const diffs = [];
   for (const o of Object.values(S.purchaseOrders || {})) {
     const pr = o && o.supplier_pricing; if (!pr || !pr.records) continue;
     for (const x of pr.records) { if (x.book !== 'red') continue; const sheet = (x.lines || []).filter(l => l.column === 'scrim').reduce((n, l) => n + Number(l.qty || 0), 0);
       const d = byNo.get(String(x.number)); const ours = d ? Number((d.quantities || {}).scrim || 0) : 0;
       if (String(x.number) === '36609') continue; if (Math.abs(sheet - ours) > 0.001) diffs.push({no: x.number, sheet, ours, order: o.number}); }
   }
   out.diffs = diffs; out.dockets = all.length;
   return out;
  }, FIXES);
  ok(r.footer, 'footer reads v11.62');
  for (const c of r.committed) ok(c.same && c.where === 'committed', `${c.no} committed docket carries the sheet's scrim: ${JSON.stringify(c.q)} (charged ${c.charged}, build figure ${c.build})`);
  for (const c of r.committed) ok(c.noteOk, `${c.no} note carries the correction`);
  ok(r.diffs.length === 0, 'every red-book paper on the five sheets carries the sheet\'s scrim metres (36609 excepted): differences ' + JSON.stringify(r.diffs));
  ok(h.errors.length === 0, 'no page errors: ' + JSON.stringify(h.errors));
  console.log(`test_v1162 ${mobile ? 'phone' : 'desktop'} ${process.env.LIVE ? 'LIVE' : 'build'}: ${pass} passed, ${fail} failed (${r.dockets} dockets)`);
  process.exitCode = fail ? 1 : 0;
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
