/* Author: Andrew Fisher. Standalone preview controller; no record or network writes. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reduced.matches;
  let selected = null, active = null, paused = false, printing = false, frame = 0;
  const groups = () => [...document.querySelectorAll('[data-preview-motion-group]')];
  function visible(group) {
    const display = group.querySelector('.display');
    if (!display) return false;
    const r = display.getBoundingClientRect(), s = getComputedStyle(display);
    const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(0, r.left));
    const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(0, r.top));
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 &&
      r.width > 0 && r.height > 0 && width * height / (r.width * r.height) >= .2;
  }
  function render() {
    frame = 0;
    const all = groups();
    const blocked = paused || printing || reducedMotion || document.hidden || !!document.querySelector('dialog[open]');
    const available = blocked ? [] : all.filter(visible);
    const chosen = available.find(g => g.dataset.previewMotionGroup === selected) || available[0];
    active = chosen?.dataset.previewMotionGroup || null;
    all.forEach(group => {
      const running = group === chosen;
      group.classList.toggle('is-animating', running);
      const button = group.querySelector('[data-preview-motion-toggle]');
      if (!button) return;
      button.disabled = reducedMotion;
      button.setAttribute('aria-pressed', String(running));
      button.setAttribute('aria-label', (running ? 'Pause ' : 'Resume ') + (group.querySelector('h1')?.textContent || 'group') + ' LED animation');
      button.querySelector('span').textContent = reducedMotion ? 'Still' : running ? 'Auto' : paused ? 'Resume' : 'Auto';
    });
  }
  function request() { if (!frame) frame = requestAnimationFrame(render); }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    render();
  }
  document.addEventListener('click', event => {
    const group = event.target.closest('[data-preview-motion-group]');
    if (!group) return;
    selected = group.dataset.previewMotionGroup;
    if (event.target.closest('[data-preview-motion-toggle]')) paused = active === selected && !paused;
    request();
  });
  addEventListener('scroll', request, {passive:true});
  addEventListener('resize', request, {passive:true});
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', event => { reducedMotion = event.matches; sync(); });
  addEventListener('beforeprint', () => { printing = true; sync(); });
  addEventListener('afterprint', () => { printing = false; request(); });
  const observer = new IntersectionObserver(request, {threshold:[0,.2,.5,1]});
  groups().forEach(group => { const display = group.querySelector('.display'); if (display) observer.observe(display); });
  new MutationObserver(request).observe(document.body, {subtree:true,attributes:true,attributeFilter:['open']});
  // Reporting must not query the media list ahead of its queued change event.
  window.GC500PreviewMotion = {report:() => ({selected,active,paused,reduced:reducedMotion,hidden:document.hidden,printing}),refresh:sync};
  render();
})();
