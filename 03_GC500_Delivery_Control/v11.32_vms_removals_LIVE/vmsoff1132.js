/* Author: Andrew Fisher. VMS daily removals (v11.32): the five end-of-session boards (positions 13* to 17*) go out onto the
   track after each day's track opening lap to show everyone the way out, and must be off again before the next morning's
   fence closure (the Armco gates, 07:00) with every vehicle off the circuit by 07:45. Andrew's word, 23 Oct 2026: VMS 14, 16
   and 17 can come off from 03:00; VMS 13 and 15 must come off from 06:00; VMS 16 goes behind 2 Breaker St, Main Beach.
   Each morning keeps its own record on the shared loads collection, one document per board and tick, written through the
   page's own write path (mayWrite, whoAmI, stampIt, save, bump) on the edit link only; the sheet prints on the day-document
   print path (#print/vmsoff/<date>). Nothing is pre-ticked; no cost lines. The track access times are Supercars' own
   "Track access details", as Andrew received them. */
(function (W) {
'use strict';
const KIND = 'vmsoff1132', PREFIX = 'vmsoff1132/', FORM = 'GC500-RS-VR-01 v1', ISSUED = '23 Oct 2026';
const WORD = 'Andrew Fisher, 23 Oct 2026';
/* the rule for each board: the earliest it may come off the track, and where it goes when a day spot was named */
const RULES = {
 '14': {from: '03:00'},
 '16': {from: '03:00', store: 'behind 2 Breaker St, Main Beach', storeLat: -27.9817267, storeLon: 153.42943, storeBy: WORD},
 '17': {from: '03:00'},
 '13': {from: '06:00', must: true},
 '15': {from: '06:00', must: true, storeLat: -27.990144, storeLon: 153.428562}};
/* Supercars "Track access details", as issued (Andrew, 23 Oct 2026) */
const ACCESS = {
 '2026-10-19': {opening: true, lines: [['05:00', 'Circuit closed to local traffic, one-way system; vehicles drive anti-clockwise in race direction; vehicle accreditation from the Accreditation Centre; the circuit is open 24 hours until the event days']]},
 '2026-10-23': {closure: '07:00', vehiclesOff: '07:45', closingLap: '08:15', patrons: '09:30', openingLap: '17:00', accredited: '18:00', concert: '20:30', macPark: '21:30'},
 '2026-10-24': {closure: '07:00', vehiclesOff: '07:45', closingLap: '07:50', patrons: '08:00', openingLap: '17:20', accredited: '18:00', concert: '20:30', macPark: '21:30'},
 '2026-10-25': {closure: '07:00', vehiclesOff: '07:45', closingLap: '07:50', patrons: '08:00', openingLap: '17:00', accredited: '17:40', macPark: '19:00'},
 '2026-10-26': {roadsReopen: '17:00', note: 'GC Hwy southbound carriageway remains closed between Tedder Ave and Surfers Blvd until 05:00 Tue 28 Oct'}};
const MORNINGS = [
 {iso: '2026-10-24', label: 'Saturday morning', after: 'Friday night', night: '2026-10-23'},
 {iso: '2026-10-25', label: 'Sunday morning', after: 'Saturday night', night: '2026-10-24'},
 {iso: '2026-10-26', label: 'Monday', after: 'Sunday night', night: '2026-10-25', final: true}];
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trim = x => String(x == null ? '' : x).trim();
const author = () => (DATA.brand && DATA.brand.author) || 'Andrew Fisher';
const authorTitle = () => { const p = (((DATA.team || {}).people) || []).find(x => x.name === author()); return (p && p.title) || 'Shutdown Manager'; };
const nav = (lat, lon) => 'https://www.google.com/maps/dir/?api=1&destination=' + Number(lat) + ',' + Number(lon);
let current = null; /* the morning shown on the tab */

/* ------------------------------------------------------------------------------------------------------ the boards */
function boards(){
 const v = W.VMS1024; if (!v || typeof v.boards !== 'function') return [];
 return v.boards().filter(b => b && b.session && RULES[b.pos]).map(b => {
  const p = typeof v.position === 'function' ? v.position(b) : {lat: b.lat, lon: b.lon, how: b.basis}, r = RULES[b.pos];
  const title = trim(b.title), where = trim(title.split(/\s[—-]\sinstalled/i)[0]) || title;
  return {pos: b.pos, name: 'VMS ' + b.pos, label: typeof v.label === 'function' ? v.label(b) : 'VMS ' + b.pos + '*', board: b.board || '', where,
   lat: p.lat, lon: p.lon, how: p.how || '', from: r.from, must: !!r.must, store: r.store || trim(b.stored), storeLat: r.storeLat, storeLon: r.storeLon, storeBy: r.storeBy || null};
 }).sort((a, b) => a.from.localeCompare(b.from) || Number(a.pos) - Number(b.pos));
}

/* ------------------------------------------------------------------------------------------------------ the record */
function key(iso, part, id){ return PREFIX + iso + '/' + part + (id == null ? '' : '/' + id); }
function rec(iso, part, id){ const r = (S.loads || {})[key(iso, part, id)]; return r && r.kind === KIND ? r : null; }
function morning(iso){ return MORNINGS.find(m => m.iso === iso) || null; }
function write(iso, part, id, patch, what){
 if (!morning(iso)) return false;
 if (!mayWrite(what || 'the removals sheet')) return false;
 const who = whoAmI(); if (!who) return false;
 const k = key(iso, part, id);
 if (typeof docIdOf === 'function' && Object.keys(S.loads || {}).some(x => x !== k && docIdOf(x) === docIdOf(k))) { flash('This removals record needs a unique document identity.'); return false; }
 S.loads = S.loads || {};
 const old = S.loads[k];
 if (old && old.kind !== KIND) { flash('That record key belongs to something else; nothing written.'); return false; }
 S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, morning: iso, part, id: id == null ? null : String(id), by: who, at: new Date().toISOString()});
 stampIt('loads', k, who); save(); if (typeof bump === 'function') bump();
 return true;
}
function state(iso, pos){ return {off: rec(iso, 'off', pos) || {}, out: rec(iso, 'out', pos) || {}, note: rec(iso, 'note', pos) || {}}; }
function summary(iso){
 const bs = boards(), st = bs.map(b => state(iso, b.pos)), m = morning(iso);
 return {boards: bs.length, off: st.filter(s => s.off.done).length, out: m && m.final ? null : st.filter(s => s.out.done).length, sign: rec(iso, 'signoff') || {}, audit: rec(iso, 'audit') || {}};
}
function when(iso){ const d = new Date(iso); return isNaN(d) ? String(iso || '') : d.toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}); }
function hhmm(iso){ const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, hour: '2-digit', minute: '2-digit'}); }

