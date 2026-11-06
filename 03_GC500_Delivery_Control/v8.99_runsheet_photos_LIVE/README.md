# v8.99 — readable running-sheet photographs

Author: Andrew Fisher

**VERIFIED LIVE — 8 Oct 2026 11:35 AEST.** Guarded upload confirmed the previous live base, then exact public-byte readback verified the candidate below. Source implementation was shared at `98756fc0`.

Additional loading and transport instructions could reduce the flexible photograph area to a narrow strip while the old page-fit check still passed. This patch reserves at least 36 mm of actual image height, keeps every supplied photograph, and proportionately compacts the existing loading blocks while retaining at least 8 pt text. The reference band retains its full height so arrival and loading checks remain readable.

When a load needs more space, complete sections continue on numbered A4 sheets. Oversized collections of instruction blocks and photographs split at complete block boundaries. A single indivisible block that cannot fit stops PDF export and native print actions. No instruction or photograph is silently removed to force a fit.

PDF grouping now uses the actual load number. Continuations and location signs remain in their load's attachment, in source order. Filenames, source-photograph selection functions, embedded images and operational records are unchanged. The correction adds no record writes or transit changes.

Exact source:

- Base v8.98 SHA-256: `09bf240301316f4a619d6ed6d60a8f29d8d914a081a553b9fc5794a1ae4e45d2`.
- Candidate v8.99 SHA-256: `f7f4a3fedad41f024eca82d85befad163067b83720413fab2a8aa5999d5d0ab4`.
- Candidate size: 11,429,002 bytes.

Validation:

- Guarded patch is deterministic; repeat application and wrong version are rejected.
- All inline scripts and page/secret checks pass.
- Install and driver layouts pass laptop geometry/content checks; both actual PDF makers preserve distinct loads in source order.
- Multi-page install and driver exports preserve all continuations and location signs. Per-load and combined page counts agree.
- Measured image heights exceed the 36 mm minimum; loading text remains at least 8 pt.
- Laptop targeted checks: 25/25 passed, with no browser errors or attempted operational network writes.
- Phone targeted checks: 20/20 passed, including an expanded gallery with more than eight photographs, repeated instruction blocks, and an indivisible oversized block that correctly prevents native printing. Phone install/driver screenshots were visually inspected.
- Actual exported install PDF pages were rendered and visually inspected; the author metadata is Andrew Fisher. Both PDF variants retain A4 page dimensions and their native filenames.
- Static review checked continuation grouping, repeated photo grids, export guards and native print paths.

The uploaded paper, detailed operational geometry, screenshots and corrected PDFs stay outside Git in the private evidence folder. Browser tests use the view route, blank edit token, GET-only networking and an overridden native print function. The driver test passes only the PDF entry gate; it does not create a manual-check signature or mark a truck in transit.

Build and verify with the shared toolchain:

```bash
python patch_v899.py "$BASE_PAGE" "$CANDIDATE_PAGE"
python test_patch899.py "$BASE_PAGE" "$CANDIDATE_PAGE"
python ../toolchain/check_page.py "$CANDIDATE_PAGE"
GC500_EDIT_TOKEN= PAGE="$CANDIDATE_PAGE" EVIDENCE_DIR="$PRIVATE_EVIDENCE" ASSERT_LOADS=5 flock /tmp/gc500-browser.lock node test_runsheet899.cjs
GC500_EDIT_TOKEN= MOB=1 PAGE="$CANDIDATE_PAGE" EVIDENCE_DIR="$PRIVATE_PHONE_EVIDENCE" ASSERT_LOADS=5 flock /tmp/gc500-browser.lock node test_runsheet899.cjs
```

Both final navigation sweeps passed all 21 routes, seven deep links and Browser Back with zero runtime errors, console errors or operational writes. Guarded publication and byte-exact public readback passed. Media `d01b619abe6fac3d56d077abaf8a2cdcbbc4c9e69bd725a4a84c01849c83fa1f` and machine `cd05e73e45b7c5afe1add67e12f595591ecc19c1e5adda3ccc4c9a948e0a6a49` are unchanged. Detailed browser and publication evidence remains private.
