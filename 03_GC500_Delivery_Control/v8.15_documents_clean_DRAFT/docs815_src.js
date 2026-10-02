/* ================================================================== v8.15 - DOCUMENTS, CLEANED UP
 Andrew, 3 Oct 2026, on the first mock-up: "your mock ups look different to the style we using in all other pages . looks
 like a kids made it". So this tab is built out of the page's own pieces and nothing else: Today's cards (.card.hubcard,
 .hubtitle, .hubbig, .hublist, .hubgo), the reference plate (refPlate / .rplate), the traffic-light pip (.tl), the
 buttons (.btn, .btn.sm), the fold (details.sfold) and the find box the Change deliveries page already uses (.edbar).

 Top to bottom: a find box that filters everything on the tab; six category cards, each with its count and a light
 (green: every file is there; red: something is not uploaded); the category you pick, as slim rows; the last five uploads;
 Print and Refresh at the foot, and on the edit link "+ Add" with the upload form behind it.

 What is not drawn any more: the banner, the two count lines, the section chips, the explanation paragraphs, the source
 pill, the empty Invoices notice, "no revision recorded on the file" and the other empty details. Nothing is lost: every
 file the tab listed is still one tap from its category, and the long lists (the print set, the dated pre-starts) are
 folded rather than dropped. The previous drawing code is kept, untouched, and is what draws the tab if this one fails. */
const TILES815 = [
 ['swms', 'Safety · SWMS', 'SWMS & safety plan', 'swms'],
 ['transport', 'Transport', 'Transport & lifting', 'transport'],
 ['maps', 'Drawings', 'Maps and drawings', 'map'],
 ['packs', 'Packs', 'Packs', 'pack'],
 ['photos', 'Photos', 'Photographs', 'photo'],
 ['dockets', 'Fencing dockets', 'Fencing dockets', 'docket'],
 ['invoices', 'Invoices', 'Invoices', null]];
const DOCSEC815 = {swms: 'swms', transport: 'transport', maps: 'maps', packs: 'packs', photos: 'photos', invoices: 'invoices',
 dockets: 'dockets', fencing: 'maps'}; /* the old section names; "fencing" is the fencing tab's "Open the plan": the plans, under Drawings */
const DOCSEC_AT815 = {fencing: 'docsub815-fencing'}; /* ...scrolled to the Fencing plans heading */
const words815 = (n, one, many) => fmtNum(n) + ' ' + (n === 1 ? one : many);

/* THE SAME PAPER TWICE. Five Advanced Fencing pre-starts are in the build's catalogue under one name and were uploaded
 under another (..._Advanced_Fencing_2026-09-14 and ..._ATF_2026-09-14), so the tab showed each twice: once "not hosted",
 once available. A catalogue entry with no file, in the same category as an uploaded file whose name says the same thing,
 is that file: it is shown once, available, under the catalogue's title. Called by docCollection(), so every count that
 reads the collection (this tab, Today's card, the printed list) counts it once. */
function twinKey815(id){ return String(id || '').toLowerCase().replace(/\.[a-z0-9]+$/, '')
 .replace(/advanced_temporary_fencing|advanced_fencing/g, 'advfence').replace(/(^|_)atf(?=_|$)/g, '$1advfence').replace(/[^a-z0-9]+/g, '_'); }
/* the header search reads the build's catalogue, not the collection: it is told which catalogue id is now its uploaded
 copy, so it opens the one file. Worked out from the service's file list alone (no docket matching), once per list. */
function twinIds815(){
 try {
  if (DOCS.state !== 'ready' || !DOCS.files) return {};
  if (twinIds815.at === DOCS.at && twinIds815.map) return twinIds815.map;
  const cat = (DATA.docs || {}).docs || [], known = new Set(cat.map(d => d.id)), by = new Map();
  Object.values(DOCS.files).forEach(f => { if (!known.has(f.id)) by.set(twinKey815(f.id) + '|' + (f.kind || ''), f.id); });
  const map = {}; cat.forEach(d => { if (DOCS.files[d.id]) return; const u = by.get(twinKey815(d.id) + '|' + (d.kind || '')); if (u) map[d.id] = u; });
  twinIds815.at = DOCS.at; twinIds815.map = map; return map;
 } catch (e) { return {}; }
}
function twins815(items){
 try {
  const key = d => twinKey815(d.id);
  const up = new Map();
  items.forEach(d => { if (d.source === 'uploaded' && d.availability === 'ready') up.set(key(d) + '|' + d.category, d); });
  for (let i = items.length - 1; i >= 0; i--) {
   const c = items[i];
   if (c.source !== 'catalogue' || c.availability !== 'missing') continue;
   const t = up.get(key(c) + '|' + c.category);
   if (!t || t.twin_of) continue;
   t.twin_of = c.id; t.title = c.title || t.title; t.group = c.group || t.group;
   ['pages', 'paper', 'orientation', 'doc_ref', 'date_on_page', 'revision'].forEach(k => { if (c[k] != null && t[k] == null) t[k] = c[k]; });
   items.splice(i, 1);
  }
 } catch (e) { /* a failed match leaves both copies listed, as before */ }
 return items;
}

