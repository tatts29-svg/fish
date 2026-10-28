# Ruled contract reconciliation — v12.55 DRAFT

Author: Andrew Fisher

The candidate reconciles the remaining explicitly ruled contract movements and routes approved Price-only labour rows to Installation. Existing customer card, event and FWF components covered by those rows are included once. Cleaning remains separately priced while the bundle boundary is confirmed. This is a checked draft, not READY TO UPLOAD or live.

The bounded source adapter changes only the named public handover fields and source rows. New rows remain unmatched source evidence; no site allocation is inferred. The existing financial association and own-use hold remain intact. Supplier models, Direct costs, original branch cost allocation, physical quantities, completion ticks and operational documents are preserved. No pre-bill fields are inputs. The existing design and styles remain unchanged.

The WC09 Pee Panel reader retains its existing Hire amount when the approved contract source replaces the fallback. A narrow financial read association connects that source to the existing item scope without writing a source match or changing site records. Rehire classification is retained. Covered labour reads Included, names its contract source and distinguishes the item subtotal from Installation charged on the contract.

`patch_v1255.py` integrates `source_movements.py` and `finance_patch.py`. It requires an explicit exact reviewed predecessor, rejects repeat application and preserves original styles. The financial replacements reverse exactly; boundary tests also prove complete integration reversal. The final release must be built from whichever approved predecessor is actually live.

Tested predecessor SHA256: `20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5` (v12.54.1).

Current candidate SHA256: `d5a6a13ba1b1e3c16964995227e1a90036a106aeddc850366f46494e07f71b1c`, 16,132,021 bytes. The patch also accepts the separately reviewed exact v12.54 predecessor; that alternative requires its own final candidate gates before release.

Completed checks: eight source tests, four financial patch boundary tests, nine integration tests, the financial helper suite, 217-script checking and independent source/implementation review. The current candidate passes 4,715 native checks with independently derived source, ledger, branch and component expectations. These check operational documents, physical labour slots, untouched contracts, original supplier monthly costs, Direct costs and their branch allocations, cent reconciliation and actual WC09 drawer output. Zero runtime errors, console errors or operational writes. Independent native financial preservation also passes. Actual phone checks pass with clearly included charges and explicit item subtotals. Both final shared navigation sweeps pass: desktop and phone each exercise 27 tab routes, seven deep links and Back, with zero runtime errors, console errors or operational writes.

All engineering checks on this candidate are complete. Implementation/tests source: `146c65cc50467a44e2c566221bbaf18088b272a1`. Release still requires resolution of the Cleaning boundary, an independently verified live predecessor, an exact shared-toolchain rebuild and the final READY handover. Claude retains guarded publication; Codex retains implementation, testing and independent public read-back. Detailed source evidence, actual financial values and screenshots stay private.

Run the tests with private predecessor paths:

```bash
SOURCE_PAGE=/private/exact54.html \
GC500_LABOUR55_BASE=/private/exact54.1.html \
GC500_V1255_TEST_BASE54=/private/exact54.html \
GC500_V1255_TEST_BASE541=/private/exact54.1.html \
python -m unittest discover -s 03_GC500_Delivery_Control/v12.55_ruled_labour_DRAFT/tests -p 'test_*.py' -v
node 03_GC500_Delivery_Control/v12.55_ruled_labour_DRAFT/tests/test_finance.cjs
```

Native acceptance requires exact `BASE`, `BASE_SHA`, `CANDIDATE`, `CANDIDATE_SHA`, private `STATE`, independently reviewed private `EXPECTED` and private `OUT` paths. Run `tests/native_contracts.cjs` under `/tmp/gc500-browser.lock`; diagnostic `CAPTURE_ONLY=1` is not acceptance. Run `tests/native_preservation.cjs` on its base/candidate route captures. All browser tests use the shared read-only harness and are serial.
