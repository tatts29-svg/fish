/* Author: Andrew Fisher. Map callouts and the vehicle chooser close one level at a time. */
(function () {
 'use strict';
 const mapReturns = new WeakMap();
 // Native callout functions focus their content before observers run. Capture the real
 // map control first, then give the existing navigation controller that return target.
 for (const name of ['layerCallout', 'emptyCallout', 'pickMarker']) {
  const original = window[name];
  if (typeof original !== 'function') continue;
  window[name] = function (...args) {
   const active = document.activeElement;
   const previous = active?.closest('.mkpick');
   const target = previous ? mapReturns.get(previous) : active;
   const result = original.apply(this, args);
   const popup = [...document.querySelectorAll('.mkpick[role="dialog"]')].at(-1);
   if (popup) {
    mapReturns.set(popup, target);
    window.Navigation934?.remember(popup, target);
    if (!popup.contains(document.activeElement)) popup.querySelector('[data-nav934-back],button.close')?.focus({preventScroll: true});
   }
   return result;
  };
 }

 const panel = document.getElementById('sePanel');
 const trigger = document.getElementById('seTrig');
 const close = panel?.querySelector('.se-x');
 if (!panel || !trigger || !close) return;
 const returnFocus = () => {
  if (!trigger.hidden && trigger.getClientRects().length && !trigger.closest('[hidden],[inert]')) {
   trigger.focus({preventScroll: true});
  }
 };
 const originalClose = close.onclick;
 close.onclick = function (...args) {
  const result = originalClose?.apply(this, args);
  returnFocus();
  return result;
 };
 const back = document.createElement('button');
 back.type = 'button';
 back.className = 'btn nav934-back';
 back.dataset.nav994Back = '';
 back.setAttribute('data-ro', '');
 back.setAttribute('aria-label', 'Back from Special Editions');
 back.textContent = '← Back';
 back.onclick = () => close.click();
 close.before(back);
 const originalOpen = trigger.onclick;
 trigger.onclick = function (...args) {
  const result = originalOpen?.apply(this, args);
  trigger.setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) back.focus({preventScroll: true});
  else returnFocus();
  return result;
 };
 trigger.setAttribute('aria-controls', 'sePanel');
 trigger.setAttribute('aria-expanded', String(!panel.hidden));
 new MutationObserver(() => trigger.setAttribute('aria-expanded', String(!panel.hidden)))
  .observe(panel, {attributes: true, attributeFilter: ['hidden']});
 window.addEventListener('keydown', event => {
  if (event.defaultPrevented || panel.hidden || !panel.getClientRects().length) return;
  if (event.key === 'Escape') {
   // The parent Showcase has its own Escape listener. Retire only this child.
   event.preventDefault();
   event.stopImmediatePropagation();
   close.click();
   return;
  }
  if (event.key !== 'Tab') return;
  const stops = [...panel.querySelectorAll('button,a[href],input,select,[tabindex]')]
   .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length && !node.closest('[hidden],[inert]'));
  if (!stops.length) return;
  event.stopImmediatePropagation();
  const index = stops.indexOf(document.activeElement);
  if (index < 0 || event.shiftKey && index === 0 || !event.shiftKey && index === stops.length - 1) {
   event.preventDefault();
   (event.shiftKey ? stops.at(-1) : stops[0]).focus();
  }
 }, true);
})();
