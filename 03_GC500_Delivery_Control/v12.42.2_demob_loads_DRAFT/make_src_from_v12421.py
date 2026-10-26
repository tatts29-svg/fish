"""Make the v12.42.2 cards module (truck loads from what is Ready) from the v12.42.1 module.

    python3 make_src_from_v12421.py <v12.42.1 singles1238_src.js> <out singles1238_src.js>

Author: Andrew Fisher.
"""
import re, sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

CSS = r"""/* v12.42.2 - truck loads from what is Ready */
#pane-demob .ld1238{display:grid;gap:10px;padding:14px;border:1px solid #ffb02044;border-radius:18px;background:radial-gradient(120% 160% at 100% 0%,#3a2a0c,#0b171c 62%);box-shadow:0 0 24px #ffb0201a}
#pane-demob .ld1238 > header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#pane-demob .ld1238 > header i{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#0a161b;color:#ffcf6a;box-shadow:0 0 0 1px #ffb02088,0 0 14px #ffb02066}
#pane-demob .ld1238 > header i svg{width:20px;height:20px}
#pane-demob .ld1238 > header b{color:#fff;font:900 16px/1.1 Inter,Arial,sans-serif}
#pane-demob .ld1238 > header span{color:var(--mut1238);font:700 12px/1.2 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lr1238{margin:0;color:#e9d9b6;font:600 12px/1.45 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lg1238{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
#pane-demob .ld1238 .lt1238{display:grid;align-content:start;gap:8px;padding:12px;border-radius:14px;background:#0a161b;box-shadow:inset 0 0 0 1px #ffffff14}
#pane-demob .ld1238 .lt1238.bk{box-shadow:inset 0 0 0 1px #18e8ff66,0 0 16px #18e8ff22}
#pane-demob .ld1238 .lt1238 h4{margin:0;display:flex;align-items:baseline;gap:6px 8px;flex-wrap:wrap;color:#fff;font:900 14px/1.25 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lt1238 h4 b{padding:3px 9px;border-radius:999px;background:#ffb020;color:#1b1203;font-size:12px}
#pane-demob .ld1238 .lt1238 h4 small{flex-basis:100%;color:var(--mut1238);font-weight:700;font-size:12px}
#pane-demob .ld1238 .lt1238 .lb1238{margin:0;color:#9ff6ff;font:800 12.5px/1.2 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lt1238 .lb1238.mx{color:#ffcf6a;font-weight:700;line-height:1.35}
#pane-demob .ld1238 .lt1238 ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
#pane-demob .ld1238 .lt1238 li button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;width:100%;padding:6px 8px;border-radius:9px;background:#ffffff08;color:#e3eef1;font:700 12.5px/1.25 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .ld1238 .lt1238 li button:hover,#pane-demob .ld1238 .lt1238 li button:focus-visible{background:#ffb02017;outline:none}
#pane-demob .ld1238 .lt1238 li b{color:#fff;font-weight:900}
#pane-demob .ld1238 .lt1238 li s{grid-column:1/-1;text-decoration:none;color:#b9cdd3;font:600 11.5px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
#pane-demob .ld1238 .lt1238 li em{grid-column:1/-1;font-style:normal;color:var(--mut1238);font-size:11.5px}
#pane-demob .ld1238 .lt1238 footer{display:flex;gap:8px;flex-wrap:wrap}
#pane-demob .ld1238 .lt1238 footer button{all:unset;box-sizing:border-box;padding:9px 13px;border-radius:10px;background:#ffffff10;color:#fff;font:800 12.5px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .ld1238 .lt1238 footer button.pri{background:#ffb020;color:#1b1203}
#pane-demob .ld1238 .lt1238 footer button:focus-visible{outline:2px solid #ffcf6a;outline-offset:2px}
@media print{#pane-demob .ld1238 .lt1238 footer{display:none}}
"""

