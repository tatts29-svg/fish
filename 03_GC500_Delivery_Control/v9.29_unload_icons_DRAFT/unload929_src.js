/* Author: Andrew Fisher. v9.29 unload-order icons: on each Arrange loads row, one small icon for each item that comes
   off that truck, with its count, in the order it comes off. Stops follow the load's own order; at one stop a waste
   tank comes off before the toilet block that sits on it. Read only: it reads the same items the load card shows
   (dpItems) and the item kinds the master shapes use (Shapes926.kind), and writes nothing. */
const Unload929 = (() => {
 'use strict';
 const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
 /* the reference's discipline, only when the schedule gives no item at all */
 const DISC = {'Toilets & amenities': 'toilet', 'Generators': 'generator', 'Water-filled barriers': 'water_barrier',
  'Variable message signs': 'vms_board', 'Lighting towers': 'light_tower', 'Portable buildings': 'building'};
 const NAME = {toilet: 'Toilet', toilet_block: 'Toilet block', waste_tank: 'Waste tank', accessible_toilet: 'Accessible toilet',
  pee_panel: 'Pee panel', fwf_trailer: 'Toilet trailer', generator: 'Generator', light_tower: 'Lighting tower', vms_board: 'VMS board',
  forklift: 'Forklift', trakmat: 'Trakmat', container: 'Container', building: 'Portable building', water_barrier: 'Water-filled barrier',
  distribution_board: 'Distribution board', fridge: 'Fridge', chair: 'Chair', equipment: 'Equipment'};
 const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
 const F = 'fill="currentColor" stroke="none"';
 /* narrow items 24 x 24, long items 36 x 24 (blocks, tanks, buildings, containers, trailers, barriers) */
 const ICON = {
  toilet: [24, `<path ${S} d="M6.5 7.5c0-2.6 2.5-4.3 5.5-4.3s5.5 1.7 5.5 4.3"/><path ${S} d="M6.5 7.5V21h11V7.5z"/><path ${S} d="M9.2 21V10h5.6v11"/><path ${S} d="M10.8 12.2h2.4"/><circle ${F} cx="13.5" cy="16" r=".9"/><path ${S} d="M17.5 9.5h1.6V5"/>`],
  accessible_toilet: [24, `<path ${S} d="M2.5 4h19"/><rect ${S} x="3.5" y="4" width="17" height="17" rx="1"/><circle ${F} cx="11" cy="7.9" r="1.4"/><path ${S} d="M11 10.2v4.3h4.2l1.6 3.3"/><path ${S} d="M9.1 12.7a3.6 3.6 0 1 0 5 4.5"/>`],
  pee_panel: [24, `<rect ${S} x="7" y="3" width="10" height="13.5" rx="1.2"/><path ${S} d="M5.5 16.5h13l-1.3 4H6.8z"/><path ${F} d="M12 7.2c1.3 1.7 1.9 2.7 1.9 3.6a1.9 1.9 0 0 1-3.8 0c0-.9.6-1.9 1.9-3.6z"/>`],
  generator: [24, `<rect ${S} x="2.5" y="6.5" width="19" height="12.5" rx="1.5"/><path ${S} d="M5.5 19v2M18.5 19v2"/><path ${F} d="M13.4 8.4l-4.3 5.5h3.1l-1.5 4.4 4.4-5.7h-3.1z"/>`],
  light_tower: [24, `<rect ${S} x="5.5" y="2.5" width="13" height="4.5" rx="1"/><path ${S} d="M9 4.75h.01M12 4.75h.01M15 4.75h.01M12 7v9"/><rect ${S} x="6.5" y="16" width="11" height="3.5" rx=".8"/><path ${S} d="M6.5 19.5L3.5 21.5M17.5 19.5l3 2"/>`],
  vms_board: [24, `<rect ${S} x="2.5" y="3" width="19" height="11" rx="1.2"/><path ${S} d="M5.5 6.8h13M5.5 10.2h9M12 14v3.5M6.5 17.5h11"/><circle ${S} cx="12" cy="20" r="1.6"/>`],
  forklift: [24, `<path ${S} d="M3.5 18V12h3.5V6h6l1.6 6v6"/><path ${S} d="M17.5 4v15.5h4.5"/><circle ${S} cx="7" cy="19" r="2"/><circle ${S} cx="13.5" cy="19" r="2"/>`],
  trakmat: [24, `<rect ${S} x="3" y="5" width="18" height="14" rx="1"/><path ${S} d="M3 9.7h18M3 14.3h18M7.5 5v14M12 5v14M16.5 5v14"/>`],
  distribution_board: [24, `<rect ${S} x="6" y="2.5" width="12" height="19" rx="1.2"/><circle ${S} cx="10" cy="8" r="1.4"/><circle ${S} cx="14" cy="8" r="1.4"/><circle ${S} cx="10" cy="13" r="1.4"/><circle ${S} cx="14" cy="13" r="1.4"/><path ${S} d="M8.5 17.5h7"/>`],
  fridge: [24, `<rect ${S} x="6.5" y="2.5" width="11" height="19" rx="1.5"/><path ${S} d="M6.5 9.5h11M9 5v2.5M9 12v4"/>`],
  chair: [24, `<path ${S} d="M8 3v10h9M8 13v8M17 13v8M8 9h3"/>`],
  equipment: [24, `<rect ${S} x="3.5" y="5.5" width="17" height="14" rx="1"/><path ${S} d="M3.5 10h17M12 5.5V10"/>`],
  toilet_block: [36, `<path ${S} d="M1.5 6h33"/><rect ${S} x="2.5" y="6" width="31" height="14" rx="1"/><path ${S} d="M5.5 20V9.5h5V20M15.5 20V9.5h5V20M25.5 20V9.5h5V20"/>`],
  waste_tank: [36, `<path fill="#8d9ca2" stroke="#c3ced2" stroke-width="1.5" d="M3.5 6h29a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-29a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><path fill="none" stroke="#56666c" stroke-width="1.6" stroke-linecap="round" d="M6 13.5c3-2 5 2 8 0s5-2 8 0 5 2 8 0"/>`],
  fwf_trailer: [36, `<rect ${S} x="4" y="5.5" width="7.5" height="11" rx=".8"/><rect ${S} x="13" y="5.5" width="7.5" height="11" rx=".8"/><rect ${S} x="22" y="5.5" width="7.5" height="11" rx=".8"/><path ${S} d="M2 16.5h28.5M30.5 16.5h4"/><circle ${S} cx="12" cy="19.5" r="2.2"/><circle ${S} cx="18" cy="19.5" r="2.2"/>`],
  building: [36, `<path ${S} d="M1.5 5.5h33"/><rect ${S} x="2.5" y="5.5" width="31" height="14.5" rx="1"/><rect ${S} x="6" y="9" width="10" height="5.5"/><path ${S} d="M24 20V9h5.5v11"/>`],
  container: [36, `<rect ${S} x="2" y="5.5" width="32" height="14.5" rx=".6"/><path ${S} d="M6 8v9.5M9.5 8v9.5M13 8v9.5M16.5 8v9.5M20 8v9.5M23.5 8v9.5M27 8v9.5M30.5 5.5V20"/>`],
  water_barrier: [36, `<path fill="#ffcf3d" stroke="#1b2b31" stroke-width=".9" stroke-linejoin="round" d="M1.5 19l1.6-9h7.8l1.6 9z"/><path fill="#f6f6f2" stroke="#1b2b31" stroke-width=".9" stroke-linejoin="round" d="M12.5 19l1.6-9h7.8l1.6 9z"/><path fill="#ffcf3d" stroke="#1b2b31" stroke-width=".9" stroke-linejoin="round" d="M23.5 19l1.6-9h7.8l1.6 9z"/><path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M1 20.2h34"/>`]
 };
 function kindOf(item, a) {
  const t = String(item || '').trim();
  let k = t && typeof Shapes926 !== 'undefined' && Shapes926.kind ? Shapes926.kind(t) : 'equipment';
  if (k === 'equipment') {
   if (/fridge|refrigerator/i.test(t)) k = 'fridge';
   else if (/chair/i.test(t)) k = 'chair';
   else if (/\btl2\b|barrier/i.test(t)) k = 'water_barrier';
   else if (!t && a && DISC[a.discipline]) k = DISC[a.discipline];
  }
  return ICON[k] ? k : 'equipment';
 }
 /* one stop per reference, in the load's own order; each stop's items in the order they come off */
 function stops(g) {
  const out = [], byRef = new Map();
  (g && g.rows || []).forEach(r => {
   const a = r && r.a; if (!a) return;
   let stop = byRef.get(a.key);
   if (!stop) { stop = {ref: a.key, items: []}; byRef.set(a.key, stop); out.push(stop); }
   let list = [];
   try { list = typeof dpItems === 'function' ? dpItems(r) : []; } catch (e) { list = []; }
   if (!list.length) list = [{item: '', qty: ''}];
   list.forEach(x => {
    const kind = kindOf(x.item, a), qty = /^\d+$/.test(String(x.qty || '')) ? +x.qty : null;
    const words = x.item || a.name || NAME[kind];
    const same = stop.items.find(i => i.kind === kind);
    if (same) { same.qty = same.qty != null && qty != null ? same.qty + qty : null; if (!same.words.includes(words)) same.words.push(words); }
    else stop.items.push({kind, qty, words: [words]});
   });
  });
  // a toilet block or toilet sits on its waste tank, so the tank comes off first; everything else keeps the schedule's order
  out.forEach(s => { s.items = s.items.map((it, i) => ({it, i})).sort((x, y) => ((x.it.kind === 'waste_tank' ? 0 : 1) - (y.it.kind === 'waste_tank' ? 0 : 1)) || x.i - y.i).map(x => x.it); });
  return out;
 }
 function said(it) { return (it.qty != null ? it.qty + ' × ' : '') + it.words.join(' + '); }
 function icon(kind) {
  const [w, body] = ICON[kind] || ICON.equipment;
  return `<svg viewBox="0 0 ${w} 24" width="${w === 36 ? 33 : 22}" height="22" aria-hidden="true" focusable="false">${body}</svg>`;
 }
 function stripHtml(list) {
  if (!list.length) return '';
  const label = 'Unload order: ' + list.map(s => s.items.map(said).join(', ')).join(', then ');
  return `<span class="unload929" role="img" aria-label="${esc(label)}">` + list.map(s =>
   `<span class="unload929-stop" data-unload929-ref="${esc(s.ref)}">` + s.items.map(it =>
    `<span class="unload929-item${(ICON[it.kind] || ICON.equipment)[0] === 36 ? ' w' : ''}" data-unload929-kind="${esc(it.kind)}"${it.qty != null ? ` data-unload929-qty="${it.qty}"` : ''} title="${esc(said(it))}">${icon(it.kind)}`
    + (it.kind === 'waste_tank' ? '<em>tank</em>' : '') + (it.qty != null && it.qty > 1 ? `<b>×${it.qty}</b>` : '') + '</span>').join('') + '</span>'
  ).join('<i class="unload929-then" aria-hidden="true">›</i>') + '</span>';
 }
 /* the day's native loads by id, worked out once per list; a failure leaves the row exactly as it was */
 function forDay(iso) {
  let byId = new Map();
  try {
   const day = programmeDays().find(d => d.iso === iso);
   if (day) dpLoads(day).forEach(g => { if (g.kind === 'deliveries') byId.set(ldId(day, g), g); });
  } catch (e) { byId = new Map(); }
  return load => { try { const g = load && byId.get(load.id); return g ? stripHtml(stops(g)) : ''; } catch (e) { return ''; } };
 }
 const api = Object.freeze({version: 'v9.29', kindOf, stops, stripHtml, forDay, icon, kinds: Object.keys(ICON), names: Object.assign({}, NAME)});
 if (typeof window !== 'undefined') window.Unload929 = api;
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 return api;
})();
