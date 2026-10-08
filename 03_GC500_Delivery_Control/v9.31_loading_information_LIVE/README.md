**VERIFIED LIVE — 9 Oct 2026 05:51 AEST, combined v9.34.** Author: Andrew Fisher. The full served page matches SHA256 `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c` (12,295,093 bytes). All 22 tab routes, eight direct links and Back passed on phone and desktop. Final public 390px/1440px checks passed for the supplier route, product information, two VMS units and per-item photo targets; operational record remains 4633. Detailed component evidence below includes the earlier scope candidates. Final combined evidence: `../v9.34_navigation_LIVE/evidence/combined_release.json`.

Author: Andrew Fisher

Released with the combined v9.34 page: populated loading information for delivered products.

Andrew clarified that load-restraint information is supplied information, not a form for branches or drivers to complete. It must appear against the product being delivered, without a read-and-find or model-selection workflow.

This patch replaces the v9.24 restraint rendering module. Equipment drawers, individual load panels, pick-up loads, driver/drop sheets and Demob sheets show the same automatically resolved product facts and relevant loading guidance. Existing unloading and door-side controls remain native. Known per-unit Rehire ownership is labelled `SUB-HIRED — supplier`; mixed ownership is not attributed to an entire reference.

The source hierarchy is explicit:

- Existing actual specifications are shown as recorded actual only when the same physical identity, named verification and source remain valid. Saved evidence is retained read-only.
- Exact Coates fleet matches use the original hire-contract description. Explicit contract dimensions are labelled a contract-listed footprint; they do not become transport height or mass. Generic description evidence can supply the same explicitly stated footprint, but another numbered asset cannot supply a unit's dimensions.
- The supplied generator capacity before `DEL AS` takes precedence over the requested/billed capacity. No financial source or charge model changes.
- Compatible catalogue figures appear as a named guide reference, or as a range across matching source models. Skid generator references say skid-mounted. Trailer generators do not inherit skid specifications. LED, hybrid and POD lighting do not inherit JLG hydraulic dimensions. Unknown or Junior VMS boards do not inherit Senior dimensions.
- Missing figures are omitted. Every recognised product receives concise loading guidance directly, without a blank field, verification checklist, model picker or save button. Guide limits are guidance conditions, never actual equipment weights.

Delivery demand comes from `dpItems(r)` and Demob demand from its actual stop parts. A partial or incompletely allocated quantity retains its product quantity without assigning all reference-level fleet numbers or slicing an arbitrary subset. Known complete groups are split by their own unit counts and evidence.

No operational documents, financial models, loading-side records or catalogue source values are rewritten. Stable unit identity, stored evidence and fail-closed numerical APIs remain available. This display does not approve load sharing or restraint. The existing driver pre-departure workflow remains; the extra v9.24 data-entry demands are removed.

Original source: Coates Load Restraint Guide 2023, 140 pages, SHA-256 `67c2d6442f6b22c7a0cc5f933275cf56463686a96763bf977a9713a40a96ccb0`. The existing 274-row source catalogue is reused. Hire-contract descriptions were checked against the original source workbook by the parallel source audit; source-specific evidence remains private.

Validation: 62 owned model assertions and 23 independent assertions pass. The actual-page phone review confirmed correct WC09 movement scope, WC20 blocks/tanks, read-only view and edit rendering, unchanged native state and financial outputs. Its original GN19 classification finding was corrected: native bare `60kva` now resolves the source-supplied 80 kVA. A focused follow-up on candidate `71437b728ca42f0ba7e1592cf750f5f5007a1a0dd29e3f8243624457c0fda7c7` verified that correction, exact supplier labels, strict VMS/tower exclusions and readable 390 px Timeline captions. Zero runtime errors and no operational writes; state remained byte-identical in memory.

The native driver-print pipeline produced two loading-information supplements for a four-product load. Its complete nine-page output includes the existing driver sheets and photographs; every information page and footer fits A4. The PDF was rendered and visually inspected, alongside the corrected phone-width screenshots. The separate phone review used true mobile emulation; the follow-up used a 390 px viewport in the native PDF-capable context. Private evidence: `/workspace/private-loading931-final/` and `/workspace/private-loading931-independent/`.

Four bounded final source corrections after that browser candidate are explicitly covered by model checks and independent source review: movement-event scope on drop sheets; correct links for disjoint guide pages; Porta Lisa/accessible exclusions from generic small-FWF numbers/method; and unknown Demob quantities staying quantity-free rather than displaying zero or allocating a retained count. The combined release owns the final exact-page navigation checks. Tests read production only; stored-evidence fixtures are isolated memory.

Files: `core924.js` retains existing identity/assessment semantics; `information931.js` resolves products and source facts; `runtime931.js` renders read-only information; `patch_v931.py` replaces exactly one old module and accepts release bases v9.28–v9.30.
