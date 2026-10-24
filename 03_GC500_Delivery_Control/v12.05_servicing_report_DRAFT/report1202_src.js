/* Author: Andrew Fisher. v12.05 (claimed as v12.02) - the servicing night report: a two-page Coates report for one service night, to print or
   save as a PDF.
   Andrew, 25 Oct 2026: "Can we also work on a new coates report for the servicing to be printed off of nights completion.
   Make this look elite and proffesional. Anything over 90% is exceptionally good. We should rate the night out of 5 stars.
   So be good to work out where this sits. And we have 5 stars that fill up like a gauge. This report will be sent to the
   buisness as well as event portables. So really make this stand out. And we talk about team effort."
   Every figure is the Servicing tab's own: its last verified tracker read, its clock, its night (08:00 to 08:00) and the one
   state rule (SvcState: jobs weighed by their units, rounded down). Nothing here reads anything the panel has not read,
   writes anything, or touches a QR code, crew card or tracker link. No money and no hidden tabs: it goes to Event Portables. */
(function (root) {
'use strict';
const VERSION = 'v12.05', EVENT_LOAD = 'servicing-tracker:GC500-2026', VIEW = 'Coates-GC500-2026';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ---- the rating. Andrew: "Anything over 90% is exceptionally good. We should rate the night out of 5 stars."
   One star for every 10 points above 40%: 50% one, 60% two, 70% three, 80% four, 90% or better all five; the last star
   fills part way, like a gauge, so the stars show exactly where the night sits. */
function stars(pct) { const p = Number(pct); return Number.isFinite(p) ? Math.max(0, Math.min(5, Math.round((p - 40) * 10) / 100)) : 0; }
function band(pct) {
  const p = Number(pct) || 0;
  return p >= 90 ? {word: 'Exceptional', key: 'x'} : p >= 80 ? {word: 'Very good', key: 'a'} : p >= 70 ? {word: 'Good', key: 'b'}
    : p >= 60 ? {word: 'Fair', key: 'c'} : p >= 50 ? {word: 'Below standard', key: 'd'} : {word: 'Well below standard', key: 'e'};
}

function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function dt(id) { const d = new Date(id + 'T12:00:00Z'); return {wd: DAYS[d.getUTCDay()], d: d.getUTCDate(), m: MONTHS[d.getUTCMonth()], y: d.getUTCFullYear()}; }
function longDay(id) { const x = dt(id); return x.wd + ' ' + x.d + ' ' + x.m + ' ' + x.y; }
function shortDay(id) { const x = dt(id); return x.wd.slice(0, 3) + ' ' + x.d + ' ' + x.m.slice(0, 3); }
function nextId(id) { return new Date(Date.parse(id + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10); }
function span(a, b) { const m = Math.max(0, Math.round((b - a) / 60000)); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; }
function n(x) { return Number(x || 0).toLocaleString('en-AU'); }

/* ---- the night, from the panel's own read and the one state rule */
function model(I) {
  const S = I.S, D = I.D, C = I.C, cfg = {plans: D.plans, days: D.days, extras: D.extras};
  const dayObj = S.dayOf(cfg, I.day) || D.days[0], day = dayObj.id;
  const st = S.jobStates(I.events || [], I.now);
  const all = [].concat(...D.areas.map(a => a.refs));
  const g = S.groupStats(cfg, all, day, st), ts = S.taskStats(cfg, all, day, st);
  const saved = r => { const s = S.refStats(cfg, r, day, st); return s.done && !s.pending; };
  const tasks = Object.keys(D.tasks).filter(t => ts[t]).map(t => ({id: t, name: D.tasks[t], d: ts[t].d, w: ts[t].w, pct: ts[t].pct}));
  const areas = D.areas.map(a => { const x = S.groupStats(cfg, a.refs, day, st), done = a.refs.length > 0 && a.refs.every(saved);
    return {n: a.n || '', name: a.name, pct: x.pct, d: x.d, w: x.w, units: x.units, unitsDone: x.unitsDone, refs: x.refs, refsDone: x.refsDone, finished: done ? x.finished : 0}; }).filter(a => a.w > 0);
  let first = 0, last = 0;
  const crewList = C ? C.choices(I.crewData || {}) : [], crews = new Map(crewList.map(c => [c.id, {id: c.id, label: c.label, total: 0, by: {}, areas: new Set(), first: 0, last: 0}]));
  const none = {total: 0, by: {}};
  D.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => S.countedFor(cfg, l, day).forEach(t => {
    const s = st[S.jobKey(l.id, t, day)]; if (!s) return;
    if (!first || s.at < first) first = s.at; if (s.at > last) last = s.at;
    const ids = (s.crews || []).filter(id => crews.has(id));
    if (!ids.length) { none.total += l.qty; none.by[t] = (none.by[t] || 0) + l.qty; return; }
    ids.forEach(id => { const c = crews.get(id); c.total += l.qty; c.by[t] = (c.by[t] || 0) + l.qty; c.areas.add(a.name); if (!c.first || s.at < c.first) c.first = s.at; if (s.at > c.last) c.last = s.at; });
  }))));
  const left = [];
  D.areas.forEach(a => a.refs.forEach(r => { const s = S.refStats(cfg, r, day, st); if (s.w > 0 && !(s.done && !s.pending)) {
    const miss = {}; r.lines.forEach(l => S.countedFor(cfg, l, day).forEach(t => { if (!st[S.jobKey(l.id, t, day)]) miss[t] = (miss[t] || 0) + l.qty; }));
    left.push({n: a.n || '', area: a.name, ref: r.ref, units: s.units, missing: Object.keys(miss).map(t => ({task: D.tasks[t] || t, id: t, units: miss[t]}))}); } }));
  const nights = D.days.filter(d => !d.practice), idx = nights.findIndex(d => d.id === day), cur = S.svcDay(I.now);
  const allSaved = all.length > 0 && all.every(saved);
  return {version: VERSION, test: !I.meta || I.meta.load !== EVENT_LOAD, withdrawn: !!(I.meta && (I.meta.card_withdrawn || I.meta.expired)),
    day: {id: day, label: dayObj.label, plan: dayObj.plan, practice: !!dayObj.practice, final: dayObj.plan === 'final', of: idx >= 0 ? [idx + 1, nights.length] : null},
    state: day < cur ? 'ended' : day === cur ? 'now' : 'future', asAt: I.now, read: I.read || I.now,
    pct: g.pct, stars: stars(g.pct), band: band(g.pct), jobs: {d: g.d, w: g.w}, units: {done: g.unitsDone, all: g.units}, refs: {done: g.refsDone, all: g.refs},
    areasDone: areas.filter(a => a.finished).length, areasAll: areas.length, first, last, finished: allSaved ? g.finished : 0,
    tasks, areas, crews: [...crews.values()].map(c => Object.assign(c, {areas: c.areas.size})), none, left, hm: S.hm};
}

