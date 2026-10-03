/* ------------------------------------------------------------------ v7.41 - PHOTOS STICK
 Andrew Fisher, 29 Sep 2026: "please ensure when photos are added they stick. I have noticed photos are
 disappearing, or the next day they get removed or don't attach. Huge bug."

 WHAT WAS HAPPENING. The service's request log for 24 and 28 Sep, read against the record and the file list:
 - Every reference kept ONE document holding ALL of its photographs. Every add, remove and caption rebuilt that
   whole list from what this phone held in memory and wrote it over the top. At the circuit, with uploads taking
   14 to 65 seconds and the browser abandoning some of them (the service logged 499, "client closed the request"),
   the phone's memory fell behind the service, and the next write put the older list back - a photograph that had
   landed a minute earlier was written out of the record, with its file left on the service pointing at nothing.
   141 photographs uploaded, 41 files on the service with nothing pointing at them.
 - An upload that the browser gave up on (a reload, a stall) was gone from the page for good, although the service
   had stored it: "it didn't attach", and the picture was taken again.
 - A poll answer that left the service BEFORE a write landed could arrive AFTER the write's acknowledgement and be
   folded in as the newer truth, so a photograph vanished from the screen for a few seconds - and a write in those
   seconds wrote the vanishing into the record.

 WHAT CHANGES.
 1. One document per photograph (S.photoLinks, keyed by the file's own id). Adding a photograph writes ONE new
    document; nothing ever rewrites another photograph's document. Taking one off writes a tombstone on its own
    document (removed: when, by whom), which a merge keeps by its stamp like any other change. The old per-reference
    lists (S.dropPhotos) are read but never written again.
 2. An outbox on the phone (IndexedDB). The shrunk picture and where it goes are saved on the device BEFORE the
    upload starts, and the entry is removed only once the service has the file AND its document is written. A
    failed or abandoned upload goes again on its own - after 3 s, 6 s, 12 s ... up to a minute, on every page
    open, and whenever the phone comes back online. The place shows "Sending" meanwhile, so nobody takes it twice.
 3. The poll never applies an answer older than what this browser has already read or been acknowledged for.
 4. A photograph on the service that no place holds is listed under its group, with Put back.
 A photograph the record holds is never hidden: two in one place are both shown, the newer one in the numbered
 place and the older one after it. */
const PHOTO_OUTBOX = new Map();      // id -> entry, mirrored from IndexedDB so the drawer can draw it without waiting
const PHOTO_SENDING = new Set();     // ids with an upload on the wire right now
let PHOTO_RETRY = null, PHOTO_RETRY_N = 0, PHOTO_BOOTED = false;
function photoIdb(mode, fn){
 return new Promise((res, rej) => {
 let rq;
 try { rq = indexedDB.open('gc500.photos', 1); } catch (e) { return rej(e); }
 rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', {keyPath: 'id'}); };
 rq.onerror = () => rej(rq.error || new Error('IndexedDB refused'));
 rq.onblocked = () => rej(new Error('IndexedDB blocked'));
 rq.onsuccess = () => { const db = rq.result;
 try { const tx = db.transaction('outbox', mode), st = tx.objectStore('outbox'); const r = fn(st);
 tx.oncomplete = () => { db.close(); res(r && r.result); }; tx.onerror = () => { db.close(); rej(tx.error || new Error('IndexedDB write failed')); }; }
 catch (e) { db.close(); rej(e); } };
 });
}
async function photoOutboxPut(e){ PHOTO_OUTBOX.set(e.id, e); try { await photoIdb('readwrite', st => st.put(e)); return true; } catch (x) { return false; } }
async function photoOutboxDelete(id){ PHOTO_OUTBOX.delete(id); try { await photoIdb('readwrite', st => st.delete(id)); return true; } catch (x) { return false; } }
async function photoOutboxAll(){ try { const r = await photoIdb('readonly', st => st.getAll()); return Array.isArray(r) ? r : []; } catch (x) { return [...PHOTO_OUTBOX.values()]; } }
/* the entry waiting to go into one place, if any */
function photoPendingFor(key, unit, slot){
 const u = unitKey(unit);
 for (const e of PHOTO_OUTBOX.values()) if (e && String(e.key) === String(key) && unitKey(e.unit) === u && Number(e.slot) === Number(slot)) return e;
 return null;
}
function photoPendingCount(){ return PHOTO_OUTBOX.size; }
/* ------------------------------------------------------------------ the documents */
function photoLinksOf(key){
 const L = S.photoLinks || {};
 return Object.values(L).filter(x => x && x.id && String(x.ref) === String(key));
}
/* every photograph a reference holds: the old list and the new documents, one entry per file, tombstones out.
 In a group, numbered places first; two in one place have the newer first, so it takes the number. */
