"""Make the v12.42.2 cards module (truck loads from what is Ready) from the v12.42.1 module.

    python3 make_loads.py <v12.42.1 singles1238_src.js> <out singles1238_src.js>
"""
import sys
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
   Coates gear; other gear one a truck for now; a truck starts from the biggest Ready group and fills from the nearest Ready units.)
   Units booked together for the same moment stay on their truck. Only what is ticked Ready is planned. ---- */
const LOADCAP = {ep: 24, panels: 6}, EPO = 'event-portables';
function loadKind(c) {
 const t = String(c.item || '') + ' ' + String(c.what || '') + ' ' + String(c.label || '');
 if (c.owner === EPO) { if (/16\s*-?\s*pan/i.test(t)) return 'pan16'; if (/pee|urinal/i.test(t)) return 'panel'; if (!c.group && /fwf|toilet|portaloo|\bloo\b|flush/i.test(t)) return 'toilet'; return 'other'; }
 if (c.cat === 'bld') return 'building';
 if (!c.group && /accessib|disab|ambulant|\bdda\b|\bpwd\b|wheelchair/i.test(t)) return 'access';
 return 'other';
}
const epLoad = c => { const k = loadKind(c); return k === 'toilet' || k === 'panel'; };
function ptOf(c) { const L = locOf(c); return L ? {lat: L.lat, lon: L.lon} : null; }
const metres = (a, b) => { if (!a || !b) return 1e9; const k = Math.cos((a.lat + b.lat) / 2 * Math.PI / 180); return Math.hypot((b.lat - a.lat) * 110540, (b.lon - a.lon) * 111320 * k); };
/* the biggest Ready group first, then the nearest Ready units until the truck is full: 24, of them 6 pee panels at most */
function fillEP(pool, out, at) {
 pool = pool.slice();
 while (pool.length) {
  const by = new Map(); pool.forEach(c => by.set(c.key, (by.get(c.key) || 0) + 1));
  const seedKey = [...by].sort((x, y) => y[1] - x[1] || nat(x[0], y[0]))[0][0], seed = ptOf(pool.find(c => c.key === seedKey));
  const dist = new Map(); pool.forEach(c => { if (!dist.has(c.key)) dist.set(c.key, c.key === seedKey ? -1 : metres(seed, ptOf(c))); });
  const order = pool.slice().sort((a, b) => dist.get(a.key) - dist.get(b.key) || nat(a.key, b.key) || nat(a.no || '', b.no || ''));
  const items = []; let panels = 0;
  for (const c of order) { if (items.length >= LOADCAP.ep) break; const p = loadKind(c) === 'panel'; if (p && panels >= LOADCAP.panels) continue; items.push(c); if (p) panels++; }
  if (!items.length) break;
  pool = pool.filter(c => items.indexOf(c) < 0);
  out.push({owner: EPO, kind: 'ep', items, at: at || null});
 }
}
function planLoads(list) {
 const ready = (list || []).filter(c => c.st && c.st.s === 'ready' && !c.board), out = [], used = new Set();
 const ep = ready.filter(c => c.owner === EPO), rest = ready.filter(c => c.owner !== EPO);
 const together = new Map(); ep.filter(c => epLoad(c) && c.book && c.book.at).forEach(c => { if (!together.has(c.book.at)) together.set(c.book.at, []); together.get(c.book.at).push(c); });
 [...together.keys()].sort().forEach(at => { const cs = together.get(at); fillEP(cs, out, at); cs.forEach(c => used.add(c)); });
 fillEP(ep.filter(c => epLoad(c) && !used.has(c)), out, null);
 ep.filter(c => !epLoad(c)).sort((a, b) => nat(a.key, b.key) || nat(a.no || '', b.no || '')).forEach(c => out.push({owner: EPO, kind: loadKind(c), items: [c], at: null}));
 rest.filter(c => loadKind(c) !== 'access').sort((a, b) => (a.owner === 'coates' ? 0 : 1) - (b.owner === 'coates' ? 0 : 1) || nat(coName(a.owner), coName(b.owner)) || (loadKind(a) === 'building' ? 0 : 1) - (loadKind(b) === 'building' ? 0 : 1) || nat(a.key, b.key) || nat(a.no || '', b.no || ''))
  .forEach(c => out.push({owner: c.owner, kind: loadKind(c), items: [c], at: null}));
 /* the accessible toilet rides on the nearest truck of the same owner carrying other gear (never a building's), one to a truck */
 rest.filter(c => loadKind(c) === 'access').forEach(c => { const p = ptOf(c), hosts = out.filter(t => t.owner === c.owner && t.kind === 'other' && !t.items.some(x => loadKind(x) === 'access')).sort((x, y) => metres(p, ptOf(x.items[0])) - metres(p, ptOf(y.items[0])));
  if (hosts.length) hosts[0].items.push(c); else out.push({owner: c.owner, kind: 'access', items: [c], at: null}); });
 out.forEach((t, i) => { t.n = i + 1; });
 return out;
}
const loadUnits = t => t.items.reduce((n, c) => n + readyUnits(c), 0);
function loadWordOf(c) { const k = loadKind(c); return k === 'panel' ? 'pee panel' : k === 'toilet' ? String(c.item || 'toilet') : String(c.item || titleOf(c)); }
function mixWords(cs) { const m = new Map(); cs.forEach(c => { const w = loadWordOf(c); m.set(w, (m.get(w) || 0) + readyUnits(c)); });
 return [...m].map(([w, n]) => n + ' ' + w + (n > 1 && w === 'pee panel' ? 's' : '')).join(' · '); }
