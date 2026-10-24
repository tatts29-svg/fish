/* Author: Andrew Fisher. v11.97 - Build cards: the delivery window, read from the Coates booking texts already on the page
   (ontime1057, Coates texts to 22 Oct 2026 04:57). Andrew, 25 Oct 2026: "Lets push our limits and do improvement with the build
   cards. Also we shouldc have a delivery window can we mention this Delivery booked betweem this time and this time".
   Every load with a booking text says "Delivery booked between HH:MM and HH:MM", and any re-booked window; every Build day card
   shows the day's booked windows on a time line with when each was done (the on-time model's own figures, never recounted).
   A load with no Coates text (Event Portables, team gear, no booking text sent) shows no window, never a made-up one. Nothing
   is recorded. */
(function (root) {
 'use strict';
 const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 const mn = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s == null ? '' : s).trim()); return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };
 const ck = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
 const okWin = w => Array.isArray(w) && w.length === 2 && mn(w[0]) != null && mn(w[1]) != null && mn(w[1]) > mn(w[0]);
 const win = w => okWin(w) ? w[0] + '–' + w[1] : '';
 const dd = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? +m[3] + ' ' + MON[+m[2] - 1] : ''; };
 const at = s => { const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(String(s || '')); return m ? dd(m[1]) + ' ' + m[2] : ''; };
 const dur = n => n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + n % 60 + ' min' : '') : n + ' min';
 const ors = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join('');
 /* not a Coates truck: Event Portables' own loads and the teams' gear carry no Coates booking text */
 const NOT_COATES = /event portables|^\s*teams?\b/i;

 function index(units){ const by = {}; (Array.isArray(units) ? units : []).forEach(u => { if (u && u.d) (by[u.d] = by[u.d] || []).push(u); }); return by; }

 /* the booking texts for one load: same day, a reference on the load. A text naming one of several references goes where
    the on-time model paired it (pairOf); unpaired, its window is certain only when every text for that set gives the same
    window and there is a text for each reference - otherwise the load says which references the text could be. */
 function forLoad(byDay, iso, refs, carrier, pairOf){
  if (NOT_COATES.test(String(carrier || ''))) return null;
  const mine = new Set((refs || []).map(String)), day = byDay[iso] || [];
  const hits = day.filter(u => (u.r || []).some(r => mine.has(String(r))));
  if (!hits.length) return null;
  const entries = [], sets = new Map();
  let noText = 0;
  hits.forEach(u => {
   if (!okWin(u.w)) { noText++; return; }
   const rs = (u.r || []).map(String);
   if (rs.length === 1) { entries.push({u, ref: rs[0]}); return; }
   const p = pairOf ? pairOf(u) : null;
   /* paired by the on-time model: said so only where the set's texts give different windows (otherwise any pairing reads the same) */
   if (p) {
    const k = rs.join('/'), alike = new Set(day.filter(x => okWin(x.w) && (x.r || []).map(String).join('/') === k).map(x => win(x.w))).size === 1;
    if (mine.has(String(p))) entries.push({u, ref: String(p), paired: !alike});
    return;
   }
   sets.set(rs.join('/'), rs);
  });
  sets.forEach((rs, k) => {
   const all = day.filter(u => okWin(u.w) && (u.r || []).map(String).join('/') === k && !(pairOf && pairOf(u)));
   const same = new Set(all.map(u => win(u.w) + '|' + win(u.wf) + '|' + ((u.rb && u.rb.to) || ''))).size === 1;
   if (same && all.length >= rs.length) rs.filter(r => mine.has(r)).forEach(r => entries.push({u: all[0], ref: r}));
   else all.forEach(u => entries.push({u, ref: null, of: rs}));
  });
  return {entries, noText};
 }

 /* one line per booked window (texts giving the same window share it), with its re-bookings - the same day, or moved to
    another day; texts that could be one of several references share one line naming every window they give */
 function lines(res){
  if (!res) return [];
  if (!res.entries.length) return res.noText ? [{none: true}] : [];
  const groups = new Map();
  res.entries.forEach(({u, ref, of, paired}) => {
   const last = (Array.isArray(u.rs) ? u.rs : []).filter(x => x && okWin(x.w)).slice(-1)[0] || null;
   const moved = u.rb && u.rb.to && last ? {w: last.w, day: u.rb.to, at: last.at} : null;
   const key = of ? 'of|' + of.join('/') : win(u.w) + '|' + (moved ? moved.day + win(moved.w) : '');
   if (!groups.has(key)) groups.set(key, {w: u.w, ws: [], moved, of: of || null, n: 0, kinds: new Set(), refs: new Set(), res: [], paired: false, booked: u.b || null});
   const g = groups.get(key);
   g.n++; g.kinds.add(u.k); if (ref) g.refs.add(ref); if (paired) g.paired = true;
   if (!g.ws.some(w => win(w) === win(u.w))) g.ws.push(u.w);
   if (!moved && okWin(u.wf) && win(u.wf) !== win(u.w)) {
    let r = g.res.find(x => win(x.w) === win(u.wf));
    if (!r) { r = {w: u.wf, at: (u.rs || []).filter(x => x && win(x.w) === win(u.wf)).map(x => x.at).pop() || null, refs: new Set()}; g.res.push(r); }
    if (ref) r.refs.add(ref);
   }
  });
  const L = [...groups.values()];
  L.forEach(g => { g.ws.sort((a, b) => mn(a[0]) - mn(b[0]) || mn(a[1]) - mn(b[1])); g.w = g.ws[0]; });
  L.sort((a, b) => mn(a.w[0]) - mn(b.w[0]) || mn(a.w[1]) - mn(b.w[1]));
  if (L.length > 1) {
   const refs = g => [...g.refs].join(', '), byRef = new Set(L.map(refs)).size > 1;
   L.forEach(g => { g.label = [byRef ? refs(g) : '', [...g.kinds].join(', ')].filter(Boolean).join(' '); });
  }
  return L;
 }
 const between = g => g.ws.map(w => w[0] + ' and ' + w[1]).join(' or ');
 const reWords = (g, r) => 'Re-booked ' + win(r.w) + (r.refs.size && (g.res.length > 1 || r.refs.size < g.refs.size) ? ' for ' + [...r.refs].join(', ') : '') + (r.at ? ' · Coates text ' + at(r.at) : '');
 const ofWords = g => (g.n > 1 ? g.n + ' Coates texts' : 'one Coates text') + ' for ' + ors(g.of);
 /* plain words for one line, the way Andrew put it */
 function said(g){
  if (g.none) return 'No Coates booking text for this delivery';
  return (g.label ? g.label + ': delivery' : 'Delivery') + ' booked between ' + between(g) + (g.of ? ' · ' + ofWords(g) : '') + (g.paired ? ' · matched by arrival order' : '') +
   g.res.map(r => ' · ' + reWords(g, r)).join('') +
   (g.moved ? ' · Re-booked for ' + dd(g.moved.day) + ' ' + win(g.moved.w) + (g.moved.at ? ' · Coates text ' + at(g.moved.at) : '') : '');
 }

 /* the day: every booked window, and when each was done as the on-time model counted it (M from ontime1057.model) */
 function dayModel(units, M){
  const us = (Array.isArray(units) ? units : []).filter(u => okWin(u.w));
  if (!us.length) return null;
  const counted = new Map(), aside = new Set();
  ((M && M.counted) || []).forEach(r => { if (r && r.u) counted.set(r.u.id, r); });
  ((M && M.aside) || []).forEach(x => { if (x && x.u) aside.add(x.u.id); });
  const bars = us.map(u => {
   const r = counted.get(u.id) || null, s = mn(u.w[0]), e = mn(u.w[1]);
   let state = 'notext', arr = null;
   if (r && r.failed) { state = 'failed'; arr = mn(u.f); }
   else if (r && r.laterDay) state = 'later';
   else if (r && Number.isFinite(r.arr)) { arr = r.arr; state = r.in ? 'in' : 'late'; }
   else if (aside.has(u.id)) state = 'aside';
   return {id: u.id, u, r, s, e, state, arr};
  }).sort((a, b) => a.s - b.s || a.e - b.e || String(a.id).localeCompare(String(b.id)));
  const ts = []; bars.forEach(b => { ts.push(b.s, b.e); if (b.arr != null) ts.push(b.arr); });
  const lo = Math.min(240, Math.floor(Math.min(...ts) / 60) * 60), hi = Math.max(1080, Math.ceil(Math.max(...ts) / 60) * 60);
  const count = k => bars.filter(b => b.state === k).length;
  return {bars, n: bars.length, first: Math.min(...bars.map(b => b.s)), last: Math.max(...bars.map(b => b.e)), lo, hi, lanes: packLanes(bars),
   states: {in: count('in'), late: count('late'), failed: count('failed'), later: count('later'), notext: count('notext'), aside: count('aside')}};
 }
 /* bars share a lane when they do not touch (with 20 minutes clear); a delivery done a later day runs to the edge */
 function packLanes(bars){
  const lanes = [];
  bars.forEach(b => {
   const end = b.state === 'later' ? Infinity : Math.max(b.e, b.arr != null ? b.arr : b.e);
   let i = lanes.findIndex(x => x.end + 20 <= b.s);
   if (i < 0) { lanes.push({end: -Infinity, items: []}); i = lanes.length - 1; }
   lanes[i].end = end; lanes[i].items.push(b);
  });
  return lanes.map(x => x.items);
 }

 const core = {mn, ck, win, okWin, at, dd, dur, NOT_COATES, index, forLoad, lines, said, dayModel, packLanes};
 if (typeof document === 'undefined') { root.BW1197 = core; return; }

 const W = root, D = document;
 if (W.cards1197) return;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); } };
 const OT = () => W.ontime1057 || null;
 let BY = null, BYSRC = null;
 const byDay = () => { const o = OT(), u = o && o.units; if (u !== BYSRC) { BYSRC = u; BY = index(u); } return BY || {}; };
 const model = iso => { try { const o = OT(); return o && typeof o.model === 'function' ? o.model(iso) : null; } catch (x) { return null; } };
 const pairer = iso => { const M = model(iso); return u => { const s = M && M.site && M.site.get(u.id); return s && s.one && s.ref ? String(s.ref) : null; }; };
 const what = (u, r) => { try { const o = OT(); return o && typeof o.what === 'function' ? o.what(u, r) : u.k; } catch (x) { return u.k; } };
 const CLOCK = '<svg class="bw1197-clock" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4"/><path d="M8 4.3V8l2.6 1.7"/></svg>';

 /* the load: one band at the end of its references (the load cards move the references whole into the card summary) */
 function bandHtml(iso, grp){
  const refs = (grp.rows || []).map(r => r && r.a && r.a.key).filter(Boolean);
  const L = lines(forLoad(byDay(), iso, refs, grp.carrier, pairer(iso)));
  if (!L.length) return '';
  if (L[0].none) return '<span class="bw1197-band none" data-bw1197-load="' + e(refs.join('/')) + '">' + CLOCK + '<span class="bw1197-say">' + e(said(L[0])) + '</span></span>';
  return '<span class="bw1197-band" data-bw1197-load="' + e(refs.join('/')) + '" title="' + e('From the Coates booking text' + (L.length > 1 || L[0].n > 1 ? 's' : '') + (L[0].booked ? ' (first sent ' + at(L[0].booked) + ')' : '')) + '">' + CLOCK + L.map(g =>
   '<span class="bw1197-say" data-bw1197-window="' + e(g.ws.map(win).join(' ')) + '">' + (g.label ? '<span class="bw1197-what">' + e(g.label) + ':</span> delivery' : 'Delivery') + ' booked between ' +
   g.ws.map(w => '<b>' + e(w[0]) + '</b> and <b>' + e(w[1]) + '</b>').join(' or ') +
   (g.of ? '<span class="bw1197-of"> · ' + e(ofWords(g)) + '</span>' : '') + (g.paired ? '<span class="bw1197-of"> · matched by arrival order</span>' : '') +
   g.res.map(r => '<span class="bw1197-re">' + e(reWords(g, r)) + '</span>').join('') +
   (g.moved ? '<span class="bw1197-re">Re-booked for ' + e(dd(g.moved.day) + ' ' + win(g.moved.w)) + (g.moved.at ? ' · Coates text ' + e(at(g.moved.at)) : '') + '</span>' : '') +
   '</span>').join('') + '</span>';
 }
 function wrapLine(){
  if (typeof W.timeline846Line !== 'function' || W.timeline846Line.__bw1197) return;
  const before = W.timeline846Line, END = '</span><span class="ld-x" aria-hidden="true"></span></button>';
  const g = function (d, grp){
   let h = before.apply(this, arguments);
   try {
    if (typeof h !== 'string' || !d || !d.iso || !grp || grp.kind !== 'deliveries' || h.indexOf('bw1197-band') >= 0) return h;
    const band = bandHtml(d.iso, grp), i = band ? h.indexOf(END) : -1;
    if (i >= 0) h = h.slice(0, i) + band + h.slice(i);
   } catch (x) {}
   return h;
  };
  g.__bw1197 = true; W.timeline846Line = g;
 }

 /* the day card: one row after DAY'S DELIVERIES (before Coates on time, else before the work block or the staff) */
 const STATES = [['in', 'Done in the window'], ['late', 'Done late'], ['later', 'Done a later day'], ['failed', 'Not delivered'], ['notext', 'No delivered text'], ['aside', 'Set aside']];
 function barTitle(b){
  const name = what(b.u, b.r), w = 'booked ' + win(b.u.w);
  if (b.state === 'in') return name + ' · ' + w + ' · done ' + ck(b.arr) + ', in the window';
  if (b.state === 'late') return name + ' · ' + w + ' · done ' + ck(b.arr) + ', ' + dur(b.arr - b.e) + ' late';
  if (b.state === 'later') return name + ' · ' + w + ' · done ' + dd(b.u.td) + (b.u.t ? ' ' + b.u.t : '');
  if (b.state === 'failed') return name + ' · ' + w + ' · not delivered' + (b.u.f ? ' (Coates text ' + b.u.f + ')' : '');
  if (b.state === 'aside') return name + ' · ' + w + ' · set aside, not counted';
  return name + ' · ' + w + ' · no delivered text loaded';
 }
 function cardRow(iso){
  const m = dayModel(byDay()[iso], model(iso)); if (!m) return null;
  const span = m.hi - m.lo, x = n => (100 * (n - m.lo) / span).toFixed(2) + '%', w = n => Math.max(0, 100 * n / span).toFixed(2) + '%';
  const step = span > 14 * 60 ? 180 : 120;
  let grid = '';
  for (let t = Math.ceil(m.lo / step) * step; t <= m.hi; t += step) grid += '<span class="bw1197-hr" style="left:' + x(t) + '"><em>' + String(t / 60).padStart(2, '0') + '</em></span>';
  const bar = b => {
   let h = '<span class="bw1197-bar ' + b.state + '" style="left:' + x(b.s) + ';width:' + w(b.e - b.s) + '" title="' + e(barTitle(b)) + '"></span>';
   if (b.state === 'late' && b.arr > b.e) h += '<span class="bw1197-tail" style="left:' + x(b.e) + ';width:' + w(b.arr - b.e) + '"></span>';
   if (b.state === 'in' || b.state === 'late') h += '<span class="bw1197-dot ' + b.state + '" style="left:' + x(b.arr) + '" title="' + e(barTitle(b)) + '"></span>';
   if (b.state === 'failed') h += '<span class="bw1197-x" style="left:' + x(b.arr != null ? b.arr : b.e) + '" title="' + e(barTitle(b)) + '"></span>';
   if (b.state === 'later') h += '<span class="bw1197-tail later" style="left:' + x(b.e) + ';right:0"></span><span class="bw1197-arrow" title="' + e(barTitle(b)) + '"></span>';
   return h;
  };
  const key = STATES.filter(([k]) => m.states[k]).map(([k, t]) => '<span class="bw1197-key-' + k + '"><i aria-hidden="true"></i>' + e(t) + '</span>').join('');
  const one = m.n === 1, words = (one ? 'Delivery' : 'Deliveries') + ' booked between ' + ck(m.first) + ' and ' + ck(m.last);
  const tally = [m.states.in ? m.states.in + ' done in the window' : '', m.states.late ? m.states.late + ' done late' : '', m.states.later ? m.states.later + ' done a later day' : '',
   m.states.failed ? m.states.failed + ' not delivered' : '', m.states.notext ? m.states.notext + ' with no delivered text' : '', m.states.aside ? m.states.aside + ' set aside' : ''].filter(Boolean).join(', ');
  const html = '<span class="bw1197-row" data-bw1197="' + e([m.n, m.first, m.last, m.lanes.length, tally].join('|')) + '">' +
   '<span class="bw1197-head"><span class="bc984-label">' + (one ? 'DELIVERY' : 'DELIVERIES') + ' BOOKED BETWEEN<span class="bc984-at-close">' + m.n + ' COATES BOOKING TEXT' + (one ? '' : 'S') + '</span></span>' +
   '<span class="bw1197-span">' + ck(m.first) + '<i>–</i>' + ck(m.last) + '</span></span>' +
   '<span class="bw1197-chart" aria-hidden="true" style="--bw1197-lanes:' + m.lanes.length + '"><span class="bw1197-grid">' + grid + '</span>' +
   m.lanes.map(items => '<span class="bw1197-lane">' + items.map(bar).join('') + '</span>').join('') + '</span>' +
   (key ? '<span class="bw1197-key" aria-hidden="true">' + key + '</span>' : '') + '</span>';
  return {html, aria: words + ' by ' + m.n + ' Coates booking text' + (one ? '' : 's') + (tally ? ': ' + tally : '') + '.', m};
 }
 function wrapCards(){
  const B = W.BuildCards984; if (!B || typeof B.html !== 'function' || B.html.__bw1197) return;
  const before = B.html;
  const g = function (day){
   let h = before.apply(this, arguments);
   try {
    if (typeof h !== 'string' || !day || !day.iso || h.indexOf('bw1197-row') >= 0) return h;
    const row = cardRow(day.iso); if (!row) return h;
    let i = h.indexOf('<span class="bc984-load-row ot1056 ot1057');
    if (i < 0) { const m = /<span class="bc986-work[ "]/.exec(h); i = m ? m.index : -1; }
    if (i < 0) i = h.indexOf('<span class="bc984-crew">');
    if (i < 0) return h;
    h = h.slice(0, i) + row.html + h.slice(i);
    /* read out before "Weather: …": the Timeline's weather refresh rewrites everything from "Weather: " to the end */
    h = h.replace(/^(<button\b[^>]*?\saria-label=")([^"]*)(")/, (m, a, b, c) => { const k = b.lastIndexOf(' Weather: '), add = ' ' + e(row.aria); return a + (k >= 0 ? b.slice(0, k) + add + b.slice(k) : b + add) + c; });
   } catch (x) {}
   return h;
  };
  /* the on-time wrapper re-wraps when its flag is missing; it is already inside this one */
  g.__bw1197 = true; if (before.__ot1057) g.__ot1057 = true; B.html = g;
 }
 wrapLine(); wrapCards();
 W.cards1197 = Object.freeze(Object.assign({version: 'v11.97', bandHtml, cardRow}, core));
 const again = () => { try { wrapLine(); wrapCards(); } catch (x) {} };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', again); else again();
 /* cards already drawn before this script: draw the Timeline once more */
 try { const p = D.getElementById('pane-timeline'); if (p && p.classList.contains('on') && typeof renderTimeline === 'function') renderTimeline(); } catch (x) {}
})(typeof window !== 'undefined' ? window : globalThis);
