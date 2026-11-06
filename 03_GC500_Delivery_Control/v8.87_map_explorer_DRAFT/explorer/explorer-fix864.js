/* Author: Andrew Fisher. v8.64 Map explorer: plain labels, a way out of every panel and selection, lighter frames while moving.
   Loaded after explorer.js, explorer-merge.js and fencing-map-explorer.js. Nothing here changes the plan, the geometry,
   the records or what a pin means; it only changes how the explorer is opened, closed and drawn while it moves. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const narrow = () => matchMedia('(max-width:900px)').matches;
  const fencingOn = () => document.body.classList.contains('fencing-map');
  const F = () => window.GC500FencingMap;

  /* 1. LABELS. "Find" beside "Fencing" read as two unrelated words, and Find turned into "Tasks" while Fencing was on.
     The panel button now says what it opens, and the Fencing button says how to leave. */
  const nav = $('navBtn'), fence = $('fenceMode');
  const icon = (d, label) => `<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" style="vertical-align:-2px;margin-right:5px"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>${label}`;
  const SEARCH = 'M7 2.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9zM10.4 10.4L14 14', LIST = 'M2.5 4h11M2.5 8h11M2.5 12h11', CLOSE = 'M3.5 3.5l9 9M12.5 3.5l-9 9', FENCE = 'M2 13V5l2-2l2 2v8M10 13V5l2-2l2 2v8M2 7h12M2 11h12';
  function labels() {
    const on = fencingOn();
    const two = (l, sh) => `<span class="x864-l">${l}</span><span class="x864-s">${sh}</span>`;
    if (nav) { nav.innerHTML = on ? icon(LIST, two('Fencing list', 'List')) : icon(SEARCH, two('Search &amp; layers', 'Search')); nav.setAttribute('aria-label', on ? 'Open the fencing list' : 'Search the plan, find items and change layers'); nav.style.width = 'auto'; }
    if (fence) { fence.innerHTML = on ? icon(CLOSE, two('Close fencing', 'Close')) : icon(FENCE, 'Fencing'); fence.setAttribute('aria-label', on ? 'Close the fencing view and return to the map' : 'Show the fencing plan and recorded progress'); fence.classList.toggle('x864-on', on); }
    syncClear();
  }
  new MutationObserver(labels).observe(document.body, {attributes: true, attributeFilter: ['class']});

  /* 2. A WAY OUT OF EVERY PANEL. On a phone the panel covered the map and the only way back was the button that opened it.
     Each panel now carries its own close at the top: the side panel goes back to the map; Fencing closes Fencing. */
  function closeBar(host, text, act, id) {
    if (!host || host.querySelector('#' + id)) return;
    const bar = document.createElement('div'); bar.className = 'x864-bar'; bar.id = id;
    bar.innerHTML = `<button type="button" class="x864-close">${icon(CLOSE, text)}</button>`;
    bar.firstChild.onclick = act; host.prepend(bar);
  }
  function backToMap() { if (typeof panel813 === 'function') panel813(false); const st = $('stage'); if (st) st.focus({preventScroll: true}); }
  closeBar($('side'), 'Back to the map', backToMap, 'x864SideClose');
  const fp = $('fencePanel'); if (fp) closeBar(fp, 'Close fencing', () => { if (F()) F().close(); }, 'x864FenceClose');

  /* 3. CLEAR THE SELECTION FROM THE MAP. A picked category, a picked reference or a picked fence run stayed lit until the
     same panel was reopened and the same button pressed again. A "Clear" pill on the map itself now ends it in one tap. */
  const pill = document.createElement('button'); pill.type = 'button'; pill.id = 'x864Clear'; pill.className = 'x864-clear'; pill.hidden = true;
  pill.innerHTML = icon(CLOSE, '<span>Clear selection</span>'); pill.setAttribute('aria-label', 'Clear the selection on the map');
  const hud = document.querySelector('.hud'); if (hud) hud.append(pill);
  const chipOn = () => !!document.querySelector('#chips .chip[aria-pressed="true"]');
  const anySelected = () => { try { return chipOn() || (typeof selected !== 'undefined' && !!selected) || (typeof highlight !== 'undefined' && !!highlight) || !!(F() && F().active && F().selected); } catch (_) { return false; } };   /* v8.87 - the cheap reads */
  function clearAll() {
    try { if (typeof clearSelection813 === 'function') clearSelection813(); } catch (_) {}
    try { if (typeof showCategory === 'function') showCategory(null); } catch (_) {}
    document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false'));
    try { highlight = null; } catch (_) {}
    document.querySelectorAll('.jump.active').forEach(e => e.classList.remove('active'));
    const sel = $('sel'); if (sel) sel.style.display = 'none';
    /* the fencing layer forgets its pick when a filter is re-applied unchanged */
    if (F() && F().active && F().selected) { const s = $('fmStatus'); if (s && typeof s.onchange === 'function') s.onchange(); }
    if (typeof requestPaint === 'function') requestPaint();
    syncClear();
  }
  pill.onclick = clearAll;
  function syncClear() { const on = anySelected(); if (pill.hidden === on) pill.hidden = !on; }
  /* cheap: a check on the explorer's own clicks and keys, and a slow heartbeat for picks made from outside */
  document.addEventListener('click', () => setTimeout(syncClear, 0), true);
  document.addEventListener('keyup', () => setTimeout(syncClear, 0), true);
  setInterval(() => { if (!document.hidden && !(window.GC500Explorer && typeof window.GC500Explorer.shown === 'function' && !window.GC500Explorer.shown())) syncClear(); }, 700);   /* v8.87 - not while hidden or parked */

  /* Escape, from anywhere in the explorer (not only when the map has focus): first the selection, then Fencing. It looks
     before the map's own Escape handling runs (capture), so one press does one thing; the legend and the open phone
     panel keep their own Escape, which stops this one. */
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('legend') && $('legend').classList.contains('show')) return;
    if (narrow() && document.body.classList.contains('nav')) return;
    if (/input|select|textarea/i.test((e.target && e.target.tagName) || '')) return;
    if (fencingOn() && F()) { e.preventDefault(); F().close(); return; }   /* v8.87 - one press leaves Fencing, whatever is picked */
    if (anySelected()) { clearAll(); return; }
  }, true);

  /* 4. LIGHTER FRAMES WHILE MOVING. A pan, pinch or zoom glide redrew the whole canvas at full pixel density every frame
     (three times the pixels on a phone, twice on most laptops), and the frame time is almost all pixels. While the hand or
     the glide is moving, the canvas now draws at three quarters of the screen's density, capped at 1.5x before that
     (so 0.75x on an ordinary screen, about 1.1x on a phone or a high-density laptop), and the browser scales it up. The
     moment it settles (160 ms after the last movement) the explorer redraws at full sharpness, as before. */
  if (typeof applyDpr === 'function') {
    const applyDpr0 = applyDpr, CAP = 1.5, MOVING = 0.75;
    applyDpr = function () {
      try { const k = Math.min(dprFull, CAP) * MOVING; movW = Math.max(1, Math.round(sw * k)); movH = Math.max(1, Math.round(sh * k)); } catch (_) {}
      return applyDpr0.apply(this, arguments);
    };
    try { applyDpr(); } catch (_) {}
  }

  labels();
  window.GC500Explorer864 = Object.freeze({clear: clearAll, get state() { return {clearShown: !pill.hidden, labels: [nav && nav.textContent, fence && fence.textContent]}; }});
})();