/* ---- the look */
const ICON = {
  pump: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h11v9H4z"/><path d="M15 12h3l2 3v3h-5"/><circle cx="7.5" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/><path d="M8 3v4m0 0l-2-2m2 2l2-2"/></svg>',
  clean: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/><path d="M18.5 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9zM6 15.5l.7 1.6 1.6.7-1.6.7L6 20.1l-.7-1.6-1.6-.7 1.6-.7z"/></svg>',
  refill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.2 4.2 5.5 7.4 5.5 10.4a5.5 5.5 0 0 1-11 0C6.5 10.4 8.8 7.2 12 3z"/><path d="M9.5 14.2a2.6 2.6 0 0 0 2.5 2.6"/></svg>',
  lockup: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><path d="M12 14.5v2.5"/></svg>'
};
const JOBC = {pump: '#e8a800', clean: '#16a463', refill: '#1f86f0', lockup: '#8a5cf0'};
const STAR = 'M50 3.5l13.1 31.1 33.7 2.9-25.6 22.1 7.7 32.9L50 75 21.1 92.5l7.7-32.9L3.2 37.5l33.7-2.9z';

function starsSvg(v, big, id) {
  const fill = v >= 5 ? 520 : Math.floor(v) * 105 + (v - Math.floor(v)) * 100;
  let empty = '', full = '';
  for (let i = 0; i < 5; i++) { empty += '<path d="' + STAR + '" transform="translate(' + i * 105 + ' 0)"/>'; full += '<path d="' + STAR + '" transform="translate(' + i * 105 + ' 0)"/>'; }
  return '<svg class="stars' + (big ? ' big' : '') + '" viewBox="0 0 520 100" role="img" aria-label="' + v.toFixed(1) + ' out of 5 stars">' +
    '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#ffcb2e"/><stop offset="1" stop-color="#f09400"/></linearGradient>' +
    '<clipPath id="c' + id + '"><rect class="gauge" x="0" y="0" width="' + fill.toFixed(1) + '" height="100"/></clipPath></defs>' +
    '<g class="empty">' + empty + '</g><g clip-path="url(#c' + id + ')" fill="url(#g' + id + ')" class="full">' + full + '</g></svg>';
}
function ring(pct, color, size) {
  const r = 26, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return '<svg class="ring" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" class="track"/>' +
    '<circle cx="32" cy="32" r="' + r + '" class="arc" stroke="' + color + '" stroke-dasharray="' + (c * p / 100).toFixed(2) + ' ' + c.toFixed(2) + '" transform="rotate(-90 32 32)"/></svg>';
}
function flag() {
  let sq = ''; for (let y = 0; y < 6; y++) for (let x = 0; x < 9; x++) if ((x + y) % 2 === 0) sq += '<rect x="' + x * 4 + '" y="' + y * 4 + '" width="4" height="4"/>';
  return '<svg class="flag" viewBox="0 0 36 24" aria-hidden="true">' + sq + '</svg>';
}
function crewName(label) {
  const m = String(label || '').split(/\s+[—–-]\s+/);
  return m.length > 1 ? {role: m[0], who: m.slice(1).join(' – ')} : {role: '', who: String(label || '')};
}

