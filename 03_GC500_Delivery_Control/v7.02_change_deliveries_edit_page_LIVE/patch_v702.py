#!/usr/bin/env python3
"""v7.02 - CHANGE DELIVERIES (DRAFT).

Andrew Fisher, 27 Sep 2026: "From time line i want something here that takes you to a edit page. This needs to talk to
everything. So if something changes we can change it. Example if P64 changes days we can edit the change of day and
this then changes on the time line and everywhere else. Could also have allocated asset no. This can be edited and
changed. [It must not] overwrite every where else. Should only work off what we know of, so maybe a drop box of type as
in generator or lighting tower etc. Then select the reference number so it matches correctly. Also if we want to add a
new one they need to add a reference number, description etc. Then an option to add location and pin it to the map
where its going. ... Any changes update all things that need to be updated including print outs. Any updates must be
updated and refreshed straight away."

Built on what the page already has - one shared record (S, SYNC_COLLS, the 4 s poll, later-stamp-wins) and one
projection every page and print reads (allAssets()). Nothing new owns a value:
- A pane of its own, "Change deliveries" (#pane-change), reached from Tools, from the Edit page, from an Edit tile on
  the Timeline's day plate after Email (patch_v702_plate.py) and by the link #change/<iso>. It is not on the primary tab row.
- The day: the Timeline day's own lists (calendarDays()), each reference large with its type, what it is, due in and
  due out ("moved from"), asset numbers, where it goes, pin state and [Change].
- Change one: a Type list of only the trades and item types on the job, then a Reference list of only that type.
  Due in / Due out -> setDate (Back to the plan day); Description -> setDesc; Where it goes -> setLocationText; asset
  numbers through the drawer's own rules, now shared (numberPutOn / numberTakeOff); a number already on another
  reference is never added quietly - Move takes it off there and puts it here in one step (numberMove).
- Pin on the map: the Map explorer waits for a tap (GC500Explorer.pickPoint, explorer-merge.js) -> placeHere.
- Add a new one: the Add page's save, factored into addReference() and used by both.
- Changes on this day: from the stamps and names the record already keeps, with Put back where a setter can.
- Every box saves when it is left; bump() redraws everything; a remote change redraws within the poll and keeps the
  box being typed in.
Also: the Add page no longer says an added asset is "saved in this browser" (added is a shared collection); the Edit
page's "Add a reference" (which landed on Today, the Add page being set aside) opens the new page's Add form.
Build on v7.12 live (v7.13 plus one line per truck on the Timeline day).   python3 patch_v702.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
import patch_v702_plate  # noqa: E402

JS = r"""/* ------------------------------------------------------------------ v7.02 - CHANGE DELIVERIES
 Andrew, 27 Sep 2026: "From time line i want something here that takes you to a edit page. This needs to talk to
 everything … if P64 changes days we can edit the change of day and this then changes on the time line and everywhere
 else. Could also have allocated asset no … Should only work off what we know of, so maybe a drop box of type as in
 generator or lighting tower etc. Then select the reference number so it matches correctly. Also if we want to add a
 new one … Then an option to add location and pin it to the map where its going … Any updates must be updated and
 refreshed straight away."

 NOTHING HERE OWNS A VALUE. It is the Edit table's rule, one day at a time: every box writes through the setter the rest
 of the page already writes through (setDate, setDesc, setLocationText, placeHere, the drawer's number rules, the Add
 page's save), every line is read back out of allAssets(), and the day is calendarDays() - the Timeline day's own lists.
 So a change here is on the Timeline's cards, the pre-start, the register, the drawer, the map and every print the
 moment the box is left, and on every other phone at the next poll. */
TAB_SHORT.change = 'Change'; /* the word on the tab bar while the page is open; the full name is its label */
const CHG = {cap: null, day: null, type: '', key: null, said: null, clash: null, add: false, draft: {}, addClash: null, justAdded: null, pick: null};
const chShort = iso => { const f = fmtDay(iso); return f.dow ? f.dow + ' ' + f.dm : String(iso || ''); };
const chHm = at => String(fmtStamp(at || new Date().toISOString())).slice(-5);
/* the day, from the Timeline's own list of days - never a second rule for what is due when */
function chDayOf(iso){
 return calendarDays().find(x => x.iso === iso) || {iso, deliveries: [], removals: [], loads: [], notes: [], unref: [], cancelled: [], empty: true, outside: true};
}
function chDefaultDay(){ return CHG.day && /^\d{4}-\d{2}-\d{2}$/.test(CHG.day) ? CHG.day : (pickDay(calendarDays()) || todayIso()); }
/* every trade on the job and the item types under it, as the register holds them - the only things the lists offer */
function chTrades(){
 const m = new Map();
 allAssets().forEach(a => { const t = a.discipline || 'Other'; if (!m.has(t)) m.set(t, {trade: t, n: 0, types: new Map()});
 const g = m.get(t); g.n++; (a.item_types || []).forEach(ty => { if (ty) g.types.set(ty, (g.types.get(ty) || 0) + 1); }); });
 return [...m.values()].sort((x, y) => x.trade.localeCompare(y.trade))
.map(g => ({trade: g.trade, n: g.n, types: [...g.types.entries()].sort((x, y) => x[0].localeCompare(y[0], undefined, {numeric: true, sensitivity: 'base'}))}));
}
/* a Type pick is "d|<trade>" (every one in the trade) or "t|<trade>|<item type>" */
function chMatches(sel, a){
 if (!sel) return true;
 const p = String(sel).split('|');
 if ((a.discipline || 'Other') !== p[1]) return false;
 return p[0] === 'd' || (a.item_types || []).includes(p.slice(2).join('|'));
}
function chTypeOf(a){ const ty = (a.item_types || [])[0]; return ty ? 't|' + (a.discipline || 'Other') + '|' + ty : 'd|' + (a.discipline || 'Other'); }
function chRefLabel(a){
 const e = effectiveDates(a), ty = (a.item_types || [])[0] || '', nm = a.name || a.product || '';
 const what = ty && nm && nm.toLowerCase().indexOf(ty.toLowerCase()) < 0 ? ty + ' ' + nm : (nm || ty);
 return a.key + (what ? ' · ' + what : '') + (a._cancelled ? ' · cancelled' : e.in ? ' · due in ' + chShort(e.in) : ' · no day yet');
}
/* where it goes now, and what the schedule says - the same two readings setLocationText uses */
function chWhere(a){ return String((a.locations || []).find(l => l && l !== a.key) || '').trim(); }
function chWhereSched(a){ return String((a._locationMoved ? a._locationMoved.from : (a.locations || []).find(l => l && l !== a.key)) || '').trim(); }
/* what puts it on a map, in the order every map reads them: the master plan, a pin stood at it, a placed position */
function chPinState(a){
 const mu = masterUnit(a.key);
 if (mu) return {w: 'on the master plan', cls: 'ref', t: 'From the master plan D001-26003-03: ' + (masterWords(mu) || mu.how || '')};
 const p = bestPinFor(a);
 if (p) { const q = fixQuality(p.fix.acc); return {w: 'pinned ' + q.word, cls: q.cls, t: 'pinned by ' + (p.fix.by || 'somebody') + (p.fix.at ? ' ' + fmtStamp(p.fix.at) : '') + ', standing at it'}; }
 const pl = bestPlaceFor(a);
 if (pl) return {w: 'placed, not pinned', cls: 'cand', t: placeWords(pl.place) + ' by ' + (pl.place.by || 'somebody') + (pl.place.at ? ' ' + fmtStamp(pl.place.at) : '') + '. Nobody has stood at it yet.'};
 const ml = masterLoc(a.key);
 if (ml) return {w: 'an area on the master plan', cls: 'cand', t: ml.how || 'the master plan names the area only'};
 return {w: 'not on the map', cls: 'crit', t: 'Nothing places it yet: pin it on the map here, or stand at it and pin it from the Timeline.'};
}
/* the line under the form that says what the last change did, by whom, when */
function chSay(text){ CHG.said = {text, at: new Date().toISOString()}; }
function chSaidHtml(){
 const s = CHG.said; if (!s) return '';
 return `<p class="chsaid" role="status" aria-live="polite"><b>${esc(s.text)}</b> · by ${esc(S.operator || 'unnamed')} ${esc(chHm(s.at))}</p>`;
}
/* say it first, so the redraw the setter makes already shows it; take it back if the setter refused */
function chTry(text, fn){
 const was = CHG.said; chSay(text); let ok = false;
 try { ok = !!fn(); } finally { if (!ok) { CHG.said = was; render(); } }
 return ok;
}
function chLiveHtml(){
 const w = typeof syncWaiting === 'function' ? syncWaiting() : 0;
 const wait = w ? ' · ' + w + ' change' + (w === 1 ? '' : 's') + ' still going up' : '';
 if (SYNC.on && SYNC.status === 'live' && !canEdit()) return `<p class="chlive"><i aria-hidden="true"></i>The shared record, as it stands · a change the team makes shows here within seconds</p>`;
 if (SYNC.on && SYNC.status === 'live') return `<p class="chlive"><i aria-hidden="true"></i>Saved to the shared record · everyone sees it within seconds${esc(wait)}</p>`;
 if (SYNC.on) return `<p class="chlive off"><i aria-hidden="true"></i>The shared record is not answering just now · changes are kept in this browser and go up when it does${esc(wait)}</p>`;
 return `<p class="chlive off"><i aria-hidden="true"></i>${LW() === 'shared folder' ? 'Saved to the shared folder' : 'Saved in this browser only · Export hands it on'}</p>`;
}
/* ---- asset numbers: the drawer's own rules, in one place (the drawer calls these too) */
function numberPutOn(key, v, who){
 untomb('num/' + key + '/' + v, who); // typing it again is a putting-back, and is recorded as one
 if (numberErased('num/' + key + '/' + v)) { delete S.notes['num/' + key + '/' + v]; stampIt('notes', 'num/' + key + '/' + v, who); } // v5.79 - an erased typo typed again is a number again
 S.assetNumbers = S.assetNumbers || {};
 (S.assetNumbers[key] = S.assetNumbers[key] || []).push(v);
 stampIt('assetNumbers', key + '/' + v, who); // v7.02 - when, and who, as moveRecord already stamps it
}
function numberTakeOff(key, n, who){
 S.assetNumbers = S.assetNumbers || {};
 S.assetNumbers[key] = (S.assetNumbers[key] || []).filter(x => x !== n);
 if (!S.assetNumbers[key].length) delete S.assetNumbers[key];
 tomb('num/' + key + '/' + n, who); // a removal is written down and carried, or an older copy puts it back (TR-01)
}
/* every OTHER reference that carries this number: as one of its numbers (the clash view, assetNumbersOf) or as a
   thing inside it (a fridge, an air conditioner) */