PLAN = r"""
/* ---- v12.42.2 - truck loads from what is Ready (Andrew, 26 Oct 2026: "the equipment that is ready we can work out what can go on what
   load. With event portaloos they can get 24 per truck. Or 6 pee panels and 18 toilets on a truck. Or qty 1 16 pan toilet. Buildings are
   generally 1 per truck.. accessible toilet can go on with other". His answers: the accessible toilet rides on a Coates truck with other
   Coates gear; other gear one a truck for now; a truck starts from the biggest Ready group and fills from the nearest Ready units. Then:
   "Vms most trucks could tow one or a truck can load 2 and tow 1": VMS boards 3 a truck, 2 on it and 1 towed.)
   Units booked together for the same moment stay on their own trucks, whatever they are. Only what is ticked Ready is planned. ---- */
const LOADCAP = {ep: 24, panels: 6, vms: 3}, EPO = 'event-portables';
/* what a unit is comes from the unit's own item and label, never the reference's description: that names every kind the reference
   holds (WC09 "FWF, Pee Panel, Toilet Block 6m", WC01 "Accessible Toilet, FWF"), so it would make every FWF there a pee panel or an
   accessible toilet */
const ownText = c => c.u ? String(c.u.item || '') + ' ' + String(c.u.label || '') : String(c.item || '') + ' ' + String(c.label || '');
function loadKind(c) {
 const t = ownText(c);
 if (c.owner === EPO) { if (/16\s*-?\s*pan/i.test(t)) return 'pan16'; if (/pee|urinal/i.test(t)) return 'panel'; if (!c.group && /fwf|toilet|portaloo|\bloo\b|flush/i.test(t)) return 'toilet'; return 'other'; }
 if (c.cat === 'bld') return 'building';
 if (c.cat === 'vms' || c.vms) return 'vms';
 if (!c.group && /accessib|disab|ambulant|\bdda\b|\bpwd\b|wheelchair/i.test(t)) return 'access';
 return 'other';
}
const KIND = new WeakMap(), kindOf = c => { let k = KIND.get(c); if (!k) { k = loadKind(c); KIND.set(c, k); } return k; }; /* worked out once per card */
const epLoad = c => { const k = kindOf(c); return k === 'toilet' || k === 'panel'; };
function ptOf(c) { const L = locOf(c); return L ? {lat: L.lat, lon: L.lon} : null; }
const metres = (a, b) => { if (!a || !b) return 1e9; const k = Math.cos((a.lat + b.lat) / 2 * Math.PI / 180); return Math.hypot((b.lat - a.lat) * 110540, (b.lon - a.lon) * 111320 * k); };
const unitCmp = (a, b) => nat(a.key, b.key) || nat(a.vms ? a.vms.label : '', b.vms ? b.vms.label : '') || nat(a.no || '', b.no || '') || nat(a.uid || '', b.uid || '');
/* the biggest Ready group first, then the nearest Ready units until the truck is full (Event Portables: 24, of them 6 pee panels at most;
   VMS boards: 3, 2 on the truck and 1 towed). A VMS board carries its own position, so each board is measured from its own pin; every
   other unit goes by its reference's */
function fillNear(pool, out, at, o) {
 pool = pool.slice();
 while (pool.length) {
  const by = new Map(); pool.forEach(c => by.set(c.key, (by.get(c.key) || 0) + 1));
  const seedKey = [...by].sort((x, y) => y[1] - x[1] || nat(x[0], y[0]))[0][0], seedC = pool.filter(c => c.key === seedKey).sort(unitCmp)[0], seed = ptOf(seedC);
  const ref = new Map(), dist = new Map();
  pool.forEach(c => { if (c === seedC) dist.set(c, -1); else if (c.vms) dist.set(c, metres(seed, ptOf(c)));
   else { if (!ref.has(c.key)) ref.set(c.key, c.key === seedKey ? -1 : metres(seed, ptOf(c))); dist.set(c, ref.get(c.key)); } });
  const order = pool.slice().sort((a, b) => dist.get(a) - dist.get(b) || unitCmp(a, b));
  const items = []; let subs = 0;
  for (const c of order) { if (items.length >= o.cap) break; const s = !!(o.sub && o.sub(c)); if (s && subs >= o.subMax) continue; items.push(c); if (s) subs++; }
  if (!items.length) break;
  pool = pool.filter(c => items.indexOf(c) < 0);
  out.push({owner: o.owner, kind: o.kind, items, at: at || null});
 }
}
/* one pool of Ready units (all booked for one moment by one owner, or all unbooked) cut into trucks by Andrew's rules */
function cutLoads(pool, at, co) {
 const out = [], own = (a, b) => (a === 'coates' ? 0 : 1) - (b === 'coates' ? 0 : 1) || nat(co(a), co(b));
 const ep = pool.filter(c => c.owner === EPO), rest = pool.filter(c => c.owner !== EPO);
 fillNear(ep.filter(epLoad), out, at, {owner: EPO, kind: 'ep', cap: LOADCAP.ep, sub: c => kindOf(c) === 'panel', subMax: LOADCAP.panels});
 ep.filter(c => !epLoad(c)).sort(unitCmp).forEach(c => out.push({owner: EPO, kind: kindOf(c), items: [c], at: at || null}));
 [...new Set(rest.filter(c => kindOf(c) === 'vms').map(c => c.owner))].sort(own).forEach(ow => fillNear(rest.filter(c => c.owner === ow && kindOf(c) === 'vms'), out, at, {owner: ow, kind: 'vms', cap: LOADCAP.vms}));
 rest.filter(c => kindOf(c) !== 'access' && kindOf(c) !== 'vms').sort((a, b) => own(a.owner, b.owner) || (kindOf(a) === 'building' ? 0 : 1) - (kindOf(b) === 'building' ? 0 : 1) || unitCmp(a, b))
  .forEach(c => out.push({owner: c.owner, kind: kindOf(c), items: [c], at: at || null}));
 /* the accessible toilet rides on the nearest truck of its owner carrying one piece of other gear (never a building, a run, a board or
    another accessible toilet); trucks are cut per booking, so it only ever rides with gear booked for the same moment, or unbooked with unbooked */
 rest.filter(c => kindOf(c) === 'access').sort(unitCmp).forEach(c => { const p = ptOf(c), d = new Map(), far = t => { if (!d.has(t)) d.set(t, metres(p, ptOf(t.items[0]))); return d.get(t); };
  const host = out.filter(t => t.owner === c.owner && t.kind === 'other' && t.items.length === 1 && !t.items[0].group).sort((x, y) => far(x) - far(y) || unitCmp(x.items[0], y.items[0]))[0];
  if (host) host.items.push(c); else out.push({owner: c.owner, kind: 'access', items: [c], at: at || null}); });
 return out;
}
/* units booked for the same moment (one owner) are cut into their own trucks and never mixed with other units; booked trucks come first,
   by their time and first unit, so a booked truck keeps its place when the others change */
function planLoads(list) {
 const ready = (list || []).filter(c => c.st && c.st.s === 'ready' && !c.board), CO = new Map(), co = o => { if (!CO.has(o)) CO.set(o, coName(o)); return CO.get(o); };
 const sets = new Map(), free = [];
 ready.forEach(c => { const at = c.book && ok(c.book.at) ? String(c.book.at) : ''; if (!at) { free.push(c); return; } const k = at + '|' + c.owner; if (!sets.has(k)) sets.set(k, {at, cs: []}); sets.get(k).cs.push(c); });
 const booked = [].concat(...[...sets.values()].map(x => cutLoads(x.cs, x.at, co))).sort((x, y) => Date.parse(x.at) - Date.parse(y.at) || unitCmp(x.items[0], y.items[0]));
 const out = booked.concat(cutLoads(free, null, co));
 out.forEach((t, i) => { const f = t.items[0]; t.n = i + 1; t.id = (t.at || '') + '|' + f.key + '#' + f.uid; });
 return out;
}
const loadUnits = t => t.items.reduce((n, c) => n + readyUnits(c), 0);
/* a truck is named by its number and its first stop, so a name in a flash or a text still finds it after the numbers move */
const truckName = t => { const f = t.items[0]; return 'Truck ' + t.n + ' (from ' + (f ? (f.vms ? f.vms.label : f.key) : '') + ')'; };
function loadWordOf(c) { const k = kindOf(c); return k === 'panel' ? 'pee panel' : k === 'vms' ? 'VMS board' : String(c.item || (k === 'toilet' ? 'toilet' : titleOf(c))); }
/* a toilet block with its waste tank is "Toilet Block 6m + waste tank" with both numbers; once one of them has left, only the part still there */
function pieceOf(c) {
 const it = String(c.item || 'toilet block');
 if (c.tank) return c.half === 'block' ? {w: 'waste tank', n: 1, nos: [c.tankNo]} : c.half === 'tank' ? {w: it, n: 1, nos: [c.no]} : {w: it + ' + waste tank', n: 1, nos: [c.no, c.tankNo]};
 return {w: loadWordOf(c), n: readyUnits(c), nos: [c.no]};
}
function mixWords(cs) { const m = new Map(); cs.forEach(c => { const p = pieceOf(c); m.set(p.w, (m.get(p.w) || 0) + p.n); });
 return [...m].map(([w, n]) => n + ' ' + w + (n > 1 && (w === 'pee panel' || w === 'VMS board' || w === 'waste tank') ? 's' : '')).join(' · '); }
const rideOf = t => { if (t.kind !== 'vms') return ''; const n = t.items.length; return n >= 3 ? 'load 2, tow 1' : n === 2 ? 'load 1, tow 1' : 'tow 1'; };
/* a stop is a reference; a VMS board is a stop of its own (its own label, place and directions) */
function stopsOf(t) {
 const st = []; t.items.forEach(c => { const id = c.vms ? 'v|' + c.vms.label : 'a|' + c.key; let s = st.find(x => x.id === id); if (!s) st.push(s = {id, key: c.key, label: c.vms ? String(c.vms.label) : c.key, cards: []}); s.cards.push(c); });
 st.forEach(s => { const c = s.cards[0]; s.words = mixWords(s.cards); s.nos = [].concat(...s.cards.map(x => pieceOf(x).nos)).filter(Boolean);
  if (c.vms) s.where = String(c.vms.where || '');
  else { let w = null; try { w = DemobMap1236.words(c.key, DemobMap1236.spot(c.key), c.r.zone); } catch (x) { w = null; } s.where = w ? String(w.filter(Boolean)[0] || '') : ''; }
  s.L = locOf(c); });
 return st;
}
function sameAt(t) { const a = t.items.map(c => c.book && c.book.at ? c.book.at : ''); return a.length && a[0] && a.every(x => x === a[0]) ? a[0] : ''; }
/* what is already booked on a truck: one time for all of it, or (should a truck ever hold units booked apart) each time with its units,
   which booking the load moves to the one new time */
function loadNote(t) {
 const at = sameAt(t); if (at) return {at};
 const m = new Map(); t.items.forEach(c => { if (c.book && c.book.at) m.set(c.book.at, (m.get(c.book.at) || 0) + readyUnits(c)); }); if (!m.size) return null;
 const bt = [...m].sort((x, y) => Date.parse(x[0]) - Date.parse(y[0])), moves = bt.reduce((s, x) => s + x[1], 0);
 return {at: '', moves, times: bt.map(([a, n]) => when(a) + ' (' + n + ' unit' + (n === 1 ? '' : 's') + ')').join(', ')};
}
const loadOf = b => { const a = b && b.closest ? b.closest('[data-lid1238]') : null, id = a ? a.dataset.lid1238 : ''; return id ? LOADS.find(t => t.id === id) || null : null; };
let LOADS = [];
function loadsHtml(list) {
 const P = planLoads(list); LOADS = P; if (!P.length) return '';
 const total = P.reduce((n, t) => n + loadUnits(t), 0), ed = canEd();
 const card = t => { const st = stopsOf(t), u = loadUnits(t), bn = loadNote(t), i = t.n - 1;
  return '<article class="lt1238' + (bn && bn.at ? ' bk' : '') + '" data-lt1238="' + i + '" data-lid1238="' + e(t.id) + '"><h4><b>Truck ' + t.n + '</b>' + e(coName(t.owner)) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + '<small>' + e(mixWords(t.items) + (rideOf(t) ? ' · ' + rideOf(t) : '')) + '</small></h4>'
   + (bn ? (bn.at ? '<p class="lb1238">Pick-up booked ' + e(when(bn.at)) + '</p>' : '<p class="lb1238 mx">Booked now: ' + e(bn.times) + '. Booking this load moves ' + (bn.moves === 1 ? 'it' : 'them') + ' to the new time.</p>') : '')
   + '<ol>' + st.map(s => '<li><button type="button" data-go1238="' + e(s.key) + '" data-u1238="' + e(s.cards[0].uid) + '"><b>' + e(s.label) + '</b><span>' + e(s.words + (s.label !== s.key ? ' · ' + s.key : '')) + '</span>' + (s.nos.length ? '<s>' + e(s.nos.join(' ')) + '</s>' : '') + (s.where ? '<em>' + e(s.where) + '</em>' : '') + '</button></li>').join('') + '</ol>'
   + '<footer>' + (ed ? '<button type="button" class="pri" data-ldbook1238="' + i + '">' + (bn && bn.at ? 'Change booking' : bn ? 'Book this load and move ' + bn.moves + ' booked unit' + (bn.moves === 1 ? '' : 's') : 'Book this load') + '</button>' : '') + '<button type="button" data-ldsm1238="' + i + '">Text</button><button type="button" data-ldsd1238="' + i + '">Send</button></footer></article>'; };
 return '<section class="ld1238" aria-label="Truck loads"><header><i>' + UI.truck + '</i><b>Truck loads from what is Ready</b><span>' + P.length + ' truck' + (P.length === 1 ? '' : 's') + ' · ' + total + ' unit' + (total === 1 ? '' : 's') + ' ready · nearest first</span></header>'
  + '<p class="lr1238">Event Portables: 24 a truck, 6 pee panels at most; a 16 Pan block on its own. VMS boards 3 a truck: load 2, tow 1 (most trucks tow one). Buildings one a truck. The Coates accessible toilet rides with one other piece of Coates gear. Other gear one a truck for now. Units booked for the same time stay together on their own trucks, listed first.</p>'
  + '<div class="lg1238">' + P.map(card).join('') + '</div></section>';
}
/* the list for the driver: each stop with what is there, its numbers and its place, and directions to that stop */
function loadWords(t) {
 const st = stopsOf(t), u = loadUnits(t), bn = loadNote(t);
 const lines = ['Coates GC500 demob · ' + truckName(t) + ' · ' + coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' (' + mixWords(t.items) + (rideOf(t) ? ', ' + rideOf(t) : '') + ')'];
 if (bn) lines.push(bn.at ? 'Pick-up booked: ' + when(bn.at) : 'Booked now: ' + bn.times);
 st.forEach((s, i) => { lines.push((i + 1) + '. ' + s.label + (s.label !== s.key ? ' (' + s.key + ')' : '') + ' · ' + s.words + (s.nos.length ? ': ' + s.nos.join(' ') : '') + (s.where ? ' · ' + s.where : ''));
  if (s.L) lines.push('   Navigate: ' + navOf(s.L)); });
 return {subject: 'GC500 demob · ' + truckName(t) + ' · ' + coName(t.owner), lines};
}
async function sendLoad(t) {
 const w = loadWords(t), txt = w.lines.join('\n');
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { await navigator.clipboard.writeText(txt); try { flash(truckName(t) + ': the list is copied, paste it into a text or email.'); } catch (y) {} return 'copied'; } catch (x) {}
 openUrl('sms:?&body=' + encodeURIComponent(txt)); return 'sms';
}
/* the cards the Everything view shows (the branch chosen on the Demob tab), for the view and for finding a truck again after a booking */
function allCards(m) { m = m || model(); const br = (typeof DM816 === 'object' && DM816 && DM816.branch) || 'all'; return br === 'all' ? m.cards : m.cards.filter(c => c.r.branch === br); }
function openLoad(i) {
 if (!canEd()) { try { flash('Booking a pick-up needs the edit link.'); } catch (x) {} return false; }
 const t = i && typeof i === 'object' ? i : LOADS[Number(i)]; if (!t || !t.items.length) return false;
 const dlg = sheet(), td = todayQ(), bn = loadNote(t), at = bn && bn.at ? bn.at : '', first = t.items[0], groups = [], u = loadUnits(t);
 t.items.forEach(c => { let g = groups.find(x => x.key === c.key); if (!g) groups.push(g = {key: c.key, uids: []}); g.uids.push(c.uid); });
 SEL = {key: first.key, uid: first.uid, day: at ? qDay(at) : '', time: at ? hhmm(at) : '', month: null, mode: 'h', h: at ? Number(hhmm(at).slice(0, 2)) : null, load: groups, units: u, first: {key: first.key, uid: first.uid}};
 const base = SEL.day || td; SEL.month = new Date(Date.UTC(Number(base.slice(0, 4)), Number(base.slice(5, 7)) - 1, 1));
 dlg.querySelector('#bkh1238').textContent = 'Book ' + truckName(t).replace(/^Truck/, 'truck');
 dlg.querySelector('.bi1238').innerHTML = UI.truck;
 dlg.querySelector('.bs1238').textContent = coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + groups.length + ' reference' + (groups.length === 1 ? '' : 's') + ' · ' + mixWords(t.items);
 dlg.querySelector('input[name="n1238"]').value = at && first.book ? (first.book.note || '') : '';
 dlg.querySelector('label.al1238').hidden = true; dlg.querySelector('[data-bk1238="clear"]').hidden = true;
 let who = ''; try { who = whoAmI() || ''; } catch (x) { who = ''; }
 dlg.querySelector('.fy1238').textContent = 'Every unit on the truck is booked for the same day and time, on the shared record' + (who ? ' as ' + who : '') + '. Each card, its day card and the booked pick-ups show it.'
  + (bn && !bn.at ? ' Booked now: ' + bn.times + '; saving moves ' + (bn.moves === 1 ? 'it' : 'them') + ' to this time.' : '');
 calendar(); clock(); summary();
 try { dlg.showModal(); } catch (x) { dlg.setAttribute('open', ''); }
 return true;
}
"""

