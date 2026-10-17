"""Author: Andrew Fisher. v10.57 part 3 - COATES ON TIME on each completed Build day card: accurate, live, with the
reasons (Andrew, 17 Oct 2026, on the Build tab: "If the transport is not 100% i want a reason why. This need to refresh
and be accurate. Needs to be neat and tidy its a card of that day with details.").

What changes on a completed (past) Build day card:
- ONE row, straight under DAY'S DELIVERIES: "COATES ON TIME · 3 OF 4" with the percentage, and, when it is under 100%,
  one short line in plain words ("1 late · Ticket box 26 min"; "6 late · Toilets x3, Buildings x2 +1 more"). The figure
  is also read out with the card (the card button's label).
- More info gets a "Coates on time" section: one line per late, failed or set-aside load - category, item, reference,
  docket, carrier and load time, booked window (and the re-sent one), on site HH:MM (site record or site note) / Coates
  text HH:MM, minutes late - then the facts the data holds about it, each labelled, ending "No cause recorded on site."
  Then the loads that were on time, bookings with no delivered text, texts with no booking, the figure against the
  windows Coates had re-sent before the day, build to date, and "Coates texts loaded to 16 Oct 2026 17:47".

How it is counted (v10.48's basis, kept until Andrew says otherwise): each Coates booking is one unit, measured
against the window FIRST texted. Arrival is the earlier of the Coates "delivered" text and Andrew's site time for that
reference that day, read live from the record every time the cards draw: a time written in the site note ("on site
08:00", "turned up 14:30", "here", "put down", "in place", "delivered"), else the earliest "on site" tick that day;
notes that say the time was not recorded ("TIME ON SITE NOT RECORDED", "no arrival time was given") give no time.
A failed delivery counts as not on time and is listed. A booking with no delivered text is listed, not counted.
WC50's 25 Sep text is set aside (the site record, the register and the programme disagree with it; all named).

The units come from ontime1057_units.json (build_ontime1057.py: the full Coates text export, one row per unit, matched
to references from the page's programme and register). The reasons are facts only: window history, programme carrier
and load time ("due about HH:MM (planning run 70 min), after the window"), "Coates texted on its way HH:MM" (never when
3 or more texts share the minute), Andrew's curfew rule for oversize loads from 2 Oct, the schedule row's own words,
and "texted together with X". Never "left Kingston" or "same truck".

Refresh: no timers. Every redraw already ends in the Timeline cards (BuildCards984.html), and the figure is worked
out once per draw (RENDER_MEMO 'ot1057|<day>'), so a tick Andrew adds moves the figure on the next draw.

The v10.56 painter is switched off (its row was on the v10.48 basis), and the v10.48 day-panel fold stands down, so a
day shows one figure. The record does not change. No footer bump here (the release integrator does that).

    python3 part3_ontime.py path/to/page.html   (on the v10.56 page, or after the other v10.57 parts)
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"
UNITS = HERE / 'ontime1057_units.json'

JS = r'''/* Author: Andrew Fisher. v10.57 - Coates on time on each completed Build day card, against the first booked window, with the reasons as facts; read live from the site record on every draw. */
(function(W){
 'use strict';
 if (W.ontime1057) return;
 const D = W.document, T = __DATA__, U = Array.isArray(T.units) ? T.units : [];
 const BYDAY = {}, BYID = {};
 U.forEach(u => { (BYDAY[u.d] = BYDAY[u.d] || []).push(u); BYID[u.id] = u; });
 const DAYS = Object.keys(BYDAY).sort();
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const mn = s => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? +m[1] * 60 + +m[2] : null; };
 const ck = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
 const dur = n => n >= 60 ? Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + n % 60 + ' min' : '') : n + ' min';
 const win = w => w ? w[0] + '–' + w[1] : '';
 const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 const dd = iso => { const p = String(iso).split('-'); return +p[2] + ' ' + MON[+p[1] - 1]; };
 const stamp = s => dd(s.slice(0, 10)) + ' ' + s.slice(11, 16);
 const today = () => { try { return todayIso(); } catch (x) { return new Date().toISOString().slice(0, 10); } };
 const FMT = new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
 function local(at){ const t = Date.parse(at); if (!Number.isFinite(t)) return null; const p = {}; FMT.formatToParts(new Date(t)).forEach(x => { p[x.type] = x.value; }); return {iso: p.year + '-' + p.month + '-' + p.day, min: (+p.hour % 24) * 60 + +p.minute}; }
 const run = () => { try { const n = run782(); return Number.isFinite(n) && n > 0 ? n : 70; } catch (x) { return 70; } };
 const loadBy = () => { try { return clock782(LOAD_BY782); } catch (x) { return '05:00'; } };
 const memo = (k, f) => {
  try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO.has(k)) return RENDER_MEMO.get(k); } catch (x) {}
  const v = f(); try { if (typeof RENDER_MEMO !== 'undefined') RENDER_MEMO.set(k, v); } catch (x) {} return v;
 };
 const who = u => u.r && u.r.length === 1 ? u.r[0] : u.r && u.r.length ? 'one of ' + u.r.join('/') : 'no reference on the page';

 /* the site time for a reference that day: a time written in the site note, else the earliest "on site" tick */
 const NONE = /TIME ON SITE NOT RECORDED|no arrival time was given|exact arrival time not supplied|stamped at the moment/i;
 const NOTE_T = /\b(?:on site|turned up|here|put down|in place|delivered)\s+(\d{1,2}):(\d{2})\b/gi;
 const NOTE_D = /\b(\d{1,2})\s+(Sep|Sept|Oct|Nov)\b/gi;
 function siteOf(ref, iso){
  return memo('ot1057s|' + ref + '|' + iso, () => {
   let d = null; try { d = deliveryOf(ref); } catch (x) { d = null; }
   if (!d) return {times: []};
   const ticks = onTicks(d).filter(x => x.iso === iso && x.min > 0).map(x => x.min).sort((a, b) => a - b);
   const note = String(d.note || '');
   const days = [...note.matchAll(NOTE_D)].map(x => '2026-' + (/^sep/i.test(x[2]) ? '09' : /^oct/i.test(x[2]) ? '10' : '11') + '-' + String(x[1]).padStart(2, '0'));
   const forDay = (ticks.length > 0 || d.date === iso) && (!days.length || days.includes(iso));
   if (forDay && NONE.test(note)) return {times: [], none: true};
   if (forDay) {
    const ts = [...note.matchAll(NOTE_T)].map(x => +x[1] * 60 + +x[2]).filter(n => n > 0 && n < 1440).sort((a, b) => a - b);
    if (ts.length) return {times: ts, src: 'site note'};
   }
   if (ticks.length) return {times: [ticks[0]], src: 'site record'};
   return {times: []};
  });
 }
 /* "on site" ticks, leaving out one taken off again within ten minutes (T0021 16 Sep 07:14, T0085 5 Oct 06:26) */
 function onTicks(d){
  const hs = (d && Array.isArray(d.history) ? d.history : []).filter(h => h && Number.isFinite(Date.parse(h.at))).slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return hs.filter((h, i) => h.state === 'on site' && !(hs[i + 1] && hs[i + 1].state !== 'on site' && Date.parse(hs[i + 1].at) - Date.parse(h.at) < 600000)).map(h => local(h.at)).filter(Boolean);
 }
 function nextOnSite(ref, iso){
  let d = null; try { d = deliveryOf(ref); } catch (x) { return null; }
  return onTicks(d).filter(x => x.iso > iso).sort((a, b) => a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.min - b.min)[0] || null;
 }
 function oversize(ref){ try { const a = assetOf(ref); return !!(a && flow891Oversize(a)); } catch (x) { return false; } }
 const BIG = /^(Building( [\d.]+ m)?|Ticket box|Commentary booth [\d.]+ m|Toilet block|Container( [\d.]+ m)?)$/;
 const curfewSaid = () => { try { return String(FLOW891.curfew.said || ''); } catch (x) { return ''; } };

 /* the day: units counted against their first booked window, arrival = the earlier of the Coates text and the site time */
 function model(iso){ return memo('ot1057|' + iso, () => build(iso)); }
 function build(iso){
  const us = BYDAY[iso] || [];
  const M = {iso, units: us, counted: [], inside: 0, insideW: 0, late: [], failed: [], aside: [], notext: [], nob: [], ontime: [], unpaired: [], site: new Map(), after: iso > T.export_day, resent: false};
  const live = us.filter(u => !u.nb && !u.x && (u.t || u.f));
  const order = u => (u.td ? 9 * 1440 : 0) + (u.t ? mn(u.t) : mn(u.f) || 0);
  const groups = new Map();
  live.forEach(u => { if (!u.r || !u.r.length) return; const k = u.r.join('/'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(u); });
  groups.forEach(g => {
   g.sort((a, b) => order(a) - order(b));
   const refs = g[0].r;
   if (refs.length === 1) {
    const s = siteOf(refs[0], iso);
    g.forEach((u, i) => { if (i < s.times.length && !u.td) M.site.set(u.id, {min: s.times[i], src: s.src, ref: refs[0]}); });
    if (s.times.length === 1 && !g[0].td) g.forEach(u => { if (!M.site.has(u.id) && u.t && u.t === g[0].t && !u.td) M.site.set(u.id, {min: s.times[0], src: s.src, ref: refs[0]}); });
   } else {
    const per = refs.map(r => ({r, s: siteOf(r, iso)}));
    if (per.length === g.length && per.every(p => p.s.times.length === 1)) {
     per.sort((a, b) => a.s.times[0] - b.s.times[0]);
     g.forEach((u, i) => M.site.set(u.id, {min: per[i].s.times[0], src: per[i].s.src, ref: per[i].r, one: true}));
    } else {
     const seen = per.filter(p => p.s.times.length).map(p => p.r + ' ' + ck(p.s.times[0]));
     if (seen.length) M.unpaired.push({refs, seen, k: g[0].k});
    }
   }
  });
  live.forEach(u => {
   const s = M.site.get(u.id) || null, r = {u, site: s};
   if (u.f && !u.t) { r.failed = true; M.failed.push(r); M.counted.push(r); return; }
   const text = u.td ? null : mn(u.t);
   let arr = text, src = 'text';
   /* the site record is the truth: a time written in the site note wins; otherwise the earlier of the text and the site tick (ticks can be entry stamps) */
   if (s && (text == null || s.min < text || s.src === 'site note')) { arr = s.min; src = 'site'; }
   r.arr = arr; r.src = src;
   if (arr == null) { r.laterDay = true; M.counted.push(r); M.late.push(r); return; }
   r.lateBy = arr - mn(u.w[1]); r.in = r.lateBy <= 0; r.inW = arr <= mn((u.wf || u.w)[1]);
   if (u.wf) M.resent = true;
   M.counted.push(r);
   if (r.in) { M.inside++; M.ontime.push(r); } else M.late.push(r);
   if (r.inW) M.insideW++;
  });
  us.forEach(u => { if (u.x) M.aside.push({u}); else if (u.nb) M.nob.push({u}); else if (!u.t && !u.f) M.notext.push({u}); });
  const start = r => mn(r.u.w ? r.u.w[0] : '99:00');
  [M.late, M.failed, M.ontime].forEach(a => a.sort((x, y) => start(x) - start(y) || order(x.u) - order(y.u)));
  M.n = M.counted.length; M.pct = M.n ? Math.round(100 * M.inside / M.n) : null; M.pctW = M.n ? Math.round(100 * M.insideW / M.n) : null;
  return M;
 }
 function toDate(iso){
  let n = 0, k = 0; DAYS.forEach(d => { if (d <= iso && d <= T.export_day) { const M = model(d); n += M.n; k += M.inside; } });
  return n ? {n, inside: k, pct: Math.round(100 * k / n)} : null;
 }

 /* the reasons: facts only, each labelled */
 function afterRefs(words, iso){
  const m = /after\s+(P\d+)(?:\s*-\s*(P\d+))?/i.exec(words.join(' ')); if (!m) return '';
  const got = [m[1], m[2]].filter(Boolean).map(r => { const s = siteOf(r, iso); return s.times.length ? r + ' on site ' + ck(s.times[0]) : ''; }).filter(Boolean);
  return got.length ? ' (' + got.join(', ') + ')' : '';
 }
 function reasons(r, iso, M){
  const u = r.u, out = [];
  if (u.sib && u.sib.length) out.push('Booked as ' + (u.sib.length + 1) + ' units together on ' + stamp(u.b) + ' (' + [u.w].concat(u.sib).sort((a, b) => mn(a[0]) - mn(b[0]) || mn(a[1]) - mn(b[1])).map(win).join(', ') + ')');
  (u.rs || []).forEach(x => {
   const t = mn(x.at.slice(11)), on = x.at.slice(0, 10) === iso;
   const tail = on ? (t > mn(u.w[1]) ? ', on the day, after the booked window had closed' : t >= mn(u.w[0]) ? ', on the day, after the booked window had opened' : ', on the day') : '';
   out.push('Coates moved the window on ' + stamp(x.at) + ' to ' + win(x.w) + tail + (x.one ? ' (one of ' + x.one + ' units booked alike)' : ''));
  });
  if (/^(programme load order|reviewed|the .* programme \(item and size\))/.test(u.m || '')) out.push('Matched by ' + String(u.m).replace(/^reviewed: /, ''));
  const pg = u.pg;
  if (pg && pg.load) { const due = mn(pg.load) + run(), wl = u.rs && u.rs.length ? u.rs[u.rs.length - 1].w : null;
   if (due > mn(u.w[1])) out.push('Programme load ' + pg.load + ', due about ' + ck(due) + ' (planning run ' + run() + ' min), after the ' + (wl ? 'booked window' + (mn(wl[1]) >= due ? ', inside the re-sent one' : '') : 'window')); }
  if (pg && pg.words && pg.words.length) out.push('Schedule words: ' + pg.words.map(w => '‘' + w + '’').join(' · ') + afterRefs(pg.words, iso));
  if (u.o && !u.od && !u.ob && r.arr != null && mn(u.o) < r.arr) out.push('Coates texted on its way ' + u.o + ', ' + dur(r.arr - mn(u.o)) + ' before arrival (planning run ' + run() + ' min)');
  if (u.r && u.r.length === 1 && BIG.test(u.k) && oversize(u.r[0])) {
   if (iso >= '2026-10-02') out.push('Oversize: the curfew rule puts it on the earliest run, away from Kingston by ' + loadBy() + ' and on site before 07:00');
   else { const said = curfewSaid(); if (said && new RegExp('\\b' + u.r[0] + '\\b').test(said)) out.push('The curfew rule names ' + u.r[0] + ': ' + said); }
  }
  (u.tg || []).map(id => BYID[id]).filter(Boolean).forEach(v => {
   const vs = M.site.get(v.id), own = v.r && v.r.length === 1 && !(u.r && u.r.length === 1 && u.r[0] === v.r[0]);
   const name = own ? v.r[0] : v.k + (v.r && v.r.length ? ' (' + who(v) + ')' : '');
   out.push('Texted together with ' + name + (vs && vs.min < mn(v.t) ? '; ' + (own ? name : 'it was') + ' on site ' + ck(vs.min) : ''));
  });
  if (r.failed && u.r && u.r.length === 1) { const n = nextOnSite(u.r[0], iso); if (n) out.push('Site record: ' + u.r[0] + ' on site ' + dd(n.iso) + ' ' + ck(n.min)); }
  return out;
 }
 function carrier(u){
  const pg = u.pg;
  if (pg) return pg.carrier ? pg.carrier + (pg.load ? ', load ' + pg.load : '') : 'programme ' + pg.task + (pg.load ? ': no carrier, load ' + pg.load : ': no carrier or load time');
  if (u.pgm && u.pgm.length) return 'programme ' + u.pgm.map(x => x.ref + ' ' + [x.carrier, x.load].filter(Boolean).join(' ')).join(', ');
  return u.r && u.r.length ? 'no programme row for this item that day' : 'not on the programme';
 }
 function lineHtml(r, iso, M){
  const u = r.u, bits = ['<b>' + e((u.k === u.c ? u.c : u.c + ' · ' + u.k) + ' · ' + who(u)) + '</b>'];
  if (u.dk) bits.push(e('DD ' + u.dk));
  bits.push(e(carrier(u)));
  bits.push(e('booked ' + win(u.w) + (u.rs && u.rs.length ? ', re-sent ' + win(u.rs[u.rs.length - 1].w) : '')));
  if (r.failed) bits.push(e('Coates texted ‘could not be delivered’ ' + u.f) + ' · <b>not on time</b>');
  else if (r.laterDay) bits.push(e('Coates texted delivered ' + dd(u.td) + ' ' + u.t) + ' · <b>not on time</b>');
  else {
   const s = r.site, tx = 'Coates text ' + (u.td ? dd(u.td) + ' ' : '') + u.t;
   bits.push(e(r.src === 'site' ? 'on site ' + ck(s.min) + ' (' + s.src + (s.one ? ' ' + s.ref + ', paired in time order' : '') + ') / ' + tx : tx + (s ? ' (' + s.src + ' ' + ck(s.min) + ', later)' : '')));
   bits.push('<b>' + e(dur(r.lateBy) + ' late') + '</b>');
  }
  return '<li class="ot1057-li"><span>' + bits.join(' · ') + '</span><small>' + e(reasons(r, iso, M).concat(['No cause recorded on site.']).join(' · ')) + '</small></li>';
 }
 function shortWhy(M){
  const bad = M.late.concat(M.failed); if (!bad.length) return '';
  const head = [M.late.length ? M.late.length + ' late' : '', M.failed.length ? M.failed.length + ' failed' : ''].filter(Boolean).join(', ');
  if (bad.length === 1) { const r = bad[0]; return head + ' · ' + r.u.k + (r.failed || r.laterDay ? '' : ' ' + dur(r.lateBy)); }
  const cats = {}; bad.forEach(r => { cats[r.u.c] = (cats[r.u.c] || 0) + 1; });
  const parts = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => n > 1 ? c + ' ×' + n : c);
  let s = head + ' · ' + parts.join(', '), k = 0;
  while (s.length > 64 && parts.length > 1) { parts.pop(); k++; s = head + ' · ' + parts.join(', ') + ' +' + k + ' more'; }
  return s;
 }
 function cardRow(iso){
  const M = model(iso); if (!M.n) return null;
  const tone = M.pct >= 80 ? 'good' : M.pct >= 50 ? 'mid' : 'bad', why = shortWhy(M);
  const key = [M.pct, M.inside, M.n, why].join('|');
  const said = n => { const h = Math.floor(n / 60), m = n % 60; return [h ? h + (h === 1 ? ' hour' : ' hours') : '', m ? m + (m === 1 ? ' minute' : ' minutes') : ''].filter(Boolean).join(' ') || '0 minutes'; };
  const bad = M.late.concat(M.failed), cats = {}; bad.forEach(r => { cats[r.u.c] = (cats[r.u.c] || 0) + 1; });
  const aria = 'Coates on time ' + M.pct + ' percent: ' + M.inside + ' of ' + M.n + ' inside the booked window.' + (!bad.length ? '' : bad.length === 1 ? ' ' + (bad[0].failed ? '1 failed: ' : bad[0].laterDay ? '1 late: ' : '1 late: ') + bad[0].u.k + (bad[0].lateBy > 0 ? ', ' + said(bad[0].lateBy) : '') + '.' :
   ' ' + [M.late.length ? M.late.length + ' late' : '', M.failed.length ? M.failed.length + ' failed' : ''].filter(Boolean).join(', ') + ': ' + Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', ') + '.');
  const html = '<span class="bc984-load-row ot1056 ot1057 ot1056-' + tone + '" data-ot1057="' + e(key) + '" title="' + e('Coates texts and the site record: ' + M.inside + ' of ' + M.n + ' inside the first booked window') + '">' +
   '<span class="bc984-label">COATES ON TIME · ' + M.inside + ' OF ' + M.n + (why ? '<span class="ot1057-why">' + e(why) + '</span>' : '<span class="bc984-at-close">INSIDE THE BOOKED WINDOW</span>') + '</span>' +
   '<span class="bc984-load-count">' + M.pct + '<small>%</small></span></span>';
  return {html, aria, M};
 }
 function moreHtml(iso){
  const M = model(iso);
  const src = '<p class="ot1057-src">Each Coates booking is one unit, measured against the window first texted. Arrival is the earlier of the Coates ‘delivered’ text and the site time that day (a time in the site note, else the first on-site tick). A failed delivery counts as not on time; a booking with no delivered text is listed, not counted. Coates texts loaded to ' + e(T.export_at) + '</p>';
  if (M.after) {
   return '<section class="bc986-work-details ot1057-more" data-ot1057-more="' + e(iso) + '"><b>Coates on time</b><p>No Coates texts loaded after ' + e(T.export_at) + '.' +
    (M.units.length ? ' Booked for this day before then: ' + e(M.units.map(u => u.k + ' · ' + who(u) + ' · ' + win(u.w)).join('; ')) + '.' : '') + '</p></section>';
  }
  if (!M.units.length) return '';
  let h = '<section class="bc986-work-details ot1057-more" data-ot1057-more="' + e(iso) + '"><b>Coates on time</b>';
  if (M.n) {
   const td = toDate(iso);
   h += '<p class="ot1057-head"><strong>' + M.pct + '%</strong> · ' + M.inside + ' of ' + M.n + ' inside the first booked window.' +
    (M.resent ? ' Against the windows Coates had re-sent before the day: ' + M.pctW + '% (' + M.insideW + ' of ' + M.n + ').' : '') +
    (td ? ' Build to date: ' + td.pct + '% (' + td.inside + ' of ' + td.n + ').' : '') + '</p>';
  }
  const bad = M.failed.concat(M.late);
  if (bad.length) h += '<ul class="ot1057-list">' + bad.map(r => lineHtml(r, iso, M)).join('') + '</ul>';
  if (M.aside.length) h += '<p class="ot1057-aside"><b>Set aside, not counted</b></p><ul class="ot1057-list">' + M.aside.map(({u}) =>
   '<li class="ot1057-li"><span><b>' + e((u.k === u.c ? u.c : u.c + ' · ' + u.k) + ' · ' + who(u)) + '</b> · ' + e('booked ' + win(u.w) + ' · Coates text ' + (u.td ? dd(u.td) + ' ' : '') + (u.t || '')) + '</span><small>' + e(u.x.why + ' Sources: ' + u.x.sources.join('; ') + '.') + '</small></li>').join('') + '</ul>';
  if (M.ontime.length) h += '<p class="ot1057-ok"><b>On time</b> ' + e(M.ontime.map(r => r.u.k + ' · ' + who(r.u) + ' · ' + (r.src === 'site' ? 'on site ' + ck(r.arr) : 'Coates text ' + r.u.t) + ' (booked ' + win(r.u.w) + ')').join('; ')) + '</p>';
  /* a time written in the site note that is well after the Coates "delivered" text: the two disagree; shown, never hidden */
  const clash = M.counted.filter(r => r.src === 'site' && r.site && r.site.src === 'site note' && r.u.t && r.site.min - mn(r.u.t) >= 30);
  if (clash.length) h += '<p class="ot1057-note"><b>Site note and Coates text disagree</b> ' + e(clash.map(r => { const by = r.site.min - mn(r.u.w[1]);
   return who(r.u) + ': site note on site ' + ck(r.site.min) + ', Coates text ' + r.u.t + ' (booked ' + win(r.u.w) + '); counted on the site note, the site record' + (by > 0 ? ' (' + dur(by) + ' late)' : ' (inside the booked window either way)'); }).join(' · ')) + '</p>';
  if (M.unpaired.length) h += '<p class="ot1057-note"><b>Site record, not paired</b> ' + e(M.unpaired.map(x => x.k + ', one of ' + x.refs.join('/') + ': ' + x.seen.join(', ') + '; the texts cannot tell which unit is which, so the Coates text times stand').join(' · ')) + '</p>';
  if (M.notext.length) h += '<p class="ot1057-note"><b>Booked, no delivered text (not counted)</b> ' + e(M.notext.map(({u}) => {
   const seen = (u.r || []).map(r => { const s = siteOf(r, iso); return s.times.length ? r + ' on site ' + ck(s.times[0]) : ''; }).filter(Boolean);
   return u.k + ' · ' + who(u) + ' · booked ' + win(u.w) + (seen.length ? ' · site record: ' + seen.join(', ') : '');
  }).join('; ')) + '</p>';
  if (M.nob.length) h += '<p class="ot1057-note"><b>Delivered with no booking text (not counted)</b> ' + e(M.nob.map(({u}) => u.k + ' · ' + who(u) + ' · Coates text ' + (u.t || u.f)).join('; ')) + '</p>';
  return h + src + '</section>';
 }

 /* the card: one row straight under DAY'S DELIVERIES (before the work block, else before the staff block) */
 function wrapCards(){
  const B = W.BuildCards984; if (!B || typeof B.html !== 'function' || B.html.__ot1057) return;
  const before = B.html;
  const g = function(day){
   let h = before.apply(this, arguments);
   try {
    if (typeof h !== 'string' || !day || !day.iso || !(day.iso < today()) || h.indexOf(' ot1057 ') >= 0) return h;
    const row = cardRow(day.iso); if (!row) return h;
    let i = h.indexOf('<span class="bc986-work">');
    if (i < 0) { const m = /<span class="bc986-work[ "]/.exec(h); i = m ? m.index : -1; }
    if (i < 0) i = h.indexOf('<span class="bc984-crew">');
    if (i < 0) return h;
    h = h.slice(0, i) + row.html + h.slice(i);
    /* read out before "Weather: …": the Timeline's weather refresh rewrites everything from "Weather: " to the end */
    h = h.replace(/^(<button\b[^>]*?\saria-label=")([^"]*)(")/, (m, a, b, c) => { const k = b.lastIndexOf(' Weather: '), add = ' ' + e(row.aria); return a + (k >= 0 ? b.slice(0, k) + add + b.slice(k) : b + add) + c; });
   } catch (x) {}
   return h;
  };
  g.__ot1057 = true; B.html = g;
 }
 /* More info: the Coates on time section after the work recorded */
 function wrapDetails(){
  const V = W.BuildWorkView986; if (!V || typeof V.details !== 'function' || V.details.__ot1057) return;
  const before = V.details;
  const g = function(work){
   let h = before.apply(this, arguments);
   try {
    let iso = work && work.iso;
    if (!iso && !work) { const s = D.querySelector('#pane-timeline .bc984-day.on'); iso = s && s.getAttribute('data-day'); }
    if (iso && iso < today() && (typeof h === 'string' || h == null) && String(h || '').indexOf('ot1057-more') < 0) h = String(h || '') + moreHtml(iso);
   } catch (x) {}
   return h;
  };
  g.__ot1057 = true; V.details = g;
 }
 wrapCards(); wrapDetails();
 const st = D.createElement('style'); st.id = 'ontime1057-style';
 st.textContent = ':is(#pane-timeline) .bc984-load-row.ot1057{margin-top:0;border-top:0;min-height:0;padding:9px 0 10px}' +
  ':is(#pane-timeline) .ot1057>.bc984-label{min-width:0;flex:1 1 auto}' +
  ':is(#pane-timeline) .ot1057 .bc984-load-count small{font-size:.55em;margin-left:2px}' +
  ':is(#pane-timeline) .ot1057-why{display:block;margin-top:3px;font-size:11.5px;font-weight:650;letter-spacing:.01em;line-height:1.35;text-transform:none;color:#ffd08a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  ':is(#pane-timeline) .ot1057-more .ot1057-head strong{font-size:1.15em}' +
  ':is(#pane-timeline) .ot1057-more ul.ot1057-list{padding-left:18px;margin:6px 0 10px}' +
  ':is(#pane-timeline) .ot1057-more .ot1057-li{margin:7px 0;line-height:1.45}' +
  ':is(#pane-timeline) .ot1057-more .ot1057-li small{display:block;margin-top:2px;line-height:1.45}' +
  ':is(#pane-timeline) .ot1057-more .ot1057-src{font-size:.85em;opacity:.85}';
 D.head.appendChild(st);
 W.ontime1057 = {version: 'v10.57', model, siteOf, cardRow, moreHtml, toDate, units: U, exportAt: T.export_at};
 /* wrap again once every script has run, in case a later script wrapped the same functions after this one */
 const again = () => { try { wrapCards(); wrapDetails(); } catch (x) {} };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', again); else again();
 /* cards already drawn before this script: draw the Timeline once more */
 try { const p = D.getElementById('pane-timeline'); if (p && p.classList.contains('on') && typeof renderTimeline === 'function') renderTimeline(); } catch (x) {}
})(window);
'''


def build_patches():
    data = json.loads(UNITS.read_text(encoding='utf-8'))
    data.pop('author', None)                          # the page's own author line covers it
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    new = '</script>\n<script id="ontime1057-script">' + JS.replace('__DATA__', blob) + '</script>\n</body>\n</html>'
    return [
        ('Coates on time (v10.57) script at the end of the page', END, new),
        ('v10.56 painter stands down when v10.57 runs (its row was on the v10.48 basis)',
         " function paint(){\n  if (typeof W.sum1048 !== 'function') return;",
         " function paint(){\n  if (W.ontime1057) return;\n  if (typeof W.sum1048 !== 'function') return;"),
        ('v10.48 day-panel fold stands down when v10.57 runs (one figure per day; the detail is in More info)',
         "try { const p = d && panel1048(d.iso);",
         "try { const p = d && !W.ontime1057 && panel1048(d.iso);"),
    ]


PATCHES = build_patches()

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'ontime1057-script' in t: sys.exit('part3_ontime refuses a repeat')
    if 'daycards1056-script' not in t: sys.exit('part3_ontime needs the v10.56 page (daycards1056-script not found)')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part3_ontime applied: Coates on time on completed Build day cards (first booked window, live site times), reasons in More info; v10.56 painter and v10.48 fold stand down')
