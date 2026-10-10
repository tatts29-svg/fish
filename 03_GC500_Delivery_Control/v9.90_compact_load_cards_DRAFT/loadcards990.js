/* Author: Andrew Fisher. Presentation only: move native nodes, keep their actions and records. */
(function () {
 'use strict';
 const pending = new Map();
 const quiet = () => motionOff() || matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cardFor = id => [...document.querySelectorAll('#pane-timeline [data-tl846-load]')].find(n => n.dataset.tl846Load === id);
 function nestWorkspace(card) {
  const workspace = card?.querySelector(':scope > .drops911'), detail = card?.querySelector(':scope > .lc990-detail');
  if (workspace && detail) detail.prepend(workspace);
 }
 function sweep(card) {
  if (!card || quiet()) return;
  card.classList.remove('lc990-tap');
  void card.offsetWidth;
  card.classList.add('lc990-tap');
 }
 function animate(box, from, to) {
  if (!box || quiet()) return null;
  return box.animate([{height: from + 'px', opacity: from ? 1 : 0}, {height: to + 'px', opacity: to ? 1 : 0}],
   {duration: 200, easing: 'cubic-bezier(.2,.7,.2,1)'});
 }
 function apply(pane) {
  if (!pane) return;
  for (const card of pane.querySelectorAll('.ld.tl846:not(.lc990)')) {
   const layout = card.querySelector(':scope > .tl846-layout');
   const toggle = layout?.querySelector(':scope > .ldl[data-ld]');
   const controls = layout?.querySelector(':scope > .tl846-controls');
   if (!toggle || !controls) continue;
   card.classList.add('lc990');
   const open = toggle.getAttribute('aria-expanded') === 'true';
   const summary = document.createElement('div'); summary.className = 'lc990-summary';
   const actions = document.createElement('div'); actions.className = 'lc990-actions';
   const warnings = document.createElement('div'); warnings.className = 'lc990-warnings';
   const detail = document.createElement('div'); detail.className = 'lc990-detail';
   // IDs follow the existing native load ID convention; nothing is stored in the shared record.
   detail.id = 'lc990-' + toggle.dataset.ld.replace(/[^A-Za-z0-9]+/g, '-');
   detail.hidden = !open; detail.inert = !open;
   toggle.setAttribute('aria-controls', detail.id);
   toggle.setAttribute('aria-label', (open ? 'Close' : 'Open') + ' details for ' + (toggle.getAttribute('aria-label') || 'load').split('. Press')[0]);
   toggle.classList.add('lc990-toggle');
   const number = toggle.querySelector(':scope > .ld-n'), time = toggle.querySelector(':scope > .ld-t'), refs = toggle.querySelector(':scope > .ld-refs');
   if (number) {
    const visibleNumber = number.cloneNode(true); visibleNumber.className = 'lc990-number'; visibleNumber.setAttribute('aria-hidden', 'true'); summary.append(visibleNumber);
   }
   if (time) { summary.append(time); const missing = time.querySelector('b.nt'); if (missing) missing.textContent = 'No time'; }
   if (refs) summary.append(refs);
   toggle.replaceChildren(document.createTextNode(open ? 'Details ▴' : 'Details ▾'));
   // Native Arrange loads uses .ldl .ld-n b to find/select a load. Keep that hook once,
   // hidden inside the original button; the summary is the sole visible load number.
   if (number) { number.hidden = true; toggle.append(number); }
   const progress = document.createElement('div'); progress.className = 'lc990-progress';
   for (const ref of summary.querySelectorAll('.tl841-ref')) {
    const group = document.createElement('section'); group.className = 'lc990-progress-ref';
    const heading = document.createElement('b'); heading.textContent = ref.dataset.tl841Ref + ' · Load progress'; group.append(heading);
    for (const node of ref.querySelectorAll(':scope > .tl841-gantry, :scope > .tl846-ticks')) group.append(node);
    if (group.children.length > 1) progress.append(group);
   }
   // Keep EVERY native warning chip up front, including restriction and arrival/area conflicts.
   controls.querySelectorAll('.flow891-chip').forEach(n => warnings.append(n));
   const nav = controls.querySelector('.ld-nav'); if (nav) actions.append(nav);
   actions.append(toggle);
   layout.prepend(summary); layout.append(warnings, actions);
   detail.append(progress, controls);
   for (const node of [...layout.querySelectorAll(':scope > .timeline908-plans')]) detail.append(node);
   const body = card.querySelector(':scope > .ldb'); if (body) detail.append(body);
   card.append(detail);
   for (const gantry of detail.querySelectorAll('.tl841-gantry')) {
    const stage = Number(gantry.dataset.tl841Stage);
    // Off site, unknown, blocked and Finished never pulse. Earlier reached stages remain steady.
    if (stage >= 2 && stage <= 4) gantry.children[stage - 1]?.classList.add('lc990-current');
   }
  }
  pane.querySelectorAll('.lc990').forEach(nestWorkspace);
  timeline841Schedule();
 }
 const beforeRender = renderTimeline;
 renderTimeline = function () { const result = beforeRender.apply(this, arguments); apply(document.getElementById('pane-timeline')); return result; };
 const beforeToggle = ldToggle;
 ldToggle = function (button) {
  const card = button.closest('.lc990');
  if (!card) return beforeToggle.apply(this, arguments);
  const id = button.dataset.ld, closing = pending.get(id);
  if (closing) {
   clearTimeout(closing.timer); closing.animation?.cancel(); pending.delete(id); sweep(card); return;
  }
  if (button.getAttribute('aria-expanded') === 'true' && !quiet()) {
   const box = card.querySelector(':scope > .lc990-detail');
   const animation = animate(box, box.getBoundingClientRect().height, 0);
   // The native toggle still owns expansion state, rendering, focus and scroll restoration.
   const timer = setTimeout(() => {
    pending.delete(id);
    const current = cardFor(id)?.querySelector('.lc990-toggle');
    if (current?.getAttribute('aria-expanded') === 'true') { beforeToggle(current); sweep(cardFor(id)); }
   }, 195);
   pending.set(id, {timer, animation}); sweep(card); return;
  }
  beforeToggle(button);
  const next = cardFor(id), box = next?.querySelector(':scope > .lc990-detail');
  if (box && !box.hidden) animate(box, 0, box.getBoundingClientRect().height);
  sweep(next);
 };
 document.addEventListener('click', event => {
  const target = event.target.closest?.('#pane-timeline .lc990 button, #pane-timeline .lc990 a, #pane-timeline .lc990 summary');
  if (target && !target.classList.contains('lc990-toggle')) { const card = target.closest('.lc990'); nestWorkspace(card); sweep(card); }
 });
 document.addEventListener('animationend', event => { if (event.animationName === 'lc990-sweep') event.target.classList.remove('lc990-tap'); });
 apply(document.getElementById('pane-timeline'));
 window.LoadCards990 = {apply};
})();
