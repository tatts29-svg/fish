/* Author: Andrew Fisher. VMS plan (v10.24): every variable message sign position on iEDM's VMS001-26003-01 plan,
   construction and event, as its own card on a VMS tab (#vms) - a direct pin, the satellite close-up where the page's
   registered aerial covers it, iEDM's own map crop and photo, a QR that navigates to the pin, the plan's words, dates,
   the messages (VMS 20), which board stands there (asset number, number plate), and notes - with the asset number,
   number plate, notes, position and "in place" editable on the edit link through the page's own write path, one
   document per position on the shared loads collection; one A4 sheet per position on the day-document print path
   (#print/vms/<pos>) and the whole plan as one pack (#print/vms/all). */
(function (W) {
'use strict';
const KIND = 'vms1024', PREFIX = 'vms1024/', FORM = 'GC500-VMS-01 v1', ISSUED = '15 Oct 2026';
const PLAN = W.VMS1024_DATA || {boards: [], source: {}, windows: {}};
const IMG = W.VMS1024_IMG || {};
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trim = x => String(x == null ? '' : x).trim();
const author = () => (DATA.brand && DATA.brand.author) || 'Andrew Fisher';
const authorTitle = () => { const p = (((DATA.team || {}).people) || []).find(x => x.name === author()); return (p && p.title) || 'Shutdown Manager'; };
let filter = 'all';
const crops = {}; /* pos -> aerial data URL, made once */

/* ---------------------------------------------------------------------------------------------------- the boards */
function boards(){ return PLAN.boards || []; }
function board(pos){ return boards().find(b => b.pos === pos) || null; }
function label(b){ return 'VMS ' + b.pos.toUpperCase().replace(/A$/, 'a') + (b.session ? '*' : ''); }
function phaseWord(b){ return b.session ? 'Event · end of each session (Fri/Sat/Sun)' : b.phase === 'event' ? 'Event period' : 'Construction / demob period'; }
function key(pos){ return PREFIX + pos; }
function rec(pos){ const r = (S.loads || {})[key(pos)]; return r && r.kind === KIND ? r : null; }
function unitsT0001(){ const u = ((S.units || {}).T0001 || {}).units; return Array.isArray(u) ? u : []; }
function defaultAsset(b){
 if (b.asset) return b.asset;
 if (b.default_board) { const u = unitsT0001().find(x => x.label === b.default_board); if (u && u.asset_no) return String(u.asset_no); }
 return '';
}
function registerOf(b){ /* the v9.13 VMS board register, where the position names a contract board */
 try { if (b.board && typeof vms913Boards === 'function' && typeof vms913Of === 'function') { const x = vms913Boards().find(q => q.key === b.board); if (x) return vms913Of(x); } } catch (e) {}
 return null;
}
function identity(b){
 const r = rec(b.pos) || {}, reg = registerOf(b) || {};
 return {asset: trim(r.asset) || trim(reg.fleet) || defaultAsset(b), rego: trim(r.rego) || trim(reg.rego) || '', co: trim(reg.co) || (b.default_board ? 'Coates' : ''), board: b.board || b.default_board || ''};
}
function position(b){
 const r = rec(b.pos);
 if (r && Number.isFinite(r.lat) && Number.isFinite(r.lon)) return {lat: r.lat, lon: r.lon, how: r.posHow || 'set on the page', by: r.posBy || r.by, at: r.posAt || r.at, acc: r.acc || null};
 return {lat: b.lat, lon: b.lon, how: b.basis, by: null, at: null, acc: null};
}
function frame(p){ try { const f = typeof frameOf === 'function' ? frameOf(p.lat, p.lon) : null; return f && f.ax >= 0.02 && f.ax <= 0.98 && f.ay >= 0.02 && f.ay <= 0.98 ? f : null; } catch (e) { return null; } }
function notes(b){ const r = rec(b.pos); return r && r.notes != null ? r.notes : (b.notes_default || ''); }
function aerial(pos, p, f){ /* a promise of the aerial close-up data URL, cached per position */
 const k = pos + '|' + (f || 0.12) + '|' + p.lat.toFixed(5) + ',' + p.lon.toFixed(5);
 if (crops[k]) return crops[k];
 const fr = frame(p);
 if (!fr || typeof cropDataUrl !== 'function') return (crops[k] = Promise.resolve(null));
 return (crops[k] = cropDataUrl(fr, f || 0.12, 900).catch(() => null));
}

/* ------------------------------------------------------------------------------------------------------ the record */
function write(pos, patch, what){
 if (!board(pos)) return false;
 if (!mayWrite(what || 'the VMS board')) return false;
 const who = whoAmI(); if (!who) return false;
 const k = key(pos);
 if (typeof docIdOf === 'function' && Object.keys(S.loads || {}).some(x => x !== k && docIdOf(x) === docIdOf(k))) { flash('This VMS record needs a unique document identity.'); return false; }
 S.loads = S.loads || {};
 const old = S.loads[k];
 if (old && old.kind !== KIND) { flash('That record key belongs to something else; nothing written.'); return false; }
 S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, pos, by: who, at: new Date().toISOString()});
 stampIt('loads', k, who); save(); if (typeof bump === 'function') bump();
 return true;
}
function setPosition(pos, lat, lon, how, acc){
 lat = Number(lat); lon = Number(lon);
 if (!(lat <= -27 && lat >= -29 && lon >= 153 && lon <= 154)) { flash('That is not a Gold Coast position (lat -27.9…, lon 153.4…).'); return false; }
 const who = (S.operator || '').trim();
 return write(pos, {lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, posHow: how, posBy: who, posAt: new Date().toISOString(), acc: acc == null ? null : Math.round(acc)}, 'the board’s position');
}
function pinHere(pos){
 if (!navigator.geolocation) { flash('This device has no location service.'); return; }
 if (!mayWrite('the board’s position')) return;
 flash('Getting this phone’s position…');
 navigator.geolocation.getCurrentPosition(g => { if (setPosition(pos, g.coords.latitude, g.coords.longitude, 'pinned on site with this phone (±' + Math.round(g.coords.accuracy) + ' m)', g.coords.accuracy)) render(); },
  e => flash('No position from this phone: ' + (e && e.message || 'refused')), {enableHighAccuracy: true, timeout: 15000, maximumAge: 0});
}

