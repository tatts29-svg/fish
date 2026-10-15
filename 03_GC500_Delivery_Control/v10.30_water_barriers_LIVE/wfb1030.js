/* Author: Andrew Fisher. Water barriers, v10.30 (15 Oct 2026: "Water barriers is missing its own section. What's been
   completed and what has not has no set up like buildings and toilets. Only looking at the Coates.")
   - The Today tab's Work progress board gets a Water barriers card, counted the board's own way: the schedule's WB
     quantities, Done = the barriers of every reference ticked complete on the record, Left = the rest.
   - iEDM's water barrier programme TP02-26003-03 (DATA.wfb_programme1030) gives each reference its install and removal
     date and time, who installs, who fills, and the comments as written: on the board's rows and in the drawer.
   - Downer's rows are not Coates work: kept in the data, named in the notes, never counted.
   Nothing here writes to the record. */
(function (W) {
 'use strict';
 const esc = s => (typeof W.esc === 'function' ? W.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])));
 const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
 function dmy(iso){ if (!iso) return 'date to confirm'; const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : DOW[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
 function P(){ return (typeof DATA !== 'undefined' && DATA.wfb_programme1030) || null; }
 function review(){ return (typeof DATA !== 'undefined' && DATA.wfb_review1030) || {}; }
 function rowOf(key){ const p = P(); return p ? (p.rows || []).find(r => r.ref === key) || null : null; }
 function when(x){ return dmy(x && x.date) + (x && x.time ? ' ' + x.time : ''); }
 /* one line for the board's row detail */
 function words(key){
  const r = rowOf(key); if (!r) return '';
  const bits = ['Programme: install ' + when(r.install) + (r.install.by ? ' · ' + r.install.by : '')];
  if (r.fill && r.fill.time) bits.push('fill ' + r.fill.time + (r.fill.by ? ' · ' + r.fill.by : ''));
  bits.push('remove ' + when(r.removal));
  return bits.join(' · ') + '.';
 }
 /* the card's notes */
 function notes(){
  const p = P(); if (!p) return ['The water barrier programme TP02-26003-03 is not on this page yet.'];
  const rv = review(), out = [];
  out.push('Counted from the schedule\'s WB quantities, Coates installs only. Install and removal dates and times are iEDM\'s water barrier programme TP02-26003-03, read ' + p.read_on + '. Downer\'s ' + p.downer_rows + ' rows (' + p.downer_barriers + ' barriers) are not Coates work and are left out.');
  if ((rv.no_reference || []).length) out.push('On the programme with no reference on the Coates schedule: ' + rv.no_reference.map(x => x.ref + ' · ' + x.quantity + ' at ' + x.location).join('; ') + '.');
  if ((rv.quantity_differs || []).length) out.push('Quantities that differ between the schedule, the programme and the contract: ' + rv.quantity_differs.map(x => x.ref + ' schedule ' + x.schedule + ' · programme ' + x.programme + (x.contract != null ? ' · contract ' + x.contract : '')).join('; ') + '. Nothing is reconciled here.');
  return out;
 }
 /* the drawer's programme card, before "Where it is" */
 function section(key){
  const r = rowOf(key), p = P(); if (!r || !p) return null;
  const a = typeof assetOf === 'function' ? assetOf(key) : null;
  const sched = a && typeof chargeLines === 'function' ? (chargeLines(a) || []).reduce((n, l) => n + (typeof l.quantity === 'number' ? l.quantity : 0), 0) : null;
  const lines = (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).filter(x => x.match && x.match.to === 'asset' && x.match.key === key && !x.charge_line);
  const contract = lines.length ? lines.map(x => 'Contract ' + x.rental_contract + ' line ' + x.line + ' · ' + x.quantity + ' · ' + x.status_as_written + (x.start_date ? ' · delivered ' + dmy(x.start_date) : '')).join('<br>') : 'no contract line joined';
  const qty = [r.quantity + ' on the programme', sched != null ? sched + ' on the schedule' : null, lines.length ? lines.reduce((n, x) => n + (x.quantity || 0), 0) + ' on the contract' : null].filter(Boolean).join(' · ');
  const sec = document.createElement('section'); sec.className = 'card hubcard wfb1030 nosfold'; sec.dataset.wfb1030 = key;
  sec.innerHTML = '<div class="hubtitle"><h3>Water barrier programme</h3><span class="chip ok">TP02-26003-03 · read ' + esc(p.read_on) + '</span></div>'
   + '<dl class="kv">'
   + '<dt>Location</dt><dd><b>' + esc(r.location) + '</b>' + (r.zone ? '<small>zone ' + esc(r.zone) + '</small>' : '') + '</dd>'
   + '<dt>Barriers</dt><dd>' + esc(qty) + '</dd>'
   + '<dt>Install</dt><dd><b>' + esc(when(r.install)) + '</b>' + (r.install.by ? ' · ' + esc(r.install.by) : '') + (r.install.comment ? '<small>' + esc(r.install.comment) + '</small>' : '') + '</dd>'
   + '<dt>Water truck fill</dt><dd>' + (r.fill && r.fill.time ? esc(r.fill.time) + (r.fill.by ? ' · ' + esc(r.fill.by) : '') : 'not on the programme') + '</dd>'
   + '<dt>Removal</dt><dd><b>' + esc(when(r.removal)) + '</b>' + (r.removal.comment ? '<small>' + esc(r.removal.comment) + '</small>' : '') + '</dd>'
   + '<dt>Days on hire</dt><dd>' + (r.days_hire != null ? esc(String(r.days_hire)) + ' days' : '—') + (r.grid && r.grid.first ? ' · ' + esc(dmy(r.grid.first)) + ' to ' + esc(dmy(r.grid.last)) : '') + (r.fms_quantity != null ? ' · FMS ' + esc(String(r.fms_quantity)) : '') + '</dd>'
   + '<dt>Contract</dt><dd>' + contract + '</dd>'
   + '</dl>';
  return sec;
 }
 function place(key){
  const dr = document.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return;
  if (dr.querySelector('[data-wfb1030="' + key + '"]')) return;
  const old = dr.querySelector('[data-wfb1030]'); if (old) old.remove();
  const sec = section(key); if (!sec) return;
  const where = dr.querySelector('.where816');
  if (where && where.parentNode) where.parentNode.insertBefore(sec, where);
  else { const h = dr.querySelector('.hubcard'); if (h && h.parentNode) h.parentNode.insertBefore(sec, h); }
 }
 if (typeof W.openAsset === 'function') {
  const orig = W.openAsset;
  W.openAsset = function (key, opts) { const r = orig.apply(this, arguments); try { place(key); requestAnimationFrame(() => place(key)); setTimeout(() => place(key), 500); } catch (e) {} return r; };
 }
 W.wfbWords1030 = words; W.wfbNotes1030 = notes; W.wfbRow1030 = rowOf; W.wfbPlace1030 = place;
})(window);
