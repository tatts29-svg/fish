/* v8.63 - Author: Andrew Fisher. PAGES OPEN AND REFRESH WITHOUT FLICKER. */
(function () {
  /* 1. The arrival plays once. go() puts `arrive` on the pane it opens and nothing took it off, so when the record
     changed and the same tab was drawn again, every new block on it played its arrival again. The class now comes off
     when the arrival has finished, and at once if the pane's blocks are replaced by a later draw. */
  const ARRIVE_MS = 1000;
  const timers = new WeakMap(), seen = new WeakSet();
  const settle = pane => { clearTimeout(timers.get(pane)); timers.delete(pane); pane.classList.remove('arrive'); };
  const follow = pane => { if (!seen.has(pane)) { seen.add(pane); mo.observe(pane, {childList: true}); } };
  const mo = new MutationObserver(list => {
    const fresh = new Set();
    for (const m of list) {
      const el = m.target;
      if (m.type !== 'attributes' || !el.classList || !el.classList.contains('pane')) continue;
      follow(el);
      /* go() takes the class off and puts it back: any record from a state without it is a new arrival */
      if (el.classList.contains('arrive') && !/\barrive\b/.test(m.oldValue || '')) fresh.add(el);
    }
    for (const pane of fresh) { clearTimeout(timers.get(pane)); timers.set(pane, setTimeout(() => settle(pane), ARRIVE_MS)); }
    for (const m of list) {
      /* the draw that came with the arrival is part of it; a draw in a later turn is a refresh */
      if (m.type === 'childList' && m.target.classList && m.target.classList.contains('arrive') && !fresh.has(m.target)) settle(m.target);
    }
  });
  const start = () => {
    mo.observe(document.querySelector('main') || document.body, {attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true});
    for (const p of document.querySelectorAll('.pane')) { follow(p); if (p.classList.contains('arrive')) timers.set(p, setTimeout(() => settle(p), ARRIVE_MS)); }
  };
  if (document.querySelector('main')) start(); else document.addEventListener('DOMContentLoaded', start);

  /* 2. The Today banner keeps its picture. Each draw of Today built a new banner image, and a new image is blank until
     it has been decoded again, so the banner went grey, then black, then back to the photograph on every refresh. When
     the new banner asks for the same picture, the one already decoded is put back in its place. */
  if (typeof wireBoard === 'function') {
    let kept = null;
    const wireBoard0 = wireBoard;
    wireBoard = function (pane) {
      try {
        const fig = pane && pane.querySelector && pane.querySelector('.bhero[data-board]');
        const img = fig && fig.querySelector('.bmedia > img');
        if (img && kept && kept !== img && !kept.isConnected && kept.complete && kept.naturalWidth > 0 && kept.getAttribute('src') === img.getAttribute('src')) {
          for (const a of [...kept.attributes]) if (!img.hasAttribute(a.name)) kept.removeAttribute(a.name);
          for (const a of [...img.attributes]) if (kept.getAttribute(a.name) !== a.value) kept.setAttribute(a.name, a.value);
          img.replaceWith(kept);
        }
        const now = fig && fig.querySelector('.bmedia > img');
        if (now) kept = now;
      } catch (e) {}
      return wireBoard0.apply(this, arguments);
    };
    Object.assign(wireBoard, wireBoard0);
  }
  window.gc500Flicker863 = true;
})();
