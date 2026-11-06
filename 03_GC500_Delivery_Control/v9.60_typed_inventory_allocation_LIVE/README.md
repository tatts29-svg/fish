# v9.60 · Typed inventory and explicit progress scope

Author: Andrew Fisher

Verified LIVE on 9 October 2026 at 16:29 AEST as part of the combined v9.63 release. READY source commit `2a9c771e`; public SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes. Guarded upload and fresh actual-public checks passed on unchanged record 5155. Today, Equipment and Sub-hired quantities, partial-reference badges and source qualifications agree; all 16 paper records still resolve to 17 originals. Publication verification is saved in v9.63’s evidence folder.

Mixed-item references previously assigned supplier units to the largest item line first. On WC09 this labelled four of the six pee panels as Event Portables and left its four Event Portables FWF toilets unnumbered. Inventory now reads the canonical physical-unit model for each item. Exact typed identity coverage supplies ownership and numbers; an ambiguous item or partial arrival cannot borrow another item’s identities. Existing arrival quantities, orders, spares, bookings, completion and financial calculations are unchanged.

WC09’s typed allocation identifies four Event Portables FWF units, two numbered Coates toilet blocks, and six pee panels counted by quantity with no fleet-number request. Receipt and installation status are supplied separately by v9.62 in the combined release. WC69’s assigned Event Portables numbers remain on WC69, with no arrival inferred; WC40 receives none. The two VMS boards at T0103 remain one Coates board and one PremAir Hire board.

The Event Portables supplier banner and inventory/PDF description also use the same typed identity. This corrects the type of WC09’s four assigned numbers. The combined release applies v9.62’s separate receipt evidence before counting them on site: an assigned FWF number is not proof of delivery. Its final FWF reading is 70 at locations plus one spare; WC09’s four assigned FWF remain without a recorded receipt. The intermediate v9.60 receipt subtotal is superseded by that correction.

The VMS progress denominator remains the current schedule’s 24 and the numerator remains 10. Its main instrument, type detail and whole-job index now identify the scope as provisional while that schedule disagrees with the earlier requirement. The shared source reader obtains the requirement and confirmation date from canonical QHIST R16, BOQ history from DATA.schedule_review875, and the latest schedule source and review date from DATA.schedule_review950. It does not decide which conflicting source supersedes another. Both Equipment and Today use that reader; changing the canonical requirement changes both views. Lighting keeps the approved D024 reading of 4/6 and visibly explains its equipment inventory of 5/7, including one surplus tower.

## Composition

Apply `patch_v960.py` to the actual v9.59 predecessor. It requires the v9.59 footer, `fenceMeasuredCcb959` and the v9.58 programme marker. Every replacement uses the shared strict `rep`; wrong bases, repeated application and changed anchors fail without writing a partial result. No native record migration or write is included.

## Validation

- `node test_inventory960.cjs`: typed ownership, duplicate identities, ambiguous descriptions, partial arrivals, cross-reference protection, quantity-only panels, two-board supplier split, scope uncertainty and canonical requirement updates.
- With private native fixtures: `node test_inventory960.cjs EXTRA_MODELS SNAPSHOT CANDIDATE_HTML`. Verifies native record 5155’s real allocations, all arrival/order/spare quantities unchanged, source record unchanged, and identical whole-job arithmetic with VMS marked provisional. A provisional 100% cannot illuminate a finished whole job.
- `python test_patch960.py PREDECESSOR_HTML`: strict patch composition and atomic rejection cases.

Private evidence and native fixtures remain outside Git under `/workspace/private-fencing958/`. Final combined navigation, sync and publication checks belong to the coordinating release.

## Combined release verification

Final pre-publication verification for v9.58–v9.63, 9 October 2026. Final standard-build SHA-256 `d98bfc4b6bb8461feec1f4af31a7d69fdd0711f2979d27bae4c324d7f8001ae6`, 12,762,245 bytes; exact live v9.57 base `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`. All 48 scripts parse. Final source checks (214 programme, 50 fencing and 65 toilet), 153 financial checks and 17 native ties pass. Both desktop and phone sweeps pass 22 routes, seven deep links and Back. All 21 incoming-record scenarios across seven tabs pass, with native record 5155 and actual charges/costs unchanged. Final phone layouts were inspected. Sixteen signed papers link to 17 original photographs. Detailed sanitised combined evidence is in the v9.63 release folder.

The final update replay exposed an intermediate WC09 partial-receipt regression. It was corrected and independently reviewed before rebuilding and repeating final checks; the superseded candidate was never published. Missing receipts and conflicting source scopes remain explicit.
