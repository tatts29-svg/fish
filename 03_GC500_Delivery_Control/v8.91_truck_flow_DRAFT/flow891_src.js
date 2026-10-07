/* Author: Andrew Fisher. v8.91 Truck flow: daily runs that get trucks in early, in order, and never over-crowd an area.
   Andrew, 8 Oct 2026 ~03:40 AEST: "The whole point of this is to better understand the flow and improve how trucks roll in,
   not over-crowding areas, and ensuring drivers are aware they are going, and they must turn up in their allocated order."
   Everything here reads the page's own record and rules: the day's loads (dpLoads), the crew planning record (crew883 - day
   availability, planned arrival order and the 30-minute unloading windows), the meet points and zones (v8.19, v8.16), the
   Kingston load rule and no-travel windows (v7.82) and the pre-dispatch checks (v8.26). It writes only through the crew
   planning record (S.loads, kind crew883) and only on the edit link. No pin is moved. */

/* ---------- THE RULES, in one place (Andrew Fisher, Shutdown Manager, 8 Oct 2026 ~03:40 AEST) - edit here, nowhere else */
const FLOW891 = {
 source: 'Andrew Fisher, 8 Oct 2026, 03:40 AEST',
 areas: {
  mainBeach: {name: 'Main Beach', max: 1, words: 'one truck at a time', said: '"Anything on Main Beach only one truck at a time."',
   mp: ['MAIN_BEACH', 'MBP_LANDSIDE', 'SEASIDE_NORTH', 'HILL_A47'], zones: ['mbp', 'surfers']},
  pitLane: {name: 'Pit lane', words: 'max 2 trucks from Week 4; up to 6 in Weeks 5 and 6', said: '"Pit lane we can have max 2 trucks in there from week 4. Week 5, week 6 we can fit up to 6 trucks in there, if we needed to hold any truck."',
   /* the programme's own week sheets count DOWN to the event (Week 6 = 7 Sep ... Week 1 = 12 Oct, then Event Week); Week 4 and every
      week after it: 2; Weeks 6 and 5: 6; a day before the programme: not set, so not available for holding */
   six: ['Week 6', 'Week 5'], from: 'Week 4', maxFrom: 2, maxSix: 6,
   mp: ['PITLANE', 'MEDIAN_PITSTOP', 'ISLAND_NORTH', 'ISLAND_WEST_PARK'], zones: ['island']},
  helenPark: {name: 'Helen Park', max: 4, words: 'up to 4 trucks at any one time, for any task', said: '"We can also have 4 trucks park at any one time at Helen Park where the red line is, at any one time, to keep trucks out of congested areas."',
   mp: ['HELEN_PARK'], zones: ['gate1']},
  commodore: {name: 'Commodore Park', max: null, words: 'no limit given', said: '', mp: ['COMMODORE'], zones: ['gate2']}
 },
 /* the red line on Andrew's satellite picture: the highway-side verge of Rankin Pde, west of the bus stop near Breaker St. Fixed
    from the master D001 (the live picture and its unit tags): the strip between the Breaker St corner and gate G1, turned into
    GPS through the page's own method (a fit through the 12 nearest unit tags: P55, P56, P54, P53, WC71, P52, WC67, WC70, P57,
    WC69, LTC07 and WC68, worst fit 0.07 m on the tags). Read off the drawing, so about 10 m - Andrew to confirm on the map. */
 holding: {name: 'Helen Park holding — the red line, Rankin Pde', short: 'Helen Park — red line, Rankin Pde', max: 4,
  line: [[-27.981099, 153.42326], [-27.981517, 153.423459]], ll: [-27.981308, 153.42336], approx: 'about 10 m — read off the master D001; confirm on the map',
  words: 'If early or the area is full, hold at Helen Park — red line, Rankin Pde (up to 4 trucks at any one time).'},
 oversized: {total: 7, split: '4 at Helen Park, 2 in the pit lane, 1 at location', said: '"At any one time on any day we can fit up to 7 oversized — 4 at Helen Park, 2 at pit lane and 1 at location. I\'m not saying this is the way we do it, but we need to be smarter. Earlier the better."'},
 curfew: {said: '"The whole point is to get trucks that are on a curfew to site on the earliest run possible. WC60 is a perfect example: these oversized toilets need to be on the early morning run, prior to restrictions."'},
 order: {said: '"They must turn up in their allocated order, as they themselves can cause delays if they become out of sync."'},
 checklist: ['Site aware of truck status', 'Loads all ready', 'Truck doors loaded on the correct side', 'Trucks staggered'],
 /* weights and dimensions: the page holds none (the item names carry a length, e.g. "Toilet Block 6m"); the Coates Load Restraint
    Guide 2023 is linked (GUIDE826). Until weights and dimensions are on the page, no load is suggested as a combined truck. */
 specs: {}
};
const FLOW891_BIG = /\bbuilding\b|toilet\s*block|pan\s*block|ablution|ticket\s*box|\b(?:office|crib|lunch|change)[ -]?room\b|refrigerator\s*cont|\d+(?:\.\d+)?\s*m\s*cont\b/i;
const FLOW891_PEOPLE_PER_UNLOAD = 2, FLOW891_TRUCKS_AT_ONCE = 2; /* the site limits the pre-dispatch check already states (limits826) */

/* ---------- small helpers */
function flow891Clock(n){ return n == null ? '—' : clock782(n); }
function flow891Span(w){ return w && w.known ? flow891Clock(w.start) + '–' + flow891Clock(w.finish) : 'not known'; }
function flow891Refs(g){ return (g.rows || []).map(r => r.a.key).join(' + '); }
function flow891FullName(s){ const w = String(s || '').trim().split(/\s+/).filter(x => /[A-Za-z]/.test(x)); return w.length >= 2 && w[0].length >= 2 && w[w.length - 1].length >= 2; }
/* the printer's first and last name: remembered on this device (the same place the pre-dispatch check keeps it), else the
   page's own operator name when it has both parts */
