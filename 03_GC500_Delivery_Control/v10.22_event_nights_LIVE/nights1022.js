/* Author: Andrew Fisher. Event nights run sheet (v10.22): the three event nights, Fri 23, Sat 24 and Sun 25 Oct 2026,
   serviced 19:00 to about 03:00 by the Event Portables night team and managed and audited by the night manager (Kyle).
   Each night keeps its own record on the shared loads collection, one document per unit, task, request, sign-off and
   audit, written through the page's own write path (mayWrite, whoAmI, stampIt, save, bump) on the edit link only; the
   run sheet prints on the day-document print path (#print/nights/<date>). No cost lines: the service is already paid
   for in what is paid to Event Portables. Nothing is pre-ticked. */
(function (W) {
'use strict';
const KIND = 'nights1022', PREFIX = 'nights1022/', FORM = 'GC500-RS-EN-01 v1', ISSUED = '15 Oct 2026';
const NIGHTS = [
 {iso: '2026-10-23', label: 'Friday night', kind: 'service'},
 {iso: '2026-10-24', label: 'Saturday night', kind: 'service'},
 {iso: '2026-10-25', label: 'Sunday night', kind: 'final'}];
const WINDOW = '19:00 to about 03:00';
const TEAM = 'Event Portables night team \u00b7 4 pump trucks \u00b7 1 water truck \u00b7 1 cleaner\u2019s vehicle \u00b7 12 staff';
const TASKS = {
 service: [
  ['meet', 'Meet the team at the start of the night'],
  ['maps', 'Issue the updated site maps from the previous night\u2019s recorded fill levels'],
  ['order', 'Run through the service order and allocate areas'],
  ['spot', 'Spot checks: units pumped out and refilled'],
  ['reloc', 'Respond to relocation requests']],
 final: [
  ['meet', 'Meet the team at the start of the night'],
  ['final', 'Final check: no pump-out missed'],
  ['roads', 'Equipment off the roadways before the roads reopen'],
  ['collect', 'Relocate WC46, WC55, WC24, WC25, WC23, WC26, WC62, WC35, WC65, WC72 and WB14 \u00d72 to the accessible collection points']]};
const RELOCATE = ['WC46', 'WC55', 'WC24', 'WC25', 'WC23', 'WC26', 'WC62', 'WC35', 'WC65', 'WC72', 'WB14'];
const LEVELS = [['', '\u2014'], ['empty', 'Empty'], ['25', '\u00bc'], ['50', '\u00bd'], ['75', '\u00be'], ['full', 'Full']];
const esc1022 = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trim = x => String(x == null ? '' : x).trim();
const author = () => (DATA.brand && DATA.brand.author) || 'Andrew Fisher';
const authorTitle = () => { const p = (((DATA.team || {}).people) || []).find(x => x.name === author()); return (p && p.title) || 'Shutdown Manager'; };
let current = null; /* the night shown on the tab */

/* --------------------------------------------------------------------------------------------- units in service order */
function unitRows(){
 const num = k => parseInt(String(k).replace(/\D/g, ''), 10) || 0;
 const seen = new Set(), out = [];
 (DATA.assets || []).forEach(a => {
  if (!/^WC\d+$/.test(a.key) || seen.has(a.key)) return;
  const live = typeof assetOf === 'function' ? assetOf(a.key) : a;
  if (!live || live._cancelled) return; /* deleted from the register (no asset any more) or cancelled: not serviced */
  seen.add(a.key);
  const m = typeof MASTER_LOC === 'object' && MASTER_LOC ? MASTER_LOC[a.key] : null;
  const strip = t => trim(t).replace(new RegExp('^' + a.key + '\\s*[-\u2013\u2014:]?\\s*'), '');
  const where = strip((a.locations || [])[0] || '') || strip(a.name || '') || trim(a.product || '');
  out.push({key: a.key, where, types: (a.item_types || []).join(', '), sec: (m && m.sec) || ''});
 });
 return out.sort((x, y) => num(x.key) - num(y.key) || x.key.localeCompare(y.key));
}

/* ----------------------------------------------------------------------------------------------------- the record */
function key(iso, part, id){ return PREFIX + iso + '/' + part + (id == null ? '' : '/' + id); }
function rec(iso, part, id){ const r = (S.loads || {})[key(iso, part, id)]; return r && r.kind === KIND ? r : null; }
function night(iso){ return NIGHTS.find(n => n.iso === iso) || null; }
function write(iso, part, id, patch, what){
 if (!night(iso)) return false;
 if (!mayWrite(what || 'the run sheet')) return false;
 const who = whoAmI(); if (!who) return false;
 const k = key(iso, part, id);
 if (typeof docIdOf === 'function' && Object.keys(S.loads || {}).some(x => x !== k && docIdOf(x) === docIdOf(k))) { flash('This run-sheet record needs a unique document identity.'); return false; }
 S.loads = S.loads || {};
 const old = S.loads[k];
 if (old && old.kind !== KIND) { flash('That record key belongs to something else; nothing written.'); return false; }
 S.loads[k] = Object.assign({}, old || {}, patch, {kind: KIND, night: iso, part, id: id == null ? null : String(id), by: who, at: new Date().toISOString()});
 stampIt('loads', k, who); save(); if (typeof bump === 'function') bump();
 return true;
}
function nightRecords(iso){ return Object.entries(S.loads || {}).filter(([k, r]) => r && r.kind === KIND && r.night === iso && k.indexOf(PREFIX) === 0).map(([k, r]) => r); }
function unitState(iso, ref){ return rec(iso, 'unit', ref) || {}; }
function requests(iso){ return nightRecords(iso).filter(r => r.part === 'request').sort((a, b) => Number(a.id) - Number(b.id)); }
function summary(iso){
 const us = unitRows(), st = us.map(u => unitState(iso, u.key));
 return {units: us.length, pumped: st.filter(s => s.pumped).length, refilled: st.filter(s => s.refilled).length, levels: st.filter(s => s.level).length,
  spot: st.filter(s => s.spot).length, tasks: (TASKS[night(iso).kind] || []).filter(([id]) => (rec(iso, 'task', id) || {}).done).length,
  taskCount: (TASKS[night(iso).kind] || []).length, requests: requests(iso).length, signoff: rec(iso, 'signoff'), audit: rec(iso, 'audit')};
}
function levelWord(v){ const l = LEVELS.find(x => x[0] === String(v || '')); return l ? l[1] : '\u2014'; }
function when(iso){ const d = new Date(iso); return isNaN(d) ? String(iso || '') : d.toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}); }