function css(fontCss) {
  return fontCss + `
:root{--ink:#0c1821;--ink2:#14242f;--or:#f26a1b;--or2:#ff9b4d;--gold:#ffc21a;--text:#132029;--mute:#5d6c77;--line:#e2e8ec;--tint:#f4f7f9;--ok:#16a463}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;background:#dfe5ea;color:var(--text);font:400 9.6pt/1.42 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
@page{size:A4;margin:0}
.bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 12px;background:#0c1821;color:#fff;font-size:13px}
.bar button{font:700 14px Inter,system-ui,sans-serif;border:0;border-radius:999px;padding:10px 18px;background:linear-gradient(180deg,#ff9b4d,#f26a1b);color:#fff;cursor:pointer;box-shadow:0 2px 10px #f26a1b55}
.bar button.ghost{background:#ffffff1a;box-shadow:none}
.bar small{opacity:.75}
.sheet{width:210mm;height:297mm;margin:14px auto;background:#fff;position:relative;overflow:hidden;box-shadow:0 10px 40px #0b16202e;page-break-after:always;break-after:page}
.sheet:last-of-type{page-break-after:auto;break-after:auto}
@media print{html,body{background:#fff}.bar{display:none}.sheet{margin:0;box-shadow:none;zoom:1!important}.gauge{animation:none!important}}
.hero{position:relative;height:111mm;padding:11mm 13mm 0;color:#fff;background:radial-gradient(120% 90% at 85% 0%,#20384a 0%,#0f1e29 46%,#0a141c 100%);overflow:hidden}
.hero:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2.2mm;background:linear-gradient(90deg,#f26a1b,#ff9b4d 55%,#ffc21a)}
.hero .chq{position:absolute;right:-6mm;top:-4mm;width:92mm;height:62mm;opacity:.07;background-image:conic-gradient(#fff 25%,transparent 0 50%,#fff 0 75%,transparent 0);background-size:9mm 9mm;transform:skewX(-14deg);-webkit-mask-image:linear-gradient(225deg,#000 20%,transparent 75%);mask-image:linear-gradient(225deg,#000 20%,transparent 75%)}
.brand{display:flex;align-items:center;justify-content:space-between;position:relative}
.co{display:flex;align-items:baseline;gap:3.2mm}
.co b{font:800 19pt/1 Inter,sans-serif;letter-spacing:.2em}
.co span{font:600 7.4pt/1 Inter,sans-serif;letter-spacing:.32em;color:#ffffffb3;text-transform:uppercase;border-left:1px solid #ffffff40;padding-left:3.2mm}
.ev{display:flex;align-items:center;gap:2.4mm;font:italic 700 15pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.04em}
.ev em{font-style:normal;color:var(--or2)}
.flag{width:9mm;height:6mm;fill:#fff;opacity:.9}
.kick{margin:9mm 0 0;font:700 7.6pt/1 Inter,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:var(--or2)}
h1{margin:2mm 0 0;font:italic 700 34pt/.95 "Barlow Condensed",Inter,sans-serif;letter-spacing:.01em;text-transform:uppercase}
.night{margin:2.4mm 0 0;font:600 11pt/1.3 Inter,sans-serif;color:#e8eef2}
.night small{display:block;margin-top:1mm;font:500 8.2pt/1.3 Inter,sans-serif;color:#ffffff9c;letter-spacing:.02em}
.score{position:absolute;left:13mm;right:13mm;bottom:9mm;display:grid;grid-template-columns:auto 1fr;gap:9mm;align-items:end}
.pct{display:flex;align-items:flex-start;line-height:.78}
.pct b{font:italic 700 92pt/.78 "Barlow Condensed",Inter,sans-serif;letter-spacing:-.01em;background:linear-gradient(180deg,#fff 30%,#cfe0ea);-webkit-background-clip:text;background-clip:text;color:transparent}
.pct i{font:italic 700 34pt/1 "Barlow Condensed",Inter,sans-serif;font-style:italic;margin:2mm 0 0 1mm;color:#ffffffd9}
.pct small{display:block}
.pctl{margin-top:2.4mm;font:700 7.4pt/1 Inter,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#ffffffa8}
.rate{padding-bottom:1mm}
.stars{display:block;width:100%;max-width:92mm;height:auto;overflow:visible}
.stars .empty{fill:#ffffff14;stroke:#ffffff59;stroke-width:2.2}
.stars .full{filter:drop-shadow(0 0 3px #ffb30066)}
.gauge{transform-box:fill-box;transform-origin:0 0;animation:grow 1.8s cubic-bezier(.16,.84,.24,1) .25s both}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.word{display:flex;align-items:baseline;gap:3mm;margin-top:3mm}
.word b{font:italic 700 25pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
.word span{font:600 9pt/1 Inter,sans-serif;color:#ffffffcc}
.scale{position:relative;margin-top:3.4mm;max-width:92mm;height:11mm}
.scale .tr{position:absolute;left:0;right:0;top:2.4mm;height:1.6mm;border-radius:1mm;background:#ffffff1f;overflow:hidden}
.scale .tr i{position:absolute;left:0;top:0;bottom:0;border-radius:1mm;background:linear-gradient(90deg,#f09400,#ffcb2e)}
.scale .tk{position:absolute;top:7.6mm;transform:translateX(-50%);font:600 6pt/1 Inter,sans-serif;color:#ffffff8c;white-space:nowrap}
.scale .pt{position:absolute;top:0;width:1.2mm;height:6.4mm;transform:translateX(-50%);border-radius:.6mm;background:#fff;box-shadow:0 0 0 .5mm #0c1821,0 0 5px #fff}
.body{padding:7mm 13mm 0}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:3.2mm}
.kpi{position:relative;padding:3.6mm 3.6mm 3.2mm;border-radius:2.4mm;background:var(--tint);border:1px solid var(--line);overflow:hidden}
.kpi:before{content:'';position:absolute;left:0;top:0;right:0;height:1mm;background:linear-gradient(90deg,var(--or),var(--or2))}
.kpi b{display:block;font:italic 700 20pt/1 "Barlow Condensed",Inter,sans-serif;color:var(--ink)}
.kpi b small{font:inherit;font-size:13pt;color:var(--mute)}
.kpi span{display:block;margin-top:1.4mm;font:600 7.8pt/1.25 Inter,sans-serif;color:var(--mute)}
h2{display:flex;align-items:center;gap:2.4mm;margin:7mm 0 3mm;font:800 8pt/1 Inter,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--ink)}
h2:after{content:'';flex:1;height:1px;background:var(--line)}
h2 i{width:2.2mm;height:2.2mm;border-radius:50%;background:var(--or)}
.jobs{display:grid;grid-template-columns:repeat(var(--n,3),1fr);gap:3.2mm}
.job{display:flex;align-items:center;gap:3.4mm;padding:3.4mm;border:1px solid var(--line);border-radius:2.4mm;background:#fff}
.job .rw{position:relative;flex:none;width:19mm;height:19mm}
.job .rw svg.ring{width:19mm;height:19mm}
.ring .track{fill:none;stroke:#e9eef1;stroke-width:6.5}
.ring .arc{fill:none;stroke-width:6.5;stroke-linecap:round}
.job .ic{position:absolute;inset:0;display:grid;place-items:center}
.job .ic svg{width:7.6mm;height:7.6mm;fill:none;stroke:var(--c);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.job b{display:block;font:italic 700 21pt/1 "Barlow Condensed",Inter,sans-serif;color:var(--ink)}
.job span{display:block;font:700 8.4pt/1.2 Inter,sans-serif;color:var(--text)}
.job small{display:block;margin-top:.6mm;font:500 7.6pt/1.2 Inter,sans-serif;color:var(--mute)}
.team{position:relative;margin-top:0;padding:5mm 5.4mm 5mm;border-radius:3mm;background:linear-gradient(135deg,#0f1e29,#17303f);color:#fff;overflow:hidden}
.team:before{content:'';position:absolute;right:-12mm;top:-12mm;width:60mm;height:60mm;border-radius:50%;background:radial-gradient(circle,#f26a1b38,transparent 70%)}
.team .lead{position:relative;margin:0;font:italic 700 17pt/1.1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.01em}
.team .sum{position:relative;margin:1.6mm 0 0;font:500 8.8pt/1.45 Inter,sans-serif;color:#dbe5ec;max-width:160mm}
.team .sum b{color:#fff}
.crews{position:relative;display:grid;grid-template-columns:repeat(var(--k,5),1fr);gap:2.6mm;margin-top:4mm}
.crew{padding:3mm;border-radius:2.2mm;background:#ffffff0f;border:1px solid #ffffff1f}
.crew .rl{font:700 6.4pt/1.2 Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--or2)}
.crew .wh{margin-top:.8mm;font:700 9pt/1.2 Inter,sans-serif;color:#fff;min-height:2.4em}
.crew .tt{margin-top:1.6mm;font:italic 700 19pt/1 "Barlow Condensed",Inter,sans-serif}
.crew .tt small{font:600 6.6pt/1 Inter,sans-serif;letter-spacing:.06em;color:#ffffffa6;margin-left:1mm;text-transform:uppercase}
.crew .sp{display:flex;height:1.6mm;margin-top:1.8mm;border-radius:1mm;overflow:hidden;background:#ffffff14}
.crew .sp i{display:block;height:100%}
.crew .mt{margin-top:1.6mm;font:500 7pt/1.3 Inter,sans-serif;color:#ffffffa6}
.thanks{position:relative;margin:4mm 0 0;font:600 8.8pt/1.4 Inter,sans-serif;color:#fff}
.thanks span{display:block;margin-top:.6mm;font:500 7.6pt/1.3 Inter,sans-serif;color:#ffffff99}
.none{position:relative;margin-top:3mm;font:500 8.4pt/1.4 Inter,sans-serif;color:#ffffffb8}
.foot{position:absolute;left:13mm;right:13mm;bottom:7mm;display:flex;justify-content:space-between;gap:6mm;padding-top:2.6mm;border-top:1px solid var(--line);font:500 6.8pt/1.4 Inter,sans-serif;color:var(--mute)}
.foot b{color:var(--text)}
.p2 .hero{height:34mm;padding-top:9mm}
.p2 h1{font-size:22pt;margin-top:1.4mm}
.p2 .kick{margin-top:5mm}
.at{width:100%;border-collapse:collapse;font:500 8pt/1.2 Inter,sans-serif}
.at th{padding:0 1.6mm 1.6mm;text-align:left;font:700 6.4pt/1 Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);border-bottom:1px solid var(--line)}
.at td{padding:.85mm 1.6mm;border-bottom:1px solid var(--line);vertical-align:middle}
.at tr:nth-child(even) td{background:#fafbfc}
.at .no{display:inline-grid;place-items:center;width:5.6mm;height:5.6mm;border-radius:50%;background:var(--tint);border:1px solid var(--line);font:700 7pt/1 Inter,sans-serif;color:var(--ink)}
.at .nm{font:600 8.2pt/1.2 Inter,sans-serif;color:var(--text)}
.at .nu{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--mute)}
.at .pr{width:44mm;white-space:nowrap}
.at .bb{display:inline-block;vertical-align:middle;width:30mm;height:1.9mm;border-radius:1mm;background:#e9eef1;overflow:hidden;position:relative}
.at .bb i{position:absolute;left:0;top:0;bottom:0;border-radius:1mm;background:linear-gradient(90deg,#f26a1b,#ffb04d)}
.at tr.full .bb i{background:linear-gradient(90deg,#0f9b5a,#2fd387)}
.at .pr b{display:inline-block;width:11mm;text-align:right;font:italic 700 11.5pt/1 "Barlow Condensed",Inter,sans-serif;color:var(--ink);vertical-align:middle}
.at .fi{text-align:right;white-space:nowrap;font:700 7.6pt/1 Inter,sans-serif;color:var(--ok)}
.at th.fi{color:var(--mute);font:700 6.4pt/1 Inter,sans-serif}
.at .tg{color:var(--mute);font-weight:600}
.lg{display:flex;flex-wrap:nowrap;align-items:center;gap:1.2mm 4mm;padding:1.25mm 0;border-bottom:1px solid var(--line);break-inside:avoid}
.lga{display:grid;grid-template-columns:5.2mm 1fr;align-items:center;gap:2mm;flex:0 0 74mm}
.lga .no{display:inline-grid;place-items:center;width:5.2mm;height:5.2mm;border-radius:50%;background:#fff3ea;border:1px solid #ffd2b3;font:700 6.6pt/1 Inter,sans-serif;color:#9a4b14}
.lgn b{font:700 8.2pt/1.25 Inter,sans-serif;color:var(--ink)}
.lgn em{font:600 7pt/1 Inter,sans-serif;font-style:normal;color:var(--mute);white-space:nowrap}
.lgr{display:flex;flex-wrap:wrap;gap:1.4mm 3.6mm;flex:1 1 0;justify-content:flex-start}
.lr{display:inline-flex;align-items:center;gap:1mm;white-space:nowrap}
.lr b{font:700 7.8pt/1 Inter,sans-serif;color:var(--ink);margin-right:.6mm}
.lr i{font:700 6.2pt/1 Inter,sans-serif;font-style:normal;padding:.8mm 1.5mm;border-radius:99px;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);border:1px solid color-mix(in srgb,var(--c) 35%,#fff)}
.clear{padding:3.4mm 4mm;border-radius:2.4mm;background:#eefaf3;border:1px solid #bfe9d0;font:700 9pt/1.3 Inter,sans-serif;color:#0d6b3d}
.how p{margin:0 0 2.4mm;font:500 7.3pt/1.45 Inter,sans-serif;color:var(--text)}
.sc{display:grid;grid-template-columns:repeat(5,1fr);gap:2mm}
.sc div{display:grid;justify-items:center;gap:1mm;padding:1.6mm 1mm;border-radius:1.8mm;background:var(--tint);text-align:center}
.sc div.on{background:#fff5d6;box-shadow:inset 0 0 0 1px #ffcb2e}
.sc .stars{max-width:20mm}
.sc .stars .empty{fill:#0c18210f;stroke:#0c182140}
.sc span{font:700 7.4pt/1 Inter,sans-serif;color:var(--ink)}
.sc em{font:600 6.6pt/1 Inter,sans-serif;font-style:normal;color:var(--mute)}
.p2 .body h2{margin:5.2mm 0 2.4mm}
.p2 .body .blk:first-child h2{margin-top:4.6mm}
.test{position:absolute;right:-24mm;top:15mm;transform:rotate(35deg);background:#c62828;color:#fff;font:800 9pt/1 Inter,sans-serif;letter-spacing:.2em;padding:2.2mm 30mm}
`;
}

