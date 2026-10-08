/* Author: Andrew Fisher. Reuse the original D001 vector explorer in the daily load map. */
(function () {
 'use strict';
 const WIDTH = 2384, HEIGHT = 1684, MIN_PERCENT = 50, MAX_PERCENT = 64000;
 const validPoint = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1;
 function bounds(points, padding) {
  const valid = Array.isArray(points) ? points.filter(validPoint) : [];
  if (!valid.length || !Number.isFinite(padding) || padding < 0) return null;
  const xs = valid.map(p => p[0] * WIDTH), ys = valid.map(p => p[1] * HEIGHT);
  return [Math.max(0, Math.min(...xs) - padding), Math.max(0, Math.min(...ys) - padding), Math.min(WIDTH, Math.max(...xs) + padding), Math.min(HEIGHT, Math.max(...ys) + padding)];
 }
 // The explorer returns the actual rotated sheet corners for its canvas. Invert those two
 // basis vectors, rather than treating its enclosing x/y/w/h rectangle as an unrotated view.
 function projectPoint(point, view, viewport) {
  if (!validPoint(point) || !view || !Array.isArray(view.corners) || view.corners.length < 3 || !viewport) return null;
  const [a, b, c] = view.corners;
  if (![a, b, c].every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)) ||
   !['left', 'top', 'width', 'height'].every(k => Number.isFinite(viewport[k])) || viewport.width <= 0 || viewport.height <= 0) return null;
  const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - a.x, vy = c.y - a.y, det = ux * vy - uy * vx;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const dx = point[0] * WIDTH - a.x, dy = point[1] * HEIGHT - a.y;
  const x = viewport.left + (dx * vy - dy * vx) / det * viewport.width;
  const y = viewport.top + (ux * dy - uy * dx) / det * viewport.height;
  return Number.isFinite(x) && Number.isFinite(y) ? {x, y} : null;
 }
 const INNER_CSS = `
 html,body{width:100%!important;height:100%!important;overflow:hidden!important}
 .app{display:block!important;height:100%!important;width:100%!important}
 .app>header,.app>aside,.console,.hud,.mini,.rail,.legend,.toast,#marks,#pulse,
 #x887FenceBar,#fenceOverlay,#fmPanel,#xcard,#d782,#mapPick813,#pickCard813{display:none!important}
 .app>main{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important}
 #stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
 #display{width:100%!important;height:100%!important;image-rendering:auto!important}
 .rose{top:auto!important;bottom:34px!important;right:8px!important;z-index:2}
 .qual{left:7px!important;bottom:7px!important;max-width:calc(100% - 130px)!important;font-size:10px!important;padding:3px 6px!important}
 .attrib{right:7px!important;bottom:7px!important;max-width:calc(100% - 14px)!important;font-size:10px!important;padding:3px 6px!important}
 .qual.sharp{display:none!important}
 `;
 async function create(host, options) {
  options = options || {};
  if (!host || typeof host.appendChild !== 'function') throw new Error('Master plan needs a map host');
  const iframe = document.createElement('iframe');
  iframe.className = 'masterplan911-frame'; iframe.title = 'D001 master plan · zoom, pan and inspect building details';
  iframe.setAttribute('allow', 'fullscreen'); iframe.setAttribute('allowfullscreen', '');
  // This public read route never carries the editor's capability or changes the machine set.
  iframe.src = new URL('/w/Coates-GC500-2026/explorer/index.html?embed=1&loadmap=911#original', location.origin).href;
  host.classList.add('masterplan911-host');
  let api = null, win = null, canvas = null, observer = null, tick = 0, deadline = 0, checkTimer = 0;
  let status = 'loading', destroyed = false, lastView = '', keyGuard = null;
  const call = name => { if (typeof options[name] === 'function') options[name](adapter); };
  const state = () => { try { return api && api.state; } catch (_) { return null; } };
  function alive() {
   try { return !destroyed && !!api && !!canvas && iframe.isConnected && canvas.isConnected &&
    iframe.contentWindow.GC500Explorer === api && iframe.contentDocument === canvas.ownerDocument; }
   catch (_) { return false; }
  }
  function viewport() {
   if (!canvas || !iframe.isConnected || !host.isConnected) return null;
   const fr = iframe.getBoundingClientRect(), cr = canvas.getBoundingClientRect(), hr = host.getBoundingClientRect();
   if (!iframe.clientWidth || !iframe.clientHeight) return null;
   const sx = fr.width / iframe.clientWidth, sy = fr.height / iframe.clientHeight;
   return {left: fr.left - hr.left + cr.left * sx, top: fr.top - hr.top + cr.top * sy, width: cr.width * sx, height: cr.height * sy};
  }
  function changed(force) {
   if (destroyed || status !== 'ready') return;
   const s = state(), v = viewport(); if (!s || !s.view || !v) return;
   const signature = JSON.stringify([s.zoom, s.mode, s.view.corners, v]);
   if (force || signature !== lastView) { lastView = signature; call('change'); }
  }
  function watch() {
   if (destroyed) return;
   if (!host.isConnected) { adapter.destroy(); return; }
   if (status === 'ready' && !alive()) { status = 'stale'; call('change'); }
   changed(false); tick = requestAnimationFrame(watch);
  }
  // goto() normally animates. Landing while temporarily hidden uses its existing instant path,
  // so a following exact zoom cannot stop the camera before it reaches the selected unit.
  function go(rect, label) {
   if (!adapter.ready || !rect) return false;
   api.setHostShown(false);
   try { api.goto(rect, label); } finally { api.setHostShown(true); }
   changed(true); return true;
  }
  const adapter = {
   iframe,
   alive,
   get ready() { return status === 'ready' && alive(); },
   get status() { return status === 'ready' && !alive() ? 'stale' : status; },
   get source() { return 'D001-26003-03 · issued 2 Oct 2026'; },
   capture() {
    // Keep access to the last API's camera for a reload fallback; never use it for drawing.
    const s = state(), corners = s && s.view && s.view.corners;
    if (!s || !Number.isFinite(s.zoom) || s.zoom <= 0 || !Array.isArray(corners) || corners.length !== 4 ||
     !corners.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
    const centre = [corners.reduce((sum, p) => sum + p.x, 0) / (4 * WIDTH), corners.reduce((sum, p) => sum + p.y, 0) / (4 * HEIGHT)];
    return validPoint(centre) ? {centre, zoom: s.zoom * 100} : null;
   },
   restore(snapshot) {
    if (!adapter.ready || !snapshot || !validPoint(snapshot.centre) || !Number.isFinite(snapshot.zoom) || snapshot.zoom <= 0) return false;
    const x = snapshot.centre[0] * WIDTH, y = snapshot.centre[1] * HEIGHT;
    // Symmetric bounds preserve even a centre on the sheet edge exactly.
    if (!go([x - .5, y - .5, x + .5, y + .5], 'Master plan · restored view')) return false;
    return adapter.zoom(snapshot.zoom);
   },
   project(point) { const s = state(); return adapter.ready && s ? projectPoint(point, s.view, viewport()) : null; },
   fit(points) {
    if (!adapter.ready) return false;
    const rect = bounds(points, 22);
    if (!rect) { api.fit(true, false); changed(true); return true; }
    return go(rect, 'Today’s loads · master plan');
   },
   focus(points) {
    const rect = bounds(points, 3); if (!rect || !go(rect, 'Selected drop · master plan')) return false;
    if (adapter.getZoom() > 16000) api.zoom(160);
    changed(true); return true;
   },
   zoom(percent) {
    if (!adapter.ready || !Number.isFinite(percent) || percent <= 0) return false;
    api.zoom(Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, percent)) / 100); changed(true); return true;
   },
   getZoom() { const s = adapter.ready && state(); return s && Number.isFinite(s.zoom) ? s.zoom * 100 : null; },
   resize() {
    if (destroyed || !win) return;
    win.dispatchEvent(new win.Event('resize')); changed(true);
   },
   destroy() {
    if (destroyed) return; destroyed = true; status = 'destroyed';
    cancelAnimationFrame(tick); clearTimeout(deadline); clearInterval(checkTimer);
    if (observer) observer.disconnect();
    try { if (api) api.setHostShown(false); if (win && keyGuard) win.removeEventListener('keydown', keyGuard, true); } catch (_) {}
    iframe.remove(); host.classList.remove('masterplan911-host'); api = null; win = null; canvas = null;
   }
  };
  try {
   await new Promise((resolve, reject) => {
    let starting = false;
    const fail = message => { if (status === 'loading') reject(new Error(message)); };
    deadline = setTimeout(() => fail('The master plan did not finish loading'), 90000);
    const prepare = () => {
     if (destroyed || !host.isConnected) { fail('Master plan view was closed'); return; }
     if (starting) return;
     try {
      win = iframe.contentWindow;
      const doc = iframe.contentDocument, candidate = win && win.GC500Explorer;
      if (!doc || !candidate || !candidate.ready || typeof candidate.ready.then !== 'function') return;
      if (!['setMode', 'goto', 'zoom', 'fit', 'setHostShown'].every(k => typeof candidate[k] === 'function')) { fail('The master plan controls are unavailable'); return; }
      starting = true; api = candidate;
      const style = doc.createElement('style'); style.id = 'masterplan911-embedded'; style.textContent = INNER_CSS; doc.head.appendChild(style);
      keyGuard = event => {
       const target = event.target, typing = !!(target && typeof target.matches === 'function' && target.matches('input,textarea,select'));
       if (!typing && ['2', '3'].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); }
      };
      win.addEventListener('keydown', keyGuard, true);
      api.setMode('original'); api.setHostShown(true);
      Promise.resolve(api.ready).then(() => {
       if (destroyed || !host.isConnected) { fail('Master plan view was closed'); return; }
       canvas = doc.getElementById('display');
       if (!canvas || !state() || !state().ready) { fail('The master plan canvas is unavailable'); return; }
       if (api.fencingAdapter && typeof api.fencingAdapter.clearSelection === 'function') api.fencingAdapter.clearSelection();
       status = 'ready'; clearTimeout(deadline); clearInterval(checkTimer); resolve();
      }, () => fail('The master plan could not be loaded'));
     } catch (_) { fail('The master plan could not be opened'); }
    };
    iframe.addEventListener('load', prepare); iframe.addEventListener('error', () => fail('The master plan could not be loaded'));
    checkTimer = setInterval(prepare, 100); host.appendChild(iframe);
   });
   observer = new ResizeObserver(() => adapter.resize()); observer.observe(host);
   adapter.resize(); watch(); call('ready'); return adapter;
  } catch (error) {
   adapter.destroy(); status = 'error';
   if (typeof options.error === 'function') options.error(error);
   throw error;
  }
 }
 const api = {create, validPoint, bounds, projectPoint, sheet: [WIDTH, HEIGHT], minZoom: MIN_PERCENT, maxZoom: MAX_PERCENT};
 if (typeof window !== 'undefined') window.MasterPlan911 = api;
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
