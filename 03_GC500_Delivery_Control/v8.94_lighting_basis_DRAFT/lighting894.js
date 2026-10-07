/* Author: Andrew Fisher. v8.94: the Lighting group's basis is stated wherever its reading is shown.
 * Lighting reads confirmed completion over the register's lighting towers. The lighting scope audit (map symbols against
 * scheduled quantities and current records) is still pending, and it could move the lighting total either way. So the
 * reading is labelled provisional rather than given a direction: the number is unchanged; the Where we are card lists
 * Lighting as provisional, its chip and the Lighting card say why, and all five lights can never turn green on an
 * unconfirmed scope. Presentation only: no record, DATA or money changes. */
(() => {
 'use strict';
 const NOTE = 'Lighting scope not yet confirmed: lighting audit pending';
 const SHORT = 'Scope not yet confirmed';
 const BASIS = ' Lighting counts confirmed completion over the register’s lighting towers. Its scope (which lights the job needs) is still being audited against the lighting plan and schedule, so the Lighting reading, and the whole job with it, is provisional until that audit is confirmed.';
 if (typeof progress881Model !== 'function' || typeof renderToday_held !== 'function') return;

 /* 1. the model behind the Where we are card: Lighting is provisional; the numbers stay exactly as they are */
 const model = progress881Model;
 progress881Model = function (...args) {
  const m = model.apply(this, args);
  try {
   const row = m && Array.isArray(m.rows) ? m.rows.find(r => r.id === 'lighting') : null;
   if (row) {
    row.provisional = true; row.scope894 = 'pending';
    row.basis = 'Confirmed completion over the register’s lighting towers; ' + NOTE.charAt(0).toLowerCase() + NOTE.slice(1);
    m.provisional = true; m.allGreen = false;
    if (m.ready && m.pct && typeof m.pct.min === 'number') m.reached = Math.min(4, Math.floor(m.pct.min / 20));
   }
  } catch (err) { console.error('Lighting basis', err); }
  return m;
 };

 /* 2. the same words where people read the Lighting figure: the card's chip, its basis note and the Lighting group card */
 function decorate() {
  const chip = document.getElementById('w885-jump-lighting');
  if (chip && !chip.querySelector('.w894-scope')) {
   chip.insertAdjacentHTML('beforeend', '<span class="w894-scope">' + SHORT + '</span>');
   const label = chip.getAttribute('aria-label') || '';
   chip.setAttribute('aria-label', label.replace(/\.\s*Go to /, '. ' + NOTE + '. Go to '));
   chip.title = NOTE;
  }
  const basis = document.querySelector('#where885 .w885-basis p');
  if (basis && !basis.dataset.w894) { basis.textContent += BASIS; basis.dataset.w894 = '1'; }
  const card = document.getElementById('tw840-card-lighting');
  const scope = card && card.querySelector('.tw840-scope');
  if (scope && !card.querySelector('.w894-card-scope')) scope.insertAdjacentHTML('afterend', '<p class="w894-card-scope">' + NOTE + '</p>');
 }
 const held = renderToday_held;
 renderToday_held = function (...args) {
  const result = held.apply(this, args);
  try { decorate(); } catch (err) { console.error('Lighting basis', err); }
  return result;
 };
 window.Lighting894 = {note: NOTE, decorate, report: () => {
  const chip = document.getElementById('w885-jump-lighting'), card = document.getElementById('tw840-card-lighting');
  return {version: 'v8.94', chip: !!chip?.querySelector('.w894-scope'), card: !!card?.querySelector('.w894-card-scope'),
   basis: !!document.querySelector('#where885 .w885-basis p')?.dataset.w894};
 }};
 try { decorate(); } catch (err) { console.error('Lighting basis', err); }
})();
