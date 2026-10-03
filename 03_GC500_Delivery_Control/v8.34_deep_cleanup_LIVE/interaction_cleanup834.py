"""Author: Andrew Fisher. Guarded Pricing interaction and supplied-number cleanup."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

HELPER = r'''/* v8.34 — retain the Pricing control and table position through its one redraw. */
function pricingAction834(target, action){
 const pane = $('#pane-pricing'), main = $('main');
 const attr = ['data-lab-all', 'data-rk', 'data-ak', 'data-min', 'data-hrs', 'data-scope'].find(k => target && target.hasAttribute(k));
 if (!pane || !main || !attr || !pane.contains(target)) return action();
 const value = target.getAttribute(attr), on = target.getAttribute('data-on');
 const top = target.getBoundingClientRect().top, y = main.scrollTop;
 const wrap = target.closest('.tblwrap'), x = wrap ? wrap.scrollLeft : 0;
 const focused = document.activeElement === target;
 const selection = typeof target.selectionStart === 'number' ? [target.selectionStart, target.selectionEnd] : null;
 /* A same-page edit must not replay the tab's arrival transform on new cards. */
 pane.classList.remove('arrive');
 let current = null;
 const restore = () => {
  if (state.tab !== 'pricing' || !pane.isConnected) return;
  const next = [...pane.querySelectorAll('[' + attr + ']')].find(el => el.getAttribute(attr) === value && el.getAttribute('data-on') === on);
  if (!next || (current && current !== next)) return;
  current = next;
  const table = next.closest('.tblwrap'); if (table) table.scrollLeft = x;
  main.scrollTop = y;
  main.scrollTop += next.getBoundingClientRect().top - top;
  if (focused) { try { next.focus({preventScroll: true}); } catch (e) {} }
  if (focused && selection && next.setSelectionRange) { try { next.setSelectionRange(selection[0], selection[1]); } catch (e) {} }
 };
 try { return action(); }
 finally { restore(); if (current) requestAnimationFrame(restore); }
}
'''

OLD_RATE = ''' $('#pane-pricing').querySelectorAll('[data-rk]').forEach(i => i.onchange = () => {
 if (!mayWrite('a rate')) { renderPricing(); return; }
 const who = whoAmI(); if (!who) { renderPricing(); return; }
 if (String(i.value).trim() === '') delete S.rates[i.dataset.rk]; else S.rates[i.dataset.rk] = i.value;
 stampIt('rates', i.dataset.rk, who); save(); renderPricing(); });'''
NEW_RATE = ''' $('#pane-pricing').querySelectorAll('[data-rk]').forEach(i => i.onchange = () => pricingAction834(i, () => {
 if (!mayWrite('a rate')) { render(); return; }
 const who = whoAmI(); if (!who) { render(); return; }
 if (String(i.value).trim() === '') delete S.rates[i.dataset.rk]; else S.rates[i.dataset.rk] = i.value;
 stampIt('rates', i.dataset.rk, who); save(); render(); }));'''

OLD_TICK = ''' $('#pane-pricing').querySelectorAll('[data-lab-all]').forEach(b => b.onclick = () => {
 const [disc, item, line] = b.dataset.labAll.split('|');
 const n = setLabourAll(disc, item, line, b.dataset.on === '1');
 if (n === false) { renderPricing(); return; }
 flash((b.dataset.on === '1' ? 'Ticked ' : 'Unticked ') + line + ' on ' + n + ' reference' + (n === 1 ? '' : 's') + ' carrying ' + item + '.');
 renderPricing(); });'''
NEW_TICK = ''' $('#pane-pricing').querySelectorAll('[data-lab-all]').forEach(b => b.onclick = () => pricingAction834(b, () => {
 const [disc, item, line] = b.dataset.labAll.split('|');
 const n = setLabourAll(disc, item, line, b.dataset.on === '1');
 if (n === false) return;
 flash((b.dataset.on === '1' ? 'Ticked ' : 'Unticked ') + line + ' on ' + n + ' reference' + (n === 1 ? '' : 's') + ' carrying ' + item + '.');
 }));'''

OLD_ACCESSORY = OLD_RATE.replace('data-rk', 'data-ak').replace('S.rates', 'S.accRates').replace('dataset.rk', 'dataset.ak').replace("stampIt('rates'", "stampIt('accRates'")
NEW_ACCESSORY = NEW_RATE.replace('data-rk', 'data-ak').replace('S.rates', 'S.accRates').replace('dataset.rk', 'dataset.ak').replace("stampIt('rates'", "stampIt('accRates'")

OLD_MINIMUM = ''' $('#pane-pricing').querySelectorAll('[data-min]').forEach(i => i.onchange = () => {
 const [disc, item] = i.dataset.min.split('|');
 setMinDays(disc, item, i.value); renderPricing(); });'''
NEW_MINIMUM = ''' $('#pane-pricing').querySelectorAll('[data-min]').forEach(i => i.onchange = () => pricingAction834(i, () => {
 const [disc, item] = i.dataset.min.split('|');
 if (!setMinDays(disc, item, i.value)) render(); }));'''

OLD_HOURS = ''' $('#pane-pricing').querySelectorAll('[data-hrs]').forEach(i => i.onchange = () => {
 const [role, day] = i.dataset.hrs.split('|');
 if (!setEventHours(role, day, i.value)) { renderPricing(); return; }
 renderPricing(); });'''
NEW_HOURS = ''' $('#pane-pricing').querySelectorAll('[data-hrs]').forEach(i => i.onchange = () => pricingAction834(i, () => {
 const [role, day] = i.dataset.hrs.split('|');
 if (!setEventHours(role, day, i.value)) render(); }));'''

OLD_SCOPE = ''' pane.querySelectorAll('[data-scope]').forEach(i => i.onchange = () => {
 const [kind, a, day] = i.dataset.scope.split('|');
 let v = i.value;
 if (kind === 'time' && a === 'entertainment_concludes' && v === '00:00') v = 'none';
 if (!setScope(kind, a, day || null, v)) { renderPricing(); return; }
 renderPricing(); });'''
NEW_SCOPE = ''' pane.querySelectorAll('[data-scope]').forEach(i => i.onchange = () => pricingAction834(i, () => {
 const [kind, a, day] = i.dataset.scope.split('|');
 let v = i.value;
 if (kind === 'time' && a === 'entertainment_concludes' && v === '00:00') v = 'none';
 if (!setScope(kind, a, day || null, v)) render(); }));'''

HANDLERS = ((OLD_RATE, NEW_RATE), (OLD_TICK, NEW_TICK),
            (OLD_ACCESSORY, NEW_ACCESSORY), (OLD_MINIMUM, NEW_MINIMUM),
            (OLD_HOURS, NEW_HOURS), (OLD_SCOPE, NEW_SCOPE))


def apply(text):
    """Pure transformation; the release owner supplies the final base/hash guard."""
    if 'function pricingAction834(' in text:
        raise ValueError('Pricing interaction cleanup is already applied')
    if 'function labourSource832(' not in text:
        raise ValueError('The current labour-source release must be present')
    text = rep(text, 'function renderPricing(){ return holdAssets(renderPricing_held); }',
               HELPER + 'function renderPricing(){ return holdAssets(renderPricing_held); }',
               'Pricing-only scroll and focused-control context', 'host')
    for index, (old, new) in enumerate(HANDLERS):
        text = rep(text, old, new, f'Keep Pricing edit redraw once, handler {index + 1}', 'host')
    text = rep(text,
               ' const rows = itemRows(a), loc = localSupplied(a.key), com = CROW.get(a.key) || {};\n const nums = (com.asset_numbers_supplied || []).concat(loc.asset_numbers || []);',
               ' const rows = itemRows(a), loc = localSupplied(a.key);\n const nums = [...new Set(assetNumbersOf(a).map(n => String(n).trim()).filter(Boolean))];',
               'Show the canonical supplied asset numbers, respecting removals', 'host')
    text = rep(text,
               ' ${nums.length ? `<p class="norate">Recorded on site: <b class="mono">${nums.map(esc).join(\', \')}</b></p>` : \'\'}',
               ' ${nums.length ? `<p class="norate">Asset numbers: <b class="mono">${nums.map(esc).join(\', \')}</b></p>` : \'\'}',
               'Name the asset-number list without inferring arrival', 'host')
    return text