function flow891Name(){ let n = ''; try { n = localStorage.getItem('gc500.printedBy') || ''; } catch (e) { n = ''; } if (flow891FullName(n)) return n.trim();
 const op = (typeof S !== 'undefined' && S.operator || '').trim(); return flow891FullName(op) ? op : ''; }
function flow891Remember(name){ try { localStorage.setItem('gc500.printedBy', String(name).trim().slice(0, 60)); } catch (e) {} }
function flow891PrintedBy(){ const n = flow891Name(); return n ? 'Printed by ' + n + ' · ' + drvStamp782() : 'Printed by — name not recorded'; }
function flow891Sender(){ const op = (S.operator || '').trim(); return flow891FullName(op) ? op : ''; }
function flow891Oversize(r){ const a = r.a || r; let w = ''; try { if (r.a) w = dpItemsWords(r); } catch (e) { w = ''; }
 try { if (/oversize/i.test(crew883Transport(a))) return true; } catch (e) {}
 return FLOW891_BIG.test([w, a.product, a.discipline].concat(a.item_types || []).join(' ')); }
/* the area a load unloads in: the position's zone first (where the truck stands), then the meet point it reports to */
function flow891AreaOf(a){
 let z = null, mp = null; try { z = zone816(a); } catch (e) { z = null; } try { mp = meetPoint819(a); } catch (e) { mp = null; }
 const A = FLOW891.areas, byZone = z && z.zone ? Object.keys(A).find(k => A[k].zones.includes(z.zone)) : null;
 if (byZone) return {key: byZone, name: A[byZone].name, how: 'zone ' + z.zone, mp: mp && mp.p ? mp.p.id : null};
 const id = mp && mp.p ? mp.p.id : null, byMp = id ? Object.keys(A).find(k => A[k].mp.includes(id)) : null;
 if (byMp) return {key: byMp, name: A[byMp].name, how: 'meet point ' + mp.p.name + (mp.how === 'nopin' || mp.how === 'default' ? ' (no position on the map yet)' : ''), mp: id};
 return {key: null, name: 'area not known', how: 'no position or meet point', mp: id};
}
/* the pit lane allowance for a day, by the programme's own week sheets */
function flow891PitLaneMax(iso){
 const W = DATA.weeks || [], P = FLOW891.areas.pitLane; if (!W.length || !iso) return {max: null, words: 'not set', sheet: null};
 const wk = W.find(w => w.start <= iso && iso <= w.end) || [...W].reverse().find(w => w.end < iso) || null;
 if (!wk) return {max: null, words: 'not set — before the programme (the first allowance is ' + P.six[0] + ')', sheet: null};
 const i = W.findIndex(w => w.sheet === wk.sheet), iFrom = W.findIndex(w => w.sheet === P.from);
 if (P.six.includes(wk.sheet)) return {max: P.maxSix, words: 'up to ' + P.maxSix + ' trucks (' + wk.sheet + ')', sheet: wk.sheet};
 if (iFrom >= 0 && i >= iFrom) return {max: P.maxFrom, words: 'max ' + P.maxFrom + ' trucks (' + P.from + ' onwards; this day is ' + wk.sheet + ')', sheet: wk.sheet};
 return {max: null, words: 'not set (' + wk.sheet + ')', sheet: wk.sheet};
}
/* a load's arrival window on its day: the planned unloading window on the crew record, else the Kingston load time plus the run */
function flow891WindowOf(iso, time, keys, booking){
 let start = null, finish = null; const SL = S.loads || {};
 for (const key of (keys || [])) { const sv = SL[crew883Key(iso, key)]; if (!sv || !sv.start || !sv.finish) continue; const s = hhmm782(sv.start), f = hhmm782(sv.finish);
  if (s != null && f != null && f > s && (start == null || s < start)) { start = s; finish = f; } }
 if (start != null) return {start, finish, known: true, basis: 'planned unloading window (Crew)', planned: true};
 const t = hhmm782(time); if (t != null) { const run = run782(); let arr = t + run; const after = booking ? null : hhmm782(((DATA.transport || {}).arrival || {}).after); if (after != null && arr < after) arr = after;
  return {start: arr, finish: arr + UNLOAD_MIN782, known: true, basis: 'from the ' + time + ' Kingston load time (about ' + run + ' min run, ' + UNLOAD_MIN782 + ' min to unload)', planned: false}; }
 return {start: null, finish: null, known: false, basis: 'not known — no planned unloading window (Crew) and no Kingston load time'};
}
function flow891Window(d, g){ return flow891WindowOf(d.iso, g.time, (g.rows || []).map(r => r.a.key), !!g.booking801); }
/* curfew first: an oversized load belongs on the earliest run - loaded and away from Kingston by 05:00, on site before 07:00 (the page's
   own rule, LOAD782), before the 07:00-09:00 no-travel window */
