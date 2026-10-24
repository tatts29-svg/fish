/* Author: Andrew Fisher. v11.90 - the "areas at 100%" banner comes off the Today tab.
   Andrew, 24 Oct 2026, with a screenshot of the banner: "Need to remove this. We need to start cleaning this up and making all
   pages mpre ogranjsed now".
   The v10.26 banner (#ms1026) repeated the Milestones section further down Today (#ms1025: every area's summary, Print this
   summary (A4), Print all (A4), Celebrate again) and the 100% badges on the Work progress board's area cards. Those all stay;
   only the banner goes. The celebration code is untouched (Celebrate again still plays the fireworks over the area card).
   Writes nothing. */
(function (W) {
'use strict';
if (typeof document === 'undefined') return;
function drop() { var b = document.getElementById('ms1026'); if (b) b.remove(); }
var after = W.ms1026After;
if (typeof after === 'function' && !after.clean1190) {
  W.ms1026After = function () { var out = after.apply(this, arguments); drop(); return out; };
  W.ms1026After.clean1190 = true;
}
drop();
})(typeof window === 'object' ? window : {});