/* --- what a row shows */
function photoRef815(d){
 if (d.ref) return String(d.ref);
 const m = String(d.id || d.name || '').match(/^drop_(.+?)(?:_u[A-Za-z0-9._-]+?)?_[1-9]\d*_\d{8}-\d{6}/);
 if (m) return m[1];
 const t = String(d.title || '').match(/^(\S+) on site\b/);
 return t ? t[1] : null;
}
function prestart815(d){ return /prestart|pre-start/i.test(String(d.id || '') + ' ' + String(d.title || '')); }
function isoIn815(d){ const m = (String(d.id || '') + ' ' + String(d.title || '')).match(/(20\d\d)-(\d\d)-(\d\d)/); return m ? m[0] : ''; }
function docketNo815(d){ const m = String(d.title || '').match(/\b\d{4,7}\b/) || String(d.name || d.id || '').match(/\d{4,7}/); return m ? m[0] : null; }
function docketBook815(no){
 try {
  if (!no) return null;
  const dk = (allDockets() || []).find(x => String(x.docket_no || '').trim() === no); if (dk) return {words: 'Hire agreement', date: dk.date};
  const sn = (serviceNoteRows() || []).find(x => String(x.note_no || '').trim() === no); if (sn) return {words: 'Service note', date: sn.date};
  const cl = (collectionRows() || []).find(x => String(x.collection_no || '').trim() === no); if (cl) return {words: 'Collection form', date: cl.date};
 } catch (e) {}
 return null;
}
/* the plate: a reference, a sheet or a docket number on the orange plate; what kind of paper it is on the espresso one */
function plate815(d){
 const id = String(d.id || ''), t = String(d.title || '');
 if (d.category === 'Photographs') { const r = photoRef815(d); return r ? refPlate(r, 14) : refPlate('SITE', 14, 'inv'); }
 if (d.category === 'Fencing dockets') { const n = docketNo815(d); return n ? refPlate(n, 14) : refPlate('DOCKET', 14, 'inv'); }
 if (d.category === 'Invoices') return refPlate(d.branch || 'INV', 14, 'inv');
 if (d.category === 'SWMS & safety plan') { const k = docTypeOf(d).key; return refPlate(k === 'risk' ? 'RISK' : k === 'plan' ? 'HSEQ' : 'SWMS', 14, 'inv'); }
 if (d.category === 'Transport & lifting') return refPlate('TRANSPORT', 14, 'inv');
 if (d.category === 'Packs') {
  if (prestart815(d)) { const iso = isoIn815(d); return refPlate(iso ? String(fmtDay(iso).dm || iso).toUpperCase() : 'PRE-START', 14, 'inv'); }
  return refPlate('PACK', 14, 'inv');
 }
 if (d.sheet_ids && d.sheet_ids.length) return refPlate(String(d.sheet_ids[0]).split('-')[0], 14);
 const m = id.match(/^([DK]\d{3})_/); if (m) return refPlate(m[1], 14);
 const cw = (id + ' ' + t).match(/\bCW\s?(\d)/i); if (cw) return refPlate('CW' + cw[1], 14);
 if (d.group === 'a1') return refPlate('A1', 14, 'inv');
 if (/a3/i.test(String(d.group || '')) || /\bA3\b/.test(t)) return refPlate('A3', 14, 'inv');
 return refPlate('MAP', 14, 'inv');
}
/* one line under the title, only what the file actually carries: its own reference, its revision, pages, paper, when it
 was uploaded and by whom. No "no revision recorded", no "capture time not recorded", no "title is the file name". */