/* -------------------------------------------------------------------------------------------------------- the tab */
function defaultNight(){
 if (current && night(current)) return current;
 const now = new Date(Date.now() + 10 * 3600 * 1000); /* AEST; a night runs past midnight, so 03:00 on the 24th is still Friday night */
 const h = now.getUTCHours(), iso = new Date(now.getTime() - (h < 6 ? 86400000 : 0)).toISOString().slice(0, 10);
 return (night(iso) || NIGHTS[0]).iso;
}
function box(checked, attrs){ return '<input type="checkbox" class="n1022-tick" ' + attrs + (checked ? ' checked' : '') + '>'; }
function render(){
 const pane = document.getElementById('pane-nights'); if (!pane) return;
 const iso = defaultNight(); current = iso;
 const n = night(iso), sm = summary(iso), prev = NIGHTS[NIGHTS.indexOf(n) - 1] || null, units = unitRows();
 const sign = sm.signoff || {}, audit = sm.audit || {};
 const chooser = NIGHTS.map(x => `<button type="button" class="btn${x.iso === iso ? ' primary' : ''}" data-n1022-night="${x.iso}" data-ro>${esc1022(x.label)}<small>${esc1022(fmtDate(x.iso))}</small></button>`).join('');
 const tasks = (TASKS[n.kind] || []).map(([id, label]) => { const t = rec(iso, 'task', id) || {}; return `<label class="n1022-task">${box(t.done, `data-n1022="task" data-id="${id}"`)}<span>${esc1022(label)}</span>${t.done ? `<small>${esc1022(t.by)} \u00b7 ${esc1022(when(t.at))}</small>` : ''}</label>`; }).join('');
 const prevLine = prev ? (() => { const ps = summary(prev.iso); return `<p class="sub">${esc1022(prev.label)}: fill levels recorded on ${ps.levels} of ${ps.units} units, ${ps.pumped} pumped out, ${ps.refilled} refilled` + (ps.levels ? ` \u00b7 <button type="button" class="linkish" data-n1022-night="${prev.iso}" data-ro>open ${esc1022(prev.label)}</button>` : ' \u00b7 nothing recorded yet, so the maps go out as they stand') + '.</p>'; })() : '<p class="sub">First night: the site maps go out as the page holds them.</p>';
 const rows = units.map(u => { const s = unitState(iso, u.key), rel = n.kind === 'final' && RELOCATE.includes(u.key);
  return `<div class="n1022-unit${s.pumped && s.refilled ? ' done' : ''}" data-ref="${u.key}">
 <div class="n1022-u"><b>${esc1022(u.key)}</b><span>${esc1022(u.where)}${u.sec ? ' \u00b7 ' + esc1022(u.sec) : ''}${rel ? ' \u00b7 <i class="n1022-rel">relocate to the collection point</i>' : ''}</span></div>
 <label title="Area allocated"><span>Area</span><input type="text" class="n1022-txt" data-n1022="unit-text" data-ref="${u.key}" data-f="area" value="${esc1022(s.area)}" placeholder="\u2014"></label>
 <label><span>Pumped</span>${box(s.pumped, `data-n1022="unit" data-ref="${u.key}" data-f="pumped"`)}</label>
 <label><span>Refilled</span>${box(s.refilled, `data-n1022="unit" data-ref="${u.key}" data-f="refilled"`)}</label>
 <label><span>Level</span><select class="n1022-sel" data-n1022="unit-level" data-ref="${u.key}">${LEVELS.map(([v, w]) => `<option value="${v}"${String(s.level || '') === v ? ' selected' : ''}>${w}</option>`).join('')}</select></label>
 <label><span>Spot check</span>${box(s.spot, `data-n1022="unit" data-ref="${u.key}" data-f="spot"`)}</label>
 <label class="n1022-note"><span>Note</span><input type="text" class="n1022-txt" data-n1022="unit-text" data-ref="${u.key}" data-f="note" value="${esc1022(s.note)}" placeholder="relocation, fault, access"></label>
 ${s.at ? `<small class="n1022-by">${esc1022(s.by)} \u00b7 ${esc1022(when(s.at))}</small>` : ''}</div>`; }).join('');
 const reqs = requests(iso).map(r => `<div class="n1022-req${r.done ? ' done' : ''}"><span>${esc1022(r.text)}</span>${box(r.done, `data-n1022="request" data-id="${r.id}"`)}<small>${esc1022(r.by)} \u00b7 ${esc1022(when(r.at))}</small></div>`).join('');
 pane.innerHTML = paneHeadingHtml('nights') + `
<section class="card nosfold n1022-head"><h3>Event nights \u00b7 run sheet</h3>
 <p class="sub">${esc1022(TEAM)} \u00b7 ${esc1022(WINDOW)} \u00b7 managed and audited by the night manager (Kyle). The servicing is covered by what is paid to Event Portables; there are no cost lines here.</p>
 <div class="n1022-nights">${chooser}</div></section>
<section class="card n1022-night"><h3>${esc1022(n.label)} \u00b7 ${esc1022(fmtDate(iso))} <small>${esc1022(WINDOW)}</small></h3>
 ${prevLine}
 <div class="n1022-sum"><span><b>${sm.tasks}</b>/${sm.taskCount} tasks</span><span><b>${sm.pumped}</b>/${sm.units} pumped out</span><span><b>${sm.refilled}</b>/${sm.units} refilled</span><span><b>${sm.levels}</b> fill levels</span><span><b>${sm.spot}</b> spot checks</span><span><b>${sm.requests}</b> requests</span></div>
 <div class="n1022-actions"><button type="button" class="btn" data-n1022-print="${iso}" data-ro>Print run sheet / Save as PDF</button><button type="button" class="btn" data-n1022-go="map" data-ro>Open the Map explorer</button></div></section>
<section class="card n1022-tasks"><h3>Tasks \u00b7 ${esc1022(n.label)}</h3>${tasks}</section>
<section class="card n1022-order"><h3>Service order \u00b7 ${units.length} toilet units</h3>
 <p class="sub">Every WC unit on the job, in number order. Allocate the area, then tick pumped out and water refilled as each is serviced; record the fill level found; tick the spot check when it has been checked. Each line saves on its own.</p>
 <div class="n1022-units">${rows}</div></section>
<section class="card n1022-requests"><h3>Relocation requests</h3>
 ${reqs || '<p class="sub">None recorded for this night.</p>'}
 <div class="n1022-add"><input type="text" class="n1022-txt" id="n1022-newreq" placeholder="Unit, where to, who asked"><button type="button" class="btn" data-n1022-addreq="${iso}">Add request</button></div></section>
<section class="card n1022-sign"><h3>End of shift</h3>
 <div class="n1022-signgrid">
 <label><span>Night manager</span><input type="text" class="n1022-txt" data-n1022="sign-text" data-f="manager" value="${esc1022(sign.manager)}" placeholder="Kyle"></label>
 <label><span>Start</span><input type="time" class="n1022-txt" data-n1022="sign-text" data-f="start" value="${esc1022(sign.start || '19:00')}"></label>
 <label><span>Finish</span><input type="time" class="n1022-txt" data-n1022="sign-text" data-f="finish" value="${esc1022(sign.finish)}"></label>
 <label><span>Shift notes</span><input type="text" class="n1022-txt" data-n1022="sign-text" data-f="notes" value="${esc1022(sign.notes)}" placeholder="what was left, what to carry to the next night"></label>
 </div>
 <label class="n1022-task">${box(sign.signed, 'data-n1022="signoff"')}<span>Night manager\u2019s end-of-shift sign-off: the service order was run, the spot checks done and the requests answered as recorded above</span>${sign.signed ? `<small>${esc1022(sign.by)} \u00b7 ${esc1022(when(sign.at))}</small>` : ''}</label>
 <label class="n1022-task">${box(audit.audited, 'data-n1022="audit"')}<span>Audited by the project manager</span>${audit.audited ? `<small>${esc1022(audit.by)} \u00b7 ${esc1022(when(audit.at))}</small>` : ''}</label>
 <p class="sub">Run sheet form ${esc1022(FORM)}, issued and signed by ${esc1022(author())}, ${esc1022(authorTitle())}, ${esc1022(ISSUED)}.</p>
 ${filesHtml()}</section>`;
 bind(pane);
}
function filesHtml(){
 let ix; try { ix = photoIndex(); } catch (e) { return ''; }
 if (!ix || ix.state !== 'ready') return '';
 const fs = Object.values(ix.files || {}).filter(f => /^Event nights? run sheet/i.test(String(f.title || ''))).sort((a, b) => String(a.title).localeCompare(String(b.title)));
 if (!fs.length) return '';
 const url = f => (SYNC.backend && SYNC.backend.fileUrl) ? SYNC.backend.fileUrl(f.id) : '';
 return '<h4>Issued run sheets on the record</h4><ul class="n1022-files">' + fs.map(f => `<li><a href="${esc1022(url(f))}" target="_blank" rel="noopener">${esc1022(f.title)}</a> <small>${esc1022(f.by || '')}</small></li>`).join('') + '</ul>';
}
function bind(pane){
 pane.onclick = e => {
  const b = e.target.closest('[data-n1022-night],[data-n1022-print],[data-n1022-go],[data-n1022-addreq]'); if (!b) return;
  if (b.dataset.n1022Night) { current = b.dataset.n1022Night; render(); return; }
  if (b.dataset.n1022Print) { location.hash = '#print/nights/' + b.dataset.n1022Print; return; }
  if (b.dataset.n1022Go) { go(b.dataset.n1022Go); return; }
  if (b.dataset.n1022Addreq) { const inp = pane.querySelector('#n1022-newreq'), text = trim(inp && inp.value); if (!text) { flash('Say what the request is first.'); return; }
   const n = requests(b.dataset.n1022Addreq).reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
   if (write(b.dataset.n1022Addreq, 'request', n, {text, done: false}, 'the relocation request')) render(); }
 };
 pane.onchange = e => {
  const el = e.target.closest('[data-n1022]'); if (!el) return;
  const iso = current, t = el.dataset.n1022;
  let ok = false;
  if (t === 'unit') ok = write(iso, 'unit', el.dataset.ref, {[el.dataset.f]: !!el.checked}, 'the unit\u2019s tick');
  else if (t === 'unit-level') ok = write(iso, 'unit', el.dataset.ref, {level: el.value}, 'the fill level');
  else if (t === 'unit-text') ok = write(iso, 'unit', el.dataset.ref, {[el.dataset.f]: trim(el.value)}, 'the unit\u2019s note');
  else if (t === 'task') ok = write(iso, 'task', el.dataset.id, {done: !!el.checked}, 'the task');
  else if (t === 'request') ok = write(iso, 'request', el.dataset.id, {done: !!el.checked}, 'the request');
  else if (t === 'sign-text') ok = write(iso, 'signoff', null, {[el.dataset.f]: trim(el.value)}, 'the sign-off');
  else if (t === 'signoff') ok = write(iso, 'signoff', null, {signed: !!el.checked}, 'the sign-off');
  else if (t === 'audit') ok = write(iso, 'audit', null, {audited: !!el.checked}, 'the audit');
  if (!ok) { render(); return; } /* a refused write puts the control back as the record has it */
  if (t !== 'unit-text' && t !== 'sign-text') render();
 };
}