function dropPhotosOf(key){
 const r = (S.dropPhotos || {})[key];
 const legacy = (r && Array.isArray(r.photos) ? r.photos : []).filter(x => x && x.id);
 const byId = new Map();
 legacy.forEach(x => byId.set(String(x.id), Object.assign({}, x)));
 photoLinksOf(key).forEach(x => { const o = Object.assign({}, byId.get(String(x.id)) || {}, x); delete o._k; delete o.ref; byId.set(String(x.id), o); });
 const out = [...byId.values()].filter(x => !x.removed);
 const sn = x => typeof x.slot === 'number' && isFinite(x.slot) ? x.slot : 99;
 out.sort((a, b) => unitKey(a.unit).localeCompare(unitKey(b.unit)) || (sn(a) - sn(b)) || String(b.at || '').localeCompare(String(a.at || '')));
 return out;
}
/* write one photograph's document. Fields that begin with an underscore are for drawing only and never travel. */
function photoLinkPut(link, who){
 if (!(link && link.id)) return null;
 S.photoLinks = S.photoLinks || {};
 const id = String(link.id), prev = S.photoLinks[id] || {};
 const next = Object.assign({}, prev, link, {id});
 Object.keys(next).forEach(k => { if (k.charAt(0) === '_' || next[k] === undefined) delete next[k]; });
 next.ref = String(next.ref || prev.ref || '');
 const u = unitKey(next.unit); if (u) next.unit = u; else delete next.unit;
 if (typeof next.slot !== 'number' || !isFinite(next.slot)) next.slot = Number(next.slot);
 if (!isFinite(next.slot)) delete next.slot;
 S.photoLinks[id] = next;
 stampIt('photoLinks', id, who);
 return next;
}
/* a place is emptied by a tombstone on the photograph that stood there - the file stays on the service */
function photoLinkRemove(key, ph, who, why){
 if (!(ph && ph.id)) return null;
 const t = Object.assign({}, ph, {ref: key, unit: unitKey(ph.unit) || undefined, removed: new Date().toISOString(), removed_by: String(who || S.operator || '').trim() || undefined});
 if (why) t.removed_why = why;
 return photoLinkPut(t, who);
}
/* the old whole-list writers, kept for anything that still calls them: they now write documents, one per photograph */
function dropPhotoSet(key, list){
 const want = new Map(); (list || []).filter(x => x && x.id).forEach(x => want.set(String(x.id), x));
 dropPhotosOf(key).forEach(x => { if (!want.has(String(x.id))) photoLinkRemove(key, x); });
 want.forEach(x => photoLinkPut(Object.assign({}, x, {ref: key})));
}
function dropPhotoGroupSet(key, unit, group){
 const u = unitKey(unit);
 const want = new Map(); (group || []).filter(x => x && x.id).forEach(x => { const y = Object.assign({}, x); if (u) y.unit = u; else delete y.unit; want.set(String(y.id), y); });
 dropPhotosOf(key).filter(x => unitKey(x.unit) === u).forEach(x => { if (!want.has(String(x.id))) photoLinkRemove(key, x); });
 want.forEach(x => photoLinkPut(Object.assign({}, x, {ref: key})));
}
/* ------------------------------------------------------------------ sending, and sending again */
function photoRetryLater(){
 if (PHOTO_RETRY || !PHOTO_OUTBOX.size) return;
 const wait = Math.min(60000, 3000 * Math.pow(2, Math.min(PHOTO_RETRY_N, 5)));
 PHOTO_RETRY_N++;
 PHOTO_RETRY = setTimeout(() => { PHOTO_RETRY = null; photoOutboxResume('retry'); }, wait);
}
function photoDrawerRedraw(){
 try { const dr = $('#drawer'); if (dr && dr.classList.contains('on') && state.sel && !document.body.classList.contains('dropping')) openAsset(state.sel, {keep: true}); } catch (e) {}
}
/* one entry: the file to the service, then its document. Returns true once both are done. A failure keeps the
 entry where it is and books the next try; nothing is ever dropped on the floor. */