/* --------------------------------------------------------------------------------------------------------- the tab */
function nav(p){ return typeof navUrl === 'function' ? navUrl({lat: p.lat, lon: p.lon}) : 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat.toFixed(6) + ',' + p.lon.toFixed(6); }
function qr(p, cell){ return typeof qrSvg === 'function' ? qrSvg(nav(p), cell || 3) : ''; }
function shown(){ return boards().filter(b => filter === 'all' || (filter === 'construction' && b.phase === 'construction') || (filter === 'event' && b.phase === 'event' && !b.session) || (filter === 'session' && b.session)); }
function card(b){
 const p = position(b), id = identity(b), r = rec(b.pos) || {}, fr = frame(p);
 const msgs = (b.messages || []).map(m => `<div class="v1024-msg"><b>${esc(m.name)}</b> <span>${esc(m.when)}</span><br><i>${esc(m.face)}</i><br><code>${m.lines.map(esc).join(' &nbsp;·&nbsp; ')}</code></div>`).join('');
 return `<section class="card v1024-card${r.inPlace ? ' done' : ''}" data-pos="${esc(b.pos)}">
 <header class="v1024-h"><span class="v1024-no">${esc(label(b))}</span><div><h3>${esc(b.title)}</h3><p class="sub">${esc(phaseWord(b))}${b.from ? ' · moved from VMS ' + esc(b.from) : ''}${b.moves_to ? ' · moves to VMS ' + esc(b.moves_to) + ' for the event' : ''}${b.stored ? ' · stored: ' + esc(b.stored) : ''}${b.roadtek ? ' · Roadtek removes and reinstalls it Fri/Sat/Sun' : ''}${b.dates ? ' · ' + esc(b.dates) : ''}</p></div></header>
 <div class="v1024-pics">
  <figure class="v1024-air" data-air="${esc(b.pos)}">${fr ? '<div class="v1024-wait">satellite close-up loading…</div>' : '<div class="v1024-wait">outside the page’s aerial; the plan’s map below</div>'}<figcaption>${fr ? 'Satellite (QLD 2022 aerial) · about 190 m across · orange ring = the pin' : 'No aerial cover here'}</figcaption></figure>
  <figure class="v1024-plan">${IMG[b.pos] ? `<img src="${IMG[b.pos]}" alt="iEDM plan crop for ${esc(label(b))}">` : '<div class="v1024-wait">plan crop not built</div>'}<figcaption>iEDM VMS plan, page ${esc(b.page)} · red dot = position, photo = the spot</figcaption></figure>
 </div>
 <div class="v1024-nav"><div class="v1024-qr">${qr(p, 3)}</div><div><b>Pin</b> ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}<br><small>${esc(p.how)}${p.by ? ' · ' + esc(p.by) + ' · ' + esc(when(p.at)) : ''}</small><br><a class="btn" href="${esc(nav(p))}" target="_blank" rel="noopener" data-ro>Navigate</a> <button type="button" class="btn" data-v1024-print="${esc(b.pos)}" data-ro>Print this sheet</button></div></div>
 ${msgs}
 <div class="v1024-grid">
  <label><span>Board</span><b>${esc(id.board || '—')}${id.co ? ' · ' + esc(id.co) : ''}</b></label>
  <label><span>Asset number</span><input type="text" class="v1024-txt" data-v1024="text" data-pos="${esc(b.pos)}" data-f="asset" value="${esc(id.asset)}" placeholder="Coates asset no."></label>
  <label><span>Number plate</span><input type="text" class="v1024-txt" data-v1024="text" data-pos="${esc(b.pos)}" data-f="rego" value="${esc(id.rego)}" placeholder="added later"></label>
  <label><span>Position (lat, lon)</span><input type="text" class="v1024-txt" data-v1024="latlon" data-pos="${esc(b.pos)}" value="${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}"></label>
  <label class="v1024-wide"><span>Notes · special instructions</span><textarea class="v1024-txt" rows="2" data-v1024="text" data-pos="${esc(b.pos)}" data-f="notes" placeholder="anything the crew placing it must know">${esc(notes(b))}</textarea></label>
  <label class="v1024-tick"><input type="checkbox" data-v1024="inplace" data-pos="${esc(b.pos)}"${r.inPlace ? ' checked' : ''}><span>In place as drawn${r.inPlace ? ` <small>${esc(r.by)} · ${esc(when(r.at))}</small>` : ''}</span></label>
  <button type="button" class="btn v1024-pin" data-v1024-pin="${esc(b.pos)}">Pin here with this phone</button>
 </div>
 <p class="v1024-basis"><small>Position basis: ${esc(b.basis)}.${b.board_basis ? ' Board: ' + esc(b.board_basis) + '.' : ''}</small></p>
 </section>`;
}
function when(iso){ if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? String(iso) : d.toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}); }
function render(){
 const pane = document.getElementById('pane-vms'); if (!pane) return;
 const src = PLAN.source || {}, win = PLAN.windows || {};
 const counts = {all: boards().length, construction: boards().filter(b => b.phase === 'construction').length, event: boards().filter(b => b.phase === 'event' && !b.session).length, session: boards().filter(b => b.session).length};
 const placed = boards().filter(b => (rec(b.pos) || {}).inPlace).length;
 pane.innerHTML = paneHeadingHtml('vms') + `
<section class="card nosfold v1024-head"><h3>VMS boards · the plan, board by board</h3>
 <p class="sub">${esc(src.plan || '')}. ${esc(win.construction || '')}. ${esc(win.event || '')}. ${esc(win.track || '')}.</p>
 <details class="v1024-src"><summary>What has changed, in the words it came in</summary><ul>${(src.emails || []).map(e => '<li>' + esc(e) + '</li>').join('')}</ul><p class="sub">${esc(src.positions || '')}</p></details>
 <div class="v1024-filters">${[['all', 'All'], ['construction', 'Construction / demob'], ['event', 'Event'], ['session', 'End of session (13–17)']].map(([k, w]) => `<button type="button" class="btn${filter === k ? ' primary' : ''}" data-v1024-filter="${k}" data-ro>${w} <small>${counts[k]}</small></button>`).join('')}
 <button type="button" class="btn" data-v1024-print="all" data-ro>Print the whole plan (A4 pack)</button></div>
 <p class="sub">${placed} of ${counts.all} positions ticked in place. Each line saves on its own; a pin taken on site or a position typed on the line overrides the plan.</p></section>
<div class="v1024-list">${shown().map(card).join('')}</div>`;
 bind(pane); loadAerials(pane);
}
function loadAerials(pane){
 pane.querySelectorAll('[data-air]').forEach(fig => {
  const b = board(fig.dataset.air); if (!b) return; const p = position(b); if (!frame(p)) return;
  aerial(b.pos, p, 0.12).then(url => { if (!url || !fig.isConnected) return; const w = fig.querySelector('.v1024-wait'); if (w) w.outerHTML = `<img src="${url}" alt="satellite close-up ${esc(label(b))}">`; });
 });
}
function bind(pane){
 pane.onclick = e => {
  const b = e.target.closest('[data-v1024-filter],[data-v1024-print],[data-v1024-pin]'); if (!b) return;
  if (b.dataset.v1024Filter) { filter = b.dataset.v1024Filter; render(); return; }
  if (b.dataset.v1024Print) { location.hash = '#print/vms/' + b.dataset.v1024Print; return; }
  if (b.dataset.v1024Pin) { pinHere(b.dataset.v1024Pin); }
 };
 pane.onchange = e => {
  const el = e.target.closest('[data-v1024]'); if (!el) return;
  const pos = el.dataset.pos, t = el.dataset.v1024; let ok = false;
  if (t === 'text') ok = write(pos, {[el.dataset.f]: trim(el.value)}, 'the board’s ' + (el.dataset.f === 'rego' ? 'number plate' : el.dataset.f === 'asset' ? 'asset number' : 'notes'));
  else if (t === 'latlon') { const m = trim(el.value).match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/); ok = m ? setPosition(pos, m[1], m[2], 'typed on the page') : (flash('Type the position as lat, lon (e.g. -27.9935, 153.4311).'), false); }
  else if (t === 'inplace') ok = write(pos, {inPlace: !!el.checked}, 'the in-place tick');
  if (!ok) { render(); return; }
  if (t !== 'text') render();
 };
}