function meta815(d){
 const m = [];
 if (d.category === 'Fencing dockets') { const b = docketBook815(docketNo815(d)); if (b && b.date) { const f = fmtDay(b.date); m.push(esc((f.dow ? f.dow + ' ' : '') + f.dm)); } }
 if (d.doc_ref) m.push(esc(d.doc_ref));
 if (d.sheet_ids && d.sheet_ids.length > 1) m.push(d.sheet_ids.length + ' sheets');
 if (d.revision) m.push('rev ' + esc(d.revision)); else if (d.rev_on_page) m.push('rev ' + esc(d.rev_on_page));
 if (d.pages) m.push(d.pages + (d.pages === 1 ? ' page' : ' pages'));
 if (d.paper) m.push(esc(d.paper));
 if (d.ext && d.ext !== 'pdf' && !/^(jpe?g|png|webp|heic)$/i.test(d.ext)) m.push(esc(String(d.ext).toUpperCase()));
 if (d.ref && d.category !== 'Photographs') m.push('filed against <button type="button" class="linkish" data-open815="' + esc(d.ref) + '">' + esc(d.ref) + '</button>');
 if (d.branch) m.push('branch ' + esc(d.branch)); if (d.invoice_no) m.push('invoice ' + esc(d.invoice_no));
 const up = d._up;
 if (up && up.uploaded) m.push('uploaded ' + esc(fmtStamp(up.uploaded)) + (up.by ? ' · ' + esc(up.by) : ''));
 return m.join(' · ');
}
function title815(d){
 if (d.category === 'Photographs') { const r = photoRef815(d), t = String(d.title || d.name || ''); return r ? t.replace(new RegExp('^' + r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' on site\\s*[—-]\\s*'), '') || t : t; }
 if (d.category === 'Fencing dockets') { const b = docketBook815(docketNo815(d)); return b ? b.words : 'Fencing docket'; }
 return String(d.title || d.name || d.id);
}
/* the light: green it is there, red it is not uploaded, amber still asking the service, a hollow ring if the service did not answer */
function light815(state){
 return state === 'ready' ? '<span class="tl green" title="On the service — opens"><i></i></span>'
  : state === 'missing' ? '<span class="tl red" title="Not uploaded yet"><i></i><span class="w">not uploaded</span></span>'
  : state === 'checking' ? '<span class="tl amber" title="Checking the service"><i></i><span class="w">checking</span></span>'
  : '<span class="tl none" title="The service did not answer — not known"><i></i><span class="w">not checked</span></span>';
}
/* the light for a set of files: red if any is not uploaded, amber while checking, green when all are there */
function setLight815(list){
 const miss = list.filter(d => d.availability === 'missing').length;
 if (miss) return `<span class="tl red"><i></i><span class="w">${fmtNum(miss)} not uploaded</span></span>`;
 if (list.some(d => d.availability === 'checking')) return '<span class="tl amber"><i></i><span class="w">checking</span></span>';
 if (list.some(d => d.availability === 'unchecked')) return '<span class="tl none"><i></i><span class="w">not checked</span></span>';
 return list.length ? '<span class="tl green" title="Every file is there"><i></i></span>' : '';
}
/* the card's light: the pip alone - the words are on the line under it */
function pip815(list){
 const s = list.some(d => d.availability === 'missing') ? ['red', 'Something here is not uploaded'] : list.some(d => d.availability === 'checking') ? ['amber', 'Checking the service']
  : list.some(d => d.availability === 'unchecked') ? ['none', 'The service did not answer'] : ['green', 'Every file is there'];
 return `<span class="tl ${s[0]}" title="${s[1]}" aria-label="${s[1]}"><i></i></span>`;
}
function row815(d, o){
 o = o || {};
 if (o.print) o = Object.assign({}, o, {thumb: false});
 const href = docHref(d), canAdd = !!(SYNC.backend && SYNC.backend.fileUrl) && !SYNC.readonly;
 const isPhoto = d.category === 'Photographs';
 const ref = isPhoto ? photoRef815(d) : null;
 const lead = o.time ? `<span class="tm">${d._up && d._up.uploaded ? esc(fmtStamp(d._up.uploaded).slice(0, 6)) : '—'}</span>`
  : ref && typeof assetOf === 'function' && assetOf(ref) ? `<button type="button" class="linkish plateb" data-open815="${esc(ref)}" aria-label="Open ${esc(ref)}">${plate815(d)}</button>` : plate815(d);
 const thumb = isPhoto && o.thumb ? (() => { const t = docPhotoPreview(d, href); return t ? `<img class="ph815" src="${esc(t)}" alt="" loading="lazy" decoding="async">` : ''; })() : '';
 const meta = o.meta != null ? o.meta : meta815(d);
 const why = d.availability === 'missing' && canAdd ? '<span class="anos editonly">Not on the service yet — upload it with + Add at the foot of this tab.</span>' : '';
 const open = href ? `<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener">Open</a>` : '';
 const print = d.map_key && (DATA.sheets || []).some(s => s.key === d.map_key) ? `<button type="button" class="btn sm" data-printsheet="${esc(d.map_key)}">Print sheet</button>` : '';
 const del = d.source === 'uploaded' && canAdd ? `<button type="button" class="btn sm editonly" data-delfile="${esc(d.id)}" title="Remove this file from the service">Remove</button>` : '';
 return `<li class="hubrow row815" ${o.print ? 'data-print815' : 'data-doc815'}="${esc(d.id)}">${lead}${thumb}<span class="w"${d.note ? ` title="${esc(d.note)}"` : ''}><b>${esc(o.title || title815(d))}</b>${meta ? `<span class="anos">${meta}</span>` : ''}${why}</span>${light815(d.availability)}${open}${print}${del}</li>`;
}
const list815 = (items, o) => items.length ? `<ul class="hublist rows815">${items.map(d => row815(d, o)).join('')}</ul>` : '';
function fold815(key, label, items, body, extra, P){
 if (P) return `<h4 class="sub815">${extra || ''} ${label}</h4>${body}`;
 const open = !!((state.docOpen815 || {})[key]);
 return `<details class="sfold fold815" data-fold815="${esc(key)}"${open ? ' open' : ''}><summary>${extra || ''}<span>${label}</span>${setLight815(items)}</summary><div class="sfoldbody">${body}</div></details>`;
}