async function photoSend(e, say){
 const tell = say || (() => {});
 if (!(e && e.id && e.blob)) return false;
 if (PHOTO_SENDING.has(e.id)) return false;
 if (!(SYNC.backend && SYNC.backend.upload) || SYNC.readonly) return false;
 PHOTO_SENDING.add(e.id);
 try {
 let payload = e.blob;
 try { payload = new File([e.blob], e.id, {type: e.type || 'image/jpeg'}); } catch (x) { try { payload.name = e.id; } catch (x2) {} }
 let up = null, failed = '';
 try { up = await SYNC.backend.upload(payload, {kind: 'drop-photo', title: e.title || '', note: e.note || ''}); }
 catch (err) { failed = String((err && err.message) || err || 'the service did not answer'); }
 if (!failed && !(up && typeof up.id === 'string' && up.id.trim())) failed = 'the service did not return a file ID';
 if (failed) {
 e.tries = (e.tries || 0) + 1; e.lastError = failed; e.lastTry = new Date().toISOString();
 await photoOutboxPut(e);
 photoRetryLater();
 tell(((DROP_SLOTS[e.slot] || {}).lab || 'The photograph') + ' for ' + e.key + (e.unit ? ' · asset ' + e.unit : '') + ' is kept on this phone - the service did not take it (' + failed + '). It goes again on its own; the place says Sending until it lands. No need to take it again.');
 photoDrawerRedraw();
 return false;
 }
 /* the file is on the service: its card goes into the registry before anything redraws (the F07 rule) */
 DOCS.files = DOCS.files || {};
 DOCS.files[up.id] = Object.assign({id: up.id, name: up.name || e.id, kind: 'drop-photo'}, up);
 if (DOCS.state !== 'ready') docsRefresh(true);
 /* the photograph that stood in this place, if one still does, is replaced: its own document says so */
 const was = dropPhotoSlots(e.key, e.unit)[e.slot];
 photoLinkPut({id: up.id, name: up.name || e.id, ref: e.key, unit: e.unit, slot: Number(e.slot), by: e.by || '', at: e.at || new Date().toISOString(), caption: e.caption || ''}, e.by);
 if (was && String(was.id) !== String(up.id) && !was._fromReference) photoLinkRemove(e.key, was, e.by, 'replaced by ' + up.id);
 await photoOutboxDelete(e.id);
 PHOTO_RETRY_N = 0;
 bump();
 tell(((DROP_SLOTS[e.slot] || {}).lab || 'Photograph') + ' saved against ' + e.key + (e.unit ? ' · asset ' + e.unit : '') + (e.by ? '' : ' - put your name in "Recording as" and the next one will carry it') + '. The original service files are retained.' + uploadPreviewNote(up));
 return true;
 } finally { PHOTO_SENDING.delete(e.id); }
}
/* everything waiting on this device goes, one after another */
async function photoOutboxResume(why){
 if (!(SYNC.backend && SYNC.backend.upload) || SYNC.readonly) return 0;
 const all = await photoOutboxAll();
 all.forEach(e => { if (e && e.id && !PHOTO_OUTBOX.has(e.id)) PHOTO_OUTBOX.set(e.id, e); });
 const list = [...PHOTO_OUTBOX.values()].filter(e => e && e.id && e.blob && !PHOTO_SENDING.has(e.id));
 if (!list.length) return 0;
 let sent = 0;
 for (const e of list) { if (await photoSend(e, null)) sent++; }
 if (sent) flash(sent + ' photograph' + (sent === 1 ? '' : 's') + ' kept on this phone ' + (sent === 1 ? 'has' : 'have') + ' now reached the shared record.');
 if (PHOTO_OUTBOX.size) photoRetryLater();
 return sent;
}
/* once, when the service link is up: what this phone still holds goes, and keeps going while the page is open */
function photoOutboxBoot(){
 if (PHOTO_BOOTED) return; PHOTO_BOOTED = true;
 const go = () => { try { photoOutboxResume('boot'); } catch (e) {} };
 setTimeout(go, 4000);
 setInterval(() => { if (PHOTO_OUTBOX.size && !PHOTO_RETRY) go(); }, 60000);
 window.addEventListener('online', go);
 document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PHOTO_OUTBOX.size) go(); });
 photoOutboxAll().then(all => { all.forEach(e => { if (e && e.id) PHOTO_OUTBOX.set(e.id, e); }); if (all.length) photoDrawerRedraw(); }).catch(() => {});
}
/* forget one that is waiting - the person's choice, never the page's */
async function photoOutboxForget(id, say){
 const tell = say || flash;
 await photoOutboxDelete(id);
 tell('That photograph will not be sent. Nothing on the shared record changed.');
 photoDrawerRedraw();
}
/* ------------------------------------------------------------------ photographs on the service that no place holds */
function photoStrays(key, unit){
 const ix = photoIndex(); if (ix.state !== 'ready') return [];
 const u = unitKey(unit);
 const clean = s => String(s).replace(/[^A-Za-z0-9._-]+/g, '_').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 const rx = new RegExp('^drop_' + clean(key) + (u ? '_u' + clean(u) : '') + '_(\\d)_\\d{8}-\\d{6}_[0-9a-f]+\\.[a-z0-9]+$', 'i');
 const held = new Set(dropPhotosOf(key).map(x => String(x.id)));
 const named = new Set(Object.keys(S.photoLinks || {}));
 return Object.values(ix.files || {})
.filter(f => f && f.kind === 'drop-photo' && rx.test(String(f.id)) && !held.has(String(f.id)) && !named.has(String(f.id)) && !PHOTO_OUTBOX.has(String(f.id)))
.map(f => ({file: f, slot: Number((rx.exec(String(f.id)) || [])[1]) - 1}))
.sort((a, b) => String(b.file.uploaded || '').localeCompare(String(a.file.uploaded || '')));
}
function photoStrayBlock(key, unit, can, opts){
 const u = unitKey(unit);
 /* a one-number reference shows its reference-level photographs under that number (the v5.59 fold), so the ones left
 on the service at reference level are listed there too, each keeping its real home for Put back */
 const list = photoStrays(key, u).map(x => Object.assign({}, x, {unit: u}))
.concat(u && opts && opts.foldReference ? photoStrays(key, '').map(x => Object.assign({}, x, {unit: ''})) : []);
 if (!list.length) return '';
 return `<details class="dphstray"><summary>${list.length} photograph${list.length === 1 ? '' : 's'} of ${esc(key)}${u ? ' · asset ' + esc(u) : ''} on the service, not on the sheet</summary>
 <p class="norate">Taken here earlier and left on the service - replaced, taken off, or lost by the fault fixed on 29 Sep 2026. Put back puts one into its place again; nothing is uploaded twice.</p>
 <div class="dphstraygrid">${list.map(x => { const f = x.file, r = photoFor({id: f.id, name: f.name}); const url = r.state === 'ready' ? (r.thumb || r.url) : null; const lab = (DROP_SLOTS[x.slot] || {}).lab || 'Photo ' + (x.slot + 1);
 return `<figure class="dphstrayone">${url ? `<img src="${esc(url)}" alt="${esc(lab)}" loading="lazy" data-dphopen="${esc(r.url)}">` : '<span class="dphstraynone">no preview</span>'}
 <figcaption><b>${esc(lab)}</b><span class="w">${f.uploaded ? esc(fmtStamp(f.uploaded)) : 'time not recorded'}${f.by ? ' · ' + esc(f.by) : ''}</span>
 ${can ? `<button type="button" class="btn ghost sm" data-dphback="${esc(f.id)}" data-dphslot="${x.slot}"${x.unit ? ` data-dphunit="${esc(x.unit)}"` : ''}>Put back</button>` : ''}</figcaption></figure>`; }).join('')}</div></details>`;
}
/* Put back: the file's own document, in its old place if that is free, else the first free one. It carries the
 file's upload time, so a photograph taken since keeps the numbered place and this one is shown after it. */
