/* Author: Andrew Fisher. Fence closures (v11.33): the race-weekend fence closures for the fencing crew. Each race morning the
   Armco gates and the circuit close at 07:00 (the fence closure); the ten closure points marked on the plan are closed in
   the morning window written on it (Fri 7-8am, Sat and Sun 7-7.25am) and opened again in the evening window after the track
   opening lap (Fri 6-7pm, Sat 5.53-7pm, Sun 5.15-7pm). The numbers circled on the plan are NOT the order the points close in
   (Andrew, 23 Oct 2026: "this is also not a order it goes in"); the crew works them as the day needs. Each day keeps its own
   record on the shared loads collection, one document per point and tick, written through the page's own write path on the
   edit link only; the sheet prints on the day-document print path (#print/fenceclose/<date>). Nothing is pre-ticked. */
(function (W) {
'use strict';
const KIND = 'fenceclose1133', PREFIX = 'fenceclose1133/', FORM = 'GC500-RS-FC-01 v1', ISSUED = '23 Oct 2026';
const WORD = 'Andrew Fisher, 23 Oct 2026';
/* Supercars "Track access details", as issued (the same table the VMS removals tab carries) */
const ACCESS = {
 '2026-10-23': {closure: '07:00', vehiclesOff: '07:45', closingLap: '08:15', patrons: '09:30', openingLap: '17:00', accredited: '18:00', concert: '20:30', macPark: '21:30', am: '7-8am', pm: '6-7pm'},
 '2026-10-24': {closure: '07:00', vehiclesOff: '07:45', closingLap: '07:50', patrons: '08:00', openingLap: '17:20', accredited: '18:00', concert: '20:30', macPark: '21:30', am: '7-7.25am', pm: '5.53pm-7pm'},
 '2026-10-25': {closure: '07:00', vehiclesOff: '07:45', closingLap: '07:50', patrons: '08:00', openingLap: '17:00', accredited: '17:40', macPark: '19:00', am: '7-7.25am', pm: '5.15-7pm'}};
const DAYS = [
 {iso: '2026-10-23', label: 'Friday'},
 {iso: '2026-10-24', label: 'Saturday'},
 {iso: '2026-10-25', label: 'Sunday'}];
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trim = x => String(x == null ? '' : x).trim();
const author = () => (DATA.brand && DATA.brand.author) || 'Andrew Fisher';
const authorTitle = () => { const p = (((DATA.team || {}).people) || []).find(x => x.name === author()); return (p && p.title) || 'Shutdown Manager'; };
let current = null; /* the day shown on the tab */

/* ----------------------------------------------------------------------------------------------- the closure points */
function points(){
 const clo = DATA.closures || {}, marks = Array.isArray(clo.marks) ? clo.marks : [];
 return marks.map(m => ({id: String(m.order) + '-' + String(m.colour || '').toLowerCase(), n: Number(m.order), colour: String(m.colour || '').toLowerCase(), where: trim(m.where_as_read)}))
  .sort((a, b) => a.n - b.n || a.colour.localeCompare(b.colour));
}
function windowsOf(iso){
 const clo = DATA.closures || {}, w = (clo.windows_as_written || []).find(x => x.date === iso), a = ACCESS[iso] || {};
 return {am: (w && w.windows && w.windows[0]) || a.am || '', pm: (w && w.windows && w.windows[1]) || a.pm || ''};
}

/* ------------------------------------------------------------------------------------------------------ the record */
function key(iso, part, id){ return PREFIX + iso + '/' + part + (id == null ? '' : '/' + id); }
function rec(iso, part, id){ const r = (S.loads || {})[key(iso, part, id)]; return r && r.kind === KIND ? r : null; }
function day(iso){ return DAYS.find(d => d.iso === iso) || null; }
function write(iso, part, id, patch, what){
 if (!day(iso)) return false;
 if (!mayWrite(what || 'the fence closures sheet')) return false;
 const who = whoAmI(); if (!who) return false;
 const k = key(iso, part, id);
 if (typeof docIdOf === 'function' && Object.keys(S.loads || {}).some(x => x !== k && docIdOf(x) === docIdOf(k))) { flash('This closures record needs a unique document identity.'); return false; }
 S.loads = S.loads || {};
 const old = S.loads[k];
 if (old && old.kind !== KIND) { flash('That record key belongs to something else; nothing written.'); return false; }
 S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, day: iso, part, id: id == null ? null : String(id), by: who, at: new Date().toISOString()});
 stampIt('loads', k, who); save(); if (typeof bump === 'function') bump();
 return true;
}
function state(iso, id){ return {closed: rec(iso, 'closed', id) || {}, opened: rec(iso, 'opened', id) || {}, note: rec(iso, 'note', id) || {}}; }
function summary(iso){
 const ps = points(), st = ps.map(p => state(iso, p.id));
 return {points: ps.length, closed: st.filter(s => s.closed.done).length, opened: st.filter(s => s.opened.done).length, sign: rec(iso, 'signoff') || {}, audit: rec(iso, 'audit') || {}};
}
function when(iso){ const d = new Date(iso); return isNaN(d) ? String(iso || '') : d.toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}); }
function hhmm(iso){ const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, hour: '2-digit', minute: '2-digit'}); }

