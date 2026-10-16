"""Author: Andrew Fisher. v10.57 part 2 - completed Build day cards say WHAT WENT IN, by category (Andrew, 17 Oct 2026,
on the Build (Timeline) tab: "Dont give me a refernce description give me water barriers. Or Toilets or something bettwr
than whta you have on the cards. ... Needs to be neat and tidy its a card of that day with details.").

- Each completed (past) Build day card swaps v10.56's one-line-per-reference list ("P55 · Gate 1 Ticket Box / 1 x
  Ticket Box 6m", "+13 more") for a heading WHAT WENT IN and a neat two-column grid of tiles, one per category: the
  number (with "m" for metres), the category word and one short line in item words. No reference keys on the card.
  Order: Buildings, Toilets, Water barriers, Generators, Lighting towers, VMS boards, Forklifts, Track mat, Furniture,
  then Fencing (mesh metres; "x m scrimmed · n ped gates" underneath, scrim never added to the metres) and Crowd
  barriers (event + demarcation + flat feet). Every category shows; there is no "+n more" on a normal day.
- How a day is counted: close to close, per reference and item - what was on site at that day's close less what was on
  site at the day before's close. The site light wins over the rental system's on-hire date unless the reference never
  had a site light. Toilets use the page's own toilet reading (toiletRows962: dated receipts, programme holds). Other
  items take a dated receipt's quantity once it is dated, else the charge line's. Source-linked aliases
  (physicalCountAssets963), cancelled references, relocations and rest-of follow-ups are left out. Waste tanks sit in
  the Toilets line ("+2 waste tanks"). A receipt with no site light (today T0158) is not counted; the card carries one
  amber line and More info gives the detail.
- More info lists, per category, each reference with its quantity and where the number came from (site light HH:MM,
  receipt HH:MM, rental system on-hire date), then the fencing dockets, fence moves and removals, receipts without a
  site light, anything that went off, site lights that added nothing (set again, on and off, or held), and the other
  work recorded (installed, levelled, stairs, service notes, collections).
- Only completed Build cards change. Demob cards, today and upcoming cards are untouched (the card and More info
  wrappers only act on a work object that carries cats1057).

The record does not change. No footer bump here (the release integrator does that).

    python3 part2_daycats.py path/to/page.html   (on the v10.56 page, or after the other v10.57 parts)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

JS = r'''/* Author: Andrew Fisher. v10.57 - completed Build day cards: what went in that day, by category, counted close to close; where each number came from is in More info. */
(function(W){
 'use strict';
 const D = W.document;
 if (!W.daycards1056 || W.daycats1057 || !W.BuildWork986 || !W.BuildWorkView986) return;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const ISO = /^\d{4}-\d{2}-\d{2}$/;
 const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 const dmy = iso => ISO.test(String(iso)) ? Number(iso.slice(8, 10)) + ' ' + MON[Number(iso.slice(5, 7)) - 1] : String(iso || '');
 const dayOf = at => { if (!at) return ''; let x = ''; try { x = isoIn(at); } catch (y) {} return ISO.test(x) ? x : ''; };
 const hm = at => { try { const t = new Date(at); return isNaN(t) ? '' : t.toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); } catch (x) { return ''; } };
 const prev = iso => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
 const fmt = n => String(Math.round(n * 100) / 100);
 const memo = (k, f) => typeof heldMemo === 'function' ? heldMemo('dc1057|' + k, f) : f();

 /* categories, in Andrew's words, in the card's order */
 const KIND = {building: 'buildings', container: 'buildings', toilet: 'toilets', accessible_toilet: 'toilets', toilet_block: 'toilets', pee_panel: 'toilets', fwf_trailer: 'toilets',
  waste_tank: 'tanks', water_barrier: 'barriers', generator: 'generators', light_tower: 'towers', vms_board: 'vms', forklift: 'forklifts', trakmat: 'trakmat', fridge: 'furniture', chair: 'furniture'};
 const WORD = {'Portable buildings': 'buildings', 'Portable Building': 'buildings', 'Toilets & amenities': 'toilets', 'Toilet': 'toilets', 'Water-filled barriers': 'barriers', 'WFB': 'barriers',
  'Generators': 'generators', 'Generator': 'generators', 'Lighting towers': 'towers', 'Light Tower': 'towers', 'Variable message signs': 'vms', 'VMS': 'vms', 'Trakmat': 'trakmat', 'Furniture': 'furniture'};
 const NAME = {buildings: 'Buildings', toilets: 'Toilets', tanks: 'Waste tanks', barriers: 'Water barriers', generators: 'Generators', towers: 'Lighting towers', vms: 'VMS boards',
  forklifts: 'Forklifts', trakmat: 'Track mat', furniture: 'Furniture'};
 const ORDER = ['buildings', 'toilets', 'tanks', 'barriers', 'generators', 'towers', 'vms', 'forklifts', 'trakmat', 'furniture'];
 const rank = id => { const i = ORDER.indexOf(id); return i < 0 ? 50 : i; };
 function catOf(item, a){
  let k = null; try { k = W.Unload929 && W.Unload929.kindOf(item, a); } catch (x) {}
  if (k && KIND[k]) return KIND[k];
  return WORD[a.product] || WORD[a.discipline] || 'other:' + String(a.discipline || a.product || 'Other equipment');
 }
 const catName = id => NAME[id] || String(id).replace(/^other:/, '');
 const isToilet = a => !!a && (a.product === 'Toilet' || a.discipline === 'Toilets & amenities');

 /* which references count: one per physical delivery (source-linked aliases dropped), nothing cancelled, moved or a rest-of follow-up */
 function refs(){ return memo('refs', () => physicalCountAssets963(allAssets()).assets.filter(a => a && a.key && !a._cancelled && !a.relocation && !a.rest_of)); }
 function itemsOf(a){ return memo('i|' + a.key, () => itemsOf0(a)); }
 function itemsOf0(a){
  const m = new Map();
  (chargeLines(a) || []).forEach(l => { if (!l || !l.item) return; let q = null; try { q = qtyOf(l); } catch (x) {} q = q == null || !Number.isFinite(Number(q)) ? 1 : Number(q); m.set(l.item, (m.get(l.item) || 0) + q); });
  return m;
 }
 function receipt(a, item){
  const rs = (((S.supplied || {})[a.key] || {}).items || []).filter(r => r && r.asked === item); if (rs.length !== 1) return null;
  const v = rs[0].qty_supplied; if (v == null || String(v).trim() === '' || !Number.isInteger(Number(v)) || Number(v) < 0) return null;
  const at = (S.stamps || {})['supplied/' + a.key + '/' + item] || null; return {q: Number(v), at, day: dayOf(at)};
 }
 const hist = (a, field) => memo('h|' + field + '|' + a.key, () => histOf(a.key, field));
 function hasSiteLight(a){ let d = null; try { d = deliveryOf(a.key); } catch (x) {} return hist(a, 'history').length > 0 || !!(d && d.recorded && d.where !== 'rental'); }
 /* the reference's record at a day's close; the site light wins over the rental date unless the reference never had a site light */
 function stateAt(a, iso){
  let d = deliveryAsOf(a.key, iso);
  if (d && d.where === 'rental' && hasSiteLight(a)) d = Object.assign({}, d, {recorded: false, state: 'not on site', where: null, rentalOverruled: true});
  return d || {recorded: false, state: 'not on site'};
 }
 /* what was on site at a day's close: item -> quantity */
 function onBy(a, iso){
  return memo(a.key + '|' + iso, () => {
   const d = stateAt(a, iso), q = new Map(), held = new Map(), on = !!(d.recorded && d.state === 'on site');
   if (isToilet(a)) {
    let t = null; try { t = toiletRows962(a, d, chargeLines(a), iso); } catch (x) { t = null; }
    if (t) { t.rows.forEach(r => { q.set(r.item, (q.get(r.item) || 0) + r.arrived); held.set(r.item, r.held || 0); }); return {q, held, rows: t.rows, on, d}; }
   }
   itemsOf(a).forEach((n, item) => { const r = receipt(a, item); q.set(item, on ? (r && r.day && r.day <= iso ? r.q : n) : 0); });
   return {q, held, rows: null, on, d};
  });
 }
 /* the site light's own times on a day */
 function lightOn(a, iso){
  const h0 = hist(a, 'history'); let at = null; h0.forEach(h => { if (h.state === 'on site' && dayOf(h.at) === iso) at = h.at; });
  if (!at && !h0.length) { let d = null; try { d = deliveryOf(a.key); } catch (x) {} if (d && d.recorded && d.where !== 'rental' && d.state === 'on site' && dayOf(d.set_at) === iso) at = d.set_at; }
  return at;
 }
 function lightOff(a, iso){ let x = null; hist(a, 'history').forEach(h => { if (h.state !== 'on site' && dayOf(h.at) === iso) x = h; }); return x; }
 function lightBefore(a, iso){ let x = null; hist(a, 'history').forEach(h => { if (h.state === 'on site' && dayOf(h.at) && dayOf(h.at) < iso) x = h; }); return x; }
 function doneAt(a, iso){ let at = null; hist(a, 'done_history').forEach(h => { if (h.done && dayOf(h.at) === iso) at = h.at; }); if (!at) { let d = null; try { d = deliveryOf(a.key); } catch (x) {} if (d && d.done && dayOf(d.done_at) === iso) at = d.done_at; } return at; }
 /* where a number came from */
 function how(a, item, iso, now, was){
  if (now.d && now.d.where === 'rental') return 'Rental system on-hire date · no site light recorded';
  const r = receipt(a, item), lit = lightOn(a, iso), ordered = itemsOf(a).get(item) || 0, had = was.q.get(item) || 0, has = now.q.get(item) || 0, bits = [];
  const recToday = !!(r && r.day === iso);
  if (lit) bits.push((was.on ? 'Site light set again ' : 'Site light ') + hm(lit));
  if (recToday) bits.push('Receipt ' + hm(r.at) + (r.q !== ordered ? ' says ' + r.q + ' (the charge line says ' + ordered + ')' : had > 0 || r.q < ordered ? ' · ' + r.q + ' of ' + ordered + ' received' : ''));
  else if (r && r.day && r.day < iso && !isToilet(a) && r.q !== ordered) bits.push('quantity from the receipt of ' + dmy(r.day) + ' (the charge line says ' + ordered + ')');
  if (recToday && !now.on) bits.push('before the site light was set');
  if (recToday && !lit && was.on) { const b = lightBefore(a, iso); if (b) bits.push('site light since ' + dmy(dayOf(b.at))); }
  if (!bits.length) { const t = doneAt(a, iso); bits.push(t ? 'Installed tick ' + hm(t) : 'Site record at the day’s close'); }
  if (had > 0) bits.push(had + ' counted earlier');
  const held = now.held.get(item) || 0; if (held > 0) bits.push(has + ' of ' + ordered + ' by the programme row for the day, ' + held + ' held for a later row (not a site count)');
  return bits.join(' · ');
 }
 function offHow(a, item, iso){
  const x = lightOff(a, iso); if (x) return 'Site light set to ' + x.state + ' ' + hm(x.at);
  const r = receipt(a, item); if (r && r.day === iso) return 'Receipt ' + hm(r.at) + ' says ' + r.q;
  return 'Site record at the day’s close';
 }
 /* what came in on a day, close to close */
 function cameIn(iso){
  const p = prev(iso), cats = new Map(), off = [], noLight = [], lights = [];
  const add = (id, line) => { if (!cats.has(id)) cats.set(id, {id, name: catName(id), n: 0, lines: []}); const g = cats.get(id); g.n += line.n; g.lines.push(line); };
  refs().forEach(a => {
   const now = onBy(a, iso), was = onBy(a, p), name = String(a.name || '').trim();
   let gained = 0;
   new Set([...now.q.keys(), ...was.q.keys()]).forEach(item => {
    const n = (now.q.get(item) || 0) - (was.q.get(item) || 0); if (!n) return;
    if (n > 0) { gained += n; add(catOf(item, a), {ref: a.key, name, item, n, how: how(a, item, iso, now, was)}); }
    else off.push({ref: a.key, name, item, n: -n, cat: catName(catOf(item, a)), how: offHow(a, item, iso)});
   });
   if (!isToilet(a) && (S.supplied || {})[a.key]) itemsOf(a).forEach((q, item) => { const r = receipt(a, item); if (r && r.day === iso && r.q > 0 && !now.on) noLight.push({ref: a.key, name, item, q: r.q, of: q, at: r.at, cat: catName(catOf(item, a))}); });
   if (!gained) {
    const lit = lightOn(a, iso); if (!lit) return;
    let why;
    if (!now.on) { const x = lightOff(a, iso); why = 'Site light set on site ' + hm(lit) + (x ? ', then to ' + x.state + ' ' + hm(x.at) : '') + ' · not on site at the day’s close, not counted'; }
    else if (was.on) { const b = lightBefore(a, iso); why = 'Site light set again ' + hm(lit) + ' · already on site' + (b ? ' since ' + dmy(dayOf(b.at)) + ' ' + hm(b.at) : '') + ', counted then'; }
    else {
     const later = (now.rows || []).filter(r => r.receiptDay && r.receiptDay > iso).map(r => r.receiptDay).sort()[0];
     const held = [...now.held.values()].some(v => v > 0);
     why = 'Site light ' + hm(lit) + ' · nothing counted this day' + (later ? ' · its receipt is dated ' + dmy(later) : held ? ' · held for a later programme row' : ' · no quantity recorded');
    }
    lights.push({ref: a.key, name, how: why});
   }
  });
  return {iso, cats, off, noLight, lights};
 }
 /* item words for the card's short line */
 function word(id, item){
  const t = String(item || '').trim(), m0 = s => s.replace(/(\d+)\.0m/g, '$1m');
  if (id === 'buildings') { let m;
   if ((m = t.match(/ticket\s*box\s*([\d.]+\s*m)/i))) return 'ticket box ' + m0(m[1].replace(/\s+/g, ''));
   if ((m = t.match(/([\d.]+)\s*m\s*refrigerat\w*\s*cont/i))) return m0(m[1] + 'm') + ' fridge container';
   if ((m = t.match(/([\d.]+)\s*m\s*cont/i))) return m0(m[1] + 'm') + ' container';
   if (/event\s*container/i.test(t)) return 'event container';
   if ((m = t.match(/building\s*([\d.]+\s*m)\b/i))) return m0(m[1].replace(/\s+/g, ''));
   return t.toLowerCase(); }
  if (id === 'toilets') { let k = null; try { k = W.Unload929.kindOf(t); } catch (x) {}
   if (k === 'toilet_block') return /16\s*pan/i.test(t) ? '16-pan block' : 'block';
   if (k === 'accessible_toilet') return 'accessible';
   if (k === 'pee_panel') return 'pee panel';
   if (k === 'fwf_trailer') return 'FWF trailer';
   return t; }
  if (id === 'tanks') return 'waste tank';
  if (id === 'generators') { const m = t.match(/(\d+(?:\.\d+)?)\s*kva/i); return m ? m[1] + ' kVA' + (/trailer/i.test(t) ? ' trailer' : '') : t; }
  if (id === 'forklifts') { const m = t.match(/(\d+(?:\.\d+)?)\s*t\b/i); return m ? m[1] + 'T' + (/\bRT\b/.test(t) ? ' rough terrain' : '') : t; }
  if (id === 'furniture') return /fridge|refrigerat/i.test(t) ? (/\blge\b|large/i.test(t) ? 'large fridge' : 'fridge') : /chair/i.test(t) ? 'chair' : t.toLowerCase();
  return t;
 }
 const PLURAL = {'block': 'blocks', '16-pan block': '16-pan blocks', 'pee panel': 'pee panels', 'FWF trailer': 'FWF trailers', 'waste tank': 'waste tanks', 'fridge': 'fridges', 'large fridge': 'large fridges', 'chair': 'chairs'};
 function counted(id, w, n){
  if (id === 'toilets' || id === 'furniture' || id === 'tanks') return n + ' ' + (n === 1 ? w : PLURAL[w] || w);
  return n > 1 ? n + ' × ' + w : w;
 }
 /* buildings read largest first, then ticket boxes, then containers */
 function order(id, w){ if (id !== 'buildings') return 0; const s = parseFloat(w) || parseFloat(String(w).replace(/^\D+/, '')) || 0; return (/^[\d.]+m$/.test(w) ? 0 : /ticket/.test(w) ? 100 : /container/.test(w) ? 200 : 300) - s; }
 function subOf(g, tanks){
  const by = new Map(); g.lines.forEach(l => { const w = word(g.id, l.item); by.set(w, (by.get(w) || 0) + l.n); });
  const places = new Set(g.lines.map(l => l.ref)).size;
  let parts;
  const where = places + (places === 1 ? ' location' : ' locations');
  if (g.id === 'barriers') parts = [[...by.keys()].join(' · '), where];
  else if (['towers', 'vms', 'trakmat'].includes(g.id)) parts = [where];
  else parts = [...by.entries()].sort((x, y) => y[1] - x[1] || order(g.id, x[0]) - order(g.id, y[0])).map(([w, n]) => counted(g.id, w, n));
  if (g.id === 'buildings' && parts.join(' · ').length > 30) {
   const ty = new Map(); by.forEach((n, w) => { const k = /^[\d.]+m$/.test(w) ? 'building' : /ticket/.test(w) ? 'ticket box' : /container/.test(w) ? 'container' : w; ty.set(k, (ty.get(k) || 0) + n); });
   parts = [...ty.entries()].map(([k, n]) => n + ' ' + (n === 1 ? k : k === 'ticket box' ? 'ticket boxes' : k + 's'));
  }
  if (tanks) parts.push('+' + counted('tanks', 'waste tank', tanks.n));
  return parts.filter(Boolean).join(' · ');
 }
 function tilesOf(c){
  const tanks = c.cats.get('tanks'), ids = [...c.cats.keys()].filter(id => id !== 'tanks' || !c.cats.has('toilets'));
  ids.sort((x, y) => rank(x) - rank(y) || x.localeCompare(y));
  return ids.map(id => { const g = c.cats.get(id); return {id, name: g.name, n: g.n, unit: '', sub: subOf(g, id === 'toilets' ? tanks : null)}; });
 }
 /* fencing from the day's own docket rows (BuildWork986 already sums them) */
 function fence(rows){
  const v = label => (rows || []).filter(r => r && r.kind === 'fencing' && r.label === label).reduce((t, r) => t + (parseFloat(r.value) || 0), 0);
  const mesh = v('Mesh fence'), scrim = v('Scrim'), ped = v('Pedestrian gates'), veh = v('Vehicle gates');
  const ev = v('CCB · event'), dem = v('CCB · demarcation'), ff = v('CCB · flat feet');
  const moved = v('Fence relocation'), removed = v('Fence removal'), back = v('Fence reinstatement'), scrimOld = v('Scrim applied to existing fence');
  const gates = [ped > 0 ? fmt(ped) + (ped === 1 ? ' ped gate' : ' ped gates') : '', veh > 0 ? fmt(veh) + (veh === 1 ? ' vehicle gate' : ' vehicle gates') : ''];
  const tiles = [];
  if (mesh > 0) tiles.push({id: 'fencing', name: 'Fencing', n: mesh, unit: 'm', sub: [scrim > 0 ? fmt(scrim) + ' m scrimmed' : 'Mesh fence'].concat(gates).filter(Boolean).join(' · ')});
  const ccb = ev + dem + ff, parts = [[ev, 'event'], [dem, 'demarcation'], [ff, 'flat feet']].filter(x => x[0] > 0);
  if (ccb > 0) tiles.push({id: 'ccb', name: 'Crowd barriers', n: ccb, unit: 'm', sub: parts.length === 1 ? ({event: 'Event barriers', demarcation: 'Demarcation', 'flat feet': 'Flat feet'})[parts[0][1]] : parts.map(x => fmt(x[0]) + ' ' + x[1]).join(' · ')});
  if (!tiles.length) {
   const work = moved + removed + back + scrimOld + scrim, sub = [scrim + scrimOld > 0 ? fmt(scrim + scrimOld) + ' m scrimmed' : '', moved > 0 ? fmt(moved) + ' m moved' : '', removed > 0 ? fmt(removed) + ' m removed' : '', back > 0 ? fmt(back) + ' m reinstated' : ''].concat(gates).filter(Boolean).join(' · ');
   if (work > 0) tiles.push({id: 'fencework', name: 'Fence work', n: work, unit: 'm', sub});
   else if (ped + veh > 0) tiles.push({id: 'fencework', name: 'Fence gates', n: ped + veh, unit: '', sub: gates.filter(Boolean).join(' · ')});
  }
  return {tiles, mesh, scrim, ped, veh, ev, dem, ff, moved, removed, back, scrimOld};
 }
 /* the day's work, regrouped: category tiles first, the rest kept for More info */
 const day0 = W.BuildWork986.day;
 W.BuildWork986.day = function(iso, today){
  const w = day0.apply(this, arguments);
  try {
   if (!w || !Array.isArray(w.rows) || w.ready === false || !w.recorded) return w;
   const t = ISO.test(String(today || '')) ? today : todayIso(); if (!ISO.test(String(iso)) || !(iso < t)) return w;
   const c = cameIn(iso), f = fence(w.rows), tiles = tilesOf(c).concat(f.tiles);
   const rows = tiles.map(x => ({label: x.name, value: fmt(x.n) + (x.unit ? ' ' + x.unit : ''), sub: x.sub, kind: 'cat1057', cat: x.id}));
   w.rows.forEach(r => { if (!r || r.kind === 'arrival' || r.kind === 'empty-record') return; rows.push(Object.assign({}, r, {kind: r.kind === 'fencing' ? 'fence1057' : 'more1057', was: r.kind})); });
   const groups = [...c.cats.values()].sort((x, y) => rank(x.id) - rank(y.id) || x.id.localeCompare(y.id));
   const out = Object.assign({}, w, {rows, details: (w.details || []).filter(d => d && d.kind !== 'arrival'), empty: false,
    cats1057: {iso, tiles, groups, off: c.off, noLight: c.noLight, lights: c.lights, fence: f}});
   if (!rows.length) { out.rows = [{label: 'Works', value: 'No work recorded', kind: 'empty-record'}]; out.empty = true; }
   return out;
  } catch (x) { return w; }
 };
 /* the card face: WHAT WENT IN, a two-column grid of tiles */
 function cardHtml(work){
  const c = work.cats1057, tiles = c.tiles || [], other = (work.rows || []).filter(r => r.kind === 'more1057');
  const tile = x => '<span class="dc1057-tile" data-cat1057="' + e(x.id) + '"><span class="dc1057-n">' + e(fmt(x.n)) + (x.unit ? '<small>' + e(x.unit) + '</small>' : '') + '</span><span class="dc1057-k">' + e(x.name) + '</span>' +
   (x.sub ? '<span class="dc1057-s" title="' + e(x.sub) + '">' + e(x.sub) + '</span>' : '') + '</span>';
  const quiet = c.off.length || c.lights.length;
  let body = tiles.length ? '<span class="dc1057-grid">' + tiles.map(tile).join('') + '</span>' : '<span class="bc986-work-empty">' + (other.length || quiet ? 'Nothing new went in' + (quiet && !other.length ? ' · More info' : '') : 'No work recorded') + '</span>';
  if (!tiles.length && other.length) body += '<span class="dc1057-other">' + e(other.map(r => r.label + ' ' + String(r.value).replace(/ refs?$/, '')).join(' · ')) + '</span>';
  if (c.noLight.length) {
   const by = new Map(); c.noLight.forEach(x => { const k = x.cat; const o = by.get(k) || {q: 0, of: 0}; o.q += x.q; o.of += x.of; by.set(k, o); });
   body += '<span class="dc1057-flag">' + e([...by.entries()].map(([k, o]) => o.q + ' of ' + o.of + ' ' + (o.of === 1 ? k.replace(/s$/, '') : k) + ' receipted with no site light · not counted').join(' · ')) + '</span>';
  }
  return '<span class="bc986-work"><span class="bc984-label bc986-work-heading">WHAT WENT IN</span>' + body + '</span>';
 }
 const card0 = W.BuildWorkView986.card;
 W.BuildWorkView986.card = function(work){
  if (!work || !work.cats1057) return card0.apply(this, arguments);
  try { return cardHtml(work); } catch (x) { return card0.apply(this, arguments); }
 };
 /* More info: each reference, its quantity and where the number came from; then the rest of the day's work */
 function li(label, source, cls){ return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + e(label) + '</span>' + (source ? ' <small>' + e(source) + '</small>' : '') + '</li>'; }
 function list(rows){ return rows.length ? '<ul>' + rows.map(r => '<li><span>' + e(r.label) + '</span>' + (r.refs && r.refs.length ? ' <span class="bc986-work-refs">' + r.refs.map(e).join(', ') + '</span>' : '') + (r.source ? ' <small>' + e(r.source) + '</small>' : '') + '</li>').join('') + '</ul>' : ''; }
 const head = (t, cls) => '<p class="dc1057-h' + (cls ? ' ' + cls : '') + '"><b>' + e(t) + '</b></p>';
 const refLine = l => l.ref + (l.name ? ' · ' + l.name : '');
 function detailsHtml(work){
  const c = work.cats1057, rows = work.rows || [], det = work.details || [];
  let h = '<section class="bc986-work-details dc1057-details"><b>What went in · where each number comes from</b>';
  if (!c.groups.length) h += '<p>Nothing new went in this day.</p>';
  c.groups.forEach(g => { h += head(g.name + ' ' + fmt(g.n)) + '<ul>' + g.lines.map(l => li(refLine(l) + ' · ' + fmt(l.n) + ' × ' + l.item, l.how)).join('') + '</ul>'; });
  const fd = det.filter(d => d.kind === 'fencing'), fo = det.filter(d => d.kind === 'fencing-operation');
  const ft = c.tiles.filter(x => ['fencing', 'ccb', 'fencework'].includes(x.id)).map(x => x.name + ' ' + fmt(x.n) + (x.unit ? ' ' + x.unit : ''));
  if (fd.length) h += head((ft.length ? ft.join(' · ') + ' · ' : 'Fencing · ') + 'from the dockets') + list(fd);
  if (fo.length) h += head('Work on existing fence (moved, removed, reinstated or scrimmed) · not new fence') + list(fo);
  if (c.noLight.length) h += head('Receipts with no site light · not counted', 'dc1057-amber') + '<ul>' + c.noLight.map(x => li(refLine(x) + ' · ' + x.q + ' of ' + x.of + ' ' + x.item + ' receipted', 'Receipt ' + hm(x.at) + ' · the site light is not set to on site, so the card does not count them until it is', 'dc1057-amber')).join('') + '</ul>';
  if (c.off.length) h += head('Went off') + '<ul>' + c.off.map(x => li(refLine(x) + ' · ' + fmt(x.n) + ' × ' + x.item, x.how)).join('') + '</ul>';
  if (c.lights.length) h += head('Site lights that added nothing') + '<ul>' + c.lights.map(x => li(refLine(x), x.how)).join('') + '</ul>';
  const other = rows.filter(r => r.kind === 'more1057'), od = det.filter(d => d && !['fencing', 'fencing-operation', 'arrival'].includes(d.kind));
  if (other.length || od.length) h += head('Other work recorded') + (other.length ? '<dl>' + other.map(r => '<div><dt>' + e(r.label) + '</dt><dd>' + e(r.value) + '</dd></div>').join('') + '</dl>' : '') + list(od);
  if ((work.issues || []).length) h += '<p>' + work.issues.map(e).join(' ') + '</p>';
  return h + '</section>';
 }
 const details0 = W.BuildWorkView986.details;
 W.BuildWorkView986.details = function(work){
  if (!work || !work.cats1057) return details0.apply(this, arguments);
  try { return detailsHtml(work); } catch (x) { return details0.apply(this, arguments); }
 };
 const st = D.createElement('style'); st.id = 'daycats1057-style';
 st.textContent =
  ':is(#pane-timeline) .dc1057-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:2px}' +
  ':is(#pane-timeline) .dc1057-tile{display:flex;flex-direction:column;min-width:0;padding:6px 10px 7px;border-radius:10px;background:#08182acc;border:1px solid #8fb3c440;text-shadow:0 1px 4px #06111fe0}' +
  ':is(#pane-timeline) .dc1057-n{font-size:20px;line-height:1.15;font-weight:700;font-variant-numeric:tabular-nums;color:#f6faf8;white-space:nowrap}' +
  ':is(#pane-timeline) .dc1057-n small{font-size:12px;font-weight:650;margin-left:2px;color:#d6e2e8}' +
  ':is(#pane-timeline) .dc1057-k{font-size:11.5px;line-height:1.3;font-weight:650;color:#e3ecef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  ':is(#pane-timeline) .dc1057-s{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin-top:1px;font-size:10.5px;line-height:1.35;color:#bac8ce;overflow-wrap:anywhere}' +
  ':is(#pane-timeline) .dc1057-other{display:block;margin-top:3px;font-size:11px;line-height:1.4;color:#bac8ce;overflow-wrap:anywhere}' +
  ':is(#pane-timeline) .dc1057-flag{display:block;margin-top:7px;font-size:11px;line-height:1.4;font-weight:600;color:#ffc46b}' +
  ':is(#pane-timeline) .dc1057-details .dc1057-h{margin:10px 0 2px}' +
  ':is(#pane-timeline) .dc1057-details dt small{display:inline;margin-left:6px;font-weight:400}' +
  ':is(#pane-timeline) .dc1057-details .dc1057-amber b,:is(#pane-timeline) .dc1057-details li.dc1057-amber>span{color:#a35a00}';
 D.head.appendChild(st);
 W.daycats1057 = {version: 'v10.57', cameIn, onBy, tilesOf, fence, catOf, word, refs, card0, details0, day0};
})(window);
'''

NEW = "</script>\n<script id=\"daycats1057-script\">" + JS + "</script>\n</body>\n</html>"

PATCHES = [
    ('day-card categories (what went in) script at the end of the page', END, NEW),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'daycats1057-script' in t: sys.exit('part2_daycats refuses a repeat')
    if 'daycards1056-script' not in t: sys.exit('part2_daycats needs the v10.56 page (daycards1056-script not found)')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part2_daycats applied: completed Build day cards show what went in by category; More info gives each number\'s source')
