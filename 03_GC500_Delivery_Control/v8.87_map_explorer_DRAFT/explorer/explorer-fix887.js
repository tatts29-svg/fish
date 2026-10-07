/* Author: Andrew Fisher. v8.87 Map explorer: Fencing closes like every other panel, and the map says what to tap.
   Loaded after explorer.js, explorer-merge.js, fencing-map-explorer.js and explorer-fix864.js. Nothing here changes the plan,
   the geometry, the records or what a line means; it adds a way out of Fencing that is always on the map, and one hint.
   Andrew, 7 Oct 2026: "you need to tap fencing or close fencing to close that. its very bad does not functione well." */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const F = () => window.GC500FencingMap;
  const fencingOn = () => document.body.classList.contains('fencing-map');
  const icon = (d, label) => `<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" style="vertical-align:-2px"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${label}`;
  const CLOSE = 'M3.5 3.5l9 9M12.5 3.5l-9 9';

  /* 1. THE CLOSE THAT IS ALWAYS ON THE MAP. The ways out used to be the header button that had changed its name, a close bar inside
     the side panel (hidden on a phone unless the drawer was open) and Escape when the map had focus. A bar at the top of the map
     now says what view this is and carries a plain × Close, on a laptop and on a phone, over the map itself. */
  const stage = $('stage'), main = stage && stage.parentElement;
  if (main && !$('x887FenceBar')) {
    const bar = document.createElement('div'); bar.id = 'x887FenceBar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Fencing view');
    bar.innerHTML = `<span>${matchMedia('(max-width:900px)').matches ? 'Fencing · tap a line for details' : 'Fencing view · tap a fence line for its details'}</span><button type="button" id="x887FenceClose" aria-label="Close the fencing view and return to the map">${icon(CLOSE, '<span>Close</span>')}</button>`;
    bar.querySelector('button').onclick = () => { if (F()) F().close(); const st = $('stage'); if (st) st.focus({preventScroll: true}); };
    main.appendChild(bar);
  }

  /* 2. A HINT, ONCE. Nothing used to be tappable until a chip was pressed, and the chips sit in a side panel a phone hides. Every
     placed unit can now be tapped; the first time this browser opens the map inside the dashboard it is told so, once. */
  function hint() {
    let seen = false; try { seen = localStorage.getItem('gc500.explorer.hint887') === '1'; } catch (_) {}
    if (seen || typeof toast !== 'function' || !window.GC500Explorer) return;
    const framed = (() => { try { return window.self !== window.top; } catch (_) { return true; } })(); if (!framed) return;
    window.GC500Explorer.ready.then(() => setTimeout(() => { if (fencingOn()) return; toast('Tap any numbered unit for what has been done · Fencing shows the fence plan', 5000); try { localStorage.setItem('gc500.explorer.hint887', '1'); } catch (_) {} }, 1200)).catch(() => {});
  }
  hint();

  window.GC500Explorer887 = Object.freeze({get state() { return {fencingOn: fencingOn(), closeBar: !!$('x887FenceBar')}; }});
})();
