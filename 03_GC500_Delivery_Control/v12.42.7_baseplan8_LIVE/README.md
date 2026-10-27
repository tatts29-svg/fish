# v12.42.7: Baseplan SuperCars (8) onto the page's contract lines

LIVE 28 Oct 2026 04:21 AEST. sha256 7f58f9a4bba8388ae75f7d8766a07de0f76be0f2ca8c3492ba91c801b2e0bbeb, 16,013,671 bytes, byte for byte. Built on v12.42.6 (640f99e1…).

Andrew, 27–28 Oct 2026: "Have you added all new contracts in..and removed cancelled", "Work on 4", "Pee panels may of been on the toilet contract", "The 9994248 has this been delivered this is probaly seperate", "If its on the contract lets do it".

`patch_v12427_data.py` (BASEPLAN8_XLSX names the private workbook; sha256 13f57669… checked) runs the v10.26 reader on the 21-sheet export: lines (8) still has are refreshed, new lines added, lines it no longer has go to the source history.

- Out: cancelled 9973079 and 9994996; 9990776 (fencing, charged from the dockets) and 9968726 (superseded TV) as before; 9994248 (fence 35 m, barrier 45 m, chairs 24 — not delivered on (8) or our record) until Andrew confirms it came.
- Not imported: 9994954/19–20 pee panels (already charged on WC09, 6 × $672.17); 9961976/17 GN24 80 kVA (never came); 9992300/12 EQ0003 boom (v11.05 adds and pins it).
- Kept: the card rate on 20 NVAC generator lines (v10.29). 9992300 quantities written as dates read as 1,1,1,1,1,10.
- Moved by (8): P38/P39/P42 buildings and fridges, WC09 blocks and FWF, WC10 FWF, GN26/GN27 to KINP 9994954 (concert gens at the contract rate).
- WFB labour $7,700: from cancelled 9994996/1 to 9972648/19 (Price column), charged as before; WFB transport $17,900 on 9972648/20.

| | v12.42.6 | v12.42.7 |
|---|---|---|
| Charge | $971,877.96 | $992,642.79 |
| KINP | $253,153.62 | $268,813.00 |
| STPS | $71,169.36 | $73,651.35 |
| NVAC | $40,101.16 | $41,333.25 |
| MEAD | $18,859.02 | $20,250.39 |

Rehire revenue −$1,385 is classification only (WC09/WC10 FWF now on 9994954 count as hire). Line-by-line delta in `evidence/line_delta.json` (before the 9994248, pee panel and WFB-labour decisions).
