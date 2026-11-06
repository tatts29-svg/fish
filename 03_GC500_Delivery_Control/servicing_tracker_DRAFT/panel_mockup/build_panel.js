/* Author: Andrew Fisher. Writes panel.html: the phone mock-up of the main page's read-only "Servicing tracker" panel on
   the Event nights tab, for Andrew's yes before it is built (AGENTS.md: mock-up first).
     node build_panel.js            -> panel.html
   The progress in it is an EXAMPLE, made up here from a fixed seed and marked as such on the page: a Friday night all
   done, Saturday night part way at 23:20, Thursday ("if needed") unused, Sunday not started. The panel is drawn by
   panel_render.js from state.js, the rule the crew card shares word for word; both files are pasted into the page
   unchanged. Data: ../tracker_data.json only. Nothing here talks to a service.
   As a module: buildModel() gives the same model (used by shoot.cjs to draw the panel on the real page). */
'use strict';
const fs = require('fs'), path = require('path');
const S = require('./state.js');
const R = require('./panel_render.js');
const HERE = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'tracker_data.json'), 'utf8'));
const NOW = Date.parse('2026-10-24T23:20:00+10:00');          // example service clock: Saturday night, mid-shift
const LAST_READ = NOW - 8000;
const OPEN_DEFAULT = { 7: true };                              // an area part way: blocks + waste tanks half cleaned

/* the only data the panel needs (no pins, no asset numbers, no "where": the panel shows progress, the sheets show the rest) */
function panelData(D) {
  return { tasks: D.tasks, plans: D.plans, days: D.days.map(d => ({ id: d.id, label: d.label, to: d.to, plan: d.plan, ifNeeded: !!d.ifNeeded })),
    areas: D.areas.map(a => ({ n: a.n, name: a.name, refs: a.refs.map(r => ({ ref: r.ref, lines: r.lines.map(l => ({ id: l.id, kind: l.kind, label: l.label, qty: l.qty })) })) })) };
}

/* ---- EXAMPLE ticks: crews work the areas in order (1..13, then "No location yet"); the pump trucks lead, the water
   truck and the cleaners follow. Times are jittered from a fixed seed. Only jobs whose time has come are ticked. */
