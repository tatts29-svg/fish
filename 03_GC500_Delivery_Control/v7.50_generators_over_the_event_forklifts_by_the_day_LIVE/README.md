# v7.50 — Generators and towers over the event only; a forklift by its day rate (LIVE — uploaded by Codex, 1 Oct 2026)

Author: Andrew Fisher · 1 Oct 2026

**URGENT — the live v7.49 overstates revenue by about $66,000.** Codex put the v7.48 + v7.49 drafts live on 1 Oct 2026
(live page 8,418,622 bytes) from the folders as they stood before two corrections were made. This release is those
two corrections and nothing else. **Whoever has the edit key: build and upload this first.**

`toolchain/build.sh v7.50 v7.50_generators_over_the_event_forklifts_by_the_day_DRAFT/patch_v750.py` — the patch
replaces the v7.49 code block on the live page with the corrected one (same names, so rates typed on the live page
keep working). It refuses on a page without the live v7.49, and refuses to run twice.

## What was wrong on the live page, and the rule that fixes it

| | live v7.49 | v7.50 | rule |
|---|---|---|---|
| Generators and light towers with no contract rate | card daily rate × days on site (GN01: 28 days, $5,404) | card daily rate × **the three race days** (GN01: $579) | Brenden Meek, Branch Manager: "Forklifts, VMS and water barriers are charged for from when they go in. Everything else is only charged for over the event." |
| MEAD 9968726 line 1, 2.5 t RT forklift | Rate 1 $1,483.20 charged **by the day** × 8 = $11,865.60 | Rate 1 is the card's $185.40 × 8 days written as one figure → charged by the day rate, **$1,483.20** | Andrew, 1 Oct 2026: "Forklift go by its day rate. Have our own correct logic on correct pricing. You're correct about MEAD." |

The rule is general and exact: a forklift line whose Rate 1 equals a card forklift day rate × the line's own days to the
cent is the whole hire written as one figure. MEAD's 5 t line ($405 a day, no such match) is unchanged.

## Figures (practice tests on the live record, read only)

| | live v7.49 | v7.50 |
|---|---|---|
| Revenue | $622,221.63 | **$555,929.94** |
| Contract charges | $343,307.43 | $277,015.74 |
| Toilets and servicing charge | $154,194 | $154,194 (unchanged; +$35,619 against cost) |
| Contract lines with no rate | 2 | 2 |

Checks: MEAD line 1 = $1,483.20 with the reason on the line; GN01 = $579 (60 kVA × 3 days); GN20 = $1,415.34 (asked
350 → 315 kVA × 3); a rate typed on a decided tank line stays ignored; a typed generator rate wins and clears back to
the card; 0 page errors desktop and phone; no sideways scroll on the phone. Sweeps: `evidence/sweep_desktop.txt`,
`evidence/sweep_phone.txt`.

## Lesson recorded

The other agent uploaded a draft folder while it was still moving. From now on a `_DRAFT` README says in its first
line whether it is **ready to upload** or **still moving**, and STATUS.md says the same on the claim line.
