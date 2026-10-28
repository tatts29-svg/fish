# v12.45.1 financial consistency — READY TO UPLOAD

Author: Andrew Fisher.

This carries the checked v12.44 financial scope forward after v12.43.1 and v12.45, with the separately confirmed customer fencing-hours correction. The original v12.44 draft remains intact. Its water/FWF helpers are unchanged; the release wrapper requires the exact reviewed v12.45 predecessor, including its map changes and the retained v12.43.1 off-site rings and picture cache. Implementation identifiers ending in `1244` are deliberately retained.

The Finance ledger already excludes water included in pump-out charges. The shared servicing total still includes those separate customer amounts, so the headline and branch views disagree with the ledger. This patch applies the existing inclusion rule once in the shared customer servicing projection. It retains the source rows and original customer figures for reference, displays their inclusion clearly, and preserves all supplier quantities, rates, amounts and quote objects.

The existing water override inputs are omitted for the included lines so users cannot edit a rate that has no effect. Financial explanations use the current inclusion rule. The Consumables Recovery ratio waits because the current customer contract consumables and supplier water cost are different scopes.

Where the existing Baseplan adjustment changes a customer servicing quantity, the table now describes that approved customer quantity and shows the site quantity separately for reference. The label is computed from the existing adjustment metadata; ordinary descriptions and all quantities, rates and supplier calculations remain unchanged.

The existing FWF install-and-demob approval was applied only to the headline calculation. The shared FWF projection now applies the same combined adjustment to labour totals, the existing contract branch and labour-plan aggregates. The two existing source rows must still agree with the approved combined amount and the current single recorded branch. A changed or ambiguous allocation is rejected. Individual installation/demob amounts, physical ticks and forecast slots remain intact; a separate combined-adjustment row explains the difference without inventing an installation/demob split.

The shared event-scope projection also applies the established customer fencing-hours decision from the existing documented contractor reader, at the existing customer rate. The reader exposes a customer aggregate from its existing source validation and deduplication, before the separate supplier-pricing checks. A supplier-price review therefore leaves confirmed customer hours intact. Genuinely incomplete or ambiguous customer evidence remains unknown: the existing missing-charge and review paths label the known subtotal and prevent complete reconciliation, without substituting planned hours or interrupting rendering. The source access-plan status keeps its original meaning.

The original scope hours, amounts and daily plan remain as reference evidence in a collapsed disclosure. A compact summary shows customer hours, charge and rate together on a phone, with no invented daily or individual split; the existing customer rate control remains available. The reader uses its existing render memo, and normal invalidation refreshes the projection when contractor records change. The supplier model is not used as a customer-rate source, and the customer projection never calls the supplier model back.

No new business decision, contract rate, source quantity, operational record or supplier cost is changed. The patch does not replay earlier operational reconciliation runners.

The financial labour plan also applies the same existing held-reference exclusion as the headline and tick models before adding fire-extinguisher slots. This removes already-excluded charges from that detailed financial view while retaining the physical equipment and its recorded ticks. Demob-only detail remains explicitly partial where the approved combined FWF adjustment has no installation/demob split.

The patch requires an explicit matching `GC500_V12451_BASE_SHA256`, exactly one v12.45 footer, and the predecessor implementation markers. The v12.45 predecessor is independently verified LIVE at SHA-256 `63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57`. The shared build reproduces the tested financial candidate exactly at SHA-256 `2af6d293843be7165e0ac6a0b05e7ce1d8263ab968a62ab30c14f009599253d5` (16,067,319 bytes). The fresh native financial/document comparison, incomplete-evidence rendering checks and affected phone read-back described in `CHECKS.md` have passed. Both final shared sweeps pass all 27 tabs, seven deep links and Back navigation, with zero runtime errors, console errors or operational write attempts. The current record was fetched again after the sweeps and exactly matched the tested snapshot. The earlier v12.44 checks are historical evidence, not current acceptance.

Frozen implementation/tests source: `2a16030f409d05f5a277bd6c56baf7e454b5362f`. READY TO UPLOAD, not live. Before/after figures have been shown to Andrew in his private conversation; this bounded repair implements his existing instructions and standing fix/go-live authority. It does not ask for a new business decision. Claude owns the guarded publication and must require an exact rebuild, run the expected probes below and prove the public bytes before reporting LIVE.

