# Flat-feet fencing quantities

Author: Andrew Fisher

Status: COMPONENT READY, source frozen. The root release owner builds, verifies and publishes the final page after browser checks.

The 9 October fencing docket records flat-feet CCB metres and a separate physical barrier count. The existing Fencing columns omitted flat feet, despite both the current programme and rate card naming it. This patch adds `flat_feet` to the native column model, CCB metre summaries and rehire classification.

The original **Rate Card 2026 (1).xlsx** (SHA-256 `60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`) has `Per Mtr 2026` at `'Street Rate Card 2026'!C53`, `CCB Flat feet` at A63 and the cached rate **9.6511** at C63. B63 includes labour; `'Transport '!A92:O92` includes transport. The issued card PDF also shows this item in the per-metre section at the displayed rate 9.65. The programme `CON WK2!L4:N5` places Flat Feet under Crowd Control Barriers (m).

Use the docket's **42 m** for the customer charge: **405.35 ex GST**, using the source precision. Preserve **19 barriers** independently as physical components. No standard-barrier length conversion is applied. Supplier pricing remains unknown until source evidence establishes it. The stale missing-column message is removed; other gaps and existing calculations are retained.

No record mutations, original photographs, private snapshots or supplier-price assumptions are included in this source patch. The root owner enters the new record and attaches its papers separately.

Focused checks:

```sh
BASE_PAGE=/path/to/base.html PAGE=/path/to/candidate.html NATIVE_SNAPSHOT=/private/before-native.json node test_flatfeet957.cjs
```

The optional snapshot path is private. Tests exercise the actual page costing functions, including original metre precision, independent component counts, unknown supplier price, typed override conventions, idempotence, CCB summaries and preservation of every existing docket.

Component verification on the exact v9.56 live page `4410bb0b4f8fb8dbdb049485df95d0163ee9032251ad25df37c265a943efaca1`: all nine focused check groups passed, including unchanged native calculations for all 84 existing dockets. Five strict patch checks passed. The standard page check parsed all 46 inline scripts and passed secret, data and footer checks. Private candidate `4e2a8aa11e3287b536a9404cb753982873f42798ac406dbd72a12683c2ce6f1a`, 12,690,491 bytes. No publication or operational writes were performed by this component task.

```sh
BASE_PAGE=/path/to/base.html python3 test_patch957.py
```
