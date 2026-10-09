# Customer install and demob charges — v9.52

Author: Andrew Fisher

READY TO UPLOAD. Original workbook row22 supplies Pee Panel labour columns; customer install/demob rates apply to owned and sub-hired equipment. This adds missing Pee Panel labour matching, leaving its separately unconfirmed hire price untouched. Native physical supplier identities now permit individual labour charges and retain the unnumbered remainder. Existing reference ticks and exact per-line rounding are preserved. The editor drawer explicitly distinguishes recorded customer labour, work remaining and demob/cleaning forecasts; supplier invoices remain Costs.

Independent source review confirmed row22 against workbook SHA60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6, printed heading years preserved. Single-unit remainder and ambiguous bare-number ownership guards are verified. Frozen-record browser proof preserves every existing charged amount across176 locations and verifies one supplier unit plus remainder without charging five untouched siblings. Desktop/phone route and deep-link sweeps pass, no runtime errors or attempted writes; phone summary inspected. All tests are read-only. Actual supported completion-charge reconciliation is a separately backed-up native record update, not performed by this patch or these tests. Arrivals and allocated fleet numbers alone do not create completion ticks.

GN20 retains its previously approved installation-only315-kVA basis; demob remains unresolved. FWF cleaning remains zero per the original card. No invented supplier prices, crew costs, quantities or rates.

Build: toolchain/build.sh v9.52 v9.52_install_demob_charges_DRAFT/patch_v952.py.
Tests: PAGE=build/GC500_v9.52/GC500_Delivery_Control_hosted.html node v9.52_install_demob_charges_DRAFT/tests/identities.cjs. Browser proof takes BASE952, PAGE, STATE952 and OUT952, uses shared browser lock. Private snapshots and financial output stay outside Git.
