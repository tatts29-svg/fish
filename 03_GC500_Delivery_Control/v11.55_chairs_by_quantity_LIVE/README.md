# v11.55 — pad chairs counted by quantity; a unit identified on a reference carries its number — LIVE

Author: Andrew Fisher. Built on live v11.54 `d23c1278283e5c7225d946d81f7372796f3d53d86fa6410cc811b08abe6be410`.
**LIVE 23 Oct 2026 14:31 AEST**, page `7262dbfc63ef6f67744fa8f84bf5a734b60eb48d4655b98c3c9faebaccd63c4e`, 21,419,001 bytes, the view
link byte for byte.

## Andrew's words, 23 Oct 2026 12:58

> "EQ0005 fork extensions arrived yes they did and P34 pad chairs are here just add the qty no assets on these chairs you
> have the Gn24 numbers 1277089"

The three record changes (EQ0005 on site, 1 of 1; P34's two pad chairs received; GN24's 1277089 identified as the 60 kVA)
were made through the page at 13:40 (`record_23Oct2026_eq0005_p34_gn24/`, record 10545 → 10557). This release is the page
side of the same words.

## What changed

1. **Pad chairs are counted by quantity, never numbered.** The page's rule for things counted by quantity (water-filled
   barriers, ground protection, track mats) takes in `pad chairs?`. P34's drawer reads "Not numbered — counted by quantity"
   and the Questions tab's asset-number check no longer asks for numbers on P34.
2. **A unit identified on a reference carries its number** (`numbers1155.js`). GN24's 1277089 sat only on its unit record,
   so the card read "asset number not recorded yet" and "0 of 1 numbered" while the identity model knew the unit. The
   card, the drawer, the register line and "n of q numbered" now read the active unit records too: a Coates unit's number
   joins "asset no."; a unit of any owner counts as numbered; a number already on the reference's own list is never
   counted twice. The finder finds the reference by the number (beside the unit row it already had).
   On the record today this reaches: GN10 (1283681), GN24 (1277089), P67 (421107), WC09 (1268858, 1311146 beside its
   Event Portables units), WC51 (1197174), WC67 (172824), T0001 (1211356), T0128 (1211646), T0158 (1211364, 1211348,
   1211376, 1201864) — every one an identification somebody made through the page's identity form. WC09's chip reads
   18 of 18 numbered (was 4 of 18).
3. Footer v11.54 → v11.55. No record change by the patch. Not touched: PG29's Event Portables FWF 0573 still reads
   "asset number not recorded yet" on its card (its ownership text path, not this release's).

The block sits after `find1142-script`, the last wrapper of the finder's index, so the finder sees the numbers whichever
copy of the index runs.

## Checks

- `tests/test_v1155.cjs` — 14/14 on the dry page, desktop and phone; **14/14 live, desktop and phone** (`evidence/live/`).
  P34 unnumbered, GN24 not, water-filled barriers still; the drawer words; sp-nums no longer lists P34; the record items
  applied (P34 2 received, EQ0005 on site 1 of 1, GN24 carries 1277089, sp-short done); no failed Questions check; GN24,
  GN10, P67 read their numbers and count 1 of 1; exactly the references with an identified Coates unit off their own list
  gain its number (computed independently from the unit records); "n of q" never beyond q; the finder finds GN24 by
  1277089 and P67 by 421107; record unchanged; no errors; no writes.
- Regressions on the dry page: `v11.53/tests/test_v1153.cjs` 11/12 and `v11.52/tests/test_v1152.cjs` 15/16 — the one
  miss in each is their footer check (the page now says v11.55).
- Sweeps desktop and phone: 27 tabs, 19 shown, 0 errors, 0 console, 0 blocked.
- Real build byte-identical to the tested dry page; `check_page.py --base` PASS.

```
bash toolchain/build.sh v11.55 v11.55_chairs_by_quantity_LIVE/patch_v1155.py
python3 toolchain/upload_page.py build/GC500_v11.55/GC500_Delivery_Control_hosted.html
```

Still open on the Questions tab: EQ0005's fork extensions arrived without a fleet number ("1 received equipment line still
needs fleet numbers") and Alfie Harris's nightly rate.
