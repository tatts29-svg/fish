/* v8.97 completion on the maps START */
/* v8.97 - Author: Andrew Fisher. COMPLETION ON THE MAPS.
   Andrew, 8 Oct 2026: "Need to come up with a clean way to show completions on maps when we search for things example buildings.
   We still want to show but something to highlight completion keeping in reference to same look as how its highlighted."
   The Map explorer (machine set, explorer/) draws the accents: every result keeps its ring and label, a complete one gets a small
   static green tick on its ring and "✓ Complete" on its row and card. This page's part:
   - gc500CompleteKeys897: the verified completion the explorer asks for. A reference is complete only when the record's Complete
     tick is on AND the Timeline reads Finished (timeline841State stage 5, no review conflict). On site or installed alone is not
     complete; a Complete tick the Timeline holds for review ("Review required · Complete recorded") is not complete here either.
   - the finder's rows: an asset result that is complete says "✓ Complete" beside its delivery state, as the explorer's rows do.
   Nothing here changes a record. */
(function () {
  'use strict';
  if (typeof allAssets !== 'function' || typeof deliveryOf !== 'function' || typeof timeline841State !== 'function') return;
  function verified897(a) {
    try { if (!a || a._cancelled) return false; const d = deliveryOf(a.key); if (!d || !d.done) return false; const v = timeline841State(a); return !!v && v.stage === 5 && !v.conflict && !v.blocked; }
    catch (e) { return false; }
  }
  window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };
  window.gc500IsComplete897 = function (key) { try { const a = typeof assetOf === 'function' ? assetOf(key) : allAssets().find(x => x.key === key); return verified897(a); } catch (e) { return false; } };
  /* the finder: a complete asset row carries the same words the explorer's rows carry */
  if (typeof finderRow === 'function' && !finderRow.__v897) {
    const row0 = finderRow;
    finderRow = function (it, i) {
      let h = row0.apply(this, arguments);
      try {
        if (it && it.kind === 'asset' && window.gc500IsComplete897(it.key) && h.split('<span class="fik">').length === 2)
          h = h.replace('<span class="fik">', '<span class="fik ok897" title="Complete: recorded complete on the record and Finished on the Timeline">✓ Complete</span><span class="fik">');
      } catch (e) {}
      return h;
    };
    finderRow.__v897 = true;
  }
  window.gc500Map897 = true;
})();
/* v8.97 completion on the maps END */