/* ------------------------------------------------------------------------------------------------- the day's times */
function timeline(d){
 const a = ACCESS[d.iso] || {}, w = windowsOf(d.iso), out = [];
 if (a.closure) out.push({t: a.closure, w: 'Fence closure: Armco gates and circuit closed', hard: true});
 if (w.am) out.push({t: w.am, w: 'Closing window written on the plan: the closure points go closed', us: true});
 if (a.vehiclesOff) out.push({t: a.vehiclesOff, w: 'All vehicles off the circuit (BSF barrier crew excluded)', hard: true});
 if (a.closingLap) out.push({t: a.closingLap, w: 'Track closing lap'});
 if (a.patrons) out.push({t: a.patrons, w: 'Patron gates open'});
 if (a.openingLap) out.push({t: a.openingLap, w: 'Track opening lap and the Armco gates open'});
 if (w.pm) out.push({t: w.pm, w: 'Opening window written on the plan: the closure points go open', us: true});
 if (a.accredited) out.push({t: a.accredited, w: 'Circuit open to accredited vehicles'});
 if (a.concert) out.push({t: a.concert, w: 'Concert finish'});
 if (a.macPark) out.push({t: a.macPark, w: 'Contractor access to Mac Park permitted'});
 return out;
}

/* ----------------------------------------------------------------------------------------------------------- the tab */
function defaultDay(){
 if (current && day(current)) return current;
 const now = new Date(Date.now() + 10 * 3600 * 1000), today = now.toISOString().slice(0, 10);
 const next = DAYS.find(d => d.iso >= today);
 return (next || DAYS[DAYS.length - 1]).iso;
}
function box(checked, attrs){ return '<input type="checkbox" class="f1133-tick" ' + attrs + (checked ? ' checked' : '') + '>'; }
function stamp(r){ return r && r.at ? `<small>${esc(r.by)} · ${esc(when(r.at))}</small>` : ''; }
function dot(colour){ return `<i class="clodot clo-${esc(colour)}" aria-hidden="true"></i>`; }
function render(){
 const pane = document.getElementById('pane-fenceclose'); if (!pane) return;
 const iso = defaultDay(); current = iso;
 const d = day(iso), ps = points(), sm = summary(iso), w = windowsOf(iso), clo = DATA.closures || {};
 const chooser = DAYS.map(x => `<button type="button" class="btn${x.iso === iso ? ' primary' : ''}" data-f1133-day="${x.iso}" data-ro>${esc(x.label)}<small>${esc(fmtDate(x.iso))}</small></button>`).join('');
 const tl = timeline(d).map(l => `<li class="${l.hard ? 'hard' : l.us ? 'us' : ''}"><i>${esc(l.t)}</i><span>${esc(l.w)}</span></li>`).join('');
 const rows = ps.length ? ps.map(p => { const s = state(iso, p.id), done = s.closed.done && s.opened.done;
  return `<div class="f1133-point${done ? ' done' : ''}" data-id="${esc(p.id)}">
 <div class="f1133-p"><b>${dot(p.colour)}${esc(String(p.n))} <span class="f1133-col">${esc(p.colour)}</span></b><span>${esc(p.where)}</span></div>
 <label class="f1133-t"><span>Closed <small>${esc(w.am)}</small></span>${box(s.closed.done, `data-f1133="closed" data-id="${esc(p.id)}"`)}${stamp(s.closed.done ? s.closed : null)}</label>
 <label class="f1133-t"><span>Opened <small>${esc(w.pm)}</small></span>${box(s.opened.done, `data-f1133="opened" data-id="${esc(p.id)}"`)}${stamp(s.opened.done ? s.opened : null)}</label>
 <label class="f1133-n"><span>Note</span><input type="text" class="f1133-txt" data-f1133="note" data-id="${esc(p.id)}" value="${esc(s.note.text)}" placeholder="who, what was found, anything in the way"></label></div>`; }).join('')
  : '<p class="sub">The closures record is not on this page, so the points cannot be listed.</p>';
 const sign = sm.sign, audit = sm.audit;
 pane.innerHTML = paneHeadingHtml('fenceclose') + `
<section class="card nosfold f1133-head"><h3>Fence closures · race weekend</h3>
 <p class="sub">Each race morning the Armco gates and the circuit close at 07:00: the <b>fence closure</b>. The ten closure points marked on the plan go closed in the morning window written on it and open again in the evening window after the track opening lap. <b>The numbers circled on the plan are not the order they close in</b> (${esc(WORD)}); the crew works them as the day needs. The plan as it was marked is on the Fencing tab.</p>
 <div class="f1133-days">${chooser}</div></section>
<section class="card f1133-day"><h3>${esc(d.label)} · ${esc(fmtDate(iso))} <small>closed ${esc(w.am)} · open ${esc(w.pm)}</small></h3>
 <ul class="f1133-tl">${tl}</ul>
 <div class="f1133-sum"><span><b>${sm.closed}</b>/${sm.points} closed</span><span><b>${sm.opened}</b>/${sm.points} opened</span></div>
 <div class="f1133-actions"><button type="button" class="btn" data-f1133-print="${iso}" data-ro>Print closures sheet / Save as PDF</button><button type="button" class="btn" data-f1133-go="fencing" data-ro>Open Fencing</button><button type="button" class="btn" data-f1133-go="map" data-ro>Open the Map explorer</button></div></section>
<section class="card f1133-points"><h3>Closure points · as marked on the plan</h3>
 <p class="sub">Numbered and coloured as on the plan; the number is not the order. Tick each point as it is closed in the morning and again as it is opened in the evening. Each tick saves on its own with the time.</p>
 ${rows}</section>
<section class="card f1133-sign"><h3>Sign-off · ${esc(d.label)}</h3>
 <div class="f1133-signgrid">
 <label><span>Crew</span><input type="text" class="f1133-txt" data-f1133="sign-text" data-f="crew" value="${esc(sign.crew)}" placeholder="who closed and opened"></label>
 <label><span>Notes</span><input type="text" class="f1133-txt" data-f1133="sign-text" data-f="notes" value="${esc(sign.notes)}" placeholder="anything to carry to the next day"></label></div>
 <label class="f1133-t wide">${box(sign.signed, 'data-f1133="signoff"')}<span>Every closure point was closed by the fence closure and opened again in the evening window</span>${stamp(sign.signed ? sign : null)}</label>
 <label class="f1133-t wide">${box(audit.audited, 'data-f1133="audit"')}<span>Audited by the project manager</span>${stamp(audit.audited ? audit : null)}</label>
 <p class="sub">Closures sheet form ${esc(FORM)}, issued and signed by ${esc(author())}, ${esc(authorTitle())}, ${esc(ISSUED)}. ${esc(clo.windows_note || '')}</p></section>`;
 bind(pane);
}
function bind(pane){
 pane.onclick = e => {
  const b = e.target.closest('[data-f1133-day],[data-f1133-print],[data-f1133-go]'); if (!b) return;
  if (b.dataset.f1133Day) { current = b.dataset.f1133Day; render(); return; }
  if (b.dataset.f1133Print) { location.hash = '#print/fenceclose/' + b.dataset.f1133Print; return; }
  if (b.dataset.f1133Go) { go(b.dataset.f1133Go); }
 };
 pane.onchange = e => {
  const el = e.target.closest('[data-f1133]'); if (!el) return;
  const iso = current, t = el.dataset.f1133;
  let ok = false;
  if (t === 'closed') ok = write(iso, 'closed', el.dataset.id, {done: !!el.checked}, 'the point’s closed tick');
  else if (t === 'opened') ok = write(iso, 'opened', el.dataset.id, {done: !!el.checked}, 'the point’s opened tick');
  else if (t === 'note') ok = write(iso, 'note', el.dataset.id, {text: trim(el.value)}, 'the point’s note');
  else if (t === 'sign-text') ok = write(iso, 'signoff', null, {[el.dataset.f]: trim(el.value)}, 'the sign-off');
  else if (t === 'signoff') ok = write(iso, 'signoff', null, {signed: !!el.checked}, 'the sign-off');
  else if (t === 'audit') ok = write(iso, 'audit', null, {audited: !!el.checked}, 'the audit');
  if (!ok) { render(); return; } /* a refused write puts the control back as the record has it */
  if (t !== 'note' && t !== 'sign-text') render();
 };
}

