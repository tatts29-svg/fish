'use strict';
// Read-only: exact current snapshots for the v11.81 CCB review rows (36766, 36768) and evidence operation (24492), by the
// page's own rules, as v11.63's probe_gen.cjs. GET only.
const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const CCB = ['36766', '36768'];
const RELOC = ['24492'];
(async () => {
 const h = await open(Object.assign({hash: '#today', W: 1440, H: 1000}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(6000);
  const r = await p.evaluate(({CCB, RELOC}) => {
   const out = {errors: [], ccb: {}, green: {}, overlap: {}, photos: {}, review_rows: [], catalogue: {}};
   const snap = (rec, keys) => Object.fromEntries(keys.map(k => [k, rec[k] == null ? null : rec[k]]));
   const RED = ['id','docket_no','date','week','scope','usable','quantities','components','location','note'];
   const GREEN = ['id','note_no','date','week','usable','location','note','crew_note','labour_hours','metres'];
   const D = allDockets(), G = serviceNoteRows();
   for (const no of CCB) { const m = D.filter(d => String(d.docket_no) === no); if (m.length !== 1) { out.errors.push('ccb ' + no + ' ' + m.length); continue; }
     out.ccb[no] = {id: m[0].id, expected: snap(m[0], ['date','location','quantities','components','note']), review: fenceCcbReview847(m[0])}; }
   for (const no of RELOC) { const m = G.filter(n => String(n.note_no) === no); if (m.length !== 1) { out.errors.push('green ' + no); continue; } out.green[no] = snap(m[0], GREEN); }
   out.overlap.relocation = D.filter(r => Number((r.quantities || {}).relocation) > 0).map(r => snap(r, RED)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
   const idx = photoIndex();
   for (const f of CCB.concat(RELOC).map(n => n + '.jpg').concat(['GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'])) out.photos[f] = idx.files && idx.files[f] ? idx.files[f].sha256 : null;
   const R = DATA.fence_ccb_review847; out.review_rows = (R.rows || []).filter(x => ['36764','36751'].includes(x.docket_no));
   out.catalogue = {ops: FENCE_PROGRESS848.operations.length, reloc: FENCE_PROGRESS848.operations.filter(o => o.type === 'relocation').map(o => [o.id, o.quantity, (o.red_overlap || []).length])};
   out.reviewNow = CCB.map(no => { const d = D.find(x => String(x.docket_no) === no); return d ? [no, JSON.stringify(fenceCcbReview847(d)).slice(0, 400)] : [no, null]; });
   return out;
  }, {CCB, RELOC});
  fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
  console.log('errors', JSON.stringify(r.errors), 'photos', JSON.stringify(r.photos), 'pageErrors', JSON.stringify(h.errors).slice(0, 300));
  console.log(JSON.stringify(r.catalogue)); console.log(JSON.stringify(r.reviewNow));
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
