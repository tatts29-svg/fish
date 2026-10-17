#!/usr/bin/env python3
r"""v7.95 - Today packed, with jump buttons and folding sections. Author: Andrew Fisher.

Andrew, 2 Oct 2026, on the one-tab Today (v7.93) and the first ideas for it: "We have a lot of dead space in all of them
try again". Measured on a 1,440 px laptop, a quarter of the card area was empty: cards stretched to the tallest in
their row (Today's work, By group, By branch) and the programme card ran the full width with its parts stacked down
the left. He was shown the packed layouts with the numbers and said "Ok" to Packed + folds.

On the screen (paper prints as before; nothing is redrawn, every component is the page's own):
  - the programme card lays its parts across its width at 1,100 px and wider: the day and its bar | the next milestone |
    the key dates;
  - at 900 px and wider, Today's work, By group and By branch pack at their natural height, like bricks, instead of
    standing in rows stretched to the tallest; each card keeps its place as it opens a fold or the window changes;
  - By branch, Money and On site fold to one line each, in the page's own words, and open with a press; By group and
    the trade-by-trade detail stay as they were; Print opens every fold for the paper and closes them again after;
  - a row of buttons under the Today heading goes straight to Today, Today's work, By group, By branch, Money, On site
    and Trade by trade, opening a fold on the way.

    python3 patch_v795.py <page.html>     (after v7.91 and v7.93, on the live page)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function pack795(' in t: sys.exit('v7.95 already applied')
if 'function wwaEmbed793(' not in t: sys.exit('v7.95 needs v7.93 applied first (patch_v793.py)')

t = rep(t, "const r = renderToday_held(); wwaEmbed793(); return r;",
        "const r = renderToday_held(); wwaEmbed793(); pack795(); return r;", 'pack after Today', p)
t = rep(t, "const r = renderProgress_held(); wwaPlace793(); return r;",
        "const r = renderProgress_held(); wwaPlace793(); pack795(); return r;", 'pack after Where we are', p)

# the jump to By group lands after the packing settles (the cards above it tighten a frame after the draw)
t = rep(t, """  requestAnimationFrame(() => { const m = $('main'), s = pp.querySelector('.dsn > h3.sec');
   if (m && s) m.scrollTop += s.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; }); }""",
        """  land795(() => pp.querySelector('.dsn > h3.sec')); } /* v7.95 - lands after the packing settles */""", 'jump lands after packing', p)

JS = r"""/* v7.95 - Today packed, with jump buttons and folding sections (Andrew, 2 Oct 2026: "We have a lot of dead space in all
   of them try again"). Runs after every draw of Today and of the Where we are inside it. Nothing here redraws a card:
   the cards are moved into folds or given a height to pack by, nothing more. */
