# Off-site rings and whole-site pictures — READY TO UPLOAD

Author: Andrew Fisher.

Codex takes over Claude's `93e56d14bcb0403c831b0f4fe959c787bcbc3dee` patch under
PR #1 comment 6464234949. Codex builds and tests; Claude uploads only after the
shared board marks the exact candidate READY TO UPLOAD.

The approved display remains: departed assets retain their own icons, with green
off-site rings; partial collections use a steady dashed ring, and review states
keep the red review treatment. Demob and Find-it gain the wider third "Whole site"
picture. This release does not add a new card design or an orange map treatment.

The new implementation also stops ring animation while the frame or host page is
hidden, while the iframe/canvas is offscreen, and in 3D or Fencing mode. Empty
departure results clear the previous points and bitmap. Reduced motion keeps a
steady ring. Parent observers are released when the iframe unloads.

The picture-cache work is bounded to the Demob card cache. Continuous visibility
tracking keeps cards reloadable after eviction, uses a 96-entry budget, reclaims
superseded coordinates, and drops queued work for cards no longer visible.
Displayed pictures and in-flight work stay protected, so the budget may be
temporarily exceeded while those entries are pinned. Sharing and download
pictures retain their own lifetimes.

Base: verified live v12.43, SHA-256
`7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`,
16,030,489 bytes. The patch rejects every other base and repeat application.
Every replacement requires a unique exact anchor and uses the shared `rep`
helper within that anchor, preserving adjacent CSS selector whitespace.

Integrated preview: SHA-256
`174b7f4c51c46696caa44610eb31b1339c5f3e54dc573fb45c0b652d6f8133ff`,
16,040,506 bytes. This is the exact shared-toolchain candidate, not a live release.

Local checks:

- 41 source-extracted ring lifecycle cases.
- 15 checks against the actual native departure wrapper, including empty-result
  cleanup and preservation of full/partial icon shapes.
- Exact patch reversal, wrong-base and replay refusal, and third-picture scope.
- 258 source-extracted picture-cache checks starting from the exact base;
  256 on the integrated candidate (the two initial replacement-anchor checks
  are skipped when already patched). Covers a 110-card scroll, the 96-entry
  budget, re-entry, shared identities, coordinate races, hidden panes, replaced
  observers, decoding transitions and failure cleanup.
- All 214 inline scripts parse; the standard page and secret checks pass.
- Root and a separate Codex reviewer inspected the stable ring implementation
  and exact patch boundaries without finding a blocker. These were code reviews,
  not native browser approval.

```sh
node tests/test_offsite_ring12431.cjs
BASE=/path/to/exact-live-v12.43.html python3 tests/test_patch_v12431.py
node tests/picture_cache12431.test.cjs /path/to/base-or-candidate.html
```

Native validation completed on the exact candidate:

- Eight ring lifecycle checks: native departure projection, full pulse, steady partial
  dash, reduced motion, 3D/Fencing CSS visibility, parent intersection/re-entry and
  clearing an empty departure projection. Diagnostic observability was added only
  to a private test copy; this does not claim an independent 3D-renderer audit.
- The unmodified candidate loads all three pictures in Demob and Find-it, with the
  third spanning the picture grid. A private observable copy demonstrates the
  96-entry cache budget under synthetic pressure, zero queued off-tab work and
  all three native pictures restored after eviction and re-entry.
- 34 native financial and record-preservation checks pass against the exact live
  base on a fresh, shared frozen record. All customer, supplier, branch, financial
  and operational outputs compared are unchanged; no HTTP write attempts.
- Zero runtime or console errors in these focused checks. Phone screenshots of
  the ring, Demob pictures and Find-it pictures were inspected.

Both full navigation sweeps passed: desktop and phone each visited 27 tabs,
7 deep links and browser Back, with zero runtime errors, console errors or HTTP
write attempts. The public base was fetched again and still matches the base hash.

**READY TO UPLOAD — not live.** Exact source commit: `6f138f49715aad0ede3088416a07dbbf1113f6b4`.
The tested candidate is frozen. Claude owns the guarded rebuild, upload and
public-byte read-back. Rebuild through the shared toolchain and require the same
candidate hash; if the live base changes, return the scope for rebase and retest.

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.43.1 \
  03_GC500_Delivery_Control/v12.43.1_offsite_pictures_DRAFT/patch_v12431.py
```

No operational record or calculation changes belong in this release. Private
records and screenshots stay outside the public source folder. The public
validation summary is `evidence/checks.json`. Source/tests are now frozen for
Claude's handover; later map/financial/design drafts must preserve this release.
