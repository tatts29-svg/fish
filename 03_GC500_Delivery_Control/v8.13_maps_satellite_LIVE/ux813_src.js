/* Author: Andrew Fisher. Map selections stay on the map; opening a record is explicit. */
function clearSelection813() {
  selected = null; stopPulse(); highlight = null;
  document.querySelectorAll('.findlist button.sel').forEach(b => b.classList.remove('sel'));
  if (window.GC500Explorer && window.GC500Explorer.clearPick813) window.GC500Explorer.clearPick813();
}
function panel813(on, returnFocus = false) {
  document.body.classList.toggle('nav', !!on);
  $('navBtn').setAttribute('aria-expanded', String(!!on));
  if (!on && returnFocus && matchMedia('(max-width:900px)').matches) $('navBtn').focus({preventScroll: true});
}
function pickedLocation813() {
  panel813(false);
  if (matchMedia('(max-width:900px)').matches) stage.focus({preventScroll: true});
}
function closeLegend813(returnFocus = true) {
  $('legend').classList.remove('show');
  $('legendBtn').setAttribute('aria-expanded', 'false');
  if (returnFocus) (matchMedia('(max-width:900px)').matches && !document.body.classList.contains('nav') ? $('navBtn') : $('legendBtn')).focus({preventScroll: true});
}
function sourceProvider813() {
  const label = $('sourceProvider813');
  if (label) label.textContent = SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite';
}
if ($('about813')) $('about813').addEventListener('toggle', sourceProvider813);
$('navBtn').onclick = () => panel813(!document.body.classList.contains('nav'));
$('legendBtn').setAttribute('aria-controls', 'legend');
$('legendBtn').setAttribute('aria-expanded', 'false');
$('legendBtn').onclick = () => {
  const L = $('legend');
  if (L.classList.contains('show')) { closeLegend813(); return; }
  sourceProvider813(); L.innerHTML = legendHtml(); L.classList.add('show');
  L.setAttribute('role', 'dialog'); L.setAttribute('aria-label', 'Drawing legend and sources'); L.setAttribute('tabindex', '-1');
  $('legendBtn').setAttribute('aria-expanded', 'true');
  if (matchMedia('(max-width:900px)').matches) panel813(false);
  L.scrollTop = 0; L.querySelector('[data-closelegend813]').focus({preventScroll: true});
};
$('legend').addEventListener('click', e => { if (e.target.closest('[data-closelegend813]')) closeLegend813(); });
/* Escape dismisses the visible overlay even when its input has focus. A second Escape retains the map's own reset. */
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('legend').classList.contains('show')) { e.preventDefault(); e.stopImmediatePropagation(); closeLegend813(); }
  else if (matchMedia('(max-width:900px)').matches && document.body.classList.contains('nav')) { e.preventDefault(); e.stopImmediatePropagation(); panel813(false, true); }
}, true);