/* --------------------------------------------------------------------------------------------------- the run sheet */
const CSS = `
#dayprint .ps7.n1022 .n1022-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 8px}
#dayprint .ps7.n1022 table.n1022-t{width:100%!important;min-width:0!important;max-width:100%;table-layout:fixed;border-collapse:collapse;font-size:6.1pt;margin:0}
#dayprint .ps7.n1022 table.n1022-t th{font-weight:700;text-align:left;border-bottom:1px solid #15181a;padding:1px 2px;font-size:5.6pt;letter-spacing:.4px;overflow:hidden}
#dayprint .ps7.n1022 table.n1022-t td{border-bottom:1px solid #d9dde0;padding:.6px 2px;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dayprint .ps7.n1022 table.n1022-t td.w{color:#3b4246}
#dayprint .ps7.n1022 table.n1022-t td.c{text-align:center}
#dayprint .ps7.n1022 .bx{width:7.5px;height:7.5px;border:1px solid #6b757a;display:inline-block;vertical-align:middle;position:relative}
#dayprint .ps7.n1022 .bx.checked{background:#15181a;border-color:#15181a}
#dayprint .ps7.n1022 .bx.checked::after{content:"\\2713";color:#fff;font-size:6.5pt;position:absolute;left:.6px;top:-1.6px}
#dayprint .ps7.n1022 .tasks label{display:flex;gap:5px;align-items:flex-start;font-size:6.8pt;margin:1px 0}
#dayprint .ps7.n1022 .tasks label .bx{flex:none;margin-top:1px}
#dayprint .ps7.n1022 .req{border:1px solid #d9dde0;min-height:9mm;padding:2px 4px;font-size:6.6pt}
#dayprint .ps7.n1022 .req p{margin:0;border-bottom:1px dotted #9aa3a8;min-height:3.4mm}
#dayprint .ps7.n1022 .sign{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:2px}
#dayprint .ps7.n1022 .sign div{border:1px solid #15181a;padding:3px 6px;font-size:6.8pt;min-height:12mm}
#dayprint .ps7.n1022 .sign div b{display:block;font-size:6.2pt;letter-spacing:.6px;color:#3b4246}
#dayprint .ps7.n1022 .sign div span{display:block;border-bottom:1px solid #9aa3a8;min-height:4.2mm;margin-top:2px}
#dayprint .ps7.n1022 .issued{margin:3px 0 0;border:1px solid #15181a;padding:3px 6px;font-size:7.2pt}
#dayprint .ps7.n1022 .lv{font-size:5.6pt;color:#3b4246}
#dayprint .ps7.n1022 .rel{color:#b4521a;font-weight:700}
`;
function pbox(on){ return '<span class="bx' + (on ? ' checked' : '') + '"></span>'; }
function sheetHtml(iso, o){
 o = o || {}; const blank = !!o.blank, n = night(iso); if (!n) return '';
 const units = unitRows(), st = ref => blank ? {} : unitState(iso, ref), sign = blank ? {} : (rec(iso, 'signoff') || {}), audit = blank ? {} : (rec(iso, 'audit') || {});
 const half = Math.ceil(units.length / 2), cols = [units.slice(0, half), units.slice(half)];
 const table = rows => `<table class="n1022-t"><colgroup><col style="width:12mm"><col><col style="width:15mm"><col style="width:9mm"><col style="width:9mm"><col style="width:8mm"><col style="width:7mm"></colgroup><thead><tr><th>Unit</th><th>Where</th><th>Area</th><th class="c">Pumped</th><th class="c">Refilled</th><th class="c">Level</th><th class="c">Spot</th></tr></thead><tbody>` +
  rows.map(u => { const s = st(u.key), rel = n.kind === 'final' && RELOCATE.includes(u.key);
   return `<tr><td><b>${esc1022(u.key)}</b>${rel ? ' <span class="rel">\u2192</span>' : ''}</td><td class="w" title="${esc1022(u.where)}">${esc1022(u.where)}${s.note ? ' \u00b7 ' + esc1022(s.note) : ''}</td><td class="w">${esc1022(s.area || '')}</td><td class="c">${pbox(s.pumped)}</td><td class="c">${pbox(s.refilled)}</td><td class="c lv">${s.level ? esc1022(levelWord(s.level)) : ''}</td><td class="c">${pbox(s.spot)}</td></tr>`; }).join('') + '</tbody></table>';
 const tasks = (TASKS[n.kind] || []).map(([id, label]) => { const t = blank ? {} : (rec(iso, 'task', id) || {}); return `<label>${pbox(t.done)}<span>${esc1022(label)}${t.done ? ` <i>\u2014 ${esc1022(t.by)}, ${esc1022(when(t.at))}</i>` : ''}</span></label>`; }).join('');
 const reqs = blank ? [] : requests(iso);
 const reqHtml = (reqs.length ? reqs.map(r => `<p>${pbox(r.done)} ${esc1022(r.text)} <i>\u2014 ${esc1022(r.by)}, ${esc1022(when(r.at))}</i></p>`).join('') : '') + '<p></p><p></p>'.repeat(reqs.length ? 1 : 3);
 const relLine = n.kind === 'final' ? `<p class="lede"><b>Before the roads reopen:</b> every unit off the roadways; <span class="rel">\u2192</span> marks the ${RELOCATE.length} references that move to the accessible collection points (WB14 \u00d72 included).</p>` : '';
 return `<section class="ps ps7 fen n1022">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">EVENT NIGHTS \u2014 RUN SHEET \u00b7 ${esc1022(FORM)}</span><h1>${esc1022(n.label)} \u00b7 ${esc1022(fmtDate(iso))}</h1></div>
 <div class="psh-r"><b>GC500 \u00b7 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede"><b>${esc1022(TEAM)}</b> \u00b7 ${esc1022(WINDOW)} \u00b7 managed and audited by the night manager (Kyle) <span class="tag">FIELD OPERATIONS</span></p>
 ${relLine}
 <h2><i>01</i> TASKS <em>${esc1022(n.label)}</em></h2>
 <div class="tasks">${tasks}</div>
 <h2><i>02</i> SERVICE ORDER <em>${units.length} toilet units \u00b7 pumped out \u00b7 water refilled \u00b7 fill level found \u00b7 spot check</em></h2>
 <div class="n1022-grid">${table(cols[0])}${table(cols[1])}</div>
 <h2><i>03</i> RELOCATION REQUESTS <em>unit \u00b7 where to \u00b7 who asked \u00b7 done</em></h2>
 <div class="req">${reqHtml}</div>
 <h2><i>04</i> END OF SHIFT</h2>
 <div class="sign">
 <div><b>NIGHT MANAGER (KYLE) \u2014 SIGN-OFF</b><span>${esc1022(sign.manager || '')}${sign.signed ? ' \u00b7 signed ' + esc1022(when(sign.at)) : ''}</span><span>start ${esc1022(sign.start || '')} \u00b7 finish ${esc1022(sign.finish || '')}</span><span>${esc1022(sign.notes || '')}</span></div>
 <div><b>AUDITED BY THE PROJECT MANAGER</b><span>${audit.audited ? esc1022(audit.by) + ' \u00b7 ' + esc1022(when(audit.at)) : ''}</span><span></span><span></span></div>
 </div>
 <p class="issued"><b>Issued and signed:</b> ${esc1022(author())}, ${esc1022(authorTitle())} \u00b7 ${esc1022(ISSUED)} \u00b7 the night\u2019s ticks, levels, requests and sign-off are recorded on this sheet by the night team and the night manager.</p>
 </section>`;
}
function print(iso, o){
 if (!night(iso)) { flash('That night is not an event night.'); return; }
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

W.Nights1022 = {KIND, PREFIX, NIGHTS, TASKS, RELOCATE, LEVELS, FORM, unitRows, key, rec, write, summary, sheetHtml, print, render, CSS,
 get night(){ return current; }, set night(v){ current = night(v) ? v : current; }};
W.renderNights1022 = render;
})(window);
