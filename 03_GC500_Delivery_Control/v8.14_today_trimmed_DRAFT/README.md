# v8.14 — Today, trimmed

Author: Andrew Fisher · 3 Oct 2026 AEST.

**READY TO UPLOAD — all final checks complete; guarded publication next.** This candidate removes the requested Today cards, keeps current programme-day access and moves the unexported-change count to Tools → Export. Final standing checks and print/visual review are complete; guarded publication remains with the release owner.

## Authority and exact candidate

Andrew asked, with screenshots of the Today cards: “I want you to work with me on each page and areas and we will remove things we don't need ok. starting with today we don't these in here. Unless u think overwise”. His later instruction in the release-audit chat, “Work with claude. Audit and make live”, authorises completing and publishing this scope after checks.

The implementation owner supplied the frozen `dd83f06` handover in [PR #1, comment 5962930600](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5962930600), then accepted the visible Export-count correction in [comment 5962993207](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5962993207).

- Original `patch_v814.py` is preserved from `dd83f06`; patch SHA-256 `255a548a259bc747d975b79f2a1f4d8c23851b7b7014b51eae2b5e318a33cddf`.
- Apply `patch_v814_export_audit.py` after that original patch to correct the audited Export label, then `patch_v814_pair_audit.py` for the two-card desktop arrangement.
- Live base: `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`, 9,079,773 bytes.
- Combined candidate: `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce`, 9,074,112 bytes.
- Shared-record baseline before publication: **3554**, with collection hashes recorded in `evidence/publication_before.json`. No operational record change is included in this release.

## What changes

Six Today cards are removed from the rendered template for both screen and ordinary page printing:

| Removed from Today | Remaining access or deliberately retired display |
| --- | --- |
| Map, including the sheet shortcuts | Map tab retains its sheets and controls. |
| Documents counts | Documents retains its catalogue and file actions. |
| Also on the schedule — no reference | Timeline's exact day retains these rows and “Give it a reference”. |
| Roads between Coates Kingston and the circuit | The historic roads snapshot is retired from Today. No live routing control is removed; this snapshot has no replacement card. |
| Fencing | Fencing retains its dockets, quantities and financial detail. Andrew's later removal instruction supersedes the earlier request to duplicate this card on Today. |
| Your records | Export and Import remain in Tools; Export carries the unexported-change count. The last-export timestamp and last-import summary lose their sole visible card. Their stored metadata remains; no replacement summary panel is added. |

The future-day “Next programme day” fallback is also removed. The current-day “Due today” card remains when `dayNow` finds a programme entry for the current Brisbane date. This is a **programme-row condition**, not a strict deliveries-only test: a removal-only, notes-only or unreferenced-row programme date can still show that card. On a gap day it is absent; the retained overview and Timeline provide subsequent programme information.

On screens at least 900 px wide, the original patch gives Delivery updates two grid columns. The visual audit found that equal half-widths leave 24.5% empty space when the work row contains only Delivery updates and Who to call. The final scoped packing correction assigns Delivery updates one column and Who to call the remaining columns in that exact two-card case. With a programme-day card or another visible alert, the established arrangement applies. The phone layout remains one column; this packing does not apply to print. Retained Today components and their calculations are unchanged. No collection, save action, import/export payload or destination view is removed.

The original patch's shorthand that every removed display has another home is qualified by the table above: the roads snapshot and last-export/import summaries are intentionally retired displays.

## Export correction and checks

The independent audit reproduced one defect in the original patch: `renderTabs()` called the new badge helper, then its old Export writer overwrote the visible count in the same render. The separate audit patch makes the helper the final label writer. A nonzero count now finishes as `Export · 5 new`; zero finishes as `Export`. Export's save/cancel and concurrent-change protection remain unchanged.

| Check on the combined candidate | Result |
| --- | --- |
| Source/CPU checks, including actual `renderTabs()`, data/function preservation and Brisbane date boundaries | **31/31 pass**; earlier 28/31 log is retained solely as evidence of the corrected finding. |
| Actual-page Export counts, styling and titles for 0, 1 and 7 changes; successful export, cancelled export and changes during export | **12/12 desktop, 12/12 phone**. |
| Actual-page current/gap programme date checks, 3 and 7 Oct 2026 | **2/2 desktop, 2/2 phone**. |
| Errors and writes in that focused browser audit | No page errors; no attempted live writes. |
| Actual packing function, two/three/four columns, resize, programme/alert/other-section isolation, phone/print and patch guards | **29/29 pass**, bound to the final candidate. |
| Layout, 1,440 px desktop | Today pane **3,798 → 3,540 px**; Today work empty area **11.9% → 10.7%**; other visible measured sections below 15%; retained Equipment height unchanged. Phone work-row empty area **4.5%**, no horizontal overflow; actual desktop/phone viewport screenshots inspected. |
| Paired six-sample synchronous navigation timing | Today **197.8 → 181.0 ms** median on this test host. Equipment code/height unchanged; timing mixed (**86.5 → 94.4 ms**), so no general speed claim. |
| Standing packed/Equipment/rules/fresh suites | **134/134 pass**. |
| Today behaviour/printing and result navigation | **41/41 + 18/18 pass**. Ordinary Today print **13 → 12 pages**; A4 report **8 → 8**. |
| Retained text/figures | All seven checked views match after excluding only the authorised removed Today cards. |
| Full navigation sweeps | **21 tabs, seven deep links and Back on desktop and phone; zero page/console errors.** |
| Actual phone Showcase after printing | Live base and candidate both open, expose Options, close and reopen correctly; modal state, dimensions, focus and Back checked. |
| Corrected one-tab legacy suite | **24/24 desktop + 24/24 phone pass** with the actual-modal assertion. |
| Guarded upload and exact public-byte/record readback | **Pending. Not live.** |

Evidence: `evidence/codex_source_review.md`, `source_cpu_corrected.log`, and `codex_browser_audit.json`. The earlier owner removal log and partial v7.99 logs are historical checks; they do not replace final standing-suite completion on this candidate.

Only expectations invalidated by the authorised removals may be retired: the deleted Today-card presence checks, full old Today text equality, and the old Today Ctrl+P page count. A shorter ordinary Today printout is expected. **A4 report content, report money figures, print hydration/fold restoration, retained Today content and unaffected destination behaviour must still pass.** The original Fencing/Costs combined assertion must retain the check that Costs has not reappeared on Today.

Implementation and the independent source audit are recorded above; the release owner owns the correction, final combined validation and publication. The moving v8.09, v8.15 and v8.16 drafts are outside this release. The rejected v8.17 animation direction remains parked.

## Rebuild

From `03_GC500_Delivery_Control`, starting from the named live base:

```sh
bash toolchain/build.sh v8.14 v8.14_today_trimmed_DRAFT/patch_v814.py v8.14_today_trimmed_DRAFT/patch_v814_export_audit.py v8.14_today_trimmed_DRAFT/patch_v814_pair_audit.py
```

The strict sequential inherited-suite runner is `evidence/standing814_runs.py`. It records original/adapted source hashes, rejects nonzero exits, failed assertions, page/console errors and incomplete contexts. Historical `run_all.sh` and the partial original logs are not release gates. Private screenshots and raw browser results remain outside Git.

## Corrected legacy Showcase assertion

The original phone one-tab run reported 23/24 because it checked `#showBackdrop`. That is a Backdrop `<select>`, intentionally hidden by the existing mobile car-focus Options rule; the actual dialog is `#showcase`. Exact Showcase open/close, print handlers and mobile CSS are unchanged from the live base. The initial result remains in `standing814_initial_browser.json`; it was not waived as a product failure. The corrected test requires the actual modal role, open state, visibility, nonzero dimensions, Back control and focus containment. `showcase814_phone.cjs` separately reproduces the print path and verifies modal/Options/Back/reopen on both baseline and candidate. This control probe pauses automatic scene changes before using scene-dependent Options; its earlier unpaused second-Options-click timeout is retained privately. No Showcase product code changed for this correction.
