# v7.44 — add sub-hired gear and show its asset numbers (ready, not live)

Author: Andrew Fisher

Andrew, 30 Sep 2026: “I still don't have a option to add subhired gear. and the 350 did not have a install charge on it”.

Built and tested on 30 Sep 2026. Awaiting approval to upload; the live page remains v7.43. No live-record changes were made.

## Sub-hired gear

“Add sub-hired gear” is now directly in each reference's drawer. It accepts the supplier and one or many fleet numbers, preserves short numbers and leading zeros, and can record a unit whose number is not known yet. The Sub-hire register also has a location selector and the same entry action.

Entries use the existing supplier-labelled units record. Duplicate numbers are refused before they can overwrite a unit, accessory or another location. The existing number field on a marked sub-hired location now uses that supplier's record instead of adding a Coates asset number. Existing supplier units can still be placed, moved and cleared on drawings.

Marking the whole location as sub-hired is a separate confirmation. Removing its Coates numbers is an explicit, unticked choice. Mixed records remain visible and supplier banners attribute only that supplier's own units. The view link explains that adding gear requires an edit link.

## Supplier asset numbers

Andrew, 30 Sep 2026: “subhired gear has asset numbers … they all still say no asset number please fix”.

The live record already holds 23 supplier asset numbers at WC31, WC41, WC42, WC43 and WC81. Several displays checked only Coates allocations; the generic unit formatter also labelled short supplier numbers as item codes. Nothing needs re-entering.

The draft reads supplier-number records separately and shows the supplier and its asset numbers on the drawer, equipment and driver cards, load brief, register, Change deliveries, search results, shared driver message, email rendering and printed drop sheet. Leading zeros and short numbers are preserved. Missing supplier numbers remain explicitly unrecorded; quantity-only gear remains not numbered. Removed units stay removed. The driver card and registers also stop showing Coates Rental IDs or branches on a location marked wholly sub-hired; the underlying records are retained.

This is a display-only projection. Supplier numbers are not added to Coates allocations, inventory quantities, labour units or price calculations. No live record is rewritten or migrated.

## GN20 — the 350

GN20 requests 350 kVA and carries allocated 365 kVA asset 1276701, contract 9961976 line 6. The existing card has no agreed 350 kVA install amount, so the install tick is unavailable. The drawer now prominently says “Install charge needs a rate”.

Andrew confirmed on 30 Sep 2026: “go same as the 315kva price”. This approves using the 315 kVA card install component for GN20 only; hire and demob pricing remain unchanged.

The amount is not implemented yet. The active embedded card is `street_2026`, selected 25 Sep 2026, but its matched-item subset does not contain the 315 kVA row. The original `sources/pricing/Rate_Card_2026_1.xlsx` (SHA-256 `4960526a7af8114241b86600b3090c4176c4e395f48e11c335036a81ab7fc1e6`) and full parsed `print/rate_card_2026.json` are absent from the checkout. Recover the original row and verify its install component before assigning an amount. Existing generator rows split combined `Labour 2024` equally between install and demob; do not use the entire combined figure as an install charge. No installation tick was changed and no charge was added.

## Checks

- Build: all five inline scripts parse; no new API keys or edit key in the page; author line present.
- Sub-hire practice: 20/20 desktop and 20/20 phone. Writes captured in isolated browsers, with zero writes to the live record and no Coates asset-number writes. Includes permissions, mixed gear, duplicates, short numbers, leading zeros, unnumbered units, supplier persistence, explicit marking and drawing placement.
- Supplier-number display: 95/95 desktop and 95/95 phone, including the five affected live locations, mixed ownership, unmarked suppliers, short numbers, leading zeros, unknown/partial numbers, escaped supplier names, removed units and wholly sub-hired rental-label exclusions. Rendering leaves the record and financial figures untouched. The initial 72-check suite reproduced 60 failures against the live v7.43 page before the fix.
- Desktop and phone sweeps: 21 tabs and seven deep links each, zero page errors, console errors or navigation exceptions.
- Phone screenshots inspected after drawer animations settled; drawer fits the 390 px viewport. The practice screenshot contains deliberately added test units, not live additions.
- Financial comparison: all 202 references' hire, accessories, labour, transport, totals, labour units and labour plan are identical before and after. Labour charged remains $16,916.25. See `evidence/money_comparison.json`.
- Upload dry-run: live base unchanged, HTTP 200 edit-level access. No upload performed.
- Applying the patch twice is refused before changing the build.

Build: 8,329,776 bytes; SHA-256 `66dc8be2b0536471feafb65b1716ceb2f52a201d0076ba4c1ff02d0c26f50435`.

## Build and review

From `03_GC500_Delivery_Control/`:

```bash
toolchain/build.sh v7.44 v7.44_subhired_gear_and_install_charge/patch_v744.py
CHROMIUM_PATH=/usr/bin/chromium PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/subhire_tests.js
CHROMIUM_PATH=/usr/bin/chromium MOB=1 PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/subhire_tests.js
CHROMIUM_PATH=/usr/bin/chromium PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/install_notice_test.js
CHROMIUM_PATH=/usr/bin/chromium PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/supplier_numbers_test.js
CHROMIUM_PATH=/usr/bin/chromium MOB=1 PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/supplier_numbers_test.js
```

Use the shared harness for both full sweeps. After upload is authorised, recheck the live base, upload with the shared toolchain, verify the served bytes, then record the live time and clear the claim in `STATUS.md`.