/* --- the collection, by card */
function tileItems815(all){
 const by = {};
 TILES815.forEach(([k,, cat]) => { by[k] = all.filter(d => d.category === cat); });
 return by;
}
function photoGroups815(items){
 const g = new Map();
 items.forEach(d => { const r = photoRef815(d) || ''; if (!g.has(r)) g.set(r, []); g.get(r).push(d); });
 return [...g.entries()].sort((a, b) => (a[0] ? 0 : 1) - (b[0] ? 0 : 1) || a[0].localeCompare(b[0], 'en', {numeric: true}))
  .map(([ref, list]) => [ref, list.sort((x, y) => String((x._up || {}).uploaded || '').localeCompare(String((y._up || {}).uploaded || '')))]);
}
function photosBody815(items, P){
 /* on paper: one line per reference - the photographs themselves stay on the screen */
 if (P) return `<ul class="hublist rows815">${photoGroups815(items).map(([ref, list]) => { const last = list[list.length - 1] && list[list.length - 1]._up;
  return `<li class="hubrow row815" data-printref815="${esc(ref)}">${ref ? refPlate(ref, 14) : refPlate('SITE', 14, 'inv')}<span class="w"><b>${words815(list.length, 'photo', 'photos')}</b>${last && last.uploaded ? `<span class="anos">latest ${esc(fmtStamp(last.uploaded))}</span>` : ''}</span>${setLight815(list)}</li>`; }).join('')}</ul>`;
 return `<div class="folds815">${photoGroups815(items).map(([ref, list]) =>
  fold815('ph:' + ref, words815(list.length, 'photo', 'photos'), list,
   `<ul class="hublist rows815">${list.map(d => row815(d, {time: true, thumb: true})).join('')}</ul>`,
   ref ? refPlate(ref, 13) : refPlate('SITE', 13, 'inv'))).join('')}</div>`;
}
const sub815 = (title, items, o, id) => items.length ? `<h4 class="sub815"${id ? ` id="${id}"` : ''}>${esc(title)}</h4>${list815(items, o)}` : '';
function catBody815(key, items, P){
 const o = P ? {print: true} : undefined;
 if (key === 'photos') return photosBody815(items, P);
 if (key === 'dockets') return list815(items.slice().sort((a, b) => String(docketNo815(a) || '').localeCompare(String(docketNo815(b) || ''), 'en', {numeric: true})), o);
 if (key === 'maps') {
  const fence = d => d.group === 'fencing' || (d.source === 'uploaded' && /fenc/i.test(String(d.title || '') + ' ' + d.id));
  const print = items.filter(d => ['a1', 'a3', 'a3_single'].includes(d.group));
  const issued = items.filter(d => d.group === 'issued'), plans = items.filter(d => !print.includes(d) && !issued.includes(d) && fence(d));
  const other = items.filter(d => !print.includes(d) && !issued.includes(d) && !plans.includes(d));
  return sub815('As issued — project 26003', issued, o) + sub815('Fencing plans', plans, o, P ? '' : 'docsub815-fencing') + sub815('Other drawings', other, o)
   + (print.length ? fold815('print', 'Print set — ' + words815(print.length, 'plate', 'plates'), print,
     sub815('A1 aerial plates', print.filter(d => d.group === 'a1'), o) + sub815('A3', print.filter(d => d.group === 'a3'), o) + sub815('Single A3 plates', print.filter(d => d.group === 'a3_single'), o), '', P) : '');
 }
 if (key === 'packs') {
  const pre = items.filter(prestart815).sort((a, b) => (isoIn815(a) || '9').localeCompare(isoIn815(b) || '9') || String(a.title).localeCompare(String(b.title)));
  return list815(items.filter(d => !pre.includes(d)), o)
   + (pre.length ? fold815('prestarts', 'Daily pre-starts — ' + fmtNum(pre.length), pre, list815(pre, o), '', P) : '');
 }
 if (key === 'invoices') {
  const codes = (BRANCHES.branches || []).map(b => b.code);
  const groups = [...new Set(items.map(d => d.branch || '—'))].sort((x, y) => (codes.indexOf(x) + 1 || 99) - (codes.indexOf(y) + 1 || 99) || x.localeCompare(y));
  return groups.map(c => sub815(c + (branchName(c) ? ' — ' + branchName(c) : ''), items.filter(d => (d.branch || '—') === c), o)).join('');
 }
 return list815(items, o);
}
/* THE LIST ON PAPER, however printing is started (Print the list, Ctrl+P, the browser menu): every category in full,
 folds as headings, photographs one line per reference. Hidden on screen; the screen's cards and buttons are hidden on paper. */
