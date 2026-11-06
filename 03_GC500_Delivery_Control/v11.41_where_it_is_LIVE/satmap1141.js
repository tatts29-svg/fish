/* Author: Andrew Fisher. Where it is (v11.41): every VMS board and every generator on satellite imagery, from the page's own
   positions, including the boards that sit off the master layout's sheet (which the Map explorer, drawn on the sheet,
   cannot show) and the references the record has no position for, listed as such. Andrew, 23 Oct 2026: "When i look for
   generators i cant see where some of them are"; "Cant see all vms boards on here either". Under the Map explorer (boards
   and generators, with a filter) and under the VMS boards tab's head (the boards). Imagery: Esri World Imagery. The
   positions are the record's: a VMS board's pinned or plan-read position, a generator's drawing label or supplied pin;
   nothing is guessed - a reference without a position is named as without one. */
(function (W) {
'use strict';
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
const WPX = Math.pow(2, 18) * 512;
const SESSION = {'13': '#ff3b3b', '14': '#ff9f1a', '15': '#ffe600', '16': '#00e5ff', '17': '#ff4fd8'};   /* as the removals map */
const VMSCOL = '#c77dff', GENCOL = '#3ddc84';
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nav = (lat, lon) => 'https://www.google.com/maps/dir/?api=1&destination=' + Number(lat) + ',' + Number(lon);
function z18(lat, lon){ const x = (lon + 180) / 360 * WPX, s = Math.sin(lat * Math.PI / 180); return [x, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WPX]; }
function pinOf(ref){ try { const p = pinsNow(); const arr = Array.isArray(p) ? p : Object.values(p || {}); return arr.find(x => x && x.ref === ref) || null; } catch (e) { return null; } }
function boards(){
 const v = W.VMS1024; if (!v || typeof v.boards !== 'function') return [];
 return v.boards().map(b => { const p = typeof v.position === 'function' ? v.position(b) : {lat: b.lat, lon: b.lon, how: b.basis}; const title = String(b.title || '').trim();
  return {kind: 'vms', id: b.pos, num: String(b.pos).replace(/^0/, ''), label: typeof v.label === 'function' ? v.label(b) : 'VMS ' + b.pos, name: title.split(/\s[—-]\sinstalled/i)[0].slice(0, 70), lat: p && p.lat, lon: p && p.lon, how: (p && p.how) || '', colour: SESSION[b.pos] || VMSCOL, session: !!b.session}; });
}
function generators(){
 const out = []; (DATA.assets || []).forEach(a => { if (a.discipline !== 'Generators' && !/generator/i.test(a.product || '')) return; const p = pinOf(a.key);
  out.push({kind: 'gen', id: a.key, num: String(a.key).replace(/^GN/, ''), label: a.key, name: String(a.name || a.product || '').slice(0, 60), units: (a.asset_numbers || []).slice(), lat: p ? p.lat : null, lon: p ? p.lon : null, how: p ? String(p.by || '') : '', state: a.position_state || '', colour: GENCOL}); });
 return out;
}
function make(mount){
 const M = {mount: mount, items: [], view: null, origin: null, filter: mount.filter || 'all', timer: null};
 M.all = () => (mount.kinds.indexOf('vms') >= 0 ? boards() : []).concat(mount.kinds.indexOf('gen') >= 0 ? generators() : []);
 M.shown = () => M.items.filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lon) && (M.filter === 'all' || i.kind === M.filter));
 M.svg = () => document.querySelector('#' + mount.pane + ' .s1141-map[data-s1141="' + mount.key + '"] .s1141-svg');
 return M;
}
function bbox(M){ const ps = M.shown().map(i => z18(i.lat, i.lon)); if (!ps.length) return {x0: 0, y0: 0, x1: 1, y1: 1}; const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; }
function aspect(svg){ return svg && svg.clientWidth ? svg.clientHeight / svg.clientWidth : 1; }
function fitBox(M, svg){ const b = bbox(M), a = aspect(svg); let w = (b.x1 - b.x0) * 1.25 + 600, h = (b.y1 - b.y0) * 1.25 + 600; if (h / w > a) w = h / a; else h = w * a; return {cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: w, h: h}; }
function box(M, svg){ const f = fitBox(M, svg), v = M.view || f, h = v.w * aspect(svg); return {x: v.cx - v.w / 2 - M.origin[0], y: v.cy - h / 2 - M.origin[1], w: v.w, h: h, cx: v.cx, cy: v.cy}; }
function pct(M, svg){ const f = fitBox(M, svg); return Math.round(f.w / (M.view ? M.view.w : f.w) * 100); }
function unit(M, svg){ return box(M, svg).w / Math.max(1, svg.clientWidth); }
function setView(M, cx, cy, w, svg){ const f = fitBox(M, svg); w = Math.max(f.w / 128, Math.min(f.w, w)); M.view = w >= f.w ? null : {cx: cx, cy: cy, w: w}; }
function satZoom(M, svg){ const b = box(M, svg); const p = (svg.clientWidth || 360) * (window.devicePixelRatio || 1) / b.w; return Math.max(14, Math.min(20, 19 + Math.ceil(Math.log(p) / Math.LN2 - 0.1))); }
function tilesHtml(M, svg){
 const b = box(M, svg), z = satZoom(M, svg), span = 256 / Math.pow(2, z - 19), ax = b.x + M.origin[0], ay = b.y + M.origin[1];
 const x0 = Math.floor(ax / span), x1 = Math.floor((ax + b.w) / span), y0 = Math.floor(ay / span), y1 = Math.floor((ay + b.h) / span); let h = '';
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 160) return {z: z, html: ''};
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) h += '<image href="' + SAT + z + '/' + ty + '/' + tx + '" x="' + (tx * span - M.origin[0]) + '" y="' + (ty * span - M.origin[1]) + '" width="' + span + '" height="' + span + '" preserveAspectRatio="none"/>';
 return {z: z, html: h};
}
function pinsHtml(M, svg){
 const u = unit(M, svg), r = 12 * u, f = 11.5 * u, lw = 2 * u; let h = '';
 M.shown().forEach(i => { const [x, y] = z18(i.lat, i.lon); const bx = x - M.origin[0], by = y - M.origin[1]; const gen = i.kind === 'gen';
  h += `<g class="s1141-pin ${gen ? 'gen' : 'vms'}" data-s1141-nav="${esc(i.lat)},${esc(i.lon)}" data-id="${esc(i.id)}"><title>${esc(i.label)} · ${esc(i.name)}</title>`;
  if (gen) h += `<rect x="${bx - r}" y="${by - r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.22}" fill="${i.colour}" stroke="#101418" stroke-width="${lw}"/>`;
  else h += `<circle cx="${bx}" cy="${by}" r="${r}" fill="${i.colour}" stroke="#101418" stroke-width="${lw}"/>`;
  h += `<text x="${bx}" y="${by + f * 0.36}" text-anchor="middle" font-size="${f * (i.num.length > 2 ? 0.8 : 1)}" font-weight="700" fill="#101418" class="s1141-num">${esc(i.num)}</text><text x="${bx + r * 1.25}" y="${by + f * 0.38}" font-size="${f}" fill="#fff" stroke="#000" stroke-width="${f * 0.28}" paint-order="stroke" class="s1141-lbl">${esc(i.label)}</text></g>`; });
 return h;
}
function apply(M, svg){
 svg = svg || M.svg(); if (!svg) return;
 const b = box(M, svg); svg.setAttribute('viewBox', [b.x, b.y, b.w, b.h].map(n => Math.round(n * 1000) / 1000).join(' '));
 const card = svg.closest('.s1141-map'); const p = card.querySelector('[data-s1141-pct]'); if (p) p.textContent = pct(M, svg) + '%';
 const t = tilesHtml(M, svg), gs = svg.querySelector('g.sat'); if (gs) { gs.setAttribute('data-z', t.z); gs.innerHTML = t.html; }
 const gp = svg.querySelector('g.pins'); if (gp) gp.innerHTML = pinsHtml(M, svg);
}
function listHtml(M){
 const have = M.items.filter(i => Number.isFinite(i.lat) && Number.isFinite(i.lon)), none = M.items.filter(i => !(Number.isFinite(i.lat) && Number.isFinite(i.lon)));
 const row = i => `<li data-kind="${esc(i.kind)}"><i class="s1141-chip ${i.kind}" style="background:${esc(i.colour)}"></i><div><b>${esc(i.label)}</b> · ${esc(i.name)}${i.units && i.units.length ? ' <small>' + esc(i.units.join(', ')) + '</small>' : ''}<br><span class="s1141-how">${esc(i.how)}</span> <a class="btn sm" href="${esc(nav(i.lat, i.lon))}" target="_blank" rel="noopener noreferrer">Navigate ↗</a></div></li>`;
 const noneRow = i => `<li class="s1141-none" data-kind="${esc(i.kind)}"><i class="s1141-chip ${i.kind} none"></i><div><b>${esc(i.label)}</b> · ${esc(i.name)}${i.units && i.units.length ? ' <small>' + esc(i.units.join(', ')) + '</small>' : ''}<br><span class="s1141-how">no position on the record${i.state ? ' — ' + esc(i.state) : ''}; pin it on the page to put it on the map</span></div></li>`;
 return `<ul class="s1141-list">${have.map(row).join('')}${none.map(noneRow).join('')}</ul>`;
}
function html(M){
 const m = M.mount, counts = {vms: M.items.filter(i => i.kind === 'vms').length, gen: M.items.filter(i => i.kind === 'gen').length};
 const none = M.items.filter(i => !(Number.isFinite(i.lat) && Number.isFinite(i.lon)));
 const filt = m.kinds.length > 1 ? `<span class="s1141-sep" aria-hidden="true"></span><button type="button" class="btn sm${M.filter === 'all' ? ' primary' : ''}" data-s1141-filter="all" data-ro>All</button><button type="button" class="btn sm${M.filter === 'vms' ? ' primary' : ''}" data-s1141-filter="vms" data-ro>VMS boards (${counts.vms})</button><button type="button" class="btn sm${M.filter === 'gen' ? ' primary' : ''}" data-s1141-filter="gen" data-ro>Generators (${counts.gen})</button>` : '';
 return `<section class="card s1141-map" data-s1141="${esc(m.key)}" aria-labelledby="s1141h-${esc(m.key)}"><h3 id="s1141h-${esc(m.key)}">${esc(m.title)}</h3>
 <p class="sub">${esc(m.sub)}${none.length ? ' ' + none.length + ' reference' + (none.length > 1 ? 's have' : ' has') + ' no position on the record and ' + (none.length > 1 ? 'are' : 'is') + ' listed under the map.' : ''} Tap a pin to navigate; pinch or scroll to zoom; drag to move.</p>
 <div class="s1141-bar"><button type="button" class="btn sm" data-s1141-zoom="out" data-ro aria-label="Zoom out">−</button><span class="s1141-pct" data-s1141-pct>100%</span><button type="button" class="btn sm" data-s1141-zoom="in" data-ro aria-label="Zoom in">+</button><button type="button" class="btn sm" data-s1141-zoom="fit" data-ro>Fit</button>${filt}</div>
 <div class="s1141-view"><svg class="s1141-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(m.title)}"><g class="sat"></g><g class="pins"></g></svg></div>
 ${listHtml(M)}
 <p class="norate">Imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics and the GIS User Community). Positions are the record’s own: a board’s pinned or plan-read position, a generator’s drawing label or supplied pin, as each line says.</p></section>`;
}
function zoomAt(M, svg, k, px, py){
 const b = box(M, svg), r = svg.getBoundingClientRect(), u = unit(M, svg), f = fitBox(M, svg);
 const sx = b.x + M.origin[0] + (px - r.left) * u, sy = b.y + M.origin[1] + (py - r.top) * u;
 const w2 = Math.max(f.w / 128, Math.min(f.w, b.w / k)), u2 = u * (w2 / b.w);
 setView(M, sx - (px - r.left) * u2 + w2 / 2, sy - (py - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(M, svg);
}
function gestures(M, svg){
 const pts = new Map(); let st = null, moved = false;
 svg.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pts.size === 1) { st = {mode: 'pan', x: e.clientX, y: e.clientY, b: box(M, svg), u: unit(M, svg)}; moved = false; }
  else if (pts.size === 2) { const a = [...pts.values()]; st = {mode: 'pinch', d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2, b: box(M, svg), u: unit(M, svg)}; moved = true; }
  e.preventDefault(); });
 svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId) || !st) return; pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (st.mode === 'pan' && pts.size === 1) { const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.hypot(dx, dy) > 4) moved = true; if (moved) { setView(M, st.b.cx - dx * st.u, st.b.cy - dy * st.u, st.b.w, svg); apply(M, svg); } }
  else if (st.mode === 'pinch' && pts.size === 2) { const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), k = d / Math.max(1, st.d), r = svg.getBoundingClientRect(), f = fitBox(M, svg);
   const sx = st.b.x + M.origin[0] + (st.mx - r.left) * st.u, sy = st.b.y + M.origin[1] + (st.my - r.top) * st.u, w2 = Math.max(f.w / 128, Math.min(f.w, st.b.w / k)), u2 = st.u * (w2 / st.b.w);
   setView(M, sx - (st.mx - r.left) * u2 + w2 / 2, sy - (st.my - r.top) * u2 + w2 * aspect(svg) / 2, w2, svg); apply(M, svg); }
  e.preventDefault(); });
 const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); try { svg.releasePointerCapture(e.pointerId); } catch (x) {}
  if (pts.size === 0) { if (st && st.mode === 'pan' && !moved) { const t = e.target.closest('[data-s1141-nav]'); if (t) { const ll = t.dataset.s1141Nav.split(','); window.open(nav(ll[0], ll[1]), '_blank', 'noopener'); } } st = null; }
  else if (pts.size === 1) { const a = [...pts.values()][0]; st = {mode: 'pan', x: a.x, y: a.y, b: box(M, svg), u: unit(M, svg)}; moved = true; } };
 svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
 svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(M, svg, e.deltaY > 0 ? 0.8 : 1.25, e.clientX, e.clientY); }, {passive: false});
}
const MOUNTS = [
 {key: 'map', pane: 'pane-map', after: '#expcard', kinds: ['vms', 'gen'], title: 'Where it is · every VMS board and generator on satellite', sub: 'The Map explorer draws on the master layout’s sheet, so a board placed off the sheet cannot show there; this map draws every VMS board and every generator the record has a position for, on satellite imagery, wherever it is. The five end-of-session boards keep their removal colours; other boards are violet; generators are green squares.'},
 {key: 'vms', pane: 'pane-vms', after: '.v1024-head', kinds: ['vms'], title: 'Every board on satellite', sub: 'All the boards from the plan with the page’s positions, including the ones placed off the master layout’s sheet. The five end-of-session boards keep their removal colours.'}];
