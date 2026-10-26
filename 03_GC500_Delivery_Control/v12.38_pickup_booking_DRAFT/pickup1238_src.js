<style id="pickup1238-style">
/* v12.38 - book the pick-up: a date and a time on every Demob card, kept on the shared record; the booked pick-ups by day */
#pane-demob .bk1238{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0 0 8px}
#pane-demob .bk1238.bare{margin:0 0 6px}
#pane-demob .bk1238 .bw1238{color:#a3b7bf;font:600 12.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .bk1238 .bw1238 b{color:#eef6f8;font-weight:800}
#pane-demob .bk1238.on .bw1238 b{color:#ffb37a}
#pane-demob .bk1238.on .bw1238 i{font-style:normal;font-weight:700;color:#ffcf7a}
#pane-demob .bk1238 small{flex-basis:100%;margin-top:-2px;color:#8fa8b2;font:500 11.5px/1.35 Inter,Arial,sans-serif}
#pane-demob button.bb1238{appearance:none;-webkit-appearance:none;min-height:32px;padding:7px 12px;border:1.5px solid #ff8a3a;border-radius:999px;background:#ff8a3a1f;color:#ffd2b0;font:800 12px/1 Inter,Arial,sans-serif;letter-spacing:.02em;cursor:pointer;white-space:nowrap}
#pane-demob button.bb1238:hover,#pane-demob button.bb1238:focus-visible{background:#ff8a3a38;outline:none}
#pane-demob .bk1238.on button.bb1238{border-color:#5d7782;background:transparent;color:#cfe0e6}
body:not([data-cap="edit"]) #pane-demob button.bb1238,body:not([data-cap="edit"]) #pane-demob .bk1238.bare{display:none!important}
/* v12.36's size and weight pills: the source tag ("guide") stays in one piece on a phone */
#pane-demob .pp1236 em{white-space:nowrap}
/* the booked pick-ups, by day */
#pane-demob .bp1238{margin:0 0 14px;padding:14px 16px 14px;border:1px solid #ffffff14;border-radius:18px;background:linear-gradient(180deg,#14262d,#0f1d22);color:#eef6f8}
#pane-demob .bp1238 header{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
#pane-demob .bp1238 h3{margin:0;color:#ffb37a;font:900 13px/1.2 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}
#pane-demob .bp1238 header span{color:#a3b7bf;font:600 12.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .bp1238 header span b{color:#eef6f8}
#pane-demob .bp1238 .bd1238{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px 16px;margin-top:12px}
#pane-demob .bp1238 h4{margin:0 0 6px;color:#eef6f8;font:800 13px/1.2 Inter,Arial,sans-serif}
#pane-demob .bp1238 h4 small{margin-left:8px;color:#8fa8b2;font-weight:600}
#pane-demob .bp1238 ul{display:grid;gap:6px;margin:0;padding:0;list-style:none}
#pane-demob .bp1238 li button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:54px minmax(0,1fr) auto;align-items:center;gap:3px 10px;width:100%;padding:9px 11px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff0a;cursor:pointer}
#pane-demob .bp1238 li button:hover,#pane-demob .bp1238 li button:focus-visible{background:#ffffff16}
#pane-demob .bp1238 li b{color:#ffb37a;font:900 15px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
#pane-demob .bp1238 li span{overflow:hidden;color:#eef6f8;font:700 13px/1.25 Inter,Arial,sans-serif;text-overflow:ellipsis;white-space:nowrap}
#pane-demob .bp1238 li i{padding:4px 8px;border-radius:999px;background:#5d778233;color:#cfe0e6;font:800 10.5px/1 Inter,Arial,sans-serif;font-style:normal;white-space:nowrap}
#pane-demob .bp1238 li i.ready{background:#f5a52433;color:#ffcf7a}
#pane-demob .bp1238 li i.not{background:#e5463b33;color:#ff9a90}
#pane-demob .bp1238 li i.part{background:#2ec4a633;color:#8ff0db}
#pane-demob .bp1238 li em{grid-column:2/4;color:#8fa8b2;font:500 11.5px/1.3 Inter,Arial,sans-serif;font-style:normal}
#pane-demob .bp1238 li.past b{color:#ffcf7a}
#pane-demob .bp1238 .be1238{margin:8px 0 0;color:#a3b7bf;font:500 12.5px/1.45 Inter,Arial,sans-serif}
#pane-demob .bp1238 .be1238 b{color:#ffd2b0}
@media (max-width:600px){#pane-demob .bp1238{padding:12px 12px;border-radius:16px}#pane-demob .bp1238 .bd1238{grid-template-columns:1fr}}
/* the booking sheet */
dialog.bkd1238{width:calc(100% - 24px);max-width:440px;padding:0;border:0;border-radius:20px;background:#13242b;color:#eef6f8;box-shadow:0 24px 80px #000a}
dialog.bkd1238::backdrop{background:#0b1418cc}
dialog.bkd1238.fb1238{position:fixed;inset:auto 0 0 0;z-index:2147483000;margin:0 auto}
.bkd1238 form{display:grid;gap:12px;padding:18px 18px 16px}
.bkd1238 h3{margin:0;color:#eef6f8;font:900 19px/1.2 Inter,Arial,sans-serif;outline:none}
.bkd1238 .ws1238{margin:-6px 0 0;color:#a3b7bf;font:600 13px/1.35 Inter,Arial,sans-serif}
.bkd1238 .rw1238{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bkd1238 label{display:grid;gap:6px;color:#8fa8b2;font:800 11px/1 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.bkd1238 label span{color:#5d7782;letter-spacing:0;text-transform:none;font-weight:600}
.bkd1238 input{box-sizing:border-box;width:100%;min-height:46px;padding:11px 12px;border:1.5px solid #2c3b43;border-radius:12px;background:#0c181d;color:#eef6f8;font:700 16px/1.2 Inter,Arial,sans-serif;color-scheme:dark}
.bkd1238 input:focus{border-color:#ff8a3a;outline:none}
.bkd1238 .er1238{min-height:1em;margin:0;color:#ff9a90;font:700 13px/1.3 Inter,Arial,sans-serif}
.bkd1238 .by1238{margin:0;color:#8fa8b2;font:500 12px/1.4 Inter,Arial,sans-serif}
.bkd1238 .ac1238{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
.bkd1238 button{appearance:none;-webkit-appearance:none;min-height:44px;padding:12px 16px;border:1.5px solid #2c3b43;border-radius:999px;background:transparent;color:#cfe0e6;font:800 14px/1 Inter,Arial,sans-serif;cursor:pointer}
.bkd1238 button.sv1238{border-color:#ff6a13;background:#ff6a13;color:#fff}
.bkd1238 button.cl1238{margin-right:auto;border-color:#e5463b66;color:#ff9a90}
.bkd1238 button[hidden]{display:none}
@media (max-width:600px){dialog.bkd1238{width:100%;max-width:none;margin:auto auto 0;border-radius:20px 20px 0 0}.bkd1238 form{padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}}
@media print{#pane-demob .bp1238,#pane-demob button.bb1238{display:none!important}}
</style>
<script id="pickup1238-script">
/* Author: Andrew Fisher. v12.38 - book the pick-up on every Demob card.
   Andrew, 26 Oct 2026: "i want a spot someon can add the date and time when it will be picked up"; "lets not pre date anything
   the pick up data is buil;t from this".
   On the edit link every card on the Demob tab has a Book pick-up button: a date, a time and a note (who is collecting), saved
   on the reference's delivery record as its own field (pickup1238_at, _note, _by, _set) with a history, merged on its own clock
   (when it was set) like the Ready tick; Clear takes it off, and the clearing is a dated event too, so it wins over an older
   booking on another copy. The view link shows the booking and cannot change it. Nothing is pre-dated: a card with no booking
   says "to be booked", and the booked pick-ups list above the groups is built only from what people have booked.
   No departure, Ready, Emptied, charge, QR or tracker change. */
(function (W) {
'use strict';
const D = W.document;
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ok = v => typeof v === 'string' && v !== '' && Number.isFinite(Date.parse(v));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
/* a stamp read in Queensland time (no daylight saving: always +10:00) */
function q(v) { const d = new Date(Date.parse(v) + 10 * 3600e3); return {iso: d.toISOString().slice(0, 10), hm: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()), day: DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]}; }
function when(v) { if (!ok(v)) return ''; const x = q(v); return x.day + ' · ' + x.hm; }
function dayOf(iso) { const d = new Date(iso + 'T12:00:00Z'); return isNaN(d) ? String(iso) : DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
function today() { try { if (typeof todayIso === 'function') return todayIso(); } catch (x) {} return q(new Date().toISOString()).iso; }
const stampOf = (date, time) => /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) ? date + 'T' + time + ':00+10:00' : '';
const editing = () => { try { return typeof canEdit === 'function' && canEdit(); } catch (x) { return false; } };

/* ---- the booking, on this browser's copy of the shared record (merged with the service's copy as it syncs) ---- */
function booking(key) {
 const d = ((typeof S !== 'undefined' && S.delivery) || {})[key] || {};
 if (typeof d.pickup1238_at !== 'string') return null;
 return {at: ok(d.pickup1238_at) ? d.pickup1238_at : '', note: String(d.pickup1238_note || ''), by: String(d.pickup1238_by || ''), set: String(d.pickup1238_set || '')};
}
function booked(key) { const b = booking(key); return b && b.at ? b : null; }
function setPickup(key, at, note) {
 if (!mayWrite('the pick-up booking')) return false;
 if (!isRef(key)) { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); return false; }
 if (at && !ok(at)) { flash('That pick-up date and time could not be read - nothing recorded.'); return false; }
 const who = whoAmI(); if (!who) return false;
 S.delivery = S.delivery || {};
 const d = S.delivery[key] || (S.delivery[key] = {}), n = at ? String(note || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
 /* the change is later than the booking it replaces, whatever this device's clock says */
 let now = new Date().toISOString(); if (ok(d.pickup1238_set) && String(d.pickup1238_set) >= now) now = new Date(Date.parse(d.pickup1238_set) + 1).toISOString();
 d.pickup1238_at = at || ''; d.pickup1238_note = n; d.pickup1238_by = who; d.pickup1238_set = now;
 d.pickup1238_history = (d.pickup1238_history || []).concat([{pickup: at || '', note: n, by: who, at: now}]).slice(-400);
 bump(); try { buzz(at ? 40 : 20); } catch (x) {}
 flash(at ? key + ' pick-up booked for ' + when(at) + (n ? ' (' + n + ')' : '') + ' - recorded by ' + who + '.' : key + ' pick-up booking cleared - recorded by ' + who + '.');
 return true;
}

/* ---- what a reference is and where it stands, for the sheet and the list ---- */
function rowOf(key) { try { return demob816().refs.find(r => r.key === key) || null; } catch (x) { return null; } }
function whatOf(key) {
 const r = rowOf(key); let w = '';
 if (r) { try { w = DemobScope1017.description(r, demobDescription988); } catch (x) { w = ''; } }
 if (!w) { let a = null; try { a = assetOf(key); } catch (x) { a = null; } w = (a && (a.name || a.product)) || ''; }
 return String(w || '');
}
function nosOf(key) { const r = rowOf(key); if (!r) return []; try { const s = Ready1231.specs(r) || {}; return (s.assetNos || s.nos || []).slice(); } catch (x) { return []; } }
function stateOf(key) {
 const r = rowOf(key); let st = null;
 if (r) { try { st = W.Ready1231 ? Ready1231.state(r) : null; } catch (x) { st = null; } }
 if (!st) return {k: 'unchecked', w: 'Not checked yet'};
 if (st.s === 'gone') return {k: 'gone', w: 'Picked up'};
 const part = !!(st.part && st.part.collected > 0 && !st.part.complete);
 if (part) return {k: 'part', w: st.part.collected + ' picked up · ' + st.part.remaining + ' to go'};
 if (st.s === 'ready') return {k: 'ready', w: 'Ready'};
 if (st.unchecked) return {k: 'unchecked', w: 'Not checked yet'};
 return {k: 'not', w: 'Not ready'};
}

/* ---- the spot on each card: in the everything view always (Left site, the booking, or to be booked); in a day's list only the
   booking, or the button on the edit link, so the plan's own day stays as it was ---- */
function html(r, ps, everything) {
 const key = r && r.key; if (!key) return '';
 if (ps === 'gone') return everything ? '<span class="bk1236 bk1238 gone"><span class="bw1238"><b>Left site</b></span></span>' : '';
 const b = booked(key), k = e(key);
 const btn = '<button type="button" class="bb1238" data-book1238="' + k + '">' + (b ? 'Change' : 'Book pick-up') + '</button>';
 if (!b) return everything ? '<span class="bk1236 bk1238" data-bk1238="' + k + '"><span class="bw1238">Pick-up time: <b>to be booked</b></span>' + btn + '</span>'
  : '<span class="bk1236 bk1238 bare" data-bk1238="' + k + '">' + btn + '</span>';
 const past = Date.parse(b.at) < Date.now();
 return '<span class="bk1236 bk1238 on' + (past ? ' past' : '') + '" data-bk1238="' + k + '"><span class="bw1238">Pick-up booked: <b>' + e(when(b.at)) + '</b>' + (past ? ' <i>· time passed</i>' : '') + '</span>' + btn +
  '<small>' + (b.note ? e(b.note) + ' · ' : '') + 'booked by ' + e(b.by || 'someone') + (past ? ' · change it if it moved' : '') + '</small></span>';
}

/* ---- the booked pick-ups, by day and time: built only from what people have booked ---- */
function list() {
 const out = [];
 Object.keys((typeof S !== 'undefined' && S.delivery) || {}).forEach(key => { const b = booked(key); if (b) out.push({key, at: b.at, note: b.note, by: b.by}); });
 return out.sort((x, y) => Date.parse(x.at) - Date.parse(y.at) || x.key.localeCompare(y.key, undefined, {numeric: true}));
}
function panel() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const card = pane.querySelector('.dmday816'); if (!card) return;
 const old = card.querySelector('.bp1238');
 if (typeof DM816 === 'undefined' || DM816.view !== 'everything') { if (old) old.remove(); return; }
 const L = list().map(x => Object.assign(x, {st: stateOf(x.key)})).filter(x => x.st.k !== 'gone');
 const onSite = [...new Set([...card.querySelectorAll('tr[data-row816]')].filter(tr => tr.dataset.ps1236 !== 'gone').map(tr => tr.dataset.row816))];
 const toBook = onSite.filter(k => !booked(k)).length, now = Date.now(), ed = editing();
 const sig = JSON.stringify([L.map(x => [x.key, x.at, x.note, x.st.k]), toBook, Math.floor(now / 60000), ed]);
 if (old && old.dataset.sig1238 === sig) return;
 const byDay = new Map(); L.forEach(x => { const d = q(x.at).iso; if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(x); });
 const td = today();
 const days = [...byDay.keys()].sort().map(d => { const xs = byDay.get(d);
  return '<div class="dy1238" data-day1238="' + e(d) + '"><h4>' + e(dayOf(d)) + (d === td ? ' · today' : '') + '<small>' + xs.length + ' pick-up' + (xs.length > 1 ? 's' : '') + '</small></h4><ul>' +
   xs.map(x => { const past = Date.parse(x.at) < now, note = [x.note, past ? 'time passed · change it if it moved' : ''].filter(Boolean).join(' · ');
    return '<li' + (past ? ' class="past"' : '') + '><button type="button" data-bpgo1238="' + e(x.key) + '"><b>' + e(q(x.at).hm) + '</b><span>' + e(x.key + (whatOf(x.key) ? ' · ' + whatOf(x.key) : '')) + '</span><i class="' + x.st.k + '">' + e(x.st.w) + '</i>' + (note ? '<em>' + e(note) + '</em>' : '') + '</button></li>'; }).join('') + '</ul></div>'; }).join('');
 const sec = D.createElement('section');
 sec.className = 'bp1238'; sec.setAttribute('aria-labelledby', 'bph1238'); sec.dataset.sig1238 = sig;
 sec.innerHTML = '<header><h3 id="bph1238">Booked pick-ups</h3><span><b>' + L.length + '</b> booked · <b>' + toBook + '</b> still to book</span></header>' +
  (L.length ? '<div class="bd1238">' + days + '</div>'
   : '<p class="be1238">No pick-ups booked yet. ' + (ed ? 'Tap <b>Book pick-up</b> on any card below to add the date and time it will be picked up.' : 'When someone books a pick-up on the edit link, it shows here by day and time.') + ' Nothing is pre-dated.</p>');
 if (old) old.replaceWith(sec);
 else { const at = card.querySelector('.sum1231') || card.querySelector('.ov1236') || card.querySelector('.sec1231'); if (at && at.parentNode) at.before(sec); }
}

/* ---- the booking sheet: outside the tab, so a redraw of the list (someone else's tick arriving) never wipes what is typed ---- */
let dlg = null, cur = null;
function sheet() {
 if (dlg && D.body.contains(dlg)) return dlg;
 dlg = D.createElement('dialog'); dlg.className = 'bkd1238'; dlg.setAttribute('aria-labelledby', 'bkh1238');
 dlg.innerHTML = '<form method="dialog" novalidate><h3 id="bkh1238" tabindex="-1" autofocus>Book the pick-up</h3><p class="ws1238"></p>' +
  '<div class="rw1238"><label>Date<input type="date" name="d1238" required></label><label>Time<input type="time" name="t1238" step="300" required></label></div>' +
  '<label>Who is collecting, or a note <span>(optional)</span><input type="text" name="n1238" maxlength="80" autocomplete="off" placeholder="e.g. Coates truck, Event Portables, the yard"></label>' +
  '<p class="er1238" role="alert"></p><p class="by1238"></p>' +
  '<div class="ac1238"><button type="button" class="cl1238" data-x1238="clear">Clear booking</button><button type="button" data-x1238="cancel">Cancel</button><button type="submit" class="sv1238">Save booking</button></div></form>';
 D.body.appendChild(dlg);
 dlg.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); save(); });
 dlg.addEventListener('click', ev => { const b = ev.target && ev.target.closest ? ev.target.closest('[data-x1238]') : null;
  if (b) { ev.preventDefault(); if (b.getAttribute('data-x1238') === 'clear') clear(); else close(); return; }
  if (ev.target === dlg) close(); });
 dlg.addEventListener('cancel', ev => { ev.preventDefault(); close(); });
 return dlg;
}
function open(key) {
 if (!mayWrite('the pick-up booking')) return false;
 if (!isRef(key)) { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); return false; }
 const who = whoAmI(); if (!who) return false;
 const d = sheet(), f = d.querySelector('form'), b = booked(key), nos = nosOf(key), what = whatOf(key);
 cur = key;
 d.querySelector('h3').textContent = b ? 'Change the pick-up' : 'Book the pick-up';
 d.querySelector('.ws1238').textContent = key + (what ? ' · ' + what : '') + (nos.length ? ' · Asset no. ' + nos[0] + (nos.length > 1 ? ' +' + (nos.length - 1) + ' more' : '') : '');
 f.elements.d1238.value = b ? q(b.at).iso : today(); f.elements.t1238.value = b ? q(b.at).hm : ''; f.elements.n1238.value = b ? b.note : '';
 f.querySelector('.cl1238').hidden = !b;
 d.querySelector('.er1238').textContent = '';
 d.querySelector('.by1238').textContent = 'Saved on the shared record as ' + who + (b ? '. Booked now for ' + when(b.at) + ' by ' + (b.by || 'someone') : '') + '.';
 try { if (typeof d.showModal === 'function') d.showModal(); else throw Error('no modal'); } catch (x) { d.setAttribute('open', ''); d.classList.add('fb1238'); }
 return true;
}
function save() {
 if (!dlg || !cur) return false;
 const f = dlg.querySelector('form'), er = dlg.querySelector('.er1238'), date = f.elements.d1238.value, time = String(f.elements.t1238.value || '').slice(0, 5);
 if (!date || !time) { er.textContent = !date && !time ? 'Pick the date and the time it will be picked up.' : !date ? 'Pick the date it will be picked up.' : 'Pick the time it will be picked up.'; try { (date ? f.elements.t1238 : f.elements.d1238).focus(); } catch (x) {} return false; }
 const at = stampOf(date, time);
 if (!ok(at)) { er.textContent = 'That date and time could not be read - try again.'; return false; }
 const key = cur, note = f.elements.n1238.value; close();
 return setPickup(key, at, note);
}
function clear() {
 if (!cur) return false;
 const key = cur; if (!W.confirm('Clear the pick-up booking for ' + key + '?')) return false;
 close(); return setPickup(key, '', '');
}
function close() { cur = null; try { if (dlg) { if (dlg.open && typeof dlg.close === 'function') dlg.close(); dlg.removeAttribute('open'); dlg.classList.remove('fb1238'); } } catch (x) {} }

/* ---- taps ---- */
D.addEventListener('click', ev => {
 const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
 const b = t.closest('#pane-demob [data-book1238]');
 if (b) { ev.preventDefault(); ev.stopPropagation(); open(b.getAttribute('data-book1238')); return; }
 const g = t.closest('#pane-demob [data-bpgo1238]');
 if (g) { ev.preventDefault(); ev.stopPropagation(); try { if (W.DemobMap1236) DemobMap1236.goLine(g.getAttribute('data-bpgo1238')); } catch (x) {} }
}, true);

/* ---- after each drawing of the Demob tab ---- */
if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function () { const v = before.apply(this, arguments); try { panel(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }

W.Pickup1238 = Object.freeze({booking, booked, setPickup, open, save, close, html, list, when, release: 'v12.38'});
try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map) RENDER_MEMO.delete('demob816'); } catch (x) {}
try { const p = D.getElementById('pane-demob'); if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816(); } catch (x) {}
})(window);
</script>
