#!/usr/bin/env python3
r"""v7.82 - DONE on the Plan on satellite explorer. Author: Andrew Fisher. Apply to the live explorer/explorer.js (v7.58).

Andrew, 2 Oct 2026: "Once something is complete we need to clearly mark it with an icon that also pulsates in a unique
way - it's done. An easy way so we know what's been done on the map. And it looks good. Clear, easy to understand. Not
too much to confuse people."

A finished unit (the drawer's Complete tick) gets a green tick badge on the plan, and a thin green ring that beats twice
and rests - every 3.2 s, all in step, so the finished part of the site reads as one at a glance. Nothing else on the
map moves like it (a search ring is orange and breathes continuously). One chip turns the layer off and on; the choice
is kept on this device. The list comes from the page (window.parent.gc500DoneKeys, read every 4 s), so a tick shows up
without a reload. The rings sit still while the map is being moved, and come back the moment it stops; reduced motion
keeps the badge and drops the beat.
    python3 patch_explorer782.py <live explorer.js> <out explorer.js>"""
import hashlib, sys
src = open(sys.argv[1], encoding='utf-8').read()
if hashlib.md5(src.encode('utf-8')).hexdigest() != '1407e27035358e02c21f9fa98ca83c6b':
    sys.exit('expected the live v7.58 explorer.js (md5 1407e270...) - review before applying')


def rep(old, new):
    global src
    if src.count(old) != 1: sys.exit('expected once: ' + old[:90])
    src = src.replace(old, new)


# the master plan's items carry nothing new: the done list is read on its own, so a change of tick does not rebuild the plan
rep("function drawMarks(v) {\n  const ctx = mctx; if (!marks.length && !marksDrawn) { placePulse(null); return; } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, mcanvas.width, mcanvas.height); marksDrawn = marks.length > 0;",
    "function drawMarks(v) {\n  const dn = done782List(); /* v7.82 */\n  const ctx = mctx; if (!marks.length && !dn.length && !marksDrawn) { placePulse(null); done782Place([]); return; } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, mcanvas.width, mcanvas.height); marksDrawn = marks.length > 0 || dn.length > 0;")
rep("  if (!marks.length) { placePulse(null); return; } const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale; let pulse = null;",
    "  if (!marks.length && !dn.length) { placePulse(null); done782Place([]); return; } const M = sheetToDevice(dpr * v.scale, canvas.width, canvas.height), s = dpr * v.scale; let pulse = null;\n  done782Draw(ctx, M, dn);")

