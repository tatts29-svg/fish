# Supplier programme pricing projection

Author: Andrew Fisher.

The parent `patch_v1014.apply(html)` applies both the display and pricing layers to the exact live base. Internally this module runs after `apply_display`; do not apply it a second time. This module contains no operational supplier invoice amounts. Source evidence and native allocation remain in the shared record.

The native P/O field is `supplier_pricing`: schema 1, AUD, ex GST, supplier_code and branch snapshots, source `{file, sha256, date}`, records `{id, number, book, date, lines}`, dated team-leader extras, and independently approved total. Each line supplies column, name, qty, unit, rate and optional amount. Negative clean quantities are commercial credits, separate from site quantities. Blue records have empty priced lines and remain counts-only.

The shared `supplierPricing1014()` model exposes orders, records Map, extras and issues. Order fields include valid, errors, red, green, extrasTotal, total and difference (source less editable P/O value). A changed P/O value never reprices dockets. Supplier identity, source identity, work date, uniqueness, decimal amounts and total are checked before applying an allocation.

Consumers retain customer `lines` and `cost_total`. Supplier `paid_total` and separate `supplier_lines` feed costs, P&L, Finance and trace/map summaries. Source-specific green rates remain independent of future generic rate edits; dated team leaders enter Installation — External Contractors once. Native physical quantities, customer rates, invoices, receipt and payment status are not changed by this projection.

Run `node pricing1014/test_supplier_core1014.cjs`. Frozen private integration tests are coordinated by the release owner and independent reviewer. The normal required release checks still apply.

Location handover: the current approved source allocation has 33 recorded areas, eight existing reviewed schedule associations, no native map references and no reviewed map geometry associations. The P/O detail reads current location/reference from the matched record, and shows schedule/source links only while the existing programme review validates. An installation-plan document/page is source context, not a geolocated map pin. Map matching is therefore incomplete; this change creates no inferred asset references or map positions. Private coverage is recorded in `po-location-coverage.json` outside the public repository.

The requested P/O card is excluded from the older operational-view cleanup that removes money columns and prose. Its reference, amount and reconciliation must remain visible in the actual rendered Fencing DOM, including narrow mobile layouts.