/* ------------------------------------------------------------------------------------------------- the day's times */
function timeline(m){
 const ev = ACCESS[m.night] || {}, am = ACCESS[m.iso] || {}, out = [];
 if (ev.openingLap) out.push({t: ev.openingLap, d: m.after.replace(' night', ''), w: 'Track opening lap and the Armco gates open: the boards go out onto the track'});
 if (ev.accredited) out.push({t: ev.accredited, d: m.after.replace(' night', ''), w: 'Circuit open to accredited vehicles'});
 if (ev.macPark) out.push({t: ev.macPark, d: m.after.replace(' night', ''), w: 'Contractor access to Mac Park permitted'});
 out.push({t: '03:00', d: m.label.replace(' morning', ''), w: 'VMS 14, 16 and 17 can come off the track', us: true});
 out.push({t: '06:00', d: m.label.replace(' morning', ''), w: 'VMS 13 and 15 come off the track (not before)', us: true});
 if (am.closure) out.push({t: am.closure, d: m.label.replace(' morning', ''), w: 'Fence closure: Armco gates and circuit closed — every board off by now', hard: true});
 if (am.vehiclesOff) out.push({t: am.vehiclesOff, d: m.label.replace(' morning', ''), w: 'All vehicles off the circuit (BSF barrier crew excluded)', hard: true});
 if (am.closingLap) out.push({t: am.closingLap, d: m.label.replace(' morning', ''), w: 'Track closing lap'});
 if (am.patrons) out.push({t: am.patrons, d: m.label.replace(' morning', ''), w: 'Patron gates open'});
 if (am.roadsReopen) out.push({t: am.roadsReopen, d: m.label, w: 'Roads reopen to normal conditions — boards back in storage for collection before then', hard: true});
 if (am.note) out.push({t: '', d: '', w: am.note});
 return out;
}
function accessHtml(){
 const days = Object.keys(ACCESS).sort();
 return days.map(iso => { const a = ACCESS[iso]; let lines;
  if (a.lines) lines = a.lines;
  else if (a.roadsReopen) lines = [[a.roadsReopen, 'Roads reopen to normal conditions'], ['', a.note]];
  else lines = [[a.closure, 'Armco gate and circuit closure'], [a.vehiclesOff, 'All vehicles off circuit (BSF barrier crew excluded)'], [a.closingLap, 'Track closing lap'], [a.patrons, 'Patron gates open'], [a.openingLap, 'Track opening lap and opening of Armco gates'], [a.accredited, 'Circuit open to accredited vehicles']].concat(a.concert ? [[a.concert, 'Concert finish']] : []).concat([[a.macPark, 'Contractor access to Mac Park permitted']]);
  return `<div class="v1132-day"><b>${esc(fmtDate(iso))}</b>${lines.map(([t, w]) => `<span><i>${esc(t)}</i>${esc(w)}</span>`).join('')}</div>`; }).join('');
}

