/* Author: Andrew Fisher. Half-hour planning choices; native setters keep ownership of all saves. */
const TIME907_INPUTS = 'input[type="time"][data-eta],input[type="time"][data-crew883-start],input[type="time"][data-crew883-finish]';
function time907Label(value) {
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return value;
  const h = Number(m[1]);
  return (h % 12 || 12) + ':' + m[2] + (m[3] ? ':' + m[3] : '') + (h < 12 ? ' AM' : ' PM');
}
function time907Ensure(select, value) {
  if (!select || select.tagName !== 'SELECT' || !value || [...select.options].some(o => o.value === value)) return;
  const option = new Option(time907Label(value), value);
  const next = [...select.options].find(o => o.value && o.value > value);
  select.add(option, next || null);
}
function time907Select(input) {
  const select = document.createElement('select');
  for (const a of input.attributes) {
    if (!['type', 'step', 'value', 'readonly'].includes(a.name)) select.setAttribute(a.name, a.value);
  }
  select.classList.add('time907');
  select.disabled = input.disabled || input.readOnly;
  select.add(new Option('To confirm', ''));
  for (let minute = 5 * 60; minute < 24 * 60; minute += 30) {
    const value = String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');
    select.add(new Option(time907Label(value), value));
  }
  const value = input.value;
  time907Ensure(select, value);
  select.value = value;
  if (select.selectedIndex >= 0) select.options[select.selectedIndex].defaultSelected = true;
  // A drawer uses its existing associated label; cards already carry an aria-label.
  if (!select.id && !select.hasAttribute('aria-label') && !select.hasAttribute('aria-labelledby') && input.dataset.eta) {
    select.setAttribute('aria-label', 'Planned time to site for ' + input.dataset.eta);
  }
  return select;
}
function time907Html(html) {
  // Transform individual inputs only: leave all surrounding native markup byte-for-byte intact.
  return String(html).replace(/<input\b[^>]*\btype=["']time["'][^>]*>/gi, tag => {
    const template = document.createElement('template');
    template.innerHTML = tag;
    const input = template.content.firstElementChild;
    return input && input.matches(TIME907_INPUTS) ? time907Select(input).outerHTML : tag;
  });
}
const deliveryCardBeforeTime907 = deliveryCard;
deliveryCard = function (...args) { return time907Html(deliveryCardBeforeTime907.apply(this, args)); };
const dayRowsBeforeTime907 = dayRows;
dayRows = function (...args) { return time907Html(dayRowsBeforeTime907.apply(this, args)); };
const dayCardsBeforeTime907 = dayCards;
dayCards = function (...args) { return time907Html(dayCardsBeforeTime907.apply(this, args)); };
const crew883EditorBeforeTime907 = crew883Editor;
crew883Editor = function (...args) { return time907Html(crew883EditorBeforeTime907.apply(this, args)); };
document.addEventListener('change', event => {
  const start = event.target;
  if (!start.matches || !start.matches('select.time907[data-crew883-start]')) return;
  const box = start.closest('.crew883');
  if (box) time907Ensure(box.querySelector('select.time907[data-crew883-finish]'), crew883Finish(start.value));
  // The existing crew883 change listener sets the finish; do not dispatch or save here.
}, true);
// Handle an initial draw that completed before this final script. Subsequent draws use the four wrappers.
for (const root of document.querySelectorAll('#pane-today,#pane-timeline,#drawer')) {
  root.querySelectorAll(TIME907_INPUTS).forEach(input => input.replaceWith(time907Select(input)));
}
