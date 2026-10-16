"""Author: Andrew Fisher. v10.54 - delivery orders locked on every building, and two display fixes from the site-truth
audit (Andrew, 17 Oct 2026: "This day this order p63 then p62 then p60. Must be on this exact sequence" ... "These need
to locked in with theirs order for future records").

- Each building in one of Andrew's day groups shows a "Delivery order · locked" card in its drawer, with the group in
  order and this building marked. The Timeline lists all of them. 11 groups so far, plus one rule: WC17's two toilet
  blocks go in before P36 and P10, the day before. The orders live in the page itself, so nothing on site can change
  them; a new or changed order comes in a page release.
- Baseplan 9968862 line 93 (1189410) is joined to HRP, by the number recorded on site. The 15 Oct export's docket
  label had joined it to P36. This is display only; the revenue already sat with HRP.
- Andrew's photos taken against his own unit records (P65 and P66, 14 Oct) attach to the building again. The 15 Oct
  fill set those records aside as duplicates of the Baseplan rows, which left the photos with no unit. This is display
  only; nothing in the record changes.

Footer v10.53 -> v10.54.

    python3 patch_v1054.py path/to/page.html   (on the v10.53 page)
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SEQ = json.load(open(HERE.parent / 'sequences_17Oct2026' / 'sequences.json'))
GROUPS = [{'n': g['n'], 'seq': g['sequence'], 'rule': g.get('rule', ''), 'when': g.get('delivered', '')} for g in SEQ['groups']]
CONSTRAINTS = [{'rule': c['rule'], 'refs': c['refs']} for c in SEQ.get('constraints', [])]

END = "</script>\n</body>\n</html>"

NEW = r'''</script>
<script id="orders1054-script">/* Author: Andrew Fisher. v10.54 - delivery orders locked on every building; line 93 joined to HRP; Andrew's unit photos re-attach. */
(function(W){
 'use strict';
 const D = W.document;
 const GROUPS = __GROUPS__, CONSTRAINTS = __CONSTRAINTS__;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const refOf = s => String(s).split(' ')[0];
 const groupsOf = ref => GROUPS.filter(g => g.seq.some(s => refOf(s) === ref));
 const rulesOf = ref => CONSTRAINTS.filter(c => c.refs.includes(ref));
 const N = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
 function chain(g, ref){ return g.seq.map((s, i) => '<span class="o1054' + (refOf(s) === ref ? ' me' : '') + '">' + (N[i] || (i + 1) + '.') + ' ' + e(s) + '</span>').join('<span class="a1054">→</span>'); }
 function card(ref){
  const gs = groupsOf(ref), rs = rulesOf(ref); if (!gs.length && !rs.length) return '';
  return '<section class="card hubcard nosfold seq1054" data-seq1054="' + e(ref) + '"><div class="hubtitle"><h3>Delivery order · locked</h3><span class="chip">🔒 for future records</span></div>' +
   gs.map(g => { const i = g.seq.findIndex(s => refOf(s) === ref); return '<p class="c1054">' + chain(g, ref) + '</p><p class="w1054">' + e(ref) + ' is ' + (i + 1) + ' of ' + g.seq.length + ' — keep this exact order.' + (g.rule ? ' ' + e(g.rule) + '.' : '') + '</p>'; }).join('') +
   rs.map(c => '<p class="r1054">⚠ ' + e(c.rule) + '.</p>').join('') + '</section>';
 }
 function listCard(){
  return '<section class="card nosfold seq1054 seq1054-all"><div class="hubtitle"><h3>Delivery orders to keep · locked</h3><span class="chip">' + GROUPS.length + ' days</span></div>' +
   GROUPS.map(g => '<p class="c1054"><b>Day ' + g.n + '</b> ' + chain(g, '') + (g.rule ? ' <span class="w1054">' + e(g.rule) + '</span>' : '') + '</p>').join('') +
   CONSTRAINTS.map(c => '<p class="r1054">⚠ ' + e(c.rule) + '.</p>').join('') + '<p class="w1054">Set by Andrew Fisher, 17 Oct 2026. Kept in the page: changed only by a page release.</p></section>';
 }
 function paint(){
  const dr = D.getElementById('drawer');
  if (dr && dr.classList.contains('on')) { const cmp = dr.querySelector('.cmp816'); const k = cmp && ((cmp.querySelector('[data-light]') || {}).dataset || {}).light;
   if (cmp && k && !dr.querySelector('.seq1054[data-seq1054="' + k + '"]')) { dr.querySelectorAll('.seq1054').forEach(x => x.remove()); const h = card(k); if (h) cmp.insertAdjacentHTML('afterend', h); } }
  const tl = D.getElementById('pane-timeline'); if (tl && !tl.querySelector('.seq1054-all')) { const head = tl.querySelector('.dplate') || tl.firstElementChild; if (head) head.insertAdjacentHTML('beforebegin', listCard()); }
 }
 let q = false; const run = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; try { paint(); } catch (x) {} }); };
 const watch = () => { ['drawer', 'pane-timeline'].forEach(id => { const n = D.getElementById(id); if (n && !n.__seq1054) { n.__seq1054 = true; new MutationObserver(run).observe(n, {childList: true, subtree: true}); } }); run(); };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else watch();
 /* Baseplan 9968862 line 93 (1189410) joins HRP, by the number recorded on site (Andrew, 17 Oct 2026) */
 const rekey = r => { if (r && String(r.rental_contract) === '9968862' && Number(r.line) === 93 && r.match && r.match.key === 'P36') { r.match.key = 'HRP'; r.match.state = 'settled by the asset number recorded on site'; r.match.via = 'asset number recorded on site'; r.match.basis = '1189410 is on HRP by Andrew\'s site record (loading sheet 10 Oct, photos 18 and 25 Sep); docket 26085104 labels it P36 - on the branch list. 17 Oct 2026.'; } };
 try { (DATA.rental_on_hire || []).forEach(rekey); } catch (x) {} try { (ONHIRE_ROWS || []).forEach(rekey); } catch (x) {}
 /* Andrew's photos against his own unit record attach to the building's row for the same number */
 if (W.Units925 && typeof W.Units925.photos === 'function') {
  const before = W.Units925.photos;
  const slotOf = p => { try { const v = JSON.parse(String(p.unit || '')); const s = Array.isArray(v) && v.find(x => /^slot:/.test(String(x))); return s ? String(s).slice(5) : ''; } catch (x) { return ''; } };
  const rec = id => { const L = (typeof S !== 'undefined' && S.loads) || {}; return L['unit925/' + id] || L['unit925~2f~' + id] || null; };
  W.Units925.photos = function(u, rows, photos){
   const out = before.apply(this, arguments) || [];
   try { if (!u || !u.assetNo || !Array.isArray(photos)) return out; const have = new Set(out.map(p => p.id));
    photos.forEach(p => { if (have.has(p.id)) return; const id = slotOf(p); if (!id) return; const r = rec(id); if (r && r.active === false && String(r.assetNo) === String(u.assetNo) && r.ref === u.ref && !(rows || []).some(x => x.id === id && x.active !== false)) { out.push(p); have.add(p.id); } }); } catch (x) {}
   return out; };
 }
 const st = D.createElement('style'); st.id = 'orders1054-style';
 st.textContent = '.seq1054 .c1054{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:6px 0}.seq1054 .o1054{border:1px solid var(--line,#ccc);border-radius:999px;padding:2px 9px;font-weight:600;white-space:nowrap}' +
  '.seq1054 .o1054.me{background:#e8641b;color:#fff;border-color:#e8641b}.seq1054 .a1054{color:var(--mute,#667)}.seq1054 .w1054{color:var(--mute,#667);font-size:.9em;margin:2px 0 8px}.seq1054 .r1054{color:#8e1c12;font-weight:600}' +
  '@media (prefers-color-scheme:dark){.seq1054 .r1054{color:#f4aaa2}}';
 D.head.appendChild(st);
 W.orders1054 = {GROUPS, CONSTRAINTS, groupsOf, rulesOf};
})(window);
</script>
</body>
</html>'''.replace('__GROUPS__', json.dumps(GROUPS, ensure_ascii=False)).replace('__CONSTRAINTS__', json.dumps(CONSTRAINTS, ensure_ascii=False))

PATCHES = [
    ('delivery orders script at the end of the page', END, NEW),
    ('Release footer', "+ ' · v10.53'", "+ ' · v10.54'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'orders1054-script' in t: sys.exit('patch_v1054 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1054 applied: %d delivery orders locked, line 93 joined to HRP, unit photos re-attach; footer v10.53 -> v10.54' % len(GROUPS))
