"""Author: Andrew Fisher. v10.56 - the completed day cards carry the Coates on-time figure and what came in (Andrew,
17 Oct 2026: "I know we spoke about delivery info like a percentage. Those completed days cards would be a perfect place
to have it. Also in work recorded lets have the info of what came in and the description and qty").

- Each completed (past) Build day card gets a "COATES ON TIME" row: the day's on-time percentage out of 100%, with
  "INSIDE THE BOOKED WINDOW · n OF m" under it. The colours follow v10.48: green at 80% or more, amber 50-79%, red
  under 50%. The figures are the v10.48 delivery-text figures (sum1048), shown only on days with booked texts.
- Work recorded: the single "Arrived · n refs" line becomes one line per arrival, with the reference and its
  description on the left and the quantity and item on the right (e.g. "WC07 · Toilets - Merch Area · 20 FWF"). The
  card shows the first three; More info lists every arrival with its on-site time.

The record does not change. Footer v10.55 -> v10.56.

    python3 patch_v1056.py path/to/page.html   (on the v10.55 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

NEW = r'''</script>
<script id="daycards1056-script">/* Author: Andrew Fisher. v10.56 - completed day cards: Coates on time out of 100%, and what came in with description and quantity. */
(function(W){
 'use strict';
 const D = W.document;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const day = at => { try { return dayStampOf(at); } catch (x) { return String(at || '').slice(0, 10); } };
 const hhmm = at => { try { return new Date(at).toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); } catch (x) { return ''; } };
 /* what came in: one line per arrival, description and quantity */
 function cameIn(iso){
  let list = []; try { list = arrivalsOn(iso).filter(r => r && r.a && r.a.key && day(r.at) === iso); } catch (x) { return []; }
  const seen = new Set();
  return list.filter(r => !seen.has(r.a.key) && seen.add(r.a.key)).map(r => {
   const a = r.a; let lines = []; try { lines = (chargeLines(a) || []).filter(l => l.item); } catch (x) {}
   const qty = lines.map(l => { let q = null; try { q = qtyOf(l); } catch (x) {} return (q != null && q !== '' ? q + ' × ' : '') + l.item; });
   const desc = String(a.name || (lines[0] && lines[0].item) || '').trim();
   return {ref: a.key, desc, qty: qty.join(' · ') || '—', at: r.at};
  });
 }
 if (W.BuildWork986 && typeof W.BuildWork986.day === 'function') {
  const before = W.BuildWork986.day;
  W.BuildWork986.day = function(iso){
   const w = before.apply(this, arguments);
   try {
    if (!w || !Array.isArray(w.rows)) return w;
    const i = w.rows.findIndex(r => r && r.kind === 'arrival'); if (i < 0) return w;
    const items = cameIn(iso); if (!items.length) return w;
    const rows = items.map(x => ({label: x.ref + (x.desc ? ' · ' + x.desc : ''), value: x.qty, kind: 'arrival'}));
    const out = Object.assign({}, w, {rows: w.rows.slice(0, i).concat(rows, w.rows.slice(i + 1))});
    out.details = (w.details || []).filter(d => d.kind !== 'arrival').concat(items.map(x => ({kind: 'arrival', label: 'Came in: ' + x.ref + (x.desc ? ' · ' + x.desc : '') + ' · ' + x.qty, refs: [x.ref], source: 'On site ' + hhmm(x.at) + ' · quantity on the reference'})));
    return out;
   } catch (x) { return w; }
  };
 }
 /* Coates on time, out of 100%, on each completed day card */
 function paint(){
  if (typeof W.sum1048 !== 'function') return;
  D.querySelectorAll('#pane-timeline .day.past984[data-day]').forEach(card => {
   const iso = card.getAttribute('data-day'); if (!iso || card.querySelector('.ot1056')) return;
   let s = null; try { s = W.sum1048(iso); } catch (x) {} if (!s || s.pct == null || !s.booked) return;
   const load = card.querySelector('.bc984-load-row'); if (!load) return;
   const tone = s.pct >= 80 ? 'good' : s.pct >= 50 ? 'mid' : 'bad';
   load.insertAdjacentHTML('afterend', '<span class="bc984-load-row ot1056 ot1056-' + tone + '" title="Coates delivery texts: ' + s.inside + ' of ' + s.booked + ' inside the booked window"><span class="bc984-label">COATES ON TIME<span class="bc984-at-close">INSIDE THE BOOKED WINDOW · ' + s.inside + ' OF ' + s.booked + '</span></span><span class="bc984-load-count">' + s.pct + '<small>%</small></span></span>');
  });
 }
 let q = false; const run = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; try { paint(); } catch (x) {} }); };
 const watch = () => { const n = D.getElementById('pane-timeline'); if (n && !n.__ot1056) { n.__ot1056 = true; new MutationObserver(run).observe(n, {childList: true, subtree: true}); } run(); };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else watch();
 const st = D.createElement('style'); st.id = 'daycards1056-style';
 st.textContent = ':is(#pane-timeline) .ot1056 .bc984-load-count small{font-size:.55em;margin-left:2px}' +
  ':is(#pane-timeline) .ot1056-good .bc984-load-count{color:#7ee2a1}:is(#pane-timeline) .ot1056-mid .bc984-load-count{color:#ffc46b}:is(#pane-timeline) .ot1056-bad .bc984-load-count{color:#ff8a7a}';
 D.head.appendChild(st);
 W.daycards1056 = {cameIn, paint};
})(window);
</script>
</body>
</html>'''

PATCHES = [
    ('day cards script at the end of the page', END, NEW),
    ('Release footer', "+ ' · v10.55'", "+ ' · v10.56'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'daycards1056-script' in t: sys.exit('patch_v1056 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1056 applied: Coates on time on completed day cards; what came in with description and quantity; footer v10.55 -> v10.56')
