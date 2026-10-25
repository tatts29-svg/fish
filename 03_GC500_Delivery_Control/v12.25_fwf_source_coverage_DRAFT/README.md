# v12.25 — FWF hire source coverage

Author: Andrew Fisher.

Seven hire lines, covering nine FWF toilets, were present in the shared current-source comparison but absent from the embedded contract source. This patch adds those lines to the existing contract model. Existing shared readers determine current ownership, branch allocation and customer hire once.

The source is the already tracked `review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx`, sheet **Every line**. Its SHA-256 is `8184c8f704d6efc9419411d211a191724c306e8ed22d4db3598dfc83206d2b5c`. No private attachment contents or native record snapshots are added to this folder.

`patch_v1225.py` requires the exact verified v12.24 page and its reviewed contract-source digest. It appends the seven ordinary hire rows, adjusts only their source metadata, applies the bounded advisory correction and advances the footer. All 303 existing embedded contract rows remain in their original order. Existing assignments and the separate runtime association remain intact. A repeated application, duplicate identity or changed base is refused before source mutation.

The comparison's start and status remain source fields. They do not supply a new site receipt or completion. Missing rate-type, movement, supplier and billed fields remain unknown. The existing site quantities, identities, ownership, receipts, install/demob inclusion, servicing records and explicit exclusions retain their existing rules. Source Price zero does not replace the hire rate. No charge calculation, generic importer or hidden rate override is introduced.

`fix_advisory1225.py` identifies water-filled-barrier work already covered by the existing combined contract installation charge. It moves that advisory from missing pricing to allocation review, retaining the review in the drawer and charge assurance. It assigns no per-reference amount and records no physical work. Unknown or invalid source coverage continues to show as a pricing review. Existing card and own-use decisions take precedence.

## Validation

The independent preservation test checks the source rows against the tracked workbook, verifies complete row fixtures and exact metadata changes, and rejects wrong-base, duplicate and repeated application cases. Source reversal permits only the reviewed advisory fragments and footer beyond the data change. The advisory tests exercise the existing contract-coverage reader, finite/zero/unknown coverage, source changes, precedence, and retained reviews.

```sh
ADVISORY=1 BASE=/path/to/verified-v12.24.html PAGE=/path/to/candidate-v12.25.html python tests/test_preservation1225.py
BASE=/path/to/verified-v12.24.html PAGE=/path/to/candidate-v12.25.html node tests/test_advisory1225.cjs
```

The integrated candidate passed **79 independent source/preservation/refusal checks** and **19 advisory checks**. Its SHA-256 is `25a68311ca34ba367d6d4f6b9c44e4867d65dbe4a66a9d1196c424663a04e221` (15,440,214 bytes).

The shared checker passed 202 inline scripts. Final native desktop and phone checks each passed 13 assertions, including exact source-charge inclusion, ownership-based categories, unchanged existing source rows, current onsite quantities/identities, work slots, servicing and exclusions. No page errors or record-write attempts occurred; phone screenshots were inspected. Full navigation gates remain pending. Private snapshots and financial evidence remain outside Git. No upload or operational write is performed by this patch or its tests.