function printList815(by){
 return `<div class="print815">${TILES815.filter(([k]) => by[k].length).map(([k, label]) =>
  `<section class="prtcat815"><h3>${esc(label)} <span class="w">· ${fmtNum(by[k].length)}</span></h3>${catBody815(k, by[k], true)}</section>`).join('')}</div>`;
}

/* --- the find box: every word must be somewhere in what the file is */
function hay815(d){
 const t = TILES815.find(x => x[2] === d.category) || [];
 return [d.title, d.name, d.id, d.doc_ref, d.ref, photoRef815(d), d.branch, d.invoice_no, d.note, t[1], d.category, d.paper,
  docketNo815(d), (d.sheet_ids || []).join(' '), (d.sheets || []).map(s => (s.sheet_id || '') + ' ' + (s.title || '')).join(' '),
  d.category === 'Fencing dockets' ? title815(d) : '', d.twin_of || ''].filter(Boolean).join(' ').toLowerCase();
}
function find815(all, q){
 const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
 if (!toks.length) return null;
 return all.filter(d => { const h = hay815(d); return toks.every(t => h.includes(t)); });
}
function resultsBody815(found, q){
 if (!found.length) return `<div class="card hubcard static815 in815" id="docsec-results"><div class="hubtitle"><h3>Nothing matches “${esc(q)}”</h3><button type="button" class="btn sm" data-clear815>Clear</button></div>
  <p class="norate">Try a reference (P03), a sheet (D022), a docket number or a word from the title.</p></div>`;
 const by = tileItems815(found);
 return `<div class="card hubcard static815 in815" id="docsec-results"><div class="hubtitle"><h3>${words815(found.length, 'match', 'matches')} for “${esc(q)}”</h3><button type="button" class="btn sm" data-clear815>Clear</button></div>
  ${TILES815.filter(([k]) => by[k].length).map(([k, label]) => k === 'photos'
   ? `<h4 class="sub815">${esc(label)}</h4><ul class="hublist rows815">${photoGroups815(by[k]).map(([ref, list]) => {
     const last = list[list.length - 1] && list[list.length - 1]._up;
     return `<li class="hubrow row815" data-photoref815="${esc(ref)}">${ref ? refPlate(ref, 14) : refPlate('SITE', 14, 'inv')}<span class="w"><b>${words815(list.length, 'photo', 'photos')}</b>${last && last.uploaded ? `<span class="anos">latest ${esc(fmtStamp(last.uploaded))}</span>` : ''}</span>${setLight815(list)}<button type="button" class="btn sm" data-showref815="${esc(ref)}">Show</button></li>`; }).join('')}</ul>`
   : sub815(label, k === 'dockets' ? by[k].slice().sort((a, b) => String(docketNo815(a)).localeCompare(String(docketNo815(b)), 'en', {numeric: true})) : by[k])).join('')}</div>`;
}

