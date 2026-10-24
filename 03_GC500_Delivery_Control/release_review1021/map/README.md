# Gate 6 publication review

Author: Andrew Fisher. 15 Oct 2026. Prepared for the release owner; not published by these checks.

The v10.20 data patch moves P60, P62, P63, WC49 and GN06 to positions derived from the revised iEDM Gate 6 layout of 14 Oct. Its original patch tests pass (65/65 on the v10.18 source). This review retains all five coordinates and shapes exactly. The original email photograph has been requested from its receiving assistant; the reviewer has read the committed transcription, calculation, measured-position JSON and generated comparison images, but has not independently read that private original.

Two integration gaps are corrected:

- The five screenshot-derived positions retained `prec: unit`, causing short navigation labels to say master plan/on the unit and `approx: false`. `patch_provenance1021.py` gives them an explicit revised-layout source and approximate flag. It preserves their destinations, avoids the generic unverified flag that would redirect them to the pit lane, and avoids giving the revision an invented September observation timestamp. Other references retain their existing navigation.
- The embedded explorer gets new pin coordinates from the parent page, but standalone 2D and 3D use older snapshots. `prepare_machine1021.py` updates only these five positions in both snapshots and adds source wording. It retains every other snapshot entry and all other fields. In 3D the supplied units are labelled billboards, not building meshes; the embedded frame receives parent pins and the standalone frame now receives the revised snapshot.

The 2D explorer does not consume `MASTER_SHAPES926_DATA` at all: the base D001 tiles still draw the superseded compound. A small overlay uses the five existing moved footprint polygons, reading the shared page model when embedded and the same derived polygons when standalone. Orange identifies the revised footprints; grey crosses mark the superseded unit footprints in Plan and Sat + plan. Satellite-only shows the revised footprints without old-plan markings. The existing map camera, gesture handlers, selection markers, tile data and design remain intact. The same projection is used in the PNG export. The source is stated on each revised reference's map card and in search results.

## Checks

- `node test_review1021.cjs <patched-page.html> <candidate-machine-directory>`: 28/28 behaviour/projection checks pass on the private rehearsal, including destination preservation, no pit-lane redirect, unchanged P33 navigation, rotation, shared-source priority and matching standalone 2D/3D coordinates.
- Both changed JavaScript files pass `node --check`.
- Six source machine files were downloaded by GET and matched byte-for-byte to the v10.18 retained manifest.
- Browser screenshots and final release checks belong to the release owner. These local checks make no live writes.

## Apply and prepare

`patch_provenance1021.py` accepts the exact original combined candidate `9db6edd2…` or the reviewed P/O-corrected candidate `e116d2a5…`; changed or repeated inputs fail. It is applied after the three original patches and the P/O review.

`prepare_machine1021.py <private-source-directory> <private-candidate-directory>` produces six files and `source-bound.json`. The publisher uses the current retained manifest, refuses unrelated path or hash changes, rechecks the live base immediately before registration, and reads all changed public files back after an explicit publication. Default mode is read-only preparation.

```
python3 publish_machine1021.py \
  --keep <current-retained-manifest.json> \
  --candidate-dir <private-candidate-directory> \
  --evidence <private-candidate-directory>/source-bound.json \
  --out <private-preparation-directory> \
  --expected-base 6a5582b6e60a0e1449ee42c63900912fda875c08c825cbc3dc13c42b24d6047f \
  --machine-tool <shared-machine_set.py>
```

The release owner adds `--publish` only after the final checks. All other machine files, native records, quantities, dates and charges are retained.