function stopsOf(t) {
 const st = []; t.items.forEach(c => { let s = st.find(x => x.key === c.key); if (!s) st.push(s = {key: c.key, cards: []}); s.cards.push(c); });
 st.forEach(s => { const c = s.cards[0]; s.words = mixWords(s.cards); s.nos = s.cards.map(x => x.no).filter(Boolean); let w = null; try { w = DemobMap1236.words(c.key, DemobMap1236.spot(c.key), c.r.zone); } catch (x) { w = null; } s.where = w ? String(w.filter(Boolean)[0] || '') : ''; });
 return st;
}
function sameAt(t) { const a = t.items.map(c => c.book && c.book.at ? c.book.at : ''); return a.length && a[0] && a.every(x => x === a[0]) ? a[0] : ''; }
let LOADS = [];
function loadsHtml(list) {
 const P = planLoads(list); LOADS = P; if (!P.length) return '';
 const total = P.reduce((n, t) => n + loadUnits(t), 0), ed = canEd();
 const card = t => { const st = stopsOf(t), u = loadUnits(t), at = sameAt(t), i = t.n - 1;
  return '<article class="lt1238' + (at ? ' bk' : '') + '" data-lt1238="' + i + '"><h4><b>Truck ' + t.n + '</b>' + e(coName(t.owner)) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + '<small>' + e(mixWords(t.items)) + '</small></h4>'
   + (at ? '<p class="lb1238">Pick-up booked ' + e(when(at)) + '</p>' : '')
   + '<ol>' + st.map(s => '<li><button type="button" data-go1238="' + e(s.key) + '" data-u1238="' + e(s.cards[0].uid) + '"><b>' + e(s.key) + '</b><span>' + e(s.words) + '</span>' + (s.nos.length ? '<s>' + e(s.nos.join(' ')) + '</s>' : '') + (s.where ? '<em>' + e(s.where) + '</em>' : '') + '</button></li>').join('') + '</ol>'
   + '<footer>' + (ed ? '<button type="button" class="pri" data-ldbook1238="' + i + '">' + (at ? 'Change booking' : 'Book this load') + '</button>' : '') + '<button type="button" data-ldsm1238="' + i + '">Text</button><button type="button" data-ldsd1238="' + i + '">Send</button></footer></article>'; };
 return '<section class="ld1238" aria-label="Truck loads"><header><i>' + UI.truck + '</i><b>Truck loads from what is Ready</b><span>' + P.length + ' truck' + (P.length === 1 ? '' : 's') + ' · ' + total + ' unit' + (total === 1 ? '' : 's') + ' ready · nearest first</span></header>'
  + '<p class="lr1238">Event Portables: 24 a truck, 6 pee panels at most; a 16 Pan block on its own. Buildings one a truck. The Coates accessible toilet rides with other Coates gear. Other gear one a truck for now.</p>'
  + '<div class="lg1238">' + P.map(card).join('') + '</div></section>';
}
function loadWords(t) {
 const st = stopsOf(t), u = loadUnits(t), at = sameAt(t), L0 = st.length ? locOf(st[0].cards[0]) : null;
 const lines = ['Coates GC500 demob · Truck ' + t.n + ' · ' + coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' (' + mixWords(t.items) + ')'];
 if (at) lines.push('Pick-up booked: ' + when(at));
 st.forEach((s, i) => lines.push((i + 1) + '. ' + s.key + ' · ' + s.words + (s.nos.length ? ': ' + s.nos.join(' ') : '') + (s.where ? ' · ' + s.where : '')));
 if (L0) lines.push('First stop, navigate: ' + navOf(L0));
 return {subject: 'GC500 demob · Truck ' + t.n + ' · ' + coName(t.owner), lines};
}
async function sendLoad(t) {
 const w = loadWords(t), txt = w.lines.join('\n');
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { await navigator.clipboard.writeText(txt); try { flash('Truck ' + t.n + ': the list is copied, paste it into a text or email.'); } catch (y) {} return 'copied'; } catch (x) {}
 openUrl('sms:?&body=' + encodeURIComponent(txt)); return 'sms';
}
function openLoad(i) {
 if (!canEd()) { try { flash('Booking a pick-up needs the edit link.'); } catch (x) {} return false; }
 const t = LOADS[i]; if (!t || !t.items.length) return false;
 const dlg = sheet(), td = todayQ(), at = sameAt(t), first = t.items[0], groups = [];
 t.items.forEach(c => { let g = groups.find(x => x.key === c.key); if (!g) groups.push(g = {key: c.key, uids: []}); g.uids.push(c.uid); });
 SEL = {key: first.key, uid: first.uid, day: at ? qDay(at) : '', time: at ? hhmm(at) : '', month: null, mode: 'h', h: at ? Number(hhmm(at).slice(0, 2)) : null, load: groups, truck: t.n};
 const base = SEL.day || td; SEL.month = new Date(Date.UTC(Number(base.slice(0, 4)), Number(base.slice(5, 7)) - 1, 1));
 dlg.querySelector('#bkh1238').textContent = 'Book truck ' + t.n;
 dlg.querySelector('.bi1238').innerHTML = UI.truck;
 const u = loadUnits(t); dlg.querySelector('.bs1238').textContent = coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + groups.length + ' reference' + (groups.length === 1 ? '' : 's') + ' · ' + mixWords(t.items);
 dlg.querySelector('input[name="n1238"]').value = at && first.book ? (first.book.note || '') : '';
 dlg.querySelector('label.al1238').hidden = true; dlg.querySelector('[data-bk1238="clear"]').hidden = true;
 let who = ''; try { who = whoAmI() || ''; } catch (x) { who = ''; }
 dlg.querySelector('.fy1238').textContent = 'Every unit on the truck is booked for the same day and time, on the shared record' + (who ? ' as ' + who : '') + '. Each card, its day card and the booked pick-ups show it.';
 calendar(); clock(); summary();
 try { dlg.showModal(); } catch (x) { dlg.setAttribute('open', ''); }
 return true;
}
"""

reps = [
 ("REL = 'v12.42.1'", "REL = 'v12.42.2'"),
 # booking writes, shared by one unit and a whole truck
 (" S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});\n const cur = umap(key, 'pickup1238_units', 'set'), latest = list.map(u => cur[u] && cur[u].set).filter(Boolean).sort().pop(), now = stamp(latest), n = String(note || '').trim().slice(0, 80);\n list.forEach(u => { cur[u] = Object.assign({at: v, note: v ? n : '', by: who, set: now}, docOf(key, u)); });\n d.pickup1238_units = cur;\n d.pickup1238_history = (Array.isArray(d.pickup1238_history) ? d.pickup1238_history : []).concat(list.map(u => ({unit: u, pickup: v, note: v ? n : '', by: who, at: now}))).slice(-400);\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */",
  " const n = String(note || '').trim().slice(0, 80); putBooking(key, list, v, n, who);\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */"),
 ("function setBooking(key, uids, at, note) {",
  "function putBooking(key, list, v, n, who) {\n S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});\n const cur = umap(key, 'pickup1238_units', 'set'), latest = list.map(u => cur[u] && cur[u].set).filter(Boolean).sort().pop(), now = stamp(latest);\n list.forEach(u => { cur[u] = Object.assign({at: v, note: v ? n : '', by: who, set: now}, docOf(key, u)); });\n d.pickup1238_units = cur;\n d.pickup1238_history = (Array.isArray(d.pickup1238_history) ? d.pickup1238_history : []).concat(list.map(u => ({unit: u, pickup: v, note: v ? n : '', by: who, at: now}))).slice(-400);\n}\n/* a whole truck: every unit on it booked for the same moment, one save */\nfunction bookLoad(groups, at, note) {\n if (typeof mayWrite === 'function' && !mayWrite('the booked pick-up')) return false;\n const gs = (groups || []).map(g => ({key: String(g.key || ''), uids: (g.uids || []).map(String).filter(Boolean)})).filter(g => g.key && g.uids.length); if (!gs.length) return false;\n if (typeof isRef === 'function') { const bad = gs.find(g => !isRef(g.key)); if (bad) { try { flash(bad.key + ' is not a reference in this file - nothing recorded.'); } catch (x) {} return false; } }\n const who = whoAmI(); if (!who) return false;\n const v = String(at || ''); if (!(ok(v) && /T\\d{2}:\\d{2}:00\\+10:00$/.test(v))) return false;\n const n = String(note || '').trim().slice(0, 80); gs.forEach(g => putBooking(g.key, g.uids, v, n, who));\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; }\n try { buzz(30); } catch (x) {}\n return who;\n}\nfunction setBooking(key, uids, at, note) {"),
 # the Everything view carries the truck loads above the booked pick-ups
 ("barHtml(all, null) + bookedHtml(all) +", "barHtml(all, null) + loadsHtml(all) + bookedHtml(all) +"),
 # one unit's sheet keeps its own title after a truck's
 (" const dlg = sheet(), b = c.book, td = todayQ();\n SEL = {key, uid,", " const dlg = sheet(), b = c.book, td = todayQ(); dlg.querySelector('#bkh1238').textContent = 'Book the pick-up';\n SEL = {key, uid,"),
 # save: a truck books every unit on it
 (" const at = SEL.day + 'T' + SEL.time + ':00+10:00', note = sheet().querySelector('input[name=\"n1238\"]').value;\n if (setBooking(SEL.key, uidsNow(), at, note)) { close(); return true; }",
  " const at = SEL.day + 'T' + SEL.time + ':00+10:00', note = sheet().querySelector('input[name=\"n1238\"]').value;\n if (SEL.load) { const gs = SEL.load, n = SEL.truck, who = bookLoad(gs, at, note); if (!who) return false; const u = gs.reduce((t, g) => t + g.uids.length, 0);\n  try { flash('Truck ' + n + ' booked for ' + when(at) + ': ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + gs.length + ' reference' + (gs.length === 1 ? '' : 's') + ' - recorded by ' + who + '.'); } catch (x) {} close(); return true; }\n if (setBooking(SEL.key, uidsNow(), at, note)) { close(); return true; }"),
 # taps on a truck
 (" if ((b = pick('[data-go1238]'))) {",
  " if ((b = pick('[data-ldbook1238]'))) { ev.preventDefault(); ev.stopPropagation(); openLoad(Number(b.dataset.ldbook1238)); return; }\n if ((b = pick('[data-ldsm1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = LOADS[Number(b.dataset.ldsm1238)]; if (t) openUrl('sms:?&body=' + encodeURIComponent(loadWords(t).lines.join('\\n'))); return; }\n if ((b = pick('[data-ldsd1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = LOADS[Number(b.dataset.ldsd1238)]; if (t) sendLoad(t); return; }\n if ((b = pick('[data-go1238]'))) {"),
 # exports
 ("keepUnits, pickOf, parseTime, notePairs,", "keepUnits, pickOf, parseTime, notePairs, planLoads, loadKind, loadWords, bookLoad, openLoad, loads: () => LOADS,"),
]
for o, n in reps:
    c = s.count(o)
    if c != 1: raise SystemExit(f'expected once, found {c}: {o[:90]!r}')
    s = s.replace(o, n)
i = s.find('</style>'); s = s[:i] + CSS + s[i:]
j = s.find('\nfunction bookedHtml(list) {'); assert j > 0
s = s[:j] + PLAN + s[j:]
open(out, 'w', encoding='utf-8').write(s)
print('made', out)
