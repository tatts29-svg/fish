# Source-row customer forecasts

Author: Andrew Fisher

Schedule (7), Event Week rows 49 and 50 request one FWF each for Brad Jones Racing and Shell V-Power on 22 October. The original Baseplan customer contract has no matching hire line or suitable generic nonserial aggregate for either request.

`patch_finance996.patch(html)` runs after the supplier patch. It passes missing source requests through the existing labour and transport forecast calculations, and adds uncovered hire to the existing Rehire Revenue, P&L, branch and Finance handover forecasts. It does not change operational assets, arrivals, supplier quote costs, recorded actual charges, or customer contract records.

The original card supports $257.95 per request: hire $90.07, install $36.44, demob $36.44, delivery $47.50 and pickup $47.50. Both requests total $515.90 excluding GST. KINP follows the existing toilet contract allocation and remains explicitly provisional until a native reference or exact contract supplies the branch. The shared resolver holds cancelled and ambiguous matches; an additional finance guard prevents two requests from claiming an entire merged native quantity. Exact matching customer hire coverage replaces the estimate.

`source_review996.json` records original file hashes, source rows, cells and limits. `test_finance996.cjs` runs 24 focused pure checks; its evidence is in `model_checks996.json`. `browser_finance996.cjs` is a read-only phone integration test and blocks every non-GET request. Pass `PAGE` for the exact candidate and `OUT` for private evidence, under `/tmp/gc500-browser.lock`. Its evidence records both candidate and source hashes. Final integrated browser verification is pending.

This is limited to the two source requests. It does not resolve unrelated contract quantity differences or certify the whole event's finances.