function numberOwners(n, key){
 const s = String(n || '').trim(), out = []; if (!s) return out;
 allAssets().forEach(a => { if (a.key === key) return;
 if (assetNumbersOf(a).includes(s)) out.push({key: a.key, how: 'number'});
 else if (contentsNumbersOf(a).includes(s)) out.push({key: a.key, how: 'inside'}); });
 return out;
}
/* a number off the references it is on and onto this one, in one step, with the name on both ends */
function numberMove(n, froms, to){
 if (!mayWrite('an asset number')) return false;
 const who = whoAmI(); if (!who) return false;
 if (!isRef(to) || !froms.length) return false;
 froms.forEach(f => numberTakeOff(f, n, who));
 const a = assetOf(to); if (!(a && (a.asset_numbers || []).includes(n))) numberPutOn(to, n, who);
 return true;
}
/* ---- a new reference: the Add page's own save, so both pages add by exactly the same rules */
function addReference(f){
 const no_ = w => { flash(w); return null; };
 const key = String(f.key || '').trim().toUpperCase();
 if (!key) return no_('A reference is needed — that is what people will call it on site.');
 if (!/^[A-Z][A-Z0-9]{0,7}(-[A-Z0-9]{1,4})?$/.test(key)) return no_('A reference is letters and digits — GN15, P48, LT07 — up to eight characters, with one dash at most.');
 if (!f.disc) return no_('Pick the trade — nothing here is guessed for you.');
 if (allAssets().some(a => a.key === key)) return no_(key + ' already exists. Open it and add to it instead.');
 if (tombedHere(key)) return no_(key + ' was deleted in this record earlier — pick a different reference, or the deletion would take the new one.');
 { const dx = deletionOf(key); if (dx) return no_(key + ' was deleted for good' + (dx.by ? ' by ' + dx.by : '') + (dx.at ? ' on ' + fmtStamp(dx.at) : '') + ' — a deleted reference is never re-used. Pick a different one.'); }
 const who = whoAmI(); if (!who) return null;
 const from = f.from || null, to = f.to || null;
 const day = v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T00:00:00')));
 if (!day(from) || !day(to)) return no_('A date has to be a real day.');
 if (from && to && to < from) return no_('The out day (' + fmtDate(to) + ') is before the in day (' + fmtDate(from) + ') — swap them.');
 const no = String(f.no || '').trim(), t = String(f.type || '').trim();
 const srcRow = String(f.srcRow || '').trim().toUpperCase() || null;
 if (srcRow && !(DATA.unreferenced || []).some(r => r.task_id === srcRow)) return no_(srcRow + ' is not one of the schedule rows without a reference — leave the row blank unless this asset is one of them.');
 /* a place on a drawing, when the asset was added from an empty callout on the map */
 const sheetId = f.sheet || null, callout = f.callout || null;
 const links = sheetId && callout && DATA.sheets.some(s => s.sheet_id === sheetId) ? [{sheet: sheetId, label: callout, source: 'recorded on site'}] : [];
 const added = {key, discipline: f.disc, name: String(f.name || '').trim() || null,
 item_types: t ? [t] : [], asset_numbers: no ? [no] : [], accessories: [],
 first_date: from, last_date: to,
 locations: [String(f.loc || '').trim()].filter(Boolean),
 asset_no_state: no ? 'entered here' : 'not supplied',
 source_row: srcRow,
 added_at: new Date().toISOString(), added_by: who};
 if (links.length) Object.assign(added, {drawing_links: links, linked_to_2026_sheet: true,
 position_state: 'entered by hand at a drawing callout — confirm the exact spot on the ground'});
 S.added.push(added);
 if (String(f.note || '').trim()) S.notes[key] = String(f.note).trim();
 /* the rental extract's branch code follows the row that carried it — offered on the form, recorded here in
 this person's name like any other branch, never written by the extract itself */
 const br = String(f.branch || '').trim();
 if (br) { S.branch = S.branch || {}; S.branch[key] = normBranch(br); stampIt('branch', key); }
 save(); flash(key + ' added by ' + who + (srcRow ? ' — schedule row ' + srcRow + ' now has a reference.' : '.') + (br ? ' Branch ' + normBranch(br) + ' recorded.' : ''));
 return key;
}
/* the next free reference in a series: one past the highest the job has ever used (deleted ones included), never one
   that is on the job, tombstoned or deleted for good */