/* ------------------------------------------------------------------------------------------------------- the sheet */
const CSS = `
#dayprint .ps7.f1133 table.f1133-t{width:100%!important;min-width:0!important;table-layout:fixed;border-collapse:collapse;font-size:7.2pt;margin:0}
#dayprint .ps7.f1133 table.f1133-t th{font-weight:700;text-align:left;border-bottom:1px solid #15181a;padding:2px 3px;font-size:6pt;letter-spacing:.4px}
#dayprint .ps7.f1133 table.f1133-t td{border-bottom:1px solid #d9dde0;padding:3px 3px;vertical-align:top}
#dayprint .ps7.f1133 table.f1133-t td.c{text-align:center}
#dayprint .ps7.f1133 table.f1133-t td.w{color:#3b4246}
#dayprint .ps7.f1133 .cd{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:3px;vertical-align:middle;border:1px solid #15181a}
#dayprint .ps7.f1133 .cd.black{background:#15181a}.cd.orange{background:#e07a1f}#dayprint .ps7.f1133 .cd.teal{background:#2a9d8f}#dayprint .ps7.f1133 .cd.pink{background:#d3559a}
#dayprint .ps7.f1133 .bx{width:8px;height:8px;border:1px solid #6b757a;display:inline-block;vertical-align:middle;position:relative}
#dayprint .ps7.f1133 .bx.checked{background:#15181a;border-color:#15181a}
#dayprint .ps7.f1133 .bx.checked::after{content:"\\2713";color:#fff;font-size:7pt;position:absolute;left:.8px;top:-1.6px}
#dayprint .ps7.f1133 .tm{display:inline-block;min-width:11mm;border-bottom:1px solid #9aa3a8;margin-left:3px;font-size:6.8pt;text-align:center}
#dayprint .ps7.f1133 ul.tl{list-style:none;margin:0;padding:0;columns:2;column-gap:8mm;font-size:7pt}
#dayprint .ps7.f1133 ul.tl li{display:flex;gap:5px;padding:1px 0;break-inside:avoid}
#dayprint .ps7.f1133 ul.tl li i{font-style:normal;font-weight:700;min-width:17mm}
#dayprint .ps7.f1133 ul.tl li.hard i{color:#b4521a}
#dayprint .ps7.f1133 ul.tl li.us{background:#f1f3f4}
#dayprint .ps7.f1133 .notes{border:1px solid #d9dde0;min-height:12mm;padding:2px 4px;font-size:6.8pt}
#dayprint .ps7.f1133 .notes p{margin:0;border-bottom:1px dotted #9aa3a8;min-height:3.6mm}
#dayprint .ps7.f1133 .sign{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:2px}
#dayprint .ps7.f1133 .sign div{border:1px solid #15181a;padding:3px 6px;font-size:6.8pt;min-height:13mm}
#dayprint .ps7.f1133 .sign div b{display:block;font-size:6.2pt;letter-spacing:.6px;color:#3b4246}
#dayprint .ps7.f1133 .sign div span{display:block;border-bottom:1px solid #9aa3a8;min-height:4.2mm;margin-top:2px}
#dayprint .ps7.f1133 .issued{margin:3px 0 0;border:1px solid #15181a;padding:3px 6px;font-size:7.2pt}
`;
function pbox(on){ return '<span class="bx' + (on ? ' checked' : '') + '"></span>'; }
function sheetHtml(iso, o){
 o = o || {}; const blank = !!o.blank, d = day(iso); if (!d) return '';
 const ps = points(), w = windowsOf(iso), st = id => blank ? {closed: {}, opened: {}, note: {}} : state(iso, id), sign = blank ? {} : (rec(iso, 'signoff') || {}), audit = blank ? {} : (rec(iso, 'audit') || {});
 const rows = ps.map(p => { const s = st(p.id);
  return `<tr><td><span class="cd ${esc(p.colour)}"></span><b>${esc(String(p.n))}</b> <span class="w">${esc(p.colour)}</span></td><td class="w">${esc(p.where)}</td><td class="c">${pbox(s.closed.done)}<span class="tm">${s.closed.done ? esc(hhmm(s.closed.at)) : ''}</span></td><td class="c">${pbox(s.opened.done)}<span class="tm">${s.opened.done ? esc(hhmm(s.opened.at)) : ''}</span></td><td class="w">${esc(s.note.text || '')}</td></tr>`; }).join('');
 const tl = timeline(d).map(l => `<li class="${l.hard ? 'hard' : l.us ? 'us' : ''}"><i>${esc(l.t)}</i><span>${esc(l.w)}</span></li>`).join('');
 return `<section class="ps ps7 fen f1133">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">FENCE CLOSURES — RUN SHEET · ${esc(FORM)}</span><h1>${esc(d.label)} · ${esc(fmtDate(iso))}</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede"><b>Fence closure 07:00</b> (Armco gates and circuit closed); the closure points go closed ${esc(w.am)} and open again ${esc(w.pm)}, after the track opening lap. The numbers on the plan are not the order they close in. <span class="tag">FIELD OPERATIONS</span></p>
 <h2><i>01</i> THE TIMES <em>Supercars track access details · the windows written on the plan</em></h2>
 <ul class="tl">${tl}</ul>
 <h2><i>02</i> CLOSURE POINTS <em>as marked on the plan · closed in the morning · opened in the evening</em></h2>
 <table class="f1133-t"><colgroup><col style="width:20mm"><col><col style="width:22mm"><col style="width:22mm"><col style="width:40mm"></colgroup>
 <thead><tr><th>Mark</th><th>Where</th><th class="c">Closed · time</th><th class="c">Opened · time</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
 <h2><i>03</i> NOTES <em>who · what was found · anything in the way</em></h2>
 <div class="notes"><p>${esc(sign.notes || '')}</p><p></p><p></p></div>
 <h2><i>04</i> SIGN-OFF</h2>
 <div class="sign">
 <div><b>CREW — EVERY POINT CLOSED BY THE FENCE CLOSURE AND OPENED IN THE EVENING WINDOW</b><span>${esc(sign.crew || '')}${sign.signed ? ' · signed ' + esc(when(sign.at)) : ''}</span><span></span></div>
 <div><b>AUDITED BY THE PROJECT MANAGER</b><span>${audit.audited ? esc(audit.by) + ' · ' + esc(when(audit.at)) : ''}</span><span></span></div>
 </div>
 <p class="issued"><b>Issued and signed:</b> ${esc(author())}, ${esc(authorTitle())} · ${esc(ISSUED)} · the day’s ticks, times and notes are recorded on this sheet by the fencing crew.</p>
 </section>`;
}
function print(iso, o){
 if (!day(iso)) { flash('That day is not a race day.'); return; }
 supplierPrint841Dismiss();
 const token = timeline841PrintStart();
 const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
 wrap.innerHTML = sheetHtml(iso); wrap.classList.add('ps7wrap');
 const st = document.createElement('style'); st.id = 'dayPage';
 st.textContent = '@page{size:A4 portrait;margin:7mm}\n#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n' + PS7_CSS + CSS;
 document.head.appendChild(st);
 const sec = wrap.querySelector('.ps7'), keep = wrap.getAttribute('style'), ruler = document.createElement('div');
 wrap.setAttribute('style', 'display:block;position:absolute;left:-10000px;top:0;visibility:hidden');
 ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
 const avail = ruler.getBoundingClientRect().height, h = sec ? sec.getBoundingClientRect().height : 0; ruler.remove();
 if (keep === null) wrap.removeAttribute('style'); else wrap.setAttribute('style', keep);
 if (sec && h > avail * 0.985) sec.style.zoom = String(Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000));
 document.body.classList.add('printing-day');
 const done = () => { st.remove(); if (!timeline841PrintCurrent(token)) return; wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };
 if (o && o.keep) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});
 (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { if (!timeline841PrintCurrent(token)) return; if (!(o && o.keep)) window.print(); });
}

W.FenceClose1133 = {KIND, PREFIX, FORM, ACCESS, DAYS, points, windowsOf, key, rec, write, state, summary, timeline, sheetHtml, print, render, CSS,
 get day(){ return current; }, set day(v){ current = day(v) ? v : current; }};
W.renderFenceClose1133 = render;
})(window);
