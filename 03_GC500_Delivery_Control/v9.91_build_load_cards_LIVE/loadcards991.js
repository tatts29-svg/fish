/* Author: Andrew Fisher. Presentation only: move native nodes, keep their actions and records. */
(function () {
 'use strict';
 const pending = new Map();
 const recordOpen = new Map(), movedGantries = new WeakMap();
 const quiet = () => motionOff() || matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cardFor = id => [...document.querySelectorAll('#pane-timeline [data-tl846-load]')].find(n => n.dataset.tl846Load === id);
 function nestWorkspace(card) {
  const workspace = card?.querySelector(':scope > .drops911'), detail = card?.querySelector(':scope > .lc991-detail');
  if (workspace && detail) detail.prepend(workspace);
 }
 function sweep(card) {
  if (!card || quiet()) return;
  card.classList.remove('lc991-tap');
  void card.offsetWidth;
  card.classList.add('lc991-tap');
 }
 function animate(box, from, to) {
  if (!box || quiet()) return null;
  return box.animate([{height: from + 'px', opacity: from ? 1 : 0}, {height: to + 'px', opacity: to ? 1 : 0}],
   {duration: 200, easing: 'cubic-bezier(.2,.7,.2,1)'});
 }
 function apply(pane) {
  if (!pane) return;
  for (const card of pane.querySelectorAll('.ld.tl846:not(.lc991)')) {
   const layout = card.querySelector(':scope > .tl846-layout');
   const toggle = layout?.querySelector(':scope > .ldl[data-ld]');
   const controls = layout?.querySelector(':scope > .tl846-controls');
   if (!toggle || !controls) continue;
   card.classList.add('lc991');
   const open = toggle.getAttribute('aria-expanded') === 'true';
   const summary = document.createElement('div'); summary.className = 'lc991-summary';
   const actions = document.createElement('div'); actions.className = 'lc991-actions';
   const warnings = document.createElement('div'); warnings.className = 'lc991-warnings';
   const detail = document.createElement('div'); detail.className = 'lc991-detail';
   // IDs follow the existing native load ID convention; nothing is stored in the shared record.
   detail.id = 'lc991-' + toggle.dataset.ld.replace(/[^A-Za-z0-9]+/g, '-');
   detail.hidden = !open; detail.inert = !open;
   toggle.setAttribute('aria-controls', detail.id);
   toggle.setAttribute('aria-label', (open ? 'Close' : 'Open') + ' details for ' + (toggle.getAttribute('aria-label') || 'load').split('. Press')[0]);
   toggle.classList.add('lc991-toggle');
   const number = toggle.querySelector(':scope > .ld-n'), time = toggle.querySelector(':scope > .ld-t'), refs = toggle.querySelector(':scope > .ld-refs');
   if (number) {
    const visibleNumber = number.cloneNode(true); visibleNumber.className = 'lc991-number'; visibleNumber.setAttribute('aria-hidden', 'true'); summary.append(visibleNumber);
   }
   if (time) { summary.append(time); const missing = time.querySelector('b.nt'); if (missing) missing.textContent = 'No time'; }
   summary.classList.toggle('lc991-untimed', !time);
   if (refs) summary.append(refs);
   toggle.replaceChildren(document.createTextNode(open ? 'Details ▴' : 'Details ▾'));
   // Native Arrange loads uses .ldl .ld-n b to find/select a load. Keep that hook once,
   // hidden inside the original button; the summary is the sole visible load number.
   if (number) { number.hidden = true; toggle.append(number); }
   const progress = document.createElement('div'); progress.className = 'lc991-progress';
   for (const ref of summary.querySelectorAll('.tl841-ref')) {
    const group = document.createElement('section'); group.className = 'lc991-progress-ref';
    const heading = document.createElement('b'); heading.textContent = ref.dataset.tl841Ref + ' · Load progress'; group.append(heading);
    const ticks = ref.querySelector(':scope > .tl846-ticks');
    if (ticks) {
     const exceptions = document.createElement('span'); exceptions.className = 'lc991-ref-exceptions';
     // These are native short-delivery/partial-installation facts, not decorative completion ticks.
     for (const chip of ticks.querySelectorAll('.ld-tk.sh')) {
      if (chip.textContent.trim().toLowerCase() === 'short' && /^Short:\s*/i.test(chip.title)) {
       chip.textContent = 'Short · ' + chip.title.replace(/^Short:\s*/i, '');
      }
      exceptions.append(chip);
     }
     if (exceptions.children.length) {
      const identity = ref.querySelector(':scope > .tl846-identity');
      if (identity) identity.after(exceptions); else ref.prepend(exceptions);
     }
     // Finished is already written in the summary; keep setup facts without a second completion mark.
     if (ref.querySelector('.tl841-status.finished')) ticks.querySelectorAll('.ld-tk[title="Complete"]').forEach(n => n.remove());
     ticks.querySelectorAll('.ld-tks:empty').forEach(n => n.remove());
     if (ticks.children.length) group.append(ticks); else ticks.remove();
    }
    const gantry = ref.querySelector(':scope > .tl841-gantry');
    if (gantry) { movedGantries.set(ref, gantry); heading.after(gantry); }
    if (group.children.length > 1) progress.append(group);
   }
   // Keep EVERY native warning chip up front, including restriction and arrival/area conflicts.
   controls.querySelectorAll('.flow891-chip').forEach(n => warnings.append(n));
   const nav = controls.querySelector('.ld-nav'); if (nav) actions.append(nav);
   actions.append(toggle);
   layout.prepend(summary); layout.append(warnings, actions);
   detail.append(progress, controls);
   for (const node of [...layout.querySelectorAll(':scope > .timeline908-plans')]) detail.append(node);
   const body = card.querySelector(':scope > .ldb');
   const focused = body?.contains(document.activeElement) ? document.activeElement : null;
   const selection = focused && typeof focused.selectionStart === 'number' ? [focused.selectionStart, focused.selectionEnd] : null;
   if (body) {
    const record = document.createElement('details'); record.className = 'lc991-record';
    const label = document.createElement('summary'); label.textContent = 'Photos, notes & delivery record';
    record.open = !!recordOpen.get(toggle.dataset.ld) || !!focused;
    record.append(label, body); detail.append(record);
    record.addEventListener('toggle', () => {
     // Redraws disconnect old details before their queued toggle event is delivered.
     if (record.isConnected) recordOpen.set(toggle.dataset.ld, record.open);
    });
   }
   card.append(detail);
   if (focused && open) {
    try { focused.focus({preventScroll: true}); if (selection) focused.setSelectionRange(...selection); } catch (_) {}
   }
   for (const gantry of detail.querySelectorAll('.tl841-gantry')) {
    const stage = Number(gantry.dataset.tl841Stage);
    // Off site, unknown, blocked and Finished never pulse. Earlier reached stages remain steady.
    if (stage >= 2 && stage <= 4) gantry.children[stage - 1]?.classList.add('lc991-current');
   }
  }
  pane.querySelectorAll('.lc991').forEach(nestWorkspace);
  timeline841Schedule();
 }
 const beforeRender = renderTimeline;
 renderTimeline = function () {
  // Details toggle events are queued; retain the actual open state before native redraw removes the node.
  document.querySelectorAll('#pane-timeline .lc991-record').forEach(record => {
   const toggle = record.closest('.lc991')?.querySelector('.lc991-toggle');
   if (toggle) recordOpen.set(toggle.dataset.ld, record.open);
  });
  const result = beforeRender.apply(this, arguments); apply(document.getElementById('pane-timeline')); return result;
 };
 const beforeToggle = ldToggle;
 ldToggle = function (button) {
  const card = button.closest('.lc991');
  if (!card) return beforeToggle.apply(this, arguments);
  const id = button.dataset.ld, closing = pending.get(id);
  if (closing) {
   clearTimeout(closing.timer); closing.animation?.cancel(); pending.delete(id); sweep(card); return;
  }
  if (button.getAttribute('aria-expanded') === 'true' && !quiet()) {
   const box = card.querySelector(':scope > .lc991-detail');
   const animation = animate(box, box.getBoundingClientRect().height, 0);
   // The native toggle still owns expansion state, rendering, focus and scroll restoration.
   const timer = setTimeout(() => {
    pending.delete(id);
    const current = cardFor(id)?.querySelector('.lc991-toggle');
    if (current?.getAttribute('aria-expanded') === 'true') { beforeToggle(current); sweep(cardFor(id)); }
   }, 195);
   pending.set(id, {timer, animation}); sweep(card); return;
  }
  beforeToggle(button);
  const next = cardFor(id), box = next?.querySelector(':scope > .lc991-detail');
  if (box && !box.hidden) animate(box, 0, box.getBoundingClientRect().height);
  sweep(next);
 };
 document.addEventListener('click', event => {
  const target = event.target.closest?.('#pane-timeline .lc991 button, #pane-timeline .lc991 a, #pane-timeline .lc991 summary');
  if (target && !target.classList.contains('lc991-toggle')) { const card = target.closest('.lc991'); nestWorkspace(card); sweep(card); }
 });
 document.addEventListener('animationend', event => { if (event.animationName === 'lc991-sweep') event.target.classList.remove('lc991-tap'); });
 // The native report still describes the same refs and lamps after their presentation moves apart.
 const beforeReport = window.Timeline841?.report;
 if (beforeReport) {
  const reportVersion = beforeReport().version;
  window.Timeline841.report = function () {
   return {version: reportVersion, dialog: !!document.getElementById('timeline841-dialog'), rows: [...document.querySelectorAll('#pane-timeline .tl841-ref')].map(ref => {
    const gantry = ref.querySelector('.tl841-gantry') || movedGantries.get(ref);
    return {key: ref.dataset.tl841Ref, stage: +gantry.dataset.tl841Stage, running: gantry.classList.contains('tl841-live')};
   })};
  };
 }
 apply(document.getElementById('pane-timeline'));
 window.LoadCards991 = {apply};
})();
