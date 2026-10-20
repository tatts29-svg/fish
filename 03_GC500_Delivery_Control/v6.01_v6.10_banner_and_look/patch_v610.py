#!/usr/bin/env python3
"""v6.10 - THE DAY IN THE BANNER, AND THE LOOK ENHANCED (26 Sep 2026).

Andrew Fisher, 26 Sep 2026: "Do we make this part of the banner. Include it in the banner somehow" (the Today strip: the
day plate and the three pods - due in, recorded on site, not recorded on site); and: "I want all pages upgraded. wow factor
still keep our same look and designs. but we need to enhance the look. a glass look. a shadow. animation. a glow. a 3d
look. we need to push yourself with this. lets go deep into the whole layout."

1. THE DAY POD. A fourth pod in the header's cluster, the same housing as the clock, the countdown and the record: the day
   it counts (today, or the next programme day), three figures that are the Today strip's own (todayFigures - the strip's
   arithmetic, moved into one function and read by nothing else), each a button to where it can be acted on, and the
   one-line note under them. Refreshed at the end of every render pass, so it changes when the record does. The strip
   leaves the Today page; the page opens on the board.
2. THE LOOK. One layer of CSS at the end of the main style block - the same colours, faces, chamfers and type; added:
   depth (a soft, layered shadow under every card; a drop shadow that follows the chamfer on the tiles and the day cards);
   glass (the hero caption becomes a frosted plate over the picture; the table heads frost as they stick); glow (the
   active tab, the orange buttons, the race-day rail, the alert figures, today's day card breathing); a 3D touch (tiles
   and day cards lift and tilt to the pointer; a gloss along the top of every face); motion (a staggered rise when a page
   arrives - only then, on the arrive class the page already sets; the hero picture drifts slowly on a laptop).
   Everything heavy is off on a phone (no filters, no blur, no drift) and off entirely for reduced motion.

  python3 patch_v610.py <page.html> [builder.py]
"""
import re, sys

page = sys.argv[1]; builder = sys.argv[2] if len(sys.argv) > 2 else None

def rep(text, old, new, what, count=1):
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != count: sys.exit(f'{what}: expected {count}, found {len(ms)}: {old[:80]!r}')
    out, last = [], 0
    for m in ms: out.append(text[last:m.start()]); out.append(new); last = m.end()
    out.append(text[last:]); return ''.join(out)

# ---- 1. the day pod --------------------------------------------------------------------------------------------------
OLD_POD_ANCHOR = """   <div class="recstrip" id="recstrip" role="status" aria-live="polite" aria-label="The shared record"></div>"""
NEW_POD_ANCHOR = """   <!-- v6.10 - the day pod: the Today strip's day and figures, in the banner (Andrew Fisher, 26 Sep 2026) -->
   <div class="hzpod hztd" id="hztd" role="group" aria-label="The programme day and its deliveries"></div>
   <div class="recstrip" id="recstrip" role="status" aria-live="polite" aria-label="The shared record"></div>"""

OLD_STRIP_CALL = """  ${todayStrip(today, show, dayNow)}
  <div class="dsnband">${dsnBoard(today, dsnState(today), 'video')}</div>"""
NEW_STRIP_CALL = """  <div class="dsnband">${dsnBoard(today, dsnState(today), 'video')}</div>   <!-- v6.10 - the day strip is the banner's day pod now -->"""

OLD_RENDERPASS_TAIL = """  else if (state.tab === 'timeline') renderTimeline();
  else renderAbout();"""
NEW_RENDERPASS_TAIL = """  else if (state.tab === 'timeline') renderTimeline();
  else renderAbout();
  hzTodayPod();   /* v6.10 - the banner's day pod reads the same record this pass drew */"""

