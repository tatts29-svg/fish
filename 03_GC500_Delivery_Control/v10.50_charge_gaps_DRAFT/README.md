# v10.50 — the GC500 charge gaps, filled from their sources — READY TO UPLOAD (with v10.49)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "add in the gaps on the gc500 for delivery and pick ups and anything else
others should have and is missing, ensure all this is added correctly".

Every uncharged delivery and pick-up leg and labour gap on site (157 references, `../gaps_16Oct2026/scout.json`) was
researched against the 2026 card, Coates' own contract lines (Baseplan (5), 16 Oct) and the delivery dockets, five
groups, each answer checked a second time by an independent verifier (`../gaps_16Oct2026/research/`). This release
puts in the ones with a real source.

| Added (customer, ex GST) | Source | Amount |
|---|---|---|
| Waste tanks WC05, WC20 ×2, WC27, WC60 ×2, both legs | card Transport "Waste Tank 6m x3m" $500 each way; tanks travel on their own dockets | $6,000.00 |
| WC02, WC04, WC06 delivery | card "Portable Toilet FWF" $47.50; their contract delivery lines (9968955 135-137) were removed in Baseplan (5) | $190.00 |
| T0003 hired-in 5 t forklift, both legs | card "5.0t Manitou Forklift (Rough Terrain)" $500 each way; no contract line covers it | $1,000.00 |
| T0109 2.5 t forklift, both legs | card "2.5t Forklift" $500 each way; 9987005 line 3 belongs to T0085 | $1,000.00 |
| T0025 Trakmat pick-up | contract 9973079 line 2, $103.30 for the delivery load of the same 20 mats | $103.30 |
| **Transport added** | | **$8,293.30** |

Shown as covered, nothing added (already in the contract charges): T0258 and T0266 (9974042 lines 3–4, $500 a
container each way), T0085 (9987005|3), FL03 (9992300|7), FL04 (9992300|8). The buildings lock snapshot now includes
the containers' $2,000 on the contract: **$149,017.32**.

From Andrew's own rules: fire extinguisher only where one is recorded (39 buildings lose the offered/forecast line,
$2,029.95 of forecast off; the 10 recorded stay charged); T0024 Coates compound toilet "no charge" (26 Sep): no
event-night servicing (−$218.61).

With v10.49 (accessible toilets as FWF, +$874.44) the result moves **+$8,949.13**.

**Still waiting for Andrew (no source exists — page holds them):** water-filled barriers WB01–WB06 transport and
install; VMS transport and the second half of VMS install; GN20 transport; pee panels WC09 and FWF trailers WC100;
the generators' demob half of the card labour; T0005's extra forklift round trip; own-use T0021/T0022 labour.

Built from live v10.48 with v10.49 and v10.50, check_page PASS. `tests/test_gaps1050.cjs` 17/17 (GET only, compared
with the live page); v10.49 `test_lock1049.cjs` 19/19 on the same build.

    bash toolchain/build.sh v10.50 v10.49_buildings_lock_DRAFT/patch_v1049.py v10.50_charge_gaps_DRAFT/patch_v1050.py
    python3 toolchain/upload_page.py build/GC500_v10.50/GC500_Delivery_Control_hosted.html
