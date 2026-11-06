'use strict';
// Read-only: every docket, service note and collection on the live record, compactly. GET only.
const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => {
 const h = await open({hash: '#fencing', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
   const out = {errors: []};
   const t = (k, f) => { try { out[k] = f(); } catch (e) { out.errors.push(k + ': ' + String(e && e.message || e).slice(0, 200)); } };
   t('dockets', () => allDockets().map(d => ({id: d.id, no: d.docket_no, date: d.date, week: d.week, loc: d.location, q: d.quantities, comp: d.components, usable: d.usable, charged: d.cost_total, paid: d.paid_total, rt: d.record_type || null, src: d.source_service_id || null, rel: d.related_hire_id || null, note: String(d.note || '').slice(0, 160)})));
   t('notes', () => serviceNoteRows().map(n => ({id: n.id, no: n.note_no, date: n.date, week: n.week, loc: n.location, h: n.labour_hours, m: n.metres, cost: n.cost, usable: n.usable, crew: n.crew_note, note: String(n.note || '').slice(0, 200)})));
   t('colls', () => (S.fenceCollections || []).map(c => ({id: c.id, no: c.collection_no, date: c.date, week: c.week, loc: c.location, collected: c.collected})));
   t('aside', () => Object.values(S.aside || {}).map(a => a && a.v && a.v.rec && {id: a.v.rec.id, no: a.v.rec.docket_no}).filter(Boolean));
   return out;
  });
  fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
  console.log('errors', JSON.stringify(r.errors), 'pageErrors', JSON.stringify(h.errors), 'dockets', (r.dockets || []).length, 'notes', (r.notes || []).length, 'colls', (r.colls || []).length, 'aside', (r.aside || []).length);
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