function rng(seed) { let x = seed >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function exampleEvents(D) {
  const r = rng(181026), cfg = { plans: D.plans, days: D.days }, out = [];
  const order = D.areas.filter(a => a.n).sort((a, b) => a.n - b.n).concat(D.areas.filter(a => !a.n));
  const MIN = 60000;
  const nights = [
    { day: '2026-10-23', start: Date.parse('2026-10-23T19:05:00+10:00'), k: { pump: 22, water: 26, clean: 30 }, lag: { pump: 0, water: 25, clean: 45 }, j: 3 },
    { day: '2026-10-24', start: Date.parse('2026-10-24T19:05:00+10:00'), k: { pump: 22, water: 30, clean: 34 }, lag: { pump: 0, water: 25, clean: 45 }, j: 4 } ];
  let n = 0;
  const id = () => 'example' + String(++n).padStart(10, '0');          // 17 characters, as a phone's id is 16 or more
  for (const night of nights) {
    order.forEach((a, k) => a.refs.forEach((ref, j) => ref.lines.forEach(l => S.tasksFor(cfg, l, night.day).forEach(t => {
      const tap = night.start + (night.lag[t] + k * night.k[t] + j * night.j) * MIN + Math.round((r() - 0.5) * 6 * MIN);
      if (tap > NOW) return;
      const at = tap + Math.round(5000 + r() * 35000);
      out.push({ id: id(), ref: ref.ref, line: l.id, task: t, day: night.day, done: true, undoes: [], at, tapped_at: tap });
    }))));
  }
  /* the rule at work, invisible except in the times: a mistaken tick undone and done again, and a phone with no signal */
  const wc09 = out.find(e => e.line === 'WC09-FWF' && e.task === 'water' && e.day === '2026-10-24');
  if (wc09) {
    const undo = { id: id(), ref: 'WC09', line: wc09.line, task: 'water', day: wc09.day, done: false, undoes: [wc09.id], at: wc09.at + 2 * MIN, tapped_at: wc09.tapped_at + 2 * MIN };
    const again = { id: id(), ref: 'WC09', line: wc09.line, task: 'water', day: wc09.day, done: true, undoes: [], at: wc09.at + 7 * MIN, tapped_at: wc09.tapped_at + 6 * MIN };
    out.push(undo, again);
  }
  const wc07 = out.find(e => e.line === 'WC07-FWF' && e.task === 'clean' && e.day === '2026-10-24');
  if (wc07) wc07.at = Math.min(NOW - MIN, wc07.tapped_at + 24 * MIN);    // tapped with no signal, reached the service 24 min later
  out.sort((a, b) => a.at - b.at);
  return out.map((e, i) => Object.assign(e, { seq: i + 1, at: new Date(e.at).toISOString(), tapped_at: new Date(e.tapped_at).toISOString() }));
}

function buildModel(over) {
  const D = panelData(DATA);
  return Object.assign({ D, S, events: exampleEvents(DATA), now: NOW, lastRead: LAST_READ, day: S.autoDay({ plans: D.plans, days: D.days }, NOW),
    open: Object.assign({}, OPEN_DEFAULT), example: true }, over || {});
}

/* ---- the page around the panel: a faithful copy of the GC500 pieces it sits in (light paper cards in both OS schemes,
   as the live page does under contrast1007css), a simplified header band and tab strip, and Kyle's run sheet below */
const BASE_CSS = `
:root{--hdr:#1c1512;--hdr-2:#2a1e17;--hdr-ink:#faf7f5;--hdr-mute:#c4b3a7;--hdr-rule:#43312a;--hdr-ctl:#3a2a20;
  --sh-card:0 1px 2px rgba(20,14,10,.05),0 12px 26px -16px rgba(20,14,10,.30),0 26px 50px -32px rgba(20,14,10,.22)}
@media (prefers-color-scheme:dark){:root{--hdr:#150f0d;--hdr-2:#211711;--hdr-rule:#3a2a23;--hdr-ctl:#2f221a}}
body{--ink:#14181d;--ink2:#2f3841;--slate:#4a5560;--mute:#4b535b;--paper:#fff;--tint:#f8f6f4;--tint2:#fcfbfa;--rule:#e4e0dc;--rule2:#f1eeec;
  --orange:#ff6a13;--orange-ink:#9a3f0a;--orange-soft:#fdf0e6;--red:#b3261e;--amber:#8a5a00;--amber-soft:#fdf5e3;--green:#1f6b3a;--green-soft:#eaf4ee;
  color-scheme:light;margin:0;font:14px/1.45 "Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--tint);
  font-variant-numeric:tabular-nums;-webkit-text-size-adjust:100%}
*{box-sizing:border-box}
button{font:inherit;color:inherit}
.gc-top{position:relative;padding:16px 16px 12px;background:linear-gradient(180deg,var(--hdr) 0%,var(--hdr-2) 100%);color:var(--hdr-ink)}
.gc-top::before{content:'';position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,var(--orange) 0%,#f0a052 55%,var(--orange) 100%)}
.gc-eyebrow{display:block;font:700 11px/1.2 'Barlow Condensed','Arial Narrow',Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:var(--hdr-mute)}
.gc-word{display:block;margin-top:2px;font:italic 800 36px/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;letter-spacing:-.01em}
.gc-word em{font-size:20px;color:var(--orange);margin-left:2px}
.gc-tabs{display:flex;gap:2px;overflow-x:auto;padding:6px 8px;background:var(--hdr);border-bottom:1px solid var(--hdr-rule);scrollbar-width:none}
.gc-tabs span{flex:none;padding:8px 9px;border:2px solid transparent;border-radius:8px;font-size:13px;color:var(--hdr-ink);white-space:nowrap}
.gc-tabs span.on{border-color:var(--orange);font-weight:700}
main{padding:10px}
.mk-note{display:block;margin:0 0 12px;padding:7px 12px;border:1px dashed #c98a5a;border-radius:9px;background:var(--orange-soft);font-size:12.5px;color:var(--orange-ink)}
.mk-note b{text-transform:uppercase;letter-spacing:.05em}
.card{--cut:17px;--edge:var(--rule);--face:var(--paper);position:relative;isolation:isolate;padding:16px 18px;margin-bottom:16px;box-shadow:var(--sh-card)}
.card::before,.card::after{content:"";position:absolute;z-index:-1;pointer-events:none}
.card::before{inset:0;background:var(--edge);clip-path:polygon(0 0,calc(100% - var(--cut)) 0,100% var(--cut),100% 100%,var(--cut) 100%,0 calc(100% - var(--cut)))}
.card::after{inset:1px;background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,0) 64px),var(--face);clip-path:polygon(0 0,calc(100% - var(--cut) + 1px) 0,100% calc(var(--cut) - 1px),100% 100%,calc(var(--cut) - 1px) 100%,0 calc(100% - var(--cut) + 1px))}
.card h3{margin:0 0 4px;font-size:15px;font-weight:800;letter-spacing:-.005em}
.card h3 small{font-size:12px}
.card .sub{margin:0 0 12px;font-size:12.5px;color:var(--slate);overflow-wrap:anywhere}
.btn{padding:8px 12px;border:1px solid var(--rule);background:var(--paper);border-radius:9px 0;cursor:pointer;font-size:13px;white-space:nowrap;color:var(--ink)}
.btn.primary{background:linear-gradient(rgb(174,72,13),rgb(133,50,8));border-color:rgb(163,70,17);color:#fff;font-weight:700;
  box-shadow:rgba(255,255,255,.32) 0 1px 0 inset,rgba(255,106,19,.85) 0 8px 18px -9px}
.btn:focus-visible,summary:focus-visible{outline:2px solid var(--orange-ink);outline-offset:2px}
.mk-stub{opacity:.6}
.mk-stub .btn{pointer-events:none}
.mk-stubrow{display:flex;gap:6px;flex-wrap:wrap}
footer{padding:10px 12px 18px;font-size:11.5px;color:var(--mute)}
`;

function jsonForScript(x) { return JSON.stringify(x).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029'); }

function buildHtml() {
  const M = buildModel();
  const stateSrc = fs.readFileSync(path.join(HERE, 'state.js'), 'utf8');
  const renderSrc = fs.readFileSync(path.join(HERE, 'panel_render.js'), 'utf8');
  const panelCss = fs.readFileSync(path.join(HERE, 'panel.css'), 'utf8');
  const tabs = ['Today', 'Build', 'Equipment', 'Sub-hired', 'Demob', 'Map explorer', 'Coates Way', 'Event nights', 'Tools'];
  const boot = `
(function () {
'use strict';
var M = {D: ${jsonForScript(M.D)}, S: SvcState, events: ${jsonForScript(M.events)}, now: ${M.now}, lastRead: ${M.lastRead},
  day: ${jsonForScript(M.day)}, open: ${jsonForScript(M.open)}, example: true};
var root = document.getElementById('svc1063');
function fromHash() {                       /* #day=2026-10-25&open=2 (mock-up only: pick what the screenshot shows) */
  var h = (location.hash || '').replace(/^#/, ''); if (!h) return;
  h.split('&').forEach(function (kv) { var p = kv.split('='), k = p[0], v = decodeURIComponent(p[1] || '');
    if (k === 'day' && M.D.days.some(function (d) { return d.id === v; })) M.day = v;
    if (k === 'open') { M.open = {}; v.split(',').forEach(function (n) { if (/^\\d{1,2}$/.test(n)) M.open[n] = true; }); } });
}
function draw() { root.innerHTML = SvcPanel.svcPanelHtml(M); }
root.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('[data-svc-day]') : null; if (!b) return;
  M.day = b.getAttribute('data-svc-day'); draw();
  var nb = root.querySelector('[data-svc-day="' + M.day + '"]'); if (nb) nb.focus();
});
root.addEventListener('toggle', function (e) {
  var d = e.target; if (d && d.matches && d.matches('details[data-svc-area]')) M.open[d.getAttribute('data-svc-area')] = d.open;
}, true);
window.addEventListener('hashchange', function () { fromHash(); draw(); });
fromHash(); draw();
})();`;
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="author" content="Andrew Fisher">
<title>Servicing tracker panel</title>
<meta name="description" content="Mock-up of the GC500 page's read-only Servicing tracker panel on the Event nights tab, with example progress, for Andrew's yes before it is built.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;1,700;1,800&display=swap">
<style>${BASE_CSS}
${panelCss}</style>
</head>
<body>
<header class="gc-top"><span class="gc-eyebrow">Coates Industrial Solutions</span><span class="gc-word">GC500<em>2026</em></span></header>
<nav class="gc-tabs" aria-label="Page tabs (simplified for the mock-up)">${tabs.map(t => '<span' + (t === 'Event nights' ? ' class="on" aria-current="page"' : '') + '>' + R.esc(t) + '</span>').join('')}</nav>
<main>
<p class="mk-note"><b>Mock-up</b> · for Andrew's yes before it is built · Event nights tab, top of the tab, read only · the progress shown is an example · Author: Andrew Fisher · 18 Oct 2026</p>
<section class="card svc1063" id="svc1063" aria-labelledby="svc1063-h">${R.svcPanelHtml(M)}</section>
<section class="card mk-stub" aria-label="Event nights run sheet, unchanged">
<h3>Event nights · run sheet</h3>
<p class="sub">Kyle's run sheet stays exactly as it is, under the tracker. Its ticks go on the job record; the crews' QR ticks above never do.</p>
<div class="mk-stubrow"><span class="btn primary">Friday night</span><span class="btn">Saturday night</span><span class="btn">Sunday night</span></div>
</section>
</main>
<footer>Coates Industrial Solutions · GC500 · Author: Andrew Fisher · mock-up, not live</footer>
<script>
${stateSrc}
${renderSrc}
${boot}
</script>
</body>
</html>
`;
}

if (require.main === module) {
  const html = buildHtml();
  fs.writeFileSync(path.join(HERE, 'panel.html'), html);
  const M = buildModel(), cfg = { plans: M.D.plans, days: M.D.days }, st = S.jobStates(M.events, M.now);
  const all = [].concat(...M.D.areas.map(a => a.refs));
  console.log('panel.html ' + html.length + ' bytes · ' + M.events.length + ' example ticks · shows ' + M.day + ' at ' + S.hm(M.now));
  for (const d of M.D.days) {
    const g = S.groupStats(cfg, all, d.id, st);
    console.log('  ' + d.label + ': ' + g.pct + '% · ' + g.unitsDone + ' of ' + g.units + ' units · ' + g.refsDone + ' of ' + g.refs + ' locations · ' + g.d + ' of ' + g.w + ' jobs' + (g.finished ? ' · finished ' + S.hm(g.finished) : ''));
  }
}
module.exports = { buildModel, buildHtml, exampleEvents, panelData, NOW };
