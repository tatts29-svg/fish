#!/usr/bin/env python3
"""v7.41 - photos stick. Andrew Fisher, 29 Sep 2026: "please ensure when photos are added they stick. Photos are
disappearing, or the next day they get removed or don't attach. Huge bug."
 - one document per photograph (S.photoLinks); the per-reference lists are read but never written again
 - an outbox on the phone: the shrunk picture waits on the device until the service has it AND its document is written
 - the poll never applies an answer older than what this browser has already read or been acknowledged for
 - photographs on the service that no place holds are listed under their group, with Put back
    python3 patch_v741.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function photoLinkPut(' in t: sys.exit('v7.41 already applied')
if 'function recordServiceNote(' not in t: sys.exit('needs v7.40')
JS = open(os.path.join(here, 'photo741_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'photo741.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')

# 1. the reader: the old one goes, the new code (which defines dropPhotosOf) stands in its place
t = rep(t, """function dropPhotosOf(key){
 const r = (S.dropPhotos || {})[key];
 const list = r && Array.isArray(r.photos) ? r.photos : [];
 return list.filter(x => x && x.id);
}""", JS, 'reader', p, True)
# 2. a photograph the record holds is never hidden: past the numbered places, it is shown after them
t = rep(t, " got.filter(x => typeof x.slot !== 'number' || !out.includes(x)).forEach(x => { const i = out.indexOf(null); if (i > -1) out[i] = x; });",
 " got.filter(x => typeof x.slot !== 'number' || !out.includes(x)).forEach(x => { const i = out.indexOf(null); if (i > -1) out[i] = x; else out.push(x); }); /* v7.41 - never hidden */", 'slots extras', p, True)
# 3. the old whole-list writers come out (the new code carries them, writing one document per photograph)
t = rep(t, """function dropPhotoSet(key, list){
 S.dropPhotos = S.dropPhotos || {};
 /* DROP_MAX per group — the reference, and each unit — never DROP_MAX in all */
 const seen = {}, keep = [];
 (list || []).filter(x => x && x.id).forEach(x => {
 const g = unitKey(x.unit); seen[g] = (seen[g] || 0) + 1;
 if (seen[g] <= DROP_MAX) keep.push(x);
 });
 if (keep.length) S.dropPhotos[key] = {photos: keep};
 else delete S.dropPhotos[key];
 stampIt('dropPhotos', key);
}
/* one group's photographs replaced inside the whole list, the other groups untouched */
function dropPhotoGroupSet(key, unit, group){
 const u = unitKey(unit);
 const rest = dropPhotosOf(key).filter(x => unitKey(x.unit) !== u);
 const mine = (group || []).filter(Boolean).map(x => { const y = Object.assign({}, x); if (u) y.unit = u; else delete y.unit; return y; });
 dropPhotoSet(key, rest.concat(mine.sort((x, y) => x.slot - y.slot)));
}""", "/* v7.41 - dropPhotoSet and dropPhotoGroupSet now live with the photograph documents above: one document per photograph, never a whole list */", 'old writers', p, True)
# 4. adding: into the outbox first, then sent - and sent again until it lands
t = rep(t, """ const was = dropPhotoSlots(key, u)[slot];
 let up;
 try {
 up = await SYNC.backend.upload(payload, {kind: 'drop-photo',
 title: key + (u ? ' · asset ' + u : '') + ' on site — ' + ((DROP_SLOTS[slot] || {}).lab || 'photo ' + (slot + 1)),
 note: 'Photograph of ' + key + (u ? ' (asset ' + u + ')' : '') + ' after the drop' + (S.operator ? ', taken by ' + S.operator : '') + '.'});
 } catch (e) { return tell(String((e && e.message) || e) + ' — nothing was changed.'); }""",
 """ const was = dropPhotoSlots(key, u)[slot];
 /* v7.41 - the picture and where it goes are kept on this device BEFORE a byte leaves it. The entry stays until
 the service has the file and its document is written; a failed or abandoned upload goes again on its own. */
 const at = new Date().toISOString();
 const entry = {id: name, key, unit: u, slot, type, blob: payload, by: S.operator || '', at, queued: at, tries: 0,
 caption: (was && was.caption) || '',
 title: key + (u ? ' · asset ' + u : '') + ' on site — ' + ((DROP_SLOTS[slot] || {}).lab || 'photo ' + (slot + 1)),
 note: 'Photograph of ' + key + (u ? ' (asset ' + u + ')' : '') + ' after the drop' + (S.operator ? ', taken by ' + S.operator : '') + '.'};
 await photoOutboxPut(entry);
 photoDrawerRedraw();
 return photoSend(entry, tell);
}
/* v7.41 - what follows was the old tail of dropPhotoAddUnlocked; photoSend does it now, one document per photograph */
async function dropPhotoAdd_oldTail(key, slot, tell, u, name, was, up){""", 'add: outbox', p, True)
# 4b. the old tail is dead code now: it comes out whole
a = t.find('/* v7.41 - what follows was the old tail of dropPhotoAddUnlocked')
b = t.find("uploadPreviewNote(up));\n}", a)
if a < 0 or b < 0: sys.exit('old tail not found')
t = t[:a] + t[b + len("uploadPreviewNote(up));\n}"):].lstrip('\n')
# 5. taking one off: a tombstone on its own document
t = rep(t, """ const u = unitKey(unit), got = dropPhotoSlots(key, u), gone = got[slot];
 if (!gone) return;
 dropPhotoGroupSet(key, u, got.map((x, i) => x && Object.assign({}, x, {slot: i})).filter(Boolean).filter(x => x.slot !== slot));
 bump();""", """ const u = unitKey(unit), got = dropPhotoSlots(key, u), gone = got[slot];
 if (!gone) return;
 photoLinkRemove(key, gone, S.operator || '', 'taken off'); /* v7.41 - its own document says it is off; nothing else is rewritten */
 bump();""", 'remove', p, True)
# 6. a filed photograph put into a place: one document
t = rep(t, """ const list = slots.map((x, i) => x && Object.assign({}, x, {slot: i})).filter(Boolean);
 const src = dropPhotosOf(key).find(y => String(y.id) === String(id));
 list.push({id: String(f.id), name: f.name || String(f.id), slot, by: who, at: new Date().toISOString(),
 caption: '', reused_from: src ? (unitKey(src.unit) || key) : 'filed', unit: u || undefined});
 dropPhotoGroupSet(key, u, list);
 bump();""", """ const src = dropPhotosOf(key).find(y => String(y.id) === String(id));
 photoLinkPut({id: String(f.id), name: f.name || String(f.id), ref: key, unit: u, slot, by: who, at: new Date().toISOString(),
 caption: '', reused_from: src ? (unitKey(src.unit) || key) : 'filed'}, who); /* v7.41 */
 bump();""", 'filed use', p, True)
# 7. a caption: the photograph's own document
t = rep(t, """ if (!hit || (hit.caption || '') === v) return;
 hit.caption = v;
 dropPhotoGroupSet(a.key, u, list); bump();""", """ if (!hit || (hit.caption || '') === v) return;
 photoLinkPut(Object.assign({}, hit, {ref: a.key, unit: unitKey(hit.unit), caption: v})); bump(); /* v7.41 */""", 'caption', p, True)
# 8. the drawer's buttons: Put back, Send now, Forget it
t = rep(t, " $$('[data-dphdel]').forEach(b => b.onclick = () => dropPhotoRemove(a.key, Number(b.dataset.dphdel), msg, b.dataset.dphunit || ''));",
 """ $$('[data-dphdel]').forEach(b => b.onclick = () => dropPhotoRemove(a.key, Number(b.dataset.dphdel), msg, b.dataset.dphunit || ''));
 /* v7.41 - a photograph left on the service goes back into its place; one waiting on this phone can be sent now, or forgotten */
 $$('[data-dphback]').forEach(b => b.onclick = () => photoPutBack(a.key, b.dataset.dphback, b.dataset.dphunit || '', Number(b.dataset.dphslot), msg));
 $$('[data-dphsend]').forEach(b => b.onclick = () => { const e = PHOTO_OUTBOX.get(b.dataset.dphsend); if (e) photoSend(e, msg); else msg('That photograph is not waiting any more.'); });
 $$('[data-dphforget]').forEach(b => b.onclick = () => photoOutboxForget(b.dataset.dphforget, msg));""", 'buttons', p, True)
# 9. the grid: a place whose photograph is still on this phone says so; past the numbered places no Replace is offered;
#    the group's stray photographs are listed under it
t = rep(t, """ if (!ph) {
 /* v5.58 — USE A PHOTOGRAPH THE SERVICE ALREADY HAS, BY ITS FILE ID.""", """ if (!ph) {
 const pend = photoPendingFor(key, u, i); /* v7.41 - still on this phone */
 if (pend) return photoSendingCell(pend, s.lab, can);
 /* v5.58 — USE A PHOTOGRAPH THE SERVICE ALREADY HAS, BY ITS FILE ID.""", 'sending cell', p, True)
t = rep(t, """ <input class="dphin" type="file" id="${hid}${hi}" accept="image/jpeg,image/png,image/webp" data-dphadd="${hi}"${hua}>
 <label class="btn ghost sm dphpick" for="${hid}${hi}">Replace</label>
 <button class="btn ghost sm" data-dphdel="${hi}"${hua}>Remove</button></div>`""",
 """ ${hi < DROP_MAX ? `<input class="dphin" type="file" id="${hid}${hi}" accept="image/jpeg,image/png,image/webp" data-dphadd="${hi}"${hua}>
 <label class="btn ghost sm dphpick" for="${hid}${hi}">Replace</label>` : ''}
 <button class="btn ghost sm" data-dphdel="${hi}"${hua}>Remove</button></div>`""", 'replace only in a numbered place', p, True)
t = rep(t, """ }).join('')}</div>`;
 };
 /* The units. Each asset number known against the reference gets its own pair""", """ }).join('')}</div>${photoStrayBlock(key, u, can, opts)}`;
 };
 /* The units. Each asset number known against the reference gets its own pair""", 'strays under the grid', p, True)
# 10. the record: blank, load, export, merge, checker, sync
t = rep(t, " dropPhotos:{},\n", " dropPhotos:{},\n photoLinks:{}, /* v7.41 - one document per photograph */\n", 'blank', p, True)
t = rep(t, " dropPhotos: (j && j.dropPhotos) || {}, units: (j && j.units) || {},", " dropPhotos: (j && j.dropPhotos) || {}, photoLinks: (j && j.photoLinks) || {}, units: (j && j.units) || {},", 'load', p, True)
t = rep(t, " dropPhotos: S.dropPhotos || {},\n", " dropPhotos: S.dropPhotos || {},\n photoLinks: S.photoLinks || {},\n", 'export', p, True)
t = rep(t, "'mapRef', 'dropPhotos', 'units', 'labour', 'eventHours', 'minDays', 'fixes', 'entries','places', 'runRules','answers', 'spares', 'subhire'].forEach(f => { out[f] = {};",
 "'mapRef', 'dropPhotos', 'photoLinks', 'units', 'labour', 'eventHours', 'minDays', 'fixes', 'entries','places', 'runRules','answers', 'spares', 'subhire'].forEach(f => { out[f] = {};", 'merge list', p, True)
t = rep(t, "f === 'dropPhotos' ? 'photos of' :f === 'units'", "f === 'dropPhotos' ? 'photos of' : f === 'photoLinks' ? 'the photograph' : f === 'units'", 'merge label', p, True)
t = rep(t, "'by', 'dropPhotos', 'units', 'docketPapers', 'actions', 'schema',", "'by', 'dropPhotos', 'photoLinks', 'units', 'docketPapers', 'actions', 'schema',", 'checker known', p, True)
t = rep(t, "'by', 'dropPhotos', 'units', 'docketPapers', 'loads', 'purchaseOrders',", "'by', 'dropPhotos', 'photoLinks', 'units', 'docketPapers', 'loads', 'purchaseOrders',", 'checker keyed', p, True)
t = rep(t, " dropPhotos: {kind: 'map', get: () => S.dropPhotos, set: v => S.dropPhotos = v},",
 " dropPhotos: {kind: 'map', get: () => S.dropPhotos, set: v => S.dropPhotos = v},\n /* v7.41 - one document per photograph: an add writes one, a removal is a tombstone on that one */\n photoLinks: {kind: 'map', get: () => S.photoLinks, set: v => S.photoLinks = v},", 'sync', p, True)
# 11. the poll: an answer older than what this browser has already read or been acknowledged for is a late answer
t = rep(t, " const ackVersion = v => { if (typeof v === 'number' && isFinite(v) && v === version + 1) version = v; };",
 """ /* v7.41 - `seen` is the highest version this browser has READ or been ANSWERED WITH. A record answer below it
 left the service before a write this browser already knows landed, and is not applied: the next poll asks again. */
 let seen = -1;
 const ackVersion = v => { if (typeof v === 'number' && isFinite(v)) { if (v > seen) seen = v; if (v === version + 1) version = v; } };""", 'ack', p, True)
t = rep(t, " version = st.version; docs = st.docs;\n deliverAll();", " if (st.version < seen) { syncFooter(); return; } /* v7.41 - a late answer, older than a write already acknowledged here */\n version = st.version; if (version > seen) seen = version; docs = st.docs;\n deliverAll();", 'late answer', p, True)
t = rep(t, " start: () => { pull(true); clearInterval(timer);", " start: () => { pull(true); photoOutboxBoot(); /* v7.41 */ clearInterval(timer);", 'boot', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