/* ----------------------------------------------------------------------------------------------------------- the tab */
function defaultMorning(){
 if (current && morning(current)) return current;
 const now = new Date(Date.now() + 10 * 3600 * 1000), h = now.getUTCHours(), today = now.toISOString().slice(0, 10);
 const next = MORNINGS.find(m => h < 12 ? m.iso >= today : m.iso > today);
 return (next || MORNINGS[MORNINGS.length - 1]).iso;
}
function box(checked, attrs){ return '<input type="checkbox" class="v1132-tick" ' + attrs + (checked ? ' checked' : '') + '>'; }
function stamp(r){ return r && r.at ? `<small>${esc(r.by)} · ${esc(when(r.at))}</small>` : ''; }
function render(){
 const pane = document.getElementById('pane-vmsoff'); if (!pane) return;
 const iso = defaultMorning(); current = iso;
 const m = morning(iso), bs = boards(), sm = summary(iso);
 const chooser = MORNINGS.map(x => `<button type="button" class="btn${x.iso === iso ? ' primary' : ''}" data-v1132-morning="${x.iso}" data-ro>${esc(x.label)}<small>${esc(fmtDate(x.iso))}</small></button>`).join('');
 const tl = timeline(m).map(l => `<li class="${l.hard ? 'hard' : l.us ? 'us' : ''}"><i>${esc(l.d)}${l.t ? ' ' + esc(l.t) : ''}</i><span>${esc(l.w)}</span></li>`).join('');
 const rows = bs.length ? bs.map(b => { const s = state(iso, b.pos), done = s.off.done && (m.final || s.out.done);
  return `<div class="v1132-board${done ? ' done' : ''}${b.must ? ' must' : ''}" data-pos="${esc(b.pos)}">
 <div class="v1132-b"><b>${esc(b.label)}</b><em class="v1132-from f${b.from.slice(0, 2)}">${b.must ? 'not before ' : 'from '}${esc(b.from)}</em><span>${esc(b.where)}</span></div>
 <div class="v1132-where"><span>Goes to: <b>${esc(b.store || '—')}</b>${b.storeBy ? ` <small>(${esc(b.storeBy)})</small>` : ''}</span>
  ${Number.isFinite(b.lat) && Number.isFinite(b.lon) ? `<a class="btn sm" href="${esc(nav(b.lat, b.lon))}" target="_blank" rel="noopener noreferrer">Navigate to the board ↗</a>` : ''}
  ${Number.isFinite(b.storeLat) && Number.isFinite(b.storeLon) ? `<a class="btn sm" href="${esc(nav(b.storeLat, b.storeLon))}" target="_blank" rel="noopener noreferrer">Navigate to its spot ↗</a>` : ''}</div>
 <label class="v1132-t"><span>Off the track</span>${box(s.off.done, `data-v1132="off" data-pos="${esc(b.pos)}"`)}${stamp(s.off.done ? s.off : null)}</label>
 ${m.final ? '' : `<label class="v1132-t"><span>Back out tonight</span>${box(s.out.done, `data-v1132="out" data-pos="${esc(b.pos)}"`)}${stamp(s.out.done ? s.out : null)}</label>`}
 <label class="v1132-n"><span>Note</span><input type="text" class="v1132-txt" data-v1132="note" data-pos="${esc(b.pos)}" value="${esc(s.note.text)}" placeholder="who, what was found, anything in the way"></label></div>`; }).join('')
  : '<p class="sub">The VMS plan is not loaded on this page, so the boards cannot be listed.</p>';
 const sign = sm.sign, audit = sm.audit;
 pane.innerHTML = paneHeadingHtml('vmsoff') + `
<section class="card nosfold v1132-head"><h3>VMS daily removals · the five end-of-session boards</h3>
 <p class="sub">After each day’s track opening lap the boards go out onto the track to show everyone the way out. They must be off again before the next morning’s <b>fence closure</b> (the Armco gates close at 07:00) and every vehicle must be off the circuit by 07:45. ${esc(WORD)}: VMS 14, 16 and 17 can come off from 03:00; VMS 13 and 15 not before 06:00; VMS 16 goes behind 2 Breaker St, Main Beach.</p>
 <div class="v1132-mornings">${chooser}</div></section>
<section class="card v1132-morning"><h3>${esc(m.label)} · ${esc(fmtDate(iso))} <small>after ${esc(m.after)}</small></h3>
 <ul class="v1132-tl">${tl}</ul>
 <div class="v1132-sum"><span><b>${sm.off}</b>/${sm.boards} off the track</span>${sm.out == null ? '<span>final removal · boards to storage for collection</span>' : `<span><b>${sm.out}</b>/${sm.boards} back out tonight</span>`}</div>
 <div class="v1132-actions"><button type="button" class="btn" data-v1132-print="${iso}" data-ro>Print removals sheet / Save as PDF</button><button type="button" class="btn" data-v1132-go="vms" data-ro>Open VMS boards</button><button type="button" class="btn" data-v1132-go="map" data-ro>Open the Map explorer</button></div></section>
<section class="card v1132-boards"><h3>Boards · earliest first</h3>
 <p class="sub">Tick each board as it comes off the track${m.final ? '' : ', then again when it goes back out after the opening lap'}. Each tick saves on its own with the time.</p>
 ${rows}</section>
<section class="card v1132-sign"><h3>Sign-off · ${esc(m.label)}</h3>
 <div class="v1132-signgrid">
 <label><span>Crew</span><input type="text" class="v1132-txt" data-v1132="sign-text" data-f="crew" value="${esc(sign.crew)}" placeholder="who did the removals"></label>
 <label><span>Notes</span><input type="text" class="v1132-txt" data-v1132="sign-text" data-f="notes" value="${esc(sign.notes)}" placeholder="anything to carry to the next morning"></label></div>
 <label class="v1132-t wide">${box(sign.signed, 'data-v1132="signoff"')}<span>All five boards were off the track before the fence closure and are where this sheet says</span>${stamp(sign.signed ? sign : null)}</label>
 <label class="v1132-t wide">${box(audit.audited, 'data-v1132="audit"')}<span>Audited by the project manager</span>${stamp(audit.audited ? audit : null)}</label>
 <p class="sub">Removals sheet form ${esc(FORM)}, issued and signed by ${esc(author())}, ${esc(authorTitle())}, ${esc(ISSUED)}.</p></section>
<section class="card v1132-access"><h3>Track access details · Supercars</h3>
 <p class="sub">As issued by Supercars for the event and received by ${esc(author())}, 23 Oct 2026. The fence closure is the Armco gate and circuit closure.</p>
 <div class="v1132-days">${accessHtml()}</div></section>`;
 bind(pane);
}
function bind(pane){
 pane.onclick = e => {
  const b = e.target.closest('[data-v1132-morning],[data-v1132-print],[data-v1132-go]'); if (!b) return;
  if (b.dataset.v1132Morning) { current = b.dataset.v1132Morning; render(); return; }
  if (b.dataset.v1132Print) { location.hash = '#print/vmsoff/' + b.dataset.v1132Print; return; }
  if (b.dataset.v1132Go) { go(b.dataset.v1132Go); }
 };
 pane.onchange = e => {
  const el = e.target.closest('[data-v1132]'); if (!el) return;
  const iso = current, t = el.dataset.v1132;
  let ok = false;
  if (t === 'off') ok = write(iso, 'off', el.dataset.pos, {done: !!el.checked}, 'the board’s off-track tick');
  else if (t === 'out') ok = write(iso, 'out', el.dataset.pos, {done: !!el.checked}, 'the board’s back-out tick');
  else if (t === 'note') ok = write(iso, 'note', el.dataset.pos, {text: trim(el.value)}, 'the board’s note');
  else if (t === 'sign-text') ok = write(iso, 'signoff', null, {[el.dataset.f]: trim(el.value)}, 'the sign-off');
  else if (t === 'signoff') ok = write(iso, 'signoff', null, {signed: !!el.checked}, 'the sign-off');
  else if (t === 'audit') ok = write(iso, 'audit', null, {audited: !!el.checked}, 'the audit');
  if (!ok) { render(); return; } /* a refused write puts the control back as the record has it */
  if (t !== 'note' && t !== 'sign-text') render();
 };
}