/* v12.05 - whole blocks move to a fresh A4 page when they do not fit above the footer, so nothing is ever cut off; then
   every page is numbered; on a phone the sheets are scaled to the screen (print is always true A4) */
const PAGER = "(function(){function go(){var s=document.querySelector('.sheet.flow'),guard=0;while(s&&guard++<20){var b=s.querySelector('.body'),f=s.querySelector('.foot');" +
  "var over=function(){var l=b.lastElementChild;return !!l&&l.getBoundingClientRect().bottom>f.getBoundingClientRect().top-8;};if(!over()){var x=s.nextElementSibling;s=x&&x.classList.contains('flow')?x:null;continue;}" +
  "var nx=s.nextElementSibling;if(!nx||!nx.classList.contains('flow')){nx=s.cloneNode(true);nx.querySelector('.body').innerHTML='';var h=nx.querySelector('h1');if(h&&h.getAttribute('data-more'))h.textContent=h.getAttribute('data-more');s.parentNode.insertBefore(nx,s.nextSibling);}" +
  "var nb=nx.querySelector('.body'),moved=0;while(over()&&b.children.length>1){nb.insertBefore(b.lastElementChild,nb.firstChild);moved++;}" +
  "while(b.children.length>1&&b.lastElementChild.classList.contains('hd')){nb.insertBefore(b.lastElementChild,nb.firstChild);moved++;}if(!moved)break;s=nx;}" +
  "var all=document.querySelectorAll('.sheet'),N=all.length;for(var i=0;i<N;i++){var p=all[i].querySelector('.pg');if(p)p.textContent=(i+1)+' of '+N;}" +
  "document.documentElement.setAttribute('data-pages',N);fit();}" +
  "function fit(){var w=window.innerWidth,z=w<830?Math.max(.3,(w-12)/794):1;var all=document.querySelectorAll('.sheet');for(var i=0;i<all.length;i++)all[i].style.zoom=z===1?'':String(z);}" +
  "var wait=window.__fonts1202||(document.fonts&&document.fonts.ready)||Promise.resolve();" +
  "window.__pg1202=Promise.race([wait,new Promise(function(r){setTimeout(r,4000);})]).then(function(){return new Promise(function(r){requestAnimationFrame(function(){go();r();});});});" +
  "window.addEventListener('resize',fit);})();";

