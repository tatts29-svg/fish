# v7.90 map explorer: plan fitting and quieter Done markers — LIVE

Author: Andrew Fisher · LIVE 2 Oct 2026 09:55 AEST.

Switching between Original plan and satellite now fits the correct coordinate space. Switching between Satellite
and Satellite + plan keeps the current pan, zoom and rotation. A family switch also stops the previous zoom,
momentum pan and rotation animation, so an old animation frame cannot undo the new fit.

Done markers start hidden. The **✓ Done** chip shows or hides them and remembers the choice on that device.
Existing recorded completions remain available; this changes their display preference only.

This release changes only `explorer/explorer.js` and its versioned entry `explorer/index.html`. The dashboard remains
v7.89, and the other 217 machine files, map coordinates, reference positions and shared record are unchanged.

| File | Bytes | SHA-256 |
|---|---:|---|
| `release/explorer/explorer.js` | 128511 | `ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4` |
| `release/explorer/index.html` | 23736 | `dd4b44d2169f38ef46d056d488d9bfaa39fa6942233ad3f98a9750af8e9ef25f` |

Registered machine manifest: `d53a38c6e4f51dce99aae0ab9ce2420408c2c6b6135ddaecac93c785533645cf`;
219 files, 172171479 bytes. Both public files were fetched and verified byte for byte after publication.
Record version **3538** before and after. No record changes, journals or real messages.

## Andrew's request

> "also please fix maps — you are putting green ticks everywhere"

His screenshot showed the Original plan pushed into the bottom-right on black. The plan and satellite use different
coordinate spaces. Reusing the previous camera caused the offset; a pending animated zoom could also restore that
old camera after an initial fit. Both cases are covered by the final release.

## Rebuild and checks

`patch_explorer790.py` accepts the exact previous live explorer and entry, then writes the two local release files:

```sh
python3 patch_explorer790.py <live-explorer.js> <live-index.html> <output-directory>
```

It guards the previous explorer SHA `dd6256bcd3e20cd89a70ba1c1d32e5f3b7b1acf09a2d19f1ac824f05fea93d3e`
and entry SHA `634881d7832bfd4f892ec50ae1e7eacbce2ea8d37dc0479d22804f190e94095e`.
The regenerated files matched this release exactly; every unaffected source region is byte-identical.

- Final handover suite: **7/7 desktop and 7/7 phone**.
- Independent controls and regressions: **22/22 desktop and 22/22 phone**. Actual mode and Done controls, preference
  migration and reload, category interaction, same-family camera retention, pending zoom/pan/rotation cancellation,
  unchanged coordinate/reference models, and no page errors, console errors or write requests.
- Phone screenshots inspected, including complete iframe captures of the fitted drawing and satellite plan.
- Machine dry-run, fresh live-base guard, exact two-file replacement and preservation of all 217 other descriptors passed.
- Tests use local finished-unit fixtures to exercise the markers. Phone is Chromium emulation, not a physical handset.

Run `evidence/independent_explorer_checks.cjs` with `PAGE=<local live page>`, optional `MOB=1` and `OUT=<private folder>`.
The supplied `evidence/explorer_tests.js` takes `LOCAL=1` to serve these release files. All test requests are read-only.
`before_*` and `after_*` evidence records the initial handover; `final_handover_*`, `*-independent.json` and
`independent-*.png` record the final corrected candidate. `source_preservation.json` and `release_verification.json`
hold the final source and publication proof.

Release used the existing `satellite_explorer/tools/machine_set.py` process with a verified retained manifest and only
these two local files. The tool has no conditional base check itself: the release wrapper verified the current live
manifest and old public files immediately before registration, then checked the public bytes and record afterwards.
