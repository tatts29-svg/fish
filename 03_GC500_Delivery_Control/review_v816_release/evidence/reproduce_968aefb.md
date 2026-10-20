# Reproduce the 968aefb CPU review

Author: Andrew Fisher

These fixtures use synthetic references and records only. They require Node, Python and the already-available **unpatched v8.13 HTML** with SHA-256 `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`. No browser, network or operational record access is needed. Run from the repository root; set `V816_BASE` to your copy of that HTML.

```sh
V816_BASE=/absolute/path/to/GC500_v8.13/GC500_Delivery_Control_hosted.html
V816_AUDIT=$(mktemp -d)
git archive 968aefba33abd387b7b646b71340d41775679b25 \
  03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT \
  03_GC500_Delivery_Control/toolchain/rep.py | tar -x -C "$V816_AUDIT"
V816_SRC="$V816_AUDIT/03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT"
V816_TEST=03_GC500_Delivery_Control/review_v816_release/evidence
sha256sum "$V816_BASE"
cp "$V816_BASE" "$V816_AUDIT/candidate.html"
python3 "$V816_SRC/patch_v816.py" "$V816_AUDIT/candidate.html"
sha256sum "$V816_AUDIT/candidate.html"
node "$V816_TEST/followup_cpu_968aefb.cjs" \
  "$V816_SRC/demob816_src.js" "$V816_AUDIT/candidate.html"
node "$V816_TEST/timeline_drawer_recheck_968aefb.cjs" \
  "$V816_BASE" "$V816_SRC"
node "$V816_TEST/demob_cpu_audit.js" \
  "$V816_SRC/demob816_src.js" "$V816_AUDIT/candidate.html"
```

The patched audit HTML must hash to `726f207af38123079c3eeaef78c8def695537cf87b55ae7a85107f85419a36ef`. Work only on the temporary copy. The Timeline/drawer fixture takes the **unpatched** baseline and applies the one Timeline hunk internally; the other two fixtures take the **patched** candidate so their extracted setters and merge logic match the reviewed change.

Expected frozen-source observations are in [followup_cpu_968aefb.json](followup_cpu_968aefb.json), [timeline_drawer_recheck_968aefb.json](timeline_drawer_recheck_968aefb.json) and [original_fixture_rerun_968aefb.json](original_fixture_rerun_968aefb.json). Local input paths and the synthetic confirmation timestamp may differ. The first and third scripts report defects as observations; exit zero does not mean the release passes. The Timeline/drawer script verifies 12 corrected behaviours and separately asserts the known explicit-removal regression; that latter assertion should change when the owner fixes it. None is a substitute for the required final browser/release checks.
