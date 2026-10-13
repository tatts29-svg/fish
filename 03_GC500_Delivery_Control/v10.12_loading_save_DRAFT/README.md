# Save confirmation, readable controls and shared quantities

Author: Andrew Fisher

State: final candidate checks complete; publication readback pending.

Andrew requests visible Save controls wherever a selection changes a record, readable controls throughout the page, and an audit that changing quantities, prices or status updates the other views. Screenshot21657 identifies loading-side selection and an unreadable Clear button.

The release retains native setters and calculations. Loading and unloading use explicit drafts; other existing autosave fields gain adjacent Save confirmation. Shared confirmation requires the exact changed documents to be acknowledged. Device-only saves and failures remain clearly labelled. Existing specialised Save forms are retained.

The quantity review corrects typed supplier ownership in Inventory and prevents incomplete percentages from rounding to 100%. Andrew's quantity rule is shared across readers: keep an entered quantity; otherwise use the quantity explicitly stated in the description, or one for each separate described item. A rating or size is not a quantity. These description-based counts are valid scope, not missing-data warnings. Ordered quantity, receipt, installation and collection states remain distinct. Source rates, onsite records, media and the approved appearance are retained.

Build from exact v10.11 SHA256 `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557` with `patch_v1012.py`. Final candidate SHA256: `cde0aae30d5e528e85c2b16189bf0c0828397b87a7b3d10c1695362b19a58105` (15,164,541 bytes; 105 inline scripts).

The final candidate passed 17 financial controls, 158 financial propagation checks, 29 numerical propagation checks and 30 percentage checks. All 191 existing charge lines retain their quantities and priceability. Nine previously blank daily schedule quantities now show one, matching their ordered items. On the same native record (5814), 21 of 22 financial model sections are deeply identical; the remaining transport view changes only authorised quantity display and provenance. All charge amounts, rates, billed quantities and branch totals are unchanged. The shared quantity review reconciles 182 active typed groups and 108 fully identified onsite ownership groups.

Save checks cover 26 pure adapter checks, 37 lifecycle checks, 37 actual-page checks and 92 independent checks; the drawer suite passed 72 phone/desktop checks. Loading has 29 pure and 38 browser checks. The final main form retains both its scroll and the edited field position through Save and background refresh. Drawer Reload retains phone position; desktop bottom-of-document clamping remains natural when a temporary message disappears. See `selection_save/COVERAGE.md` for the field families, existing specialised Save forms and deliberate exclusions such as navigation and filters.

Both final 22-route, seven-link and Back navigation sweeps passed. Twelve exact-source guards, standard script/author/secrets checks, 63 independent description fixtures, 99 percentage fixtures, 21 collection checks and 19 ownership checks passed. Readable controls were inspected on phone screenshots and audited through 22 routes and financial subviews on phone/desktop. Contrast evidence uses the combined preview whose CSS is byte-identical to the final build; the subsequent JavaScript changes only mount Save controls before the existing scroll-restoration hooks. Drawer evidence likewise precedes only the final three-line main-render hook, which has separate final native proof.

Root implementation, integration and publication with scoped implementation and independent source/lifecycle reviews; no claim of external-agent combined review. Tests only read the live service and restore all in-memory fixtures. Source rates, raw source data, native operational records and map assets are unchanged. Missing financial source information is not fabricated or treated as zero. Actual-public byte and runtime verification follows the guarded upload.
