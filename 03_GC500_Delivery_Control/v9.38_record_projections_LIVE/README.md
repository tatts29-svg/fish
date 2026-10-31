LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Physical item labels and Inventory ownership — v9.38

Author: Andrew Fisher

READY FOR COMBINED INTEGRATION; not separately published.

WC31's recorded Event Portables unit was labelled as an accessible toilet in the door-side controls, despite the physical-unit register identifying a 16Pan Block. The door label now follows the existing physical identity and retains its original saved-side key. T0103's two identified VMS boards were reported as unnumbered, without their supplier in Inventory. Inventory now uses the existing board identities for the ownership split, supplier totals and Coates-number drill.

The change does not change records, fleet identities, photographs, work ticks, on-site quantities, schedule quantities, dates, cancellation rules, unloading choices or financial calculations. An incomplete or ambiguous VMS arrival retains the existing breakdown: the page never chooses an arbitrary subset of boards. Existing item-only door controls and saved side records remain intact.

`gcUnits925(a, {loading:false})` provides the same physical identity projection without calling the door resolver. This avoids a dependency loop. Native loading rows are cached only within one unit-model read; there is no persistent cache. The ordinary API still includes each unit's loading ID.

Apply `patch_v938.py` to live v9.34 or the integrated v9.37 candidate. The patch uses guarded replacements, refuses reapplication, and changes the footer to v9.38. It has been built on both accepted bases.

Verification:

- 18 synthetic identity/ownership tests pass, including partial arrivals, duplicate identities, supplier totals, preserved spares and saved door keys.
- Paired native-page tests use a fresh authenticated read, then replay that identical private snapshot for the candidate. All network writes are denied before navigation and native save functions are trapped.
- All 182 reference projections compared. Only WC31's door item label/loading ID changed. Only T0103's Inventory ownership breakdown changed. Every Inventory quantity, all operational data, Today/Equipment/Timeline totals and the captured financial models remained identical.
- Native loading-sheet output uses the correct WC31 block label. Historical delivery records outside the active equipment register remain available in the Journal.
- Desktop and true 390px phone tests passed with no runtime errors. The desktop door panel, phone unit panel and supplier drill were visually inspected. A stable phone recapture confirmed the drawer fits from x=0 to x=390; the first capture caught its opening transition.
- 43 inline scripts parse; the shared page/secret check passes. One Google map setup POST was denied in the desktop run; no operational save was attempted.

Tested integration base: `35ff0ab8c354de151f96da4502e8958d1de88662e9d459e20bff55b1e28adcf0`.
Tested candidate: `d151cc09a83d3af8097557e3502694495243fbe16cddfde2361aed9b4f39af4b` (12,300,134 bytes).
Sanitised results are in `evidence/`. Full authenticated records, model captures and screenshots remain private. The release owner performs final combined checks and publication.