rep("let marksDrawn = false;\nfunction drawMarks(v) {", r"""/* v7.82 - DONE. A finished unit (the dashboard's Complete tick) gets a green tick badge and a ring that beats twice and
   rests. One chip shows or hides the layer; the list is read from the dashboard every 4 s. */
let DONE782 = new Set(), done782Sig = '', DONE782_ON = (() => { try { return localStorage.getItem('gc500.done782') !== 'off'; } catch (e) { return true; } })();
(() => { const st = document.createElement('style'); st.textContent = '.d782{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:1}'
  + '.d782 i{position:absolute;left:-10px;top:-10px;width:20px;height:20px;border-radius:50%;border:2px solid #2bd46b;box-sizing:border-box;opacity:0;will-change:transform,opacity;animation:d782beat 3.2s ease-out infinite}'
  + '@keyframes d782beat{0%{transform:scale(1);opacity:.95}12%{transform:scale(2.1);opacity:0}13%{transform:scale(1);opacity:.95}27%{transform:scale(2.5);opacity:0}100%{transform:scale(2.5);opacity:0}}'
  + '.d782.moving{display:none}@media (prefers-reduced-motion:reduce){.d782 i{animation:none;opacity:0}}'
  + '.d782row{display:flex;align-items:center;gap:8px;margin:8px 0 2px;flex-wrap:wrap}.d782row small.k{color:var(--mute,#9aa3ad);font:500 11px Inter,sans-serif}'
  + '#done782 b{display:inline-grid;place-items:center;width:14px;height:14px;border-radius:50%;background:#1fae57;color:#fff;font:800 10px/1 Inter,sans-serif;box-shadow:0 0 0 1.5px #fff}';
  document.head.appendChild(st); })();
function done782Pull() { let keys = null; try { const w = window.parent && window.parent !== window ? window.parent : window; if (typeof w.gc500DoneKeys === 'function') keys = w.gc500DoneKeys(); } catch (e) {}
  if (!Array.isArray(keys)) return; const sig = keys.slice().sort().join(','); if (sig === done782Sig) return; done782Sig = sig; DONE782 = new Set(keys.map(norm)); done782Chip(); requestPaint(); }
setInterval(done782Pull, 4000); setTimeout(done782Pull, 600);
function done782List() { if (!DONE782_ON || !DONE782.size || typeof ITEMS === 'undefined' || !ITEMS) return []; return ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)); }
function done782Chip() { const card = $('findCard'), chips = $('chips'); if (!card || !chips) return; let row = $('done782row');
  if (!row) { row = document.createElement('div'); row.id = 'done782row'; row.className = 'd782row'; chips.insertAdjacentElement('afterend', row);
    row.onclick = e => { const b = e.target.closest('#done782'); if (!b) return; DONE782_ON = !DONE782_ON; try { localStorage.setItem('gc500.done782', DONE782_ON ? 'on' : 'off'); } catch (_) {} done782Chip(); requestPaint(); }; }
  const n = (typeof ITEMS !== 'undefined' && ITEMS ? ITEMS.filter(it => it.places.length && it.cat && it.cat.host === 'trade' && DONE782.has(it.code)).length : 0);
  row.innerHTML = `<button class="chip" id="done782" aria-pressed="${DONE782_ON}" style="--c:#2bd46b" title="Finished units: a green tick, and a ring that beats twice. Tap to ${DONE782_ON ? 'hide' : 'show'} them."><b>✓</b>Done <small>${n}</small></button><small class="k">${DONE782_ON ? 'green tick, double beat = finished' : 'finished units hidden'}</small>`; }
function done782Draw(ctx, M, dn) { const out = [];
  for (const it of dn) for (const bb of it.places) { const g0 = toGeo((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), c = applyM(M, g0.x, g0.y); if (c.x < -40 || c.y < -40 || c.x > canvas.width + 40 || c.y > canvas.height + 40) continue;
    const r = 8 * dpr; ctx.fillStyle = '#1fae57'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2 * dpr; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(c.x - r * .45, c.y + r * .02); ctx.lineTo(c.x - r * .1, c.y + r * .38); ctx.lineTo(c.x + r * .5, c.y - r * .36); ctx.stroke();
    if (out.length < 240) out.push([c.x / dpr, c.y / dpr]); }
  done782Place(out); }
let done782At = '';
function done782Place(list) { let L = $('d782'); const host = $('pulse') && $('pulse').parentNode;
  if (!L && host) { L = document.createElement('div'); L.id = 'd782'; L.className = 'd782'; L.setAttribute('aria-hidden', 'true'); host.insertBefore(L, $('pulse')); }
  if (!L) return; L.classList.toggle('moving', !!interacting);
  const k = list.map(p => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(';'); if (k === done782At) return; done782At = k;
  while (L.children.length < list.length) L.appendChild(document.createElement('i')); while (L.children.length > list.length) L.lastChild.remove();
  list.forEach((p, i) => { L.children[i].style.transform = ''; L.children[i].style.left = (p[0] - 10).toFixed(1) + 'px'; L.children[i].style.top = (p[1] - 10).toFixed(1) + 'px'; }); }
let marksDrawn = false;
function drawMarks(v) {""")
# the chip row is rebuilt with the plan's own chips
rep("  const fh = document.querySelector('#findCard h3'); if (fh) fh.textContent = HOST ? 'Find on the master plan' : 'Find on the drawing';",
    "  done782Chip(); /* v7.82 */\n  const fh = document.querySelector('#findCard h3'); if (fh) fh.textContent = HOST ? 'Find on the master plan' : 'Find on the drawing';")
# category chips and Escape reset only the category chips - the Done chip keeps its own state (Codex review, 2 Oct)
rep("const on = b.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', 'false'));",
    "const on = b.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); /* v7.82 - not the Done chip */")
rep("stopPulse(); document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', 'false')); $('findList').classList.remove('show');",
    "stopPulse(); document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); /* v7.82 - not the Done chip */ $('findList').classList.remove('show');")
# the dashboard's Motion Off holds the rings still too, as well as the device's reduced-motion setting
rep("'.d782.moving{display:none}@media (prefers-reduced-motion:reduce){.d782 i{animation:none;opacity:0}}'",
    "'.d782.moving{display:none}@media (prefers-reduced-motion:reduce){.d782 i{animation:none;opacity:0}}html.d782still .d782 i{animation:none;opacity:0}'")
rep("function done782Pull() { let keys = null; try { const w = window.parent && window.parent !== window ? window.parent : window; if (typeof w.gc500DoneKeys === 'function') keys = w.gc500DoneKeys(); } catch (e) {}",
    "function done782Pull() { let keys = null; try { const w = window.parent && window.parent !== window ? window.parent : window; document.documentElement.classList.toggle('d782still', w !== window && w.document.documentElement.getAttribute('data-motion') === 'off'); if (typeof w.gc500DoneKeys === 'function') keys = w.gc500DoneKeys(); } catch (e) {}")
open(sys.argv[2], 'w', encoding='utf-8').write(src)
print('explorer v7.82: Done layer (green tick, double-beat ring, one chip)')
