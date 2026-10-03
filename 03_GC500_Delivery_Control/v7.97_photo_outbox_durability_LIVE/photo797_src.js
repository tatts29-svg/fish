/* Author: Andrew Fisher. Durable photo upload and reference acknowledgement. */
/* PHOTO797: photoIdb */
function photoIdb(mode, fn){
 return new Promise((res, rej) => {
  let rq, settled = false;
  const finish = (error, value) => { if (settled) return; settled = true; error ? rej(error) : res(value); };
  try { rq = indexedDB.open('gc500.photos', 1); } catch (e) { finish(e); return; }
  rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', {keyPath: 'id'}); };
  rq.onerror = () => finish(rq.error || new Error('IndexedDB refused'));
  rq.onblocked = () => finish(new Error('IndexedDB blocked'));
  rq.onsuccess = () => {
   const db = rq.result; if (settled) { db.close(); return; }
   try {
    const tx = db.transaction('outbox', mode), request = fn(tx.objectStore('outbox'));
    tx.oncomplete = () => { db.close(); finish(null, request && request.result); };
    tx.onerror = tx.onabort = () => { db.close(); finish(tx.error || new Error('IndexedDB transaction failed')); };
   } catch (e) { db.close(); finish(e); }
  };
 });
}
/* PHOTO797: photoOutboxPut */
async function photoOutboxPut(e){
 try { await photoIdb('readwrite', st => st.put(e)); PHOTO_OUTBOX.set(e.id, e); return true; }
 catch (error) { return false; }
}
/* PHOTO797: photoOutboxDelete */
async function photoOutboxDelete(id){
 try { await photoIdb('readwrite', st => st.delete(id)); PHOTO_REMOVED797.add(id); PHOTO_OUTBOX.delete(id); return true; }
 catch (error) { return false; }
}
/* PHOTO797: helpers */
/* v7.97. The file acknowledgement and the photoLinks acknowledgement are
   separate. The existing sync queue remains the only writer of record docs. */
