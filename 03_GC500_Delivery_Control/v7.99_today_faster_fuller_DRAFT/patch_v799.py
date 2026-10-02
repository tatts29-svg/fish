#!/usr/bin/env python3
r"""v7.99 - Today opens faster, and its cards fill their columns. Author: Andrew Fisher.

The follow-ups Codex measured on live v7.96 and handed over (2 Oct 2026): "By group 19.1% empty, expanded By branch
33.2%; combined Today/Equipment tab opening slower than separate live tabs". Andrew: "We have a lot of dead space",
"Layout needs to be perfection now". Nothing is redrawn and no figure changes; this is the same page, drawn with less
work and packed tighter.

Faster
  - The money figures are worked out once per draw, not twice. Today's own cards asked for them as "today" and Where
    we are asked for them by today's date; the memo kept the two apart, so the whole money summary ran twice on every
    opening. The two are the same day, so they now share one result (moneySummary_ only ever reads the day).
  - By branch and On site are drawn when they are opened. They sit folded on Today; their plates are worked out the
    first time someone opens them, and for paper (print opens every fold, so it draws them first). The fold's line still
    says how many branches there are.

Fuller
  - The packed cards (Today's work, By group, By branch) are placed where they fit best, not strictly in page order:
    each card goes to the column that keeps the bottom edge most even. Cards keep their own size and look.
  - A card left alone at the bottom with an empty column beside it widens into that column, so a hole does not open
    up under the two-wide plate next to it (the last plate in By branch).

    python3 patch_v799.py <page.html>     (on live v7.96)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function place799(' in t: sys.exit('v7.99 already applied')
if 'function eq796(' not in t: sys.exit('v7.99 needs v7.96 (live from 2 Oct 2026)')

# 1. one money summary per draw: "no day" and today's date are the same day
t = rep(t, "function moneySummary(asOf){\n const mk = 'money:' + (asOf || ''); if (RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk); const v = moneySummary_(asOf); RENDER_MEMO.set(mk, v); return v; }",
        "function moneySummary(asOf){\n const day = asOf || todayIso(); /* v7.99 - no day and today's date are one day: one summary per draw, not two */\n const mk = 'money:' + day; if (RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk); const v = moneySummary_(day); RENDER_MEMO.set(mk, v); return v; }",
        'one money summary per draw', p)

# 2. By branch and On site are drawn when opened (and for paper)
H3 = '<h3 class="sec">By branch <span>who gets the revenue, and what each branch charges the V8s — the contracts by the rate and the charge lines by kind</span></h3>'
t = rep(t, "function dsnBranches(asOf, X){\n const R = branchRollup(asOf, X);\n",
        "function dsnBranches(asOf, X){\n const R = branchRollup(asOf, X);\n"
        " if (lazy799('By branch')) { /* v7.99 - folded on Today: the plates are drawn when it opens; the fold's line still counts the branches */\n"
        "  const n = 1 + R.branches.length + (R.none && (R.none.lines.length || R.none.costs.length || (R.none.ours && R.none.ours.lines.length)) ? 1 : 0);\n"
        "  return `" + H3 + "<div class=\"groups branches lazy799\" data-count799=\"${n}\"></div>`; }\n",
        'By branch drawn when opened', p)
if H3 not in t: sys.exit('By branch heading changed - check the lazy copy of it')
t = rep(t, "function dsnOut(asOf){\n const rows = ONHIRE_ROWS.filter(r => r.start_date && r.start_date <= asOf);\n",
        "function dsnOut(asOf){\n const rows = ONHIRE_ROWS.filter(r => r.start_date && r.start_date <= asOf);\n"
        " if (rows.length && lazy799('On site')) return '<div class=\"out lazy799\"></div>'; /* v7.99 - folded on Today: drawn when it opens */\n",
        'On site drawn when opened', p)
t = rep(t, "const n = body.children.length, all = body.firstElementChild && /all branches/i.test(body.firstElementChild.textContent);",
        "const n = body.dataset.count799 ? +body.dataset.count799 : body.children.length, all = body.dataset.count799 ? true : body.firstElementChild && /all branches/i.test(body.firstElementChild.textContent); /* v7.99 */",
        'fold line counts a folded By branch', p)

# 3. packed cards placed where they fit best
t = rep(t, "k.style.setProperty('--sp95', rows(k.getBoundingClientRect().height)); };",
        "k.style.setProperty('--sp95', rows(k.getBoundingClientRect().height)); place799Soon(k.parentElement); };", 'place after a fold opens', p)
t = rep(t, "if (h > 0) e.target.style.setProperty('--sp95', rows(h)); })))) : null;",
        "if (h > 0) { e.target.style.setProperty('--sp95', rows(h)); place799Soon(e.target.parentElement); } })))) : null;", 'place after a size report', p)
# a jump button finds its part when pressed: a fold drawn as it opens is a new element, and the button made before it
# must not hold the old one
t = rep(t, " b.onclick = () => { if (el.tagName === 'DETAILS' && !el.open) el.open = true; land795(() => el); };",
        " b.onclick = () => { const cur = () => el.isConnected ? el : jump799(n); const e0 = cur(); if (e0 && e0.tagName === 'DETAILS' && !e0.open) { e0.dataset.jump799 = '1'; e0.open = true; } land795(cur); }; /* v7.99 */",
        'jump buttons find their part when pressed', p)
t = rep(t, "boxes.forEach(b => { b.classList.add('mas95'); [...b.children].forEach(k => { if (ro) ro.observe(k, {box: 'border-box'}); else span(k); }); });",
        "boxes.forEach(b => { b.classList.add('mas95'); [...b.children].forEach(k => { if (ro) ro.observe(k, {box: 'border-box'}); else span(k); }); place799Soon(b); });", 'place after packing', p)

JS = r"""/* v7.99 - Today opens faster, and its cards fill their columns (Codex's measured follow-ups on v7.96; Andrew: "We have a
   lot of dead space", "Layout needs to be perfection now"). Nothing is redrawn and no figure changes. */
