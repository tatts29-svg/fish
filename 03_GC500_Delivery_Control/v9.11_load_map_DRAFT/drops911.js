/* Author: Andrew Fisher. Read-only daily load order beside verified street/satellite destinations. */
(function () {
 'use strict';
 const ui = {day: '', selected: null, cleared: false, style: 'satellite', fit: true, listTop: 0};
 let current = null, map = null, applyStyle = null, view = null, resize = null, lifecycle = null, loading = false, generation = 0, frame = 0, mapStatus = 'idle';
 const h = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validLL = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) < 85;
 const insetRefs = new Set(['CP1', 'T0265', 'WC81']);
 function location(a, env) {
  const m = env.master[a.key], d = env.destination(a), moved = env.moved(a);
  const reject = reason => ({point: null, reason});
  if (!d || !d.ll) return reject(moved ? 'New drop needs confirmation' : 'Drop location to confirm');
  const independent = d.kind === 'pinned' && !(d.nt && d.nt.fix && d.nt.fix.master);
  if (d.kind === 'report') return reject('Report point only · drop to confirm');
  if (d.kind === 'unverified' || (m && m.unverified && !independent)) return reject('Drawing position not verified');
  if (moved && !independent) return reject('New drop needs confirmation');
  if (d.approx || d.kind === 'placed' || d.kind === 'area') return reject('Exact drop to confirm');
  if (!independent && (insetRefs.has(a.key) || (env.offPlan && env.offPlan(a)))) return reject('Plan inset · ground location to confirm');
  const master = m && (d.kind === 'master' || d.kind === 'confirmed' || d.kind === 'desc' || (d.nt && d.nt.fix && d.nt.fix.master));
  if (master && m.prec !== 'unit' && !m.confirmed) return reject('Area only · exact drop to confirm');
  if (!master && !independent && d.kind !== 'confirmed' && d.kind !== 'desc') return reject('Drop location to confirm');
  const point = [d.ll.lon, d.ll.lat];
  if (!validLL(point)) return reject('Recorded coordinates need checking');
  return {point, source: independent ? (d.sms || 'Recorded GPS position') : master ? 'Master-plan unit position' : 'Confirmed ground location'};
 }
 // All day loads remain visible; filtering only changes which native cards can be opened below.
 function project(input) {
  const base = input.projector || (typeof Drops908 !== 'undefined' && Drops908.project);
  if (!base) throw new Error('Native daily load projection unavailable');
  const fullVisible = input.loads.map((g, i) => ({g, n: i + 1})).filter(v => v.g.kind === 'deliveries');
  const result = base(Object.assign({}, input, {visible: fullVisible}));
  const visible = new Map(input.visible.map(v => [v.n, v]));
  result.loads.forEach(load => {
   const g = input.loads[load.n - 1], shown = visible.get(load.n);
   load.hiddenByFilter = !shown;
   load.renderedId = shown ? input.idOf(input.day, shown.g) : null;
   load.time = g.time || '';
   load.docket = String(g.docket || (g.rows[0] && g.rows[0].docket) || '');
   load.title = [...new Set(g.rows.map(r => r.a.name || r.a.location || '').filter(Boolean))].join(' · ');
  });
  return result;
 }
 // Distinct load labels at every destination: one truck may have several drops; two trucks never share a badge.
 function markers(model) {
  const seen = new Set(), out = [];
  model.loads.forEach(load => load.refs.forEach(ref => {
   if (!ref.point) return;
   const key = load.id + '|' + ref.point.join('|');
   if (seen.has(key)) { out.find(p => p.key === key).refs.push(ref.key); return; }
   seen.add(key); out.push({key, id: load.id, n: load.n, point: ref.point.slice(), refs: [ref.key], complete: load.complete});
  }));
  return out;
 }
 // Badge offsets affect display only; leader lines always finish at the unchanged true geographic anchor.
 function labels(items, width, height) {
  const placed = [], minX = 53, maxX = Math.max(minX, width - 53), minY = 30, maxY = Math.max(minY, height - 55);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  items.forEach(item => {
   const ax = item.x, ay = item.y;
   const candidates = [{x: clamp(ax, minX, maxX), y: clamp(ay, minY, maxY)}];
   for (let ring = 1; ring <= 10; ring++) for (let i = 0; i < ring * 8; i++) {
    const a = i / (ring * 8) * Math.PI * 2;
    candidates.push({x: clamp(ax + Math.cos(a) * ring * 108, minX, maxX), y: clamp(ay + Math.sin(a) * ring * 61, minY, maxY)});
   }
   // Scan the available map when a dense group cannot fit around its own anchor.
   for (let y = minY; y <= maxY; y += 61) for (let x = minX; x <= maxX; x += 108) candidates.push({x, y});
   const collision = p => placed.some(q => Math.abs(p.x - q.x) < 105 && Math.abs(p.y - q.y) < 58);
   const free = candidates.filter(p => !collision(p) && !(p.x > width - 103 && p.y < 130));
   const choices = free.length ? free : candidates;
   choices.sort((a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay));
   const p = choices[0]; placed.push(Object.assign({}, item, {x: p.x, y: p.y, anchorX: ax, anchorY: ay, crowded: !free.length}));
  });
  if (placed.some(p => p.crowded)) {
   const grid = [];
   for (let y = minY; y <= maxY; y += 61) for (let x = minX; x <= maxX; x += 108) {
    if (!(x > width - 103 && y < 130)) grid.push({x, y});
   }
   if (grid.length >= items.length) return items.map(item => {
    grid.sort((a,b) => Math.hypot(a.x-item.x,a.y-item.y)-Math.hypot(b.x-item.x,b.y-item.y));
    const point = grid.shift();
    return Object.assign({}, item, point, {anchorX:item.x, anchorY:item.y, crowded:false});
   });
  }
  return placed;
 }
 function nativeModel(day, shown) {
  const env = {master: MASTER_LOC, destination: dest782, moved: movedFor, offPlan: typeof offPlanFor === 'function' ? offPlanFor : null};
  return project({day, loads: dpLoads(day), visible: ldGroups(day, shown, 'deliveries'), idOf: ldId,
   stateOf: timeline841State, locationOf: a => location(a, env)});
 }
 function root() { return document.querySelector('#pane-timeline .drops911'); }
 function cardFor(load) {
  const pane = document.getElementById('pane-timeline');
  return pane && [...pane.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl[data-ld]')].find(b => +((b.querySelector('.ld-n b') || {}).textContent) === load.n);
 }
 function reconcile(model) {
  if (ui.day !== model.day) { ui.day = model.day; ui.selected = null; ui.cleared = false; ui.fit = true; ui.listTop = 0; }
  const oldLocations = current && markers(current).map(p => p.key).join(';'), newLocations = markers(model).map(p => p.key).join(';');
  if (oldLocations !== newLocations) ui.fit = true;
  if (!model.loads.some(l => l.id === ui.selected)) ui.selected = null;
  current = model;
 }
 function markup(model) {
  const existing = root(), previousOrder = existing && existing.querySelector('.drops911-order');
  if (previousOrder && existing.dataset.drop911Day === model.day) ui.listTop = previousOrder.scrollTop;
  reconcile(model);
  if (!model.loads.length) return '';
  const can = capability() === 'edit' && !SYNC.readonly;
  const rows = model.loads.map((load, index) => {
   const missing = load.refs.filter(r => !r.point), refs = load.refs.map(r => r.key).join(' · ');
   return '<li class="drops911-order-row"><button type="button" class="drops911-load" data-drop911-select="' + h(load.id) + '" aria-pressed="false"><b class="drops911-number">' + load.n + '</b><span><strong>' + h(refs) + '</strong><span class="drops911-row-meta">' + h([load.time, load.title].filter(Boolean).join(' · ')) + '</span>' +
    (missing.length ? '<span class="drops911-warning">' + h(missing.map(r => r.key + ': ' + r.reason).join(' · ')) + '</span>' : '') + (load.docket ? '<span class="drops911-row-meta">Docket ' + h(load.docket) + '</span>' : '') + (load.complete ? '<span class="drops911-row-meta">Finished ✓</span>' : '') + (load.hiddenByFilter ? '<span class="drops911-filtered">Hidden by current filter</span>' : '') + '</span></button><div class="drops911-order-actions" role="group" aria-label="Change order for ' + h(refs) + '"><button type="button" data-drop911-move="up" data-drop911-id="' + h(load.id) + '" aria-label="Move ' + h(refs) + ' earlier"' + (!can || index === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-drop911-move="down" data-drop911-id="' + h(load.id) + '" aria-label="Move ' + h(refs) + ' later"' + (!can || index === model.loads.length - 1 ? ' disabled' : '') + '>↓</button></div></li>';
  }).join('');
  return '<section class="drops911" aria-label="Delivery map and load order" data-drop911-day="' + h(model.day) + '"><header class="drops911-head"><div><h3>Load order</h3><span>' + model.loads.length + ' load' + (model.loads.length === 1 ? '' : 's') + ' · numbers match the run sheet</span></div><div class="drops911-tools" role="group" aria-label="Delivery map controls"><button type="button" data-drop911-style="street" aria-pressed="' + (ui.style === 'street') + '">Street</button><button type="button" data-drop911-style="satellite" aria-pressed="' + (ui.style === 'satellite') + '">Satellite</button><button type="button" data-drop911-fit>Fit all</button></div></header><div class="drops911-layout"><nav class="drops911-order" aria-label="Select a load in arrival order"><ol>' + rows + '</ol></nav><div class="drops911-map-slot"><div class="drops911-view" role="region" tabindex="0" aria-label="Numbered delivery locations on street or satellite map"><div class="drops911-map"></div><svg class="drops911-leaders" aria-hidden="true"></svg><div class="drops911-pins"></div><div class="drops911-map-note" role="status">Loading map…</div></div></div></div><div class="drops911-detail" aria-live="polite"></div></section>';
 }
 function note(text) { if (!view) return; const el = view.querySelector('.drops911-map-note'); el.textContent = text; el.hidden = !text; }
 function revealSelectedRow() {
  const el = root(), order = el && el.querySelector('.drops911-order');
  const button = order && [...order.querySelectorAll('[data-drop911-select]')].find(b => b.dataset.drop911Select === ui.selected);
  if (!button) return;
  const row = button.closest('li').getBoundingClientRect(), box = order.getBoundingClientRect();
  if (row.top < box.top) order.scrollTop -= box.top - row.top;
  else if (row.bottom > box.bottom) order.scrollTop += row.bottom - box.bottom;
  ui.listTop = order.scrollTop;
 }
 function paint() {
  const el = root(); if (!el || !current) return;
  el.querySelectorAll('[data-drop911-select]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.drop911Select === ui.selected)));
  el.querySelectorAll('[data-drop911-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.drop911Style === ui.style)));
  document.querySelectorAll('#pane-timeline .ld.drops911-selected').forEach(c => c.classList.remove('drops911-selected'));
  const load = current.loads.find(l => l.id === ui.selected), target = load && cardFor(load);
  if (target) target.closest('.ld').classList.add('drops911-selected');
  const box = el.querySelector('.drops911-detail');
  const text = load ? '<span><b>Load ' + load.n + '</b> · ' + load.refs.map(r => h(r.key) + (r.point ? '' : ' — ' + h(r.reason))).join(' · ') + '</span><div>' + (target ? '<button type="button" data-drop911-view>View load ↓</button>' : '<button type="button" data-drop911-show>Show load</button>') + (load.refs.some(r => r.point) ? '<button type="button" data-drop911-focus>Zoom to drop</button>' : '') + '<button type="button" data-drop911-clear aria-label="Clear load selection">Close</button></div>' : '<span>Select a reference to identify its drop; use ↑ / ↓ to set arrival order' + (current.unplaced.length ? ' · ' + current.unplaced.length + ' reference' + (current.unplaced.length === 1 ? '' : 's') + ' awaiting a location' : '') + '</span>';
  if (box.__drop911Text !== text) { box.innerHTML = text; box.__drop911Text = text; }
  if (view) view.querySelectorAll('[data-drop911-marker]').forEach(b => { const selected = b.dataset.drop911Marker === ui.selected; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
 }
 function draw() {
  frame = 0;
  if (!map || !view || !view.isConnected || !current || !view.clientWidth) return;
  const data = markers(current), pins = view.querySelector('.drops911-pins'), lines = view.querySelector('.drops911-leaders');
  const columns = Math.max(1, Math.floor((view.clientWidth - 106) / 108) + 1);
  const rows = Math.ceil((data.length + 2) / columns);
  const height = Math.max(340, 30 + Math.max(0, rows - 1) * 61 + 55);
  if (view.style.height !== height + 'px') { view.style.height = height + 'px'; map.resize(); ui.fit = true; fit(); }
  const projected = data.map(p => { const xy = map.project(p.point); return Object.assign({}, p, {x: xy.x, y: xy.y}); }).filter(p => p.x >= 0 && p.y >= 0 && p.x <= view.clientWidth && p.y <= view.clientHeight);
  const shown = labels(projected, view.clientWidth, view.clientHeight);
  lines.setAttribute('viewBox', '0 0 ' + view.clientWidth + ' ' + view.clientHeight);
  lines.innerHTML = shown.map(p => '<line class="' + (p.id === ui.selected ? 'selected' : '') + '" x1="' + p.anchorX + '" y1="' + p.anchorY + '" x2="' + p.x + '" y2="' + p.y + '"/><circle class="' + (p.id === ui.selected ? 'selected' : '') + '" cx="' + p.anchorX + '" cy="' + p.anchorY + '" r="3"/>').join('');
  const signature = projected.map(p => p.key + ':' + p.n + ':' + p.complete + ':' + p.refs.join(',')).join(';');
  if (pins.__drop911Signature !== signature) {
   pins.innerHTML = projected.map(p => '<button type="button" class="drops911-pin' + (p.complete ? ' finished' : '') + '" data-drop911-marker="' + h(p.id) + '" aria-label="Load ' + p.n + ': ' + h(p.refs.join(', ')) + (p.complete ? '. Finished.' : '') + '"><span>' + p.n + '</span><strong>' + h(p.refs.join(' · ')) + '</strong>' + (p.complete ? '<i aria-hidden="true">✓</i>' : '') + '</button>').join('');
   pins.__drop911Signature = signature;
  }
  [...pins.children].forEach((b, i) => { b.style.left = shown[i].x + 'px'; b.style.top = shown[i].y + 'px'; });
  paint();
 }
 function scheduleDraw() { if (!frame) frame = requestAnimationFrame(draw); }
 function fit() {
  if (!map || !current || !view || !view.clientWidth) return;
  const points = markers(current).map(p => p.point);
  if (!points.length) { note('No confirmed drop locations yet. All loads are listed alongside.'); ui.fit = false; return; }
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], {padding: {top: 50, bottom: 65, left: 55, right: 55}, maxZoom: 17.5, duration: 0});
  ui.fit = false;
 }
 function dispose() {
  generation++; loading = false;
  if (resize) resize.disconnect(); resize = null;
  if (frame) cancelAnimationFrame(frame); frame = 0;
  if (map) { try { map.remove(); } catch (_) {} } map = null; applyStyle = null; view = null; mapStatus = 'idle';
 }
 async function initialise() {
  if (loading || map || !view || !view.isConnected) return;
  const host = view, ticket = ++generation; loading = true; mapStatus = 'loading'; note('Loading map…');
  try {
   await liveMapKeyFromService();
   const key = liveMapKey();
   if (!key || !key.token) throw new Error('Map unavailable');
   const gl = await loadMapboxGl();
   if (ticket !== generation || view !== host || !host.isConnected) return;
   gl.accessToken = key.token;
   const first = current && markers(current)[0];
   map = new gl.Map({container: host.querySelector('.drops911-map'), style: ui.style === 'street' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12', center: first ? first.point : [153.428, -27.987], zoom: 14, attributionControl: true, cooperativeGestures: true, dragRotate: false, pitchWithRotate: false, touchPitch: false});
   map.addControl(new gl.NavigationControl({showCompass: false}), 'top-right');
   let tileContent = false, errorSinceContent = false;
   applyStyle = () => { tileContent = false; errorSinceContent = false; mapStatus = 'loading'; note('Loading map…'); map.setStyle(ui.style === 'street' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12', {diff: false}); };
   const recover = () => { if (view === host && map && tileContent && !errorSinceContent && map.isStyleLoaded() && map.areTilesLoaded()) { mapStatus = 'ready'; note(current && markers(current).length ? '' : 'No confirmed drop locations yet. All loads are listed alongside.'); } };
   map.on('sourcedata', e => { if (view === host && (e.sourceDataType === 'content' || e.isSourceLoaded)) { tileContent = true; errorSinceContent = false; } });
   map.on('idle', recover);
   map.on('render', recover);
   map.on('move', scheduleDraw);
   map.on('resize', scheduleDraw);
   map.on('load', () => { if (view !== host) return; recover(); ui.fit = true; fit(); scheduleDraw(); });
   map.on('style.load', () => { if (view !== host) return; recover(); scheduleDraw(); });
   map.on('error', () => { if (view === host) { errorSinceContent = true; mapStatus = 'unavailable'; note('Map unavailable. Load order and locations remain listed alongside.'); } });
   fit(); scheduleDraw();
  } catch (_) { if (ticket === generation && view === host) { mapStatus = 'unavailable'; note('Map unavailable. Load order and locations remain listed alongside.'); } }
  finally { if (ticket === generation) loading = false; }
 }
 function mount(pane) {
  const el = pane.querySelector('.drops911');
  if (!el) { dispose(); return; }
  const placeholder = el.querySelector('.drops911-view');
  if (view && view !== placeholder) placeholder.replaceWith(view); else view = placeholder;
  if (resize) resize.disconnect();
  let size = [view.clientWidth, view.clientHeight];
  resize = new ResizeObserver(() => { if (map) { const next = [view.clientWidth, view.clientHeight]; if (size[0] !== next[0] || size[1] !== next[1]) ui.fit = true; size = next; map.resize(); if (ui.fit) fit(); scheduleDraw(); } });
  resize.observe(view);
  const order = el.querySelector('.drops911-order'), desiredTop = ui.listTop; let restoringOrder = true;
  order.scrollTop = desiredTop;
  requestAnimationFrame(() => { if (order.isConnected) { order.scrollTop = ui.listTop; restoringOrder = false; } });
  order.addEventListener('scroll', () => { if (!restoringOrder && order.isConnected && root() && root().contains(order)) ui.listTop = order.scrollTop; }, {passive: true});
  const open = current && current.loads.find(l => { const b = cardFor(l); return b && b.getAttribute('aria-expanded') === 'true'; });
  if (open && !ui.cleared && !ui.selected) ui.selected = open.id;
  paint();
  if (map) { map.resize(); if (ui.fit) fit(); if (frame) cancelAnimationFrame(frame); draw(); }
  else if (mapStatus !== 'unavailable') initialise();
  if (!lifecycle) {
   lifecycle = new MutationObserver(() => { if (view && !view.isConnected) dispose(); });
   lifecycle.observe(pane, {childList: true});
  }
 }
 function select(id, open) {
  if (!current) return;
  const load = current.loads.find(l => l.id === id); if (!load) return;
  ui.selected = id; ui.cleared = false;
  const b = cardFor(load);
  if (open && b && b.getAttribute('aria-expanded') !== 'true') {
   const scroller = ldScroller(b), top = scroller.scrollTop;
   state.tlLoad = b.dataset.ld; render(); scroller.scrollTop = top;
   const choice = root() && [...root().querySelectorAll('[data-drop911-select]')].find(x => x.dataset.drop911Select === id); if (choice) choice.focus({preventScroll: true});
  }
  paint(); revealSelectedRow(); scheduleDraw();
 }
 const api = {location, validLL, project, markers, labels, report: () => ({day: ui.day, selected: ui.selected, style: ui.style, status: mapStatus, model: current, tilesReady: !!map && map.areTilesLoaded(), styleReady: !!map && map.isStyleLoaded()})};
 if (typeof window !== 'undefined') window.Drops911 = api;
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 if (typeof ldList !== 'function' || typeof ldWire !== 'function' || typeof dayBlock !== 'function') return;
 const beforeList = ldList, beforeWire = ldWire, beforeDay = dayBlock;
 ldList = function (d, shown, kind) {
  const native = beforeList(d, shown, kind).replace(/<section class="drops908"[\s\S]*?<\/section>/g, '');
  return kind === 'deliveries' && (state.tlView || 'day') === 'day' ? markup(nativeModel(d, shown)) + native : native;
 };
 // Native dayBlock does not call ldList if a search hides every delivery. Keep the day's whole order visible.
 dayBlock = function (d, full) {
  const html = beforeDay(d, full);
  if (!full || (state.tlView || 'day') !== 'day' || html.includes('class="drops911"') || !d.deliveries.length) return html;
  const anchor = '<p class="norate">Nothing due in matches the filter.</p>';
  return html.includes(anchor) ? html.replace(anchor, markup(nativeModel(d, [])) + anchor) : html;
 };
 ldWire = function (pane) { const result = beforeWire(pane); mount(pane); return result; };
 document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.drops911 button, #pane-timeline .ldlist[aria-label^="Due in"] .ldl[data-ld]');
  if (!b) return;
  if (!b.closest('.drops911')) {
   if (current) { const n = +((b.querySelector('.ld-n b') || {}).textContent), load = current.loads.find(l => l.n === n); if (load) { ui.selected = load.id; ui.cleared = false; } }
   return;
  }
  e.preventDefault();
  if (b.hasAttribute('data-drop911-move')) {
   e.stopImmediatePropagation(); if (b.disabled || capability() !== 'edit' || SYNC.readonly) return;
   const id = b.dataset.drop911Id, dir = b.dataset.drop911Move;
   if (!current || !current.loads.some(l => l.id === id)) return;
   ui.selected = id; ui.cleared = false;
   const accepted = flow891Move(current.day, id, dir);
   paint(); revealSelectedRow(); scheduleDraw();
   const next = root() && [...root().querySelectorAll('[data-drop911-move]')].find(x => x.dataset.drop911Id === id && x.dataset.drop911Move === dir && !x.disabled);
   if (next) next.focus({preventScroll: true});
   if (accepted && bump.kept === false) flash('The new order is not saved yet. Check the unsaved record notice.');
  } else if (b.hasAttribute('data-drop911-focus')) {
   const load = current && current.loads.find(l => l.id === ui.selected), points = load && load.refs.filter(r => r.point).map(r => r.point);
   if (map && points && points.length) { const xs = points.map(p => p[0]), ys = points.map(p => p[1]); map.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:75,maxZoom:19,duration:0}); scheduleDraw(); }
  } else if (b.hasAttribute('data-drop911-select') || b.hasAttribute('data-drop911-marker')) select(b.dataset.drop911Select || b.dataset.drop911Marker, true);
  else if (b.hasAttribute('data-drop911-clear')) { const previous = ui.selected; ui.selected = null; ui.cleared = true; paint(); scheduleDraw(); const el = root(), choice = el && [...el.querySelectorAll('[data-drop911-select]')].find(x => x.dataset.drop911Select === previous); if (choice) choice.focus({preventScroll: true}); else if (view) view.focus({preventScroll: true}); }
  else if (b.hasAttribute('data-drop911-fit')) { ui.fit = true; if (!map && mapStatus === 'unavailable') { if (typeof LIVEMAP !== 'undefined' && LIVEMAP.env === null) LIVEMAP.env = undefined; mapStatus = 'idle'; initialise(); } else { if (mapStatus === 'unavailable' && applyStyle) applyStyle(); fit(); scheduleDraw(); } }
  else if (b.hasAttribute('data-drop911-style')) { ui.style = b.dataset.drop911Style; if (applyStyle) applyStyle(); paint(); }
  else if (b.hasAttribute('data-drop911-view')) {
   const load = current.loads.find(l => l.id === ui.selected), target = load && cardFor(load);
   if (target) { target.scrollIntoView({block: 'start', behavior: 'auto'}); target.focus({preventScroll: true}); }
  } else if (b.hasAttribute('data-drop911-show')) {
   // These are the native Timeline filters only. Nothing in the shared record is changed.
   const id = ui.selected; state.q = ''; state.disc = ''; state.light = ''; render(); select(id, true);
   const load = current && current.loads.find(l => l.id === id), target = load && cardFor(load);
   if (target) { target.scrollIntoView({block: 'start', behavior: 'auto'}); target.focus({preventScroll: true}); }
  }
 }, true);
})();