```sh
GC500_V12451_BASE_SHA256=63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57 \
  bash 03_GC500_Delivery_Control/toolchain/build.sh v12.45.1 \
  03_GC500_Delivery_Control/v12.45.1_financial_consistency_DRAFT/patch_v12451.py
```

This is a consistency repair for existing approved customer rules. It does not complete the separate review of original Baseplan records or confirm pending approved exceptions, and it is not a final-invoice certification. Codex builds and tests; Claude uploads only the final READY source through the guarded process.

Checks:

```sh
node tests/test_customer_water1244.cjs
node tests/test_fwf_labour1244.cjs
BASE=/path/to/reviewed-v12.45.html PAGE=/path/to/reviewed-v12.45.1.html node tests/test_customer_fence_hours12451.cjs
BASE=/path/to/reviewed-v12.45.html PAGE=/path/to/reviewed-v12.45.1.html node tests/test_customer_event_reader12451.cjs
BASE=/path/to/reviewed-v12.45.html python3 tests/test_patch_v12451.py
BASE=/path/to/reviewed-v12.45.html python3 tests/test_native_fwf1244.py
BASE=/path/to/reviewed-v12.45.html PAGE=/path/to/reviewed-v12.45.1.html STATE=/private/frozen-current-state.json OUT=/private/results node tests/financial_native.cjs
PAGE=/path/to/reviewed-v12.45.1.html STATE=/private/frozen-current-state.json OUT=/private/results node tests/customer_hours_review_native.cjs
PAGE=/path/to/reviewed-v12.45.1.html STATE=/private/frozen-current-state.json OUT=/private/results MODEL_BASELINE=/private/results/financial-native.json node tests/ui_readback.cjs
```

The focused synthetic tests preserve the source input and supplier object, remove only the four recognised included water customer charges, retain unrelated service lines, and prove repeat projection does not change the result. FWF checks preserve category/branch attribution and physical evidence while applying the existing combined adjustment to cents. They also reject missing, duplicated, changed or ambiguously allocated source rows. Customer fencing-hours checks cover exact decimal products, valid zero rates, source preservation, explicit review of partial/conflicted evidence, supplier-price independence, the actual native memo invalidation and the reference-plan presentation. The native review gate rehearses hydration, duplicate evidence and supplier-only conflict using the existing resolver, renders the affected views, then restores the provider and proves source documents unchanged. The native-function differential test runs the actual patched tick calculation over synthetic bulk/per-unit/held/unknown inputs. Patch tests reject wrong hashes, modified bytes, wrong predecessors, missing predecessor implementations and repeated/partial financial application. They also prove that all ten map45 replacement blocks and the retained 43.1 replacements are byte-equivalent, and that the water/FWF helper files match the checked 44 draft.

Keep `MODEL_BASELINE` from the same fresh snapshot and final candidate used by the focused phone check. Native evidence, screenshots, original records and financial detail stay in authorised private storage.

Expected read-only uploader probes on the unchanged, complete tested record:

- Headline customer revenue equals the recorded Revenue ledger to cents; all reconciliation ties and branch-cent checks pass.
- Financial labour-plan charged total equals the tick total; recorded labour equals the installation total. The approved FWF combined adjustment appears once, with demob-only detail explicitly partial.
- The customer fencing line uses the confirmed aggregate from `EventCrew1237.model().customer` at its existing customer rate, rounded once by `EventCrew1237.product`. Shared event scope, supplier model's customer reference and the fencing summary agree. The original plan remains reference evidence.
- Recognised included-water customer lines have no separate charge; supplier quantities, rates, costs and quote objects match the private pre-release comparison.
- Contracts, operational documents, source plan, price categories and branch attribution match the private pre-release comparison. Runtime/console errors and HTTP write attempts remain zero.

Keep native amounts and record comparisons private; the public handover reports pass/fail and exact hashes. If the record has changed or customer evidence is incomplete, review the new source and its explicit known-subtotal state before claiming that these complete-record expectations still apply. After guarded upload, verify the exact live bytes, footer and affected phone content before reporting LIVE.
