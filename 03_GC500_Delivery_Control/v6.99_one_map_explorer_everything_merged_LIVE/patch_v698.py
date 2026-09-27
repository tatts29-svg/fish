#!/usr/bin/env python3
"""v6.98 - the Map tab IS the Satellite Plan Explorer.

Andrew Fisher, 27 Sep 2026: "when u click maps it opens up satellite plan explorer", "I want to make sure we cover all
those options on that page" (Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof; and inside it Plan /
Sat + plan / Satellite), "We need to make sure this talks to everything else", "No load lag ... No downtime. Easy to
navigate quick and fast".

- The Map tab opens on the explorer (#sheet/__explorer), inside the page, with the four options above it; a link or
  a search that asks for a sheet still goes there. Off the hosted service (no explorer) it falls back to Satellite · 3D.
- It stays loaded. The explorer's frame is made once and kept: a redraw of the tab leaves it alone, switching to
  another view parks it (moveBefore, where the browser has it, moves a frame without reloading it), and coming back
  is instant. It is warmed in the background once the dashboard is idle, so the first press on Map is not a load.
- It talks to everything: picking a reference in the explorer opens that reference's drawer; a search for a reference
  on the master, and "Plan explorer" on a pin's menu, fly the explorer to it; its Find chips are the Map's own
  numbers (gc500PlanItems, v6.96).
- Full screen from the toolbar (Esc leaves), on a phone as well.
Build on v6.96 (which is on v6.97 live, with or without v6.93/v6.94).   python3 patch_v698.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* v6.98 - the Map tab is the Satellite Plan Explorer (see patch_v698.py for Andrew's words) */
const SAT_EXPLORER = '__explorer';
const EXP = {frame: null, loaded: false, pending: null, tries: 0};
function expOn(){ return typeof machineHosted === 'function' && machineHosted(); }
function expUrl(find){ return SYNC.backend.machineUrl() + 'explorer/index.html?embed=1&back=' + (typeof canEdit === 'function' && canEdit() ? 'e' : 'v') + (find ? '&find=' + encodeURIComponent(find) : ''); }
function expFrame(find){
 if (EXP.frame) return EXP.frame;
 const f = document.createElement('iframe');
 f.id = 'expFrame'; f.title = 'Satellite plan explorer'; f.src = expUrl(find); f.allow = 'fullscreen'; f.setAttribute('allowfullscreen', '');
 f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
 if (find) EXP.pending = null;
 f.addEventListener('load', () => { EXP.loaded = true; const w = document.querySelector('#expwrap>.expwait'); if (w) w.hidden = true; expFlush(); });
 EXP.frame = f; return f;
}
function expPark(){
 let p = document.getElementById('expPark');
 if (!p) { p = document.createElement('div'); p.id = 'expPark'; p.setAttribute('aria-hidden', 'true'); document.body.appendChild(p); }
 return p;
}
/* move without a reload where the browser can (moveBefore keeps a frame's page alive); where it cannot, a frame that has
   to leave the tab is let go and made again on the way back, which is a reload from the browser's cache */
function expMove(to){
 const f = EXP.frame; if (!f || f.parentElement === to) return;
 if (f.isConnected && typeof to.moveBefore === 'function') { try { to.moveBefore(f, null); return; } catch (e) {} }
 if (f.isConnected) { f.remove(); EXP.frame = null; EXP.loaded = false; const g = expFrame(EXP.pending); to.appendChild(g); return; }
 to.appendChild(f);
}
function expStash(){
 const f = EXP.frame; if (!f || !f.isConnected || (f.parentElement && f.parentElement.id === 'expPark')) return;
 if (typeof document.body.moveBefore === 'function') expMove(expPark()); else { f.remove(); EXP.frame = null; EXP.loaded = false; }
}
/* warm it: once the dashboard is idle, the explorer loads out of sight, so pressing Map shows it at once */
function expWarm(){
 if (!expOn() || EXP.frame || typeof document.body.moveBefore !== 'function') return;
 const c = navigator.connection; if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
 expPark().appendChild(expFrame());
}
function expApi(){ try { const w = EXP.frame && EXP.frame.contentWindow; return w && (w.GC500Explorer || null) ? w : null; } catch (e) { return null; } }
function expFlush(){
 const k = EXP.pending; if (!k) return;
 const w = expApi();
 const done = () => { EXP.pending = null; EXP.tries = 0; };
 try {
  if (w && w.GC500Explorer && typeof w.GC500Explorer.find === 'function' && (w.__ready || w.GC500Explorer.ready)) { w.GC500Explorer.find(k); done(); return; }
  if (w && w.__ready && typeof w.selectCode === 'function') { w.selectCode(k); done(); return; }
 } catch (e) {}
 if (++EXP.tries < 150) setTimeout(expFlush, 200); else done();
}
/* the explorer's side: a reference picked on the plan opens its drawer here */
window.gc500ExplorerPicked = function(code){ try { const k = String(code || ''); if (k && allAssets().some(a => a.key === k)) openAsset(k); } catch (e) {} };
function expFind(key){
 if (!expOn()) return false;
 EXP.pending = key; state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; state.found = null;
 if (typeof MACHINE !== 'undefined' && MACHINE.open && typeof machineClose === 'function') machineClose();
 go('map'); renderMap(); expFlush(); return true;
}
function expTools(){
 return `${liveMapPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_BOARD}">Satellite · pins</button>` : ''}
 ${sat3dPossible() ? `<button class="btn sheetbtn satbtn" data-sheet="${SAT_3D}">Satellite · 3D</button>` : ''}
 <button class="btn sheetbtn satbtn primary" data-sheet="${SAT_EXPLORER}" aria-pressed="true">Plan on satellite</button>
 <button class="btn sheetbtn satbtn" type="button" data-mopen="proof3d">3D proof</button>
 <button class="btn expfullbtn" type="button" id="expFull" aria-pressed="false" title="Full screen (Esc to leave)">Full screen</button>`;
}
function expSize(){
 const w = document.getElementById('expwrap'); if (!w) return;
 if (w.closest('.expfull')) { w.style.height = Math.max(240, Math.round((window.innerHeight || 800) - w.getBoundingClientRect().top - 10)) + 'px'; return; }
 const vh = window.innerHeight || 800, phone = window.matchMedia && matchMedia('(max-width:640px)').matches;
 w.style.height = Math.max(phone ? 440 : 520, Math.round(vh - (phone ? 96 : 118))) + 'px';
}
function expFullToggle(on){
 const c = document.getElementById('expcard'); if (!c) return;
 const v = on === undefined ? !c.classList.contains('expfull') : !!on;
 c.classList.toggle('expfull', v); document.body.classList.toggle('expfull-on', v);
 const b = document.getElementById('expFull'); if (b) { b.setAttribute('aria-pressed', String(v)); b.textContent = v ? 'Exit full screen' : 'Full screen'; }
 expSize();
}
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && document.body.classList.contains('expfull-on')) expFullToggle(false); });
window.addEventListener('resize', () => expSize());
function renderExplorerTab(){
 const pane = $('#pane-map');
 let card = pane.querySelector('#expcard');
 if (!card) {
  pane.innerHTML = paneHeadingHtml('map') + `<div class="card mapcard expcard" id="expcard">
 <div class="maptools exptools">${expTools()}</div>
 <div class="expwrap" id="expwrap"><div class="expwait">Opening the plan explorer…</div></div></div>`;
  card = pane.querySelector('#expcard');
  card.querySelectorAll('[data-sheet]').forEach(b => b.onclick = () => {
   if (b.dataset.sheet === SAT_EXPLORER) return;
   expFullToggle(false); state.sheet = b.dataset.sheet; state.zoom = 1; state.ox = 0; state.oy = 0; renderMap(); });
  const fb = card.querySelector('#expFull'); if (fb) fb.onclick = () => expFullToggle();
 }
 const wrap = card.querySelector('#expwrap');
 if (!EXP.frame) wrap.appendChild(expFrame(EXP.pending)); else expMove(wrap);
 const wt = wrap.querySelector('.expwait'); if (wt) wt.hidden = !!EXP.loaded;
 setHash('sheet/' + SAT_EXPLORER, {replace: location.hash === '#map' || /^#sheet\//.test(location.hash)});
 expSize(); expFlush();
}
if ('requestIdleCallback' in window) requestIdleCallback(() => setTimeout(expWarm, 1500), {timeout: 6000}); else setTimeout(expWarm, 4000);
"""