/* ------------------------------------------------------------------------------------------------------- the sheets */
const CSS = `
#dayprint .ps7.v1024{font-size:7.6pt}
#dayprint .ps7.v1024 .psh-m h1{font-size:12.5pt}
#dayprint .ps7.v1024 .v-no{display:inline-block;background:#f07c2a;color:#fff;font-weight:800;font-size:14pt;padding:2px 10px;border-radius:3px;letter-spacing:.5px}
#dayprint .ps7.v1024 .v-title{font-size:10.5pt;font-weight:700;margin:3px 0 1px}
#dayprint .ps7.v1024 .v-sub{font-size:7.2pt;color:#3b4246;margin:0 0 3px}
#dayprint .ps7.v1024 .v-pics{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:4mm;align-items:start}
#dayprint .ps7.v1024 .v-pics figure{margin:0;border:1px solid #c9cfd2}
#dayprint .ps7.v1024 .v-pics img{display:block;width:100%;height:auto}
#dayprint .ps7.v1024 .v-pics figcaption{font-size:6.2pt;color:#3b4246;padding:1.5px 4px;background:#f3f4f5;border-top:1px solid #c9cfd2}
#dayprint .ps7.v1024 .v-none{min-height:60mm;display:flex;align-items:center;justify-content:center;color:#6b757a;font-size:7pt;background:#f7f8f8}
#dayprint .ps7.v1024 .v-nav{display:grid;grid-template-columns:34mm 1fr 1fr;gap:4mm;margin:3mm 0 2mm;align-items:start}
#dayprint .ps7.v1024 .v-nav svg{width:34mm;height:34mm;display:block}
#dayprint .ps7.v1024 .v-nav .v-k{font-size:7.2pt}
#dayprint .ps7.v1024 .v-nav .v-k b{display:block;font-size:6.4pt;letter-spacing:.8px;color:#b4521a;margin-top:2px}
#dayprint .ps7.v1024 .v-nav .v-k code{font-size:8.5pt;font-weight:700}
#dayprint .ps7.v1024 .v-msg{border:1px solid #f07c2a;border-left:3px solid #f07c2a;background:#fff8f3;padding:2px 6px;margin:2px 0;font-size:7.2pt}
#dayprint .ps7.v1024 .v-msg code{display:block;font-size:10pt;font-weight:800;letter-spacing:.5px;margin-top:1px}
#dayprint .ps7.v1024 .v-id{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:2mm 0}
#dayprint .ps7.v1024 .v-id div{border:1px solid #15181a;padding:2px 5px;min-height:11mm}
#dayprint .ps7.v1024 .v-id div b{display:block;font-size:6.2pt;letter-spacing:.7px;color:#3b4246}
#dayprint .ps7.v1024 .v-id div span{display:block;font-size:9.5pt;font-weight:700;margin-top:1px;min-height:5mm}
#dayprint .ps7.v1024 .v-notes{border:1px solid #15181a;padding:2px 5px;min-height:16mm;font-size:7.4pt;white-space:pre-wrap}
#dayprint .ps7.v1024 .v-notes b{display:block;font-size:6.2pt;letter-spacing:.7px;color:#3b4246}
#dayprint .ps7.v1024 .v-notes p{margin:0;border-bottom:1px dotted #9aa3a8;min-height:4mm}
#dayprint .ps7.v1024 .v-sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;margin-top:2mm}
#dayprint .ps7.v1024 .v-sign div{border:1px solid #15181a;padding:2px 5px;min-height:11mm;font-size:6.6pt}
#dayprint .ps7.v1024 .v-sign div b{display:block;font-size:6.2pt;letter-spacing:.7px;color:#3b4246}
#dayprint .ps7.v1024 .v-sign div span{display:block;border-bottom:1px solid #9aa3a8;min-height:4.5mm;margin-top:3px}
#dayprint .ps7.v1024 .issued{margin:2mm 0 0;border:1px solid #15181a;padding:3px 6px;font-size:7pt}
#dayprint .ps7.v1024.brk{page-break-before:always}
`;
async function sheetHtml(pos, o){
 const b = board(pos); if (!b) return '';
 const p = position(b), id = identity(b), r = rec(b.pos) || {}, fr = frame(p);
 const air = fr ? await aerial(b.pos, p, 0.12) : null;
 const msgs = (b.messages || []).map(m => `<div class="v-msg"><b>${esc(m.name)}</b> · ${esc(m.when)} · <i>${esc(m.face)}</i><code>${m.lines.map(esc).join('  ·  ')}</code></div>`).join('');
 const noteText = notes(b);
 return `<section class="ps ps7 fen v1024${o && o.brk ? ' brk' : ''}">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">VMS PLAN — BOARD SHEET · ${esc(FORM)}</span><h1>${esc(label(b))} · ${esc(phaseWord(b))}</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="v-title"><span class="v-no">${esc(label(b))}</span> &nbsp;${esc(b.title)}</p>
 <p class="v-sub">${esc(phaseWord(b))}${b.from ? ' · moved from VMS ' + esc(b.from) : ''}${b.moves_to ? ' · moves to VMS ' + esc(b.moves_to) + ' for the event' : ''}${b.stored ? ' · stored: ' + esc(b.stored) : ''}${b.roadtek ? ' · Roadtek removes and reinstalls it Fri/Sat/Sun' : ''}${b.dates ? ' · ' + esc(b.dates) : ''} · iEDM plan page ${esc(b.page)}</p>
 <div class="v-pics">
  <figure>${air ? `<img src="${air}" alt="satellite close-up">` : '<div class="v-none">Outside the page’s aerial cover — use the plan crop and the QR</div>'}<figcaption>${air ? 'Satellite · QLD Government 2022 aerial · about 190 m across · orange ring and cross = the pin' : 'No aerial on the page for this spot'}</figcaption></figure>
  <figure>${IMG[b.pos] ? `<img src="${IMG[b.pos]}" alt="iEDM plan crop">` : '<div class="v-none">plan crop not built</div>'}<figcaption>iEDM VMS plan · red dot = the position · photo = the spot</figcaption></figure>
 </div>
 <div class="v-nav"><div>${qr(p, 4)}</div>
  <div class="v-k"><b>SCAN TO NAVIGATE</b>Google Maps driving directions to the pin<b>PIN</b><code>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}</code><b>POSITION BASIS</b>${esc(p.how)}${p.by ? ' · ' + esc(p.by) + ' ' + esc(when(p.at)) : ''}</div>
  <div class="v-k"><b>WHEN</b>${esc(b.session ? (PLAN.windows || {}).track || '' : b.phase === 'event' ? (PLAN.windows || {}).event || '' : (PLAN.windows || {}).construction || '')}${b.stored ? '<b>STORED BETWEEN SESSIONS</b>' + esc(b.stored) : ''}${b.from ? '<b>COMES FROM</b>VMS ' + esc(b.from) + ' (construction position)' : ''}${b.moves_to ? '<b>GOES TO</b>VMS ' + esc(b.moves_to) + ' for the event' : ''}</div></div>
 ${msgs}
 <div class="v-id"><div><b>BOARD${b.board_basis ? ' · BY POSITION' : ''}</b><span>${esc(id.board || '')}${id.co ? ' · ' + esc(id.co) : ''}</span></div><div><b>ASSET NUMBER</b><span>${esc(id.asset)}</span></div><div><b>NUMBER PLATE</b><span>${esc(id.rego)}</span></div><div><b>IN PLACE AS DRAWN</b><span>${r.inPlace ? esc(r.by) + ' · ' + esc(when(r.at)) : ''}</span></div></div>
 <div class="v-notes"><b>NOTES · SPECIAL INSTRUCTIONS</b>${noteText ? esc(noteText) : ''}<p></p><p></p></div>
 <div class="v-sign"><div><b>PLACED BY</b><span></span></div><div><b>DATE · TIME</b><span></span></div><div><b>CHECKED BY THE PROJECT MANAGER</b><span></span></div></div>
 <p class="issued"><b>Issued:</b> ${esc(author())}, ${esc(authorTitle())} · ${esc(ISSUED)} · positions from iEDM’s VMS001-26003-01 and the page’s D025 register; the pin on this sheet is the position of record until a pin is taken on site.</p>
 </section>`;
}
async function sheetsHtml(which){
 const list = which === 'all' ? boards() : [board(which)].filter(Boolean);
 const parts = [];
 for (let i = 0; i < list.length; i++) parts.push(await sheetHtml(list[i].pos, {brk: i > 0}));
 return parts.join('\n');
}
function print(which, o){
 if (which !== 'all' && !board(which)) { flash('That is not a VMS position on the plan.'); return; }
 supplierPrint841Dismiss();
 const token = timeline841PrintStart();
 const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
 wrap.innerHTML = '<section class="ps ps7 v1024"><p>Preparing the sheet…</p></section>'; wrap.classList.add('ps7wrap');
 const st = document.createElement('style'); st.id = 'dayPage';
 st.textContent = '@page{size:A4 portrait;margin:7mm}\n#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n' + PS7_CSS + CSS;
 document.head.appendChild(st);
 document.body.classList.add('printing-day');
 const done = () => { st.remove(); if (!timeline841PrintCurrent(token)) return; wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };
 if (o && o.keep) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});
 sheetsHtml(which).then(html => {
  if (!timeline841PrintCurrent(token) || document.getElementById('dayprint') !== wrap) return;
  wrap.innerHTML = html;
  wrap.querySelectorAll('.ps7').forEach(sec => { /* each sheet one A4 page: measured, brought in by no more than 0.8 */
   const keep = wrap.getAttribute('style'), ruler = document.createElement('div');
   wrap.setAttribute('style', 'display:block;position:absolute;left:-10000px;top:0;visibility:hidden');
   ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
   const avail = ruler.getBoundingClientRect().height, h = sec.getBoundingClientRect().height; ruler.remove();
   if (keep === null) wrap.removeAttribute('style'); else wrap.setAttribute('style', keep);
   if (h > avail * 0.985) sec.style.zoom = String(Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000));
  });
  if (o && o.keep) { try { dpBarSay((DP_MAIL.vms || 'VMS board sheet') + ' · ' + (which === 'all' ? boards().length + ' pages' : label(board(which)) + ' · 1 page'), true); } catch (e) {} if (typeof dpZoomFit === 'function') dpZoomFit(); }
  else (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { if (timeline841PrintCurrent(token)) window.print(); });
 });
}

W.VMS1024 = {KIND, PREFIX, FORM, boards, board, label, rec, write, setPosition, position, identity, notes, frame, aerial, sheetHtml, sheetsHtml, print, render, CSS, get filter(){ return filter; }, set filter(v){ filter = v; }};
W.renderVms1024 = render;
})(window);