/* By branch and On site are folded on Today: drawn when opened, and for paper */
function lazy799(name){
 return state.tab === 'today' && !lazy799.full && typeof folds795 === 'function' && !folds795().has(name)
  && !document.body.classList.contains('printing-progress');
}
document.addEventListener('toggle', e => { /* toggle does not bubble; this listens on the way down */
 const d = e.target; if (!d || !d.matches || !d.matches('details.fold95') || !d.open || d.dataset.print || !d.querySelector('.lazy799')) return;
 requestAnimationFrame(() => { if (state.tab !== 'today' || !d.isConnected || !d.querySelector('.lazy799')) return;
  /* the folds as they are on the page now: one opened in the same moment may not have told v7.95 yet */
  document.querySelectorAll('#pane-today details.fold95').forEach(x => { if (x.dataset.print) return; if (x.open) folds795().add(x.dataset.fold); else folds795().delete(x.dataset.fold); });
  const name = d.dataset.fold, s0 = d.querySelector('summary'), had = d.contains(document.activeElement);
  const off = s0 && !d.dataset.jump799 ? s0.getBoundingClientRect().top : null; /* a jump button brings its part to the top itself */
  renderProgress();
  const find = () => { const x = jump799(name); return x && x.querySelector('summary'); };
  if (had) { const s1 = find(); if (s1) s1.focus({preventScroll: true}); } /* the press stays where it was: same place on screen, same focus */
  if (off != null) hold799(find, off); });
}, true);
/* keep a part at the same place on screen while the redrawn cards measure and pack around it (up to 1.5 s); a person
   scrolling, pressing a key or touching the page takes over at once */
function hold799(find, off){
 const m = $('main'); if (!m) return;
 let stop = false, still = 0; const t0 = performance.now(), quit = () => { stop = true; };
 ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(e => window.addEventListener(e, quit, {once: true, passive: true}));
 const tick = () => { if (stop) return; const el = find(); if (!el) return;
  const dd = el.getBoundingClientRect().top - off;
  if (Math.abs(dd) > 1) { const before = m.scrollTop; m.scrollTop += dd; still = m.scrollTop === before ? still + 1 : 0; } else still++;
  if (still < 10 && performance.now() - t0 < 1500) requestAnimationFrame(tick); };
 tick();
}
window.addEventListener('beforeprint', () => { /* registered before v7.95's, so the folds it opens for paper are already drawn */
 const pp = document.getElementById('pane-progress'); /* only Today's own paper: a print from another tab leaves Where we are (and the list it sets) alone */
 if (state.tab !== 'today' || !pp || !pp.parentElement || pp.parentElement.id !== 'pane-today' || !pp.querySelector('.lazy799')) return;
 lazy799.full = true; try { renderProgress(); } finally { lazy799.full = false; }
});
function jump799(n){ /* the part a jump button names, as the page is now */
 const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress'); if (!T || !pp) return null;
 if (n === 'Today') return T.querySelector(':scope > .acts793');
 if (n === 'Today’s work') return T.querySelector(':scope > .sec793');
 if (n === 'By group') return [...pp.querySelectorAll('.dsn > h3.sec')].find(h => /^By group/.test(h.textContent.trim())) || null;
 if (n === 'Trade by trade') return pp.querySelector('details.pdetail');
 return pp.querySelector(`details.fold95[data-fold="${n}"]`);
}
/* Packed cards: each goes to the column that keeps the bottom edge most even. Rows are v7.95's 2 px rows, and each card
   keeps the height the browser reports for it. A card alone at the bottom with an empty column beside it widens into it. */
