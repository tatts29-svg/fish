# Compact Build load cards — draft review

Author: Andrew Fisher.

This is an unmerged, undeployed review candidate. Further approval is required before merge or deployment.

Andrew approved compact dark load cards, stronger borders, glow and animated progress lights in the delegated request from thread `01a12526-76e6-750a-9393-466c046640f2`: “I want the cards to animate and glow”, “Make sure the lights animate. Border the cards better”, “Do it”.

The saved K2 branch was not used as the implementation base. The current shared branch is `codex/gc500-current-release-03oct`, tip `357012094cedd9f19ab64fee5df405955adfc786`. Its v9.88 staff release matches the actual public page byte for byte:

- Base SHA-256: `40dc8f6c66079d8910ef5eaa3dd6e98a80b778960f70659d5c2447676d1c6175` (14,630,539 bytes).
- Candidate SHA-256: `b9f59b39618cc171fb9ac0679ebea30b6216ee971a171cdf92cf751ad0c26211` (14,645,792 bytes).
- Review branch: `codex/gc500-load-cards-989-review`.

Closed loads keep their load number, time or explicit No time, carrier, reference/name, destination source, actual status, and every existing Truck flow warning chip. Navigate and Details remain available. Details holds the existing QR, progress controls, nominal sizes/weights and their uncertainty/source notes, native delivery cards, photos, notes, loading controls, run-sheet action and Arrange loads. No filters or broader day-page rearrangement were added.

The existing orange rail now has an orange outline and dark bevel, open/focus glow and a brief tap sweep. Expansion uses a short transition through the native toggle. Only the current native Transit/Location/Installed lamp pulses; unknown, Off site and Finished remain steady, as do earlier reached stages. Motion honours the existing pause/offscreen/modal gates and reduced-motion preference. Controls retain 44px touch targets and keyboard focus.

The implementation moves existing DOM nodes and retains delegated action attributes and the native Arrange loads number hook. It does not write to shared records or change ordering, staff, costs, calculations, permissions, source evidence or the daily availability model. The existing Available staff/Edit availability and Truck flow remain in their original positions. The patch round-trip test proves every byte of the original page is retained except the draft footer version and the two added presentation blocks.

## Files

- `patch_v989.py`: exact-base, single-application patch using the shared replacement helper.
- `loadcards989.js`: compact presentation and native-toggle animation.
- `loadcards989.css`: scoped card styling and motion.
- `tests/patch989.py`: full original-page preservation and wrong-base/reapply rejection.
- `tests/browser989.cjs`: desktop/360px-phone interaction, warnings, motion and record-preservation checks.

## Reproduce

From `03_GC500_Delivery_Control`, install the shared toolchain dependencies and set `CHROMIUM_PATH` if needed. The browser harness substitutes only the candidate HTML and blocks operational writes. All checks use the public view, with browser-only fixtures where required.

```bash
npm ci --prefix toolchain
bash toolchain/build.sh v9.89-review v9.89_compact_load_cards_DRAFT/patch_v989.py
export PAGE=build/GC500_v9.89-review/GC500_Delivery_Control_hosted.html
export BASE=build/GC500_v9.89-review/base_live.html
export EXPECTED_SHA=b9f59b39618cc171fb9ac0679ebea30b6216ee971a171cdf92cf751ad0c26211
python v9.89_compact_load_cards_DRAFT/tests/patch989.py
node v9.89_compact_load_cards_DRAFT/tests/browser989.cjs
MOB=1 node v9.89_compact_load_cards_DRAFT/tests/browser989.cjs
node v9.88_daily_available_staff_LIVE/tests/staff988.cjs
node v9.88_daily_available_staff_LIVE/tests/staff_browser988.cjs
MOB=1 node v9.88_daily_available_staff_LIVE/tests/staff_browser988.cjs
node toolchain/harness/sweep.js
MOB=1 node toolchain/harness/sweep.js
```

Optional `OUTDIR` saves private screenshots/check results outside the checkout. Raw browser evidence and generated pages are not committed. Desktop and phone checks are browser emulation, not physical-device performance measurements. See the final validation record below for executed results.

## Executed validation

Final candidate implementation: `87efbba`. Draft PR: https://github.com/tatts29-svg/fish/pull/31.

| Check | Result |
|---|---|
| Shared `check_page.py` | PASS — 75 inline scripts parse; author and secret checks pass |
| `tests/patch989.py` | PASS — 2 tests, exact round-trip, repeat/wrong-base refusal without writing |
| Final built candidate byte comparison | PASS — exact original page after removing added presentation blocks and restoring the version label |
| Focused desktop browser | PASS — 57 checks, 1440px; zero errors or attempted writes |
| Focused narrow phone browser | PASS — 57 checks, 360px; zero errors or attempted writes |
| Existing daily availability model | PASS — 30 checks |
| Existing daily staff browser suite | PASS — 50 desktop + 50 phone checks, including Edit availability, stale-save rejection, Today/Build/Demob, legacy records and unchanged P&L |
| Shared desktop and phone sweeps | PASS — each 22 routes, 7 deep links, browser Back, zero page or console errors; intentional public aliases resolve to Equipment/Today |
| Visual inspection | Desktop and 360px phone, closed/open cards inspected |
| Final live read | Still exact v9.88 base hash above; nothing deployed |

Focused checks cover repeated open/close, rapid reversal, Enter/Escape and focus restoration, native Navigate destination, QR parity, Arrange loads open/close, run-sheet dispatch warnings, nominal dimension labels, both curfew-first flags, missing times, 14 October arrival restrictions, every lamp stage and reduced motion. Native single-open behavior, daily staff markup, Truck flow markup, load order, shared S and P&L remain unchanged. Desktop closed-card heights are 73–125px; phone 165–217px for the six loads on 12 October.

The protected data and source functions were not changed. No physical-device FPS testing, merge, upload or live UI change is claimed. No technical blocker remains for review; merge/deployment require Andrew's further approval. Rebuild and retest if the live base changes before any later release.