function html(R, opts) {
  opts = opts || {};
  const H = R.hm, id = R.day.id, to = nextId(id), when = longDay(id), whenTo = longDay(to);
  const nightOf = R.day.practice ? 'Practice night' : R.day.of ? 'Night ' + R.day.of[0] + ' of ' + R.day.of[1] + (R.day.final ? ' · final night, lock-up' : '') : 'Service night';
  const stateLine = R.state === 'now' ? 'As at ' + H(R.asAt) + ' AEST · the night closes 08:00 ' + shortDay(to) : R.state === 'future' ? 'Not started' :
    R.finished ? 'All finished ' + H(R.finished) + ' · night complete' : 'Night closed 08:00 ' + shortDay(to);
  const tile = (big, small, label) => '<div class="kpi"><b>' + big + (small ? ' <small>' + small + '</small>' : '') + '</b><span>' + esc(label) + '</span></div>';
  const kpis = tile(n(R.units.done), '/ ' + n(R.units.all), 'units fully serviced') + tile(n(R.refs.done), '/ ' + n(R.refs.all), 'locations complete') +
    tile(n(R.areasDone), '/ ' + n(R.areasAll), 'areas finished') +
    tile(R.first ? esc(H(R.first)) + '–' + esc(H(R.last)) : '—', '', R.first ? 'first to last · ' + span(R.first, R.last) : 'no completions recorded');
  const jobs = R.tasks.map(t => { const c = JOBC[t.id] || '#5d6c77';
    return '<div class="job" style="--c:' + c + '"><div class="rw">' + ring(t.pct, c, 72) + '<span class="ic">' + (ICON[t.id] || ICON.clean) + '</span></div><div><b>' + t.pct + '%</b><span>' + esc(t.name) + '</span><small>' + n(t.d) + ' of ' + n(t.w) + ' units</small></div></div>'; }).join('');
  const lead = R.pct >= 90 ? 'An exceptional night’s work, done together.' : R.pct >= 80 ? 'A very good night’s work, done together.' : R.pct >= 70 ? 'A good night’s work, done together.' : 'Tonight’s work, done together.';
  const active = R.crews.filter(c => c.total > 0), crewCount = active.length;
  const sum = (crewCount ? '<b>' + (crewCount === 1 ? 'One crew' : ['', '', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][crewCount] || crewCount) + (crewCount === 1 ? '' : ' crews') + '</b> serviced ' : 'The crews serviced ') +
    '<b>' + n(R.units.done) + ' of ' + n(R.units.all) + ' units</b> in full across <b>' + n(R.areasAll) + ' areas</b>' + (R.first ? ', from the first completion at <b>' + esc(H(R.first)) + '</b> to the last at <b>' + esc(H(R.last)) + '</b>' : '') +
    ' · ' + n(R.jobs.d) + ' of ' + n(R.jobs.w) + ' services done.';
  const crewHtml = active.map(c => { const nm = crewName(c.label), tot = Object.values(c.by).reduce((a, b) => a + b, 0) || 1;
    return '<div class="crew"><div class="rl">' + esc(nm.role || 'Crew') + '</div><div class="wh crew-name">' + esc(nm.who) + '</div><div class="tt">' + n(c.total) + '<small>services</small></div>' +
      '<div class="sp">' + R.tasks.filter(t => c.by[t.id]).map(t => '<i style="width:' + (100 * c.by[t.id] / tot).toFixed(1) + '%;background:' + (JOBC[t.id] || '#888') + '" title="' + esc(t.name) + '"></i>').join('') + '</div>' +
      '<div class="mt">' + n(c.areas) + (c.areas === 1 ? ' area' : ' areas') + ' · ' + esc(H(c.first)) + '–' + esc(H(c.last)) + '</div></div>'; }).join('');
  const noneNote = R.none.total ? '<p class="none">' + (crewCount ? n(R.none.total) + ' services were completed without a crew group recorded.' : 'Crew groups were not recorded on this night’s completions, so the night is shown as one team.') + '</p>' : '';
  const team = '<div class="team"><p class="lead">' + esc(lead) + '</p><p class="sum">' + sum + '</p>' + (crewCount ? '<div class="crews" style="--k:' + Math.min(crewCount, 5) + '">' + crewHtml + '</div>' : '') + noneNote +
    '<p class="thanks">' + esc(R.pct >= 90 ? 'Outstanding work, team. Thank you to every crew member for a big night.' : R.pct >= 80 ? 'Great work, team. Thank you to every crew member for the effort on the night.' : 'Thank you to every crew member for the effort on the night.') + '<span>' + esc((opts.author ? opts.author + ' · ' : '') + 'Shutdown Manager · Coates') + '</span></p></div>';
  const areaRow = a => '<tr' + (a.finished ? ' class="full"' : '') + '><td><span class="no">' + esc(a.n || '–') + '</span></td><td class="nm">' + esc(a.name) + '</td><td class="nu">' + n(a.unitsDone) + ' / ' + n(a.units) + '</td><td class="nu">' + n(a.refsDone) + ' / ' + n(a.refs) + '</td>' +
    '<td class="pr"><span class="bb"><i style="width:' + a.pct + '%"></i></span><b>' + a.pct + '%</b></td><td class="fi">' + (a.finished ? '✓ ' + esc(H(a.finished)) : '<span class="tg">' + n(a.units - a.unitsDone) + ' to go</span>') + '</td></tr>';
  const areas = '<div class="blk"><h2><i></i>Every area on the night</h2><table class="at"><thead><tr><th></th><th>Area</th><th class="nu">Units</th><th class="nu">Locations</th><th>Done</th><th class="fi">Finished</th></tr></thead><tbody>' + R.areas.map(areaRow).join('') + '</tbody></table></div>';
  /* left at close, grouped by area: the area once, then each location with the jobs not recorded */
  const SHORT = {pump: 'Pump out', clean: 'Clean', refill: 'Water', lockup: 'Lock-up'};
  const groups = []; R.left.forEach(l => { const g = groups.length && groups[groups.length - 1].area === l.area ? groups[groups.length - 1] : (groups.push({n: l.n, area: l.area, refs: []}), groups[groups.length - 1]); g.refs.push(l); });
  const chip = m => '<i style="--c:' + (JOBC[m.id] || '#5d6c77') + '">' + esc((SHORT[m.id] || m.task) + (m.units > 1 ? ' ×' + m.units : '')) + '</i>';
  const leftBlocks = R.left.length ? '<div class="blk hd"><h2><i></i>Left at close · ' + R.left.length + (R.left.length === 1 ? ' location' : ' locations') + '</h2></div>' +
    groups.map(g => '<div class="blk lg"><div class="lga"><span class="no">' + esc(g.n || '–') + '</span><span class="lgn"><b>' + esc(g.area) + '</b>' + (g.refs.length > 1 ? ' <em>' + g.refs.length + ' locations</em>' : '') + '</span></div><div class="lgr">' +
      g.refs.map(l => '<span class="lr"><b>' + esc(l.ref) + '</b>' + l.missing.map(chip).join('') + '</span>').join('') + '</div></div>').join('')
    : '<div class="blk"><h2><i></i>Left at close</h2><div class="clear">Nothing left at close: every location on the night’s list was serviced in full.</div></div>';
  const rows = [[90, 5, 'Exceptional', '90%+'], [80, 4, 'Very good', '80–89%'], [70, 3, 'Good', '70–79%'], [60, 2, 'Fair', '60–69%'], [50, 1, 'Below standard', '50–59%']];
  const how = '<div class="blk"><h2><i></i>How the night is scored</h2><div class="how"><p><b>Whole night servicing</b> is the services done over the services due that night. A service is one job on one unit: a pump-out, a clean and restock, or a water check, so a location with 20 toilets counts 20. It is rounded down, so 99.6% shows as 99%. <b>The stars</b> fill one for every 10 points above 40%, the last one part way like a gauge; 90% or better fills all five. Figures are the crews’ completion codes, read ' + esc(H(R.read)) + ' AEST ' + esc(shortDay(new Date(R.read + 36e6).toISOString().slice(0, 10))) + ', the same as the GC500 Servicing tab.</p>' +
    '<div class="sc">' + rows.map((r, i) => '<div' + (R.band.word === r[2] ? ' class="on"' : '') + '>' + starsSvg(r[1], false, 's' + i) + '<span>' + esc(r[2]) + '</span><em>' + esc(r[3]) + '</em></div>').join('') + '</div></div></div>';
  const ticks = [50, 60, 70, 80, 90].map(t => '<span class="tk" style="left:' + ((t - 40) / 60 * 100).toFixed(2) + '%">' + t + '%' + '</span>').join('');
  const pos = Math.max(0, Math.min(100, (R.pct - 40) / 60 * 100));
  const brand = '<div class="brand"><div class="co"><b>COATES</b><span>Industrial Solutions</span></div><div class="ev">' + flag() + 'GC500 <em>2026</em></div></div>';
  const foot = (pg) => '<div class="foot"><span><b>Coates Industrial Solutions · GC500 2026</b> · Servicing night report · ' + esc(when) + '</span><span>Author: Andrew Fisher · <span class="pg">' + pg + ' of 2</span></span></div>';
  const head2 = (t) => '<header class="hero"><div class="chq"></div>' + test + brand + '<p class="kick">' + esc(when) + ' · ' + esc(stateLine) + '</p><h1 data-more="' + esc(t) + ' · continued">' + esc(t) + '</h1></header>';
  const test = R.test ? '<div class="test">TEST TRACKER</div>' : '';
  const title = 'GC500 Servicing Report – ' + shortDay(id) + ' ' + dt(id).y;
  return '<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>' + css(opts.fontCss || '') + '</style></head><body>' +
    (opts.noBar ? '' : '<div class="bar"><button type="button" onclick="(window.__pg1202||Promise.resolve()).then(function(){window.print();})">Print or save as PDF</button><button type="button" class="ghost" onclick="window.close()">Close</button><small>Choose “Save as PDF” to email it.</small></div>') +
    '<section class="sheet p1"><header class="hero"><div class="chq"></div>' + test + brand +
      '<p class="kick">Toilet servicing · ' + esc(nightOf) + '</p><h1>Servicing night report</h1>' +
      '<p class="night">' + esc(when) + ' into ' + esc(whenTo.replace(/ \d{4}$/, '')) + '<small>Service night 08:00 to 08:00 · ' + esc(stateLine) + '</small></p>' +
      '<div class="score"><div><div class="pct"><b>' + R.pct + '</b><i>%</i></div><div class="pctl">Whole night servicing</div></div>' +
        '<div class="rate">' + starsSvg(R.stars, true, 'm') + '<div class="word"><b>' + esc(R.band.word) + '</b><span>' + R.stars.toFixed(1) + ' out of 5</span></div>' +
        '<div class="scale" aria-hidden="true"><div class="tr"><i style="width:' + pos.toFixed(2) + '%"></i></div>' + ticks + '<span class="pt" style="left:' + pos.toFixed(2) + '%"></span></div></div></div>' +
    '</header><div class="body"><div class="kpis">' + kpis + '</div>' +
      '<h2><i></i>The night’s jobs</h2><div class="jobs" style="--n:' + Math.max(1, Math.min(4, R.tasks.length)) + '">' + jobs + '</div>' +
      '<h2><i></i>Team effort</h2>' + team + '</div>' + foot(1) + '</section>' +
    '<section class="sheet p2 flow">' + head2('Area by area') + '<div class="body">' + areas + leftBlocks + how + '</div>' + foot(2) + '</section>' + '<script>' + PAGER + '<\/script></body></html>';
}