CSS = """
/* v6.98 - the Map tab is the Satellite Plan Explorer */
.expcard{padding:10px 12px 12px}
.exptools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.exptools .expfullbtn{margin-left:auto}
.expwrap{position:relative;border-radius:12px;overflow:hidden;background:#101214;border:1px solid var(--rule);height:70vh;min-height:420px;contain:strict}
.expwrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#101214}
.expwait{position:absolute;inset:0;display:grid;place-items:center;color:#c9cfd2;font:600 14px/1.4 inherit;letter-spacing:.2px}
#expPark{position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1}
#expPark iframe{width:1280px;height:800px;border:0}
.expcard.expfull{position:fixed;inset:0;z-index:80;margin:0;border-radius:0;display:flex;flex-direction:column;padding:8px 10px 10px;background:var(--paper)}
.expcard.expfull .expwrap{min-height:0}
body.expfull-on{overflow:hidden}
body.expfull-on #pane-map{transform:none !important;animation:none !important;filter:none !important}   /* the pane's arrival leaves a transform, which would hold a fixed layer inside it */
@media(max-width:640px){ .exptools .sheetbtn{flex:1 1 calc(50% - 8px);justify-content:center;display:inline-flex;min-height:44px} .exptools .expfullbtn{flex:1 1 100%;margin-left:0;min-height:40px} .expcard{padding:8px} }
"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'SAT_EXPLORER' in t: sys.exit('v6.98 already applied')
    if 'mapBarSheets' not in t: sys.exit('apply v6.96 first')
    t = rep(t, "const SAT_3D = '__satellite3d';", "const SAT_3D = '__satellite3d';\n" + JS, 'code', path, need)
    # the Plan on satellite button, everywhere it is, opens the explorer in the tab rather than over the page
    a_ = '<button class="btn sheetbtn satbtn" type="button" data-mopen="explorer">Plan on satellite</button>'
    if t.count(a_) != 3: sys.exit('Plan on satellite buttons: %d' % t.count(a_))
    t = t.replace(a_, '<button class="btn sheetbtn satbtn" data-sheet="${SAT_EXPLORER}">Plan on satellite</button>')
    # the default view: the explorer where it is served; a found reference on the master goes to the explorer too
    old = "state.sheet = sat3dPossible() ? SAT_3D : SAT_BOARD; }"
    if t.count(old) != 1: sys.exit('default line: %d' % t.count(old))
    t = t.replace("(sat3dPossible() || liveMapPossible())) { state.mapMasterSeen = true; " + old,
                  "(expOn() || sat3dPossible() || liveMapPossible())) { state.mapMasterSeen = true; state.sheet = expOn() ? SAT_EXPLORER : sat3dPossible() ? SAT_3D : SAT_BOARD; }", 1)
    if 'state.sheet = expOn() ? SAT_EXPLORER' not in t: sys.exit('default line not replaced')
    t = rep(t, " if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }",
            " if (state.sheet === SAT_EXPLORER && expOn()) { renderExplorerTab(); return; }   /* v6.98 */\n"
            " expStash(); if (state.sheet === SAT_EXPLORER) state.sheet = null;\n"
            " if (state.sheet === SAT_BOARD && liveMapPossible()) { renderSatBoard(); return; }", 'render', path, need)
    t = rep(t, "(m[1] === SAT_3D && sat3dPossible())) { state.sheet = m[1];",
            "(m[1] === SAT_3D && sat3dPossible()) || (m[1] === SAT_EXPLORER && expOn())) { state.sheet = m[1];", 'hash', path, need)
    # talks to everything: a pin's "Plan explorer" and a search for a reference on the master fly the explorer to it
    t = rep(t, "else if (act === 'explorer') { MACHINE.find = key; machineOpen('explorer'); }",
            "else if (act === 'explorer') { if (!expFind(key)) { MACHINE.find = key; machineOpen('explorer'); } }", 'pin menu', path, need)
    t = rep(t, "if (act === 'plan') { state.fview = null; mapLocate(place.sheet.key, place.label, key, {marker: place.marker}); }",
            "if (act === 'plan') { state.fview = null; mapLocate(place.sheet.key, place.label, key, {marker: place.marker, sheetOnly: true}); }", 'pin plan', path, need)
    t = rep(t, "function mapLocate_held(sheetKey, label, key, opts){",
            "function mapLocate_held(sheetKey, label, key, opts){\n"
            " if (!(opts && opts.sheetOnly) && key && typeof MASTER_LOC !== 'undefined' && MASTER_LOC[key] && MASTER_LOC[key].pt && expOn() && expFind(key)) return;   /* v6.98 - the explorer is the map */", 'locate', path, need)
    k = t.find('</style>'); t = t[:k] + CSS + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