const live = {};
function inject(m, tries){
 const pane = document.getElementById(m.pane); if (!pane) return;
 if (pane.querySelector('.s1141-map[data-s1141="' + m.key + '"]')) return;
 const anchor = pane.querySelector(m.after);
 if (!anchor) { if ((tries || 0) < 12) setTimeout(() => inject(m, (tries || 0) + 1), 250); return; }
 const M = make(m); M.items = M.all(); if (!M.items.length) return;
 const b = bbox(M); M.origin = [Math.floor(b.x0 - 4000), Math.floor(b.y0 - 4000)];
 anchor.insertAdjacentHTML('afterend', html(M)); live[m.key] = M;
 const card = pane.querySelector('.s1141-map[data-s1141="' + m.key + '"]'), svg = card.querySelector('.s1141-svg'); gestures(M, svg); apply(M, svg);
 card.addEventListener('click', ev => { const z = ev.target.closest('[data-s1141-zoom]'); const s = M.svg(); if (z && s) { const r = s.getBoundingClientRect(); if (z.dataset.s1141Zoom === 'fit') M.view = null; else zoomAt(M, s, z.dataset.s1141Zoom === 'in' ? 1.6 : 1 / 1.6, r.left + r.width / 2, r.top + r.height / 2); apply(M, s); return; }
  const f = ev.target.closest('[data-s1141-filter]'); if (f && s) { M.filter = f.dataset.s1141Filter; M.view = null; card.querySelectorAll('[data-s1141-filter]').forEach(x => x.classList.toggle('primary', x.dataset.s1141Filter === M.filter)); card.querySelectorAll('.s1141-list li').forEach(li => { li.hidden = M.filter !== 'all' && li.dataset.kind !== M.filter; }); apply(M, s); } });
 if (!pane.__s1141) { pane.__s1141 = true; window.addEventListener('resize', () => { const s = M.svg(); if (s) apply(M, s); }); }
}
/* a pane that redraws itself after its render returns (held assets, a later frame) wipes the card: watch the pane and put
   the card back whenever it is missing and its anchor is there */
