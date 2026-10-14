# Navigation and interaction audit

Author: Andrew Fisher

Source: live v10.15, SHA256 `bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67`.

The current-record mobile audit passed 72 checks across 22 routes: native destinations, open disclosures and reading positions after background updates, browser Back, a supplier reference drawer staying open, and drawer Back remaining closed after refresh. The native record did not change and no operational writes or runtime errors occurred. This is focused coverage, not a claim that every possible edit path is correct.

Two separate reproducible defects were found:

- **Cold shared reference link (P2):** on a fresh browser, `#asset/FL01` was replaced with `#plant` while the connection was still starting. Once the complete record arrived, FL01 existed but its link had already been rejected. `route()` validated against incomplete local assets and `routeReject810()` permanently replaced the address.
- **Map background update changes drawer address/history (P2):** the asynchronous map setup redraw replaced `#asset/WC57` with a sheet address while the reference drawer stayed open. Later refreshes added more history entries. `renderMap()` unconditionally updated the sheet address even while the drawer owned navigation.

Both corrections are implemented in the bounded `v10.16_audit_fixes_LIVE/flows` component for root integration and final release checks. They preserve native close/navigation controls, source data and map presentation.

The optional legacy `[data-mapsheet]` button is absent in the current P33 drawer, on both original and candidate pages. It was not exercised or counted as an application error. Actual Show on map and explicit sheet-address navigation are covered instead.

Private reproduction screenshots, the captured live HTML and detailed browser evidence remain outside Git. The public baseline summary contains check results only.
