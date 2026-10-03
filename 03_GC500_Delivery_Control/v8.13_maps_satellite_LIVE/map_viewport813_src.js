/* Author: Andrew Fisher. v8.13 — reserve the footer and follow the real map top. */
function expObserve813(){
 if (EXP.sizeObserver || typeof ResizeObserver !== 'function') return;
 EXP.sizeObserver = new ResizeObserver(() => {
  if (EXP.sizeFrame) return;
  EXP.sizeFrame = requestAnimationFrame(() => { EXP.sizeFrame = 0; expSize(); });
 });
 [document.querySelector('main'), document.querySelector('footer.foot'), document.getElementById('pane-map')].filter(Boolean).forEach(el => EXP.sizeObserver.observe(el));
}
function expSize(){
 const w = document.getElementById('expwrap'); if (!w || !w.getClientRects().length) return;
 expObserve813();
 const vv = window.visualViewport, vh = vv ? vv.height + vv.offsetTop : (window.innerHeight || 800);
 const rect = w.getBoundingClientRect();
 let available;
 if (w.closest('.expfull')) available = vh - rect.top - 10;
 else {
  const mn = w.closest('main'), mr = mn && mn.getBoundingClientRect();
  const foot = document.querySelector('footer.foot'), fr = foot && foot.getBoundingClientRect();
  const pad = mn ? parseFloat(getComputedStyle(mn).paddingBottom) || 0 : 12;
  const bottom = Math.min(vh, mr ? mr.bottom : vh, fr && fr.height ? fr.top : vh);
  // Add scrollTop so resizing cannot progressively enlarge an already scrolled map.
  const top = rect.top + (mn ? mn.scrollTop : 0);
  available = bottom - top - pad;
 }
 const height = Math.max(200, Math.floor(available));
 if (w.style.height !== height + 'px') w.style.height = height + 'px';
}