function flow891Curfew(g, x){
 if (!x.oversize) return null;
 const t = hhmm782(g.time), run = run782();
 if (t == null) return {state: 'unknown', words: 'Kingston load time not known — the earliest run is loaded and away by ' + clock782(LOAD_BY782) + ', on site before 07:00'};
 const hit = PEAKS782.find(([s, e]) => t < e && t + run > s);
 if (t <= LOAD_BY782) return {state: 'ok', words: 'on the earliest run — loaded ' + g.time + ', away by ' + clock782(LOAD_BY782) + ', on site before 07:00'};
 if (!hit && t + run <= 7 * 60) return {state: 'ok', words: 'loaded ' + g.time + ', on site about ' + clock782(t + run) + ', before the 07:00 restriction (the page’s rule says away by ' + clock782(LOAD_BY782) + ')'};
 return {state: 'late', words: 'loaded ' + g.time + (hit ? ' — on the road in the ' + clock782(hit[0]) + '–' + clock782(hit[1]) + ' restriction' : ' — after the morning run') + '; the earliest run is away from Kingston by ' + clock782(LOAD_BY782) + ', on site before 07:00', fix: 'Make it Load 1 and give the carrier a ' + clock782(LOAD_BY782) + ' load time'};
}
/* the day, read once per draw */
function flow891Day(d){
 const key = 'flow891|' + d.iso; if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO.has(key)) return RENDER_MEMO.get(key);
 const M = flow891Build(d); if (typeof RENDER_MEMO !== 'undefined') RENDER_MEMO.set(key, M); return M;
}
function flow891Build(d){
 let L = []; try { L = dpLoads(d); } catch (e) { L = []; }
 const X = L.map((g, i) => ({g, i, n: i + 1, id: ldId(d, g)})).filter(x => x.g.kind === 'deliveries');
 X.forEach(x => { x.refs = x.g.rows.map(r => ({key: r.a.key, oversize: flow891Oversize(r), tank: (() => { try { return hasTank782(r.a); } catch (e) { return false; } })(), area: flow891AreaOf(r.a)}));
  x.oversize = x.refs.some(r => r.oversize); x.tank = x.refs.some(r => r.tank);
  const known = x.refs.map(r => r.area).filter(a => a.key); x.area = known.length ? known[0] : (x.refs[0] ? x.refs[0].area : {key: null, name: 'area not known', how: ''});
  x.win = flow891Window(d, x.g); x.curfew = flow891Curfew(x.g, x); });
 const crew = crew883Day(d.iso), count = crew.count;
 const allows = count == null ? null : Math.min(FLOW891_TRUCKS_AT_ONCE, Math.floor(count / FLOW891_PEOPLE_PER_UNLOAD));
 /* the areas: who is where, when; the busiest moment against the limit */
 const areas = Object.keys(FLOW891.areas).map(k => { const A = FLOW891.areas[k], mine = X.filter(x => x.area.key === k);
  const lim = k === 'pitLane' ? flow891PitLaneMax(d.iso) : {max: A.max, words: A.words};
  const timed = mine.filter(x => x.win.known).sort((a, b) => a.win.start - b.win.start || a.n - b.n), conflicts = [];
  let peak = 0, peakAt = null;
  timed.forEach(x => { const active = timed.filter(y => y.win.start <= x.win.start && x.win.start < y.win.finish); if (active.length > peak) { peak = active.length; peakAt = x.win.start; }
   if (lim.max != null && active.length > lim.max) { const others = active.filter(y => y !== x), free = Math.min(...others.map(y => y.win.finish));
    conflicts.push({at: x.win.start, loads: active.map(y => y.n), move: x, to: free, len: x.win.finish - x.win.start}); } });
  return {key: k, name: A.name, max: lim.max, limitWords: lim.words, loads: mine, timed: timed.length, untimed: mine.length - timed.length, peak, peakAt, conflicts}; });
 const helen = areas.find(a => a.key === 'helenPark');
 const ov = X.filter(x => x.oversize), ovTimed = ov.filter(x => x.win.known); let ovPeak = 0;
 ovTimed.forEach(x => { const n = ovTimed.filter(y => y.win.start <= x.win.start && x.win.start < y.win.finish).length; if (n > ovPeak) ovPeak = n; });
 /* could share a truck: same day, same area, neither oversized or a tank - and only a suggestion where the weights, dimensions and the
    load restraint guide on the page say it fits; the page holds no weights or dimensions, so these stay "not suggested" and say why */
 const share = [];
 for (let i = 0; i < X.length; i++) for (let j = i + 1; j < X.length; j++) { const a = X[i], b = X[j];
  if (!a.area.key || a.area.key !== b.area.key || a.oversize || b.oversize || a.tank || b.tank) continue;
  const items = a.refs.concat(b.refs).map(r => r.key), missing = items.filter(k => !FLOW891.specs[k]);
  share.push({a, b, area: a.area.name, fits: missing.length ? null : true, why: missing.length ? 'weights and dimensions are not on the page for ' + missing.join(', ') + ' — not suggested; check the Coates Load Restraint Guide 2023 before combining' : 'weights and dimensions on the page fit the guide'}); }
 return {iso: d.iso, loads: L.length, deliveries: X, people: {count, names: (crew.names || []).filter(Boolean).length, allows}, areas, helen, oversized: {count: ov.length, peak: ovPeak, untimed: ov.length - ovTimed.length}, share,
  curfew: X.filter(x => x.curfew), unknownWindows: X.filter(x => !x.win.known).length};
}

/* ---------- the day's order: the planned arrival order on the crew record decides the Load numbers everywhere */
function flow891OrderOf(iso, g){ const SL = S.loads || {}; let best = null;
 for (const r of (g.rows || [])) { const sv = SL[crew883Key(iso, r.a.key)], o = sv && Number.isInteger(sv.order) ? sv.order : null; if (o != null && (best == null || o < best)) best = o; } return best; }
function flow891Sort(d, L){
 if (!d || !Array.isArray(L) || L.length < 2 || typeof S === 'undefined' || !S.loads) return L;
 let any = false; const ord = L.map(g => { if (g.kind !== 'deliveries') return null; const o = flow891OrderOf(d.iso, g); if (o != null) any = true; return o; });
 if (!any) return L;
 return L.map((g, i) => ({g, i, o: ord[i]})).sort((x, y) => { const kx = x.g.kind === 'removals' ? 1 : 0, ky = y.g.kind === 'removals' ? 1 : 0; if (kx !== ky) return kx - ky;
  const ox = x.o == null ? Infinity : x.o, oy = y.o == null ? Infinity : y.o; return ox - oy || x.i - y.i; }).map(x => x.g);
}
const dpLoadsBefore891 = dpLoads;
dpLoads = function(d){ return flow891Sort(d, dpLoadsBefore891(d)); };
/* save a new order for the day: every delivery load gets its position as the planned arrival order on each of its references
   (the crew planning record, kind crew883, merged by its stamp like every other crew plan); one save, one redraw */
