/* Author: Andrew Fisher. v11.56 - the gates on the maps. "can we add a gate search on the maps so when someone says gate 1 or
   gate 6 we know where it is please" (Andrew, 23 Oct 2026). The master plan D001-26003-03 draws the spectator gates G1 to
   G10 (with 5A, 5B and 8a) and the page already holds each one's position from it (MASTER_LAYERS, layer "gate"). Three
   things: the finder answers "gate 6", "g6", "gate 5a" or "gates" with the gate first; picking a gate opens the Maps tab
   with the satellite map under the explorer zoomed and ringed on the gate (and "On the plan" there shows the gate's label
   on the master drawing); and that satellite map carries every gate as a white pin with its number, a Gates filter and a list. Positions are the
   master plan's, image registration not survey, as the layer says. Nothing is written. */
(function (W) {
'use strict';
const SRC = 'D001-26003-03';
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let memo = null;
function gates(){
 if (memo) return memo;
 const L = (typeof MASTER_LAYERS !== 'undefined' && Array.isArray(MASTER_LAYERS) ? MASTER_LAYERS : []).filter(l => l && l.layer === 'gate' && Array.isArray(l.ll) && l.ll.length === 2);
 const byFace = {};
 L.forEach(l => { const face = String(l.face || '').trim().toUpperCase(); if (!/^G\d{1,2}[AB]?$/.test(face)) return;
  /* one point a gate: the fence-line point where the master draws one, else the approach on the main sheet (not the inset copy) */
  const rank = /fence line/i.test(l.note || '') ? 2 : /inset/i.test(l.note || '') ? 0 : 1;
  if (!byFace[face] || rank > byFace[face].rank) byFace[face] = {rank, l, face}; });
 memo = Object.keys(byFace).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')) || a.localeCompare(b)).map(face => { const l = byFace[face].l, num = face.replace(/^G/, '');
  const where = /fence line/i.test(l.note || '') ? 'on the fence line' : 'the approach';
  return {kind: 'gate', id: 'G' + num, face, num, label: 'Gate ' + num, master: String(l.label || ('Gate ' + face)), lat: Number(l.ll[0]), lon: Number(l.ll[1]), src: String(l.src || SRC), where,
   name: 'spectator gate · master plan ' + String(l.src || SRC), how: 'master plan ' + String(l.src || SRC) + ' — ' + where + ', as the master draws it (image registration, not survey)', colour: '#ffffff'}; });
 return memo;
}
function parseGate(q){ /* "gate 6", "gate6", "g6", "g 6", "gate 5a", "gate 8A" */
 const m = /^\s*(?:gate|g)\s*0?(\d{1,2})\s*([ab])?\s*$/i.exec(String(q || '')); if (!m) return null;
 const num = m[1] + (m[2] ? m[2].toUpperCase() : '');
 const exact = gates().filter(g => g.num === num); if (exact.length) return exact;
 return gates().filter(g => g.num.replace(/[AB]$/, '') === m[1]); /* "gate 5" - both 5A and 5B */
}
/* the finder */
const idx0 = W.finderIndex;
if (typeof idx0 === 'function') W.finderIndex = function () { const out = idx0.apply(this, arguments);
 try { gates().forEach(g => out.push(Object.assign({}, g, {hay: ('gate ' + g.num + ' gate' + g.num + ' g' + g.num + ' g ' + g.num + ' ' + g.master + ' spectator gate gates entry entrance where it is master plan ' + g.src).toLowerCase()}))); } catch (e) {}
 return out; };
const m0 = W.finderMatches;
if (typeof m0 === 'function') W.finderMatches = function (q) { const out = (m0.apply(this, arguments) || []).filter(it => it.kind !== 'gate');
 try { const s = String(q || '').trim().toLowerCase(); let hits = parseGate(s);
  if (!hits && /^gates?$/.test(s)) hits = gates();
  if (!hits && /\bgates?\b/.test(s)) { const toks = s.split(/\s+/).filter(Boolean); hits = gates().filter(g => { const hay = ('gate ' + g.num + ' g' + g.num + ' ' + g.master).toLowerCase(); return toks.every(t => hay.includes(t)); }); }
  if (hits && hits.length) return hits.concat(out).slice(0, 14); } catch (e) {}
 return out; };
const r0 = W.finderRow;
if (typeof r0 === 'function') W.finderRow = function (it, i) {
 if (it && it.kind === 'gate') { const on = (typeof FINDER !== 'undefined' && FINDER && i === FINDER.at);
  return `<div class="fi gate1156${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin" aria-hidden="true">${esc(it.face)}</span><span class="fim"><b>${esc(it.label)}</b>
 <span>${esc(it.name)} · ${esc(it.where)}, as the master draws it</span><span class="fiw">opens the Maps tab with the satellite map ringed on the gate; "On the plan" under the map shows it on the master drawing</span></span><span class="fik">Gate</span></div>`; }
 return r0.apply(this, arguments); };
const p0 = W.finderPick;
if (typeof p0 === 'function') W.finderPick = function (i) { const it = (typeof FINDER !== 'undefined' && FINDER && FINDER.list || [])[i];
 const r = p0.apply(this, arguments); /* closes the finder and clears the box; it has no branch for a gate */
 try { if (it && it.kind === 'gate') W.gate1156Open(it); } catch (e) {}
 return r; };
/* open: the plan on the gate's label (the master sheet's layer marker), then the satellite map on its position */
/* open: the Maps tab in its explorer view (the satellite map lives under the explorer card, not under a zoomed sheet), the
   satellite map zoomed and ringed on the gate; "On the plan" under the map shows the gate's label on the master drawing */
