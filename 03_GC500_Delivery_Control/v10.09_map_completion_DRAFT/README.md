# Distinct map completion symbols — v10.09

Author: Andrew Fisher

READY TO UPLOAD — Source f0f8a953. Parent SHA256 `60533337c67a77211e660f0737ca5c693d52c2108a18d79fb0fd8a9d48c46a8b`; retained machine union `ad9297e85cc923d22b31656fe795ebbb576dc921335e6e15bebf1a4c203af654`. Both final phone and desktop map checks pass 68 controls each, both navigation sweeps pass, and phone/desktop visuals were inspected. No operational writes or browser errors. Parent 18, map 22 and source 22 focused checks pass; exact parent preservation and publication dry runs pass. Root integration/publication with scoped implementation and independent source review. Public verification follows publication.

Andrew's WC26 and WC50 screenshots show that the small map tick is too weak to distinguish finished work. The separate Map explorer now uses a larger green check emblem, an amber diamond and dash for known unfinished work, and explicit partial, review and unknown states. The selected reference shows its status beside its reference number. Selection uses orange so the green toilet category ring cannot be mistaken for completion.

The parent supplies a read-only snapshot from the existing verified completion and Timeline models. Completed billing selections, arrival and installation alone do not imply physical completion. Unknown source data remains unknown. The optional Done layer uses the same verified result. Existing shared refresh and animation mechanisms are reused; no record or financial calculations change.

Build the parent with the shared toolchain and `patch_v1009.py`. Generate the three external files with `maps/patch_maps1009.py EXACT_SOURCE_DIRECTORY OUTPUT_DIRECTORY`; exact source hashes and generated hashes are retained in `maps/evidence/source-bound.json`. Full live HTML, native records, original map sources and screenshots stay in private storage.

Run `node evidence/status1009.cjs`, `python3 evidence/check_source1009.py BASE CANDIDATE`, map pure tests, both standard navigation sweeps and the GET-only map browser checker. Inspect phone and desktop screenshots. The browser checker explicitly routes the three candidate map files, then repeats against public files after publication.

`maps/publish_maps1009.py` defaults to read-only preparation. It requires the retained exact live machine manifest, validates the exact three-file diff, preserves every other asset, rechecks the base immediately before registration and verifies public bytes. Publication uses the existing shared uploader for the parent page and is followed by public browser verification. No operational records are written.
