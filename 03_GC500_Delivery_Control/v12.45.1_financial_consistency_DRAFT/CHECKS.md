# v12.45.1 financial consistency checks — READY TO UPLOAD

Author: Andrew Fisher.

Independently verified LIVE predecessor: v12.45 on v12.43.1, SHA-256 `63856220d5541f3e1f66b0bc2ea4bc98cdecee6f41d9804baf59401ffbc9ba57`. Its release archive is now `v12.45_map_smoothness_LIVE`; the retention test resolves the live archive safely.

The shared financial build reproduces the tested preview byte for byte: SHA-256 `2af6d293843be7165e0ac6a0b05e7ce1d8263ab968a62ab30c14f009599253d5`, 16,067,319 bytes. Frozen implementation/tests source: `2a16030f409d05f5a277bd6c56baf7e454b5362f`. READY TO UPLOAD, not live.

The water/FWF helper files and their integration helper are byte-identical to the checked v12.44 draft. The release wrapper requires the exact reviewed v12.45 SHA and footer, retains the off-site ring/picture-cache/map implementation markers, rejects any pre-existing financial helper and emits v12.45.1. The predecessor also includes the closure-satellite coordinate-origin and matrix correction; both new map source blocks are covered by the retention test.

The added customer fencing-hours projection reads the existing documented contractor aggregate directly inside the shared event-scope function before totals are calculated. Its customer completeness comes from the existing source validation and deduplication independently of supplier pricing. It keeps the customer rate, source day plan and supplier calculation intact. No individual/daily customer allocation or record write is introduced. The original plan is collapsed and labelled as reference evidence; the compact summary shows the corrected aggregate together on a phone. Ineffective daily customer-hour controls are omitted for this aggregate; the customer rate control remains.

Incomplete or ambiguous customer hours use the existing missing-charge/review paths, with null hours and amount, an explicit known subtotal and unavailable reconciliation. They neither fall back to the source plan nor throw during financial rendering. Supplier-only pricing conflicts retain confirmed customer hours. The source access-plan provisional flag remains independent.

Completed offline checks on this predecessor and preview:

- 69 synthetic customer-water preservation and quantity-description checks, including ordinary rows and missing adjustment metadata.
- 44 synthetic combined-FWF checks, including cents, branch/category preservation and refusing changed/ambiguous source evidence.
- 24 extracted-native regression assertions across three tests: FWF tick projection, existing financial holds, and explicitly partial demob detail.
- 41 synthetic/extracted customer fencing-hours checks. These include the actual documented-reader memo and native scope function: repeated scope reads resolve the evidence once, and normal native invalidation after a source change updates the hours and customer cents. They also cover complete/conflicted evidence, source preservation, explicit zero rates and retained-plan UI controls.
- 96 existing-reader differential checks: confirmed customer hours remain available through supplier-only quote/rate/journal/allocation conflicts; missing, duplicate or invalid source evidence stays unavailable. Existing supplier results remain byte-equivalent, and the reader keeps its native memo and invalidation.
- Nine source/boundary tests. These reject wrong hashes, changed bytes, five wrong predecessors, four missing predecessor markers, all four partial financial-helper states and repeat application. They also prove exact retention of all ten map45 source blocks and all 12 non-footer v12.43.1 replacements, plus unchanged water/FWF helper files.
- Shared page checker: 214 inline scripts pass; author and credential checks pass with no new credentials.

Completed native checks on this exact preview, using the same fresh frozen record for all sessions:

- 176 financial and preservation checks. All current reconciliation ties and branch-cent checks pass. Customer changes are limited to the existing water inclusion, approved combined labour treatment and documented fencing-hours correction. Supplier results, source contracts, original scope plan, category/branch attribution and operational documents are preserved.
- 41 review-rendering checks using isolated resolver inputs for hydration, duplicate source evidence and a supplier-only pricing conflict. Missing customer evidence remains null and visibly excluded from a known subtotal; reconciliation is incomplete. Supplier-only review retains confirmed customer hours. The complete-current model and source documents are restored exactly afterward.
- Affected phone read-back passed with all four screenshots inspected: included water, combined FWF explanation, partial demob detail and compact documented customer fencing hours. Hours, customer cents and rate fit together within the phone width with separated labels. The original daily plan remains collapsed; the customer rate control remains once and ineffective daily/water controls are absent.
- Phone model read-back matches the native financial baseline for customer/direct totals, ledger, supplier/service objects and source documents. Every session reports zero runtime errors, console errors and HTTP write attempts.

The original v12.44 preview `ef9363be5b7ed4b3ed4d258b1e192eeec4fa973e4a2b451a4caca7590112373a` and its historical native checks remain in the original draft folder. Current acceptance above is based on this rebased candidate rather than that historical run.

Both final shared full-page sweeps passed: desktop and phone each cover 27 tabs, seven deep links and Back navigation, with zero runtime errors, console errors or operational write attempts. A fresh record read after the sweeps exactly matched the tested snapshot. The shared build from the independently verified live predecessor matches the final tested candidate byte for byte. If the source or record changes, rerun affected comparisons against fresh evidence before publication. A separate Codex source review checked the bounded reader and review-state integration, and the public files were checked for private evidence leakage. Codex owns these build checks; no Claude independent review is claimed.

The separate original-Baseplan and approved-exception review remains pending; this consistency repair does not certify a final invoice or settle missing business evidence. No timing acceptance claim is made.

Evidence contains native operational and financial data and stays in authorised private storage. Do not copy the native JSON, screenshots, amounts, source attachments or record contents into this repository or coordination comments. Public results here describe checks and hashes only.

Codex builds/tests the final source. Claude uploads only after a READY handover naming the exact source commit, verified live predecessor and final candidate hash. The guarded upload must refuse a changed live base and prove full live byte equivalence before this is reported LIVE.
