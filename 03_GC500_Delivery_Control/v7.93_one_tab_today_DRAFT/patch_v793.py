#!/usr/bin/env python3
r"""v7.93 - Today and Where we are on one tab (Example A). Author: Andrew Fisher.

Andrew, 2 Oct 2026: "we really need to merge both today and where we are into one. but we need to lay this out good
please" ... "We are professional your taking away all the good work we did" ... "Do more examples make sure we dont
double up info". He picked Example A of three: Today's instruments lead, every component kept as it was built, each
fact shown once.

What changes (screen; paper prints as before):
  - Today carries the Where we are page underneath its own cards: By group, By branch, Money, On site, and the detail
    trade by trade. It is the same Where we are, drawn by its own code, so every link, the date control, Email, Print
    (the A4 report) and Start showcase work as they did. Its buttons sit at the top of Today under a "Today" heading.
  - Where we are leaves the tab row and the Tools list. A link or bookmark to it opens Today at the By group heading;
    the "due in and not on site" dot it carried rides on Today.
  - Repeats are left off, nothing is redrawn:
      the big dial panel (delivery, fencing, revenue) - the Deliveries panel reads delivery against the plan,
        By group the fencing, Money the revenue;
      the milestone strip - the programme card has the key dates;
      Where we are's "As at" line and Today's date line - the header carries the date and the programme card the
        day count (the "Recording as" line still shows on an editing link);
      Today's Costs & charges card - Money carries those figures. (Today's Fencing card stays: Andrew, 2 Oct 2026, "why isnt
        the info of fencing in today" - its docket count, quote flag and this week's lines are on no other card.)
      Where we are's chicane picture - one banner, Today's; and its own "View only" line - Today has one.
  - "Today's work" heads the cards; the roads card joins them when it is alone in its column.

    python3 patch_v793.py <page.html>     (after v7.91's patch, on the v7.92 live page)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function wwaEmbed793(' in t: sys.exit('v7.93 already applied')
if 'G.photoRefinement792=' not in t: sys.exit('v7.93 needs the v7.92 live page')
if 'v7.91 - Today tidy' not in t: sys.exit('v7.93 needs v7.91 applied first (patch_v791.py)')

# 1. Where we are leaves the tab row and Tools; a link to it lands on Today
t = rep(t, "const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit']);",
        "const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit', 'progress']); /* v7.93 - Where we are is on Today */",
        'progress set aside', p)
t = rep(t, "const TAB_PRIMARY = ['today', 'progress', 'timeline', 'plant', 'map', 'docs', 'coatesway'];",
        "const TAB_PRIMARY = ['today', 'timeline', 'plant', 'map', 'docs', 'coatesway']; /* v7.93 - Where we are is on Today */",
        'progress off the row', p)
t = rep(t, ": k === 'progress' && att.progress ?",
        ": (k === 'progress' || k === 'today') && att.progress ? /* v7.93 - the dot rides on Today */",
        'dot on Today', p)
t = rep(t, "function go(tab){ return holdAssets(() => go776Held(tab)); }",
        "function go(tab){ return holdAssets(() => go776Held(go793(tab))); } /* v7.93 - Where we are is on Today */\n"
        "/* v7.93 - a link, a bookmark or a card asking for Where we are opens Today at its By group heading. Where we are's pane\n"
        "   goes back to its own place first, so a tab change that empties Today cannot take it with it. */\n"
        "function go793(tab){\n"
        " if (typeof wwaHome793 === 'function') wwaHome793();\n"
        " if (tab !== 'progress') return tab;\n"
        " if (typeof wwa793 === 'function') wwa793().jump = true;\n"
        " try { if (location.hash === '#progress') history.replaceState(history.state, '', '#today'); } catch (e) {}\n"
        " return 'today';\n"
        "}",
        'progress lands on Today', p)

# 2. Today draws Where we are under its cards; Where we are, redrawn on its own (the date control), stays there
t = rep(t, "function renderToday(){ return holdAssets(renderToday_held); }",
        "function renderToday(){ return holdAssets(() => { wwaHome793(); const r = renderToday_held(); wwaEmbed793(); return r; }); } /* v7.93 */",
        'today wrapper', p)
t = rep(t, "function renderProgress(){ return holdAssets(renderProgress_held); }",
        "function renderProgress(){ return holdAssets(() => { const r = renderProgress_held(); wwaPlace793(); return r; }); } /* v7.93 */",
        'progress wrapper', p)

JS = r"""/* v7.93 - Today and Where we are on one tab (Andrew, 2 Oct 2026, Example A). Where we are is drawn by its own code
   into its own pane, and that pane is carried inside Today below Today's cards - so its links, its date control,
   Email, Print (the A4 report) and Start showcase are the same code doing the same things. Before Today redraws
   (or the tab changes) the pane goes back to its own place, so nothing that empties Today can take it with it.
   Repeats are left off by the screen rules beside the v7.91 tidy; nothing is redrawn. */