/* the folds a person has opened stay open through the redraws the record makes (held on the function, so a draw during start-up finds it) */
function folds795(){ return folds795.s || (folds795.s = new Set()); }
function pack795(){
 const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress');
 if (!T || !pp || pp.parentElement !== T) return;
 const dsn = pp.querySelector(':scope > .dsn'); if (!dsn) return;
 fold795(dsn); jump795(T, pp, dsn);
 brick795([T.querySelector(':scope > .hub'), dsn.querySelector('.groups:not(.branches)'), dsn.querySelector('.groups.branches')].filter(Boolean));
 if (!pack795.print) { pack795.print = true; /* paper cannot be pressed open: every fold opens for the print and closes after */
  window.addEventListener('beforeprint', () => { pack795.shut = [...document.querySelectorAll('details.fold95:not([open])')]; pack795.shut.forEach(d => { d.dataset.print = '1'; d.open = true; }); });
  window.addEventListener('afterprint', () => { (pack795.shut || []).forEach(d => { d.open = false; delete d.dataset.print; }); pack795.shut = []; }); }
}
/* By branch, Money and On site fold to one line in the page's own words; By group stays open */
function fold795(dsn){
 const wrap = (name, head, parts, words) => {
  const d = document.createElement('details'); d.className = 'fold95'; d.dataset.fold = name; d.open = folds795().has(name);
  const s = document.createElement('summary'); s.innerHTML = `<b>${esc(name)}</b><span>${esc(words)}</span><i>Open</i>`; d.appendChild(s);
  head.before(d); parts.forEach(x => x && d.appendChild(x));
  d.addEventListener('toggle', () => { if (d.dataset.print) return; if (d.open) folds795().add(name); else folds795().delete(name);
   if (d.open && brick795.span) requestAnimationFrame(() => d.querySelectorAll('.mas95 > *').forEach(brick795.span)); }); /* a fold opening packs what it holds */
 };
 [...dsn.querySelectorAll(':scope > h3.sec')].forEach(h => {
  const name = (h.firstChild && h.firstChild.textContent || '').trim(); if (!name || name === 'By group') return;
  const body = h.nextElementSibling, sub = h.querySelector('span');
  let words = sub ? sub.textContent.trim() : '';
  if (name === 'By branch' && body) { const n = body.children.length, all = body.firstElementChild && /all branches/i.test(body.firstElementChild.textContent);
   words = (all ? `${n - 1} branch${n - 1 === 1 ? '' : 'es'} and all of them together` : `${n} branch${n === 1 ? '' : 'es'}`) + (words ? ' · ' + words : ''); }
  wrap(name, h, [h, body], words);
 });
 const out = dsn.querySelector(':scope > .out'); if (out) wrap('On site', out, [out], 'what has gone out, by date');
}
/* the buttons under the Today heading: straight to each part, opening a fold on the way */
function jump795(T, pp, dsn){
 const head = T.querySelector(':scope > .acts793 .head'); if (!head) return;
 const old = head.querySelector('.jump95'); if (old) old.remove();
 const byGroup = [...dsn.querySelectorAll(':scope > h3.sec')].find(h => /^By group/.test(h.textContent.trim()));
 const to = [['Today', T.querySelector(':scope > .acts793')], ['Today’s work', T.querySelector(':scope > .sec793')], ['By group', byGroup],
  ['By branch', dsn.querySelector('details.fold95[data-fold="By branch"]')], ['Money', dsn.querySelector('details.fold95[data-fold="Money"]')],
  ['On site', dsn.querySelector('details.fold95[data-fold="On site"]')], ['Trade by trade', pp.querySelector('details.pdetail')]].filter(x => x[1]);
 const nav = document.createElement('nav'); nav.className = 'jump95'; nav.setAttribute('aria-label', 'Go to a part of Today');
 to.forEach(([n, el]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'jb95'; b.textContent = n;
  b.onclick = () => { if (el.tagName === 'DETAILS' && !el.open) el.open = true; land795(() => el); };
  nav.appendChild(b); });
 head.appendChild(nav);
}
/* bring a part of Today to the top of the view and hold it there while the packing settles around it (up to 2 s);
   a person scrolling, pressing a key or touching the page takes over at once */
function land795(find){
 const m = $('main'); if (!m) return;
 let stop = false, still = 0; const t0 = performance.now();
 const quit = () => { stop = true; }; ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(e => window.addEventListener(e, quit, {once: true, passive: true}));
 const tick = () => { if (stop) return; const el = find(); if (!el) return;
  const d = el.getBoundingClientRect().top - m.getBoundingClientRect().top - 12;
  if (Math.abs(d) > 3) { const before = m.scrollTop; m.scrollTop += d; still = m.scrollTop === before ? still + 1 : 0; } else still++;
  if (still < 12 && performance.now() - t0 < 2000) requestAnimationFrame(tick); };
 requestAnimationFrame(tick);
}
/* cards pack at their own height: each is given the number of 2 px rows it needs, and keeps it up to date as it changes.
   The heights come from the browser's own resize report, all at once after its layout, so packing never makes it
   measure card by card while Today draws. */
