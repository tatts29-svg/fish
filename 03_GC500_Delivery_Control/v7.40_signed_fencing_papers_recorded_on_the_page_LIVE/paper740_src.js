/* v7.40 - SIGNED FENCING PAPERS RECORDED ON THE PAGE (see patch_v740.py). Andrew Fisher, 29 Sep 2026, seven signed papers
   photographed on site: "5 for hire agreement, the other 2 for service."
   - RED BOOK: a hire agreement is typed straight in - number, date, where, the metres and counts per card column, the
     components on the truck, who signed - and saved as a docket (recordDocket, the same save the old card made), so it
     is charged at the 2026 card and costed at Advanced's sheet like every other docket, and syncs with the record.
   - GREEN BOOK: a service note is typed in the same way - number, date, where, the crew's hours, what the note says -
     into a new synced list, serviceNotes. It is priced at the Labour paid rate like the committed notes, so the green
     book, the fencing plate and the Costs tab carry it at once. Cost only, as the green book always is.
   - Both refuse a paper number already on the books, and both can be set aside from the table like a docket. */
const PAPER = {open: null, said: ''};
const PAPER_PARTS = [['mesh_panel', 'Mesh panels'], ['hoarding_panel', 'Hoarding panels'], ['cc_barrier', 'CC barrier'], ['base', 'Bases'], ['clamp', 'Clamps'], ['brace', 'Braces'], ['wheels', 'Wheels']];
function paperCols(){ return FCOL.filter(c => c.key && c.key !== 'team_leader'); }
function paperNoTaken(no){ const s = String(no || '').trim(); return !!s && bookNumbers().map(x => String(x || '').trim()).includes(s); }
/* a service note typed here, read beside the committed ones */
function localServiceNotes(){
 const pr = fenceCostFor('labour');
 return (S.serviceNotes || []).filter(n => n && n.id && !tombedHere(n.id)).map(n => {
  const w = weekOf(n.date || ''), week = n.week || (w ? w.sheet : null), bad = [];
  if (!n.date) bad.push('no date');
  const h = Number(n.labour_hours); if (!(h > 0)) bad.push('no hours above zero');
  if (!n.recorded_by) bad.push('nobody named as recording it');
  const cost = h > 0 && pr.value != null ? Math.round(h * pr.value * 100) / 100 : null;
  return Object.assign({}, n, {week, docket_no: n.note_no, book: 'green', labour_hours: h > 0 ? h : null, cost, cost_rate: pr.value, cost_rate_source: pr.source,
   usable: !bad.length, problems: bad, _where: 'local', origin: 'captured'});
 });
}
function nextNoteId(){ return nextIdFor('N', [S.serviceNotes, FCOM.service_notes]); }
function recordServiceNote(f){
 if (!mayWrite('a service note')) return null;
 const who = whoAmI(); if (!who) return null;
 const no = String(f.note_no || '').trim().replace(/\s+/g, '');
 if (!/^\d{3,8}$/.test(no)) { flash('The service note number is the red number at the top right - 24461, for example.'); return null; }
 if (paperNoTaken(no)) { flash('Paper ' + no + ' is already on the books - nothing recorded.'); return null; }
 if (!f.date) { flash('A date is needed - it is what puts the note in a week.'); return null; }
 const h = Number(String(f.labour_hours || '').trim());
 if (!(h > 0)) { flash('Put the crew\'s hours on it - a service note is labour, and that is what Advanced bill.'); return null; }
 if (!String(f.location || '').trim()) { flash('Say where the crew worked - the site address on the note.'); return null; }
 const w = weekOf(f.date);
 const n = {id: nextNoteId(), note_no: no, date: f.date, week: w ? w.sheet : null, crew: 'Advanced Temporary Fencing (Environmental Services)',
  location: String(f.location).trim(), crew_note: String(f.crew_note || '').trim() || null, note: String(f.note || '').trim() || null,
  metres: Number(String(f.metres || '').trim()) > 0 ? Number(String(f.metres || '').trim()) : null,
  signed_by: String(f.signed_by || '').trim() || null, order_no: null,
  source: 'Advanced Environmental Services service note ' + no + ', signed paper photographed on site', labour_hours: Math.round(h * 100) / 100,
  recorded_by: who, recorded_on: todayIso(), at: new Date().toISOString()};
 S.serviceNotes = (S.serviceNotes || []).concat([n]);
 stampIt('serviceNotes', n.id, who); bump();
 const pr = fenceCostFor('labour');
 flash('Service note ' + no + ' recorded as ' + n.id + ' - ' + hoursTxt(n.labour_hours) + ' h' + (pr.value != null ? ', ' + money(Math.round(n.labour_hours * pr.value * 100) / 100) + ' paid to Advanced' : ', no labour rate yet') + '. By ' + who + '.');
 return n;
}
/* a hire agreement: recordDocket's save, with the paper's own details kept on the docket */
function recordHireAgreement(f){
 if (!mayWrite('a hire agreement')) return null;
 const no = String(f.docket_no || '').trim().replace(/\s+/g, '');
 if (!/^\d{3,8}$/.test(no)) { flash('The hire agreement number is the red number at the top right - 36563, for example.'); return null; }
 if (paperNoTaken(no)) { flash('Paper ' + no + ' is already on the books - nothing recorded.'); return null; }
 const d = recordDocket({date: f.date, location: f.location, map_ref: f.map_ref || null, crew: 'Advanced Temporary Fencing', docket_no: no, quantities: f.quantities || {}, note: f.note || ''});
 if (!d) return null;
 const parts = {}; Object.entries(f.components || {}).forEach(([k, v]) => { const n = Number(String(v).trim()); if (String(v).trim() !== '' && n > 0) parts[k] = n; });
 const extra = {components: Object.keys(parts).length ? parts : null, signed_by: String(f.signed_by || '').trim() || null, scope: 'programme',
  source: 'Advanced Temporary Fencing hire agreement ' + no + ', signed paper photographed on site', origin: 'captured'};
 S.fenceDockets = (S.fenceDockets || []).map(x => x.id === d.id ? Object.assign({}, x, extra) : x);
 bump();
 const c = costDocket(d);
 flash('Hire agreement ' + no + ' recorded as ' + d.id + ' - ' + (money(c.cost_total) || '$0.00') + ' charged at the 2026 card, ' + (money(c.paid_total) || '$0.00') + ' paid to Advanced. By ' + d.recorded_by + '.');
 return Object.assign({}, d, extra);
}
function paperFormsHtml(ro){
 const dis = ro ? ' disabled' : '', td = todayIso();
 const head = `<div class="hubtitle"><h3>Record a signed paper</h3><span class="w" style="font-size:12px;color:var(--mute)">the pink copy the crew hand over - typed here, it is on every copy of the record</span></div>`;
 const btns = `<div class="invchips"><button type="button" class="chip invdisc${PAPER.open === 'red' ? ' on' : ''}" data-paper="red"${dis}>Hire agreement (red book)</button><button type="button" class="chip invdisc${PAPER.open === 'green' ? ' on' : ''}" data-paper="green"${dis}>Service note (green book)</button></div>`;
 let body = '';
 if (PAPER.open === 'red') body = `<div class="form paperform" id="paperRed">
  <div class="row2"><div class="f"><label for="haNo">Hire agreement no.</label><input id="haNo" inputmode="numeric" placeholder="36563"${dis}></div>
  <div class="f"><label for="haDate">Installation date</label><input id="haDate" type="date" value="${esc(td)}"${dis}></div></div>
  <div class="row2"><div class="f"><label for="haWhere">Site address (where)</label><input id="haWhere" maxlength="120" placeholder="S18 grandstand to Meriton"${dis}></div>
  <div class="f"><label for="haRef">Map reference</label><input id="haRef" maxlength="20" placeholder="S18"${dis}></div></div>
  <label>What was done, per card line</label>
  <div class="papergrid">${paperCols().map(c => `<div class="f"><label for="haq_${esc(c.key)}">${esc(c.name_as_written || c.name || c.key)} <span class="w">(${esc(c.unit || '')})</span></label><input id="haq_${esc(c.key)}" data-haq="${esc(c.key)}" inputmode="decimal" placeholder="0"${dis}></div>`).join('')}</div>
  <label>Components on the paper</label>
  <div class="papergrid">${PAPER_PARTS.map(([k, w]) => `<div class="f"><label for="hap_${k}">${esc(w)}</label><input id="hap_${k}" data-hap="${k}" inputmode="numeric" placeholder="0"${dis}></div>`).join('')}</div>
  <div class="row2"><div class="f"><label for="haSigned">Signed by (Advanced)</label><input id="haSigned" maxlength="40" placeholder="Brenden"${dis}></div>
  <div class="f"><label for="haNote">Notes relating to installation</label><input id="haNote" maxlength="200" placeholder="as written on the paper"${dis}></div></div>
  <div class="chdrow"><button type="button" class="btn primary" id="haSave"${dis}>Record the hire agreement</button><button type="button" class="btn ghost" data-paper="off">Close</button></div>
  <div class="hint">It is charged to the V8s at the 2026 card and costed at Advanced's sheet like every docket. CC barrier: the card has two lines, event and demarcation - use the one the paper or the plan says; if the paper only says CC Barrier, put it under the one you know it is and say so in the notes.</div></div>`;
 if (PAPER.open === 'green') body = `<div class="form paperform" id="paperGreen">
  <div class="row2"><div class="f"><label for="snNo">Service note no.</label><input id="snNo" inputmode="numeric" placeholder="24461"${dis}></div>
  <div class="f"><label for="snDate">Date</label><input id="snDate" type="date" value="${esc(td)}"${dis}></div></div>
  <div class="row2"><div class="f"><label for="snWhere">Site address (where)</label><input id="snWhere" maxlength="120" placeholder="S08 construction zone"${dis}></div>
  <div class="f"><label for="snHours">Labour hours (total)</label><input id="snHours" inputmode="decimal" placeholder="1"${dis}></div></div>
  <div class="row2"><div class="f"><label for="snCrew">As the note writes the labour</label><input id="snCrew" maxlength="80" placeholder="4 men x 15 mins each"${dis}></div>
  <div class="f"><label for="snMetres">Metres moved, if the note says</label><input id="snMetres" inputmode="decimal" placeholder="32.5"${dis}></div></div>
  <div class="row2"><div class="f"><label for="snNote">What the note says</label><input id="snNote" maxlength="200" placeholder="32.5 m relocated to the stair entrance"${dis}></div>
  <div class="f"><label for="snSigned">Signed by (Advanced)</label><input id="snSigned" maxlength="40" placeholder="Brenden"${dis}></div></div>
  <div class="chdrow"><button type="button" class="btn primary" id="snSave"${dis}>Record the service note</button><button type="button" class="btn ghost" data-paper="off">Close</button></div>
  <div class="hint">Cost only: the hours are paid to Advanced at their Labour rate and charged to the V8s inside the fencing installation rates, never on a line of their own. Metres moved are kept on the note for the record; they are not a second charge.</div></div>`;
 return `<div class="card papercard nosfold" id="paperCard">${head}${btns}${body}</div>`;
}
function paperBind(pane){
 pane.querySelectorAll('[data-paper]').forEach(b => b.onclick = () => { const v = b.dataset.paper; PAPER.open = v === 'off' ? null : (PAPER.open === v ? null : v); renderFencing(); if (PAPER.open) setTimeout(() => { const c = $('#paperCard'); if (c) { try { c.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (e) { c.scrollIntoView(); } } }, 0); });
 const v = id => { const el = pane.querySelector('#' + id); return el ? el.value.trim() : ''; };
 const ha = pane.querySelector('#haSave'); if (ha) ha.onclick = () => {
  const q = {}; pane.querySelectorAll('[data-haq]').forEach(i => { if (i.value.trim() !== '') q[i.dataset.haq] = i.value.trim(); });
  const parts = {}; pane.querySelectorAll('[data-hap]').forEach(i => { if (i.value.trim() !== '') parts[i.dataset.hap] = i.value.trim(); });
  const bad = Object.entries(q).find(([k, x]) => !(Number(x) >= 0) || !Number.isFinite(Number(x))); if (bad) { flash('"' + bad[1] + '" is not a quantity.'); return; }
  const d = recordHireAgreement({docket_no: v('haNo'), date: v('haDate'), location: v('haWhere'), map_ref: v('haRef'), quantities: q, components: parts, signed_by: v('haSigned'), note: v('haNote')});
  if (d) { PAPER.open = null; renderFencing(); } };
 const sn = pane.querySelector('#snSave'); if (sn) sn.onclick = () => {
  const n = recordServiceNote({note_no: v('snNo'), date: v('snDate'), location: v('snWhere'), labour_hours: v('snHours'), crew_note: v('snCrew'), metres: v('snMetres'), note: v('snNote'), signed_by: v('snSigned')});
  if (n) { PAPER.open = null; renderFencing(); } };
 pane.querySelectorAll('[data-sndel]').forEach(b => b.onclick = () => {
  const id = b.dataset.sndel; const who = whoAmI(); if (!who) return;
  if (!confirm('Set aside service note ' + id + '? It is kept, with your name and the time, and can be put back from Tools → Edit.')) return;
  if (!setAside('serviceNotes', id, who)) return;
  bump(); flash(id + ' set aside by ' + who + ' — Put back is under Tools → Edit.'); renderFencing(); });
}