function flow891SaveOrder(iso, ids){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return false;
 if (!mayWrite('the day’s load order')) return false; const by = whoAmI(); if (!by) return false;
 const L = dpLoads(d).filter(g => g.kind === 'deliveries'), byId = new Map(L.map(g => [ldId(d, g), g]));
 if (!ids.every(id => byId.has(id)) || new Set(ids).size !== L.length) { flash('The day’s loads changed — the order was not saved. Try again.'); return false; }
 S.loads = S.loads || {}; const seen = new Set(); let k = 0;
 ids.forEach(id => { const g = byId.get(id); k++; g.rows.forEach(r => { const ref = r.a.key; if (seen.has(ref) || !assetOf(ref)) return; seen.add(ref);
  const key = crew883Key(iso, ref), old = S.loads[key], base = old ? Object.assign({}, old) : {people: [], start: '', finish: '', location: ''};
  S.loads[key] = Object.assign(base, {order: k, kind: 'crew883', day: iso, ref, by, at: new Date(Math.max(Date.now(), old && old.at ? Date.parse(old.at) + 1 : 0)).toISOString()}); }); });
 bump(); flash('Load order saved — the Load numbers now read this way on the Drivers and Install PDFs, the messages and this day.'); return true;
}
function flow891Ids(iso){ const d = programmeDays().find(x => x.iso === iso); return d ? dpLoads(d).filter(g => g.kind === 'deliveries').map(g => ldId(d, g)) : []; }
function flow891Move(iso, id, dir){ const ids = flow891Ids(iso), i = ids.indexOf(id); if (i < 0) return false;
 const j = dir === 'first' ? 0 : i + (dir === 'up' ? -1 : 1); if (j < 0 || j >= ids.length || j === i) return false; ids.splice(i, 1); ids.splice(j, 0, id); return flow891Flip(iso, () => flow891SaveOrder(iso, ids)); }
function flow891Drop(iso, id, targetId, before){ const ids = flow891Ids(iso); if (!ids.includes(id) || !ids.includes(targetId) || id === targetId) return false;
 ids.splice(ids.indexOf(id), 1); let j = ids.indexOf(targetId) + (before ? 0 : 1); ids.splice(j, 0, id); return flow891Flip(iso, () => flow891SaveOrder(iso, ids)); }