/* ------------------------------------------------------------------------------------------------------- the sheet */
const CSS = `
#dayprint .ps7.v1132 table.v1132-t{width:100%!important;min-width:0!important;table-layout:fixed;border-collapse:collapse;font-size:7.2pt;margin:0}
#dayprint .ps7.v1132 table.v1132-t th{font-weight:700;text-align:left;border-bottom:1px solid #15181a;padding:2px 3px;font-size:6pt;letter-spacing:.4px}
#dayprint .ps7.v1132 table.v1132-t td{border-bottom:1px solid #d9dde0;padding:3px 3px;vertical-align:top}
#dayprint .ps7.v1132 table.v1132-t td.c{text-align:center}
#dayprint .ps7.v1132 table.v1132-t td.w{color:#3b4246}
#dayprint .ps7.v1132 table.v1132-t td .fr{font-weight:800}
#dayprint .ps7.v1132 table.v1132-t td .fr.must{color:#b4521a}
#dayprint .ps7.v1132 .bx{width:8px;height:8px;border:1px solid #6b757a;display:inline-block;vertical-align:middle;position:relative}
#dayprint .ps7.v1132 .bx.checked{background:#15181a;border-color:#15181a}
#dayprint .ps7.v1132 .bx.checked::after{content:"\\2713";color:#fff;font-size:7pt;position:absolute;left:.8px;top:-1.6px}
#dayprint .ps7.v1132 .tm{display:inline-block;min-width:11mm;border-bottom:1px solid #9aa3a8;margin-left:3px;font-size:6.8pt;text-align:center}
#dayprint .ps7.v1132 ul.tl{list-style:none;margin:0;padding:0;columns:2;column-gap:8mm;font-size:7pt}
#dayprint .ps7.v1132 ul.tl li{display:flex;gap:5px;padding:1px 0;break-inside:avoid}
#dayprint .ps7.v1132 ul.tl li i{font-style:normal;font-weight:700;min-width:21mm}
#dayprint .ps7.v1132 ul.tl li.hard i{color:#b4521a}
#dayprint .ps7.v1132 ul.tl li.us{background:#f1f3f4}
#dayprint .ps7.v1132 .notes{border:1px solid #d9dde0;min-height:14mm;padding:2px 4px;font-size:6.8pt}
#dayprint .ps7.v1132 .notes p{margin:0;border-bottom:1px dotted #9aa3a8;min-height:3.6mm}
#dayprint .ps7.v1132 .sign{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:2px}
#dayprint .ps7.v1132 .sign div{border:1px solid #15181a;padding:3px 6px;font-size:6.8pt;min-height:13mm}
#dayprint .ps7.v1132 .sign div b{display:block;font-size:6.2pt;letter-spacing:.6px;color:#3b4246}
#dayprint .ps7.v1132 .sign div span{display:block;border-bottom:1px solid #9aa3a8;min-height:4.2mm;margin-top:2px}
#dayprint .ps7.v1132 .issued{margin:3px 0 0;border:1px solid #15181a;padding:3px 6px;font-size:7.2pt}
`;
function pbox(on){ return '<span class="bx' + (on ? ' checked' : '') + '"></span>'; }
function sheetHtml(iso, o){
 o = o || {}; const blank = !!o.blank, m = morning(iso); if (!m) return '';
 const bs = boards(), st = pos => blank ? {off: {}, out: {}, note: {}} : state(iso, pos), sign = blank ? {} : (rec(iso, 'signoff') || {}), audit = blank ? {} : (rec(iso, 'audit') || {});
 const rows = bs.map(b => { const s = st(b.pos);
  return `<tr><td><b>${esc(b.label)}</b></td><td class="w">${esc(b.where)}</td><td class="c"><span class="fr${b.must ? ' must' : ''}">${b.must ? 'not before ' : 'from '}${esc(b.from)}</span></td><td class="w">${esc(b.store || '—')}</td><td class="c">${pbox(s.off.done)}<span class="tm">${s.off.done ? esc(hhmm(s.off.at)) : ''}</span></td>${m.final ? '' : `<td class="c">${pbox(s.out.done)}<span class="tm">${s.out.done ? esc(hhmm(s.out.at)) : ''}</span></td>`}<td class="w">${esc(s.note.text || '')}</td></tr>`; }).join('');
 const tl = timeline(m).map(l => `<li class="${l.hard ? 'hard' : l.us ? 'us' : ''}"><i>${esc(l.d)}${l.t ? ' ' + esc(l.t) : ''}</i><span>${esc(l.w)}</span></li>`).join('');
 return `<section class="ps ps7 fen v1132">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">VMS DAILY REMOVALS — RUN SHEET · ${esc(FORM)}</span><h1>${esc(m.label)} · ${esc(fmtDate(iso))}</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede"><b>The five end-of-session boards</b> go out onto the track after the opening lap and must be off before the fence closure (Armco gates, 07:00); all vehicles off the circuit by 07:45. ${esc(WORD)}: VMS 14, 16 and 17 from 03:00; VMS 13 and 15 not before 06:00; VMS 16 goes behind 2 Breaker St, Main Beach. <span class="tag">FIELD OPERATIONS</span></p>
 <h2><i>01</i> THE TIMES <em>after ${esc(m.after)} · Supercars track access details</em></h2>
 <ul class="tl">${tl}</ul>
 <h2><i>02</i> BOARDS <em>earliest first · off the track · ${m.final ? 'to storage for collection' : 'back out after the opening lap'}</em></h2>
 <table class="v1132-t"><colgroup><col style="width:16mm"><col><col style="width:22mm"><col style="width:40mm"><col style="width:20mm">${m.final ? '' : '<col style="width:20mm">'}<col style="width:34mm"></colgroup>
 <thead><tr><th>Board</th><th>Position</th><th class="c">Off from</th><th>Goes to</th><th class="c">Off · time</th>${m.final ? '' : '<th class="c">Back out · time</th>'}<th>Note</th></tr></thead><tbody>${rows}</tbody></table>
 <h2><i>03</i> NOTES <em>who · what was found · anything in the way</em></h2>
 <div class="notes"><p>${esc(sign.notes || '')}</p><p></p><p></p></div>
 <h2><i>04</i> SIGN-OFF</h2>
 <div class="sign">
 <div><b>CREW — ALL FIVE BOARDS OFF BEFORE THE FENCE CLOSURE AND WHERE THIS SHEET SAYS</b><span>${esc(sign.crew || '')}${sign.signed ? ' · signed ' + esc(when(sign.at)) : ''}</span><span></span></div>
 <div><b>AUDITED BY THE PROJECT MANAGER</b><span>${audit.audited ? esc(audit.by) + ' · ' + esc(when(audit.at)) : ''}</span><span></span></div>
 </div>
 <p class="issued"><b>Issued and signed:</b> ${esc(author())}, ${esc(authorTitle())} · ${esc(ISSUED)} · the morning’s ticks, times and notes are recorded on this sheet by the crew.</p>
 </section>`;
}
function print(iso, o){
 if (!morning(iso)) { flash('That day is not a removal morning.'); return; }
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

W.VmsOff1132 = {KIND, PREFIX, FORM, RULES, ACCESS, MORNINGS, boards, key, rec, write, state, summary, timeline, sheetHtml, print, render, CSS,
 get morning(){ return current; }, set morning(v){ current = morning(v) ? v : current; }};
W.renderVmsOff1132 = render;
})(window);
