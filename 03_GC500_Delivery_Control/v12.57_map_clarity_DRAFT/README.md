# Map explorer clarity — v12.57 DRAFT

Author: Andrew Fisher

The map opens with collection rings off. The existing Map tools bar gains a
**Show what has left** choice, with a visible key on the map while enabled.
**Servicing areas** is an independent choice: Off, All areas, or Area 1 to Area 13.
Its short hint explains the outlines beside the control.

Recorded pins outside the drawing are listed for review in Map tools and Questions.
Their locations remain unchanged. Drawing views exclude markers beyond the sheet;
the original reference data, search entries and Satellite/3D behaviour are retained.
The remaining explorer controls, equipment symbols, fencing layer, pickup packs,
existing page styling and financial readers are preserved.

The follow-up in PR #1 comment 6487114117 also removes one rejected default board
identity from the shared register reader. The actual fallback comes from the
contract-derived board list, rather than a literal asset on the plan position.
Only that invalid default pair is excluded: recorded identity overrides and the
recorded registration still take precedence. The underlying contract evidence,
company/branch attribution and other board identities are retained.

The patch is bound to the independently verified v12.54.1 predecessor:
`20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`.
It uses the drawing registration already embedded in that predecessor. It refuses
a different base or repeat application. The original page can be restored exactly
by reversing the bounded replacements.

The exact preview is SHA256
`604a96719725228ac7fcadde1726b0fd20b450fd91b18fdd0005421d2a403c53`,
16,116,573 bytes. The shared toolchain reproduces those bytes from the predecessor
above. The identity follow-up is being checked against a fresh record. The prior
map-only preview's completed checks are retained in
`evidence/map-preview-01d87c5d.json`; they do not certify the new identity change.
Current check status is recorded in `evidence/checks.json`.

This remains a preview, not READY TO UPLOAD or live. The current handover in
[PR #1](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6485684681) requires
desktop and phone before-and-after visual review before publication. Publication
also requires a fresh record check and the unchanged-live-base guard. If another
release goes live first, rebuild and check this patch on that exact successor;
do not bypass the guard. If this preview is published before v12.55, that draft
must be rebuilt and checked against the verified successor.

The off-drawing review list uses real recorded pins and the existing master-plan
precedence. It is separate from drawing-label geometry used by the renderer.
Some far-away recorded pins were already excluded by the predecessor's native
projection bounds; this change does not claim to remove icons that were not
drawn. It makes those recorded locations reviewable without guessing a new
location or describing them as depot positions.

Detailed native records, financial comparisons and actual screenshots remain in
private evidence storage. Shared evidence records only release identity and check
outcomes. No operational record is written by the patch or its tests.

Build using the shared toolchain:

```bash
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.57 \
  03_GC500_Delivery_Control/v12.57_map_clarity_DRAFT/patch_v1257.py
```

Offline checks use an exact private predecessor:

```bash
BASE=/private/verified-v12.54.1.html \
python -m unittest discover \
  -s 03_GC500_Delivery_Control/v12.57_map_clarity_DRAFT/tests \
  -p 'test_*.py' -v
node 03_GC500_Delivery_Control/v12.57_map_clarity_DRAFT/tests/questions1257.cjs
```

Native browser checks use the shared read-only harness, a pinned private state,
exact candidate hashes and private output directories. Every browser run must hold
`/tmp/gc500-browser.lock`. Run targeted desktop and phone checks, the native
financial/source comparison, and the original shared navigation sweeps before the
final handover. These checks establish preservation against the predecessor; they
do not certify unrelated business figures or unresolved financial scope.

The native control suite exercises the visible Questions row before opening the
explorer, the real Satellite/plan/3D/fencing controls, outside-sheet drawing and hit
tests, all servicing-area choices, the ring toggle/key, and record preservation.
It takes `PAGE`, `STATE`, `EXPECTED_OFFSHEET` and a private `OUT`; use `MOB=1` for
the phone run. The independent geometry oracle belongs in private evidence, not
in a committed test fixture. The native financial comparison takes `BASE`,
`CANDIDATE`, `CANDIDATE_SHA`, `STATE`, `FIXED_TIME` and a private `OUT`.