/* a planned unloading window for a load's references (stagger later), through the same record */
function flow891SetWindow(iso, id, start, len){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return false; const g = dpLoads(d).find(x => ldId(d, x) === id); if (!g) return false;
 if (!mayWrite('the planned unloading window')) return false; const by = whoAmI(); if (!by) return false;
 if (start == null || start + len >= 1440) { flash('That window would run past midnight — set it in Crew instead.'); return false; }
 S.loads = S.loads || {};
 g.rows.forEach(r => { const ref = r.a.key; if (!assetOf(ref)) return; const key = crew883Key(iso, ref), old = S.loads[key], base = old ? Object.assign({}, old) : {people: [], order: null, location: (whereText(r.a) || {}).main || ''};
  S.loads[key] = Object.assign(base, {start: clock782(start), finish: clock782(start + len), kind: 'crew883', day: iso, ref, by, at: new Date(Math.max(Date.now(), old && old.at ? Date.parse(old.at) + 1 : 0)).toISOString()}); });
 bump(); flash('Planned unloading window saved — ' + clock782(start) + '–' + clock782(start + len) + '.'); return true;
}
/* the list moves smoothly: the lines slide from where they were to where they are (transform only; none with reduced motion) */
function flow891Flip(iso, fn){
 const pane = document.getElementById('pane-timeline'), before = new Map(), focus = document.activeElement, fx = focus && focus.dataset ? {move: focus.dataset.flow891Move, id: focus.dataset.flow891Id, grip: focus.dataset.flow891Grip} : null;
 const scroller = pane ? (typeof ldScroller === 'function' ? ldScroller(pane) : document.querySelector('main')) : null, top = scroller ? scroller.scrollTop : 0;
 if (pane) pane.querySelectorAll('.ld[data-tl846-load]').forEach(el => before.set(el.dataset.tl846Load, el.getBoundingClientRect().top));
 const ok = fn(); if (!ok) return false;
 if (scroller && Math.abs(scroller.scrollTop - top) > 1) scroller.scrollTop = top;
 const after = document.getElementById('pane-timeline');
 if (after && fx && (fx.id || fx.grip)) { const sel = fx.grip ? '[data-flow891-grip="' + CSS.escape(fx.grip) + '"]' : '[data-flow891-move="' + fx.move + '"][data-flow891-id="' + CSS.escape(fx.id) + '"]'; const el = after.querySelector(sel); if (el && !el.disabled) { try { el.focus({preventScroll: true}); } catch (e) {} } }
 if (!after || (typeof motionOff816 === 'function' && motionOff816())) return true;
 after.querySelectorAll('.ld[data-tl846-load]').forEach(el => { const was = before.get(el.dataset.tl846Load); if (was == null) return; const dy = was - el.getBoundingClientRect().top; if (Math.abs(dy) < 1) return;
  el.style.transition = 'none'; el.style.transform = 'translateY(' + dy + 'px)'; el.classList.add('flow891-flip'); void el.offsetHeight;
  el.style.transition = ''; el.style.transform = ''; el.addEventListener('transitionend', () => el.classList.remove('flow891-flip'), {once: true}); setTimeout(() => el.classList.remove('flow891-flip'), 400); });
 return true;
}
/* the order controls on each delivery load's line: drag on a desktop, up/down everywhere, Alt+arrows on the grip */
const ldLineBefore891 = ldLine;
ldLine = function(d, g, n, open, timed){ const h = ldLineBefore891(d, g, n, open, timed); if (!g || g.kind !== 'deliveries') return h;
 let D = 0; try { D = flow891Day(d).deliveries.length; } catch (e) { D = 0; } if (D < 2) return h;
 const id = ldId(d, g), x = flow891Day(d).deliveries.find(y => y.id === id) || {}, iso = esc(d.iso), eid = esc(id);
 const chips = [x.curfew && x.curfew.state === 'late' ? '<button type="button" class="flow891-chip crit" data-flow891-jump="' + iso + '" title="This load belongs on the earliest run — see Truck flow">Curfew first</button>' : '', (flow891Day(d).areas.find(a => a.conflicts.some(c => c.loads.includes(n))) ? '<button type="button" class="flow891-chip crit" data-flow891-jump="' + iso + '" title="The area is over its limit at this time — see Truck flow">Area full</button>' : '')].join('');
 const ctl = '<div class="flow891-ord" role="group" aria-label="Order of load ' + n + ' of ' + D + '" data-flow891-day="' + iso + '">' +
  '<button type="button" class="flow891-grip" draggable="true" data-flow891-grip="' + eid + '" title="Drag to change the order (or Alt + ↑ / ↓)" aria-label="Load ' + n + ' of ' + D + ' — drag to change the order, or press Alt with the up and down arrows"><i></i><i></i><i></i></button>' +
  '<button type="button" class="flow891-mv" data-flow891-move="up" data-flow891-id="' + eid + '" aria-label="Move load ' + n + ' earlier"' + (n <= 1 ? ' disabled' : '') + '>▲</button>' +
  '<button type="button" class="flow891-mv" data-flow891-move="down" data-flow891-id="' + eid + '" aria-label="Move load ' + n + ' later"' + (n >= D ? ' disabled' : '') + '>▼</button>' +
  '<span class="flow891-ordw">Load <b>' + n + '</b> of ' + D + '</span>' + chips + '</div>';
 return h.replace('<div class="tl846-controls">', '<div class="tl846-controls">' + ctl);
};
document.addEventListener('click', e => {
 const mv = e.target.closest && e.target.closest('[data-flow891-move]'); if (mv) { e.preventDefault(); const iso = (mv.closest('[data-flow891-day]') || {}).dataset.flow891Day; if (iso) flow891Move(iso, mv.dataset.flow891Id, mv.dataset.flow891Move); return; }
 const j = e.target.closest && e.target.closest('[data-flow891-jump]'); if (j) { e.preventDefault(); const c = document.querySelector('.flow891[data-flow891="' + CSS.escape(j.dataset.flow891Jump) + '"]'); if (c) { c.scrollIntoView({behavior: (typeof motionOff816 === 'function' && motionOff816()) ? 'auto' : 'smooth', block: 'start'}); c.classList.add('flow891-lit'); setTimeout(() => c.classList.remove('flow891-lit'), 1200); } return; }
 const f = e.target.closest && e.target.closest('[data-flow891-first]'); if (f) { e.preventDefault(); flow891Move(f.dataset.flow891Day, f.dataset.flow891First, 'first'); return; }
 const st = e.target.closest && e.target.closest('[data-flow891-stagger]'); if (st) { e.preventDefault(); flow891Flip(st.dataset.flow891Day, () => flow891SetWindow(st.dataset.flow891Day, st.dataset.flow891Stagger, Number(st.dataset.flow891To), Number(st.dataset.flow891Len))); return; }
 const ps = e.target.closest && e.target.closest('[data-flow891-people-save]'); if (ps) { e.preventDefault(); const card = ps.closest('.flow891'), inp = card && card.querySelector('[data-flow891-people]'); if (!inp) return; const v = inp.value.trim();
  if (!mayWrite('the people on for the day')) return; const ok = crew883SaveDay(card.dataset.flow891, v === '' ? null : Number(v), crew883Day(card.dataset.flow891).names || []); if (!ok) flash('People on: a whole number from 0 to 50, or blank for not set.'); return; }
});
document.addEventListener('keydown', e => { const g = e.target.closest && e.target.closest('[data-flow891-grip]'); if (!g || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return; e.preventDefault(); const iso = (g.closest('[data-flow891-day]') || {}).dataset.flow891Day; if (iso) flow891Move(iso, g.dataset.flow891Grip, e.key === 'ArrowUp' ? 'up' : 'down'); });
let FLOW891_DRAG = null;
document.addEventListener('dragstart', e => { const g = e.target.closest && e.target.closest('[data-flow891-grip]'); if (!g) return; const line = g.closest('.ld[data-tl846-load]'); FLOW891_DRAG = {id: g.dataset.flow891Grip, iso: (g.closest('[data-flow891-day]') || {}).dataset.flow891Day}; if (line) line.classList.add('flow891-drag');
 try { e.dataTransfer.setData('text/plain', FLOW891_DRAG.id); e.dataTransfer.effectAllowed = 'move'; if (line) e.dataTransfer.setDragImage(line, 24, 24); } catch (x) {} });
document.addEventListener('dragover', e => { if (!FLOW891_DRAG) return; const line = e.target.closest && e.target.closest('.ld[data-tl846-load]'); if (!line || !line.querySelector('[data-flow891-grip]')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move';
 const r = line.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2; line.classList.toggle('flow891-over-before', before); line.classList.toggle('flow891-over-after', !before); });
document.addEventListener('dragleave', e => { const line = e.target.closest && e.target.closest('.ld[data-tl846-load]'); if (line) line.classList.remove('flow891-over-before', 'flow891-over-after'); });
document.addEventListener('drop', e => { if (!FLOW891_DRAG) return; const line = e.target.closest && e.target.closest('.ld[data-tl846-load]'); document.querySelectorAll('.flow891-over-before,.flow891-over-after').forEach(el => el.classList.remove('flow891-over-before', 'flow891-over-after'));
 if (!line) return; e.preventDefault(); const r = line.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2, D = FLOW891_DRAG; FLOW891_DRAG = null; if (line.dataset.tl846Load !== D.id) flow891Drop(D.iso, D.id, line.dataset.tl846Load, before); });
document.addEventListener('dragend', () => { FLOW891_DRAG = null; document.querySelectorAll('.flow891-drag,.flow891-over-before,.flow891-over-after').forEach(el => el.classList.remove('flow891-drag', 'flow891-over-before', 'flow891-over-after')); });

/* ---------- the Truck flow card on the day, under the day's figures */
function flow891Card(d){
 let M; try { M = flow891Day(d); } catch (e) { return ''; } if (!M.loads) return '';
 const X = M.deliveries, iso = esc(d.iso), can = capability() === 'edit' && !SYNC.readonly, P = M.people;
 const peopleWords = P.count == null ? 'People on: not set' : P.count + ' ' + (P.count === 1 ? 'person' : 'people') + ' on';
 const allow = P.count == null ? 'Set who is on for the day — that gives the day its numbers (' + FLOW891_PEOPLE_PER_UNLOAD + ' people attend each unload; the site takes ' + FLOW891_TRUCKS_AT_ONCE + ' trucks loading or unloading at once).'
  : 'allows ' + (P.allows === 0 ? 'no unload until more people are on' : P.allows + ' unload' + (P.allows === 1 ? '' : 's') + ' at a time') + ' (' + FLOW891_PEOPLE_PER_UNLOAD + ' people each; site limit ' + FLOW891_TRUCKS_AT_ONCE + ' trucks at once)' + (P.names ? ' · ' + P.names + ' named' : '');
 const row = (k, body, cls) => '<div class="flow891-row' + (cls ? ' ' + cls : '') + '"><b>' + k + '</b><div>' + body + '</div></div>';
 const loadWord = x => 'Load ' + x.n + ' (' + esc(flow891Refs(x.g)) + ')';
 /* order */
 const order = X.length ? X.map(x => '<span class="flow891-seq"><b>' + x.n + '</b> ' + esc(flow891Refs(x.g)) + (x.win.known ? ' <em>' + flow891Span(x.win) + '</em>' : '') + '</span>').join('<i class="flow891-arrow" aria-hidden="true">›</i>') : 'No delivery loads this day.';
 const orderNote = X.length > 1 ? '<p class="flow891-note">Change the order on the list below — drag, or ▲ ▼ (Alt + arrows on the keyboard). The Load numbers renumber on the Drivers and Install PDFs, the messages to install teams and this day. Drivers are told to turn up in this order.</p>' : '';
 /* areas */
 const areas = M.areas.filter(a => a.loads.length || a.key === 'helenPark').map(a => { const bits = [];
  const peakWords = a.timed ? 'busiest ' + a.peak + ' truck' + (a.peak === 1 ? '' : 's') + ' at ' + flow891Clock(a.peakAt) : '';
  const lim = a.max == null ? (a.key === 'commodore' ? 'no limit given' : a.limitWords + ' — not available for holding') : 'limit ' + a.max + (a.key === 'pitLane' ? ' · ' + a.limitWords : '');
  bits.push(a.loads.length + ' load' + (a.loads.length === 1 ? '' : 's') + (a.loads.length ? ' (' + a.loads.map(x => x.n).join(', ') + ')' : '') + (peakWords ? ' · ' + peakWords : '') + ' · ' + lim + (a.untimed ? ' · ' + a.untimed + ' without an arrival window' : ''));
  a.conflicts.forEach(c => { const x = c.move, hold = M.helen && (M.helen.max == null || M.helen.peak < M.helen.max) && a.key !== 'helenPark';
   bits.push('<span class="flow891-flag">' + c.loads.length + ' trucks at ' + flow891Clock(c.at) + ' (loads ' + c.loads.join(', ') + ') — over the limit of ' + a.max + '.</span> Fix: stagger ' + loadWord(x) + ' to ' + flow891Clock(c.to) + (hold ? ', or hold it at ' + esc(FLOW891.holding.short) + ' until ' + flow891Clock(c.to) : '') + '.' +
    (can ? ' <button type="button" class="btn flow891-act" data-flow891-stagger="' + esc(x.id) + '" data-flow891-day="' + iso + '" data-flow891-to="' + c.to + '" data-flow891-len="' + c.len + '">Stagger to ' + flow891Clock(c.to) + '</button>' : '')); });
  return row(esc(a.name), bits.join('<br>'), a.conflicts.length ? 'flag' : ''); }).join('');
 const unknown = M.unknownWindows ? '<p class="flow891-note">' + M.unknownWindows + ' load' + (M.unknownWindows === 1 ? ' has' : 's have') + ' no arrival window yet — a Kingston load time on the schedule, or a planned unloading window in Crew (on the load), puts ' + (M.unknownWindows === 1 ? 'it' : 'them') + ' in the area check.</p>' : '';
 const ov = row('Oversized', M.oversized.count ? M.oversized.count + ' load' + (M.oversized.count === 1 ? '' : 's') + ' today' + (M.oversized.peak ? ' · busiest ' + M.oversized.peak + ' at any one time' : '') + (M.oversized.untimed ? ' · ' + M.oversized.untimed + ' without an arrival window' : '') + ' · guide: up to ' + FLOW891.oversized.total + ' at any one time (' + FLOW891.oversized.split + ') — Andrew: not necessarily the way we do it' + (M.oversized.peak > FLOW891.oversized.total ? '<br><span class="flow891-flag">More than ' + FLOW891.oversized.total + ' oversized at one time — hold some at Helen Park or stagger.</span>' : '') : 'none today', M.oversized.peak > FLOW891.oversized.total ? 'flag' : '');
 /* curfew */
 const curfew = M.curfew.length ? M.curfew.map(x => { const c = x.curfew; return '<span class="flow891-cf ' + c.state + '">' + loadWord(x) + ': ' + (c.state === 'late' ? '<span class="flow891-flag">' + esc(c.words) + '.</span>' : esc(c.words) + '.') +
   (c.state !== 'ok' && x.n > 1 && can ? ' <button type="button" class="btn flow891-act" data-flow891-first="' + esc(x.id) + '" data-flow891-day="' + iso + '">Make it Load 1</button>' : '') + (c.state === 'late' && x.n === 1 ? ' Already Load 1 — give the carrier a ' + clock782(LOAD_BY782) + ' load time.' : '') + (c.state === 'late' && x.n > 1 && !can ? ' Fix: ' + esc(c.fix) + '.' : '') + '</span>'; }).join('<br>')
  : 'No oversized load on this day.';
 /* share */
 const shareOk = M.share.filter(s => s.fits), shareNo = M.share.filter(s => !s.fits);
 const share = (shareOk.length ? shareOk.map(s => loadWord(s.a) + ' + ' + loadWord(s.b) + ' — ' + esc(s.area) + ' · ' + esc(s.why)).join('<br>') : 'None suggested.') +
  (shareNo.length ? ' <span class="flow891-note">Same day and area, not oversized: ' + shareNo.slice(0, 3).map(s => loadWord(s.a) + ' + ' + loadWord(s.b) + ' (' + esc(s.area) + ')').join('; ') + (shareNo.length > 3 ? ' and ' + (shareNo.length - 3) + ' more' : '') + ' — weights and dimensions are not on the page, so nothing is suggested; check the <a href="' + GUIDE826 + '" target="_blank" rel="noopener">Coates Load Restraint Guide 2023</a> before combining.</span>' : '');
 /* rules */
 const H = FLOW891.holding, nav = navUrl({lat: H.ll[0], lon: H.ll[1]});
 const rules = '<details class="flow891-rules"><summary>Rules · ' + esc(FLOW891.source) + '<span class="flow891-x" aria-hidden="true"></span></summary><table><thead><tr><th>Area</th><th>Limit</th><th>Andrew’s words</th></tr></thead><tbody>' +
  [['Main Beach', FLOW891.areas.mainBeach.words, FLOW891.areas.mainBeach.said], ['Pit lane', FLOW891.areas.pitLane.words + ' · this day: ' + flow891PitLaneMax(d.iso).words, FLOW891.areas.pitLane.said], ['Helen Park', FLOW891.areas.helenPark.words, FLOW891.areas.helenPark.said], ['Oversized', 'up to ' + FLOW891.oversized.total + ' at any one time — ' + FLOW891.oversized.split + ' (a planning guide)', FLOW891.oversized.said], ['Curfew first', 'oversized or curfew loads on the earliest run: away from Kingston by ' + clock782(LOAD_BY782) + ', on site before 07:00 (no travel 07:00–09:00 or 16:00–18:00)', FLOW891.curfew.said], ['Order', 'drivers arrive in their allocated order', FLOW891.order.said]]
   .map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table>' +
  '<p>' + esc(H.name) + ': ' + H.ll[0].toFixed(6) + ', ' + H.ll[1].toFixed(6) + ' (a 50 m strip, ' + esc(H.approx) + ') · <a href="' + esc(nav) + '" target="_blank" rel="noopener">Navigate</a> · fixed from the master D001 and the page’s own unit tags; no pin was moved.</p>' +
  '<p>Weeks are the programme’s own sheets (Week 6 is 7 Sep, Week 1 is 12 Oct, then Event Week). Arrival windows come from the planned unloading window in Crew, else the Kingston load time plus the run; unloading takes at least ' + UNLOAD_MIN782 + ' min. Each driver sheet and message carries the allocated order, the window and the holding instruction.</p></details>';
 return '<section class="card flow891" data-flow891="' + iso + '" aria-label="Truck flow, ' + esc(fmtDate(d.iso)) + '"><div class="flow891-hd"><div><span class="flow891-k">Truck flow</span><h3>' + esc(peopleWords) + ' · ' + M.loads + ' load' + (M.loads === 1 ? '' : 's') + '</h3><p class="sub">' + esc(allow) + '</p></div>' +
  '<label class="flow891-people"><span>People on</span><input type="number" min="0" max="50" inputmode="numeric" data-flow891-people value="' + (P.count == null ? '' : P.count) + '"' + (can ? '' : ' disabled') + ' aria-label="People on for ' + esc(fmtDate(d.iso)) + '">' + (can ? '<button type="button" class="btn" data-flow891-people-save>Save</button>' : '') + '</label></div>' +
  '<div class="flow891-rows">' + row('Order', order + orderNote) + areas + unknown + ov + row('Curfew first', curfew, M.curfew.some(x => x.curfew.state === 'late') ? 'flag' : '') + row('Could share a truck', share) + '</div>' + rules + '</section>';
}
const dayPanelsBefore891 = dayPanels;
dayPanels = function(d){ let card = ''; try { card = flow891Card(d); } catch (e) { card = ''; } return dayPanelsBefore891(d) + card; };

/* ---------- the prints: the checklist and the printer's name on every sheet */
function flow891Strip(d, g, doc, i, n){
 let x = null; try { x = flow891Day(d).deliveries.find(y => y.id === ldId(d, g)) || null; } catch (e) { x = null; }
 const win = x ? x.win : flow891Window(d, g), area = x ? x.area : null, A = area && area.key ? FLOW891.areas[area.key] : null;
 const lim = A ? (area.key === 'pitLane' ? flow891PitLaneMax(d.iso).words : A.words) : '';
 const f = (k, v, w) => '<div class="dp-f"><label>' + k + '</label><b>' + esc(v) + '</b>' + (w ? '<span>' + esc(w) + '</span>' : '') + '</div>';
 return '<section class="dp-sec dp-flow891"><h2>Truck flow</h2><div class="dp-flow891-g">' +
  f('Allocated order', 'Arrive in your order — this is load ' + i + ' of ' + n, 'A truck out of order delays everyone') +
  f('Arrival window', flow891Span(win), win.known ? (win.planned ? 'planned unloading window' : 'from the Kingston load time') : 'agree it with site') +
  f('Area', area ? area.name : 'see Where it goes', lim) +
  f('If early or the area is full', 'Hold at ' + FLOW891.holding.short, 'up to ' + FLOW891.holding.max + ' trucks at any one time') + '</div>' +
  '<div class="dp-flow891-ck">' + FLOW891.checklist.map(c => '<span>' + dpBx() + esc(c) + '</span>').join('') + '</div></section>';
}
const dpPageBefore891 = dpPage;
dpPage = function(d, g, doc, i, n){ let h = dpPageBefore891(d, g, doc, i, n);
 try { const strip = flow891Strip(d, g, doc, i, n), k = h.lastIndexOf('<div class="dp-ft">'); if (k >= 0) h = h.slice(0, k) + strip + h.slice(k);
  h = h.replace('A ruled line means not yet recorded</span>', 'A ruled line means not yet recorded</span><span class="dp891-by">' + esc(flow891PrintedBy()) + '</span>'); } catch (e) {}
 return h; };
const pl782PagesBefore891 = pl782Pages;
pl782Pages = function(d, g, i, n){ const h = pl782PagesBefore891(d, g, i, n); if (!n) return h; /* n = 0 is the check's snapshot, not a print */
 return h.split('</section>').join('<div class="pl891-by">' + esc(flow891PrintedBy()) + '</div></section>'); };
const dropPageBefore891 = dropPage;
dropPage = function(a, events, n, total, d, kind){ const h = dropPageBefore891(a, events, n, total, d, kind); return h.replace('<div class="rs-foot">', '<div class="rs-foot">' + esc(flow891PrintedBy()) + ' · '); };
/* the pre-dispatch check carries the printed checklist's first two lines too (door side and stagger are already on it) */
const checks826Before891 = checks826;
checks826 = function(m){ const C = checks826Before891(m); if (m && m.mode === 'driver') C.splice(1, 0, {id: 'site-aware', text: 'Site is aware of the status of the trucks.'}, {id: 'loads-ready', text: 'The loads are all ready.'}); return C; };
/* who is printing: asked once, remembered on this device; the page's own operator name counts when it has both parts */
function flow891AskName(then){
 document.querySelectorAll('#flow891name').forEach(e => e.remove());
 const box = document.createElement('div'); box.id = 'flow891name'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'flow891nh');
 let have = ''; try { have = localStorage.getItem('gc500.printedBy') || ''; } catch (e) {} const pre = flow891FullName(have) ? have : (S.operator || '').trim();
 box.innerHTML = '<div class="box"><button type="button" class="x" data-flow891-close aria-label="Close">×</button><h2 id="flow891nh">Who is printing?</h2><p class="lead">Your first and last name goes on the daily run and on every attached sheet as “Printed by”. Asked once; remembered on this device.</p>' +
  '<label for="flow891n"><b>First and last name</b></label><input id="flow891n" autocomplete="name" placeholder="First and last name" value="' + esc(pre) + '"><small>Both names, please — the transport team and site read who printed the run.</small>' +
  '<div class="row"><button type="button" class="b-no" data-flow891-close>Not now</button><button type="button" class="b-go" disabled>Continue</button></div></div>';
 const prior = document.activeElement; document.body.appendChild(box);
 const inp = box.querySelector('#flow891n'), go = box.querySelector('.b-go'), sync = () => { go.disabled = !flow891FullName(inp.value); }; sync(); inp.addEventListener('input', sync);
 const close = () => { box.remove(); window.removeEventListener('hashchange', close); if (prior && prior.isConnected && typeof prior.focus === 'function') { try { prior.focus({preventScroll: true}); } catch (e) {} } };
 box.querySelectorAll('[data-flow891-close]').forEach(b => b.onclick = close); box.addEventListener('click', e => { if (e.target === box) close(); }); window.addEventListener('hashchange', close);
 box.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } if (e.key === 'Enter' && e.target === inp && !go.disabled) { e.preventDefault(); go.click(); }
  if (e.key === 'Tab') { const f = [...box.querySelectorAll('button,input')].filter(x => !x.disabled), first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } });
 go.onclick = () => { if (!flow891FullName(inp.value)) return; flow891Remember(inp.value); close(); then(); };
 setTimeout(() => { if (box.isConnected) inp.focus(); }, 30);
}
const pdf7OpenBefore891 = pdf7Open;
pdf7Open = function(kind, iso, only, mail){ if (kind !== 'prestart' && !flow891Name()) { flow891AskName(() => pdf7OpenBefore891(kind, iso, only, mail)); return; } return pdf7OpenBefore891(kind, iso, only, mail); };
const dpPrintBefore891 = dpPrint;
dpPrint = function(iso, doc, o){ if (!(o && o.pdf) && !flow891Name()) { flow891AskName(() => dpPrintBefore891(iso, doc, o)); return; } return dpPrintBefore891(iso, doc, o); };

