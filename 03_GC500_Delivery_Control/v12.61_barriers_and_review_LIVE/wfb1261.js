<script id="wfb1261-script">
/* Author: Andrew Fisher. v12.61 - the water barriers where the K sheets put them.

   Andrew, 30 Oct 2026 01:50: "Your water barriers look all wrong. All locations look all wrong. Nothing matches
   correctly." No WB reference has a pin, so every surface fell back to an area-level point taken from a label on the
   master plan (WB16 at the Commodore Park label, WB03, WB18 and WB20 on the one Turn 2 marker, WB17 on the T6-T9
   markers) or to a guess from the description words (WB01, WB05, WB06). The customer's water barrier drawings
   K220-K231 (iEDM, rev 02, on the page's Documents tab) draw every Coates run: the yellow pieces were read off each
   zone sheet, the sheet registered to the K220 master by their shared labels, the master to the site frame by the runs
   it shares with the page's traced shapes, and the frame to the ground by the page's own georeference. WFB1261 below
   is that reading: one record per reference, with its zone, sheet, programme location and the run polylines.

   What reads it: the one destination (dest782) for every WB reference, so Navigate, the Build cards' map strip, the
   Demob cards' pictures, Find it on the map and the finder all point at the drawn run (a pin or a spot somebody put
   on the map still wins, as always); the master plan's own point for the Demob cards' plan piece; and the explorer's
   barrier shapes, rebuilt from the same runs by the release patch. Nothing on the record changes. */
(function (W) {
'use strict';
const WFB1261 = __WFB1261_DATA__;
W.WFB1261 = Object.freeze(WFB1261);
/* v12.61: the Build tab's last build day carries the whole build to the race-weekend cut-off (v11.35 stops the tab
   at 22 Oct 2026; v11.63 measures the build to Fri 23 Oct 2026) */
W.LAST_BUILD_DAY1261 = Object.freeze({day: '2026-10-22', cutoff: '2026-10-23'});
const llText = ll => ll[0].toFixed(6) + ', ' + ll[1].toFixed(6);
function record(key) { const r = WFB1261[key]; return r && Array.isArray(r.ll) && Number.isFinite(r.ll[0]) && Number.isFinite(r.ll[1]) ? r : null; }
function words(r) {
  const zone = r.zone && r.zone !== 'n/a' ? 'zone ' + r.zone + ': ' : '';
  return {zone, sheet: r.sheet ? 'water barrier drawing ' + r.sheet : 'the water barrier programme'};
}
/* 1. the one destination: the drawn run beats the label point and the description guess */
const dest0 = typeof dest782 === 'function' ? dest782 : null;
if (dest0) {
  const wrapped = function (a) {
    const r = a && record(a.key);
    if (r) {
      let nt = null; try { nt = navTargetFor(a); } catch (e) { nt = null; }
      /* a pin somebody took on site, Andrew's own pin or a spot placed from outside still wins; a master-plan point does not (it is this run) */
      if (!(nt && (nt.andrew || nt.placed || (nt.pinned && !(nt.fix && nt.fix.master))))) {
        const w = words(r);
        return {kind: 'drawn', ll: {lat: r.ll[0], lon: r.ll[1], text: llText(r.ll)}, a, approx: !r.sheet, label: 'drawing',
          sms: 'where ' + w.sheet + ' puts it (' + w.zone + r.where + ')',
          spoken: 'to the spot ' + w.sheet + ' puts it for',
          nav: 'where ' + w.sheet + ' puts ' + a.key + ' - ' + w.zone + r.where};
      }
    }
    return dest0.apply(this, arguments);
  };
  Object.assign(wrapped, dest0);
  W.dest782 = wrapped; try { dest782 = wrapped; } catch (x) {}
}
/* 2. the master plan's own point for each drawn run, so the Demob cards' plan piece and the plan views sit on the run */
function masterPoint(ll) {
  try {
    const d1 = (DATA.sheets || []).find(s => s.key === 'D001'), fit = d1 && typeof sheetFitOf === 'function' ? sheetFitOf(d1) : null;
    const fr = fit && fit.fx && fit.fy && typeof frameOf === 'function' ? frameOf(ll[0], ll[1]) : null; if (!fr) return null;
    const fx = fit.fx.k * fr.ax + fit.fx.c, fy = fit.fy.k * fr.ay + fit.fy.c;
    return fx > 0.002 && fx < 0.998 && fy > 0.002 && fy < 0.998 ? [fx, fy] : null;
  } catch (e) { return null; }
}
let placed = 0;
function placeMaster() {
  if (placed || typeof MASTER_LOC !== 'object' || !MASTER_LOC) return placed;
  for (const [key, r] of Object.entries(WFB1261)) {
    if (!r.sheet || !r.runs || !r.runs.length) continue;
    const pt = masterPoint(r.ll); if (!pt) continue;
    const w = words(r);
    MASTER_LOC[key] = Object.assign({}, MASTER_LOC[key] || {}, {ll: [r.ll[0], r.ll[1]], pt, prec: 'unit', how: w.sheet + ' (' + w.zone + r.where + ')', near: undefined, sec: undefined});
    placed++;
  }
  return placed;
}
try { placeMaster(); } catch (e) {}
W.WaterBarriers1261 = Object.freeze({record, placeMaster, get placed() { return placed; }, release: 'v12.61'});
})(window);
</script>