const PHOTO_REMOVED797 = new Set(), PHOTO_QUEUE_BUSY797 = new Set(); // suppress stale reads and serialize this page before IndexedDB awaits
async function photoQueueEntry797(id){
 const stored = await photoIdb('readonly', st => st.get(id));
 if (!stored || PHOTO_REMOVED797.has(id)) { PHOTO_REMOVED797.add(id); PHOTO_OUTBOX.delete(id); return null; }
 const memory = PHOTO_OUTBOX.get(id);
 // A receipt whose checkpoint failed is still useful on this open page.
 if (memory && memory.uploaded && !stored.uploaded) stored.uploaded = memory.uploaded;
 const current = memory || stored;
 if (memory) { Object.keys(memory).forEach(k => { if (!(k in stored)) delete memory[k]; }); Object.assign(memory, stored); }
 PHOTO_OUTBOX.set(id, current); return current;
}
async function photoQueueLock797(id, action, tell){
 const run = async () => {
  if (PHOTO_QUEUE_BUSY797.has(id)) { tell('That photograph is already being processed on this page.'); return false; }
  PHOTO_QUEUE_BUSY797.add(id);
  try { const entry = await photoQueueEntry797(id); return entry ? await action(entry) : false; }
  catch (error) { tell('The photo queue could not be read safely on this device. Nothing new was sent or cancelled. Keep this page open and try again.'); photoRetryLater(); return false; }
  finally { PHOTO_QUEUE_BUSY797.delete(id); }
 };
 if (globalThis.navigator && navigator.locks && navigator.locks.request) {
  try { return await navigator.locks.request('gc500.photo.' + id, {ifAvailable: true}, lock => {
   if (lock) return run();
   tell('This photograph is being processed in another open page. It remains queued until that page finishes.'); return false;
  }); } catch (error) { tell('This browser could not coordinate the photo queue. Nothing new was sent or cancelled. Keep this page open and try again.'); return false; }
 }
 return run(); // PHOTO_SENDING also protects browsers without Web Locks on this page.
}
function photoRecordKept797(ids){
 try {
  const kept = JSON.parse(localStorage.getItem(STORE) || 'null');
  return !!kept && ids.every(id => JSON.stringify((kept.photoLinks || {})[id]) === JSON.stringify((S.photoLinks || {})[id]));
 } catch (error) { return false; }
}
function photoRecordAck797(ids){
 if (!SYNC.on || !SYNC.db || !SYNC.first.has('photoLinks')) return false;
 const docs = toDocs('photoLinks'), last = SYNC.last.photoLinks || {}, queue = SYNC.queue.photoLinks || {};
 return ids.every(key => {
  const id = docIdOf(key), wanted = docs[id], actual = last[id];
  return (wanted === undefined ? actual === undefined : actual === JSON.stringify(wanted))
   && !Object.prototype.hasOwnProperty.call(queue, id) && SYNC.inflight['photoLinks/' + id] === undefined;
 });
}
async function photoDigest797(blob){
 if (!(globalThis.crypto && crypto.subtle && blob && blob.arrayBuffer)) throw new Error('This browser cannot verify a retried upload. Keep this page open and use a current browser.');
 const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
 return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
async function photoRecoverUpload797(e){
 if (!(SYNC.backend && SYNC.backend.files)) throw new Error('The file list is unavailable; the earlier upload cannot be checked yet.');
 const answer = await SYNC.backend.files();
 if (!answer || !Array.isArray(answer.files)) throw new Error('The file list could not be read; the earlier upload has not been checked.');
 // A generated filename alone is not proof: require both exact name and bytes.
 const named = answer.files.filter(f => f && (f.name === e.id || f.id === e.id));
 const matched = named.filter(f => f.sha256 && String(f.sha256).toLowerCase() === e.sha256);
 if (named.length && (matched.length !== 1 || named.length !== 1)) throw new Error('The earlier upload needs checking in Documents; no duplicate has been sent.');
 return matched[0] || null;
}
function photoPendingMessage797(e, detail){
 e.lastError = detail;
 photoRetryLater();
 photoDrawerRedraw();
 return detail;
}
/* PHOTO797: photoSend */
async function photoSend(e, say){
 const tell = say || (() => {});
 if (!(e && e.id) || PHOTO_SENDING.has(e.id) || PHOTO_REMOVED797.has(e.id)) return false;
 return photoQueueLock797(e.id, entry => photoSendUnlocked797(entry, tell), tell);
}
async function photoSendUnlocked797(e, say){
 const tell = say || (() => {});
 if (!(e && e.id && e.blob) || PHOTO_SENDING.has(e.id) || PHOTO_REMOVED797.has(e.id)) return false;
 e = PHOTO_OUTBOX.get(e.id); if (!e) return false;
 if (!(SYNC.backend && SYNC.backend.upload) || SYNC.readonly) return false;
 PHOTO_SENDING.add(e.id);
 try {
  // Legacy entries and explicit retry callers must first prove a durable queue.
  // Never upload a memory-only photograph after an IndexedDB refusal.
  if (!await photoOutboxPut(e)) {
   tell(photoPendingMessage797(e, 'Could not keep this photograph on this device. Nothing new was uploaded. Keep this page open and try again; do not rely on a reload retaining it.'));
   return false;
  }
  if (!e.uploaded) {
   if (!e.sha256) e.sha256 = await photoDigest797(e.blob);
   if (e.uploadAttempted) e.uploaded = await photoRecoverUpload797(e);
   // Server v5.87 uploadFile derives the stable ID from this same generated
   // filename; a same-name retry replaces that one file, never appends another.
   if (!e.uploaded) {
    // Commit the attempt before bytes leave. A reload or lost response first
    // checks the service by exact generated name AND checksum, not a guess.
    e.uploadAttempted = true;
    if (!await photoOutboxPut(e)) { tell(photoPendingMessage797(e, 'Could not save the upload checkpoint on this device. Nothing new was uploaded. Keep this page open and try again.')); return false; }
    let payload = e.blob;
    try { payload = new File([e.blob], e.id, {type: e.type || 'image/jpeg'}); } catch (error) { payload.name = e.id; }
    const up = await SYNC.backend.upload(payload, {kind: 'drop-photo', title: e.title || '', note: e.note || ''});
    if (!(up && typeof up.id === 'string' && up.id.trim())) throw new Error('The service did not return a file ID; the next try will check Documents first.');
    e.uploaded = up;
   }
  }
  // Retain the returned service identity even if this checkpoint fails. Same-
  // page retries reuse it; after reload the saved attempt is reconciled above.
  if (!await photoOutboxPut(e)) { tell(photoPendingMessage797(e, 'The file reached the service, but this device could not keep its upload receipt. Keep this page open and retry; its reference has not been reported saved.')); return false; }
  const up = e.uploaded;
  DOCS.files = DOCS.files || {};
  DOCS.files[up.id] = Object.assign({id: up.id, name: up.name || e.id, kind: 'drop-photo'}, up);
  if (DOCS.state !== 'ready') docsRefresh(true);
  if (!SYNC.first.has('photoLinks')) { tell(photoPendingMessage797(e, 'The file is uploaded. Waiting to read the photo record before saving its reference; the photograph remains queued on this device.')); return false; }
  if (!e.linkPlan) {
   const was = dropPhotoSlots(e.key, e.unit)[e.slot], previous = e.previousId;
   // The user's original Replace target only. An upload finishing late must
   // not tombstone a newer photograph chosen while the network was busy.
   const replace = was && !was._fromReference && previous && String(was.id) === String(previous)
    && (!was.at || String(was.at) <= String(e.queued || e.at || '')) ? Object.assign({}, was) : null;
   e.linkPlan = {link: {id: up.id, name: up.name || e.id, ref: e.key, unit: e.unit, slot: Number(e.slot), by: e.by || '', at: e.at || e.queued, caption: e.caption || ''},
    replace, replaceStamp: replace ? ((S.stamps || {})['photoLinks/' + replace.id] || null) : null};
   if (!await photoOutboxPut(e)) { tell(photoPendingMessage797(e, 'The file is uploaded, but this device could not keep the reference checkpoint. The reference has not been changed. Keep this page open and retry.')); return false; }
  }
  const plan = e.linkPlan, ids = [String(up.id)]; if (plan.replace) ids.push(String(plan.replace.id));
  let changed = false;
  if (!(S.photoLinks || {})[up.id]) {
   photoLinkPut(plan.link, e.by); changed = true;
   if (plan.replace) {
    const now = dropPhotosOf(e.key).find(p => String(p.id) === String(plan.replace.id));
    const stamp = (S.stamps || {})['photoLinks/' + plan.replace.id] || null;
    if (now && JSON.stringify(now) === JSON.stringify(plan.replace) && stamp === plan.replaceStamp) {
     photoLinkRemove(e.key, now, e.by, 'replaced by ' + up.id);
    }
   }
  }
  // An existing document (including a later removal/caption/move) is never
  // restamped from an older outbox intent. Wait for that latest intent instead.
  if (changed || !photoRecordKept797(ids)) {
   bump();
   if (bump.kept === false || !photoRecordKept797(ids)) { tell(photoPendingMessage797(e, 'The file is uploaded, but its reference could not be saved in this browser. The photograph remains queued; keep this page open and retry.')); return false; }
  } else if (!photoRecordAck797(ids)) syncPush();
  if (!photoRecordAck797(ids)) { tell(photoPendingMessage797(e, 'The file is uploaded and its reference is saved on this device. Waiting for the shared record to confirm it; the photograph remains queued.')); return false; }
  if (!await photoOutboxDelete(e.id)) { tell(photoPendingMessage797(e, 'The shared photo record is confirmed, but this device could not clear the completed queue entry. It will retry cleanup without uploading the file again.')); return false; }
  PHOTO_RETRY_N = 0;
  photoDrawerRedraw();
  const current = (S.photoLinks || {})[up.id];
  tell(current && !current.removed && String(current.ref) === String(e.key)
   ? ((DROP_SLOTS[e.slot] || {}).lab || 'Photograph') + ' saved against ' + e.key + (e.unit ? ' · asset ' + e.unit : '') + '. The shared record has confirmed it.' + uploadPreviewNote(up)
   : 'The shared photo record has confirmed the later change. The completed upload has left this device’s queue.');
  return true;
 } catch (error) {
  e.tries = (e.tries || 0) + 1; e.lastTry = new Date().toISOString();
  e.lastError = String(error && error.message || error || 'The service did not answer');
  const kept = await photoOutboxPut(e);
  tell(photoPendingMessage797(e, (kept ? 'The photograph is kept in this device’s queue. ' : 'This device could not keep the latest queue state. Keep this page open. ')
   + e.lastError + ' It has not been reported saved against the reference.'));
  return false;
 } finally { PHOTO_SENDING.delete(e.id); }
}
/* PHOTO797: photoOutboxResume */
async function photoOutboxResume(why){
 if (!(SYNC.backend && SYNC.backend.upload) || SYNC.readonly) return 0;
 const all = await photoOutboxAll();
 all.forEach(e => { if (e && e.id && !PHOTO_REMOVED797.has(e.id) && !PHOTO_OUTBOX.has(e.id)) PHOTO_OUTBOX.set(e.id, e); });
 const list = [...PHOTO_OUTBOX.values()].filter(e => e && e.id && e.blob && !PHOTO_SENDING.has(e.id));
 let completed = 0;
 for (const e of list) if (await photoSend(e, null)) completed++;
 if (completed) flash(completed + ' queued photograph' + (completed === 1 ? ' has' : 's have') + ' finished saving. The shared photo record is confirmed.');
 if (PHOTO_OUTBOX.size) photoRetryLater();
 return completed;
}
/* PHOTO797: photoOutboxBoot */
function photoOutboxBoot(){
 if (PHOTO_BOOTED) return; PHOTO_BOOTED = true;
 const go = () => { photoOutboxResume('boot').catch(() => photoRetryLater()); };
 setTimeout(go, 4000);
 setInterval(() => { if (PHOTO_OUTBOX.size && !PHOTO_RETRY) go(); }, 60000);
 window.addEventListener('online', go);
 document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PHOTO_OUTBOX.size) go(); });
 photoOutboxAll().then(all => { all.forEach(e => { if (e && e.id && !PHOTO_REMOVED797.has(e.id) && !PHOTO_OUTBOX.has(e.id)) PHOTO_OUTBOX.set(e.id, e); }); if (all.length) photoDrawerRedraw(); }).catch(() => {});
}
/* PHOTO797: photoOutboxForget */
async function photoOutboxForget(id, say){
 const tell = say || flash;
 if (PHOTO_SENDING.has(id)) { tell('That photograph is being processed. Wait for it to finish before changing its queue entry.'); return false; }
 return photoQueueLock797(id, () => photoOutboxForgetUnlocked797(id, tell), tell);
}
async function photoOutboxForgetUnlocked797(id, say){
 const tell = say || flash, e = PHOTO_OUTBOX.get(id);
 if (!e) { tell('That photograph is not waiting on this device.'); return false; }
 if (PHOTO_SENDING.has(id)) { tell('That photograph is being processed. Wait for it to finish before changing its queue entry.'); return false; }
 if (e.uploaded || e.linkPlan) { tell('That file is already uploaded. Let its reference finish saving, then use Remove on the photograph if it should come off the sheet.'); return false; }
 // Serialize Forget with Send now and the automatic retry on this page.
 PHOTO_SENDING.add(id);
 try {
  if (!await photoOutboxDelete(id)) { tell('Could not remove this photograph from the device’s queue. It is still queued and may retry. Try Forget it again; cancellation has not completed.'); return false; }
  tell(e.uploadAttempted ? 'Further retries are cancelled. An earlier upload may already be on the service; nothing already sent has been removed.' : 'That photograph has left this device’s queue and will not be sent. Nothing on the shared record changed.');
  photoDrawerRedraw(); return true;
 } finally { PHOTO_SENDING.delete(id); }
}
/* PHOTO797: photoSendingCell */
function photoSendingCell(e, lab, can){
 const uploaded = !!e.uploaded;
 return `<div class="dph dphsending" data-dphpending="${esc(e.id)}">
 <div class="dphslot" data-lab="${esc(lab)}">${esc(lab)}</div>
 <b>${uploaded ? 'Uploaded — confirming the reference' : 'Queued on this device'}</b>
 <p class="dphhint">${esc(e.lastError || (uploaded ? 'The file is on the service. This entry stays until its reference is saved here and confirmed by the shared record.' : 'The photograph stays in this device’s queue until the file and its reference are confirmed.'))}</p>
 ${can ? `<div class="dphacts"><button type="button" class="btn ghost sm" data-dphsend="${esc(e.id)}">${uploaded ? 'Check now' : 'Send now'}</button>${!uploaded && !e.linkPlan ? `<button type="button" class="btn ghost sm" data-dphforget="${esc(e.id)}">Forget it</button>` : ''}</div>` : ''}
 </div>`;
}
/* PHOTO797: dropPhotoAddUnlocked */
async function dropPhotoAddUnlocked(key, slot, file, say, unit){
 const tell = say || flash;
 if (SYNC.readonly) return tell('View only — this link shows the record but cannot add a photograph to it.');
 if (!(SYNC.backend && SYNC.backend.upload)) return tell('Photographs are kept on the shared record’s service. This copy of the page has no service behind it, so there is nowhere to put one.');
 if (!file) return;
 /* The slot is checked before a single byte leaves the phone. A slot outside the two that exist used to be
 uploaded and THEN dropped when the record was trimmed back to two, which left a picture on the service with
 nothing pointing at it — an orphan nobody would ever think to go and remove. */
 if (!(slot >= 0 && slot < DROP_MAX)) return tell('There are ' + DROP_MAX + ' places for a photograph on a drop, and that is not one of them. Nothing was sent.');
 if (!/^image\//i.test(file.type || '')) return tell('That is not a picture. JPG, PNG and WebP are what the service keeps.');
 tell('Shrinking and sending…');
 let out;
 try { out = await dropShrink(file); }
 catch (e) { return tell('That picture could not be read on this device. Try it again, or send a JPG.'); }
 const u = unitKey(unit);
 const formats = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
 'image/gif': 'gif', 'image/bmp': 'bmp'};
 const type = out.shrunk ? 'image/jpeg' : String(out.blob.type || file.type || '').toLowerCase();
 const ext = formats[type];
 if (!ext) return tell('This device could not convert that picture to a supported format. Export it as JPG, PNG or WebP and try again. Nothing was uploaded.');
 let name;
 try { name = dropPhotoName(key, slot, u, ext); }
 catch (e) { return tell(e.message + ' Nothing was uploaded.'); }
 let payload = out.blob;
 try { payload = new File([out.blob], name, {type: type}); }
 catch (e) { try { payload.name = name; } catch (e2) {} } // older browsers: Blob with a name hung on it
 const was = dropPhotoSlots(key, u)[slot];
 /* v7.41 - the picture and where it goes are kept on this device BEFORE a byte leaves it. The entry stays until
 the service has the file and its document is written; a failed or abandoned upload goes again on its own. */
 const at = new Date().toISOString();
 const entry = {id: name, key, unit: u, slot, type, blob: payload, previousId: was && !was._fromReference ? String(was.id) : null, by: S.operator || '', at, queued: at, tries: 0,
 caption: (was && was.caption) || '',
 title: key + (u ? ' · asset ' + u : '') + ' on site — ' + ((DROP_SLOTS[slot] || {}).lab || 'photo ' + (slot + 1)),
 note: 'Photograph of ' + key + (u ? ' (asset ' + u + ')' : '') + ' after the drop' + (S.operator ? ', taken by ' + S.operator : '') + '.'};
 if (!await photoOutboxPut(entry)) { tell('Could not keep this photograph on this device. Nothing was uploaded. Free some storage or try another browser, then choose the photograph again.'); return false; }
 photoDrawerRedraw();
 return photoSend(entry, tell);
}
