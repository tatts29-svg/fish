# Flat-feet fencing quantities

Author: Andrew Fisher

Status: READY TO UPLOAD. Final source is frozen and all required browser checks have passed.

The 9 October fencing docket records flat-feet CCB metres and a separate physical barrier count. The existing Fencing columns omitted flat feet, despite both the current programme and rate card naming it. This patch adds `flat_feet` to the native column model, CCB metre summaries and rehire classification.

The original **Rate Card 2026 (1).xlsx** (SHA-256 `60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`) has `Per Mtr 2026` at `'Street Rate Card 2026'!C53`, `CCB Flat feet` at A63 and the cached rate **9.6511** at C63. B63 includes labour; `'Transport '!A92:O92` includes transport. The issued card PDF also shows this item in the per-metre section at the displayed rate 9.65. The programme `CON WK2!L4:N5` places Flat Feet under Crowd Control Barriers (m).

Use the docket's **42 m** for the customer charge: **405.35 ex GST**, using the source precision. Preserve **19 barriers** independently as physical components. No standard-barrier length conversion is applied. Supplier pricing remains unknown until source evidence establishes it. The stale missing-column message is removed; other gaps and existing calculations are retained.

No record mutations, original photographs, private snapshots or supplier-price assumptions are included in this source patch. The root owner enters the new record and attaches its papers separately.

Focused checks:

```sh
BASE_PAGE=/path/to/base.html PAGE=/path/to/candidate.html NATIVE_SNAPSHOT=/private/before-native.json node test_flatfeet957.cjs
```

The optional snapshot path is private. Tests exercise the actual page costing functions, including original metre precision, independent component counts, unknown supplier price, typed override conventions, idempotence, CCB summaries and preservation of every existing docket.

The component also supplies human singular/plural labels and a native component field for `flat_feet_ccb`. Its separate physical count remains independent of the chargeable metre quantity.

The source-review catalogue adds only agreements 36591 and 36594. Event classification uses the current original programme `GC500_2026_Coates_Fencing_Programme_Reviewed_09Oct2026.xlsx`, SHA-256 `836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db`, and each exact original photograph. The source-cell explanations are in `ccbreview957.js`. The existing validator is unchanged: current date, location, quantities, components and note must match; the source registry must supply each exact reviewed hash. Missing, changed or ambiguous evidence cannot confirm the category. Existing classification rows are preserved, and this assessment supplies no surveyed position.

Final component verification on the exact v9.56 live page `4410bb0b4f8fb8dbdb049485df95d0163ee9032251ad25df37c265a943efaca1`: all nine focused costing check groups passed, including unchanged native calculations for all 84 pre-existing dockets. Five strict patch checks and 29 classification/label checks passed. The standard page check parsed all 46 inline scripts and passed secret, data and footer checks. Private candidate `1f04615f0c941e1c6c2b45e0656fc92e2bd816998a7b5f2d428f1e1b0e4a6cb0`, 12,694,230 bytes. The classification/label extension preserves the initial flat-feet price configuration and native pricing functions exactly. No publication or operational writes were performed by this component task.

```sh
BASE_PAGE=/path/to/base.html python3 test_patch957.py
BASE_PAGE=/path/to/base.html PAGE=/path/to/candidate.html NATIVE_SNAPSHOT=/private/current-capture.json FIRST_CANDIDATE=/private/initial-flatfeet-candidate.html node test_ccbreview957.cjs
```

Final release verification: the standard build exactly matches the frozen candidate above. Both desktop and phone checks cover 22 routes, seven deep links, browser Back and print navigation with no runtime errors or attempted writes. The phone shows “19 flat-feet CCBs” and the source-backed Event assessment without clipping. Paired native checks on record 5153 preserve the other 95 dockets, all direct cost buckets, both service-note and collection collections, and the entire operational record. Customer Revenue changes only by the supported 405.35 ex GST flat-feet charge; both Finance checks pass. All 16 papers resolve to 17 original photographs. Publication is owned by the release owner; detailed financial captures and screenshots remain private.
