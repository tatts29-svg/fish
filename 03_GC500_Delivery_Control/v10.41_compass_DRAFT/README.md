# 3D compass containment — DRAFT

Author: Andrew Fisher

The rotating compass was creating 3–4 pixels of horizontal viewport overflow at some headings. The candidate clips the dial inside its existing circular container. Positions, control labels, models, geometry and operational data remain unchanged. Three parent asset URLs change only to invalidate caches. The main application page remains the separately published v10.40.

Base machine: `86eb69168f5e08b369ff1a41758140fabf36fc28fcc81fb705605322b128fcc3`. Candidate machine: `43c59fc5ea41cfabe9941d72cead4d4a61b6c2e86ec883e5b0f2b067f2962f7c`. Exactly four of 236 files change; the other 232 descriptors are retained.

Checked: 17 publication guard tests; 26/26 desktop 3D regression checks; focused before/after compass geometry test across desktop and phone widths. Full phone regression is in progress. Not uploaded; not READY until phone and final checks complete.

Preparation: `python3 prepare_compass1041.py SOURCE_DIR CANDIDATE_DIR BASE_MANIFEST_JSON`. The source folder must contain the six files named by the script, with the exact base manifest digests.

Guarded dry run: `python3 publish_compass1041.py --keep BASE_MANIFEST_JSON --candidate-dir CANDIDATE_DIR --out PRIVATE_OUTPUT_DIR --evidence CANDIDATE_DIR/source-bound.json --expected-base 86eb69168f5e08b369ff1a41758140fabf36fc28fcc81fb705605322b128fcc3 --machine-tool ../v6.67_machine_v5.84_fire_sound_phone/machine_set.py`. Add `--publish` only after READY; this rechecks the live base, stages only the four reviewed files and verifies the registered manifest and public bytes.

Browser regression uses the existing `../v10.27_equipment_3d_DRAFT/tests/test_browser1027.cjs` with the current page as `PAGE` and prepared assets as `MAP_ROOT`, through the GET-only harness. All browser checks share `/tmp/gc500-browser.lock`. Private captures remain outside the repository.
