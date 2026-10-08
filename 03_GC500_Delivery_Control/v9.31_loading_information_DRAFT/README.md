Author: Andrew Fisher

DRAFT — populated loading information for delivered products. Publication belongs to the combined release task.

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

Validation in progress: 45 owned model assertions and 21 independent model assertions pass. The intermediate live-v9.28-plus-v9.31 candidate passes the shared page parser/secret checks. Focused actual-page phone and native A4 checks follow before release. Tests read production only; stored-evidence fixtures are isolated memory.

Files: `core924.js` retains existing identity/assessment semantics; `information931.js` resolves products and source facts; `runtime931.js` renders read-only information; `patch_v931.py` replaces exactly one old module and accepts release bases v9.28–v9.30.
