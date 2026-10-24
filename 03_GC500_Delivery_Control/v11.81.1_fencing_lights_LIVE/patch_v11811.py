"""Author: Andrew Fisher. v11.81.1 - the fencing card's five lights go green when the build is complete.

Andrew, 24 Oct 2026, with a photo of the Today fencing card on v11.81 (100%, four red lights, the fifth dark): "Fix".
The card was written to light at most four red lights ("this is not a physical completion sign-off"). v11.81 closed the build at
the docket numbers on the project manager's ruling of 24 Oct 2026, so at race weekend the reading is a completion: 100%, one
figure, not provisional, scope complete. On exactly that reading the card now lights all five green, as every other finished
area does, and says why. Any other reading keeps the red milestone lights.

1. fenceOverall853 (outermost wrapper, after v11.81's script): a ready, 100%/100%, scope-complete, not provisional reading at or
   after race weekend under the v11.81 ruling carries allGreen and buildComplete1181.
2. overallFencingCard853: on that reading the lights are 'confirmed' (five green), the panel is data-complete, the caption and the
   label name the ruling.
3. Footer v11.81 -> v11.81.1. No record, broadcast, servicing, crew-card bundle, tracker or printed-code change.

    python3 patch_v11811.py page.html      (in place, on the live v11.81 page)
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
FOOT_OLD = "+' · v11.81'; /* v8.19 release922"
FOOT_NEW = "+' · v11.81.1'; /* v8.19 release922"
BLOCK = r"""<script id="lights11811-script">
/* Author: Andrew Fisher. v11.81.1 - a fencing reading the v11.81 ruling completes is a completion: all five lights green. */
(function (W) {
 'use strict';
 const R = W.FENCE_BUILD_CLOSED1181, base = W.fenceOverall853;
 if (!R || typeof base !== 'function' || base.lights11811) return;
 const isDay = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
 const day = d => { let x = isDay(d) ? d : (typeof state !== 'undefined' && state && isDay(state.asOf) ? state.asOf : todayIso()); return typeof W.rwDay1163 === 'function' ? W.rwDay1163(x) : x; };
 const f = function (asOf) {
  const r = base.apply(this, arguments);
  try {
   if (r && r.state === 'ready' && r.pct && r.pct.min === 100 && r.pct.max === 100 && r.scopeComplete1012 === true && !r.provisional && !r.classificationPending && day(asOf) >= R.at) {
    r.allGreen = true; r.buildComplete1181 = R;
   }
  } catch (e) {}
  return r;
 };
 f.lights11811 = true; W.fenceOverall853 = f;
})(window);
</script>
"""
SWAPS = [
 ("const qualifier = model?.state === 'loading' ? 'Loading record' : !known ? 'Overall percentage unconfirmed' : model.provisional ? 'Provisional programme' : 'Current programme';",
  "const done11811 = !!(known && model.allGreen && model.buildComplete1181);\n    const qualifier = model?.state === 'loading' ? 'Loading record' : !known ? 'Overall percentage unconfirmed' : done11811 ? 'Build complete at the docket numbers' : model.provisional ? 'Provisional programme' : 'Current programme';"),
 ("const lampLabel = known ? overallRange853(model.pct,'%') + ' programme work metres recorded. Red lights show reached work milestones; this is not a physical completion sign-off.' : 'Overall programme percentage unconfirmed.';",
  "const lampLabel = done11811 ? '100% programme work metres recorded. All five lights green: the build is complete at the docket numbers (the project manager, 24 Oct 2026).' : known ? overallRange853(model.pct,'%') + ' programme work metres recorded. Red lights show reached work milestones; this is not a physical completion sign-off.' : 'Overall programme percentage unconfirmed.';"),
 ("const lamps = raceLights846(pct, 'recorded-work').replace(",
  "const lamps = raceLights846(pct, done11811 ? 'confirmed' : 'recorded-work').replace("),
 ("""return '<div class="tw846-summary tw853-overall" data-tw853-overall><section class="tw846-display" data-complete="false" data-known="' + String(!!known) + '">'""",
  """return '<div class="tw846-summary tw853-overall" data-tw853-overall><section class="tw846-display" data-complete="' + String(done11811) + '" data-known="' + String(!!known) + '">'"""),
]


def patch(text):
    if text.count(FOOT_OLD) != 1: raise ValueError('v11.81.1 is built on the live v11.81 page')
    if 'id="lights11811-script"' in text: raise ValueError('v11.81.1 already applied')
    if 'id="complete1181-script"' not in text: raise ValueError('v11.81 is not on this page')
    for a, b in SWAPS: text = rep(text, a, b, 'fencing card: ' + a[:40], 'page')
    text = rep(text, '<script id="steady1143-script">', BLOCK + '<script id="steady1143-script">', 'lights block before steady1143', 'page')
    if not (text.index('id="complete1181-script"') < text.index('id="lights11811-script"')): raise ValueError('the lights block must follow v11.81')
    text = rep(text, FOOT_OLD, FOOT_NEW, 'release footer', 'page')
    for needle, n in [(FOOT_NEW, 1), ('done11811', 5), ('id="lights11811-script"', 1)]:
        if text.count(needle) != n: raise ValueError('v11.81.1 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    print('v11.81.1: the fencing card lights five green on a completed reading; footer -> v11.81.1')
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