OLD_TODAYSTRIP_HEAD = "function todayStrip(today, show, dayNow){"
NEW_TODAYSTRIP_HEAD = """/* v6.10 - THE DAY POD (Andrew Fisher, 26 Sep 2026: the Today strip belongs in the banner). The strip's own arithmetic,
   in one place: the day it counts (today if it is a programme day, else the next), the entries due in on it, how many
   are recorded on site, how many are not recorded on site yet, and rows still needing a reference. */
function todayFigures(){
  const today = todayIso(), days = programmeDays();
  const dayNow = days.find(d => d.iso === today) || null, next = days.find(d => d.iso > today) || null, show = dayNow || next;
  const due = show ? show.deliveries : [];
  const onsite = due.filter(r => { const d = deliveryOf(r.a.key); return d.recorded && d.state === 'on site'; }).length;
  const R = show ? dayReview(show) : {review: 0, refs: 0, both: 0, total: 0};
  const waiting = due.filter(r => !deliveryOf(r.a.key).recorded).length;
  const redDue = due.filter(r => { const v = deliveryView(r.a); return v.recorded && v.negative; }).length;
  const split = [waiting ? fmtNum(waiting) + ' with no record' : null, redDue ? fmtNum(redDue) + ' recorded not on site' : null].filter(Boolean).join(' · ');
  const d = fmtDay(show ? show.iso : today);
  return {d, dayNow: !!dayNow, due: due.length, onsite, notYet: R.review, refs: R.refs, chase: R.total, both: R.both,
    subDue: 'schedule entries', subOn: onsite === due.length && due.length ? 'all of them' : 'so far today', subNot: R.review ? split : 'nothing outstanding'};
}
function hzTodayPod(){
  const el = $('#hztd'); if (!el) return;
  let f; try { f = todayFigures(); } catch (e) { el.hidden = true; return; }
  const ICON = {cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    seen: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.5L16 9.5"/></svg>',
    gap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/></svg>'};
  const fig = (n, lab, sub, go, icon, cls) => `<button type="button" class="tdf${cls ? ' ' + cls : ''}" data-go="${go}" title="Open ${go === 'plant' ? 'Plant' : 'the Timeline'}"><span class="tl">${lab}</span><span class="tn"><b>${fmtNum(n)}</b>${ICON[icon]}</span><span class="ts">${esc(sub)}</span></button>`;
  el.innerHTML = `<span class="tdday">${refPlate(f.d.dm.toUpperCase(), 19)}<span class="tdw"><b>${esc(f.d.dow)}</b> · ${f.dayNow ? 'today' : 'next programme day'}</span></span>
    <span class="tdrow">${fig(f.due, 'Due in', f.subDue, 'timeline', 'cal')}${fig(f.onsite, 'Recorded on site', f.subOn, 'plant', 'seen')}${fig(f.notYet, 'Not recorded on site', f.subNot, 'plant', 'gap', f.notYet ? 'gap' : '')}${f.refs ? fig(f.refs, f.refs === 1 ? 'Row needs a reference' : 'Rows need references', 'on the schedule', 'timeline', 'gap', 'gap') : ''}</span>`;
  if (!el.dataset.wired) { el.dataset.wired = '1'; el.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); }); }
}
function todayStrip(today, show, dayNow){"""

