"""Author: Andrew Fisher. v10.55 - site vs Baseplan: Andrew's number stands, the Baseplan line still charges, and the
difference shows until the two are aligned (Andrew, 17 Oct 2026: "It stays 1097453 my data is truth.. We use baseplan to
understand missing gaps and understand how they charge. End of the day we want things to both align. But this will take
some work").

- A building whose site number differs from the Baseplan line matched to it keeps that line's hire. Before this, the
  page dropped the hire when the numbers did not match. P06 is the case today: site 1097453, Baseplan 9968862 line 64
  1087453, $1,426.07. Each unit on a reference is charged one line at most. A line whose number Andrew recorded on
  another reference is never borrowed.
- The drawer shows the difference: "Site 1097453 · Baseplan 1087453 (9968862 line 64) — charged on the Baseplan line;
  to align with the branch."
- Costs gets a "Site vs Baseplan · to align" card listing every such difference, so the work to bring the two together
  has one list.

No record change. Footer v10.54 -> v10.55.

    python3 patch_v1055.py path/to/page.html   (on the v10.54 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

NEW = r'''</script>
<script id="align1055-script">/* Author: Andrew Fisher. v10.55 - site vs Baseplan: the site number stands, the matched Baseplan line still charges, the difference shows. */
(function(W){
 'use strict';
 const D = W.document;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const norm = x => String(x || '').trim().toLowerCase();
 const money = v => { try { return W.money(v); } catch (x) { return '$' + Number(v || 0).toFixed(2); } };
 const DIFFS = new Map(); /* ref -> [{site, baseplan, contract, line, rate}] */
 function siteNumbersElsewhere(ref){ const out = new Set(); try { for (const a of allAssets()) { if (a.key === ref || a._cancelled) continue; (assetNumbersOf(a) || []).forEach(n => out.add(String(n))); } } catch (x) {} return out; }
 let ELSE = null, ELSE_AT = 0; const elsewhere = ref => { const now = Date.now(); if (!ELSE || now - ELSE_AT > 4000) { ELSE = new Map(); ELSE_AT = now; } if (!ELSE.has(ref)) ELSE.set(ref, siteNumbersElsewhere(ref)); return ELSE.get(ref); };
 if (W.ItemIdentity979 && typeof W.ItemIdentity979.select === 'function') {
  const before = W.ItemIdentity979.select;
  W.ItemIdentity979.select = function(ref, item, contracts, current){
   const out = before.apply(this, arguments) || [];
   try {
    const phys = (current || []).filter(u => u.physical && u.active !== false && norm(u.item) === norm(item) && norm(u.owner) === 'coates');
    const nums = phys.map(u => String(u.assetNo || '').trim()).filter(Boolean);
    if (!nums.length || out.length >= phys.length) return out;
    const taken = new Set(out.map(r => String(r.asset_no || '').trim())), other = elsewhere(ref);
    const cands = (contracts || []).filter(r => !r.charge_line && r.asset_no_is_plant_number && r.match && r.match.to === 'asset' && r.match.key === ref && norm(r.register_type) === norm(item) && norm(r.status_as_written) === 'delivered'
      && !nums.includes(String(r.asset_no || '').trim()) && !taken.has(String(r.asset_no || '').trim()) && !other.has(String(r.asset_no || '').trim()));
    const free = nums.filter(n => !out.some(r => String(r.asset_no || '').trim() === n));
    const add = cands.slice(0, Math.max(0, phys.length - out.length));
    add.forEach((r, i) => { const site = free[i] || nums[0]; out.push(Object.assign({}, r, {register_type: item, match: Object.assign({}, r.match, {key: ref}), siteNumber1055: site}));
     const list = DIFFS.get(ref) || []; if (!list.some(d => d.contract === String(r.rental_contract) && d.line === String(r.line))) list.push({site, baseplan: String(r.asset_no), contract: String(r.rental_contract), line: String(r.line), rate: r.rate_1, item}); DIFFS.set(ref, list); });
   } catch (x) {}
   return out;
  };
 }
 const sentence = (ref, d) => 'Site ' + d.site + ' · Baseplan ' + d.baseplan + ' (' + d.contract + ' line ' + d.line + (d.rate != null ? ', ' + money(d.rate) : '') + ') — charged on the Baseplan line; to align with the branch.';
 function scan(){ try { holdAssets(() => { for (const a of allAssets()) { if (a._cancelled || a.discipline !== 'Portable buildings') continue; const m = gcModel925(a); for (const l of chargeLines(a) || []) { if (l.item) W.ItemIdentity979.select(a.key, l.item, ONHIRE_ROWS, m.rows); } } }); } catch (x) {} return DIFFS; }
 function drawer(){
  const dr = D.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return;
  const cmp = dr.querySelector('.cmp816'); const k = cmp && ((cmp.querySelector('[data-light]') || {}).dataset || {}).light; if (!k) return;
  if (dr.querySelector('.align1055[data-align1055="' + k + '"]')) return; dr.querySelectorAll('.align1055').forEach(x => x.remove());
  if (!DIFFS.has(k)) { try { const a = assetOf(k), m = gcModel925(a); (chargeLines(a) || []).forEach(l => { if (l.item) W.ItemIdentity979.select(k, l.item, ONHIRE_ROWS, m.rows); }); } catch (x) {} }
  const ds = DIFFS.get(k); if (!ds || !ds.length) return;
  const anchor = dr.querySelector('.seq1054') || cmp;
  anchor.insertAdjacentHTML('afterend', '<section class="card hubcard nosfold align1055" data-align1055="' + e(k) + '"><div class="hubtitle"><h3>Site vs Baseplan</h3><span class="chip warn">to align</span></div>' + ds.map(d => '<p>' + e(sentence(k, d)) + '</p>').join('') + '<p class="w1055">Your site number stands. Baseplan shows how the branch charges it.</p></section>');
 }
 function costs(){
  const pane = D.getElementById('pane-costs'); if (!pane || pane.querySelector('#align1055')) return;
  const all = [...scan().entries()]; const total = all.reduce((n, [, ds]) => n + ds.reduce((m, d) => m + (Number(d.rate) || 0), 0), 0);
  const html = '<section class="card align1055" id="align1055"><div class="hubtitle"><h3>Site vs Baseplan · to align</h3><span class="chip ' + (all.length ? 'warn' : 'ok') + '">' + all.length + '</span></div>' +
   (all.length ? '<ul>' + all.map(([k, ds]) => ds.map(d => '<li><b>' + e(k) + '</b> · ' + e(sentence(k, d)) + '</li>').join('')).join('') + '</ul><p class="w1055">' + all.length + ' building' + (all.length === 1 ? '' : 's') + ', ' + e(money(total)) + ' of hire charged on Baseplan lines whose number differs from the site. Andrew\'s site numbers stand; Baseplan is how the branch charges. Bring the two together with the branch.</p>'
    : '<p class="w1055">Every building\'s site number matches its Baseplan line.</p>') + '</section>';
  const lock = pane.querySelector('#lock1049'); if (lock) lock.insertAdjacentHTML('afterend', html); else { const h = pane.querySelector('.panehead') || pane.querySelector('h2'); if (h) h.insertAdjacentHTML('afterend', html); else pane.insertAdjacentHTML('afterbegin', html); }
 }
 let q = false; const run = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; try { drawer(); costs(); } catch (x) {} }); };
 const watch = () => { ['drawer', 'pane-costs'].forEach(id => { const n = D.getElementById(id); if (n && !n.__align1055) { n.__align1055 = true; new MutationObserver(run).observe(n, {childList: true, subtree: true}); } }); run(); };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else watch();
 const st = D.createElement('style'); st.id = 'align1055-style';
 st.textContent = '.align1055{border-left:4px solid #c77700}.align1055 .w1055{color:var(--mute,#667);font-size:.9em}.align1055 ul{margin:6px 0;padding-left:18px}';
 D.head.appendChild(st);
 W.align1055 = {scan, DIFFS};
})(window);
</script>
</body>
</html>'''

PATCHES = [
    ('site vs Baseplan script at the end of the page', END, NEW),
    ('Release footer', "+ ' · v10.54'", "+ ' · v10.55'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'align1055-script' in t: sys.exit('patch_v1055 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1055 applied: the site number stands, the matched Baseplan line still charges, the difference shows; footer v10.54 -> v10.55')