/* ---------- the messages to install teams: the sender's full name, and each load's order, window and holding words */
const daily821ModelBefore891 = daily821Model;
daily821Model = function(iso){ const m = daily821ModelBefore891(iso);
 try { if (m && Array.isArray(m.loads)) { const n = m.loads.length;
  m.loads.forEach(l => { const w = flow891WindowOf(iso, l.time, (l.rows || []).map(r => r.key), !!l.booking);
   const line = 'Load ' + l.n + ' of ' + n + ' — the trucks arrive in this order; a truck out of order delays everyone. Arrival window ' + flow891Span(w) + '. ' + FLOW891.holding.words;
   (l.rows || []).forEach(r => { r.notes = (Array.isArray(r.notes) ? r.notes : []).concat([line]); }); });
  m.sender = flow891Sender(); } } catch (e) {}
 return m; };
const daily821HtmlBefore891 = daily821Html;
daily821Html = function(model, team, version){ let h = daily821HtmlBefore891(model, team, version); const who = (model && model.sender) || flow891Sender();
 if (who) h = h.replace('<p class="issued">Issued', '<p class="issued">Prepared by ' + esc(who) + ' · Issued');
 return h.replace('<p>In load order</p>', '<p>In load order — the trucks arrive in this order. ' + esc(FLOW891.holding.words) + '</p>'); };
const daily861BodyBefore891 = daily861Body;
daily861Body = function(iso, team, url, weather){ const who = flow891Sender(); if (!who) throw Error('Enter your first and last name in Recording as (Tools) — every message to an install team carries the sender’s full name.');
 return daily861BodyBefore891(iso, team, url, weather).replace('\n\nYour daily runs:', '\nSent by ' + daily861Gsm(who) + '.\n\nYour daily runs:'); };
