# v10.96 Map Explorer search and clarity — DRAFT

Author: Andrew Fisher

Andrew requested faster Map Explorer search by description, asset number, reference and registration, direct positioning, clearer controls and reliable deep zoom. This candidate is NOT LIVE and NOT READY TO UPLOAD; the session's publication pause remains. Original load-card PR #31 is superseded by newer live work and is not part of this patch.

Exact source branch: `codex/gc500-fencing-alignment-20oct` at `41f07a61cb9aca12472e349ac87094e9682f143f`.
Exact live base: v10.95, SHA-256 `87b47dc52dc52dc9d078e8f77f79ed3c9e835244e5855e075a075aab1b338b47`.
Working branch: `codex/gc500-map-clarity-21oct`.

## Changes

- Cache a read-only search index and eliminate full host refresh on each keystroke. Include canonical physical asset numbers, registrations, VMS identity and existing descriptions/locations. Normalise punctuation and spacing; prefer exact identifiers. Preserve all matches behind Show more.
- Search results use the native recorded destination immediately, with keyboard navigation and touch targets. Missing positions remain explicitly unplaced. No positions are invented.
- Warm the existing vector scene worker while the map is visible, respecting reduced-data connections. Keep selected labels beside their point at maximum zoom.
- Improve search/control contrast, focus outlines and category icon edges. Preserve actual map sources, source-quality messages and status values.
- Stop Today celebration work after leaving Today or enabling reduced motion. This fixes an existing full-screen animation obscuring the map.

The module attaches to the dashboard Map Explorer iframe. The standalone machine viewer and other embedded viewers retain their existing implementation. The machine manifest is unchanged. `svc1067-script` is preserved byte for byte, as are all native record, pin, identity, staff, cost and permission implementations. No operational writes occur in testing.

## Files and checks

`patch_v1096.py` applies the exact-base patch using the shared replacement helper. `host1096.js` projects read-only metadata and installs the viewer module. `search1096.js` contains pure matching. `viewer1096.js` contains search UI, direct navigation and scene warm-up. `map1096.css` supplies contrast and focus styles.

Run from the repository root:

```sh
node 03_GC500_Delivery_Control/v10.96_map_search_clarity_DRAFT/tests/search1096.cjs
python3 03_GC500_Delivery_Control/v10.96_map_search_clarity_DRAFT/tests/preserve1096.py /private/base_live.html
bash 03_GC500_Delivery_Control/toolchain/build.sh v10.96-review5 03_GC500_Delivery_Control/v10.96_map_search_clarity_DRAFT/patch_v1096.py
```

Browser tests use `CHROMIUM_PATH`, `PAGE`, and a private `OUT` directory outside the repository. Set `MOB=1` for 390 × 844 at DPR 2, or `WIDE=1` for 3840 × 2160. Run serially. Run both standard toolchain sweeps as required by AGENTS.md. Evidence summary is in `VALIDATION.md`; private screenshots and original live HTML are deliberately not committed.

## Practical limits

Measured timings come from Chromium in this executor, not a physical phone or guaranteed field connection. Cold imagery and vector tiles still require loading. Enlarged satellite imagery cannot contain detail absent from its source. A 4K viewport check is not a claim that every source image is 4K. Satellite fault/retry recovery passed; physical-device GPU testing remains outside the completed evidence; no claim of perfection or zero possible errors is made.

Implementation and testing: Codex. Claude has not reviewed this candidate. Before any approved publication, recheck current live hash, rebuild if changed, rerun affected checks and coordinate ownership on PR #1. Never publish this exact-base patch over a newer release.