function photoPutBack(key, id, unit, slotWanted, say){
 const tell = say || flash;
 if (!mayWrite('the drop sheet')) return;
 const who = whoAmI(); if (!who) return;
 const f = DOCS.files && DOCS.files[id];
 if (!f) return tell('That file is not on the service any more - refresh Documents and look again. Nothing was changed.');
 const u = unitKey(unit), slots = dropPhotoSlots(key, u);
 if (dropPhotosOf(key).some(x => String(x.id) === String(id))) return tell('That photograph is already on the sheet for ' + key + '.');
 let slot = Number(slotWanted);
 if (!(slot >= 0 && slot < DROP_MAX) || slots[slot]) { const free = slots.indexOf(null); slot = free > -1 ? free : (slot >= 0 && slot < DROP_MAX ? slot : 0); }
 photoLinkPut({id: String(f.id), name: f.name || String(f.id), ref: key, unit: u, slot, by: who, at: f.uploaded || new Date().toISOString(), caption: '', restored_at: new Date().toISOString(), restored_by: who}, who);
 bump();
 tell(((DROP_SLOTS[slot] || {}).lab || 'Photograph') + ' for ' + key + (u ? ' · asset ' + u : '') + ' is that photograph again - put back by ' + who + '. The file was never uploaded twice.');
}
/* the cell a place shows while its photograph is still on this phone */
function photoSendingCell(e, lab, can){
 const tries = e.tries || 0;
 return `<div class="dph dphsending" data-dphpending="${esc(e.id)}">
 <div class="dphslot" data-lab="${esc(lab)}">${esc(lab)}</div>
 <b>${tries ? 'Kept on this phone - sending again' : 'Sending…'}</b>
 <p class="dphhint">${tries ? 'The service did not take it ' + (tries === 1 ? 'once' : tries + ' times') + (e.lastError ? ' (' + esc(String(e.lastError).slice(0, 70)) + ')' : '') + '. It goes again on its own. Do not take it again.' : 'On its way to the shared record. Do not take it again.'}</p>
 ${can ? `<div class="dphacts"><button type="button" class="btn ghost sm" data-dphsend="${esc(e.id)}">Send now</button><button type="button" class="btn ghost sm" data-dphforget="${esc(e.id)}">Forget it</button></div>` : ''}
 </div>`;
}
