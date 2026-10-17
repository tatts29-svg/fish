# Private layout review — 2 Oct 2026

Author: Andrew Fisher

**DRAFT for Andrew's review. Not READY TO UPLOAD, not live.** This unversioned handover preserves the real-page mockup requested under the layout ownership entry in `STATUS.md`. It deliberately does not claim a release number. The root thread owns that board and publication.

The preview rearranges existing components for R1, R2 on Costs, R4 and R5 from `../layout_map_02Oct2026/README.md`. Today, Equipment, Map explorer and Coates Way are outside this scope. No pricing rule, operational record, saved state or release marker changes. No new stylesheet is added.

## Proposed arrangement and preserved facts

- **R1:** One original Fencing docket register, with All, By day and By area views. All 63 source rows and their drawer controls remain available. The 59 derived fencing charge rows on Costs become one aggregate linked to All dockets. The original quote/variation component, programme/week baselines, selected-area completion provenance, drawings and breakdown controls stay. Recorded work metres are not relabelled as fence standing.
- **R2, Costs only:** At a glance owns repeated whole-job totals; duplicate cells link there. Existing ledger, forecast, rehire and Finance detail is folded. Record and job-end amounts, priced wages, Difference before overheads, overheads, recovery ratios, quote split and selected-month Finance proposals retain their separate bases.
- **R4:** The Everyone accommodation repeat links to its Costs detail. Person accommodation subtotals remain on Running sheet because Costs has no matching person aggregate. Questions' carrier and partial labour outlook wording links to Costs. All day/person rates, hours, nights, pay, paid/worked distinctions, overtime, unpriced work and actual/forecast qualifications remain.
- **R5:** Only 31 regenerated current contract-charge suffixes in Questions become links to the Costs card. Contract identity, historic agreed amounts and periods, charging-window decisions, original question history and saved controls remain.

The selected day uses the existing `.day.on` appearance, and only the horizontal date strip scrolls to bring that day into view on selection and resize. This bounded correction aligns the selected card with the heading and docket rows.

## Exact preview binding

- Reviewed historical base: v8.03, SHA-256 `fa32b0a1937b329077923b960688a8927fbaaa2e6283d4d1ce2c6732eb98c213`.
- Component: `33fa43f8e5fdf04514064484300ef92c38e5479f4d57bf02e8e2504e82dcb7ea`.
- Private prototype: `1d2845f7dff2fe54accb8f9769810271fa36ec6205df48e9ccb08175cd461411`.

`patch_preview.py` accepts only that exact base and frozen source, refuses repeat application and writes only to a separate path outside the repository. It uses the shared `rep` helper on the final real-page body, avoiding the other body string inside generated-document code. Removing its one appended script restores every original page byte. It is a private preview builder, not a release patch; live has advanced since this base.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 patch_preview.py /private/base_live.html /private/layout-preview.html
PYTHONDONTWRITEBYTECODE=1 python3 source_checks.py /private/base_live.html --report /private/source_checks.json
```

## Evidence and limits

Source guards pass 9/9. The independent semantic review passed 26 checks on the unchanged financial, record, quote, person and question scope. Eight matched desktop/phone views shared the same business-model hash, retained All 63 dockets and had no page-width overflow. The final selected-day change passes 17/17 affected browser checks, including selection, area/day return and desktop/phone resizing; see `evidence/semantic_checks.json` for exact binding and status.

Two nested desktop destinations can place the target border 3.5–5.8 px above the navigation edge; headings and destination content remain visible and every required fold opens. This remains a draft navigation refinement for implementation. Default-fold page length is measured, but this preview does not certify tab-opening performance or the empty-space target.

All browser requests were read only: non-GET requests were blocked. Four expected resource errors in the full comparison correspond to four blocked Google tile-session POSTs. The final targeted two-context run also blocked its two Google tile-session POSTs. There were no application page exceptions or operational writes. This bounded mockup is not a clean full-app release sweep.

Private real-page artifacts and business screenshots remain outside Git at `/workspace/private-layout-review-02Oct2026/`. Independent detailed reports are under `/workspace/private-gc500-audit/layout-semantic803/`. Recommended views: `after-desktop-costs-summary.png`, `after-phone-costs-summary.png`, `after-phone-costs-summary-lower.png`, `after-desktop-fencing-register.png`, `after-phone-fencing-register.png` and `after-phone-fencing-area.png`; R4 is illustrated by `after-desktop-runsheet-excerpt.png`. Nine final Costs/Fencing after-images bind the final hash above; the unchanged R4/R5 excerpts and original height/link comparison remain bound to the earlier `9995977b` candidate, with the selection-only source delta independently checked.

Before implementation: obtain Andrew's response to the real-page mockup as AGENTS requires, rebuild on the latest live source, resolve the remaining anchor border offset and perform the current release checks and measurements. Do not publish this historical-base preview.