function wwa793(){ return wwa793.s || (wwa793.s = {home: null, jump: false}); } /* a function, so a navigation during start-up finds it */
function wwaHome793(){
 const pp = document.getElementById('pane-progress');
 if (!pp || !wwa793().home || !pp.parentElement || pp.parentElement.id !== 'pane-today') return;
 wwa793().home.after(pp); pp.classList.remove('wwa793', 'on'); pp.setAttribute('hidden', '');
}
function wwaEmbed793(){
 if (state.tab !== 'today') return;
 const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress');
 if (!T || !pp) return;
 if (!wwa793().home) { wwa793().home = document.createElement('i'); wwa793().home.id = 'wwa793home'; wwa793().home.hidden = true; pp.before(wwa793().home); }
 T.classList.add('m793');
 const hub = T.querySelector(':scope > .hub');
 /* the roads card joins the cards when it is alone in its column; a day with a brief keeps its column, after the cards */
 const tc = T.querySelector(':scope > .todaycols');
 if (tc && hub) {
  const side = tc.querySelector(':scope > .sidecol');
  if (tc.children.length === 1 && side && side.children.length === 1) { hub.appendChild(side.firstElementChild); tc.remove(); }
  else hub.after(tc);
 }
 /* the Open line on each instrument (the register, the summary, Where we are) navigates. Live v7.92 wired
    '.island.hubgo', which no element is, so those three lines did nothing when pressed (found while testing v7.93). */
 T.querySelectorAll('.card.island .hubgo[data-go]').forEach(g => { const f = ev => { ev.stopPropagation(); go(g.dataset.go); };
  g.onclick = f; g.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(ev); } }; });
 if (hub && !T.querySelector(':scope > .sec793')) { const h = document.createElement('div'); h.className = 'dsn sec793';
  h.innerHTML = '<h3 class="sec">Today’s work <span>what is due next, what came in today, who to call</span></h3>'; hub.before(h); }
 const hint = T.querySelector(':scope > .maphint');
 T.insertBefore(pp, hint || null);
 pp.classList.add('on', 'wwa793'); pp.classList.remove('arrive'); pp.removeAttribute('hidden');
 renderProgress_held(); /* drawn where it is seen, so anything that measures itself measures the real width */
 wwaPlace793();
 if (wwa793().jump) { wwa793().jump = false;
  requestAnimationFrame(() => { const m = $('main'), s = pp.querySelector('.dsn > h3.sec');
   if (m && s) m.scrollTop += s.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; }); }
}
/* Where we are's buttons (date, Email this, Print, Start showcase) at the top of Today, under one heading */
function wwaPlace793(){
 const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress');
 if (!T || !pp || pp.parentElement !== T) return;
 const acts = pp.querySelector('.dsn > .head > .hacts'); if (!acts) return;
 let slot = T.querySelector(':scope > .acts793');
 if (!slot) { slot = document.createElement('div'); slot.className = 'dsn acts793';
  slot.innerHTML = '<div class="head"><h2><i></i>Today</h2></div>';
  const at = T.querySelector(':scope > .hubhead') || T.querySelector(':scope > .inst'); T.insertBefore(slot, at || pp); }
 const head = slot.querySelector('.head'), old = head.querySelector('.hacts'); if (old && old !== acts) old.remove();
 head.appendChild(acts);
}
"""
t = rep(t, "function liveMapKey(){", JS + "function liveMapKey(){", 'v7.93 code', p)

CSS = """/* v7.93 - Today and Where we are on one tab: the repeats are left off on the screen (paper prints as before) */
 @media screen{
  #pane-progress.wwa793 > .pgban,#pane-progress.wwa793 > .rochip,#pane-progress.wwa793 .dsn > .head{display:none!important}
  #pane-today.m793 > .hubhead > div:first-child{display:none!important}
  body.viewonly #pane-today.m793 > .hubhead{display:none!important}
  #pane-today.m793 .hub > .card[data-go="costs"]{display:none!important}
  #pane-today.m793 > .acts793{margin:0 0 14px}
  #pane-today.m793 > .acts793 .head{display:flex;flex-direction:column;gap:12px}
  #pane-today.m793 > .acts793 .hacts{margin:0}
  #pane-today.m793 > .sec793 h3.sec{margin:22px 0 10px}
  #pane-today.m793 > .todaycols{margin-top:14px}
  #pane-progress.wwa793{max-width:none;margin:22px 0 0;padding:0}
 }
 @media print{
  body.printing-progress #pane-today.m793 > :not(#pane-progress){display:none!important}
 }"""
A = " header.top.slim89 .wordmark .yr{font-size:16px!important}\n}\n@media (min-width:641px) and (max-width:1279px){"
t = rep(t, A, A.replace("\n@media (min-width:641px) and (max-width:1279px){", "\n" + CSS + "\n@media (min-width:641px) and (max-width:1279px){"), 'v7.93 css, every width (after the v7.89 desktop block)', p)
t = t.replace('/* v7.91 - Today tidy after full width:', '/* v7.93 - Today and Where we are on one tab (Example A): Where we are drawn under Today\'s cards, repeats left off. */\n/* v7.91 - Today tidy after full width:', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.93 applied: Where we are on Today, off the tab row, repeats left off')
