/* Author: Andrew Fisher. Preview only: compact native Today controls without copying records or actions. */
(function () {
 'use strict';
 let actionsOpen = false;
 const staffOpen = new Map();
 const head = () => document.querySelector('#pane-today > .acts793 > .head');
 function remember() {
  const fold = head()?.querySelector(':scope > .today993-actions-fold');
  if (fold?.isConnected) actionsOpen = fold.open;
  const staff = document.querySelector('#pane-today > .staff988');
  const disclosure = staff?.querySelector(':scope > .today993-staff-fold');
  if (disclosure?.isConnected) staffOpen.set(staff.dataset.staff988Day, disclosure.open);
 }
 function mountStaff() {
  const staff = document.querySelector('#pane-today > .staff988');
  if (!staff || staff.querySelector(':scope > .today993-staff-fold')) return;
  // The native text distinguishes no record from a confirmed zero and from loading.
  if (staff.querySelector('.staff988-heading > strong')?.textContent.trim() !== 'Not recorded'
      || staff.querySelector('.staff988-empty')?.textContent.trim() !== 'No availability recorded.') return;
  const fold = document.createElement('details'), summary = document.createElement('summary');
  fold.className = 'today993-staff-fold';
  const title = document.createElement('span'); title.textContent = 'Staff · Not recorded';
  const date = document.createElement('time'); date.className = 'today993-staff-date';
  date.dateTime = staff.dataset.staff988Day;
  date.textContent = staff.querySelector('.staff988-heading > div > span')?.textContent || staff.dataset.staff988Day;
  summary.append(title, date);
  const body = document.createElement('div'); body.className = 'today993-staff-body';
  while (staff.firstChild) body.append(staff.firstChild);
  fold.append(summary, body); fold.open = staffOpen.get(staff.dataset.staff988Day) || false;
  fold.addEventListener('toggle', () => { if (fold.isConnected) staffOpen.set(staff.dataset.staff988Day, fold.open); });
  staff.append(fold); staff.classList.add('today993-staff-unrecorded');
 }
 function mount() {
  const header = head(), nav = header?.querySelector('.jump95');
  if (header && nav) {
   let fold = header.querySelector(':scope > .today993-actions-fold');
   if (!fold) {
    fold = document.createElement('details'); fold.className = 'today993-actions-fold';
    const summary = document.createElement('summary'); summary.textContent = 'Actions';
    summary.setAttribute('aria-label', 'Today actions and section shortcuts');
    const actions = document.createElement('div'); actions.className = 'today993-secondary-actions';
    fold.append(summary, actions); fold.open = actionsOpen;
    fold.addEventListener('toggle', () => { if (fold.isConnected) actionsOpen = fold.open; });
    header.append(fold);
   }
   const secondary = fold.querySelector('.today993-secondary-actions');
   const primary = header.querySelector(':scope > .hacts');
   for (const id of ['emailProgress', 'printProgress']) {
    const current = primary?.querySelector('#' + id);
    if (!current) continue;
    // A native progress redraw may supply a fresh actions row while this fold survives.
    secondary.querySelector('#' + id)?.remove(); secondary.append(current);
   }
   // Keep native listeners, keyboard handling and destination closures on each button.
   if (nav.parentElement !== fold) fold.append(nav);
  }
  mountStaff();
 }
 function decorate(owner, key) {
  const previous = owner?.[key];
  if (typeof previous !== 'function') return;
  const decorated = function () { remember(); const result = previous.apply(this, arguments); mount(); return result; };
  Object.assign(decorated, previous); owner[key] = decorated;
 }
 decorate(window, 'renderToday');
 // Progress and staff refreshes can replace native nodes without a full Today redraw.
 // syncFooter calls the staff module's private refresh, so its public API alone is insufficient.
 decorate(window, 'pack795');
 decorate(window, 'syncFooter');
 decorate(window.DailyStaff988, 'refresh');
 window.TodayTop993 = {mount, report: () => ({
  folds: document.querySelectorAll('#pane-today > .acts793 .today993-actions-fold').length,
  navigations: document.querySelectorAll('#pane-today > .acts793 .jump95').length,
  open: !!head()?.querySelector('.today993-actions-fold')?.open
 })};
 mount();
})();