/* ---- on the page: one button on the Servicing tab (edit link only, where the tracker is read) */
function faces() {
  const f = root.document && root.document.getElementById('fonts1066'), origin = root.location && root.location.origin || '', out = [];
  const css = String(f && f.textContent || ''), re = /@font-face\{font-family:("[^"]+");font-style:(\w+);font-weight:(\d+);[^}]*?src:url\("\/m\/[^/"]+\/([^"]+)"\)/g;
  let m; while ((m = re.exec(css))) out.push({family: JSON.parse(m[1]), style: m[2], weight: m[3], url: origin + '/m/' + VIEW + '/' + m[4]});
  return out;
}
/* the page's own font files, fetched by the page (already in its cache) and given to the report window */
function fontsInto(w) {
  return Promise.all(faces().map(f => root.fetch(f.url, {cache: 'force-cache'}).then(r => r.ok ? r.arrayBuffer() : null).then(buf => {
    if (!buf || !w.FontFace) return; const ff = new w.FontFace(f.family, buf, {style: f.style, weight: f.weight}); w.document.fonts.add(ff); return ff.load();
  }).catch(() => null))).then(() => null);
}
function current() {
  if (typeof root.svcNight1202 !== 'function' || typeof SvcState === 'undefined') return null;
  const snap = root.svcNight1202(); if (!snap) return null;
  return model({D: snap.D, S: SvcState, C: typeof SvcCrews1173 === 'object' ? SvcCrews1173 : null, crewData: typeof SVC1067_CARD === 'object' && SVC1067_CARD ? SVC1067_CARD.data : {},
    events: snap.events, now: snap.now, read: snap.read, day: snap.day, meta: snap.meta});
}
function open() {
  const cap = root.document.querySelector('[data-svc1202-cap]'), say = t => { if (cap) cap.textContent = t; };
  let R; try { R = current(); } catch (e) { say('The report could not be made: ' + String(e && e.message || e)); return; }
  if (!R) { say('Waiting for the tracker read. Open the event tracker first.'); return; }
  if (R.state === 'future') { say('That night has not started. Pick a night that has.'); return; }
  const w = root.open('', '_blank');
  if (!w) { say('Your browser blocked the report window. Allow pop-ups for this site, then tap again.'); return; }
  /* signed with the page's own author credit, the same one its other print-outs carry */
  const author = typeof DATA === 'object' && DATA && DATA.brand && DATA.brand.author || '';
  w.document.open(); w.__fonts1202 = fontsInto(w); w.document.write(html(R, {author})); w.document.close();
  try { w.focus(); } catch (e) {}
  label();
}
function label() {
  const cap = root.document.querySelector('[data-svc1202-cap]'); if (!cap) return;
  let R = null; try { R = current(); } catch (e) { R = null; }
  cap.textContent = R ? (R.day.label + ' → ' + shortDay(nextId(R.day.id)).replace(/ \w+$/, '') + ' · ' + R.pct + '% · ' + R.band.word + (R.state === 'now' ? ' so far' : '')) : 'Print or save the night as a PDF';
}
function mount() {
  const host = root.document && root.document.getElementById('svc1067-host'); if (!host || host.querySelector('[data-svc1202]')) return !!host;
  const bar = root.document.createElement('div'); bar.className = 'svc1202-bar'; bar.setAttribute('data-svc1202', '');
  bar.innerHTML = '<button type="button" class="btn primary svc1202-btn" data-svc1202-open data-ro><svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + STAR + '"/></svg>Night report</button><span class="svc1202-cap" data-svc1202-cap role="status">Print or save the night as a PDF</span>';
  host.insertBefore(bar, host.children[1] || null);
  bar.addEventListener('click', e => { if (e.target.closest('[data-svc1202-open]')) open(); });
  const content = root.document.getElementById('svc1067');
  if (content && typeof MutationObserver === 'function') { let q = 0; new MutationObserver(() => { if (q) return; q = root.requestAnimationFrame(() => { q = 0; label(); }); }).observe(content, {childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed']}); }
  return true;
}
const api = {version: VERSION, stars, band, model, html, css};
root.report1202 = Object.freeze(Object.assign(api, {open, label}));
if (root.document) { if (!mount() && root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount); }
if (typeof module === 'object' && module && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
