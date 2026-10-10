# Life Saving Rule outline icons

Author: Andrew Fisher

READY TO UPLOAD — all final checks pass. Not yet live.

Andrew requested the supplied Coates icon family in neon orange with pulsation, then clarified: “No only outline. Not full orange”.

Build cards and their More info panels use orange linework with transparent spaces and a soft pulse. Original matching drawings are sourced from [Coates Safety](https://careers.coates.com.au/content/Safety/?locale=en_GB); original PNGs and their hashes are retained in `sources.json`. Rendering removes the coloured disc and retains only the linework and circular outline. No solid badge background is added.

The six official Life Saving Rules, wording and daily rotation remain unchanged. Risk Assessment, Training and Competency, and Fit for Work use their matching artwork. Broad categories retain a neutral outlined shield rather than suggesting a narrower rule. All ten supplied topic symbols are available through the shared renderer.

Animation pauses offscreen, when folded, when leaving Build, with the page hidden, with Motion Off, during printing and for reduced motion. Native pre-start, driver and installation sheets use static outline symbols. The print colour follows the white form or dark card background.

No operational or financial data changes. Exact source reversal proves all other page bytes are preserved; focused browser checks verify native records and the P&L remain unchanged during use. Screenshots and operational captures remain private.

Base v9.88 SHA256 `40dc8f6c66079d8910ef5eaa3dd6e98a80b778960f70659d5c2447676d1c6175`.
Candidate SHA256 `4773efd9433b7bf50b824f1c4f3966bfa4e009b99bbd2231ffa0a2c1f35612bf`: 14,721,174 bytes; 75 inline scripts.

Build with `toolchain/build.sh v9.89 v9.89_life_saving_icons_DRAFT/patch_v989.py` from the exact base. Focused checks are in `tests/icons989.cjs`; run with PAGE, BASE_PAGE, EXPECTED_SHA and OUTDIR, under the shared browser lock. Set MOB=1 for phone. Set PUBLIC=1 and omit PAGE to verify actually served HTML. The existing navigation sweep in `v9.80_showcase_sound_LIVE/tests/navigation980.cjs` checks all routes, seven deep links and Back on both sizes.

Source `f4fb3b6d`. Focused desktop46/phone46 checks pass, including source artwork hashes, all six native daily mappings, transparency on black/white, pause/reduced-motion lifecycle and three native A4 documents. Desktop/phone navigation each passes22routes, seven deep links and Back with zero errors. Map navigation uses explicit local tile fixtures; it is not a new map-imagery audit. Native records and P&L unchanged during focused checks; whole-source preservation proves financial logic and embedded data untouched. Phone and print screenshots inspected. Guarded upload access check passes.