function place799Soon(box){
 if (!box) return; (place799.q || (place799.q = new Set())).add(box);
 if (place799.raf) return;
 place799.raf = requestAnimationFrame(() => { place799.raf = 0; const q = [...place799.q]; place799.q.clear(); q.forEach(b => { try { place799(b); } catch (e) {} }); });
}
function place799(box){
 if (!box || !box.isConnected || !box.classList.contains('mas95') || box.closest('details:not([open])')) return;
 const cs = getComputedStyle(box), kids = [...box.children];
 const unplace = () => kids.forEach(k => { delete k.dataset.p799; }); /* the places live in screen-only variables (CSS below): paper never sees them */
 if (cs.display !== 'grid' || cs.gridAutoRows !== '2px') { unplace(); return; }
 unplace(); /* a place set for a wider window would add tracks of its own: count the real ones */
 const C = cs.gridTemplateColumns.split(' ').filter(Boolean).length; if (C < 2) return;
 if (box.dataset.c799 !== String(C)) { kids.forEach(k => { delete k.dataset.wide799; }); box.dataset.c799 = String(C); } /* a new column count decides widening afresh */
 const items = [];
 for (const k of kids) {
  if (!k.getClientRects().length) continue; /* a card the screen hides takes no place */
  const h = parseInt(k.style.getPropertyValue('--sp95'), 10); if (!(h > 0)) return; /* not measured yet: the next report places it */
  if (k.dataset.span799 == null) { const g = getComputedStyle(k), m = (g.gridColumnStart + ' ' + g.gridColumnEnd).match(/span (\d+)/); k.dataset.span799 = m ? m[1] : '1'; } /* "grid-column: span 2" is a start of span 2 */
  items.push({k, h, s: Math.min(C, +k.dataset.span799 + (k.dataset.wide799 ? 1 : 0))});
 }
 if (!items.length) return;
 const sig = C + '|' + items.map(it => it.h + 'x' + it.s).join(','), was = (place799.memo || (place799.memo = new WeakMap())).get(box);
 if (was && was.sig === sig && was.ks.length === items.length && was.ks.every((k, i) => k === items[i].k)) { was.put(); return; } /* nothing changed: the same places */
 /* the even-bottom search: depth first, nearest-top choice first, so the first answer is the plain packing and only a
    strictly lower bottom edge replaces it. Bounded, so a long list never stalls a frame. */
 const n = items.length, cols = new Array(C).fill(0), at = [];
 let best = null, bestMax = Infinity, nodes = 0;
 const dfs = i => {
  if (++nodes > 30000) return; let m = 0; for (const v of cols) if (v > m) m = v; if (m >= bestMax) return;
  if (i === n) { bestMax = m; best = at.slice(); return; }
  const {h, s} = items[i], opts = [];
  for (let c = 0; c + s <= C; c++) { let top = 0; for (let j = c; j < c + s; j++) if (cols[j] > top) top = cols[j]; opts.push([top, c]); }
  opts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [top, c] of opts) {
   const keep = cols.slice(c, c + s); for (let j = c; j < c + s; j++) cols[j] = top + h;
   at.push([c, top]); dfs(i + 1); at.pop();
   for (let j = c; j < c + s; j++) cols[j] = keep[j - c];
   if (nodes > 30000) return;
  }
 };
 dfs(0);
 if (!best) return;
 const bottom = new Array(C).fill(0);
 best.forEach(([c, top], i) => { for (let j = c; j < c + items[i].s; j++) bottom[j] = Math.max(bottom[j], top + items[i].h); });
 const places = [];
 best.forEach(([c, top], i) => {
  const it = items[i]; let col = c;
  if (!it.k.dataset.wide799 && it.s < C) { /* alone at the bottom, with an empty column beside it from its top down */
   const last = [...Array(it.s).keys()].every(j => bottom[c + j] === top + it.h), hole = j => j >= 0 && j < C && bottom[j] <= top && bestMax - bottom[j] >= 40;
   if (last && hole(c + it.s)) { it.k.dataset.wide799 = '1'; it.s++; bottom[c + it.s - 1] = top + it.h; }
   else if (last && hole(c - 1)) { it.k.dataset.wide799 = '1'; it.s++; col = c - 1; bottom[col] = top + it.h; }
  }
  places.push([it.k, `${col + 1} / span ${it.s}`, String(top + 1)]);
 });
 const put = () => places.forEach(([k, c, r]) => { k.style.setProperty('--c799', c); k.style.setProperty('--r799', r); k.dataset.p799 = '1'; });
 put(); place799.memo.set(box, {sig: C + '|' + items.map(it => it.h + 'x' + it.s).join(','), ks: items.map(it => it.k), put});
}
window.addEventListener('resize', () => document.querySelectorAll('#pane-today .mas95').forEach(place799Soon));
"""
t = rep(t, "function liveMapKey(){", JS + "function liveMapKey(){", 'v7.99 code', p)
CSS = """/* v7.99 - packed cards placed to fit, on the screen only (paper lays the cards out as it always has) */
 @media screen and (min-width:900px){ #pane-today .mas95 > [data-p799]{grid-column:var(--c799)!important;grid-row-start:var(--r799)!important} }"""
A = "/* v7.96 - Plant and Inventory as one Equipment tab */\n @media screen{"
t = rep(t, A, CSS + "\n" + A, 'v7.99 css', p)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.99 applied: Today faster (one money summary, folded sections drawn when opened); packed cards placed to fit')
