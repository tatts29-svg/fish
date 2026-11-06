/* Author: Andrew Fisher. Daily load order beside the original master-plan drawing. */
(function () {
 'use strict';
 const ui = {day: '', selected: null, cleared: false, open: false, anchor: null, fit: true, listTop: 0};
 let current = null, map = null, view = null, resize = null, lifecycle = null, loading = false, generation = 0, frame = 0, mapStatus = 'idle';
 let parked = null, restoreCamera = null;
 const h = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && v >= 0 && v <= 1);
 function location(a, env) {
  const m = env.master[a.key], d = env.destination(a), moved = env.moved(a);
  const reject = reason => ({point: null, reason});
  if (!d || !d.ll) return reject(moved ? 'New drop needs confirmation' : 'Drop location to confirm');
  const independent = d.kind === 'pinned' && !(d.nt && d.nt.fix && d.nt.fix.master);
  if (d.kind === 'report') return reject('Report point only · drop to confirm');
  if (d.kind === 'unverified' || (m && m.unverified && !independent)) return reject('Drawing position not verified');
  if (moved && !independent) return reject('New drop needs confirmation');
  if (d.approx || d.kind === 'placed' || d.kind === 'area') return reject('Exact drop to confirm');
  const master = m && (d.kind === 'master' || d.kind === 'confirmed' || d.kind === 'desc' || (d.nt && d.nt.fix && d.nt.fix.master));
  if (master) {
   if (m.prec !== 'unit' && !m.confirmed) return reject('Area only · exact drop to confirm');
   if (!validPoint(m.pt)) return reject('Master-plan position needs checking');
   return {point:m.pt.slice(),source:'Master-plan unit position'};
  }
  if (!independent && d.kind !== 'confirmed' && d.kind !== 'desc') return reject('Drop location to confirm');
  if (!Number.isFinite(d.ll.lat) || !Number.isFinite(d.ll.lon)) return reject('Recorded coordinates need checking');
  const frame = env.frame(d.ll.lat,d.ll.lon), sheet = frame && env.toSheet(env.sheet,frame.ax,frame.ay);
  if (!sheet || !validPoint([sheet.fx,sheet.fy])) return reject('Recorded position is outside the master plan');
  return {point:[sheet.fx,sheet.fy],source:independent ? (d.sms || 'Recorded position on master plan') : 'Confirmed position on master plan'};
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
 // Badge offsets affect display only; leader lines always finish at the unchanged master-plan anchor.
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
   const free = candidates.filter(p => !collision(p) && !(p.x > width - 103 && p.y < 130) && !(p.x > width - 130 && p.y > height - 200));
   const choices = free.length ? free : candidates;
   choices.sort((a, b) => Math.hypot(a.x - ax, a.y - ay) - Math.hypot(b.x - ax, b.y - ay));
   const p = choices[0]; placed.push(Object.assign({}, item, {x: p.x, y: p.y, anchorX: ax, anchorY: ay, crowded: !free.length}));
  });
  if (placed.some(p => p.crowded)) {
   const grid = [];
   for (let y = minY; y <= maxY; y += 61) for (let x = minX; x <= maxX; x += 108) {
    if (!(x > width - 103 && y < 130) && !(x > width - 130 && y > height - 200)) grid.push({x, y});
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
  const env = {master: MASTER_LOC, destination: dest782, moved: movedFor, sheet: DATA.sheets.find(s => s.key === 'D001'), frame: frameOf, toSheet: sheetPointOf};
  return project({day, loads: dpLoads(day), visible: ldGroups(day, shown, 'deliveries'), idOf: ldId,
   stateOf: timeline841State, locationOf: a => location(a, env)});
 }
 function root() { return document.querySelector('#pane-timeline .drops911'); }
 function reflectOpen() {
  document.querySelectorAll('#pane-timeline [data-drop911-open]').forEach(b => b.setAttribute('aria-expanded', String(ui.open && b.dataset.drop911Open === ui.anchor)));
 }
 function cardFor(load) {
  const pane = document.getElementById('pane-timeline');
  return pane && [...pane.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl[data-ld]')].find(b => +((b.querySelector('.ld-n b') || {}).textContent) === load.n);
 }
 function reconcile(model) {
  const existing = root(), previousOrder = existing && existing.querySelector('.drops911-order');
  if (previousOrder && existing.dataset.drop911Day === model.day) ui.listTop = previousOrder.scrollTop;
  if (ui.day !== model.day) { ui.day = model.day; ui.selected = null; ui.cleared = false; ui.open = false; ui.anchor = null; ui.fit = true; ui.listTop = 0; }
  const oldLocations = current && markers(current).map(p => p.key).sort().join(';'), newLocations = markers(model).map(p => p.key).sort().join(';');
  if (oldLocations !== newLocations) ui.fit = true;
  if (!model.loads.some(l => l.id === ui.selected)) ui.selected = null;
  if (!model.loads.some(l => l.id === ui.anchor)) ui.anchor = model.loads[0] && model.loads[0].id || null;
  current = model;
 }
 function markup(model) {
  if (!model.loads.length) return '';
  const can = capability() === 'edit' && !SYNC.readonly;
  const rows = model.loads.map((load, index) => {
   const missing = load.refs.filter(r => !r.point), refs = load.refs.map(r => r.key).join(' · ');
   return '<li class="drops911-order-row"><button type="button" class="drops911-load" data-drop911-select="' + h(load.id) + '" aria-pressed="false"><b class="drops911-number">' + load.n + '</b><span><strong>' + h(refs) + '</strong><span class="drops911-row-meta">' + h([load.time, load.title].filter(Boolean).join(' · ')) + '</span>' +
    (missing.length ? '<span class="drops911-warning">' + h(missing.map(r => r.key + ': ' + r.reason).join(' · ')) + '</span>' : '') + (load.docket ? '<span class="drops911-row-meta">Docket ' + h(load.docket) + '</span>' : '') + (load.complete ? '<span class="drops911-row-meta">Finished ✓</span>' : '') + (load.hiddenByFilter ? '<span class="drops911-filtered">Hidden by current filter</span>' : '') + '</span></button><div class="drops911-order-actions" role="group" aria-label="Change order for ' + h(refs) + '"><button type="button" data-drop911-move="up" data-drop911-id="' + h(load.id) + '" aria-label="Move ' + h(refs) + ' earlier"' + (!can || index === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-drop911-move="down" data-drop911-id="' + h(load.id) + '" aria-label="Move ' + h(refs) + ' later"' + (!can || index === model.loads.length - 1 ? ' disabled' : '') + '>↓</button></div></li>';
  }).join('');
  return '<section id="drops911-workspace" class="drops911" aria-label="Arrange the day’s loads" data-drop911-day="' + h(model.day) + '"><header class="drops911-head"><div><h3>Arrange loads</h3><span>' + model.loads.length + ' load' + (model.loads.length === 1 ? '' : 's') + ' · whole day · numbers match the run sheet</span></div><div class="drops911-tools" role="group" aria-label="Delivery map controls"><button type="button" data-drop911-zoom="out" aria-label="Zoom out">−</button><output data-drop911-percent aria-label="Master plan zoom">100%</output><button type="button" data-drop911-zoom="in" aria-label="Zoom in">+</button><button type="button" data-drop911-zoom="16000">16,000%</button><button type="button" data-drop911-fit>Fit all</button><button type="button" data-drop911-close aria-label="Close Arrange loads">Close</button></div></header><div class="drops911-layout"><nav class="drops911-order" aria-label="Select a load in arrival order"><ol>' + rows + '</ol></nav><div class="drops911-map-slot"><div class="drops911-view" role="region" tabindex="0" aria-label="Numbered delivery locations on the master plan"><div class="drops911-map"></div><svg class="drops911-leaders" aria-hidden="true"></svg><div class="drops911-pins"></div><div class="drops911-map-note" role="status">Loading master plan…</div></div></div></div><div class="drops911-detail" aria-live="polite"></div></section>';
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
  const percent = el.querySelector('[data-drop911-percent]'); if (percent && map && map.getZoom()) percent.textContent = Math.round(map.getZoom()).toLocaleString('en-AU') + '%';
  document.querySelectorAll('#pane-timeline .ld.drops911-selected').forEach(c => c.classList.remove('drops911-selected'));
  const load = current.loads.find(l => l.id === ui.selected), target = load && cardFor(load);
  if (target) target.closest('.ld').classList.add('drops911-selected');
  const box = el.querySelector('.drops911-detail');
  const text = load ? '<span><b>Load ' + load.n + '</b> · ' + load.refs.map(r => h(r.key) + (r.point ? '' : ' — ' + h(r.reason))).join(' · ') + '</span><div>' + (target ? '<button type="button" data-drop911-view>View load ↓</button>' : '<button type="button" data-drop911-show>Show load</button>') + (load.refs.some(r => r.point) ? '<button type="button" data-drop911-focus>Zoom to drop</button>' : '') + '<button type="button" data-drop911-clear aria-label="Clear load selection">Clear selection</button></div>' : '<span>Select a reference to identify its drop; use ↑ / ↓ to set arrival order' + (current.unplaced.length ? ' · ' + current.unplaced.length + ' reference' + (current.unplaced.length === 1 ? '' : 's') + ' awaiting a location' : '') + '</span>';
  if (box.__drop911Text !== text) { box.innerHTML = text; box.__drop911Text = text; }
  if (view) view.querySelectorAll('[data-drop911-marker]').forEach(b => { const selected = b.dataset.drop911Marker === ui.selected; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
 }
 function draw() {
  frame = 0;
  if (!map || !view || !view.isConnected || !current || !view.clientWidth) return;
  if (!map.ready) { restoreCamera = map.capture(); map.destroy(); map = null; mapStatus = 'idle'; initialise(); return; }
  const data = markers(current), pins = view.querySelector('.drops911-pins'), lines = view.querySelector('.drops911-leaders');
  const columns = Math.max(1, Math.floor((view.clientWidth - 106) / 108) + 1);
  const rows = Math.ceil((data.length + 4) / columns);
  const height = Math.max(420, 30 + Math.max(0, rows - 1) * 61 + 55);
  if (view.style.height !== height + 'px') { view.style.height = height + 'px'; map.resize(); ui.fit = true; fit(); }
  const projected = data.map(p => { const xy = map.project(p.point); return xy ? Object.assign({}, p, {x: xy.x, y: xy.y}) : null; }).filter(p => p && p.x >= 0 && p.y >= 0 && p.x <= view.clientWidth && p.y <= view.clientHeight);
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
  map.fit(points);
  ui.fit = false;
 }
 function dispose() {
  generation++; loading = false;
  if (resize) resize.disconnect(); resize = null;
  if (frame) cancelAnimationFrame(frame); frame = 0;
  if (map) { try { map.destroy(); } catch (_) {} } if (view && view.parentElement === parked) view.remove(); map = null; view = null; mapStatus = 'idle';
 }
 async function initialise() {
  if (loading || map || !view || !view.isConnected) return;
  const host = view, ticket = ++generation; loading = true; mapStatus = 'loading'; note('Loading master plan…');
  // Size a recreated viewport before the explorer restores its camera. A first-draw height
  // change would otherwise fit all loads over the close-up we have just restored.
  const columns = Math.max(1, Math.floor((host.clientWidth - 106) / 108) + 1), rows = Math.ceil(((current ? markers(current).length : 0) + 4) / columns);
  host.style.height = Math.max(420, 30 + Math.max(0, rows - 1) * 61 + 55) + 'px';
  try {
   const next = await MasterPlan911.create(host.querySelector('.drops911-map'), {change: scheduleDraw});
   if (ticket !== generation || view !== host || !host.isConnected) { next.destroy(); return; }
   map = next; mapStatus = 'ready';
   note(current && markers(current).length ? '' : 'No confirmed drop locations yet. All loads are listed alongside.');
   if (restoreCamera) { map.restore(restoreCamera); restoreCamera = null; ui.fit = false; } else { ui.fit = true; fit(); } scheduleDraw();
  } catch (_) { if (ticket === generation && view === host) { mapStatus = 'unavailable'; note('Master plan unavailable. Load order and locations remain listed alongside.'); } }
  finally { if (ticket === generation) loading = false; }
 }
 function mount(pane) {
  if ((state.tlView || 'day') !== 'day') ui.open = false;
  reflectOpen();
  if (!ui.open || !current || !current.loads.length || (state.tlView || 'day') !== 'day') { const existing = root(); if (existing) existing.remove(); pane.querySelectorAll('.drops911-anchor').forEach(n => n.classList.remove('drops911-anchor')); dispose(); return; }
  let anchor = current.loads.find(l => l.id === ui.anchor), button = anchor && cardFor(anchor);
  if (!button) { const visible = current.loads.find(l => cardFor(l)); if (visible) { anchor = visible; ui.anchor = visible.id; button = cardFor(visible); reflectOpen(); } }
  const card = button && button.closest('.ld');
  const fallback = pane.querySelector('[data-drop911-fallback]');
  if (!card && !fallback) { ui.open = false; reflectOpen(); dispose(); return; }
  let el = root();
  if (!el) { const template = document.createElement('template'); template.innerHTML = markup(current); el = template.content.firstElementChild; }
  pane.querySelectorAll('.drops911-anchor').forEach(n => n.classList.remove('drops911-anchor'));
  if (card) { card.classList.add('drops911-anchor'); card.querySelector('.tl846-layout').after(el); }
  else fallback.append(el);
  const placeholder = el.querySelector('.drops911-view');
  if (view && view !== placeholder) { if (view.isConnected && typeof placeholder.parentElement.moveBefore === 'function') { placeholder.parentElement.moveBefore(view,placeholder); placeholder.remove(); } else placeholder.replaceWith(view); } else view = placeholder;
  if (resize) resize.disconnect();
  let size = [view.clientWidth, view.clientHeight];
  resize = new ResizeObserver(() => { if (!view) return; const next = [view.clientWidth, view.clientHeight], changed = size[0] !== next[0] || size[1] !== next[1]; size = next; if (map) { if (changed) ui.fit = true; map.resize(); if (ui.fit) fit(); scheduleDraw(); } });
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
 function openWorkspace(id) {
  if (!current || !current.loads.length) return;
  const load = current.loads.find(l => l.id === id) || current.loads[0];
  ui.anchor = load.id; ui.selected = load.id; ui.cleared = false; ui.open = true;
  mount(document.getElementById('pane-timeline')); paint(); revealSelectedRow(); scheduleDraw();
  const selected = root() && [...root().querySelectorAll('[data-drop911-select]')].find(b => b.dataset.drop911Select === load.id);
  if (selected) selected.focus({preventScroll: true});
 }
 function closeWorkspace() {
  const pane = document.getElementById('pane-timeline'), id = ui.anchor, el = root();
  const opener = pane && [...pane.querySelectorAll('[data-drop911-open]')].find(b => b.dataset.drop911Open === id);
  const scroller = opener && ldScroller(opener), top = scroller && scroller.scrollTop;
  ui.open = false; ui.selected = null; ui.cleared = true; restoreCamera = null;
  if (el) el.remove(); dispose();
  if (pane) pane.querySelectorAll('.drops911-anchor,.drops911-selected').forEach(n => n.classList.remove('drops911-anchor', 'drops911-selected'));
  reflectOpen();
  if (scroller) scroller.scrollTop = top;
  const target = opener || pane && pane.querySelector('[data-drop911-open]');
  if (target) target.focus({preventScroll: true});
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
  if (map && view) {
   const points = load.refs.filter(r => r.point).map(r => r.point);
   if (points.length && !points.some(point => { const p = map.project(point); return p && p.x >= 0 && p.y >= 0 && p.x <= view.clientWidth && p.y <= view.clientHeight; })) map.focus(points);
  }
  paint(); revealSelectedRow(); scheduleDraw();
 }
 const api = {location, validPoint, project, markers, labels, report: () => ({day: ui.day, open: ui.open, anchor: ui.anchor, selected: ui.selected, style: 'master', status: mapStatus, model: current, zoom: map && map.getZoom(), tilesReady: !!map && map.ready, styleReady: !!map && map.ready})};
 if (typeof window !== 'undefined') window.Drops911 = api;
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 if (typeof ldList !== 'function' || typeof ldWire !== 'function' || typeof dayBlock !== 'function') return;
 const beforeRender = render;
 render = function (...args) {
  if (view && view.isConnected) {
   if (typeof document.body.moveBefore === 'function') {
    if (!parked) { parked = document.createElement('div'); parked.id = 'drops911-park'; parked.hidden = true; document.body.append(parked); }
    parked.moveBefore(view,null);
   } else {
    restoreCamera = map && map.capture() || restoreCamera;
    // Also invalidate an in-flight create(): its old iframe must never become the new map.
    dispose();
   }
  }
  const result = beforeRender.apply(this,args);
  if (view && view.parentElement === parked) {
   const pane = document.getElementById('pane-timeline');
   if (pane && pane.offsetWidth && pane.offsetHeight && ui.open) mount(pane); else dispose();
  }
  return result;
 };
 const beforeList = ldList, beforeWire = ldWire, beforeDay = dayBlock, beforeLine = ldLine;
 ldLine = function (d, g, n, open, timed) {
  const native = beforeLine(d, g, n, open, timed);
  if (!g || g.kind !== 'deliveries' || (state.tlView || 'day') !== 'day') return native;
  const template = document.createElement('template'); template.innerHTML = native;
  const utility = template.content.querySelector('.timeline908-utility'); if (!utility) return native;
  const canonical = dpLoads(d)[n - 1] || g;
  const button = document.createElement('button'); button.type = 'button'; button.className = 'btn drops911-open'; button.dataset.drop911Open = ldId(d, canonical);
  button.setAttribute('aria-expanded', String(ui.open && ui.anchor === button.dataset.drop911Open)); button.setAttribute('aria-controls', 'drops911-workspace'); button.textContent = 'Arrange loads';
  (utility.querySelector('.flow891-ord') || utility).append(button);
  return template.innerHTML;
 };
 ldList = function (d, shown, kind) {
  if (kind === 'deliveries' && (state.tlView || 'day') === 'day') reconcile(nativeModel(d, shown));
  const native = beforeList(d, shown, kind).replace(/<section class="drops908"[\s\S]*?<\/section>/g, '');
  return native;
 };
 // Native dayBlock does not call ldList if a search hides every delivery. Keep the day's whole order visible.
 dayBlock = function (d, full) {
  const html = beforeDay(d, full);
  if (!full || (state.tlView || 'day') !== 'day' || !d.deliveries.length) return html;
  const anchor = '<p class="norate">Nothing due in matches the filter.</p>';
  if (!html.includes(anchor)) return html;
  reconcile(nativeModel(d, []));
  return html.replace(anchor, '<div class="drops911-fallback" data-drop911-fallback><button type="button" class="btn drops911-open" data-drop911-open="' + h(ui.anchor || current.loads[0] && current.loads[0].id || '') + '" aria-expanded="' + ui.open + '" aria-controls="drops911-workspace">Arrange loads</button></div>' + anchor);
 };
 ldWire = function (pane) { const result = beforeWire(pane); mount(pane); return result; };
 document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#pane-timeline [data-drop911-open], .drops911 button, #pane-timeline .ldlist[aria-label^="Due in"] .ldl[data-ld]');
  if (!b) return;
  if (b.hasAttribute('data-drop911-open')) { e.preventDefault(); e.stopPropagation(); openWorkspace(b.dataset.drop911Open); return; }
  if (!b.closest('.drops911')) {
   if (current) { const n = +((b.querySelector('.ld-n b') || {}).textContent), load = current.loads.find(l => l.n === n); if (load) { ui.selected = load.id; ui.cleared = false; } }
   return;
  }
  e.preventDefault();
  if (b.hasAttribute('data-drop911-close')) closeWorkspace();
  else if (b.hasAttribute('data-drop911-move')) {
   e.stopImmediatePropagation(); if (b.disabled || capability() !== 'edit' || SYNC.readonly) return;
   const id = b.dataset.drop911Id, dir = b.dataset.drop911Move;
   if (!current || !current.loads.some(l => l.id === id)) return;
   ui.selected = id; ui.cleared = false;
   const accepted = flow891Move(current.day, id, dir);
   paint(); revealSelectedRow(); scheduleDraw();
   const next = root() && [...root().querySelectorAll('[data-drop911-move]')].find(x => x.dataset.drop911Id === id && x.dataset.drop911Move === dir && !x.disabled);
   const selected = root() && [...root().querySelectorAll('[data-drop911-select]')].find(x => x.dataset.drop911Select === id);
   if (next || selected) (next || selected).focus({preventScroll: true});
   if (accepted && bump.kept === false) flash('The new order is not saved yet. Check the unsaved record notice.');
  } else if (b.hasAttribute('data-drop911-focus')) {
   const load = current && current.loads.find(l => l.id === ui.selected), points = load && load.refs.filter(r => r.point).map(r => r.point);
   if (map && points && points.length) { map.focus(points); scheduleDraw(); }
  } else if (b.hasAttribute('data-drop911-select') || b.hasAttribute('data-drop911-marker')) select(b.dataset.drop911Select || b.dataset.drop911Marker, false);
  else if (b.hasAttribute('data-drop911-clear')) { const previous = ui.selected; ui.selected = null; ui.cleared = true; paint(); scheduleDraw(); const el = root(), choice = el && [...el.querySelectorAll('[data-drop911-select]')].find(x => x.dataset.drop911Select === previous); if (choice) choice.focus({preventScroll: true}); else if (view) view.focus({preventScroll: true}); }
  else if (b.hasAttribute('data-drop911-fit')) { ui.fit = true; if (!map && mapStatus === 'unavailable') { mapStatus = 'idle'; initialise(); } else { fit(); scheduleDraw(); } }
  else if (b.hasAttribute('data-drop911-zoom')) { if (map) { const action = b.dataset.drop911Zoom; map.zoom(action === 'in' ? map.getZoom()*1.5 : action === 'out' ? map.getZoom()/1.5 : Number(action)); scheduleDraw(); } }
  else if (b.hasAttribute('data-drop911-view')) {
   const id = ui.selected; closeWorkspace(); select(id, true);
   const load = current.loads.find(l => l.id === id), target = load && cardFor(load);
   if (target) { target.scrollIntoView({block: 'start', behavior: 'auto'}); target.focus({preventScroll: true}); }
  } else if (b.hasAttribute('data-drop911-show')) {
   // These are the native Timeline filters only. Nothing in the shared record is changed.
   const id = ui.selected; closeWorkspace(); state.q = ''; state.disc = ''; state.light = ''; render(); select(id, true);
   const load = current && current.loads.find(l => l.id === id), target = load && cardFor(load);
   if (target) { target.scrollIntoView({block: 'start', behavior: 'auto'}); target.focus({preventScroll: true}); }
  }
 }, true);
 document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.open && root() && root().contains(e.target)) { e.preventDefault(); closeWorkspace(); } });
})();