/* --- the tab */
function tilesHtml815(by, found){
 const sel = state.docTile815;
 return TILES815.filter(([k]) => k !== 'invoices' || by[k].length).map(([k, label]) => {
  const list = by[k], n = found ? found.filter(d => d.category === TILES815.find(x => x[0] === k)[2]).length : list.length;
  const on = sel === k && !found, miss = list.filter(d => d.availability === 'missing').length;
  const noun = k === 'photos' ? ['photo', 'photos'] : k === 'dockets' ? ['docket', 'dockets'] : k === 'maps' ? ['drawing', 'drawings'] : ['file', 'files'];
  return `<div class="card hubcard tile815${on ? ' on815' : ''}${found && !n ? ' dim815' : ''}" role="button" tabindex="0" data-tile815="${k}" aria-pressed="${on}" aria-controls="docBody815">
   <div class="hubtitle"><h3>${esc(label)}</h3>${pip815(list)}</div>
   <div class="hubbig"><b>${fmtNum(n)}</b> ${found ? 'found' : esc(n === 1 ? noun[0] : noun[1])}${miss && !found ? ` <span class="w">·</span> ${fmtNum(miss)} not uploaded` : ''}</div>
   <div class="hubgo">${on ? 'Showing below ↓' : 'Show →'}</div></div>`; }).join('');
}
function bodyHtml815(all, by, found){
 if (found) return resultsBody815(found, state.docQ815);
 const sel = state.docTile815 && by[state.docTile815] ? state.docTile815 : null;
 const recent = all.filter(d => d._up && d._up.uploaded).sort((a, b) => String(b._up.uploaded).localeCompare(String(a._up.uploaded))).slice(0, 5);
 const t = sel ? TILES815.find(x => x[0] === sel) : null;
 return (t ? `<div class="card hubcard static815${state.docAnim815 ? ' in815' : ''}" id="docsec-${sel}"><div class="hubtitle"><h3>${esc(t[1])}</h3></div>${catBody815(sel, by[sel]) || '<p class="norate">Nothing here yet.</p>'}</div>` : '')
  + (recent.length ? `<div class="card hubcard static815 recent815"><div class="hubtitle"><h3>Recent</h3><span class="chip ref">last ${recent.length} uploaded</span></div>
   <ul class="hublist rows815">${recent.map(d => row815(d, {meta: [esc((TILES815.find(x => x[2] === d.category) || [, d.category])[1]), meta815(d)].filter(Boolean).join(' · ')})).join('')}</ul></div>` : '');
}
function addFormHtml815(){
 const refOpts = allAssets().map(a => a.key).sort((x, y) => x.localeCompare(y, 'en', {numeric: true})).map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
 return `<div class="card" id="docAddCard"${state.docAdd815 ? '' : ' hidden'}><h4 style="margin:0 0 6px;font-size:14px">Add a document from this device</h4>
 <div class="docadd"><select id="docKind" aria-label="What kind of document">
 <optgroup label="Documents"><option value="swms">SWMS</option><option value="transport">Transport &amp; lifting</option><option value="map">Map / drawing / plate</option><option value="pack">Pack / report</option><option value="docket">Fencing docket</option><option value="other">Other</option></optgroup>
 <optgroup label="Photographs"><option value="photo">Photo of a location — filed against a reference</option></optgroup>
 <optgroup label="Invoices">${(BRANCHES.branches || []).map(b => `<option value="invoice|${esc(b.code)}">${esc(b.code)} invoice${b.name ? ' — ' + esc(b.name) : ''}</option>`).join('')}</optgroup></select>
 <select id="docRef" aria-label="Which reference the photograph shows" hidden><option value="">Location — which reference?</option>${refOpts}</select>
 <input type="text" id="docInv" placeholder="Invoice number (optional)" maxlength="60" hidden>
 <input type="text" id="docTitle" placeholder="Title as it should read (optional — the file name otherwise)" maxlength="140">
 <input type="file" id="docFile" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv,.txt" multiple>
 <button class="btn primary" id="docUpload">Upload</button></div>
 <p class="norate" id="docMsg" style="margin:6px 0 0">${DOCS.msg ? esc(DOCS.msg) : S.operator ? 'Recorded as ' + esc(S.operator) + '.' : 'Put your name in “Recording as” first so the upload carries it.'}</p></div>`;
}
function docsTitle815(){ return '<h2 class="panehead vh" id="panehead-docs">' + esc('Documents — ' + DATA.event.name) + '</h2>'; }
function renderDocs815(){
 const hosted = !!(SYNC.backend && SYNC.backend.fileUrl), canAdd = hosted && !SYNC.readonly;
 if (hosted) docsRefresh(false);
 state.photoCat = null;
 const COLL = docCollection(), all = COLL.items, by = tileItems815(all);
 /* a deep link (#docs/swms, the fencing papers, Today's card) picks its card */
 let land = null;
 if (state.docsec) {
  const k = DOCSEC815[state.docsec];
  if (k && by[k] && by[k].length) { state.docTile815 = k; state.docQ815 = ''; land = DOCSEC_AT815[state.docsec] || 'docsec-' + k; state.docAnim815 = true; state.docsec = null; }
  else if (!hosted || !['unrequested', 'loading'].includes(DOCS.state)) { flash('That document section has no files to show.'); state.docsec = null; }
 }
 const pane = $('#pane-docs');
 const ae = document.activeElement, hadQ = ae && ae.id === 'docQ815', caret = hadQ ? [ae.selectionStart, ae.selectionEnd] : null;
 const found = find815(all, state.docQ815);
 pane.innerHTML = docsTitle815() + `
 <div class="hubhead head815"><div><h2>Documents</h2></div>
  <div class="edbar docfind815"><div class="f"><label for="docQ815">Find a document</label>
  <input id="docQ815" type="search" placeholder="SWMS, D022, WC12, a docket number" value="${esc(state.docQ815 || '')}" autocomplete="off" aria-controls="docBody815"></div></div></div>
 <div class="hub tiles815" id="docTiles815">${tilesHtml815(by, found)}</div>
 <div id="docBody815" aria-live="polite">${bodyHtml815(all, by, found)}</div>
 <div class="daynav docfoot815"><button type="button" class="btn sm" id="docsPrintList">Print the list</button>${hosted ? '<button type="button" class="btn sm" id="docsRefresh">Refresh</button>' : ''}${canAdd ? '<button type="button" class="btn sm editonly" id="docAdd815" aria-expanded="' + !!state.docAdd815 + '">+ Add</button>' : ''}</div>
 ${canAdd ? addFormHtml815() : ''}
 ${printList815(by)}`;
 state.docAnim815 = false;
 wireDocs815(pane, all);
 if (hadQ) { const q = $('#docQ815'); if (q) { try { q.focus({preventScroll: true}); if (caret) q.setSelectionRange(caret[0], caret[1]); } catch (e) {} } }
 if (land) setTimeout(() => { const el = $('#' + land); if (el && document.contains(el) && state.tab === 'docs') el.scrollIntoView({block: 'start', behavior: 'auto'}); }, 0);
}
/* typing repaints the cards and the list under them, never the box being typed in */
function paintDocs815(){
 const COLL = docCollection(), all = COLL.items, by = tileItems815(all), found = find815(all, state.docQ815);
 const t = $('#docTiles815'), b = $('#docBody815'); if (!t || !b) return renderDocs815();
 t.innerHTML = tilesHtml815(by, found); b.innerHTML = bodyHtml815(all, by, found);
 state.docAnim815 = false;
 wireDocs815($('#pane-docs'), all, true);
}
function pickTile815(k){
 const was = state.docTile815;
 state.docQ815 = ''; const q = $('#docQ815'); if (q) q.value = '';
 state.docTile815 = was === k ? null : k; state.docAnim815 = !!state.docTile815;
 setHash(state.docTile815 ? 'docs/' + state.docTile815 : 'docs');
 paintDocs815();
 const el = state.docTile815 && $('#docsec-' + state.docTile815);
 if (el) { const r = el.getBoundingClientRect(); if (r.top > innerHeight * 0.6 || r.top < 0) el.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'start'}); }
}
function showRef815(ref){
 state.docQ815 = ''; const q = $('#docQ815'); if (q) q.value = '';
 state.docTile815 = 'photos'; state.docAnim815 = true; state.docOpen815 = Object.assign({}, state.docOpen815, {['ph:' + ref]: true});
 setHash('docs/photos'); paintDocs815();
 const el = $(`#pane-docs [data-fold815="ph:${CSS.escape(ref)}"]`) || $('#docsec-photos');
 if (el) el.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'start'});
}
function wireDocs815(pane, all, partial){
 if (!pane) return;
 pane.querySelectorAll('[data-tile815]').forEach(b => {
  b.onclick = () => pickTile815(b.dataset.tile815);
  b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickTile815(b.dataset.tile815); } };
 });
 pane.querySelectorAll('[data-fold815]').forEach(d => d.addEventListener('toggle', () => {
  state.docOpen815 = Object.assign({}, state.docOpen815, {[d.dataset.fold815]: d.open}); }));
 pane.querySelectorAll('[data-printsheet]').forEach(b => b.onclick = () => printSheet(b.dataset.printsheet));
 pane.querySelectorAll('[data-open815]').forEach(b => b.onclick = () => openAsset(b.dataset.open815));
 pane.querySelectorAll('[data-showref815]').forEach(b => b.onclick = () => showRef815(b.dataset.showref815));
 pane.querySelectorAll('[data-clear815]').forEach(b => b.onclick = () => { state.docQ815 = ''; const q = $('#docQ815'); if (q) { q.value = ''; q.focus(); } paintDocs815(); });
 pane.querySelectorAll('[data-delfile]').forEach(b => b.onclick = async () => {
  if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Remove — press again to confirm'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'Remove'; }, 4000); return; }
  try { await SYNC.backend.removeFile(b.dataset.delfile); flash('Removed from the service.'); docsRefresh(true); }
  catch (e) { flash('Could not remove it: ' + (e && e.message || e)); } });
 if (partial) return;
 const q = $('#docQ815');
 if (q) q.oninput = () => { state.docQ815 = q.value; clearTimeout(wireDocs815.t); wireDocs815.t = setTimeout(paintDocs815, 120); };
 const pl = $('#docsPrintList'); if (pl) pl.onclick = () => printDocs815();
 const rf = $('#docsRefresh'); if (rf) rf.onclick = () => docsRefresh(true);
 const add = $('#docAdd815'), card = $('#docAddCard');
 if (add && card) add.onclick = () => {
  state.docAdd815 = card.hidden; card.hidden = !state.docAdd815; add.setAttribute('aria-expanded', String(!!state.docAdd815));
  if (!state.docAdd815) return;
  const t = TILES815.find(x => x[0] === state.docTile815), k = $('#docKind');
  const want = t ? (t[3] || ((BRANCHES.branches || []).length ? 'invoice|' + BRANCHES.branches[0].code : null)) : null;
  if (k && want && [...k.options].some(o => o.value === want)) { k.value = want; k.dispatchEvent(new Event('change')); }
  card.scrollIntoView({behavior: motionOff() ? 'auto' : 'smooth', block: 'nearest'});
  const f = $('#docFile'); if (f) { try { f.focus({preventScroll: true}); } catch (e) {} }
 };
 const up = $('#docUpload'); if (up) { up.disabled = !!DOCS.uploading; up.onclick = () => docUpload(); }
 const dk = $('#docKind'); if (dk) { const on = () => { const k = dk.value.split('|')[0]; const r = $('#docRef'), i = $('#docInv');
  if (r) r.hidden = !(k === 'photo' || k === 'invoice' || k === 'map'); if (i) i.hidden = k !== 'invoice'; }; dk.onchange = on; on(); }
}
/* Print the list: the paper list is always on the page (printList815), so this is the browser's own print */
function printDocs815(){ try { markCards(); window.print(); } catch (e) {} }
