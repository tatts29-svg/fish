# Compact Build load cards — draft review

Author: Andrew Fisher.

This is an unmerged, undeployed review candidate. Further approval is required before merge or deployment.

Andrew approved compact dark load cards, stronger borders, glow and animated progress lights in the delegated request from thread `01a12526-76e6-750a-9393-466c046640f2`: “I want the cards to animate and glow”, “Make sure the lights animate. Border the cards better”, “Do it”.

The saved K2 branch was not used as the implementation base. The current shared branch is `codex/gc500-current-release-03oct`, reconciled tip `8cca51366bab2beba7a4decfd9b4bcff36925b30`. Its v9.88 staff release matches the actual public page byte for byte:

- Base SHA-256: `40dc8f6c66079d8910ef5eaa3dd6e98a80b778960f70659d5c2447676d1c6175` (14,630,539 bytes).
- Candidate SHA-256: pending final build below.
- Review branch: `codex/gc500-load-cards-989-review`.

Closed loads keep their load number, time or explicit No time, carrier, reference/name, destination source, actual status, and every existing Truck flow warning chip. Navigate and Details remain available. Details holds the existing QR, progress controls, nominal sizes/weights and their uncertainty/source notes, native delivery cards, photos, notes, loading controls, run-sheet action and Arrange loads. No filters or broader day-page rearrangement were added.

The existing orange rail now has an orange outline and dark bevel, open/focus glow and a brief tap sweep. Expansion uses a short transition through the native toggle. Only the current native Transit/Location/Installed lamp pulses; unknown, Off site and Finished remain steady, as do earlier reached stages. Motion honours the existing pause/offscreen/modal gates and reduced-motion preference. Controls retain 44px touch targets and keyboard focus.

The implementation moves existing DOM nodes and retains delegated action attributes and the native Arrange loads number hook. It does not write to shared records or change ordering, staff, costs, calculations, permissions, source evidence or the daily availability model. The existing Available staff/Edit availability and Truck flow remain in their original positions. The patch round-trip test proves every byte of the original page is retained except the draft footer version and the two added presentation blocks.

## Files

- `patch_v990.py`: exact-base, single-application patch using the shared replacement helper.
- `loadcards990.js`: compact presentation and native-toggle animation.
- `loadcards990.css`: scoped card styling and motion.
- `tests/patch990.py`: full original-page preservation and wrong-base/reapply rejection.
- `tests/browser990.cjs`: desktop/360px-phone interaction, warnings, motion and record-preservation checks.

## Reproduce

From `03_GC500_Delivery_Control`, install the shared toolchain dependencies and set `CHROMIUM_PATH` if needed. The browser harness substitutes only the candidate HTML and blocks operational writes. All checks use the public view, with browser-only fixtures where required.

```bash
npm ci --prefix toolchain
bash toolchain/build.sh v9.90-review v9.90_compact_load_cards_DRAFT/patch_v990.py
export PAGE=build/GC500_v9.90-review/GC500_Delivery_Control_hosted.html
export BASE=build/GC500_v9.90-review/base_live.html
export EXPECTED_SHA=<final-candidate-sha256>
python v9.90_compact_load_cards_DRAFT/tests/patch990.py
node v9.90_compact_load_cards_DRAFT/tests/browser990.cjs
MOB=1 node v9.90_compact_load_cards_DRAFT/tests/browser990.cjs
node v9.88_daily_available_staff_LIVE/tests/staff988.cjs
node v9.88_daily_available_staff_LIVE/tests/staff_browser988.cjs
MOB=1 node v9.88_daily_available_staff_LIVE/tests/staff_browser988.cjs
node toolchain/harness/sweep.js
MOB=1 node toolchain/harness/sweep.js
```

Optional `OUTDIR` saves private screenshots/check results outside the checkout. Raw browser evidence and generated pages are not committed. Desktop and phone checks are browser emulation, not physical-device performance measurements. See the final validation record below for executed results.


## Base reconciliation

The shared base advanced only by the separate v9.89 Life Saving Rule icon claim in `STATUS.md`. Its complete status content is retained verbatim. Actual live bytes, fetched independently, remain the v9.88 base above. No icon implementation was present in that base or deployment at reconciliation time. This draft was renumbered to v9.90 to avoid the claim collision; the existing PR head branch retains its historical name so PR #31 remains intact. The implementation is unchanged except the 989-to-990 presentation namespace and draft version. Any subsequent live icon release must be preserved by rebuilding from that newer exact base; the current hash guard rejects it automatically.