function brick795(boxes){
 const rows = h => String(Math.max(1, Math.ceil((h + 14) / 2)));
 const span = brick795.span = k => { if (k.closest('details:not([open])')) return; /* a closed fold has no height to pack by; it packs as it opens */
  k.style.setProperty('--sp95', rows(k.getBoundingClientRect().height)); };
 const ro = typeof ResizeObserver === 'function' ? (brick795.ro || (brick795.ro = new ResizeObserver(es => es.forEach(e => {
  if (e.target.closest('details:not([open])')) return;
  const b = e.borderBoxSize && e.borderBoxSize[0]; const h = b ? b.blockSize : e.contentRect.height; if (h > 0) e.target.style.setProperty('--sp95', rows(h)); })))) : null;
 if (ro) ro.disconnect();
 boxes.forEach(b => { b.classList.add('mas95'); [...b.children].forEach(k => { if (ro) ro.observe(k, {box: 'border-box'}); else span(k); }); });
}
"""
t = rep(t, "function liveMapKey(){", JS + "function liveMapKey(){", 'v7.95 code', p)

CSS = """/* v7.95 - Today packed, with jump buttons and folding sections ("We have a lot of dead space in all of them try again") */
 @media screen{
  #pane-today .jump95{display:flex;flex-wrap:wrap;gap:6px}
  #pane-today .jb95{font:inherit;font-weight:700;font-size:13px;padding:7px 12px;border-radius:999px;color:var(--ink,#14181d);background:var(--paper,#fff);border:1px solid var(--rule,#e4e0dc);cursor:pointer;min-height:36px}
  #pane-today .jb95:first-child{background:#ff6a13;border-color:#ff6a13;color:#fff}
  #pane-today .jb95:hover,#pane-today .jb95:focus-visible{border-color:#ff6a13}
  #pane-today details.fold95{background:var(--paper,#fff);border:1px solid var(--rule,#e4e0dc);border-radius:14px;margin:0 0 12px;padding:0 14px}
  #pane-today details.fold95 > summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:14px;padding:14px 4px;min-height:24px}
  #pane-today details.fold95 > summary::-webkit-details-marker{display:none}
  #pane-today details.fold95 > summary b{font-size:17px;font-weight:800;color:var(--ink,#14181d);white-space:nowrap}
  #pane-today details.fold95 > summary span{color:var(--mute,#4b535b);font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #pane-today details.fold95 > summary i{font-style:normal;font-weight:800;font-size:12px;letter-spacing:.08em;color:#b34a0d;text-transform:uppercase}
  #pane-today details.fold95 > summary i::after{content:" \\25BE"}
  #pane-today details.fold95[open] > summary i{visibility:hidden}
  #pane-today details.fold95[open] > summary{border-bottom:1px solid var(--rule,#e4e0dc);margin-bottom:10px}
  #pane-today details.fold95 > h3.sec{display:none!important}
 }
 @media screen and (min-width:900px){
  #pane-today .mas95{display:grid!important;grid-auto-rows:2px!important;row-gap:0!important;column-gap:14px!important;grid-auto-flow:row dense!important;align-items:start!important}
  #pane-today .hub.mas95{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))!important}
  #pane-today .mas95 > *{align-self:start!important;height:auto!important;margin:0 0 14px!important;flex:none!important;grid-row-end:span var(--sp95,1)}
  #pane-today .money-grid{align-items:start}
 }
 @media screen and (min-width:1100px){
  #pane-today .inst > .racecard{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr);column-gap:22px;align-items:start}
  #pane-today .inst > .racecard > .phead{grid-column:1/-1}
  #pane-today .inst > .racecard > .pgm{grid-column:1}
  #pane-today .inst > .racecard > .pnext{grid-column:2;margin-top:0!important}
  #pane-today .inst > .racecard > .pkeys{grid-column:3;margin-top:0!important;border-top:0!important;padding-top:0!important}
 }
 @media print{ #pane-today details.fold95 > summary{display:none!important} }"""
A = "/* v7.93 - Today and Where we are on one tab: the repeats are left off on the screen (paper prints as before) */"
t = rep(t, A, CSS + "\n" + A, 'v7.95 css', p)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.95 applied: Today packed, jump buttons, folding sections')
