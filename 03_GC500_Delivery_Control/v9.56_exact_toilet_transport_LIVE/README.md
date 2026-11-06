# v9.56 — Exact tank-mounted toilet transport costs

Author: Andrew Fisher

State: implementation, independent source review and final native checks complete. READY for the release owner’s final publication checks. Not uploaded by this implementer. No operational records changed.

Two planned demob movements were held under the generic Toilet Block 6m description even though their reference names identify tank-mounted blocks. WC05/T0225 (one combo block) matches the original Transport L27 cost; WC60/T0203 (two tank-mounted blocks) matches the identical cost in L27:L29. The card explicitly says ex GST, each way. The patch adds only a cost-forecast match; it does not change customer rates, approved supplier quotes, bookings or actual costs.

The fallback requires the exact reference, source task, product name, item, movement and quantity, with one matching order line. An existing native cost wins. Original quantity/overlap checks still run on a cloned cost line; cancelled/removed movements, actual/Internal coverage, typed costs and supplier quote coverage remain controlled by v9.53. WC09's unclassified blocks and all other unknown/POA work are untouched.

Original source: Rate Card 2026 (1).xlsx, sheet `Transport ` (trailing space), A3 and L27:L29. SHA256 `60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`. The source L-column cost retains full precision through the native rounding. When either new match is used, the existing residual recipient is retained so existing card amounts stay unchanged and the new demob rows show their own rounded costs; all other rounding paths remain unchanged. M-column customer charges are not used or changed.

Checks completed: 22 generic focused assertions, including composed v9.53 actual/Internal, supplier quote and typed-cost exclusions; independent helper/patch review. Private financial snapshots and screenshots belong outside Git under `/workspace/private-transport956/final-short-caption/`. Final byte-specific proof uses a fresh GET snapshot of record 5127. All 17 reconciliation ties pass; all actual costs, customer Revenue, supplier forecasts, six average demob allowances, every existing transport row and all other planned rows are unchanged. Exactly two additional demob allowances are present; WC09 remains held. The transport total, KINP component and demob component each increase by the same source-supported amount. Final phone captures were inspected with no horizontal overflow; original source precision and prior rounding recipient are preserved. Patch guards and full-page validation pass.

```sh
node test_transport956.cjs
CHROMIUM_PATH=/usr/bin/chromium BASE=/private/v955.html PAGE=/private/v956.html OUT=/private/proof node browser.cjs
```

Hold `/tmp/gc500-browser.lock` for browser checks. The harness blocks every non-GET request, freezes the record and checks all actual/customer financial models, supplier forecasts, the two intended new allowances, six existing average demob allowances and all native financial ties. The patch requires the v9.55 supplier component and footer, and refuses a second application.

Final v9.55 base SHA256: `b0b8d01805e2b9a41b7d6c3d0772eae892eda20db9c0ca52862185a50cd3a318`.

Final v9.56 candidate SHA256: `4410bb0b4f8fb8dbdb049485df95d0163ee9032251ad25df37c265a943efaca1` (byte-identical to the release owner’s standard final build).

Reviewed helper SHA256: `9b96ae8346e1560834bbb678f78a750fcb7dedde9f0bc18de7b1de636fef3bdf`.

Reviewed patch SHA256: `87a954525b1d878698dbad3f9c773fd13512a031f205b43bef296b8e28c6feb1`.

The last v9.55 presentation change only shortened its truthful approved/provisional caption. Literal-only HTML identity was proved against the passing paired build; the final-byte phone run recaptured every native model and all 17 ties, and all models are identical after normalising that one caption string. Evidence: `final_equivalence_proof.json`.


Author: Andrew Fisher

VERIFIED LIVE — combined v9.55 + v9.56, 9 Oct 2026 13:38 AEST. READY source commit85ade8c0. Public SHA4410bb0b4f8fb8dbdb049485df95d0163ee9032251ad25df37c265a943efaca1, 12,688,275 bytes. Guarded upload and independent public/native readback pass. Record5127 unchanged, zero runtime errors. Both final desktop and phone navigation sweeps pass. Original documents and detailed financial evidence remain private.
