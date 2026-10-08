/* Author: Andrew Fisher. Keep the existing Explorer reference card inside its map. */
(function () {
 'use strict';
 const mounted = new WeakMap();
 const CSS = `@media(min-width:641px){
 #xcard{max-height:var(--card-room948,calc(100% - 24px));overflow-y:auto;overscroll-behavior:contain}
 #xcard>img{max-height:max(0px,calc(var(--card-room948,300px) - 84px))}
 #xcard .xc-t{position:sticky;top:0;z-index:1;background:#15181a}
 }`;
 function mount(frame) {
  if (!frame || !frame.isConnected || frame.parentElement && frame.parentElement.id === 'expPark') return false;
  let doc, win, stage;
  try { win = frame.contentWindow; doc = frame.contentDocument; stage = doc && doc.getElementById('stage'); } catch (_) { return false; }
  if (!doc || !doc.head || !stage) return false;
  const old = mounted.get(frame);
  if (old && old.doc === doc) { old.schedule(); return true; }
  if (old) old.dispose();
  if (!doc.getElementById('explorer-card948')) { const style = doc.createElement('style'); style.id = 'explorer-card948'; style.textContent = CSS; doc.head.appendChild(style); }
  let queued = 0, card = null, stopped = false;
  function apply() {
   queued = 0;
   if (stopped || !frame.isConnected || frame.contentDocument !== doc || doc.hidden) return;
   if (win.GC500Explorer && typeof win.GC500Explorer.shown === 'function' && !win.GC500Explorer.shown()) return;
   card = doc.getElementById('xcard');
   if (!card || card.hidden) return;
   if (win.innerWidth <= 640) { card.style.removeProperty('--card-room948'); return; }
   const sr = stage.getBoundingClientRect(), bottom = parseFloat(win.getComputedStyle(card).bottom);
   if (!(sr.height > 0) || !Number.isFinite(bottom)) return;
   // Native placeCard() chooses the bottom clearance above the minimap and controls.
   // Respect that edge, leaving eight pixels above the card inside the actual stage.
   const room = Math.max(0, Math.floor(sr.height - bottom - 8)) + 'px';
   if (card.style.getPropertyValue('--card-room948') !== room) card.style.setProperty('--card-room948', room);
  }
  function schedule() { if (!stopped && !queued) queued = win.requestAnimationFrame(apply); }
  const mutation = new win.MutationObserver(records => {
   if (records.some(r => r.target.id === 'xcard' || r.target.closest && r.target.closest('#xcard') ||
    [...r.addedNodes].some(n => n.nodeType === 1 && (n.id === 'xcard' || n.querySelector && n.querySelector('#xcard'))))) schedule();
  });
  mutation.observe(stage, {childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
  const resize = new win.ResizeObserver(schedule); resize.observe(stage);
  // The native image-load placement runs first; scheduling observes its final bottom.
  stage.addEventListener('load', schedule, true); win.addEventListener('resize', schedule);
  const record = {doc,schedule,dispose() {
   if (stopped) return; stopped = true; if (queued) win.cancelAnimationFrame(queued);
   mutation.disconnect(); resize.disconnect(); stage.removeEventListener('load', schedule, true); win.removeEventListener('resize', schedule);
   mounted.delete(frame);
  }};
  mounted.set(frame, record); schedule(); return true;
 }
 function dispose(frame) { const record = frame && mounted.get(frame); if (record) record.dispose(); }
 // These are the native Explorer attachment/parking paths, including the reload fallback.
 const move = expMove, stash = expStash, visibility = window.gc500FencingMapVisibility;
 expMove = function () { const prior = EXP.frame, result = move.apply(this, arguments); if (prior && prior !== EXP.frame) dispose(prior); if (EXP.frame) mount(EXP.frame); return result; };
 expStash = function () { dispose(EXP.frame); return stash.apply(this, arguments); };
 window.gc500FencingMapVisibility = function (on) { const result = visibility && visibility.apply(this, arguments); if (on) mount(EXP.frame); else dispose(EXP.frame); return result; };
 window.gc500ExplorerCard948 = {mount,dispose,active:frame => !!mounted.get(frame)};
 if (typeof EXP !== 'undefined' && EXP.frame) mount(EXP.frame);
})();
