/* Author: Andrew Fisher. The existing Coates Way hero, with one lazy film lifecycle. */
const MachineFilm995 = (() => {
 'use strict';
 let active = null, mounts = 0, disposals = 0;
 function mount(video) {
  active?.dispose();
  if (!video) return;
  const pane = video.closest('#pane-coatesway'), hero = DATA.machine?.hero;
  if (!pane || !hero) return;
  let disposed = false, seen = false, printing = false, suspended = false, pending = false;
  let quality = null, failedOver = false, failedFull = false, sourceLoads = 0;
  const listeners = [], mq = matchMedia('(prefers-reduced-motion: reduce)');
  const listen = (target, event, fn) => {target.addEventListener(event, fn);listeners.push(() => target.removeEventListener(event, fn));};
  const ancestors = []; for (let n = video.parentElement; n; n = n.parentElement) ancestors.push(n);
  const quiet = () => typeof motionOff === 'function' ? motionOff() : mq.matches || document.documentElement.dataset.motion === 'off';
  const allowed = () => !disposed && video.isConnected && seen && pane.classList.contains('on') && !document.hidden && !printing && !suspended && !quiet()
   && !ancestors.some(n => n.hidden || n.hasAttribute('inert')) && !document.body.classList.contains('showing') && !MACHINE.open;
  const choose = () => matchMedia('(max-width: 767px)').matches || navigator.connection?.saveData ? 'preview' : 'full';
  const urlFor = value => value === 'preview' ? hero.preview_mp4 : hero.mp4;
  function source(value) {
   const url = urlFor(value);
   if (typeof url !== 'string' || !url) return false;
   quality = value; sourceLoads++; video.src = url; video.dataset.film995Quality = value;
   return true;
  }
  function sync() {
   if (disposed) return;
   if (!video.isConnected) { dispose(); return; }
   if (!allowed()) { video.pause(); return; }
   if (failedFull && !failedOver) { failedOver = true; pending = false; if (!source('preview')) return; }
   if (!quality && !source(choose())) return;
   if (pending || !video.paused) return;
   pending = true;
   try {
    const playing = video.play();
    Promise.resolve(playing).then(() => { if (!allowed()) video.pause(); }, () => {}).finally(() => { pending = false; });
   } catch (_) { pending = false; }
  }
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
   seen = entries.some(e => e.target === video && e.isIntersecting && e.intersectionRatio >= .15); sync();
  }, {threshold: [0,.15]}) : null;
  const observer = new MutationObserver(sync);
  ancestors.forEach(n => observer.observe(n, {attributes: true, attributeFilter: ['class','hidden','inert','data-motion']}));
  observer.observe(pane, {attributes: true, attributeFilter: ['class','hidden','inert'], childList: true});
  function checkVisible() {
   const r = video.getBoundingClientRect();
   seen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; sync();
  }
  function dispose() {
   if (disposed) return;
   disposed = true; disposals++; io?.disconnect(); observer.disconnect(); listeners.splice(0).forEach(remove => remove());
   video.pause();
   if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
   if (active?.video === video) active = null;
  }
  listen(document, 'visibilitychange', sync);
  listen(document, 'gc500motionchange', sync);
  listen(mq, 'change', sync);
  listen(window, 'beforeprint', () => {printing = true; sync();});
  listen(window, 'afterprint', () => {printing = false; sync();});
  listen(window, 'pagehide', () => {suspended = true; sync();});
  listen(window, 'pageshow', () => {suspended = false; sync();});
  listen(video, 'playing', () => {if (!allowed()) video.pause();});
  listen(video, 'error', () => {
   if (disposed) return;
   if (quality === 'full') failedFull = true;
   pending = false; sync();
  });
  mounts++; active = {video, dispose, sync, report: () => ({mounted: true, mounts, disposals, active: mounts-disposals, quality, sourceLoads, seen, allowed: allowed(), paused: video.paused, time: video.currentTime, width: video.videoWidth, height: video.videoHeight, pending})};
  if (io) io.observe(video); else {listen(document, 'scroll', checkVisible);listen(window, 'resize', checkVisible);checkVisible();}
 }
 return {mount, report: () => active ? active.report() : {mounted: false, mounts, disposals, active: mounts-disposals}};
})();