# ---- 2. the look ------------------------------------------------------------------------------------------------------
OLD_STYLE_END = """.vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
</style></head>"""
NEW_STYLE_END = """.vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
/* ================================================================================================================
   v6.10 - DEPTH, GLASS, GLOW, MOTION (Andrew Fisher, 26 Sep 2026: the same look and design, enhanced). One layer on
   top of everything above: nothing here changes a colour, a face, a chamfer or a typeface. Heavy effects (filters,
   blur, the drifting hero) are laptop only; every motion respects reduced-motion and the page's own motion switch.
   ================================================================================================================ */
:root{--sh-card:0 1px 2px rgba(20,14,10,.05),0 12px 26px -16px rgba(20,14,10,.30),0 26px 50px -32px rgba(20,14,10,.22);
  --sh-tile:drop-shadow(0 1px 1px rgba(20,14,10,.09)) drop-shadow(0 10px 16px rgba(20,14,10,.13));
  --glow-or:0 0 0 1px rgba(255,106,19,.45),0 0 22px -3px rgba(255,106,19,.75)}
/* the day pod: the Today strip's plate and tiles, in the banner's housing, an orange rim round the row (Andrew Fisher's mock-ups, 26 Sep 2026) */
.hzpod.hztd{padding:9px 12px 10px;display:flex;flex-direction:row;align-items:center;gap:12px;flex-wrap:wrap;
  box-shadow:0 0 0 1px #0b1012,0 0 0 2.5px rgba(255,106,19,.62),0 0 0 3.5px #1a2224,0 0 22px -4px rgba(255,106,19,.55),0 8px 18px -6px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.10),inset 0 -8px 16px rgba(0,0,0,.55)}
.hztd .tdday{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding-right:12px;border-right:1px solid rgba(255,255,255,.12)}
.hztd .tdday .rplate{font-size:19px} .hztd .tdw{font:600 11px/1.25 'Inter',var(--sans,system-ui,sans-serif);color:#c9d1d0;max-width:9em} .hztd .tdw b{color:#f4f7f6;font-weight:800}
.hztd .tdrow{display:flex;gap:7px;flex:1 1 auto;min-width:0}
.hztd .tdf{appearance:none;border:0;font:inherit;flex:1 1 0;min-width:0;background:linear-gradient(180deg,#1c2628,#0f1517);border-radius:9px;padding:6px 9px 6px;color:#f4f7f6;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;gap:1px;text-align:left;box-shadow:0 0 0 1px #0b1012,inset 0 1px 0 rgba(255,255,255,.08);transition:transform .15s,box-shadow .15s}
.hztd .tdf .tl{font:700 7.5px/1.1 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.16em;text-transform:uppercase;color:#a9b4b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.hztd .tdf .tn{display:flex;align-items:center;gap:7px} .hztd .tdf .tn b{font:700 26px/1 'Barlow Condensed','Arial Narrow',var(--sans,system-ui,sans-serif);font-style:italic;letter-spacing:-.005em;text-shadow:0 0 1px #fff,0 0 12px rgba(255,255,255,.18),0 2px 3px rgba(0,0,0,.8)}
.hztd .tdf .tn svg{width:15px;height:15px;fill:none;stroke:#8d9a99;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.hztd .tdf .ts{font:600 8px/1.1 'Inter',var(--sans,system-ui,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:#a9b4b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.hztd .tdf.gap .tn b{color:#ff9a4d;text-shadow:0 0 1px #ffb27a,0 0 10px rgba(255,106,19,.85)} .hztd .tdf.gap .tn svg{stroke:#ff9a4d}
.hztd .tdf:hover,.hztd .tdf:focus-visible{transform:translateY(-1px);box-shadow:0 0 0 1px #0b1012,0 0 0 2px rgba(255,106,19,.55),0 8px 16px -8px rgba(255,106,19,.7);outline:none}
/* the banner's order at every width (Andrew Fisher, 26 Sep 2026: the car and the search bar up the top, the three pods under
   that, the day's figures under those): the row wraps, the cluster sits right on its own line as wide as its three pods, and
   the day pod takes the full width of the cluster beneath them */
.brandrow{flex-wrap:wrap}
.hzcluster{order:5;flex:0 0 auto;margin-left:auto;max-width:min(100%,660px);flex-wrap:wrap;justify-content:flex-end;row-gap:8px}   /* a wrapping flex box measures as one line, so the cap is what makes the day row drop under the three pods */
.hzpod.hztd{flex:1 1 100%;order:9;min-width:0}
/* depth: every card sits on a soft, layered shadow; the tiles and the day cards carry a shadow that follows their chamfer */
main .card{box-shadow:var(--sh-card);transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s}
main .card::after{background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,0) 64px),var(--face)}
.kpi{filter:var(--sh-tile);transition:transform .25s cubic-bezier(.2,.7,.2,1),filter .25s}
.kpi::after{background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,0) 48px),var(--face)}
.kpi .v{text-shadow:0 1px 0 rgba(255,255,255,.8)}
.kpi.alert .v{text-shadow:0 1px 0 rgba(255,255,255,.8),0 0 16px rgba(214,40,28,.35)}
.tsq,.ctile{transition:transform .2s cubic-bezier(.2,.7,.2,1),box-shadow .2s,filter .2s}
.day{filter:drop-shadow(0 1px 1px rgba(20,14,10,.08)) drop-shadow(0 10px 14px rgba(20,14,10,.14))}
.day .dface{background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,0) 54px),var(--face)}
.day.today{--edge:var(--orange);animation:v610breathe 2.8s ease-in-out infinite}
.day[aria-pressed="true"]{transform:translateY(-2px)}
@keyframes v610breathe{0%,100%{filter:drop-shadow(0 1px 1px rgba(20,14,10,.08)) drop-shadow(0 10px 14px rgba(20,14,10,.14)) drop-shadow(0 0 0 rgba(255,106,19,0))}50%{filter:drop-shadow(0 1px 1px rgba(20,14,10,.08)) drop-shadow(0 10px 14px rgba(20,14,10,.14)) drop-shadow(0 0 10px rgba(255,106,19,.55))}}
/* glass: the hero caption is a frosted plate over the picture; the vignette under it keeps the words readable */
.pgban{position:relative}
.pgban .rbwin{position:relative;overflow:hidden;box-shadow:var(--sh-card)}
.pgban .rbwin::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 58%,rgba(10,8,6,.55));pointer-events:none}
.pgban .rbcap{position:absolute;left:14px;bottom:12px;right:auto;max-width:calc(100% - 28px);margin:0;padding:8px 13px;border-radius:10px;color:#f6f1ec;background:rgba(18,14,12,.46);border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 24px -12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.18);text-shadow:0 1px 2px rgba(0,0,0,.6);z-index:1}
.pgban .rbcap span{opacity:.86}
.tblwrap thead th{position:sticky;top:0;z-index:2;background:rgba(255,255,255,.88)}
/* glow: the active tab, the orange buttons, the race-day rail, the record's LIVE lamp */
nav.tabs button[aria-selected="true"]{text-shadow:0 0 14px rgba(255,106,19,.35)}
.btn.primary{background:linear-gradient(180deg,#ff8a3d,var(--orange-ink) 62%);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 8px 18px -9px rgba(255,106,19,.85);transition:transform .15s,box-shadow .15s,filter .15s}
.btn.primary:hover,.btn.primary:focus-visible{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.32),var(--glow-or)}
.btn:not(.primary):hover{transform:translateY(-1px)}
.btn{transition:border-color .15s,box-shadow .15s,background .15s,transform .15s}
.hzpod .rail .done{box-shadow:0 0 8px rgba(255,106,19,.75)}
h3.sec{position:relative;padding-bottom:7px}
h3.sec::after{content:'';position:absolute;left:0;bottom:0;width:58px;height:3px;border-radius:2px;background:var(--orange);box-shadow:0 0 12px rgba(255,106,19,.6)}
tbody tr{transition:background .15s,box-shadow .15s}
tbody tr:hover{box-shadow:inset 3px 0 0 var(--orange)}
/* a 3D touch: tiles and day cards lift and tilt to the pointer, cards lift */
@media (hover:hover) and (min-width:900px){
  .kpi:hover{transform:translateY(-3px) perspective(700px) rotateX(2.5deg);filter:var(--sh-tile) drop-shadow(0 0 16px rgba(255,106,19,.28))}
  .day:hover{transform:translateY(-4px) perspective(700px) rotateX(2deg);filter:drop-shadow(0 1px 1px rgba(20,14,10,.08)) drop-shadow(0 16px 22px rgba(20,14,10,.2)) drop-shadow(0 0 12px rgba(255,106,19,.35))}
  main .card:hover{box-shadow:0 1px 2px rgba(20,14,10,.05),0 16px 34px -16px rgba(20,14,10,.36),0 30px 60px -34px rgba(20,14,10,.26)}
  .tsq:hover,.ctile:hover{transform:translateY(-2px)}
  .pgban .rbcap{-webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4)}
  .tblwrap thead th{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);background:rgba(255,255,255,.72)}
  .pgban .rbwin img{animation:v610drift 28s ease-in-out infinite alternate;will-change:transform}
}
@keyframes v610drift{from{transform:scale(1) translate3d(0,0,0)}to{transform:scale(1.06) translate3d(-1.4%,-.9%,0)}}
/* motion: a staggered rise as a page arrives (on the arrive class the page already sets, never on a re-render) */
.pane.on.arrive > *{animation:v610rise .55s cubic-bezier(.2,.7,.2,1) both}
.pane.on.arrive > :nth-child(2){animation-delay:.05s} .pane.on.arrive > :nth-child(3){animation-delay:.1s} .pane.on.arrive > :nth-child(4){animation-delay:.15s}
.pane.on.arrive > :nth-child(5){animation-delay:.2s} .pane.on.arrive > :nth-child(6){animation-delay:.25s} .pane.on.arrive > :nth-child(7){animation-delay:.3s} .pane.on.arrive > :nth-child(n+8){animation-delay:.35s}
@keyframes v610rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:640px){
  .hzcluster{flex:1 1 100%;margin-left:0;max-width:100%} .hzpod.hztd{padding:8px 9px 9px;gap:8px} .hztd .tdday{flex:1 1 100%;border-right:0;padding-right:0} .hztd .tdrow{flex:1 1 100%;gap:5px} .hztd .tdf{padding:5px 7px} .hztd .tdf .tn b{font-size:22px} .hztd .tdf .tl,.hztd .tdf .ts{font-size:7px}
  .kpi,.day{filter:none} .day.today{animation:none;box-shadow:none} .pgban .rbcap{background:rgba(18,14,12,.7)} .pgban .rbwin{box-shadow:none}
}
@media (prefers-reduced-motion:reduce){
  .pane.on.arrive > *{animation:none} .day.today{animation:none} .pgban .rbwin img{animation:none}
  .kpi,.day,.tsq,.ctile,main .card,.btn,.btn.primary,.hztd .tdf{transition:none}
}
html[data-motion="off"] .pane.on.arrive > *,html[data-motion="off"] .day.today,html[data-motion="off"] .pgban .rbwin img{animation:none}
@media print{ .kpi,.day{filter:none} main .card{box-shadow:none} .pgban .rbcap{position:static;background:none;color:inherit;border:0;box-shadow:none;text-shadow:none} .pgban .rbwin::after{display:none} .hzpod.hztd{display:none} }
</style></head>"""

for path in [page] + ([builder] if builder else []):
    s = open(path, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿'); n0 = len(s)
    s = rep(s, OLD_POD_ANCHOR, NEW_POD_ANCHOR, 'pod anchor')
    s = rep(s, OLD_STRIP_CALL, NEW_STRIP_CALL, 'strip call')
    s = rep(s, OLD_RENDERPASS_TAIL, NEW_RENDERPASS_TAIL, 'render pass')
    s = rep(s, OLD_TODAYSTRIP_HEAD, NEW_TODAYSTRIP_HEAD, 'today strip head')
    s = rep(s, OLD_STYLE_END, NEW_STYLE_END, 'style end')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok', path.split('/')[-1], n0, '->', len(s))