function chNextRef(prefix){
 if (!prefix) return '';
 const re = new RegExp('^' + prefix + '(\\d+)$'); let max = 0, w = 2;
 DATA.assets.map(a => a.key).concat((S.added || []).map(a => a.key), allAssets().map(a => a.key)).forEach(k => {
 const m = re.exec(String(k || '')); if (m) { max = Math.max(max, Number(m[1])); w = Math.max(w, Math.min(3, m[1].length)); } });
 let n = max + 1; const at = x => prefix + String(x).padStart(w, '0');
 while ((isRef(at(n)) || tombedHere(at(n)) || deletionOf(at(n))) && n < max + 500) n++;
 return at(n);
}
/* the series a type is numbered in: the commonest letters among the references of that type, else of the trade */
function chSuggest(sel){
 const p = String(sel || '').split('|'); if (!p[0] || p[0] === 'o') return '';
 const all = allAssets(), trade = all.filter(a => a.discipline === p[1]);
 const pool = p[0] === 't' ? trade.filter(a => (a.item_types || []).includes(p.slice(2).join('|'))) : trade;
 const pre = {}; (pool.length ? pool : trade).forEach(a => { const m = /^([A-Z]+)(\d+)$/.exec(a.key); if (m) pre[m[1]] = (pre[m[1]] || 0) + 1; });
 const best = Object.entries(pre).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0];
 return best ? chNextRef(best[0]) : '';
}
/* ---- what was changed for this day's references, out of the stamps and names the record already keeps */
function chChanges(iso){
 const out = [], by = S.by || {}, dels = S.deleted || {}, stamps = S.stamps || {}, numEv = new Map();
 const ev = (k, x) => { if (!numEv.has(k)) numEv.set(k, []); numEv.get(k).push(x); };
 Object.keys(dels).forEach(id => { const m = /^num\/([^/]+)\/(.+)$/.exec(id); if (!m || numberErased(id) || !tombedHere(id)) return;
 ev(m[1], {at: dels[id], by: by['deleted/' + id], what: m[2] + ' taken off'}); });
 Object.keys(stamps).forEach(sk => { const m = /^assetNumbers\/([^/]+)\/(.+)$/.exec(sk); if (m) ev(m[1], {at: stamps[sk], by: by[sk], what: m[2] + ' put on', n: m[2]}); });
 allAssets().forEach(a => {
 const e = effectiveDates(a); if (![e.in, e.in_plan, e.out, e.out_plan].includes(iso)) return;
 const k = a.key, dl = (S.delivery || {})[k] || {}, add = x => out.push(Object.assign({k}, x));
 if (e.in_moved && e.in_where !== 'schedule correction' && e.in_at) add({at: e.in_at, by: e.in_by, what: 'due in moved to ' + chShort(e.in) + (e.in_plan ? ' — the plan said ' + chShort(e.in_plan) : ''), back: 'in'});
 if (dl.date_off_at) add({at: dl.date_off_at, by: dl.date_off_by, what: 'due in back on its plan day' + (e.in_plan ? ', ' + chShort(e.in_plan) : '')});
 if (e.out_moved && e.out_at) add({at: e.out_at, by: e.out_by, what: 'due out moved to ' + chShort(e.out) + (e.out_plan ? ' — the plan said ' + chShort(e.out_plan) : ''), back: 'out'});
 if (dl.out_off_at) add({at: dl.out_off_at, by: dl.out_off_by, what: 'due out back on its plan day' + (e.out_plan ? ', ' + chShort(e.out_plan) : '')});
 if (a._nameTyped) add({at: a._nameTyped.at, by: a._nameTyped.by, what: 'now reads “' + a._nameTyped.to + '”', back: 'desc'});
 if (a._locationMoved) add({at: a._locationMoved.at, by: a._locationMoved.by, what: 'goes to “' + a._locationMoved.to + '”', back: 'loc'});
 if (a._itemTyped) add({at: a._itemTyped.at, by: a._itemTyped.by, what: 'item type now ' + a._itemTyped.to, back: 'item'});
 const pl = (S.places || {})[k]; if (pl && pl.at) add({at: pl.at, by: pl.by, what: 'placed on the map' + (pl.how ? ' · ' + pl.how : ''), back: 'place'});
 (numEv.get(k) || []).forEach(x => { if (!x.n || (a.asset_numbers || []).includes(x.n)) add(x); });
 const ad = (S.added || []).find(x => x.key === k); if (ad && ad.added_at) add({at: ad.added_at, by: ad.added_by, what: 'added as a new reference'});
 });
 return out.filter(x => x.at).sort((x, y) => String(y.at).localeCompare(String(x.at)));
}
/* ---- the page */
function chRowHtml(r, kind, ro){
 const a = r.a, e = effectiveDates(a), pin = chPinState(a), where = chWhere(a), nums = a.asset_numbers || [], on = CHG.key === a.key;
 const day = (v, moved, plan) => v ? esc(chShort(v)) + (moved && plan ? ` <span class="chip act">moved from ${esc(chShort(plan))}</span>` : '') : '<span class="norate">no day</span>';
 return `<li class="chrow${on ? ' on' : ''}${a._cancelled ? ' off' : ''}" data-chrow="${esc(a.key)}">
 <div class="chref">${refPlate(a.key, 26)}<span class="chlt">${lightChip(a)}</span></div>
 <div class="chbody"><div class="chwhat">${esc((a.item_types || []).join(', ') || a.product || '—')}<span class="w"> · ${esc(a.discipline || '')}</span></div>
 ${a.name ? `<div class="chname">${esc(a.name)}</div>` : ''}
 <div class="chmeta"><span>Due in <b>${day(e.in, e.in_moved, e.in_plan)}</b></span><span>Due out <b>${day(e.out, e.out_moved, e.out_plan)}</b></span>
 <span>Asset no. <b>${nums.length ? esc(nums.join(', ')) : '<span class="norate">none yet</span>'}</b></span>
 <span>Goes to <b>${where ? esc(where) : '<span class="norate">the schedule does not say</span>'}</b></span>
 <span class="chip ${esc(pin.cls)}" title="${esc(pin.t)}">${esc(pin.w)}</span></div></div>
 <div class="chgo"><button type="button" class="btn${on ? ' primary' : ''}" data-chpick="${esc(a.key)}"${ro ? ' disabled' : ''} aria-label="Change ${esc(a.key)}">Change</button></div></li>`;
}
function chClashHtml(k, c, moveAttr){
 if (!c) return '';
 const nums = c.owners.filter(o => o.how === 'number').map(o => o.key), inside = c.owners.filter(o => o.how === 'inside').map(o => o.key);
 const all = c.owners.map(o => o.key).join(' and ');
 if (inside.length) return `<div class="notice warn chclash" role="alert"><b>${esc(c.no)} is already on ${esc(all)}.</b>
 It is a thing inside ${esc(inside.join(' and '))}, not a reference of its own, so it cannot be moved from here — change it in ${esc(inside[0])}'s record. Nothing was added.
 <div class="chacts"><button type="button" class="btn" data-chopen="${esc(inside[0])}">Open ${esc(inside[0])}</button><button type="button" class="btn ghost" data-chclashx>Leave it</button></div></div>`;
 return `<div class="notice warn chclash" role="alert"><b>${esc(c.no)} is already on ${esc(all)}.</b>
 Nothing was added. Move it and it comes off ${esc(nums.join(' and '))} and goes on ${esc(k)} in one step, with your name and the time on both.
 <div class="chacts"><button type="button" class="btn primary" ${moveAttr}="${esc(c.no)}">Move it to ${esc(k)}</button><button type="button" class="btn ghost" data-chclashx>Leave it where it is</button></div></div>`;
}
function chFormHtml(ro){
 const trades = chTrades(), sel = CHG.type;
 const refs = allAssets().filter(a => chMatches(sel, a)).sort((x, y) => x.key.localeCompare(y.key, undefined, {numeric: true}));
 const a = CHG.key ? assetOf(CHG.key) : null, dis = ro ? ' disabled' : '';
 const typeSel = `<select id="chType" aria-label="Type"${dis}><option value="">— every type on the job —</option>${trades.map(g => `<optgroup label="${esc(g.trade)}">
 <option value="d|${esc(g.trade)}"${sel === 'd|' + g.trade ? ' selected' : ''}>All ${esc(g.trade.toLowerCase())} (${g.n})</option>${
 g.types.map(([t, n]) => `<option value="t|${esc(g.trade)}|${esc(t)}"${sel === 't|' + g.trade + '|' + t ? ' selected' : ''}>${esc(t)} (${n})</option>`).join('')}</optgroup>`).join('')}</select>`;
 const refSel = `<select id="chRef" aria-label="Reference"${dis}><option value="">— pick the reference (${refs.length}) —</option>${
 refs.map(r => `<option value="${esc(r.key)}"${a && r.key === a.key ? ' selected' : ''}>${esc(chRefLabel(r))}</option>`).join('')}</select>`;
 let body = '<p class="norate">Pick the type, then the reference — or press Change on a line of the day. Only what the job already holds is in the lists.</p>';
 if (a) {
 const e = effectiveDates(a), k = a.key, nums = a.asset_numbers || [], pin = chPinState(a), placed = (S.places || {})[k];
 const sName = String(a._nameOnTheSchedule == null ? '' : a._nameOnTheSchedule).trim(), sWhere = chWhereSched(a);
 const dateBox = which => { const isIn = which === 'in', v = isIn ? e.in : e.out, plan = isIn ? e.in_plan : e.out_plan, moved = isIn ? e.in_moved : e.out_moved, corr = isIn && e.in_where === 'schedule correction';
 return `<div class="f"><label for="ch-${which}">${isIn ? 'Due in' : 'Due out'}</label>
 <div class="chdrow"><input type="date" id="ch-${which}" data-chdate="${which}" value="${esc(v || '')}"${dis}>
 <button type="button" class="btn ghost sm" data-chplan="${which}"${ro || !moved || corr ? ' disabled' : ''}>Back to the plan day</button></div>
 <div class="hint">${v ? '<b>' + esc(fmtDate(v)) + '</b> · ' : ''}${plan ? 'the plan says ' + esc(chShort(plan)) : 'the plan gives no day'}${
 moved && !corr ? ' — moved by ' + esc((isIn ? e.in_by : e.out_by) || 'unnamed') + ' ' + esc(fmtStamp((isIn ? e.in_at : e.out_at) || '')) : ''}${corr ? ' — corrected at the source' : ''}</div></div>`; };
 body = `<div class="chhead">${refPlate(k, 30)}<div class="chheadw"><b>${esc(a.name || (a.item_types || []).join(', ') || '')}</b>
 <div class="sub">${esc(a.discipline || '')} · ${esc((a.item_types || []).join(', '))} ${lightChip(a, {full: true})}</div></div>
 <button type="button" class="btn ghost sm" data-chopen="${esc(k)}">Open the full record</button></div>
 ${a._cancelled ? `<div class="notice warn"><b>${esc(k)} is cancelled.</b> ${esc(rowOffWords(k))}</div>` : ''}
 <div class="form chfields">
 <div class="row2">${dateBox('in')}${dateBox('out')}</div>
 <div class="f"><label for="chNum">Allocated asset numbers</label>
 ${nums.length ? `<ul class="chnums">${nums.map(n => `<li><b class="mono">${esc(n)}</b><span class="w">${esc(((a._numberSources || {})[n] || []).join(', '))}</span><button type="button" class="chnumx" data-chnumoff="${esc(n)}"${dis} aria-label="Take ${esc(n)} off ${esc(k)}" title="Take ${esc(n)} off ${esc(k)}">×</button></li>`).join('')}</ul>` : '<p class="norate">No asset number on this one yet.</p>'}
 <div class="chdrow"><input id="chNum" inputmode="numeric" autocomplete="off" placeholder="add a Coates asset number"${dis}><button type="button" class="btn" id="chNumAdd"${dis}>Add</button></div>
 <div class="hint">A number on another reference is never added here quietly: the page says where it is and offers to move it.</div>
 ${chClashHtml(k, CHG.clash && CHG.clash.key === k ? CHG.clash : null, 'data-chmove')}</div>
 <div class="f"><label for="chDesc">Description</label><input id="chDesc" data-chtext="desc" maxlength="160" value="${esc(a.name || '')}"${dis}>
 <div class="hint">${sName ? 'the schedule says “' + esc(sName) + '”' : 'the schedule gives no description'}${a._nameTyped ? ' · typed by ' + esc(a._nameTyped.by || 'unnamed') + ' ' + esc(fmtStamp(a._nameTyped.at || '')) : ''} · empty the box to go back to it</div></div>
 <div class="f"><label for="chLoc">Where it goes</label><input id="chLoc" data-chtext="loc" maxlength="120" value="${esc(chWhere(a))}"${dis}>
 <div class="hint">${sWhere ? 'the schedule says “' + esc(sWhere) + '”' : 'the schedule does not say'}${a._locationMoved ? ' · typed by ' + esc(a._locationMoved.by || 'unnamed') + ' ' + esc(fmtStamp(a._locationMoved.at || '')) : ''} · empty the box to go back to it</div></div>
 <div class="f"><label>Pin on the map</label>
 <div class="chdrow"><span class="chip ${esc(pin.cls)}" title="${esc(pin.t)}">${esc(pin.w)}</span>
 <button type="button" class="btn" data-chpin="${esc(k)}"${ro || !expOn() ? ' disabled' : ''}>${placed ? 'Move the pin' : 'Pin it on the map'}</button>${
 placed ? `<button type="button" class="btn ghost sm" data-chunplace="${esc(k)}"${dis}>Take the placed pin off</button>` : ''}</div>
 <div class="hint">${expOn() ? 'Opens the Map explorer: tap where ' + esc(k) + ' is going and it is placed there, then this page comes back.' : 'The Map explorer opens on the hosted link only.'}${
 masterUnit(k) ? ' The master plan already places ' + esc(k) + '; a pin put here is kept beside it and the master plan still leads.' : ''}</div></div>
 </div>`;
 }
 return `<div class="card chform nosfold" id="chForm"><h3>Change one</h3>
 ${chSaidHtml()}
 <div class="row2 chpick"><div class="f"><label for="chType">Type</label>${typeSel}</div><div class="f"><label for="chRef">Reference</label>${refSel}</div></div>
 ${body}
 <p class="norate chnote">Each box saves when you leave it — there is no Save button. The schedule's own words and days stay underneath.</p></div>`;
}
function chAddHtml(ro){
 const dis = ro ? ' disabled' : '';
 const done = CHG.justAdded && assetOf(CHG.justAdded) ? `<div class="notice info chadded"><b>${esc(CHG.justAdded)} is on the job.</b> It is on its day on the Timeline, in the register and in its own record.
 <div class="chacts"><button type="button" class="btn primary" data-chpin="${esc(CHG.justAdded)}"${ro || !expOn() ? ' disabled' : ''}>Pin it on the map</button><button type="button" class="btn ghost" data-chopen="${esc(CHG.justAdded)}">Open ${esc(CHG.justAdded)}</button></div></div>` : '';
 if (!CHG.add) return `<div class="card chadd nosfold" id="chAdd"><h3>Add a new one</h3>${done}
 <p class="sub">Something turning up that the schedule does not carry: it gets a reference of its own, its days and where it goes.</p>
 <button type="button" class="btn" data-chaddopen${dis}>Add a new one</button></div>`;
 const D = CHG.draft || {}, discs = [...new Set(allAssets().map(a => a.discipline).filter(Boolean))].sort();
 const other = String(D.type || '').indexOf('o|') === 0;
 const sug = chSuggest(D.type), key = D.keyTouched ? (D.key || '') : sug;
 const v = x => esc(D[x] == null ? '' : D[x]);
 const typeOpts = discs.map(d => `<optgroup label="${esc(d)}"><option value="d|${esc(d)}"${D.type === 'd|' + d ? ' selected' : ''}>${esc(d)} — type not known yet</option>${
 itemTypeOptions(d).map(t => `<option value="t|${esc(d)}|${esc(t)}"${D.type === 't|' + d + '|' + t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</optgroup>`).join('')
 + `<optgroup label="Other"><option value="o|"${other ? ' selected' : ''}>Other: type the words</option></optgroup>`;
 const row = D.srcRow ? `<div class="notice info chrowgive"><b>Giving schedule row ${esc(D.srcRow)} a reference.</b> The row's own words are filled in below — check them, type the reference, and the row leaves the day's “no reference” list.${D.note ? `<div class="hint">${esc(D.note)}</div>` : ''}${D.branch ? `<div class="hint">Branch ${esc(D.branch)} is recorded with it.</div>` : ''}</div>` : '';
 return `<div class="card chadd nosfold" id="chAdd"><h3>Add a new one</h3>${done}${row}
 <div class="form chfields">
 <div class="f"><label for="chNType">Type *</label><select id="chNType"${dis}><option value="">— pick the type —</option>${typeOpts}</select></div>
 ${other ? `<div class="row2"><div class="f"><label for="chNTrade">Trade *</label><select id="chNTrade" data-chn="otherTrade"${dis}><option value="">— pick the trade —</option>${
 discs.concat(['Other']).map(d => `<option${D.otherTrade === d ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
 <div class="f"><label for="chNOther">The type, in words</label><input id="chNOther" data-chn="other" value="${v('other')}" placeholder="in the rate card's words — Building 6m, 50kva…"${dis}></div></div>` : ''}
 <div class="row2"><div class="f"><label for="chNKey">Reference number *</label><input id="chNKey" data-chn="key" value="${esc(key)}" autocomplete="off" placeholder="GN26, P70, WC90…"${dis}>
 <div class="hint">${sug ? 'The next free one in that series is <b>' + esc(sug) + '</b> — type over it if the unit already carries one.' : 'Letters and digits, unique on the job.'}</div></div>
 <div class="f"><label for="chNName">Description</label><input id="chNName" data-chn="name" value="${v('name')}" placeholder="what it is used for — Race Medical, Gate 5…"${dis}></div></div>
 <div class="row2"><div class="f"><label for="chNFrom">Due in</label><input id="chNFrom" type="date" data-chn="from" value="${v('from')}"${dis}></div>
 <div class="f"><label for="chNTo">Due out</label><input id="chNTo" type="date" data-chn="to" value="${v('to')}"${dis}></div></div>
 <div class="row2"><div class="f"><label for="chNNo">Asset number</label><input id="chNNo" data-chn="no" inputmode="numeric" value="${v('no')}" placeholder="leave blank if not known"${dis}></div>
 <div class="f"><label for="chNLoc">Where it goes</label><input id="chNLoc" data-chn="loc" value="${v('loc')}" placeholder="plain words — the crew has to find it"${dis}></div></div>
 ${chClashHtml(key || 'the new one', CHG.addClash, 'data-chnmove')}
 <div class="chacts"><button type="button" class="btn primary" id="chNSave"${dis}>Add it</button><button type="button" class="btn ghost" data-chaddclose>Cancel</button></div>
 <div class="hint">Checked exactly as the Add page checks: a new reference, never one deleted or used before, real days, the trade picked. Then pin it on the map.</div>
 </div></div>`;
}
function chChangesHtml(iso, ro){
 const L = chChanges(iso);
 const head = `<h3>Changes on this day${L.length ? ' (' + L.length + ')' : ''}</h3>`;
 if (!L.length) return `<div class="card chlog nosfold">${head}<p class="norate">Nothing has been changed for this day's references yet. A change made here, on the Timeline or in a drawer shows here with who made it and when.</p></div>`;
 return `<div class="card chlog nosfold">${head}<ul class="chloglist">${L.slice(0, 14).map(x => `<li><span class="mono">${esc(fmtStamp(x.at))}</span> <b>${esc(x.k)}</b> ${esc(x.what)}<span class="w"> · ${esc(x.by || 'unnamed')}</span>${
 x.back && !ro ? ` <button type="button" class="btn ghost sm" data-chback="${esc(x.back + '|' + x.k)}">${x.back === 'place' ? 'Take it off the map' : 'Put back'}</button>` : ''}</li>`).join('')}</ul>${
 L.length > 14 ? `<p class="norate">and ${L.length - 14} earlier.</p>` : ''}</div>`;
}
/* a redraw replaces every box: the one being typed in keeps its cursor and its words, and the page keeps its place */
function chKeepPlace(pane){
 const el = document.activeElement, m = $('main'), id = el && pane.contains(el) && el.id ? el.id : null;
 return {id, v: id && el.dataset.chdirty === '1' ? el.value : null, sel: id && el.setSelectionRange && /^(text|search|)$/.test(el.type || '') ? [el.selectionStart, el.selectionEnd] : null, y: m ? m.scrollTop : 0};
}
function chPutBack(p){
 if (!p) return;
 const m = $('main'); if (m && p.y && Math.abs(m.scrollTop - p.y) > 1) m.scrollTop = p.y;
 if (!p.id) return;
 const el = document.getElementById(p.id); if (!el || el.disabled) return;
 if (p.v != null && el.value !== p.v) { el.value = p.v; el.dataset.chdirty = '1'; }
 try { el.focus({preventScroll: true}); } catch (e) { el.focus(); }
 if (p.sel && el.setSelectionRange) { try { el.setSelectionRange(p.sel[0], p.sel[1]); } catch (e) {} }
}
function renderChange(){ return holdAssets(renderChange_held); }
function renderChange_held(){
 const pane = $('#pane-change'); if (!pane) return;
 if (CHG.pick) chPickCancel(); /* back here without a tap on the map: the explorer stops waiting */
 const keep = chKeepPlace(pane);
 const days = calendarDays(), iso = chDefaultDay(); CHG.day = iso;
 const d = chDayOf(iso), cap = capability(), ro = cap !== 'edit'; CHG.cap = cap;
 const first = days.length ? days[0].iso : '', last = days.length ? days[days.length - 1].iso : '';
 const ins = d.deliveries.slice().sort(etaSort), outs = d.removals.slice().sort(etaSort);
 if (CHG.key && !assetOf(CHG.key)) CHG.key = null;
 const sheet = d.outside ? 'outside the programme' : (d.sheet ? d.sheet + ' · ' + d.phase : 'no programme sheet covers this day') + (d.holiday ? ' · ' + d.holiday.name : d.weekend ? ' · weekend' : '');
 pane.innerHTML = paneHeadingHtml('change') + `
 <div class="card chtopcard nosfold">
 <div class="chtop">
 <div class="chdaynav" role="group" aria-label="Pick the day">
 <button type="button" class="btn" data-chstep="-1"${!days.length || iso <= first ? ' disabled' : ''} title="the day before" aria-label="The day before">‹</button>
 <input type="date" id="chDay" data-ro value="${esc(iso)}" min="${esc(first)}" max="${esc(last)}" aria-label="The day">
 <button type="button" class="btn" data-chstep="1"${!days.length || iso >= last ? ' disabled' : ''} title="the day after" aria-label="The day after">›</button>
 </div>
 <div class="chday"><h3>${esc(fmtDate(iso))}</h3><div class="sub">${esc(sheet)} · <b>${d.deliveries.length}</b> due in · <b>${d.removals.length}</b> due out</div></div>
 <button type="button" class="btn ghost" data-chtl="${esc(iso)}">Open on the Timeline</button>
 </div>
 <div class="chwho"><label for="chWho">Recording as</label><input id="chWho" autocomplete="name" placeholder="your name" value="${esc(S.operator || '')}"><span class="hint">every change carries this name and the time</span></div>
 ${chLiveHtml()}
 </div>
 ${ro ? `<div class="notice warn chro"><b>${cap === 'unknown' ? 'Checking what this link may do.' : 'This link can only look.'}</b> ${cap === 'unknown' ? 'The boxes open the moment the service says this is an editing link.' : 'Open the editing link to change deliveries.'}</div>` : ''}
 <div class="chgrid">
 <div class="card chdaycard nosfold">
 <h3>Due in on ${esc(chShort(iso))} (${ins.length})</h3>
 ${ins.length ? `<ul class="chlist">${ins.map(r => chRowHtml(r, 'in', ro)).join('')}</ul>` : '<p class="norate">Nothing is due in on this day.</p>'}
 <h3 class="chsub">Due out on ${esc(chShort(iso))} (${outs.length})</h3>
 ${outs.length ? `<ul class="chlist">${outs.map(r => chRowHtml(r, 'out', ro)).join('')}</ul>` : '<p class="norate">Nothing is due out on this day.</p>'}
 ${(d.cancelled || []).length ? `<p class="norate">Cancelled, and off this day's work: ${esc(d.cancelled.map(a => a.key).join(', '))}.</p>` : ''}
 </div>
 <div class="chside">${chFormHtml(ro)}${chAddHtml(ro)}${chChangesHtml(iso, ro)}</div>
 </div>`;
 chBind(pane);
 if (state.tab === 'change') setHash('change/' + iso, {replace: /^#change(\/|$)/.test(location.hash)});
 chPutBack(keep);
}
/* pick a reference into the form: its type and itself */
function chChoose(key, scroll){
 const a = assetOf(key); if (!a) return;
 CHG.key = a.key; CHG.type = chTypeOf(a); CHG.clash = null;
 render();
 if (scroll && !matchMedia('(min-width: 901px)').matches) { const f = $('#chForm'); if (f) { try { f.scrollIntoView({block: 'start', behavior: 'auto'}); } catch (e) {} } }
}
function chSetDate(key, v, which){
 const a = assetOf(key); if (!a) return false;
 const e = effectiveDates(a), plan = which === 'out' ? e.out_plan : e.in_plan, word = which === 'out' ? 'due out' : 'due in';
 const back = !v || v === plan;
 return chTry(back ? key + ' is back on its plan day' + (plan ? ', ' + chShort(plan) : '') + ' — ' + word
 : key + ' now ' + word + ' ' + chShort(v) + (plan ? ' — the plan said ' + chShort(plan) : ''), () => setDate(key, v, which));
}
function chSetText(key, f, v){
 const a = assetOf(key); if (!a) return false;
 const t = String(v == null ? '' : v).trim();
 if (f === 'desc') { const s = String(a._nameOnTheSchedule == null ? '' : a._nameOnTheSchedule).trim();
 return chTry(!t || t === s ? key + ' is back to the schedule\'s own description' + (s ? ', “' + s + '”' : '') : key + ' now reads “' + t.slice(0, 160) + '”' + (s ? ' — the schedule says “' + s + '”' : ''), () => setDesc(key, v)); }
 const s = chWhereSched(a);
 return chTry(!t || t === s ? key + ' goes where the schedule says' + (s ? ', “' + s + '”' : '') : key + ' now goes to “' + t.slice(0, 120) + '”' + (s ? ' — the schedule said “' + s + '”' : ''), () => setLocationText(key, v));
}
function chNumAdd(key, v){
 v = String(v || '').trim(); const a = assetOf(key); if (!a || !v) return;
 if (!mayWrite('an asset number')) return;
 if ((a.asset_numbers || []).includes(v)) { CHG.clash = null; chSay(v + ' is already on ' + key + ' — nothing to add'); render(); return; }
 const own = numberOwners(v, key);
 if (own.length) { CHG.clash = {key, no: v, owners: own}; chSay(v + ' was not added — it is on ' + own.map(o => o.key).join(' and ')); render(); return; }
 const who = whoAmI(); if (!who) return;
 CHG.clash = null; chSay(v + ' is now on ' + key + ' — it counts everywhere the page counts asset numbers');
 numberPutOn(key, v, who); bump();
}
function chNumOff(key, n){
 if (!mayWrite('an asset number')) return;
 const who = whoAmI(); if (!who) return;
 CHG.clash = null; chSay(n + ' is off ' + key + ' for good');
 if (numberIsOursAlone(key, n) && numberErase(key, n)) return; /* only ever typed here: erased, as the drawer does */
 numberTakeOff(key, n, who); bump();
}
function chNumMove(key, n){
 const c = CHG.clash, from = (c && c.no === n && c.key === key ? c.owners : numberOwners(n, key)).filter(o => o.how === 'number').map(o => o.key);
 if (!from.length) return;
 const was = CHG.said; chSay(n + ' moved off ' + from.join(' and ') + ' and onto ' + key + ' — ' + from.join(' and ') + (from.length > 1 ? ' no longer carry it' : ' no longer carries it'));
 if (numberMove(n, from, key)) { CHG.clash = null; bump(); } else CHG.said = was;
}
function chAddFields(){
 const D = CHG.draft || {}, p = String(D.type || '').split('|'), other = p[0] === 'o';
 return {key: D.keyTouched ? (D.key || '') : chSuggest(D.type), disc: other ? (D.otherTrade || '') : (p[1] || ''), type: other ? (D.other || '') : p[0] === 't' ? p.slice(2).join('|') : '',
 name: D.name || '', from: D.from || '', to: D.to || '', no: D.no || '', loc: D.loc || '', srcRow: D.srcRow || '', branch: D.branch || '', note: D.note || ''};
}
/* a schedule row with no reference, given one (the Timeline's "Give it a reference"): the Add page is set aside, so the
   row's own words land in the Add form here, and addReference() takes the row off the day's "no reference" list */
function chAddFromRow(p){
 if (!p) return;
 const disc = p.disc && p.disc !== 'Other' ? p.disc : '', t = String(p.type || '').trim(), known = !!disc && !!t && itemTypeOptions(disc).includes(t);
 CHG.draft = {type: known ? 't|' + disc + '|' + t : disc && !t ? 'd|' + disc : 'o|', other: known ? '' : t, otherTrade: p.disc || '',
 name: '', from: p.from || '', to: '', no: p.no || '', loc: p.loc || '', srcRow: p.srcRow || '', branch: p.branch || '', note: p.note || ''};
 if (p.from && /^\d{4}-\d{2}-\d{2}$/.test(p.from)) CHG.day = p.from;
 CHG.add = true; CHG.justAdded = null; CHG.addClash = null; CHG.said = null;
 go('change');
}
function chAddNow(move){
 if (!mayWrite('a new reference')) return;
 const f = chAddFields(), no = String(f.no || '').trim(), key0 = String(f.key || '').trim().toUpperCase();
 if (!CHG.draft.type) { flash('Pick the type first — nothing here is guessed for you.'); return; }
 const own = no ? numberOwners(no, key0) : [];
 if (own.length && (!move || own.some(o => o.how === 'inside'))) { CHG.addClash = {no, owners: own}; render(); return; }
 const key = addReference(Object.assign({}, f, {no: own.length ? '' : no}));
 if (!key) return;
 if (own.length) numberMove(no, own.map(o => o.key), key);
 CHG.key = key; CHG.type = f.type ? 't|' + f.disc + '|' + f.type : 'd|' + f.disc; CHG.justAdded = key; CHG.addClash = null; CHG.add = false; CHG.draft = {};
 chSay(key + ' added' + (f.from ? ' — due in ' + chShort(f.from) : '') + (own.length ? ' · ' + no + ' moved off ' + own.map(o => o.key).join(' and ') + ' onto ' + key : ''));
 bump();
}
function chPutBackOne(kind, key){
 if (kind === 'in' || kind === 'out') return chSetDate(key, '', kind);
 if (kind === 'desc' || kind === 'loc') return chSetText(key, kind, '');
 if (kind === 'item') return chTry(key + ' is back to the schedule\'s own item type', () => setItemType(key, ''));
 if (kind === 'place') return chTry(key + ' is off the map — the placed pin is taken off', () => { if (!(S.places || {})[key]) return false; clearPlace(key); return !(S.places || {})[key]; });
 return false;
}
function chBind(pane){
 const q = s => pane.querySelector(s), qa = s => pane.querySelectorAll(s);
 /* a box's change is carried out on the next turn, so the box the person moved to already has the focus when the
    redraw puts it back */
 const next = f => setTimeout(f, 0);
 qa('[data-chstep]').forEach(b => b.onclick = () => { const days = calendarDays(); if (!days.length) return;
 let i = days.findIndex(x => x.iso === CHG.day); if (i < 0) i = CHG.day < days[0].iso ? -1 : days.length;
 const to = days[Math.max(0, Math.min(days.length - 1, i + Number(b.dataset.chstep)))]; if (to) { CHG.day = to.iso; CHG.said = null; render(); } });
 { const db = q('#chDay'); if (db) db.onchange = () => { if (/^\d{4}-\d{2}-\d{2}$/.test(db.value)) { CHG.day = db.value; CHG.said = null; render(); } }; }
 qa('[data-chtl]').forEach(b => b.onclick = () => { state.day = b.dataset.chtl; state.tlView = 'day'; go('timeline'); });
 { const w = q('#chWho'); if (w) w.onchange = () => { S.operator = w.value.trim(); const t = $('#who'); if (t) t.value = S.operator; save(); render(); }; }
 qa('[data-chopen]').forEach(b => b.onclick = () => openAsset(b.dataset.chopen));
 qa('[data-chpick]').forEach(b => b.onclick = () => chChoose(b.dataset.chpick, true));
 { const ty = q('#chType'); if (ty) ty.onchange = () => { CHG.type = ty.value; const a = CHG.key ? assetOf(CHG.key) : null; if (a && !chMatches(CHG.type, a)) CHG.key = null; CHG.clash = null; render(); }; }
 { const rf = q('#chRef'); if (rf) rf.onchange = () => { CHG.key = rf.value || null; CHG.clash = null; render(); }; }
 qa('[data-chdate]').forEach(el => el.onchange = () => { const k = CHG.key, w = el.dataset.chdate, v = el.value; next(() => chSetDate(k, v, w)); });
 qa('[data-chplan]').forEach(b => b.onclick = () => chSetDate(CHG.key, '', b.dataset.chplan));
 qa('[data-chtext]').forEach(el => { el.oninput = () => { el.dataset.chdirty = '1'; };
 el.onchange = () => { const k = CHG.key, f = el.dataset.chtext, v = el.value; next(() => chSetText(k, f, v)); }; });
 { const nb = q('#chNum'), na = q('#chNumAdd');
 const take = () => { const v = nb ? nb.value.trim() : ''; if (nb) { nb.value = ''; delete nb.dataset.chdirty; } return v; };
 if (nb) { nb.oninput = () => { nb.dataset.chdirty = '1'; };
 nb.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const v = take(); if (v) chNumAdd(CHG.key, v); } };
 nb.onchange = () => { const k = CHG.key, v = take(); if (v) next(() => chNumAdd(k, v)); }; }
 if (na) na.onclick = () => { const v = take(); if (v) chNumAdd(CHG.key, v); }; }
 qa('[data-chnumoff]').forEach(b => b.onclick = () => chNumOff(CHG.key, b.dataset.chnumoff));
 qa('[data-chmove]').forEach(b => b.onclick = () => chNumMove(CHG.key, b.dataset.chmove));
 qa('[data-chclashx]').forEach(b => b.onclick = () => { CHG.clash = null; CHG.addClash = null; render(); });
 qa('[data-chpin]').forEach(b => b.onclick = () => chPin(b.dataset.chpin));
 qa('[data-chunplace]').forEach(b => b.onclick = () => chPutBackOne('place', b.dataset.chunplace));
 qa('[data-chback]').forEach(b => b.onclick = () => { const i = b.dataset.chback.indexOf('|'); chPutBackOne(b.dataset.chback.slice(0, i), b.dataset.chback.slice(i + 1)); });
 /* the new one: every box is kept as it is typed, so a redraw from another phone never empties the form */
 qa('[data-chaddopen]').forEach(b => b.onclick = () => { if (!mayWrite('a new reference')) return; CHG.add = true; CHG.justAdded = null; render(); const t = $('#chNType'); if (t) t.focus(); });
 qa('[data-chaddclose]').forEach(b => b.onclick = () => { CHG.add = false; CHG.addClash = null; CHG.draft = {}; render(); });
 { const nt = q('#chNType'); if (nt) nt.onchange = () => { CHG.draft.type = nt.value; CHG.addClash = null; render(); const k = $('#chNKey'); if (k && nt.value) { try { k.focus({preventScroll: true}); k.select(); } catch (e) {} } }; }
 qa('[data-chn]').forEach(el => { const keep = () => { CHG.draft[el.dataset.chn] = el.value; if (el.dataset.chn === 'key') CHG.draft.keyTouched = true; if (el.dataset.chn === 'no') CHG.addClash = null; };
 el.oninput = keep; el.onchange = () => { keep(); if (el.dataset.chn === 'otherTrade') render(); }; });
 { const ns = q('#chNSave'); if (ns) ns.onclick = () => chAddNow(false); }
 qa('[data-chnmove]').forEach(b => b.onclick = () => chAddNow(true));
}
/* ---- pin it on the map: the Map explorer waits for a tap, and the tap is placed with placeHere */
function expRefresh(){ const w = expApi(); try { if (w && w.__ready && w.GC500Explorer && typeof w.GC500Explorer.refresh === 'function') return w.GC500Explorer.refresh(); } catch (e) {} return false; }
function chPin(key){
 if (!mayWrite('a placed position')) return;
 const a = assetOf(key); if (!a) return;
 if (!whoAmI()) return;
 if (!expOn()) { flash('The Map explorer opens on the hosted link only — nothing placed.'); return; }
 CHG.pick = {key: a.key, back: CHG.day || chDefaultDay(), at: Date.now()};
 CHG.key = a.key;
 if (!expFind(a.key)) expOpen2d();
 chPickBanner(); chPickArm();
}
function chPickArm(){
 const P = CHG.pick; if (!P) return;
 const w = expApi();
 try { if (w && w.__ready && w.GC500Explorer && typeof w.GC500Explorer.pickPoint === 'function') {
 w.GC500Explorer.pickPoint(ll => chPicked(P, ll), {label: 'Tap where ' + P.key + ' is going'}); return; } } catch (e) {}
 if (Date.now() - P.at < 90000) setTimeout(chPickArm, 250);
 else { CHG.pick = null; chPickBanner(); flash('The Map explorer did not open in time — nothing placed. Press Pin it on the map again.'); }
}
function chPicked(P, ll){
 if (CHG.pick !== P) return;
 CHG.pick = null; chPickBanner();
 if (ll && isFinite(ll.lat) && isFinite(ll.lon)) {
 const was = CHG.said; chSay(P.key + ' placed on the map at ' + ll.lat.toFixed(6) + ', ' + ll.lon.toFixed(6));
 if (!placeHere(P.key, ll.lat, ll.lon, {how: 'placed on the Map explorer'})) { CHG.said = was; return; }
 expRefresh();
 try { const w = expApi(); if (w && typeof w.selectCode === 'function') w.selectCode(P.key); } catch (e) {}
 }
 CHG.day = P.back; go('change');
}
function chPickCancel(){
 const P = CHG.pick; CHG.pick = null;
 try { const w = expApi(); if (w && w.GC500Explorer && typeof w.GC500Explorer.picking === 'function' && w.GC500Explorer.picking()) w.GC500Explorer.pickPoint(null); } catch (e) {}
 chPickBanner(); return P;
}
function chPickBanner(){
 const card = document.getElementById('expcard'); let b = document.getElementById('chPickBar');
 const P = CHG.pick;
 if (!P || !card) { if (b) b.remove(); return; }
 if (!b) { b = document.createElement('div'); b.id = 'chPickBar'; b.className = 'notice info chpickbar'; b.setAttribute('role', 'status');
 b.addEventListener('click', e => { if (!e.target.closest('[data-chpickx]')) return; const p = chPickCancel(); if (p) { CHG.day = p.back; go('change'); } }); }
 if (b.parentElement !== card) card.insertBefore(b, card.firstChild);
 b.innerHTML = `<b>Tap where ${esc(P.key)} is going</b><span class="w">the next tap on the plan places it · drag and pinch still move the map</span><button type="button" class="btn sm" data-chpickx>Cancel</button>`;
}
/* the Edit tile on the Timeline's day plate (patch_v702_plate.py puts it after Email): the plate's own compact tile.
   A view-only link keeps it - the page it opens shows everything and changes nothing. */
function dpEditTile(d){
 if (!d || !d.iso) return '';
 const ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
 return `<button type="button" class="dpt dpt-edit" data-chday="${esc(d.iso)}" title="Change the deliveries on ${esc(fmtDate(d.iso))} — the day, the asset numbers, where each goes, the pin on the map${canEdit() ? '' : ' (this link can only look)'}"><span class="dpt-i">${ico}</span><span class="dpt-w">Edit</span><span class="dpt-s">Change deliveries</span></button>`;
}
function chOpen(iso){ if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) { if (CHG.day !== iso) CHG.said = null; CHG.day = iso; } go('change'); }
document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-chday]') : null; if (!b) return; e.preventDefault(); chOpen(b.dataset.chday); });
"""

CSS = """
/* v7.02 - Change deliveries */
.chtopcard .chtop{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
.chdaynav{display:flex;align-items:center;gap:6px}
.chdaynav .btn{min-width:40px;font-size:18px;line-height:1;padding:7px 10px}
.chdaynav input[type=date]{min-height:38px;font:inherit;padding:6px 8px;border:1px solid var(--rule);border-radius:8px;background:var(--paper);color:var(--ink)}
.chday{flex:1;min-width:200px}.chday h3{margin:0;font-size:22px;letter-spacing:-.01em}
.chwho{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:10px}
.chwho label{font-weight:700;font-size:13px}.chwho input{min-width:180px;padding:6px 9px;border:1px solid var(--rule);border-radius:8px;font:inherit;background:var(--paper);color:var(--ink)}
.chwho .hint{font-size:12px;color:var(--mute)}
.chlive{display:flex;align-items:center;gap:7px;margin:10px 0 0;font-size:12.5px;color:var(--ink2)}
.chlive i{width:9px;height:9px;border-radius:50%;background:var(--tl-green);box-shadow:0 0 0 3px var(--green-soft);flex:none}
.chlive.off i{background:var(--tl-amber);box-shadow:0 0 0 3px var(--amber-soft)}
.chgrid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start;margin-top:12px}
.chside{display:grid;gap:14px;min-width:0}
.chdaycard h3{margin:0 0 8px}.chdaycard h3.chsub{margin-top:16px}
.chlist{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.chrow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 14px;align-items:start;padding:10px 12px;border:1px solid var(--rule);border-left:4px solid var(--rule);border-radius:10px 0 10px 0;background:var(--paper)}
.chrow.on{border-color:var(--orange);border-left-color:var(--orange);box-shadow:0 0 0 3px var(--glow-wide)}
.chrow.off{opacity:.62}
.chref{display:grid;gap:6px;justify-items:start}.chref .rplate{font-size:26px}
.chwhat{font-weight:700}.chname{font-size:13px;color:var(--ink2)}
.chmeta{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;font-size:12.5px;color:var(--mute)}
.chmeta b{color:var(--ink);font-weight:700}
.chgo{align-self:center}
.chform h3,.chadd h3,.chlog h3{margin:0 0 8px}
.chform .chpick{margin-bottom:10px}
.chform select,.chadd select{max-width:100%}
.chhead{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 0;border-top:1px solid var(--rule2);border-bottom:1px solid var(--rule2);margin-bottom:10px}
.chhead .rplate{font-size:30px}.chheadw{flex:1;min-width:160px}.chheadw .sub{font-size:12.5px;color:var(--mute)}
.chfields{max-width:none}
.chdrow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
.chdrow input{flex:1;min-width:150px}
.chnums{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.chnums li{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--rule);border-radius:8px;padding:3px 4px 3px 9px;background:var(--tint)}
.chnums .w{font-size:11px;color:var(--mute)}
.chnumx{border:0;background:none;color:var(--red);font-size:19px;line-height:1;cursor:pointer;padding:0 5px;border-radius:6px}
.chnumx:hover{background:var(--red-soft)}.chnumx:disabled{color:var(--mute);cursor:default;background:none}
.chclash{margin-top:8px}.chacts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.chsaid{margin:0 0 10px;padding:8px 12px;border-left:3px solid var(--tl-green);background:var(--green-soft);border-radius:4px 10px 10px 4px;font-size:13px}
.chnote{margin:10px 0 0}
.chloglist{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:13px}
.chloglist li{padding:6px 0;border-bottom:1px solid var(--rule2)}.chloglist .mono{font-size:12px;color:var(--mute);margin-right:4px}
.chloglist .btn.sm{margin-left:6px}
.chro{margin-top:12px}
#pane-change > .rochip{display:none}   /* the page says it in its own words (.chro) */
#pane-change .btn:disabled{opacity:.45;cursor:default;box-shadow:none}
.chpickbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 0 8px;border-left-color:var(--orange)}
.chpickbar .w{font-size:12.5px;color:var(--ink2)}.chpickbar .btn{margin-left:auto}
@media (max-width:900px){.chgrid{grid-template-columns:1fr}}
@media (max-width:640px){
 .chrow{grid-template-columns:auto minmax(0,1fr)}.chgo{grid-column:1 / -1}.chgo .btn{width:100%}
 .chday h3{font-size:19px}.chdaynav{width:100%}.chdaynav input[type=date]{flex:1}
 .chtopcard .chtop>.btn{width:100%}
}
@media print{#pane-change .chgo,#pane-change .chside{display:none}}
"""


def span_rep(t, start, end, new, what, path):
    """replace from `start` to the first `end` after it (both matched like rep(): whitespace-flexible, start exactly once)"""
    pat = lambda s: '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in s.split('\n'))
    ms = list(re.finditer(pat(start), t))
    if len(ms) != 1: sys.exit(f'{what}: start expected once, found {len(ms)}')
    me = re.compile(pat(end)).search(t, ms[0].end())
    if not me: sys.exit(f'{what}: end not found')
    return t[:ms[0].start()] + new + t[me.end():]


def patch(path, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function renderChange(' in t: sys.exit('v7.02 already applied')
    if 'gc500PlanCard' not in t or 'function dpPlate(' not in t: sys.exit('apply v6.99, v7.00 and v7.04 first')
    # the page's own scrub (scrub_attributions.py) squeezes " ." and " ," in any script that names the author - so none here
    for bad in (' .', ' ,', 'Andrew Fisher', 'the the '):
        if bad in JS: sys.exit('the v7.02 script contains %r, which the scrub would change' % bad)
    # 1. the code, before the Add page
    t = rep(t, "function renderAdd(){ return holdAssets(renderAdd_held); }", JS + "function renderAdd(){ return holdAssets(renderAdd_held); }", 'code', path, need)
    # 2. its pane, its tab (Tools, not the primary row), its draw and its links
    t = rep(t, '<section class="pane" id="pane-edit"></section>', '<section class="pane" id="pane-edit"></section>\n  <section class="pane" id="pane-change"></section>', 'pane', path, need)
    t = rep(t, "['edit','Edit'],", "['edit','Edit'],['change','Change deliveries'],", 'tab', path, need)
    t = rep(t, " else if (state.tab === 'edit') renderEdit();", " else if (state.tab === 'edit') renderEdit();\n else if (state.tab === 'change') renderChange(); /* v7.02 */", 'draw', path, need)
    t = rep(t, " if (/^day\\//.test(s)) return 'timeline';", " if (/^day\\//.test(s)) return 'timeline';\n if (/^change\\//.test(s)) return 'change'; /* v7.02 */", 'hashTab', path, need)
    t = rep(t, " } else if ((m = h.match(/^day\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[1]; state.tlView = 'day'; go('timeline'); }",
            " } else if ((m = h.match(/^day\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[1]; state.tlView = 'day'; go('timeline'); }\n"
            " else if ((m = h.match(/^change\\/(\\d{4}-\\d{2}-\\d{2})$/))) { CHG.day = m[1]; go('change'); } /* v7.02 - #change/<iso> opens Change deliveries on that day */", 'route', path, need)
    # 3. the Add page's save is addReference(), shared with Change deliveries - the same checks, the same record
    t = span_rep(t, "$('#aSave').onclick = () => {\n const key = $('#aKey').value.trim().toUpperCase();",
                 "render(); openAsset(key);\n };",
                 """ $('#aSave').onclick = () => {
 /* v7.02 - the save itself is addReference(), which Change deliveries uses too; this reads the form into it */
 const key = addReference({key: $('#aKey').value, disc: $('#aDisc').value, name: $('#aName').value, type: $('#aType').value, no: $('#aNo').value,
 from: $('#aFrom').value, to: $('#aTo').value, loc: $('#aLoc').value, srcRow: $('#aSrcRow') ? $('#aSrcRow').value : '', note: $('#aNote').value,
 branch: $('#aBranch') ? $('#aBranch').value : '', sheet: $('#aSheet') ? $('#aSheet').value : '', callout: $('#aCallout') ? $('#aCallout').value : ''});
 if (key) { render(); openAsset(key); }
 };""", 'add save', path)
    # 4. the Add page's words: an added asset goes to the shared record on a hosted link, not only "this browser"
    t = rep(t, """An asset added here is saved in this browser and marked <span class="chip act">added</span> everywhere it
 appears, so it is never mistaken for something the schedule supplied. Export writes it to a JSON file you can
 send on or import somewhere else.</div>""",
            """An asset added here is saved ${SYNC.on ? 'to the shared record, so everyone on the link has it within seconds,' : LW() === 'shared folder' ? 'to the shared folder' : 'in this browser'} and marked <span class="chip act">added</span> everywhere it
 appears, so it is never mistaken for something the schedule supplied. Export writes it to a JSON file you can
 send on or import somewhere else.</div>""", 'add words', path, need)
    t = rep(t, "<h3>Added in this browser (${(S.added||[]).filter(a => !assetDeleted(a.key)).length})</h3>",
            "<h3>Added in this page (${(S.added||[]).filter(a => !assetDeleted(a.key)).length})</h3>", 'add list words', path, need)
    # 5. the drawer's numbers go on and come off through the same two helpers
    t = rep(t, """ untomb('num/' + a.key + '/' + v); // typing it again is a putting-back, and is recorded as one
 if (numberErased('num/' + a.key + '/' + v)) { delete S.notes['num/' + a.key + '/' + v]; stampIt('notes', 'num/' + a.key + '/' + v); } // v5.79 — an erased typo typed again is a number again, and the Journal may say so""",
            """ /* v7.02 - the putting-back and the un-erasing are in numberPutOn(), below, shared with Change deliveries */""", 'drawer add 1', path, need)
    t = rep(t, " (S.assetNumbers[a.key] = S.assetNumbers[a.key] || []).push(v); bump();", " numberPutOn(a.key, v); bump();", 'drawer add 2', path, need)
    t = rep(t, """ S.assetNumbers[a.key] = (S.assetNumbers[a.key] || []).filter(x => x !== n);
 if (!S.assetNumbers[a.key].length) delete S.assetNumbers[a.key];""", " /* v7.02 - numberTakeOff(), below, shared with Change deliveries */", 'drawer off 1', path, need)
    t = rep(t, """ tomb('num/' + a.key + '/' + n);
 /* v5.79 — FOR GOOD.""", """ numberTakeOff(a.key, n);
 /* v5.79 — FOR GOOD.""", 'drawer off 2', path, need)
    # 6. the Edit page: its "Add a reference" landed on Today (the Add page is set aside); it opens the Add form here now
    t = rep(t, """<div class="f"><label>&nbsp;</label><button class="btn ghost" id="edAdd">Add a reference</button></div>""",
            """<div class="f"><label>&nbsp;</label><span><button class="btn ghost" id="edAdd">Add a reference</button> <button class="btn ghost" id="edChange">Change deliveries by day</button></span></div>""", 'edit buttons', path, need)
    t = rep(t, " const add = $('#edAdd'); if (add) add.onclick = () => go('add');",
            " const add = $('#edAdd'); if (add) add.onclick = () => { CHG.add = true; CHG.justAdded = null; go('change'); }; /* v7.02 - the Add page is set aside, so this landed on Today */\n"
            " const chg = $('#edChange'); if (chg) chg.onclick = () => go('change');", 'edit handlers', path, need)
    # 7. the explorer is given the references placed or pinned on the ground, and the Map tab shows the pick banner
    t = rep(t, " return {v: 1, trades, items, unplaced, layers};",
            """ /* v7.02 - a reference placed on the map (S.places) or pinned on the ground (S.fixes) with no place on the master
    plan goes over as a latitude and longitude, counted in its trade; the explorer puts it on the sheet */
 const placedOn = allAssets().filter(a => !a._cancelled && !placed(a)).map(a => { const p = bestPinFor(a), q = p ? null : bestPlaceFor(a), f = p ? p.fix : q ? q.place : null;
  return f && isFinite(f.lat) && isFinite(f.lon) ? {key: a.key, trade: a.discipline, name: a.name || a.product || '', ll: [f.lat, f.lon], assets: (a.asset_numbers || []).join(', '), how: p ? 'pinned on the ground' : 'placed, not measured', by: f.by || '', at: f.at || ''} : null; }).filter(Boolean);
 let newTrade = false;
 placedOn.forEach(p => { const tr = trades.find(x => x.name === p.trade), n = (tr ? tr.n : 0) + 1, u = discUnit(p.trade), c = u.one === 'asset' ? String(n) : discCount(p.trade, n);
  if (tr) { tr.n = n; tr.count = c; } else { trades.push({name: p.trade, n, count: c}); newTrade = true; } });
 if (newTrade) trades.sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
 return {v: 1, trades, items, unplaced, layers, placed: placedOn};""", 'plan items', path, need)
    t = rep(t, " expSize(); expFlush(); expFlush3d();\n}", " expSize(); expFlush(); expFlush3d();\n chPickBanner(); expRefresh(); /* v7.02 - the pick banner, and a placed reference on the explorer */\n}", 'explorer tab', path, need)
    # 8. a change from another phone redraws Change deliveries at once, even with a box in use there: its redraw keeps
    #    that box's words, cursor and focus (chKeepPlace). Everywhere else still waits for the person to leave the box.
    t = rep(t, " const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'button' && el.type !== 'date' && el.type !== 'time' && el.id !== 'q';",
            " const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'button' && el.type !== 'date' && el.type !== 'time' && el.id !== 'q'\n"
            " && !(el.tagName === 'INPUT' && state.tab === 'change' && el.closest('#pane-change')); /* v7.02 - Change deliveries keeps the box across its redraw */", 'redraw', path, need)
    # 9. the Timeline's "Give it a reference" called go('add') and landed on Today (the Add page is set aside): the row's
    #    words go to the Add form on Change deliveries instead, through the same save
    t = rep(t, " — the row carried no GC500 reference.${onhireNote}`};\n go('add');",
            " — the row carried no GC500 reference.${onhireNote}`};\n chAddFromRow(state.addPrefill); state.addPrefill = null; /* v7.02 - the Add page is set aside; this landed on Today */", 'give reference', path, need)
    # 10. three descendant selectors the scrub squeezed into compound ones (" ." -> "."), so each matched nothing: the
    #     read-only chip never reached a pane, the tile figures were never fitted, the wide tables never took the keyboard.
    #     Written with \x20 so the scrub cannot squeeze them again.
    t = rep(t, "document.querySelectorAll('main.pane').forEach(pane => {", "document.querySelectorAll('main\\x20.pane').forEach(pane => { /* v7.02 - descendant selectors: the space is written \\x20, out of the scrub's reach */", 'sel main pane', path, need)
    t = rep(t, "const els = [...document.querySelectorAll('.pane.on.kpi.v')]; if (!els.length) return;", "const els = [...document.querySelectorAll('.pane.on\\x20.kpi\\x20.v')]; if (!els.length) return; /* v7.02 - \\x20 is the descendant space */", 'sel kpi', path, need)
    t = rep(t, "document.querySelectorAll('.pane.on.tblwrap:not([tabindex])')", "document.querySelectorAll('.pane.on\\x20.tblwrap:not([tabindex])') /* v7.02 - \\x20 is the descendant space */", 'sel tblwrap', path, need)
    # 10b. a view link on a slow phone draws before the service has said what it may do: when the answer changes the
    #      capability, Change deliveries is drawn again (its buttons and its notice follow the answer, not only its boxes)
    t = rep(t, "function applyCapability(root){\n const cap = capability(), ro = cap !== 'edit';",
            "function applyCapability(root){\n const cap = capability(), ro = cap !== 'edit';\n if (!root && state.tab === 'change' && CHG.cap && CHG.cap !== cap) setTimeout(render, 0); /* v7.02 */", 'capability redraw', path, need)
    # 11. the day plate's Edit tile - one insertion and its CSS, in its own file
    t = patch_v702_plate.apply(t, path, need)
    k = t.find('</style>'); t = t[:k] + CSS + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
