/* Author: Andrew Fisher. Daily delivery locations; native loads, positions and completion remain authoritative. */
(function () {
 'use strict';
 const ui = {day: '', selected: null, chooser: null, cleared: false, fit: true, zoom: 1, cx: .5, cy: .5};
 let current = null, resize = null;
 const h = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1);

 // Never turn a report/holding point or a drawing's approximate area into an exact delivery destination.
 function location(a, env) {
  const m = env.master[a.key], d = env.destination(a), moved = env.moved(a);
  const reject = reason => ({point: null, reason});
  if (!d || !d.ll) return reject(moved ? 'New location needs confirmation' : 'Drop location needs confirmation');
  if (d.kind === 'report') return reject('Report to pit lane; drop location not set');
  const recorded = d.kind === 'pinned' && !(d.nt && d.nt.fix && d.nt.fix.master);
  if (d.kind === 'unverified' || (m && m.unverified && !recorded)) return reject('Drawing position not verified');
  if (moved && !recorded) return reject('New location needs confirmation');
  if (d.kind === 'placed' || d.kind === 'area' || d.approx) return reject('Exact drop location needs confirmation');
  const masterHeld = m && (d.kind === 'master' || d.kind === 'confirmed' || d.kind === 'desc' || (d.nt && d.nt.fix && d.nt.fix.master));
  if (masterHeld) {
   if (m.prec !== 'unit' && !m.confirmed) return reject('Master plan names an area; exact drop to confirm');
   if (!validPoint(m.pt)) return reject('Master-plan position is outside this sheet');
   return {point: m.pt.slice(), source: d.kind === 'confirmed' ? 'Confirmed master-plan position' : 'Master-plan unit position'};
  }
  if (!recorded && d.kind !== 'confirmed' && d.kind !== 'desc') return reject('Drop location needs confirmation');
  const lat = d.ll.lat, lon = d.ll.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return reject('Recorded coordinates need checking');
  const f = env.frame(lat, lon), p = f && env.toSheet(env.sheet, f.ax, f.ay);
  if (!p || !validPoint([p.fx, p.fy])) return reject('Confirmed location is outside this master sheet');
  return {point: [p.fx, p.fy], source: recorded ? (d.sms || 'Recorded GPS position') : 'Confirmed ground location'};
 }

 // Number and identity are assigned from the FULL native order, before any search filtering.
 function project(input) {
  const full = input.loads.map((g, i) => ({g, n: i + 1, id: input.idOf(input.day, g)}));
  const loads = input.visible.map(v => {
   const base = full[v.n - 1];
   if (!base || base.g.kind !== 'deliveries' || v.g.kind !== 'deliveries') return null;
   const unique = rows => [...new Map(rows.map(r => [r.a.key, r.a])).values()];
   const all = unique(base.g.rows), shown = unique(v.g.rows);
   const refs = shown.map(a => ({key: a.key, complete: input.stateOf(a).stage === 5, ...input.locationOf(a)}));
   return {id: base.id, renderedId: input.idOf(input.day, v.g), n: base.n, refs,
    allRefs: all.map(a => a.key), complete: all.length > 0 && all.every(a => input.stateOf(a).stage === 5)};
  }).filter(Boolean);
  const points = [], byPoint = new Map(), unplaced = [];
  loads.forEach(load => load.refs.forEach(ref => {
   if (!ref.point) { unplaced.push({id: load.id, n: load.n, ...ref}); return; }
   const key = ref.point.join('|');
   let p = byPoint.get(key);
   if (!p) { p = {key, point: ref.point.slice(), members: []}; byPoint.set(key, p); points.push(p); }
   p.members.push({id: load.id, n: load.n, key: ref.key, complete: ref.complete, loadComplete: load.complete});
  }));
  points.forEach(p => { p.numbers = [...new Set(p.members.map(m => m.n))]; p.complete = p.members.every(m => m.loadComplete); });
  return {day: input.day.iso, loads, points, unplaced};
 }
 // Overlapping 44px hit targets share a chooser at one existing point, never invented/displaced coordinates.
 function clusters(points, width, height) {
  const groups = points.map((p, i) => [i]);
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length;) {
   const overlaps = groups[i].some(a => groups[j].some(b => Math.abs(points[a].point[0] - points[b].point[0]) * width < 66 && Math.abs(points[a].point[1] - points[b].point[1]) * height < 52));
   if (overlaps) { groups[i].push(...groups[j]); groups.splice(j, 1); j = i + 1; } else j++;
  }
  return groups;
 }
 function nativeModel(d, shown) {
  const sheet = DATA.sheets.find(s => s.key === 'D001');
  const env = {master: MASTER_LOC, destination: dest782, moved: movedFor, sheet, frame: frameOf, toSheet: sheetPointOf};
  const result = project({day: d, loads: dpLoads(d), visible: ldGroups(d, shown, 'deliveries'), idOf: ldId,
   stateOf: timeline841State, locationOf: a => location(a, env)});
  result.sheet = sheet;
  return result;
 }
 function reconcile(model) {
  if (ui.day !== model.day) { ui.day = model.day; ui.selected = null; ui.chooser = null; ui.cleared = false; ui.fit = true; ui.zoom = 1; ui.cx = ui.cy = .5; }
  if (!model.loads.some(l => l.id === ui.selected)) ui.selected = null;
  if (ui.chooser && !ui.chooser.every(key => model.points.some(p => p.key === key))) ui.chooser = null;
 }
 function markup(model) {
  reconcile(model); current = model;
  if (!model.loads.length) return '';
  const held = model.sheet && model.sheet.src;
  const src = typeof held === 'string' ? held : held && held.media && typeof DATA.media[held.media] === 'string' ? DATA.media[held.media] : '';
  const pins = model.points.map((p, i) => '<button type="button" class="drops908-pin' + (p.complete ? ' finished' : '') + '" data-drop908-point="' + i + '" aria-label="' + h((p.numbers.length > 1 ? 'Loads ' : 'Load ') + p.numbers.join(', ') + ': ' + p.members.map(m => m.key).join(', ') + (p.complete ? '. All references finished.' : '') + (p.numbers.length > 1 ? '. Choose a load.' : '. Select load.')) + '"><span>' + p.numbers.join('·') + '</span>' + (p.complete ? '<i aria-hidden="true">✓</i>' : '') + '</button>').join('');
  const unplaced = model.unplaced.length ? '<details class="drops908-unplaced"><summary>' + model.unplaced.length + ' reference' + (model.unplaced.length === 1 ? '' : 's') + ' not placed on this map</summary><ul>' + model.unplaced.map(r => '<li><button type="button" data-drop908-select="' + h(r.id) + '">Load ' + r.n + ' · ' + h(r.key) + '</button><span>' + h(r.reason) + '</span></li>').join('') + '</ul></details>' : '';
  return '<section class="drops908" aria-label="Delivery map" data-drop908-day="' + h(model.day) + '">' +
   '<div class="drops908-head"><div class="drops908-title"><div><h3>Delivery map</h3><p>Master plan · issued 2 Oct 2026</p></div><button type="button" data-drop908-open-map>Open map</button></div><div class="drops908-tools" role="group" aria-label="Delivery map controls"><button type="button" data-drop908-zoom="out" aria-label="Zoom out">−</button><button type="button" data-drop908-zoom="in" aria-label="Zoom in">+</button><button type="button" data-drop908-zoom="fit">Fit drops</button><button type="button" data-drop908-zoom="reset">Full plan</button></div></div>' +
   (src ? '<div class="drops908-viewport" tabindex="0" role="region" aria-label="Master-plan delivery locations. Use zoom buttons; scroll the enlarged map to move around."><div class="drops908-canvas"><img src="' + h(src) + '" alt="GC500 master plan D001-26003-03, issued 2 October 2026" draggable="false"><div class="drops908-pins">' + pins + '</div></div></div>' : '<p class="drops908-missing">Master-plan image unavailable. Load details and locations remain below.</p>') +
   '<div class="drops908-key"><span>Numbers match the loads below</span><span>✓ All references finished</span><span>Same number = same truck</span></div>' +
   '<div class="drops908-selection" aria-live="polite"></div>' + unplaced + '</section>';
 }
 function root() { return document.querySelector('#pane-timeline .drops908'); }
 function cardFor(load) {
  const pane = document.getElementById('pane-timeline');
  return pane && [...pane.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl[data-ld]')].find(b => +((b.querySelector('.ld-n b') || {}).textContent) === load.n);
 }
 function paint() {
  const el = root(); if (!el || !current) return;
  el.querySelectorAll('[data-drop908-point]').forEach(b => {
   const points = b.__drops908Points || [current.points[+b.dataset.drop908Point]];
   const selected = points.some(p => p.members.some(m => m.id === ui.selected));
   b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('#pane-timeline .ld[data-tl846-load]').forEach(c => c.classList.remove('drops908-selected-load'));
  const load = current.loads.find(l => l.id === ui.selected), chosen = ui.chooser && current.points.filter(p => ui.chooser.includes(p.key));
  const target = load && cardFor(load); if (target) target.closest('.ld').classList.add('drops908-selected-load');
  const box = el.querySelector('.drops908-selection');
  let content = '';
  if (chosen && chosen.length) {
   const members = chosen.flatMap(p => p.members);
   content = '<div class="drops908-choice"><b>' + (chosen.length === 1 ? 'Same location' : 'Nearby locations') + ' — choose a load</b><div>' + [...new Set(members.map(m => m.id))].map(id => {
    const l = current.loads.find(x => x.id === id); return '<button type="button" data-drop908-select="' + h(id) + '">Load ' + l.n + ' · ' + h([...new Set(members.filter(m => m.id === id).map(m => m.key))].join(', ')) + '</button>';
   }).join('') + '</div><button type="button" data-drop908-close>Close</button></div>';
  } else if (load) {
   content = '<div class="drops908-detail"><div><b>Load ' + load.n + (load.complete ? ' · ✓ All references finished' : '') + '</b><p>' + load.refs.map(r => h(r.key) + (r.complete ? ' ✓ Finished' : '') + ' <span>· ' + h(r.point ? r.source : r.reason) + '</span>').join('<br>') + '</p></div><div class="drops908-detail-actions"><button type="button" data-drop908-view>View load ↓</button><button type="button" data-drop908-close aria-label="Clear map selection">Close</button></div></div>';
  }
  if (box.__drops908Content !== content) { box.innerHTML = content; box.__drops908Content = content; }
 }
 function rememberViewport() {
  const el = root(), v = el && el.querySelector('.drops908-viewport'), c = v && v.firstElementChild;
  if (!v || !c || !c.offsetWidth || !c.offsetHeight) return;
  ui.cx = (v.scrollLeft + v.clientWidth / 2) / c.offsetWidth;
  ui.cy = (v.scrollTop + v.clientHeight / 2) / c.offsetHeight;
 }
 function layout() {
  const el = root(), v = el && el.querySelector('.drops908-viewport'); if (!v || !current || !current.sheet) return;
  const c = v.firstElementChild, dim = current.sheet.px, pad = 28;
  // The shared-record readiness gate hides panes until the first record read completes.
  // Leave initial framing pending while hidden; ResizeObserver frames it when genuinely visible.
  if (v.clientWidth <= pad * 2 || v.clientHeight <= pad * 2) return;
  const base = Math.min((v.clientWidth - pad * 2) / dim[0], (v.clientHeight - pad * 2) / dim[1]);
  let centre = null;
  if (ui.fit) {
   if (current.points.length) {
    const xs = current.points.map(p => p.point[0]), ys = current.points.map(p => p.point[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sx = Math.max(.32, x1 - x0 + .16), sy = Math.max(.32, y1 - y0 + .16);
    ui.zoom = Math.max(1, Math.min(3, (v.clientWidth - 2 * pad) / (sx * dim[0] * base), (v.clientHeight - 2 * pad) / (sy * dim[1] * base)));
    centre = [(x0 + x1) / 2, (y0 + y1) / 2];
   } else { ui.zoom = 1; ui.cx = ui.cy = .5; }
   ui.fit = false;
  }
  const scale = base * ui.zoom;
  const iw = dim[0] * scale, ih = dim[1] * scale, cw = Math.max(v.clientWidth, iw + pad * 2), ch = Math.max(v.clientHeight, ih + pad * 2);
  const x = (cw - iw) / 2, y = (ch - ih) / 2;
  if (centre) { ui.cx = (x + centre[0] * iw) / cw; ui.cy = (y + centre[1] * ih) / ch; }
  Object.assign(c.style, {width: cw + 'px', height: ch + 'px'});
  Object.assign(c.querySelector('img').style, {left: x + 'px', top: y + 'px', width: iw + 'px', height: ih + 'px'});
  const buttons = [...c.querySelectorAll('[data-drop908-point]')];
  buttons.forEach(b => { const p = current.points[+b.dataset.drop908Point].point; b.style.left = x + p[0] * iw + 'px'; b.style.top = y + p[1] * ih + 'px'; b.hidden = true; });
  clusters(current.points, iw, ih).forEach(indices => {
   const b = buttons[indices[0]], points = indices.map(i => current.points[i]), members = points.flatMap(p => p.members);
   const numbers = [...new Set(members.map(m => m.n))].sort((a, b) => a - b), complete = members.every(m => m.loadComplete);
   b.hidden = false; b.__drops908Points = points;
   b.classList.toggle('cluster', numbers.length > 1); b.classList.toggle('finished', complete);
   b.innerHTML = '<span>' + (numbers.length <= 3 ? numbers.join('·') : numbers.length + ' loads') + '</span>' + (complete ? '<i aria-hidden="true">✓</i>' : '');
   b.setAttribute('aria-label', (numbers.length > 1 ? 'Loads ' : 'Load ') + numbers.join(', ') + ': ' + [...new Set(members.map(m => m.key))].join(', ') + (complete ? '. All references finished.' : '') + (numbers.length > 1 ? '. Choose a load.' : '. Select load.'));
  });
  v.scrollLeft = ui.cx * cw - v.clientWidth / 2; v.scrollTop = ui.cy * ch - v.clientHeight / 2;
  el.querySelector('[data-drop908-zoom="out"]').disabled = ui.zoom <= 1;
  el.querySelector('[data-drop908-zoom="in"]').disabled = ui.zoom >= 6;
  paint();
 }
 function select(id, openLoad) {
  if (!current) return;
  const load = current.loads.find(l => l.id === id); if (!load) return;
  ui.selected = id; ui.chooser = null; ui.cleared = false;
  const b = cardFor(load);
  if (openLoad && b && b.getAttribute('aria-expanded') !== 'true') {
   rememberViewport();
   const sc = ldScroller(b), top = sc.scrollTop;
   state.tlLoad = b.dataset.ld; // Idempotent open; never invoke the native toggle-to-close action.
   render(); sc.scrollTop = top;
  }
  paint();
 }
 function openMap() {
  const load = current && current.loads.find(l => l.id === ui.selected);
  const placed = load && load.refs.find(r => r.point);
  if (placed) showOnMap(placed.key);
  else { state.sheet = 'MASTER'; state.sel = null; go('map'); }
 }
 function mount(pane) {
  if (resize) { resize.disconnect(); resize = null; }
  const el = pane.querySelector('.drops908');
  if (!el) { current = null; ui.selected = ui.chooser = null; return; }
  // The native card can be opened with a filtered first reference. Read its number, not that changed ID.
  const open = current.loads.find(l => { const b = cardFor(l); return b && b.getAttribute('aria-expanded') === 'true'; });
  if (open && !ui.cleared) ui.selected = open.id;
  paint(); layout();
  resize = new ResizeObserver(layout); resize.observe(el.querySelector('.drops908-viewport') || el);
  const v = el.querySelector('.drops908-viewport'); if (v) v.addEventListener('scroll', rememberViewport, {passive: true});
 }
 const api = {project, location, validPoint, clusters, report: () => ({day: ui.day, selected: ui.selected, zoom: ui.zoom, model: current})};
 if (typeof window !== 'undefined') window.Drops908 = api;
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 if (typeof ldList !== 'function' || typeof ldWire !== 'function') return;
 const listBefore = ldList, wireBefore = ldWire;
 ldList = function (d, shown, kind) {
  const native = listBefore(d, shown, kind);
  return kind === 'deliveries' && (state.tlView || 'day') === 'day' ? markup(nativeModel(d, shown)) + native : native;
 };
 ldWire = function (pane) { const result = wireBefore(pane); mount(pane); return result; };
 document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.drops908 button, #pane-timeline .ldlist[aria-label^="Due in"] .ldl[data-ld]'); if (!b) return;
  if (!b.closest('.drops908')) {
   if (current) { const n = +((b.querySelector('.ld-n b') || {}).textContent), l = current.loads.find(x => x.n === n); if (l) { ui.selected = l.id; ui.chooser = null; ui.cleared = false; } }
   return;
  }
  e.preventDefault();
  if (b.hasAttribute('data-drop908-point')) {
   const points = b.__drops908Points || [current.points[+b.dataset.drop908Point]]; if (!points[0]) return;
   const ids = [...new Set(points.flatMap(p => p.members.map(m => m.id)))];
   if (ids.length > 1) { ui.chooser = points.map(p => p.key); paint(); const choice = root().querySelector('[data-drop908-select]'); if (choice) choice.focus({preventScroll:true}); }
   else { select(ids[0], true); const view = root() && root().querySelector('[data-drop908-view]'); if (view) view.focus({preventScroll: true}); }
  } else if (b.hasAttribute('data-drop908-select')) {
   select(b.dataset.drop908Select, true); const view = root() && root().querySelector('[data-drop908-view]'); if (view) view.focus({preventScroll: true});
  } else if (b.hasAttribute('data-drop908-view')) {
   const l = current.loads.find(x => x.id === ui.selected), target = l && cardFor(l); if (target) { target.scrollIntoView({block: 'start', behavior: 'auto'}); target.focus({preventScroll: true}); }
  } else if (b.hasAttribute('data-drop908-close')) {
   ui.selected = ui.chooser = null; ui.cleared = true; paint(); const v = root().querySelector('.drops908-viewport'); if (v) v.focus({preventScroll: true});
  } else if (b.hasAttribute('data-drop908-open-map')) openMap();
  else if (b.hasAttribute('data-drop908-zoom')) {
   rememberViewport(); const z = b.dataset.drop908Zoom;
   ui.zoom = z === 'reset' ? 1 : z === 'fit' ? ui.zoom : Math.max(1, Math.min(6, ui.zoom * (z === 'in' ? 1.5 : 1 / 1.5)));
   if (z === 'fit') ui.fit = true;
   if (z === 'reset') ui.cx = ui.cy = .5;
   layout();
  }
 }, true);
})();
