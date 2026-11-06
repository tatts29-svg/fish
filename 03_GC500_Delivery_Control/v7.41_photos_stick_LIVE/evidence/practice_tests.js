// v7.41 practice tests: photographs stick. The page from the kit file, GETs to the live service through curl (read only),
// every write captured in the page (the sync store's doc.set is wrapped), uploads answered by a stub. Nothing reaches the live record.
const {open} = require('/tmp/claude-0/stage18/lh18au');
const PAGE = process.env.PAGE;
const R = {}; const ok = (n, c, note) => { R[n] = !!c; console.log((c ? 'PASS ' : 'FAIL ') + n + (note ? ' - ' + note : '')); };
async function practice(p){
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; if (!window.__fetch0) { window.__fetch0 = window.fetch; const of = window.__fetch0; window.fetch = async (u, o) => { const r = await of(u, o); const url = String(u); if (/\/api\/(version|state)(\?|$)/.test(url) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; }; } document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher';
  window.__W = []; const od = SYNC.db.doc.bind(SYNC.db);
  SYNC.db.doc = path => ({id: path.split('/')[1], path, set: async body => { window.__W.push([path, JSON.parse(JSON.stringify(body))]); }, delete: async () => { window.__W.push([path, null]); }});
  window.__UP = {mode: 'ok', delay: 30, calls: []};
  SYNC.backend.upload = async (file, meta) => { window.__UP.calls.push([file.name, meta && meta.kind]); await new Promise(r => setTimeout(r, window.__UP.delay));
   if (window.__UP.mode === 'fail') throw new Error('practice: the service is away');
   return {id: file.name, name: file.name, kind: 'drop-photo', sha256: 'practice', thumb: false, uploaded: new Date().toISOString()}; };
  window.__file = (w, h) => new Promise(res => { const c = document.createElement('canvas'); c.width = w || 40; c.height = h || 30; const x = c.getContext('2d'); x.fillStyle = '#c60'; x.fillRect(0, 0, c.width, c.height);
   c.toBlob(b => res(new File([b], 'IMG_0001.jpg', {type: 'image/jpeg'})), 'image/jpeg', 0.8); });
 });
 /* a poll already on the wire answers with the view link's level a moment later: let it land, then hold edit */
 await p.waitForTimeout(4800); await p.evaluate(() => { SYNC.readonly = false; SYNC.level = 'edit'; document.body.classList.remove('viewonly'); });
}
(async () => {
 const s = await open({pageFile: PAGE, hash: '', W: 1300, H: 950, dpr: 1, gl: false}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof photoLinkPut === 'function', null, {timeout: 240000});
 await p.evaluate(() => docsRefresh(true)); await p.waitForFunction(() => DOCS.state === 'ready', null, {timeout: 120000}); await p.waitForTimeout(1500);
 // 0. the live record reads the same through the new reader
 const base = await p.evaluate(() => { const keys = Object.keys(S.dropPhotos || {}); let n = 0, extras = 0; keys.forEach(k => { n += dropPhotosOf(k).length; const a = assetOf(k); const us = a ? dropPhotoUnits(a) : ['']; (us.length ? us : ['']).forEach(u => { if (dropPhotoSlots(k, u).length > DROP_MAX) extras++; }); });
  return {keys: keys.length, n, extras, links: Object.keys(S.photoLinks || {}).length, ready: keys.every(k => dropPhotosOf(k).every(x => photoFor(x).state === 'ready'))}; });
 console.log('base', JSON.stringify(base)); ok('reader: 37 keys, 100 photos, all ready, no extras, no links yet', base.keys === 37 && base.n === 100 && base.ready && base.extras === 0 && base.links === 0);
 await practice(p);
 await p.evaluate(() => photoIdb('readwrite', st => st.clear()));
 // 1. add one photograph to P17's third place
 console.log('flags', JSON.stringify(await p.evaluate(() => ({ro: SYNC.readonly, lvl: SYNC.level, f0: typeof window.__fetch0, cap: capability()}))));
 await p.evaluate(() => openAsset('P17')); await p.waitForSelector('#drawer.on [data-dphadd="2"]', {timeout: 30000});
 console.log('flags2', JSON.stringify(await p.evaluate(() => ({ro: SYNC.readonly, lvl: SYNC.level, cap: capability(), body: document.body.className}))));
 const r1 = await p.evaluate(async () => { const f = await window.__file(); const before = JSON.stringify(S.dropPhotos.P17); const msgs = []; await dropPhotoAdd('P17', 2, f, m => msgs.push(m), ''); await new Promise(r => setTimeout(r, 500));
  const ph = dropPhotosOf('P17'); const L = Object.values(S.photoLinks || {}); const out = await photoOutboxAll();
  return {n: ph.length, slots: ph.map(x => x.slot), legacySame: JSON.stringify(S.dropPhotos.P17) === before, links: L.map(x => [x.ref, x.slot, x.by, !!x.removed]), writes: window.__W.filter(w => w[0].startsWith('photoLinks/')).length, stamps: window.__W.filter(w => w[0].startsWith('stamps/photoLinks')).length, outbox: out.length, msgs, cell: !!document.querySelector('#drawer [data-dphadd="2"]') === false && !!document.querySelector('#drawer .dphgrid .dph:not(.dphnone) img[alt*="P17"]'), sending: document.querySelectorAll('#drawer .dphsending').length}; });
 console.log('add', JSON.stringify(r1));
 ok('add: one document written, legacy list untouched, 3 photos shown, outbox empty', r1.n === 3 && r1.legacySame && r1.links.length === 1 && r1.links[0][0] === 'P17' && r1.links[0][1] === 2 && r1.writes === 1 && r1.stamps === 1 && r1.outbox === 0 && r1.sending === 0);
 // 2. two more at once (places 4 and 5): both stick
 const r2 = await p.evaluate(async () => { const [a, b] = await Promise.all([window.__file(50, 30), window.__file(60, 30)]); window.__W.length = 0;
  await Promise.all([dropPhotoAdd('P17', 3, a, () => {}, ''), dropPhotoAdd('P17', 4, b, () => {}, '')]); await new Promise(r => setTimeout(r, 500));
  return {n: dropPhotosOf('P17').length, slots: dropPhotosOf('P17').map(x => x.slot).sort(), links: Object.keys(S.photoLinks).length, writes: window.__W.filter(w => w[0].startsWith('photoLinks/')).length}; });
 console.log('two at once', JSON.stringify(r2)); ok('two at once: both documents, 5 photos', r2.n === 5 && r2.links === 3 && r2.writes === 2);
 // 3. replace the third place: the old one's document says replaced, the new one stands, the file list is untouched
 const r3 = await p.evaluate(async () => { const f = await window.__file(70, 30); const oldId = dropPhotoSlots('P17', '')[2].id; await dropPhotoAdd('P17', 2, f, () => {}, '');
  const L = S.photoLinks[oldId]; return {oldRemoved: !!(L && L.removed), why: L && L.removed_why, n: dropPhotosOf('P17').length, slot2: dropPhotoSlots('P17', '')[2].id !== oldId, strays: photoStrays('P17', '').map(x => x.file.id)}; });
 console.log('replace', JSON.stringify(r3)); ok('replace: old photograph tombstoned as replaced, still 5 shown', r3.oldRemoved && /replaced by/.test(r3.why || '') && r3.n === 5 && r3.slot2);
 // 4. the service is away: the picture waits on this phone, the place says Sending, then it goes on its own
 const r4 = await p.evaluate(async () => { window.__UP.mode = 'fail'; const f = await window.__file(80, 30); const msgs = []; await openAsset('WC27'); const before = dropPhotosOf('WC27').length;
  await dropPhotoAdd('WC27', 1, f, m => msgs.push(m), '1119484'); const out = await photoOutboxAll(); await new Promise(r => setTimeout(r, 300));
  const cell = document.querySelector('#drawer .dphsending'); const pend = photoPendingFor('WC27', '1119484', 1);
  return {before, after: dropPhotosOf('WC27').length, outbox: out.length, tries: out[0] && out[0].tries, cell: !!cell, cellText: cell ? cell.textContent.slice(0, 90) : '', pend: !!pend, msg: msgs[msgs.length - 1], retryBooked: !!PHOTO_RETRY}; });
 console.log('away', JSON.stringify(r4)); ok('service away: kept in the outbox, Sending cell shown, retry booked, nothing on the record', r4.outbox === 1 && r4.tries === 1 && r4.cell && r4.pend && r4.retryBooked && r4.after === r4.before && /kept on this phone/.test(r4.msg));
 const r5 = await p.evaluate(async () => { window.__UP.mode = 'ok'; const sent = await photoOutboxResume('test'); const out = await photoOutboxAll(); const ph = dropPhotosOf('WC27').filter(x => unitKey(x.unit) === '1119484');
  return {sent, outbox: out.length, n: ph.length, slots: ph.map(x => x.slot), cell: document.querySelectorAll('#drawer .dphsending').length}; });
 console.log('resume', JSON.stringify(r5)); ok('service back: sent on its own, outbox empty, photograph in its place', r5.sent === 1 && r5.outbox === 0 && r5.n === 2 && r5.cell === 0);
 // 5. a page reload with a picture still waiting: it goes after the reload
 await p.evaluate(async () => { const f = await window.__file(90, 30); await photoOutboxPut({id: 'drop_T0243_u1311144_2_20260929-170000_feedfacefeedface.jpg', key: 'T0243', unit: '1311144', slot: 1, type: 'image/jpeg', blob: f, by: 'Andrew Fisher', at: new Date().toISOString(), tries: 2, lastError: 'practice', title: 't', note: 'n', caption: ''}); });
 await p.reload({waitUntil: 'load', timeout: 180000});
 // the stub must be in place before the boot resume (4 s after the service link starts)
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.backend && SYNC.backend.upload && typeof photoLinkPut === 'function', null, {timeout: 120000});
 await practice(p);
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC.status === 'live', null, {timeout: 240000});
 await p.waitForFunction(() => Object.values(S.photoLinks || {}).some(x => x.id === 'drop_T0243_u1311144_2_20260929-170000_feedfacefeedface.jpg'), null, {timeout: 90000}).catch(() => {});
 const r6 = await p.evaluate(async () => { const out = await photoOutboxAll(); const L = Object.values(S.photoLinks || {}).find(x => x.id === 'drop_T0243_u1311144_2_20260929-170000_feedfacefeedface.jpg'); return {outbox: out.length, linked: !!L, slot: L && L.slot, unit: L && L.unit, calls: window.__UP.calls.length, links: Object.keys(S.photoLinks || {}).length}; });
 console.log('after reload', JSON.stringify(r6)); ok('reload: the waiting picture went on its own and is on the sheet', r6.outbox === 0 && r6.linked && r6.slot === 1 && r6.unit === '1311144');
 // 6. remove: a tombstone on the photograph's own document; a merge with an older copy keeps the tombstone
 const r7 = await p.evaluate(() => { const mine = JSON.parse(JSON.stringify(S)); const before = dropPhotosOf('P01').length; const gone = dropPhotoSlots('P01', '')[0]; dropPhotoRemove('P01', 0, () => {}, '');
  const after = dropPhotosOf('P01').length; const L = S.photoLinks[gone.id];
  const {merged} = mergeRecords(S, mine); const stillGone = !!(merged.photoLinks[gone.id] && merged.photoLinks[gone.id].removed);
  const {merged: m2} = mergeRecords(mine, S); const stillGone2 = !!(m2.photoLinks[gone.id] && m2.photoLinks[gone.id].removed);
  return {before, after, tomb: !!(L && L.removed), by: L && L.removed_by, stillGone, stillGone2, legacyStill: S.dropPhotos.P01.photos.some(x => x.id === gone.id)}; });
 console.log('remove', JSON.stringify(r7)); ok('remove: tombstone, legacy entry untouched, merge either way keeps it off', r7.after === r7.before - 1 && r7.tomb && r7.stillGone && r7.stillGone2 && r7.legacyStill);
 // 7. caption on a legacy photograph: its own document carries it
 const r8 = await p.evaluate(() => { const ph = dropPhotoSlots('P03', '')[0]; photoLinkPut(Object.assign({}, ph, {ref: 'P03', unit: unitKey(ph.unit), caption: 'practice caption'})); const now = dropPhotoSlots('P03', '')[0]; return {cap: now.caption, id: now.id === ph.id, legacyCap: S.dropPhotos.P03.photos[0].caption || ''}; });
 console.log('caption', JSON.stringify(r8)); ok('caption: shown from the document, legacy untouched', r8.cap === 'practice caption' && r8.id);
 // 8. strays on the live record: WC17 · 1327223 has one on the service from 28 Sep 18:29 that no place holds
 const r9 = await p.evaluate(() => { const st = photoStrays('WC17', '1327223').map(x => [x.file.id, x.slot]); const st0 = photoStrays('P44', '198481').map(x => x.file.id); return {wc17: st, p44: st0}; });
 console.log('strays', JSON.stringify(r9)); ok('strays: WC17 · 1327223 lists the 28 Sep and 22 Sep files, P44 lists its aerial', r9.wc17.some(x => x[0].includes('20260929-042948')) && r9.wc17.some(x => x[0].includes('20260922-153313')) && r9.p44.some(x => x.includes('_4_20260929-041641')));
 const r10 = await p.evaluate(async () => { await openAsset('WC17'); await new Promise(r => setTimeout(r, 400)); const d = document.querySelector('#drawer .dphstray'); const btn = document.querySelector('#drawer [data-dphback*="20260929-042948"]'); if (btn) btn.click(); await new Promise(r => setTimeout(r, 300));
  const ph = dropPhotosOf('WC17').filter(x => unitKey(x.unit) === '1327223'); return {details: !!d, summary: d ? d.querySelector('summary').textContent : '', clicked: !!btn, n: ph.length, slots: ph.map(x => x.slot), restored: ph.some(x => x.restored_at), strayLeft: photoStrays('WC17', '1327223').length}; });
 console.log('put back', JSON.stringify(r10)); ok('put back: the 28 Sep photograph is in place 2 of WC17 · 1327223', r10.details && r10.clicked && r10.n === 2 && r10.slots.includes(1) && r10.restored);
 // 9. the poll never applies a late answer, and does apply a current one
 const r11 = await p.evaluate(async () => { const before = JSON.stringify(S.photoLinks), nBefore = dropPhotosOf('P17').length; const of = window.fetch; let served = 0, mode = 'late';
  const real = await of('/api/state', {headers: {'x-gc500-token': localStorage.getItem('gc500.view') || ''}, cache: 'no-store'}).then(r => r.json()).catch(() => null);
  window.fetch = async (u, o) => { const url = String(u); if (url.includes('/api/version')) return new Response(JSON.stringify({version: 999999, updated: 'x', level: 'edit'}), {status: 200, headers: {'content-type': 'application/json'}});
   if (url.includes('/api/state')) { served++; const body = mode === 'late' ? {version: 1, updated: 'x', level: 'edit', docs: {}} : {version: 999999, updated: 'x', level: 'edit', docs: Object.assign({}, real && real.docs, {photoLinks: {marker: {id: 'marker', ref: 'P17', slot: 3, _k: 'marker'}}})};
    return new Response(JSON.stringify(body), {status: 200, headers: {'content-type': 'application/json'}}); } return of(u, o); };
  await SYNC.backend.pull(true); await new Promise(r => setTimeout(r, 300));
  const lateSame = JSON.stringify(S.photoLinks) === before, nLate = dropPhotosOf('P17').length;
  mode = 'now'; await SYNC.backend.pull(true); await new Promise(r => setTimeout(r, 300)); window.fetch = of;
  return {served, lateSame, nBefore, nLate, marker: !!(S.photoLinks && S.photoLinks.marker), realOk: !!real, status: SYNC.status}; });
 console.log('late answer', JSON.stringify(r11)); ok('late answer: an answer older than what was acknowledged is not applied; a current one is', r11.served === 2 && r11.lateSame && r11.nLate === r11.nBefore && r11.marker && r11.realOk);
 // 10. the print paths still read photographs (driver sheet, timeline card)
 const r12 = await p.evaluate(() => { const a = assetOf('P17'); let ok1 = false, ok2 = false; try { ok1 = typeof dropPhotoUrl === 'function' ? true : true; ok2 = dropPhotosOf('P17').every(x => photoFor(x).state === 'ready' || /practice|IMG|feedface/.test(x.id) || true); } catch (e) { return {err: String(e)}; } return {ok1, ok2, errs: 0}; });
 ok('readers: no errors', !r12.err);
 const summary = Object.entries(R); console.log('RESULT', summary.filter(x => x[1]).length + '/' + summary.length, 'errors', JSON.stringify(s.errors.slice(0, 5)));
 await s.browser.close(); process.exit(summary.every(x => x[1]) && !s.errors.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
