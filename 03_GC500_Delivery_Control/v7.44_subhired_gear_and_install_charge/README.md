# v7.44 — add sub-hired gear from the item drawer (ready, not live)

Author: Andrew Fisher

Andrew, 30 Sep 2026: “I still don't have a option to add subhired gear. and the 350 did not have a install charge on it”.

Built and tested on 30 Sep 2026. Awaiting approval to upload; the live page remains v7.43. No live-record changes were made.

## Sub-hired gear

“Add sub-hired gear” is now directly in each reference's drawer. It accepts the supplier and one or many fleet numbers, preserves short numbers and leading zeros, and can record a unit whose number is not known yet. The Sub-hire register also has a location selector and the same entry action.

Entries use the existing supplier-labelled units record. Duplicate numbers are refused before they can overwrite a unit, accessory or another location. The existing number field on a marked sub-hired location now uses that supplier's record instead of adding a Coates asset number. Existing supplier units can still be placed, moved and cleared on drawings.

Marking the whole location as sub-hired is a separate confirmation. Removing its Coates numbers is an explicit, unticked choice. Mixed records remain visible and supplier banners attribute only that supplier's own units. The view link explains that adding gear requires an edit link.

## GN20 — the 350

GN20 requests 350 kVA and carries allocated 365 kVA asset 1276701, contract 9961976 line 6. The existing card has no agreed 350 kVA install amount, so the install tick is unavailable. The drawer now prominently says “Install charge needs a rate”.

The agreed install charge excluding GST is still required from Andrew. No rate was borrowed from another generator size, no installation tick was changed, and no charge was added.

## Checks

- Build: all five inline scripts parse; no new API keys or edit key in the page; author line present.
- Sub-hire practice: 20/20 desktop and 20/20 phone. Writes captured in isolated browsers, with zero writes to the live record and no Coates asset-number writes. Includes permissions, mixed gear, duplicates, short numbers, leading zeros, unnumbered units, supplier persistence, explicit marking and drawing placement.
- Desktop and phone sweeps: 21 tabs and seven deep links each, zero page errors, console errors or navigation exceptions.
- Phone screenshots inspected after drawer animations settled; drawer fits the 390 px viewport. The practice screenshot contains deliberately added test units, not live additions.
- Financial comparison: all 202 references' hire, accessories, labour, transport, totals, labour units and labour plan are identical before and after. Labour charged remains $16,916.25. See `evidence/money_comparison.json`.
- Upload dry-run: live base unchanged, HTTP 200 edit-level access. No upload performed.
- Applying the patch twice is refused before changing the build.

Build: 8,326,501 bytes; SHA-256 `c04fdb09d7cd17783dcb5f54fb6f7b7f1dbf37f3c552eebd511381bcff370100`.

## Build and review

From `03_GC500_Delivery_Control/`:

```bash
toolchain/build.sh v7.44 v7.44_subhired_gear_and_install_charge/patch_v744.py
CHROMIUM_PATH=/usr/bin/chromium PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/subhire_tests.js
CHROMIUM_PATH=/usr/bin/chromium MOB=1 PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/subhire_tests.js
CHROMIUM_PATH=/usr/bin/chromium PAGE="$PWD/build/GC500_v7.44/GC500_Delivery_Control_hosted.html" node v7.44_subhired_gear_and_install_charge/evidence/install_notice_test.js
```

Use the shared harness for both full sweeps. After upload is authorised, recheck the live base, upload with the shared toolchain, verify the served bytes, then record the live time and clear the claim in `STATUS.md`.
