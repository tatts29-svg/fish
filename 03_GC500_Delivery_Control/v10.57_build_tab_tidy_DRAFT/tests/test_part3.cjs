// Author: Andrew Fisher. v10.58 part 3 - COATES ON TIME on completed Build day cards. GET-only against the live record.
//   node test_part3.cjs path/to/page.html [evidence_dir]
// On time is delivered within the window given; the time done is the site record's (a site-note time, else the earlier of the
// Coates text and the site tick). No late reasons (Andrew, 17 Oct 2026: "Leave the reason why its late out"). Pins the figures,
// the row's place on the card, the More info lines (window given, time done, minutes late), one row per card after two redraws
// (no frame-late repaint), and a live change: an in-memory site time of 08:25 on P60 turns 15 Oct to 100%. Phone run takes
// screenshots of the 15 Oct and 21 Sep cards and their More info.
const {open} = require('../../toolchain/harness/open_page.js');
const path = require('path'); const fs = require('fs');
const page = process.argv[2]; const ev = process.argv[3] || path.join(__dirname, '..', 'evidence');
let pass = 0, fail = 0; const counts = {};
const ok = (tag, c, m) => { c ? pass++ : fail++; counts[tag] = counts[tag] || [0, 0]; counts[tag][c ? 0 : 1]++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + tag + ': ' + m); };
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop';
  const h = await open(Object.assign({pageFile: page, hash: '#timeline'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(5000);
   const r = await p.evaluate(async () => {
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const card = iso => document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"]');
    const row = iso => { const c = card(iso), x = c && c.querySelector('.ot1056'); return x ? x.innerText.replace(/\s+/g, ' ').trim() : null; };
    const M = iso => { const m = ontime1057.model(iso); return {n: m.n, inside: m.inside, pct: m.pct,
     late: m.late.map(x => ({r: x.u.r.join('/'), k: x.u.k, by: x.lateBy, src: x.src, site: x.site && x.site.src})), failed: m.failed.map(x => x.u.r.join('/')),
     aside: m.aside.map(x => x.u.r.join('/')), ontime: m.ontime.map(x => ({r: x.u.r.join('/'), src: x.src, site: x.site && x.site.src})), notext: m.notext.map(x => x.u.r.join('/') || x.u.k)}; };
    const days = {}; ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-25', '2026-09-28', '2026-09-30', '2026-10-01', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'].forEach(iso => { days[iso] = M(iso); });
    const rows = {}; Object.keys(days).forEach(iso => { rows[iso] = row(iso); });
    const past = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')];
    // the row's place: a sibling straight after DAY'S DELIVERIES, before the work block; never inside another row
    const placeOf = iso => { const c = card(iso), x = c && c.querySelector('.ot1057'); if (!x) return 'none'; const prev = x.previousElementSibling, next = x.nextElementSibling;
     return [prev && prev.classList.contains('bc984-load-row') && !prev.classList.contains('ot1057') && /DAY.S (DELIVERIES|LOADS)/.test(prev.innerText) ? 'after-deliveries' : 'prev:' + (prev && prev.className),
      next && /bc986-work|bc984-crew/.test(next.className) ? 'before-work' : 'next:' + (next && next.className), x.parentElement.closest('.bc984-load-row') ? 'NESTED' : 'top'].join(','); };
    const nested = document.querySelectorAll('.bc984-load-row .bc984-load-row').length;
    const aria15 = (card('2026-10-15') || {getAttribute: () => ''}).getAttribute('aria-label') || '';
    const why15 = ((card('2026-10-15') || document).querySelector('.ot1057-why') || {}).textContent || '';
    const why21 = ((card('2026-09-21') || document).querySelector('.ot1057-why') || {}).textContent || '';
    const whyClip = past.filter(c => { const w = c.querySelector('.ot1057-why'); return w && w.scrollWidth > w.clientWidth + 1; }).map(c => c.getAttribute('data-day'));
    const todayRow = !!document.querySelector('#pane-timeline .day.today .ot1056'), futureRow = document.querySelectorAll('#pane-timeline .day[data-day]:not(.past984) .ot1056').length;
    const withRow = past.filter(c => c.querySelector('.ot1056')).length;
    // refresh: two redraws, one row per card, present in the same task (no frame-late repaint), mutation count stable
    const mut = async () => { let n = 0, alone = 0; const pane = document.getElementById('pane-timeline'); const mo = new MutationObserver(rs => { n += rs.length; rs.forEach(x => x.addedNodes.forEach(a => { if (a.nodeType === 1 && a.classList.contains('ot1056')) alone++; })); }); mo.observe(pane, {childList: true, subtree: true});
     Idle1006.redraw(); const cards = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')];
     const sync = {cards: cards.length, one: cards.filter(c => c.querySelectorAll('.ot1056').length === 1).length, two: cards.filter(c => c.querySelectorAll('.ot1056').length > 1).length, with: cards.filter(c => c.querySelector('.ot1056')).length};
     await wait(800); const later = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')].filter(c => c.querySelector('.ot1056')).length; mo.disconnect(); return {n, alone, sync, later}; };
    const r1 = await mut(), r2 = await mut();
    // More info
    const more = async iso => { card(iso).click(); await wait(1000); const b = document.querySelector('#pane-timeline .bc984-more'); if (b) b.open = true; await wait(200); const s = b && b.querySelector('.ot1057-more');
     return {text: s ? s.innerText.replace(/[ \t]+/g, ' ') : (b ? 'NO-OT1057 ' + b.innerText.slice(0, 200) : 'NO-BOX'), dt: document.querySelectorAll('#pane-timeline .dt1048').length}; };
    const m15 = await more('2026-10-15'), m21 = await more('2026-09-21'), m14 = await more('2026-09-14'), m15s = await more('2026-09-15'), m16s = await more('2026-09-16'), m25 = await more('2026-09-25'), m08 = await more('2026-10-08'), m23 = await more('2026-09-23'), m07 = await more('2026-10-07'), m01 = await more('2026-10-01');
    // a live change: P60 on site 08:25 (in memory only) turns 15 Oct to 100%, with no reason line
    const orig = window.deliveryOf;
    window.deliveryOf = function(k){ const d = orig.apply(this, arguments); if (k !== 'P60' || !d) return d; return Object.assign({}, d, {note: '', history: (d.history || []).filter(x => x.state !== 'on site').concat([{state: 'on site', at: '2026-10-14T22:25:00Z', by: 'test'}])}); };
    Idle1006.redraw(); await wait(300);
    const over = {row: row('2026-10-15'), why: !!(card('2026-10-15') || document).querySelector('.ot1057-why'), aria: (card('2026-10-15') || {getAttribute: () => ''}).getAttribute('aria-label')};
    const mo = await more('2026-10-15');
    window.deliveryOf = orig; Idle1006.redraw(); await wait(300);
    const back = row('2026-10-15');
    const html = document.documentElement.innerHTML;
    const tmp = document.createElement('div'); tmp.innerHTML = ontime1057.moreHtml('2026-10-19'); const after19 = tmp.innerText.replace(/\s+/g, ' ').trim(); const card19 = ontime1057.cardRow('2026-10-19');
    const txt = iso => { const t = document.createElement('div'); t.innerHTML = ontime1057.moreHtml(iso); return t.textContent.replace(/\s+/g, ' ').trim(); };
    const m13t = txt('2026-10-13'), m12t = txt('2026-10-12'), m16t = txt('2026-09-16');
    const allDays = []; for (let t = Date.parse('2026-09-07T00:00:00Z'); t <= Date.parse('2026-10-16T00:00:00Z'); t += 86400000) allDays.push(new Date(t).toISOString().slice(0, 10));
    /* every day's More info, less the set-aside note (why a text is left out of the count is not a late reason) */
    const lessAside = iso => { const t = document.createElement('div'); t.innerHTML = ontime1057.moreHtml(iso); t.querySelectorAll('.ot1057-aside, .ot1057-aside + ul').forEach(x => x.remove()); return t.textContent.replace(/\s+/g, ' ').trim(); };
    const allText = allDays.map(iso => iso + ' ' + lessAside(iso)).join(' || ');
    // the Timeline's weather refresh rewrites the label from "Weather: " to the end (BuildCards984.refreshWeather); the figure must survive it
    const aria15now = (card('2026-10-15') || {getAttribute: () => ''}).getAttribute('aria-label') || '';
    const ariaWx = aria15now.replace(/Weather: [\s\S]*$/, 'Weather: Clear');
    return {days, rows, place15: placeOf('2026-10-15'), place21: placeOf('2026-09-21'), places: past.map(c => c.querySelector('.ot1057') ? placeOf(c.getAttribute('data-day')) : null).filter(Boolean),
     nested, aria15, why15, why21, whyClip, todayRow, futureRow, withRow, n: past.length, r1, r2, m15, m21, m14, m15s, m16s, m25, m08, m23, m07, m01, over, mo, back, after19, card19,
     m13t, m12t, m16t, ariaWx, allText,
     painter: /function paint\(\)\{\s*if \(W\.ontime1057\) return;/.test(html), script: !!document.getElementById('ontime1057-script'), v: window.ontime1057 && window.ontime1057.version,
     overflow: document.documentElement.scrollWidth > window.innerWidth + 1};
   });
   const d = r.days, late = (iso, ref) => (d[iso].late.find(x => x.r === ref) || {}).by;
   ok(tag, r.script && /^v10\.5[7-9]$/.test(r.v || ''), 'part 3 script present (' + r.v + ')');
   ok(tag, r.painter, 'v10.56 painter stands down when v10.57 runs (rep on its source)');
   ok(tag, r.withRow === 18 && r.n >= 35, 'completed Build cards carrying Coates on time: ' + r.withRow + ' of ' + r.n);
   ok(tag, !r.todayRow && r.futureRow === 0, 'no row on today\'s or upcoming cards');
   // study_5's figures
   ok(tag, d['2026-10-15'].n === 4 && d['2026-10-15'].inside === 3 && d['2026-10-15'].pct === 75 && /COATES ON TIME · 3 OF 4/.test(r.rows['2026-10-15'] || '') && /75 ?%/.test(r.rows['2026-10-15']), '15 Oct 75%, 3 OF 4: ' + r.rows['2026-10-15']);
   ok(tag, late('2026-10-15', 'P60') === 26 && d['2026-10-15'].late[0].src === 'site', '15 Oct P60 26 min late on the site record (08:56, Coates text 09:09)');
   ok(tag, d['2026-10-15'].ontime.some(x => x.r === 'WC51' && x.src === 'site'), '15 Oct WC51 inside 07:00-10:00 on its 08:34 site time');
   ok(tag, /^1 late · Ticket box 26 min$/.test(r.why15.trim()), '15 Oct card line "1 late · Ticket box 26 min": ' + r.why15);
   ok(tag, /Coates on time 75 percent: 3 of 4 delivered within the window given\. 1 late: Ticket box, 26 minutes\./.test(r.aria15), '15 Oct card button reads the figure out: ' + r.aria15.slice(-110));
   ok(tag, d['2026-09-21'].n === 8 && d['2026-09-21'].inside === 2 && /2 OF 8/.test(r.rows['2026-09-21'] || '') && /25 ?%/.test(r.rows['2026-09-21']), '21 Sep 25%, 2 OF 8 (P13 08:30, WC06 second unit): ' + r.rows['2026-09-21']);
   ok(tag, late('2026-09-21', 'P14') === 9 && late('2026-09-21', 'P15') === 159 && late('2026-09-21', 'WC02') === 39 && late('2026-09-21', 'WB02') === 59, '21 Sep per-unit windows: P14 9 min, P15 2 h 39 min, WC02 39 min, WB02 59 min');
   ok(tag, d['2026-09-14'].n === 13 && d['2026-09-14'].inside === 4 && /4 OF 13/.test(r.rows['2026-09-14'] || '') && /31 ?%/.test(r.rows['2026-09-14']), '14 Sep 31%, 4 OF 13: ' + r.rows['2026-09-14']);
   ok(tag, d['2026-09-14'].ontime.filter(x => x.r === 'WC16' && x.site === 'site note').length === 2, '14 Sep rests on WC16\'s note times (08:00 and 10:30 both inside)');
   ok(tag, d['2026-09-15'].n === 6 && d['2026-09-15'].inside === 3 && d['2026-09-15'].failed.join() === 'T0021' && /3 OF 6/.test(r.rows['2026-09-15'] || ''), '15 Sep 50%, 3 OF 6 with the failed T0021 counted: ' + r.rows['2026-09-15']);
   ok(tag, late('2026-09-15', 'T0022') === 240 && late('2026-09-15', 'T0025') === 270, '15 Sep T0022 4 h and T0025 4 h 30 min (site notes "turned up 14:30")');
   ok(tag, late('2026-09-16', 'P17') === 30 && late('2026-09-16', 'P21') === 60 && d['2026-09-16'].inside === 4, '16 Sep P17 30 min late and P21 1 h late on their site notes (the site record wins over the 06:59 text), 4 of 6');
   ok(tag, d['2026-09-25'].n === 4 && d['2026-09-25'].inside === 0 && d['2026-09-25'].aside.join() === 'WC50' && /0 OF 4/.test(r.rows['2026-09-25'] || ''), '25 Sep 0 OF 4 with WC50 set aside: ' + r.rows['2026-09-25']);
   ok(tag, d['2026-10-08'].n === 4 && d['2026-10-08'].inside === 1 && late('2026-10-08', 'WC31') === 310, '8 Oct 1 of 4 with WC31 counted (5 h 10 min)');
   ok(tag, d['2026-09-30'].n === 1 && d['2026-09-30'].pct === 100 && /1 OF 1/.test(r.rows['2026-09-30'] || ''), '30 Sep 100%, 1 OF 1: ' + r.rows['2026-09-30']);
   ok(tag, d['2026-10-07'].pct === 100 && d['2026-10-07'].n === 11 && /11 OF 11/.test(r.rows['2026-10-07'] || '') && /ALL WITHIN THE WINDOW GIVEN/.test(r.rows['2026-10-07']), '7 Oct 100%, 11 OF 11: ' + r.rows['2026-10-07']);
   ok(tag, d['2026-10-16'].pct === 100 && d['2026-10-16'].n === 11 && /11 OF 11/.test(r.rows['2026-10-16'] || ''), '16 Oct 100%, 11 OF 11: ' + r.rows['2026-10-16']);
   ok(tag, d['2026-09-23'].n === 0 && !r.rows['2026-09-23'] && d['2026-09-23'].notext.length === 4, '23 Sep: 4 bookings with no delivered text, listed and not counted (no card row)');
   // the row's place and fit
   ok(tag, r.place15 === 'after-deliveries,before-work,top' && r.places.every(x => x === 'after-deliveries,before-work,top'), 'row sits straight under DAY\'S DELIVERIES, before the work block, never inside a row: ' + r.place15 + (r.places.every(x => x === r.place15) ? '' : ' | ' + r.places.join(' ')));
   ok(tag, r.nested === 0, 'no row nested inside another row');
   ok(tag, r.whyClip.length === 0, 'the short late line fits on every card' + (r.whyClip.length ? ': ' + r.whyClip.join(' ') : ''));
   ok(tag, /^6 late · Toilets ×3, Buildings ×2/.test(r.why21.trim()), '21 Sep card line in category words: ' + r.why21);
   // refresh
   ok(tag, r.r1.sync.two === 0 && r.r2.sync.two === 0 && r.r1.sync.with === 18 && r.r2.sync.with === 18 && r.r2.later === 18, 'two redraws: exactly one row per card, there in the same draw (no repaint a frame later): ' + JSON.stringify(r.r2.sync));
   ok(tag, r.r1.alone === 0 && r.r2.alone === 0 && Math.abs(r.r1.n - r.r2.n) <= 2 && r.r1.n > 0, 'no row is ever painted in on its own after a redraw; mutation count steady (' + r.r1.n + ' then ' + r.r2.n + ')');
   ok(tag, /COATES ON TIME · 4 OF 4/.test(r.over.row || '') && /100 ?%/.test(r.over.row) && !r.over.why && /100 percent: 4 of 4/.test(r.over.aria || ''), 'in-memory P60 site time 08:25: 15 Oct turns 100%, 4 OF 4, no reason line: ' + r.over.row);
   ok(tag, !/min late/.test(r.mo.text) && /100%/.test(r.mo.text), 'and More info has no late line then');
   ok(tag, /3 OF 4/.test(r.back || ''), 'restored: back to 3 OF 4');
   // More info wording
   const t15 = r.m15.text;
   ok(tag, /Coates on time/.test(t15) && /75% · 3 of 4 delivered within the window given\. Build to date: \d+% \(\d+ of \d+\)\./.test(t15), '15 Oct More info headline: percentage on the window given, build to date');
   ok(tag, /Buildings · Ticket box · P60 · window 05:30–08:30 · done 08:56 · 26 min late/.test(t15), '15 Oct P60 line: category, item, ref, window given, time done, minutes late');
   ok(tag, !/Coates texted on its way|Texted together|Schedule words|Oversize|curfew|No cause recorded|Programme load|planning run|moved the window|Booked as \d|re-sent|DD \d{6,}|programme T\d|no carrier|Matched by/i.test(r.allText), 'no late reasons anywhere in More info, 7 Sep to 16 Oct (window given and time done only)' + ((/(Coates texted on its way|Texted together|Schedule words|Oversize|curfew|No cause recorded|Programme load|planning run|moved the window|Booked as \d|re-sent|DD \d{6,}|programme T\d|no carrier|Matched by)/i.exec(r.allText) || [])[0] ? ': ' + /(Coates texted on its way|Texted together|Schedule words|Oversize|curfew|No cause recorded|Programme load|planning run|moved the window|Booked as \d|re-sent|DD \d{6,}|programme T\d|no carrier|Matched by)/i.exec(r.allText)[0] : ''));
   ok(tag, /On time is delivered within the window given \(the window in Coates' booking text\); early counts as on time\. The time done is the site record's/.test(t15), 'More info says how it is counted: within the window given, early is on time, time done from the site record');
   ok(tag, /Coates texts loaded to 16 Oct 2026 17:47\s*$/.test(t15.trim()), 'More info ends "Coates texts loaded to 16 Oct 2026 17:47"');
   ok(tag, ![t15, r.m21.text, r.m14.text, r.m25.text, r.m08.text].some(t => /left Kingston|same truck|departed/i.test(t)), 'never "left Kingston", "same truck" or "departed"');
   ok(tag, r.m15.dt === 0 && r.m21.dt === 0, 'the v10.48 day-panel fold stands down (one figure per day)');
   const t21 = r.m21.text;
   ok(tag, /Buildings · Building 4\.8 m · P15 · window 09:00–12:00 · done 14:39 · 2 h 39 min late/.test(t21), '21 Sep P15 (its 15:34 tick is later than the text, so the text time stands)');
   ok(tag, /Toilets · FWF toilets · WC06 · window 09:00–12:00 · done 13:59 · 1 h 59 min late/.test(t21) && /P14 · window 07:00–10:00 · done 10:09 · 9 min late/.test(t21), '21 Sep WC06 1 h 59 min and P14 9 min');
   ok(tag, /Booked, no delivered text \(not counted\) Building 4\.8 m · P16 · window 12:00–15:00/.test(t21), '21 Sep P16\'s booking listed, not counted');
   ok(tag, /T0021 · window [\d:–]+ · not delivered \(Coates texted ‘could not be delivered’ 15:49\) · not on time/.test(r.m15s.text) && /T0022 · window [\d:–]+ · done 14:30 · 4 h late/.test(r.m15s.text), '15 Sep: failed T0021 not on time; T0022 done 14:30 on its site note, 4 h late');
   ok(tag, /P17 · window [\d:–]+ · done 14:30 · 30 min late/.test(r.m16s.text) && /P21 · window 10:30–13:30 · done 14:30 · 1 h late/.test(r.m16s.text), '16 Sep P17 30 min and P21 1 h on their site notes');
   ok(tag, /Set aside, not counted/.test(r.m25.text) && /WC50/.test(r.m25.text) && /register 9968955 line 22/.test(r.m25.text) && /programme T0247/.test(r.m25.text), '25 Sep WC50 set aside with every source named');
   ok(tag, /WC27 · window [\d:–]+ · done 13:14 · 3 h 14 min late/.test(r.m25.text) && /WC15 · window [\d:–]+ · done 13:13 · 1 h 13 min late/.test(r.m25.text), '25 Sep WC27 tank 3 h 14 min; WC15 first unit 1 h 13 min');
   ok(tag, /WC31 · window 07:00–10:00 · done 15:10 · 5 h 10 min late/.test(r.m08.text), '8 Oct WC31 5 h 10 min');
   ok(tag, /1 of 4 delivered within the window given/.test(r.m01.text), '1 Oct: 1 of 4');
   ok(tag, ![t15, r.m21.text, r.m14.text, r.m15s.text, r.m25.text, r.m08.text, r.m01.text].some(t => /Andrew/.test(t)), 'no attribution to a person in the shown text (the page\'s v5.97 rule)');
   ok(tag, /Booked, no delivered text \(not counted\)/.test(r.m23.text) && !/%/.test(r.m23.text.split('On time is delivered')[0]), '23 Sep More info lists the bookings with no delivered text, no figure');
   ok(tag, /100% · 11 of 11/.test(r.m07.text) && /On time .* · window \d\d:\d\d–\d\d:\d\d · done \d\d:\d\d/.test(r.m07.text) && !/min late/.test(r.m07.text), '7 Oct More info: 100%, on-time list with window given and time done, no late lines');
   ok(tag, /one of P01\/P03 · window 04:30–07:30 · done 08:00 · 30 min late/.test(r.m14.text), '14 Sep P01/P03: one of, done 08:00 on the site note, 30 min late');
   ok(tag, /^Coates on time\s*No Coates texts loaded after 16 Oct 2026 17:47\. Booked for this day before then: /.test(r.after19) && !r.card19, 'a day after the export (19 Oct, once past): no card row, More info says no texts loaded after 16 Oct 17:47 and lists what was booked');
   // review fixes
   ok(tag, /Coates on time 75 percent: 3 of 4/.test(r.ariaWx) && /Weather: Clear$/.test(r.ariaWx), 'the card label keeps the figure when the weather refresh rewrites "Weather: …": ' + r.ariaWx.slice(-140));
   const clash16 = (/Site note and Coates text disagree .*?(?=On time is delivered|$)/.exec(r.m16t) || [''])[0];
   ok(tag, /P21: site note on site 14:30, Coates text 06:59 \(window 10:30–13:30\); counted on the site note \(the site record\): 1 h late/.test(clash16) && /P20: site note on site 10:00, Coates text 08:14 \(window 09:00–12:00\); counted on the site note \(the site record\): within the window either way/.test(clash16), '16 Sep: P21\'s site note (on site 14:30) is shown against its 06:59 Coates text, not hidden: ' + clash16.slice(0, 260));
   ok(tag, /Container 6 m · T0266 · window 12:00–15:00 · done/.test(r.m13t), '13 Oct T0266: window given and time done');
   ok(tag, /Fork extension · T0109 · window [\d:–]+ · done/.test(r.m12t), '12 Oct fork extension: window given and time done');
   ok(tag, !r.overflow, 'no sideways scroll');
   ok(tag, h.errors.length === 0, 'no page errors ' + h.errors.slice(0, 3).join(' | '));
   if (mob) {
    fs.mkdirSync(ev, {recursive: true});
    // the sticky header, tab bar and footer bar are faded out only while an element is photographed whole (on a tall window so the
    // whole card or section fits); the "view" shot keeps them, at the phone's own size
    const overlays = on => p.evaluate(on => { if (on) { window.__ov = [...document.querySelectorAll('body *')].filter(x => { const s = getComputedStyle(x); return (s.position === 'fixed' || s.position === 'sticky') && x.getBoundingClientRect().height > 0 && !x.closest('#pane-timeline'); });
     window.__ov.forEach(x => { x.dataset.ov1057 = x.style.opacity; x.style.opacity = '0'; }); } else (window.__ov || []).forEach(x => { x.style.opacity = x.dataset.ov1057 || ''; }); }, on);
    const shot = async (iso, name) => {
     await p.evaluate(iso => { const c = document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"]'); c.click(); }, iso); await p.waitForTimeout(1200);
     await p.evaluate(iso => { const r = document.querySelector('#pane-timeline .day.past984[data-day="' + iso + '"] .ot1057'); if (r) { r.scrollIntoView({block: 'center'}); } }, iso); await p.waitForTimeout(400);
     await p.screenshot({path: path.join(ev, 'p3_view_' + name + '_phone.png')});
     await p.setViewportSize({width: 390, height: 3000}); await p.waitForTimeout(600); await overlays(true);
     const c = p.locator('#pane-timeline .day.past984[data-day="' + iso + '"]').first(); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
     await c.screenshot({path: path.join(ev, 'p3_card_' + name + '_phone.png')});
     await p.evaluate(() => { const b = document.querySelector('#pane-timeline .bc984-more'); if (b) b.open = true; }); await p.waitForTimeout(300);
     const s = p.locator('#pane-timeline .bc984-more .ot1057-more').first(); await s.evaluate(x => x.scrollIntoView({block: 'center'})); await p.waitForTimeout(300);
     await s.screenshot({path: path.join(ev, 'p3_moreinfo_' + name + '_phone.png')});
     await overlays(false); await p.setViewportSize({width: 390, height: 844}); await p.waitForTimeout(400);
    };
    await shot('2026-10-15', '10-15'); await shot('2026-09-21', '09-21');
    console.log('screenshots in ' + ev);
   }
  } finally { await h.browser.close(); }
 }
 console.log(Object.entries(counts).map(([k, v]) => k + ' ' + v[0] + '/' + (v[0] + v[1])).join(' · '));
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
