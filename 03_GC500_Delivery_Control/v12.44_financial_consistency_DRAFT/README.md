# Financial consistency — DRAFT

Author: Andrew Fisher.

The Finance ledger already excludes water included in pump-out charges. The shared servicing total still includes those separate customer amounts, so the headline and branch views disagree with the ledger. This patch applies the existing inclusion rule once in the shared customer servicing projection. It retains the source rows and original customer figures for reference, displays their inclusion clearly, and preserves all supplier quantities, rates, amounts and quote objects.

The existing water override inputs are omitted for the included lines so users cannot edit a rate that has no effect. Financial explanations use the current inclusion rule. The Consumables Recovery ratio waits because the current customer contract consumables and supplier water cost are different scopes.

Where the existing Baseplan adjustment changes a customer servicing quantity, the table now describes that approved customer quantity and shows the site quantity separately for reference. The label is computed from the existing adjustment metadata; ordinary descriptions and all quantities, rates and supplier calculations remain unchanged.

The existing FWF install-and-demob approval was applied only to the headline calculation. The shared FWF projection now applies the same combined adjustment to labour totals, the existing contract branch and labour-plan aggregates. The two existing source rows must still agree with the approved combined amount and the current single recorded branch. A changed or ambiguous allocation is rejected. Individual installation/demob amounts, physical ticks and forecast slots remain intact; a separate combined-adjustment row explains the difference without inventing an installation/demob split.

No event-hours decision, contract rate, source quantity, operational record or supplier cost is changed. The patch does not replay earlier operational reconciliation runners.

The financial labour plan also applies the same existing held-reference exclusion as the headline and tick models before adding fire-extinguisher slots. This removes already-excluded charges from that detailed financial view while retaining the physical equipment and its recorded ticks. Demob-only detail remains explicitly partial where the approved combined FWF adjustment has no installation/demob split.

The patch requires an explicit matching `GC500_V1244_BASE_SHA256` and a v12.43 footer. Apply through the shared build process only after v12.43 is verified live. Not READY TO UPLOAD. The frozen native comparison passes on this exact v12.43 base, but the release must be rebased and retested after the prioritised map changes. Fresh-state checks, affected phone read-back and both shared full-page sweeps remain required on the final build.

Checks:

```sh
node tests/test_customer_water1244.cjs
node tests/test_fwf_labour1244.cjs
BASE=/path/to/reviewed-v12.43.html python3 tests/test_patch_v1244.py
BASE=/path/to/reviewed-v12.43.html python3 tests/test_native_fwf1244.py
BASE=/path/to/reviewed-v12.43.html PAGE=/path/to/reviewed-v12.44.html STATE=/private/frozen-state.json OUT=/private/results node tests/financial_native.cjs
PAGE=/path/to/reviewed-v12.44.html STATE=/private/frozen-state.json OUT=/private/results MODEL_BASELINE=/private/results/financial-native.json node tests/ui_readback.cjs
```

The focused synthetic tests preserve the source input and supplier object, remove only the four recognised included water customer charges, retain unrelated service lines, and prove repeat projection does not change the result. FWF checks preserve category/branch attribution and physical evidence while applying the existing combined adjustment to cents. They also reject missing, duplicated, changed or ambiguously allocated source rows. The native-function differential test runs the actual patched tick calculation over synthetic bulk/per-unit/held/unknown inputs. Patch tests reject wrong hashes, modified bytes, the wrong predecessor and repeated application.
