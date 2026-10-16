"""Author: Andrew Fisher. v10.51 - the drawer, tidied (Andrew, 17 Oct 2026, on P09):

- "why are we adding photos for accessories. Makes no sense i never asked for this": the photograph places are the
  building's own (and each real unit inside a group, such as the FWFs in a toilet group). An accessory - the aircon,
  fridge or urn carried inside a building - gets no photograph places, in the drawer's photo section, in its "Which
  unit" choice or on its card in the units list. A photograph already recorded against an accessory still shows
  (none are recorded today: 28 accessory units on 16 references, no photographs).
- "Lets fix up the ticks we should not mention things twice": Complete it showed LEVELLED and LEVEL, STEPS and STEPS.
  One row each now: the charged row (LEVEL, STEPS) carries the date it was done, and its tick already sets the
  levelled or steps record with it. Where the record and the charge tick disagree, both rows stay so nothing recorded
  is hidden.

No record, rate or charge changes. Footer v10.50 -> v10.51.

    python3 patch_v1051.py path/to/page.html   (on the v10.50 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

NEW = r'''</script>
<script id="tidy1051-script">/* Author: Andrew Fisher. v10.51 - drawer tidy: no photograph places for accessories; one tick row per job. */
(function(W){
 'use strict';
 const ACC = /^(air ?con(ditioner)?|aircon|fridge|refrigerator|urn|microwave|heater|kettle|fire ?ext)/i;
 function photosOn(key, u){ try { return dropPhotosOf(key).some(p => String(p.unit || '') === String(u)); } catch (e) { return false; } }
 /* an accessory unit: carried inside the reference, known by an accessory's asset number or type, never one of the
    reference's own numbers */
 function accessoryRow1051(a, row){
  if (!a || !row) return false;
  const no = String(row.assetNo || '');
  let own = []; try { own = (buildingNumbersOf(a) || []).map(String); } catch (e) {}
  if (no && own.includes(no)) return false;
  const acc = a.accessories || [];
  if (no && acc.some(x => String(x.asset_no || '') === no)) return true;
  return ACC.test(String(row.item || row.label || '')) && acc.some(x => ACC.test(String(x.type || '')));
 }
 function rowsOf(a){ try { const m = gcModel925(a); return (m && m.rows) || []; } catch (e) { return []; } }
 if (typeof dropPhotoUnits === 'function') {
  const previous = dropPhotoUnits;
  dropPhotoUnits = function (a) {
   const units = previous.apply(this, arguments) || [];
   const asset = typeof a === 'string' ? assetOf(a) : a; if (!asset) return units;
   const rows = rowsOf(asset);
   return units.filter(u => { const row = rows.find(x => x.id === u); return !(row && accessoryRow1051(asset, row)) || photosOn(asset.key, u); });
  };
 }
 if (W.Items933 && typeof W.Items933.cardPhotos === 'function') {
  const cp = W.Items933.cardPhotos;
  W.Items933.cardPhotos = function (a, u, model) {
   try { if (u && accessoryRow1051(a, u) && !photosOn(a.key, u.id)) return ''; } catch (e) {}
   return cp.apply(this, arguments);
  };
 }
 /* Complete it: the charged LEVEL / STEPS row stands for the job; the plain LEVELLED / STEPS row goes when they agree */
 const PAIRS = [['levelling', 'levelled', 'levelled_at'], ['steps', 'steps', 'steps_at']];
 function tidyTicks1051(){
  const dr = document.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return;
  const box = dr.querySelector('.cmp816 .hublights'); if (!box || !box.querySelector('.sym1033-row')) return;
  /* "1 of 1 ticked" says what the tick already says: a single job shows its dollars only; 2 of 3 stays */
  box.querySelectorAll('.sym1033-row > .w:not([data-tidy1051])').forEach(w => { w.dataset.tidy1051 = '1'; w.textContent = w.textContent.replace(/^[01] of 1 ticked(?: · )?/, ''); if (!w.textContent.trim()) w.remove(); });
  for (const [sym, attr, at] of PAIRS) {
   const charged = box.querySelector('.sym1033-row[data-sym1033="' + sym + '"]');
   const plain = box.querySelector('button.hl[data-' + attr + ']:not(.sym1033-row)');
   if (!charged || !plain) continue;
   const ref = charged.dataset.symref, onC = charged.getAttribute('aria-pressed') === 'true', onP = plain.getAttribute('aria-pressed') === 'true';
   if (onC !== onP) { if (!charged.querySelector('.tidy1051-note')) charged.insertAdjacentHTML('beforeend', ' <span class="w tidy1051-note">record and charge differ</span>'); continue; }
   plain.remove();
   if (onC && !charged.querySelector('.tidy1051-when')) {
    let when = ''; try { const d = deliveryOf(ref) || {}; when = d[at] ? fmtStamp(d[at]).slice(0, 6) : ''; } catch (e) {}
    const w = charged.querySelector(':scope > .w');
    if (when && w) w.insertAdjacentHTML('afterbegin', '<span class="tidy1051-when">' + esc(when) + '</span> · ');
    else if (when) charged.insertAdjacentHTML('beforeend', ' <span class="w tidy1051-when">' + esc(when) + '</span>');
   }
  }
 }
 let queued = false;
 const run = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; try { tidyTicks1051(); } catch (e) {} }); };
 const watch = () => { const dr = document.getElementById('drawer'); if (!dr || dr.__tidy1051) return; dr.__tidy1051 = true; new MutationObserver(run).observe(dr, {childList: true, subtree: true}); };
 watch(); document.addEventListener('DOMContentLoaded', watch);
 if (typeof W.openAsset === 'function') { const orig = W.openAsset; W.openAsset = function () { const r = orig.apply(this, arguments); try { watch(); run(); setTimeout(run, 600); setTimeout(run, 1200); } catch (e) {} return r; }; }
 W.tidy1051 = {accessoryRow: accessoryRow1051, ticks: tidyTicks1051};
})(window);
</script>
</body>
</html>'''

PATCHES = [
    ('drawer tidy script at the end of the page', END, NEW),
    ('Release footer', "+ ' · v10.50'", "+ ' · v10.51'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1051 applied: no photograph places for accessories; one tick row per job; footer v10.50 -> v10.51')