W.gate1156Open = function (g) {
 if (!g) return;
 try { if (typeof state !== 'undefined' && state) { state.sheet = '__explorer'; state.sel = null; } } catch (e) {}
 try { go('map'); } catch (e) {}
 W.gate1156Zoom(g.lat, g.lon, g.id);
 try { if (typeof flash === 'function') flash(g.label + ' — ringed on the satellite map under the explorer; the master plan ' + g.src + ' draws it there (' + g.where + ').'); } catch (e) {}
};
W.gate1156Plan = function (id) { const g = gates().find(x => x.id === String(id)); if (!g) return false;
 try { mapLocate('MASTER', g.master); return true; } catch (e) { try { go('map'); } catch (x) {} return false; } };
W.gate1156Zoom = function (lat, lon, id) {
 if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
 let tries = 0; (function go1156(){
  const SM = W.SatMap1141, M = SM && SM.maps && SM.maps.map, svg = document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg');
  if (M && svg) { ensure(M); SM.setZoom('map', 1600, lat, lon); ring(M, svg, lat, lon, id); const c = svg.closest('.s1141-map'); if (c) c.scrollIntoView({block: 'start', behavior: 'smooth'}); return; }
  if (++tries < 24) setTimeout(go1156, 250);
 })();
};
function ring(M, svg, lat, lon, id){
 try { const [x, y] = W.SatMap1141.z18(lat, lon); const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number); const u = vb[2] / Math.max(1, svg.clientWidth);
  const NS = 'http://www.w3.org/2000/svg'; let g = svg.querySelector('g.gate1156-ring'); if (!g) { g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'gate1156-ring'); svg.appendChild(g); }
  g.setAttribute('data-gate', String(id || '')); while (g.firstChild) g.removeChild(g.firstChild);
  [[26, 4, '1'], [40, 2, '.6']].forEach(([r, w, o]) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x - M.origin[0]); c.setAttribute('cy', y - M.origin[1]); c.setAttribute('r', r * u); c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#ffe600'); c.setAttribute('stroke-width', w * u); c.setAttribute('opacity', o); g.appendChild(c); });
  clearTimeout(g.__t); g.__t = setTimeout(() => { try { g.remove(); } catch (e) {} }, 12000); } catch (e) { W.gate1156Err = String(e && e.message || e); }
}
/* the satellite map under the Map explorer: every gate as a pin, a Gates filter, a list */
function ensure(M){
 if (!M || !Array.isArray(M.items)) return false;
 if (M.items.some(i => i.kind === 'gate')) return false;
 const G = gates(); if (!G.length) return false;
 G.forEach(g => M.items.push({kind: 'gate', id: g.id, num: g.face, label: g.label, name: g.name, units: [], lat: g.lat, lon: g.lon, how: g.how, colour: g.colour}));
 const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); if (!card) return true;
 const bar = card.querySelector('.s1141-bar'); if (bar && !bar.querySelector('[data-s1141-filter="gate"]')) bar.insertAdjacentHTML('beforeend', `<button type="button" class="btn sm${M.filter === 'gate' ? ' primary' : ''}" data-s1141-filter="gate" data-ro>Gates (${G.length})</button>`);
 const list = card.querySelector('.s1141-list'); if (list && !list.querySelector('li[data-kind="gate"]')) list.insertAdjacentHTML('beforeend', G.map(g => `<li data-kind="gate"${M.filter !== 'all' && M.filter !== 'gate' ? ' hidden' : ''}><i class="s1141-chip gate" style="background:${esc(g.colour)}"></i><div><b>${esc(g.label)}</b> · ${esc(g.name)}<br><span class="s1141-how">${esc(g.how)}</span> <a class="btn sm" href="https://www.google.com/maps/dir/?api=1&amp;destination=${esc(g.lat)},${esc(g.lon)}" target="_blank" rel="noopener noreferrer">Navigate ↗</a> <button type="button" class="btn sm ghost" data-gate1156-plan="${esc(g.id)}" data-ro>On the plan</button></div></li>`).join(''));
 if (!card.__g1156click) { card.__g1156click = true; card.addEventListener('click', ev => { const b = ev.target.closest('[data-gate1156-plan]'); if (b) { ev.preventDefault(); W.gate1156Plan(b.dataset.gate1156Plan); } }); }
 const sub = card.querySelector('p.sub'); if (sub && !/gates/i.test(sub.textContent)) sub.insertAdjacentHTML('beforeend', ' The spectator gates G1 to G10 are white pins from the master plan.');
 try { const SM = W.SatMap1141; const pct = SM.pct('map'); SM.setZoom('map', pct || 100); } catch (e) {}
 return true;
}
W.Gates1156 = {gates, parseGate, ensure: () => { const SM = W.SatMap1141, M = SM && SM.maps && SM.maps.map; return M ? ensure(M) : false; }};
const rm0 = W.renderMap;
if (typeof rm0 === 'function') W.renderMap = function () { const r = rm0.apply(this, arguments); try { setTimeout(() => W.Gates1156.ensure(), 60); setTimeout(() => W.Gates1156.ensure(), 600); } catch (e) {} return r; };
(function watch(){ const pane = document.getElementById('pane-map'); if (!pane) { setTimeout(watch, 500); return; }
 const obs = new MutationObserver(() => { if (pane.__g1156t) return; pane.__g1156t = setTimeout(() => { pane.__g1156t = null; try { W.Gates1156.ensure(); } catch (e) {} }, 200); });
 obs.observe(pane, {childList: true, subtree: true}); })();
})(window);