reps = [
 ("REL = 'v12.42.1'", "REL = 'v12.42.2'"),
 # one collator for every natural sort in the module
 ("const nat = (a, b) => String(a).localeCompare(String(b), 'en-AU', {numeric: true, sensitivity: 'base'});",
  "const NATC = new Intl.Collator('en-AU', {numeric: true, sensitivity: 'base'}).compare, nat = (a, b) => NATC(String(a), String(b)); /* v12.42.2: one collator, made once */"),
 # booking writes, shared by one unit and a whole truck
 (" S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});\n const cur = umap(key, 'pickup1238_units', 'set'), latest = list.map(u => cur[u] && cur[u].set).filter(Boolean).sort().pop(), now = stamp(latest), n = String(note || '').trim().slice(0, 80);\n list.forEach(u => { cur[u] = Object.assign({at: v, note: v ? n : '', by: who, set: now}, docOf(key, u)); });\n d.pickup1238_units = cur;\n d.pickup1238_history = (Array.isArray(d.pickup1238_history) ? d.pickup1238_history : []).concat(list.map(u => ({unit: u, pickup: v, note: v ? n : '', by: who, at: now}))).slice(-400);\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */",
  " const n = String(note || '').trim().slice(0, 80); putBooking(key, list, v, n, who);\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */"),
 ("function setBooking(key, uids, at, note) {",
  "function putBooking(key, list, v, n, who) {\n S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});\n const cur = umap(key, 'pickup1238_units', 'set'), latest = list.map(u => cur[u] && cur[u].set).filter(Boolean).sort().pop(), now = stamp(latest);\n list.forEach(u => { cur[u] = Object.assign({at: v, note: v ? n : '', by: who, set: now}, docOf(key, u)); });\n d.pickup1238_units = cur;\n d.pickup1238_history = (Array.isArray(d.pickup1238_history) ? d.pickup1238_history : []).concat(list.map(u => ({unit: u, pickup: v, note: v ? n : '', by: who, at: now}))).slice(-400);\n}\n/* a whole truck: every unit on it booked for the same moment, one save */\nfunction bookLoad(groups, at, note) {\n if (typeof mayWrite === 'function' && !mayWrite('the booked pick-up')) return false;\n const gs = (groups || []).map(g => ({key: String(g.key || ''), uids: (g.uids || []).map(String).filter(Boolean)})).filter(g => g.key && g.uids.length); if (!gs.length) return false;\n if (typeof isRef === 'function') { const bad = gs.find(g => !isRef(g.key)); if (bad) { try { flash(bad.key + ' is not a reference in this file - nothing recorded.'); } catch (x) {} return false; } }\n const who = whoAmI(); if (!who) return false;\n const v = String(at || ''); if (!(ok(v) && /T\\d{2}:\\d{2}:00\\+10:00$/.test(v))) return false;\n const n = String(note || '').trim().slice(0, 80); gs.forEach(g => putBooking(g.key, g.uids, v, n, who));\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; }\n try { buzz(30); } catch (x) {}\n return who;\n}\nfunction setBooking(key, uids, at, note) {"),
 # the Everything view carries the truck loads above the booked pick-ups, on the same cards the loads are planned from
 (" if (!day) { const br = (typeof DM816 === 'object' && DM816 && DM816.branch) || 'all', all = br === 'all' ? m.cards : m.cards.filter(c => c.r.branch === br);",
  " if (!day) { const all = allCards(m);"),
 ("barHtml(all, null) + bookedHtml(all) +", "barHtml(all, null) + loadsHtml(all) + bookedHtml(all) +"),
 # one unit's sheet keeps its own title after a truck's
 (" const dlg = sheet(), b = c.book, td = todayQ();\n SEL = {key, uid,", " const dlg = sheet(), b = c.book, td = todayQ(); dlg.querySelector('#bkh1238').textContent = 'Book the pick-up';\n SEL = {key, uid,"),
 # save: a truck books every unit on it; the flash counts units as the sheet does and names the truck as it now stands, found by its time
 (" const at = SEL.day + 'T' + SEL.time + ':00+10:00', note = sheet().querySelector('input[name=\"n1238\"]').value;\n if (setBooking(SEL.key, uidsNow(), at, note)) { close(); return true; }",
  " const at = SEL.day + 'T' + SEL.time + ':00+10:00', note = sheet().querySelector('input[name=\"n1238\"]').value;\n if (SEL.load) { const gs = SEL.load, u = SEL.units, f = SEL.first, who = bookLoad(gs, at, note); if (!who) return false;\n  let t = null; try { t = planLoads(allCards()).find(x => x.at === at && x.items.some(c => c.key === f.key && c.uid === f.uid)) || null; } catch (x) { t = null; }\n  try { flash((t ? truckName(t) : 'The truck') + ' booked for ' + when(at) + ': ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + gs.length + ' reference' + (gs.length === 1 ? '' : 's') + ' - recorded by ' + who + '.'); } catch (x) {} close(); return true; }\n if (setBooking(SEL.key, uidsNow(), at, note)) { close(); return true; }"),
 # taps on a truck: the truck is found by its own identity, so a redraw between drawing and tapping cannot swap it for another
 (" if ((b = pick('[data-go1238]'))) {",
  " if ((b = pick('[data-ldbook1238]'))) { ev.preventDefault(); ev.stopPropagation(); openLoad(loadOf(b) || Number(b.dataset.ldbook1238)); return; }\n if ((b = pick('[data-ldsm1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = loadOf(b) || LOADS[Number(b.dataset.ldsm1238)]; if (t) openUrl('sms:?&body=' + encodeURIComponent(loadWords(t).lines.join('\\n'))); return; }\n if ((b = pick('[data-ldsd1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = loadOf(b) || LOADS[Number(b.dataset.ldsd1238)]; if (t) sendLoad(t); return; }\n if ((b = pick('[data-go1238]'))) {"),
 # exports
 ("keepUnits, pickOf, parseTime, notePairs,", "keepUnits, pickOf, parseTime, notePairs, planLoads, loadKind, loadWords, loadUnits, stopsOf, loadNote, truckName, bookLoad, openLoad, loads: () => LOADS,"),
]
for o, n in reps:
    c = s.count(o)
    if c != 1: raise SystemExit(f'expected once, found {c}: {o[:90]!r}')
    s = s.replace(o, n)
# no assistant names in the page's code: the one comment v12.42.1 carried that named one now says only that it came from a review
s, k = re.subn(r"waiting send would write over it \(\w+'s review, 26 Oct 19:05\) \*/", "waiting send would write over it (review, 26 Oct 19:05) */", s)
if k != 1: raise SystemExit(f'expected the review comment once, found {k}')
i = s.find('</style>'); assert i > 0 and s.count('</style>') == 1
s = s[:i] + CSS + s[i:]
j = s.find('\nfunction bookedHtml(list) {'); assert j > 0 and s.count('\nfunction bookedHtml(list) {') == 1
s = s[:j] + PLAN + s[j:]
open(out, 'w', encoding='utf-8').write(s)
print('made', out)
