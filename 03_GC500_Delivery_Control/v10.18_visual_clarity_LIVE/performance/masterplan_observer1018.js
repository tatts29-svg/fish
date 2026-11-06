  // Author: Andrew Fisher. Camera changes coalesce into one frame; a still map has no drawing loop.
  // Older retained explorer files keep their original frame observer during a paired deployment.
  function healthyView1018() {
   if (destroyed) return false;
   if (!host.isConnected) { adapter.destroy(); return false; }
   if (status === 'ready' && !alive()) { status = 'stale'; call('change'); return false; }
   return status === 'ready';
  }
  function queueView1018() {
   viewDirty1018 = true;
   if (destroyed || tick || document.hidden) return;
   tick = requestAnimationFrame(() => {
    tick = 0;
    if (!healthyView1018() || document.hidden || document.body.classList.contains('showing')) return;
    viewDirty1018 = false; changed(false);
   });
  }
  function watch() {
   if (!healthyView1018()) return;
   if (api.viewEvents1018 === true) {
    if (viewSignal1018) return;
    viewSignal1018 = queueView1018;
    win.addEventListener('gc500viewchange1018', viewSignal1018);
    document.addEventListener('visibilitychange', viewSignal1018);
    window.addEventListener('resize', viewSignal1018);
    // This inexpensive lifecycle check catches iframe replacement/closed hosts, without
    // measuring bounds, serialising the camera or repainting an idle map every frame.
    healthTimer1018 = setInterval(() => {
     if (!document.hidden && healthyView1018() && viewDirty1018 && !document.body.classList.contains('showing')) queueView1018();
    }, 1000);
    queueView1018(); return;
   }
   if (!document.body.classList.contains('showing')) changed(false);
   tick = requestAnimationFrame(watch);
  }
