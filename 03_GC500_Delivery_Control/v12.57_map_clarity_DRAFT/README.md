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

The patch is bound to the independently verified v12.54.1 predecessor:
`20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5`.
It uses the drawing registration already embedded in that predecessor. It refuses
a different base or repeat application. The original page can be restored exactly
by reversing the bounded replacements.

Implementation is being checked. This remains a preview, not READY TO UPLOAD or
live. The current handover requires desktop and phone before-and-after visual
review before publication. If another release goes live first, rebuild and check
this patch on that exact successor; do not bypass the base guard.

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