function watch(m){
 const pane = document.getElementById(m.pane); if (!pane || pane.__s1141obs) return;
 pane.__s1141obs = new MutationObserver(() => { if (pane.__s1141t) return; pane.__s1141t = setTimeout(() => { pane.__s1141t = null; try { inject(m, 0); } catch (e) {} }, 120); });
 pane.__s1141obs.observe(pane, {childList: true});
}
function wrap(name, m){ const r0 = W[name]; if (typeof r0 !== 'function') return false; W[name] = function(){ const r = r0.apply(this, arguments); try { watch(m); inject(m, 0); } catch (e) {} return r; }; return true; }
const ok = {map: wrap('renderMap', MOUNTS[0]), vms: wrap('renderVms1024', MOUNTS[1])};
if (ok.vms && W.VMS1024) W.VMS1024.render = W.renderVms1024;
W.SatMap1141 = {MOUNTS, boards, generators, z18, wrapped: ok, get maps(){ return live; },
 setZoom: (key, p, lat, lon) => { const M = live[key]; if (!M) return; const s = M.svg(); if (!s) return; const f = fitBox(M, s), w = f.w / (p / 100); const c = (lat != null && lon != null) ? z18(lat, lon) : [M.view ? M.view.cx : f.cx, M.view ? M.view.cy : f.cy]; setView(M, c[0], c[1], w, s); apply(M, s); },
 fit: key => { const M = live[key]; if (M) { M.view = null; apply(M, M.svg()); } }, tiles: key => { const M = live[key]; const s = M && M.svg(); return s ? [...s.querySelectorAll('g.sat image')].map(i => i.getAttribute('href')) : []; }, satZoom: key => { const M = live[key]; return M ? satZoom(M, M.svg()) : null; }, pct: key => { const M = live[key]; return M ? pct(M, M.svg()) : null; }};
})(window);
