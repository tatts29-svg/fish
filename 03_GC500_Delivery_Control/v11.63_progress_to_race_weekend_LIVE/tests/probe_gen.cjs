'use strict';
// Read-only: exact current snapshots for the v11.63 CCB review rows and evidence operations, computed by the page's own rules. GET only.
const fs = require('fs');
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const CCB = ['36560','36568','36603','36611','36623','36627','36629','36634','36635','36636','36637','36643','36645','36647','36751','36755','36760','36764'];
const RELOC = ['24482','24483','24484','24490'];
const REMOVAL = ['28554','28556','28557','28558','28559','28560','28566','28567','28569','28571','28572','28575','28577','28578'];
(async () => {
 const h = await open(Object.assign({hash: '#today', W: 1440, H: 1000}, process.env.PAGE ? {pageFile: process.env.PAGE} : {}));
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000});
  await p.waitForTimeout(6000);
  const r = await p.evaluate(({CCB, RELOC, REMOVAL}) => {
   const out = {errors: [], ccb: {}, green: {}, blue: {}, overlap: {}, photos: {}};
   const snap = (rec, keys) => Object.fromEntries(keys.map(k => [k, rec[k] == null ? null : rec[k]]));
   const RED = ['id','docket_no','date','week','scope','usable','quantities','components','location','note'];
   const GREEN = ['id','note_no','date','week','usable','location','note','crew_note','labour_hours','metres'];
   const BLUE = ['id','collection_no','date','week','usable','location','note','collected','matches'];
   const D = allDockets(), G = serviceNoteRows(), B = collectionRows();
   for (const no of CCB) { const m = D.filter(d => String(d.docket_no) === no); if (m.length !== 1) { out.errors.push('ccb ' + no + ' ' + m.length); continue; }
     out.ccb[no] = {id: m[0].id, expected: snap(m[0], ['date','location','quantities','components','note']), review: fenceCcbReview847(m[0])}; }
   for (const no of RELOC.concat(['24481'])) { const m = G.filter(n => String(n.note_no) === no); if (m.length !== 1) { out.errors.push('green ' + no); continue; } out.green[no] = snap(m[0], GREEN); }
   for (const no of REMOVAL) { const m = B.filter(n => String(n.collection_no) === no); if (m.length !== 1) { out.errors.push('blue ' + no); continue; } out.blue[no] = snap(m[0], BLUE); }
   const sameSite = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
   const overlap = (type, rec) => { const t = type === 'scrim_existing' ? 'scrim' : type;
     return D.filter(r => Number((r.quantities || {})[t]) > 0 && (type !== 'scrim_existing' || r.source_service_id === rec.id || r.source_operation_id === rec.id + ':scrim' || r.date === rec.date && sameSite(r.location) === sameSite(rec.location)))
      .map(r => snap(r, RED)).sort((a, b) => String(a.id).localeCompare(String(b.id))); };
   out.overlap.relocation = overlap('relocation', {});
   out.overlap.removal = overlap('removal', {});
   const g81 = G.find(n => String(n.note_no) === '24481'); out.overlap.scrim24481 = overlap('scrim_existing', g81);
   const idx = photoIndex();
   for (const f of CCB.concat(RELOC, REMOVAL, ['24481']).map(n => n + '.jpg').concat(['GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx'])) out.photos[f] = idx.files && idx.files[f] ? idx.files[f].sha256 : null;
   // the catalogue's own relocation overlap, to compare
   out.catRelocOverlapIds = FENCE_PROGRESS848.operations.filter(o => o.type === 'relocation').map(o => (o.red_overlap || []).map(x => x.docket_no).join(','));
   out.weeks = DATA.weeks.map(w => [w.sheet, w.phase, w.start, w.end]);
   return out;
  }, {CCB, RELOC, REMOVAL});
  fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
  console.log('errors', JSON.stringify(r.errors), 'photos missing', Object.entries(r.photos).filter(([k, v]) => !v).map(([k]) => k).join(','), 'pageErrors', JSON.stringify(h.errors).slice(0, 300));
 } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
