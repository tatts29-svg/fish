# Today category plates and half-hour planning times

Author: Andrew Fisher.

DRAFT — combined source is frozen; final release checks are complete, with real-page time-selector verification finishing. No publication yet.

The overall hero carries the whole-job reading once. Its duplicate seven-category percentage strip is removed from the screen because each existing detailed category card already supplies those figures. One names-only category bar remains for direct navigation. The repeated Work progress heading remains as an accessible section label but does not occupy another visible row.

The current programme day and countdown remain visible in a compact summary. Opening Programme and key dates reveals the existing timeline, milestone and key dates. The original statistics and controls are moved, not copied. The disclosure remembers its state across redraws and opens for printing, then restores its screen state.

Existing category cards stay open. They use their natural height, with the same heading, lights, percentage, total, Done/Left review controls, qualifications and source details. Clearer category illustrations sit behind translucent data surfaces. Andrew requested another lift in picture visibility after the first preview; decorative shading was removed and the reading surfaces lightened, including a tighter phone crop for Fencing. Healthy repeated footers and an exact repeated On-site plan prefix are suppressed on screen; stale or unavailable record status and all provisional/review notes remain visible.

Narrow cards give their scope description the full width, then place the existing Play and Close controls on one compact row. Closed groups retain their visible category name and compact reading. Desktop card headers retain their existing arrangement.

The updated overall scene includes water-filled barriers, a 61 ft knuckle boom and a 43 ft scissor lift. The equipment scene includes the forklift and access fleet; the toilet scene uses the supplied Coates product reference. The illustrations total 3,077,806 bytes: the overall yard is 2164 × 727 pixels and all seven category images are 1672 × 941 pixels. The layout supports a 3840-pixel viewport; the artwork has not been upscaled or described as native 4K. Existing weather selection, animation, sunlight treatment and Pause behaviour are unchanged.

`patch_v907.py` accepts v9.04–v9.06 and requires all eight verified illustrations: the seven categories and the updated overall yard. `plates907.json` supplies the content hashes and descriptors; `assets/` supplies the matching WebP bytes. The patch preserves old media entries, adds the new scenes and writes `media_manifest_v907.json` beside the candidate. It does not alter operational DATA, calculations, record functions or print generation functions.

For provisional arrangement previews only, `--preview-existing-art` explicitly permits the old images. A final release must use all eight new illustrations, including the updated overall scene.

Validation commands:

```sh
python3 v9.07_today_plates_DRAFT/patch_v907.py /private/base_live.html /private/GC500_Delivery_Control_hosted.html
python3 v9.07_today_plates_DRAFT/tests/test_identity907.py /private/base_live.html /private/GC500_Delivery_Control_hosted.html
PAGE=/private/GC500_Delivery_Control_hosted.html OUT=/private/evidence W=1440 node v9.07_today_plates_DRAFT/tests/test_plates907.cjs
```

Run browser checks at 1440, 2560, 3840 and 390 pixels using the shared browser lock and Chromium configuration. Every non-GET request is blocked. Source identity bounds changes to presentation and verified media. The targeted browser checks cover programme state, native category jumps, card geometry, Review and source-detail controls, status warnings, image decoding, printing state and animated weather. Detailed operational screenshots remain outside Git. The release integrator runs the required final phone/laptop sweeps before publication.

The planning time inputs now offer 5:00 AM through 11:30 PM in half-hour steps, with an unset option. Existing earlier or off-grid times remain selectable and are never rounded. The delivery drawer, daily tables/cards and crew planning editor keep their native save handlers, labels and permission checks. The existing 30-minute unloading calculation remains. Actual staff-shift entries are outside this change.

Final combined candidate SHA-256: `25826d5e30c935beb2aea127f2a014ab654a402e8715e4817dc7d7c647eb95f3` (11,466,903 bytes), based on public v9.04 `d0d630046090cc4dd9f2bcd8ad3d85d818cc0a8bfe87cae4f8ee059e95b7b57d`. Media manifest: `25afcb424dc3681bc2ce5a4427953bbc72e8425aeed55702b9e8b559524c3fc7` (1,975 assets; eight added).

Validation: source identity and all 23 inline scripts pass; the half-hour selector passes 31 focused checks using the actual native handlers with intercepted saves. The final candidate passes 17/17 Today checks at 3840 pixels and both strict 21-route/seven-deep-link/Back sweeps with no page or console errors or write attempts. The brighter category treatment also passed phone 18/18 and laptop 17/17 checks before time-helper integration; narrow, laptop and widescreen screenshots were reviewed.

An earlier phone sweep hit a map-provider HTTP 503; a strict rerun passed. The desktop sweep exposed an outdated test expectation: the established one-map renderer can canonicalise the legacy 3D hash to the explorer hash. The harness now accepts only that documented alias, still checks the visible map pane, and rejects unrelated routes; two regression tests pass. No application routing change was needed. Detailed screenshots and logs remain outside Git.
