**VERIFIED LIVE — 9 Oct 2026 05:51 AEST, combined v9.34.** Author: Andrew Fisher. The full served page matches SHA256 `b881e8890e8a590fea79ac63657fd43254c5ccdd11735d7f70a1b4874773c33c` (12,295,093 bytes). All 22 tab routes, eight direct links and Back passed on phone and desktop. Final public 390px/1440px checks passed for the supplier route, product information, two VMS units and per-item photo targets; operational record remains 4633. Detailed component evidence below includes the earlier scope candidates. Final combined evidence: `../v9.34_navigation_LIVE/evidence/combined_release.json`.

# v9.33 — individual equipment and photographs

Author: Andrew Fisher.

Released with the tested combined v9.34 page. Starts from public v9.28 (`592e73b38e8c5fb1d5bf98d00915c49550ab860b322f82fb957a99acc0369093`); production patch accepts v9.32 as well. It refuses another application or a different base.

Andrew asked for the mixed VMS location to show the two actual boards and for each item, including the WC09 toilets, to have clear ownership and its own photographs. T0103 now projects Coates 1211404 / VMS09 and PremAir Hire 120T / VMS10, registration V14221. The superseded physical placeholder is resolved through its exact contract and line, never by a global fleet-code replacement. Original contract rows, stored units, work, quotes and financial inputs are untouched.

Each physical item has a compact card with its company, Add photo and View photos. Known supplier items say “SUB-HIRED — company”. WC09 defaults to its identified blocks; planned Event Portables FWF/Pee Panel quantities remain a separate description with no fabricated physical identities. WC20's photo targets include both waste tanks. Existing location photos stay separate, and historical item/photo associations remain visible.

Adding a photograph uses the existing native phone outbox and one-document-per-photo storage. It chooses the first unused place across canonical IDs, uniquely matched legacy asset numbers and pending uploads. Full sets offer explicit replacement; there is no implicit replacement. Unit identity, photo association, editing capability and actor are checked again after image preparation. Replace and Remove retain and recheck the original photo home. Geographic pin IDs remain native numeric IDs, separate from canonical photo IDs. The ambiguous old quick uploader and repeated strip are removed when the item cards are present; the native detailed photo record tools remain available in their existing fold.

The patch changes only the owned unit-row/panel functions and photo integration. It preserves v9.32's company navigation. A scoped drawer Workers text rule uses the drawer theme colours; Timeline styling and controls remain unchanged.

Validation:

- 12 identity/association tests, 11 captured native upload freshness tests and 5 history/removal regressions pass.
- Independent focused source review passed 10 checks, including stale Replace ownership isolation.
- Actual public-record desktop 1440 px and phone 390 px: two VMS units, WC09 photos preserved, four canonical WC20 photo targets, no overflow or page errors.
- Both actual file-input tests reached native image preparation and captured the native outbox entry for WC09 1268858, slot 2, with no previous photo and no record changes. Live writes were blocked; no files were uploaded.
- Phone and desktop screenshots inspected privately. All 37 inline scripts parse; no new keys or financial input changes.
- Last browser-tested source precedes only the historical-item visibility fold and friendly native Remove confirmation. The five isolated history/removal regressions and final script parsing cover those final changes; root will test the exact combined page.

Private detailed results/screenshots: `/workspace/private-items933/`. Portable summary: `evidence/browser933.json`. Current scope candidate SHA256: `78f04d735a06dd386ddc3379e719161cca86421402befdc1a90bd1e26e9bd13b` (12,274,245 bytes).

Run:

```sh
node tests/test_items933.cjs
node tests/native_photo933.cjs
node tests/history_remove933.cjs
# PAGE points to the combined candidate; browser use is serialized externally.
node tests/browser933.cjs
```
