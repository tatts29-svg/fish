"""Author: Andrew Fisher. v10.57 part 1 - the Build tab tidied: a legible no-twin-steer banner, the locked delivery
orders off the Timeline, and the Timeline's twin-steer rule as one red line (Andrew, 17 Oct 2026, on the Build tab:
"Your locked order is taken up the whole page. Hide it somewhere else not here. You have no twin steer but i cant even
see the writing.. ... Needs to be neat and tidy its a card of that day with details.").

(a) The red NO TWIN-STEER TRUCKS strip under the header could not be read: the header's photo shading (.hzscene, a
    positioned layer at z-index 0) painted over it, because v10.53 left the strip unpositioned. It now sits above the
    shading (position:relative; z-index:2 - still under the search/clock pop-outs, the tabs, the Tools menu and the
    drawer scrim). Shorter words: two lines on a phone, one on a computer. The print lock is untouched (the strip is
    still hidden in print; nothing here sets display).
(b) The v10.54 list "Delivery orders to keep · locked" no longer sits at the top of the Timeline (it was 819 px on a
    phone), and the Timeline is no longer watched for it. The full list is kept, folded shut, at the foot of the Demob
    tab ("Delivery orders · locked"), in the same fold the Demob tab already uses. Each building's drawer keeps its
    own "Delivery order · locked" card, unchanged.
(c) The tall pink rule card on the Timeline day panel (219 px on a phone) becomes one red line - "No twin-steer trucks
    · track, Esplanade, Macintosh Island Park · Week 3 to demob" - with the full rule behind a small More. Printed, the
    full rule shows (as before). The card's class is renamed (ts1057-rule) so the tick dialog's rule paragraph no
    longer takes the card's pink styling.

The record does not change. No footer bump here (the release integrator does that).

    python3 part1_banner_orders.py path/to/page.html   (on the v10.56 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

# ---------------------------------------------------------------- (a) the banner under the header
BANNER_WORDS_OLD = "b.innerHTML = '⛔ <b>NO TWIN-STEER TRUCKS</b> on the track, the Esplanade or inside Macintosh Island Park · Week 3 to Race Week and demob';"
BANNER_WORDS_NEW = ("b.innerHTML = '<span class=\"ts1053-ic\" aria-hidden=\"true\">⛔</span><b>NO TWIN-STEER TRUCKS</b> · "
                    "<span class=\"ts1053-nw\">Week 3 to demob</span> · <span class=\"ts1053-nw\">track, Esplanade,</span> "
                    "<span class=\"ts1053-nw\">Macintosh Island Park</span>';")

BANNER_CSS_OLD = """'#ts1053-banner{background:#b3120b;color:#fff;font-weight:600;font-size:13px;line-height:1.35;padding:6px 12px;text-align:center;letter-spacing:.01em}' +
  '#ts1053-banner b{font-weight:900;letter-spacing:.04em}' +"""
# no single quotes inside: this sits in a single-quoted JS string. Never display:...!important here (the print hide must win).
BANNER_CSS_NEW = """'#ts1053-banner{position:relative;z-index:2;background:#b3120b;color:#fff;font-weight:700;font-size:13px;line-height:1.3;padding:5px 12px;text-align:center;letter-spacing:0;text-shadow:none;border-top:1px solid #7d0c07;text-wrap:balance}' +
  '#ts1053-banner b{font-weight:900;letter-spacing:.03em;white-space:nowrap}#ts1053-banner .ts1053-nw{white-space:nowrap}' +
  '#ts1053-banner .ts1053-ic{display:inline-block;background:#fff;border-radius:50%;line-height:1;padding:1px;margin-right:3px;vertical-align:-1px}' +
  '@media (max-width:640px){#ts1053-banner{font-size:12.5px;line-height:1.28;padding:4px 10px}}' +"""

# ---------------------------------------------------------------- (c) the Timeline rule card -> one red line
RULECARD_OLD = """ if (typeof flow891Card === 'function') { const b = flow891Card; flow891Card = function(){ const h = b.apply(this, arguments); return typeof h === 'string' && h.indexOf('ts1053-rule') < 0 ? h + '<section class="card nosfold ts1053-rule" role="note"><b>⛔ ' + e(TITLE) + '</b><p>' + e(RULE) + ' ' + e(WHEN) + '</p></section>' : h; }; }"""
RULECARD_NEW = """ /* v10.57: one red line on the day panel, the full rule behind More (Andrew, 17 Oct 2026: "Needs to be neat and tidy") */
 let RULE_OPEN = false;
 const ruleLine = () => '<section class="card nosfold ts1057-rule' + (RULE_OPEN ? ' open' : '') + '" role="note" aria-label="No twin-steer trucks"><p class="ts1057-line"><span class="ts1057-ic" aria-hidden="true">⛔</span> <b>No twin-steer trucks</b> · <span class="ts1057-nw">track, Esplanade,</span> <span class="ts1057-nw">Macintosh Island Park</span> · <span class="ts1057-nw">Week 3 to demob</span> <button type="button" class="ts1057-more" data-ts1057-more aria-expanded="' + RULE_OPEN + '">' + (RULE_OPEN ? 'Less' : 'More') + '</button></p>' +
  '<div class="ts1057-full"><p><b>' + e(TITLE) + '</b></p><p>' + e(RULE) + '</p><p>' + e(WHEN) + '</p><p>' + e(WHY) + '</p></div></section>';
 D.addEventListener('click', ev => { const t = ev.target && ev.target.closest && ev.target.closest('[data-ts1057-more]'); if (!t) return; ev.preventDefault(); RULE_OPEN = !RULE_OPEN;
  D.querySelectorAll('.ts1057-rule').forEach(c => { c.classList.toggle('open', RULE_OPEN); const m = c.querySelector('[data-ts1057-more]'); if (m) { m.textContent = RULE_OPEN ? 'Less' : 'More'; m.setAttribute('aria-expanded', String(RULE_OPEN)); } }); });
 if (typeof flow891Card === 'function') { const b = flow891Card; flow891Card = function(){ const h = b.apply(this, arguments); return typeof h === 'string' && h.indexOf('ts1057-rule') < 0 ? h + ruleLine() : h; }; }"""

RULECARD_CSS_OLD = """'.ts1053-rule{border-left:4px solid #b3120b!important;background:#fde8e6!important;color:#5a0d07!important}.ts1053-rule p{margin:4px 0 0}' +"""
RULECARD_CSS_NEW = """'.ts1057-rule{border:0!important;border-left:4px solid #b3120b!important;background:#fde8e6!important;color:#5a0d07!important;box-shadow:none!important;padding:5px 8px 5px 10px!important;margin:8px 0!important;border-radius:6px!important;font-size:13px;line-height:1.35}' +
  '.ts1057-rule p{margin:0}.ts1057-rule .ts1057-line{font-weight:600;text-wrap:balance}.ts1057-rule .ts1057-line b{font-weight:900}.ts1057-rule .ts1057-nw{white-space:nowrap}' +
  '.ts1057-rule .ts1057-ic{display:inline-block;background:#fff;border-radius:50%;line-height:1;padding:1px;vertical-align:-1px}' +
  '.ts1057-rule .ts1057-more{font:inherit;font-size:12px;font-weight:700;line-height:1;color:#b3120b;background:#fff;border:1px solid #b3120b;border-radius:999px;padding:3px 9px;margin-left:4px;cursor:pointer;vertical-align:1px}' +
  '.ts1057-rule .ts1057-full{display:none;margin-top:4px;padding-top:4px;border-top:1px solid #f3c3bd}.ts1057-rule.open .ts1057-full{display:block}.ts1057-rule .ts1057-full p{margin:3px 0 0}' +
  '@media (max-width:640px){.ts1057-rule{font-size:12.5px;line-height:1.3}}' +
  '@media print{.ts1057-rule .ts1057-full{display:block!important}.ts1057-rule .ts1057-more{display:none!important}}' +"""

# ---------------------------------------------------------------- (b) the delivery orders: off the Timeline, folded on Demob
ORDERS_TL_OLD = " const tl = D.getElementById('pane-timeline'); if (tl && !tl.querySelector('.seq1054-all')) { const head = tl.querySelector('.dplate') || tl.firstElementChild; if (head) head.insertAdjacentHTML('beforebegin', listCard()); }\n"
ORDERS_TL_NEW = " /* v10.57: the full list lives folded at the foot of Demob (orders1057), not on the Timeline */\n"
ORDERS_WATCH_OLD = "['drawer', 'pane-timeline'].forEach(id =>"
ORDERS_WATCH_NEW = "['drawer'].forEach(id =>"
ORDERS_EXPORT_OLD = "W.orders1054 = {GROUPS, CONSTRAINTS, groupsOf, rulesOf};"
ORDERS_EXPORT_NEW = "W.orders1054 = {GROUPS, CONSTRAINTS, groupsOf, rulesOf, chain};"

ORDERS_NEW = r'''</script>
<script id="orders1057-script">/* Author: Andrew Fisher. v10.57 - the locked delivery orders leave the Build tab: the full list is folded at the foot of Demob; each building's drawer keeps its own. */
(function(W){
 'use strict';
 const D = W.document, O = W.orders1054; if (!O || !Array.isArray(O.GROUPS) || typeof O.chain !== 'function') return;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const refOf = s => String(s).split(' ')[0];
 const refs = new Set(); O.GROUPS.forEach(g => g.seq.forEach(s => refs.add(refOf(s))));
 let open = false; /* closed until opened; a pick-up-day tap or a redraw keeps it as it was */
 function html(){
  const rules = (O.CONSTRAINTS || []).length;
  const body = O.GROUPS.map(g => '<p class="c1054"><b>Day ' + g.n + '</b> ' + O.chain(g, '') + (g.rule ? ' <span class="w1054">' + e(g.rule) + '</span>' : '') + '</p>').join('') +
   (O.CONSTRAINTS || []).map(c => '<p class="r1054">⚠ ' + e(c.rule) + '.</p>').join('') +
   '<p class="w1054">Set by the project manager, 17 Oct 2026. Kept in the page: changed only by a page release. Each building\'s drawer shows its place in its order.</p>';
  return '<details class="refresh-fold orders1057" data-refresh-fold="delivery-orders"' + (open ? ' open' : '') + '><summary><b>Delivery orders · locked</b><span>' + O.GROUPS.length + ' days · ' + refs.size + ' references in the exact order to keep' + (rules ? ' · ' + rules + ' rule' + (rules === 1 ? '' : 's') : '') + '</span></summary><div class="seq1054 orders1057-body">' + body + '</div></details>';
 }
 function paint(){
  const pane = D.getElementById('pane-demob'); if (!pane || !pane.querySelector(':scope > .dm816, :scope > .asm816') || pane.querySelector(':scope > .orders1057')) return;
  const asm = pane.querySelector(':scope > .asm816');
  if (asm) asm.insertAdjacentHTML('beforebegin', html()); else pane.insertAdjacentHTML('beforeend', html());
  const d = pane.querySelector(':scope > .orders1057'); if (d) d.addEventListener('toggle', () => { if (!d.dataset.previewPrint) open = d.open; });
 }
 if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function(){ const v = before.apply(this, arguments); try { paint(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }
 const watch = () => { const pn = D.getElementById('pane-demob'); if (pn && !pn.__orders1057) { pn.__orders1057 = true; new MutationObserver(() => { try { paint(); } catch (x) {} }).observe(pn, {childList: true}); } try { paint(); } catch (x) {} };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else watch();
 const st = D.createElement('style'); st.id = 'orders1057-style';
 st.textContent = '#pane-demob > .orders1057 .orders1057-body{padding:2px 0 4px}';
 D.head.appendChild(st);
 W.orders1057 = {paint, html};
})(window);
</script>
</body>
</html>'''

PATCHES = [
    ('twin-steer banner: shorter words, phrases kept whole', BANNER_WORDS_OLD, BANNER_WORDS_NEW),
    ('twin-steer banner: above the header shading, legible', BANNER_CSS_OLD, BANNER_CSS_NEW),
    ('Timeline twin-steer rule: one red line, full rule behind More', RULECARD_OLD, RULECARD_NEW),
    ('Timeline twin-steer rule: style under its own class', RULECARD_CSS_OLD, RULECARD_CSS_NEW),
    ('delivery orders: no list on the Timeline', ORDERS_TL_OLD, ORDERS_TL_NEW),
    ('delivery orders: the Timeline is no longer watched', ORDERS_WATCH_OLD, ORDERS_WATCH_NEW),
    ('delivery orders: share the order chips', ORDERS_EXPORT_OLD, ORDERS_EXPORT_NEW),
    ('delivery orders folded at the foot of Demob', END, ORDERS_NEW),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'orders1057-script' in t: sys.exit('part1_banner_orders refuses a repeat')
    if 'daycards1056-script' not in t: sys.exit('part1_banner_orders needs the v10.56 page (daycards1056-script not found)')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part1_banner_orders applied: legible twin-steer banner; delivery orders folded on Demob; Timeline rule one line')
