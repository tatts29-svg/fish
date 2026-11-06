#!/usr/bin/env python3
"""v6.69b - THE REGISTER OPENS AT ONCE AND FILLS IN BEHIND; THE BOARD LIGHTS A FRAME LATER.

  Plant: the first two dozen rows are drawn with the page; the rest follow in small batches between frames, each batch
  well inside one frame, so the page is on the screen and answering a tap straight away. Arriving part-way down the
  page (a remembered position) or printing draws the lot at once, so nothing is ever missing where somebody looks.
  Today / Timeline / Where we are: the amber board's lamps are lit on the next frame instead of inside the page's opening.

  python3 patch_v669b.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402  (same whitespace-tolerant replace)

REST = """/* v6.69 - THE REGISTER OPENS AT ONCE AND FILLS IN BEHIND (Andrew, 26 Sep 2026: "no stalling, no lags... smooth, no
   delay with opening"). Plant drew all 219 rows before it showed anything - half a second of a frozen page on a desk and
   more on a phone. The first two dozen rows are drawn with the page; the rest follow in small batches between frames,
   each well inside one frame, so the page is on screen and answering a tap at once and the rows are all there before
   anybody can scroll to them. Arriving part-way down (a remembered position), a re-draw while scrolled, and printing
   all draw the lot in one go, so nothing is ever missing where somebody is looking. */
let GO_CHANGED = false;
const PLANT_REST = {gen: 0, q: [], budget: 0, on: false};
function plantRows(list, fn){
 if (!PLANT_REST.on) return list.map(fn).join('');
 const now = list.slice(0, Math.max(0, PLANT_REST.budget)); PLANT_REST.budget -= now.length;
 const rest = list.slice(now.length);
 if (!rest.length) return now.map(fn).join('');
 const id = PLANT_REST.q.length; PLANT_REST.q.push({rest, fn, at: 0});
 return now.map(fn).join('') + `<tr class="plrest" data-rest="${id}"><td colspan="9" style="padding:12px 10px;color:var(--mute);font-size:12px">Loading ${rest.length} more…</td></tr>`;
}
function plantBindRow(r){
 r.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => openAsset(b.dataset.eq));
 r.querySelectorAll('[data-k]').forEach(x => x.onclick = ev => { ev.stopPropagation(); openAsset(x.dataset.k); });
 r.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openAsset(b.dataset.open));
 r.querySelectorAll('[data-map]').forEach(b => b.onclick = () => showOnMap(b.dataset.map));
}
/* one batch into the marker's table; true when that table is complete */
function plantFill(pane, job, id, n){
 const mk = pane.querySelector(`tr.plrest[data-rest="${id}"]`); if (!mk) return true;
 const part = job.rest.slice(job.at, job.at + n); job.at += part.length;
 const before = mk.previousElementSibling;
 mk.insertAdjacentHTML('beforebegin', part.map(job.fn).join(''));
 for (let r = before ? before.nextElementSibling : mk.parentNode.firstElementChild; r && r !== mk; r = r.nextElementSibling) plantBindRow(r);
 if (job.at >= job.rest.length) { mk.remove(); return true; }
 const c = mk.firstElementChild; if (c) c.textContent = 'Loading ' + (job.rest.length - job.at) + ' more…';
 return false;
}
function plantPump(){
 const gen = ++PLANT_REST.gen, q = PLANT_REST.q; PLANT_REST.q = []; PLANT_REST.on = false;
 if (!q.length) return;
 const pane = $('#pane-plant'); let qi = 0;
 const step = () => {
  if (gen !== PLANT_REST.gen || !pane.isConnected) return;
  const t0 = performance.now();
  holdAssets(() => { while (qi < q.length && performance.now() - t0 < 10) if (plantFill(pane, q[qi], qi, 6)) qi++; });
  if (qi < q.length) requestAnimationFrame(() => setTimeout(step, 0)); else PLANT_REST.flush = null;
 };
 PLANT_REST.flush = () => { if (gen !== PLANT_REST.gen) return; holdAssets(() => { while (qi < q.length) if (plantFill(pane, q[qi], qi, 1e9)) qi++; }); PLANT_REST.flush = null; };
 requestAnimationFrame(() => setTimeout(step, 0));
}
window.addEventListener('beforeprint', () => { try { if (PLANT_REST.flush) PLANT_REST.flush(); } catch (e) {} });
"""

def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, "const TAB_SCROLL = {};", REST + "const TAB_SCROLL = {};", 'rest fns', path, need)
    t = rep(t, """});
 render();
 if (changed) countUpFigures(tab);""", """});
 GO_CHANGED = changed; try { render(); } finally { GO_CHANGED = false; }
 if (changed) countUpFigures(tab);""", 'go flag', path, need)
    t = rep(t, """function renderPlant(){
 const q = state.q.trim().toLowerCase();""", """function renderPlant(){
 const q = state.q.trim().toLowerCase();
 { const m = $('main'), y = GO_CHANGED ? (TAB_SCROLL.plant || 0) : ((m && m.scrollTop) || 0);
   PLANT_REST.q = []; PLANT_REST.budget = 24; PLANT_REST.on = y < 40 && state.plantView !== 'cards' && !(window.matchMedia && matchMedia('print').matches); }""", 'plant start', path, need)
    t = rep(t, "<tbody>${list.map(a => {", "<tbody>${plantRows(list, a => {", 'rows open', path, need)
    t = rep(t, """}).join('')}</tbody></table></div>`}
 ${isBuilding ?""", """})}</tbody></table></div>`}
 ${isBuilding ?""", 'rows close', path, need)
    t = rep(t, "$('#pane-plant').querySelectorAll('[data-map]').forEach(b => b.onclick = () => showOnMap(b.dataset.map));\n}",
            "$('#pane-plant').querySelectorAll('[data-map]').forEach(b => b.onclick = () => showOnMap(b.dataset.map));\n plantPump();\n}", 'pump', path, need)
    # the board: lit a frame later
    t = rep(t, """ size();
 /* When the board changes size the words are re-sized""", """ /* When the board changes size the words are re-sized""", 'board first size', path, need)
    t = rep(t, """BOARD_RUN.redraw = draw; // so a change of size draws the lamps again, not just the words
 BOARD_RUN.w = Math.round(board.getBoundingClientRect().width);
 draw();""", """BOARD_RUN.redraw = draw; // so a change of size draws the lamps again, not just the words
 /* v6.69 - the words go up with the page; the lamps are lit on the next frame, not in the middle of opening it */
 if (words) { const pages0 = boardPages(asOf, X); if (pages0.length) words.innerHTML = pages0[(fig._page || 0) % pages0.length].lines.map(l => `<div class="${l.cls}">${esc(l.t)}</div>`).join(''); }
 cancelAnimationFrame(BOARD_RUN.raf || 0);
 BOARD_RUN.raf = requestAnimationFrame(() => { BOARD_RUN.raf = 0; if (BOARD_RUN.redraw !== draw || !board.isConnected) return;
  BOARD_RUN.w = Math.round(board.getBoundingClientRect().width); try { draw(); } catch (e) {} });""", 'board defer', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))

patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
