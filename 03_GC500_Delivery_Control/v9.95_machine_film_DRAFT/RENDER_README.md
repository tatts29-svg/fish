# Machine film render source

Author: Andrew Fisher

This workflow produces a candidate movie. It does not upload media, publish HTML, or
write operational data. Andrew requested a clearer, deeper exploded view of the
existing Coates Way machine, with its steel support removed and a seamless loop.
The original model, artwork, colours and materials remain.

## Verified original

The registered MP4 is 1440 × 896, 30 fps, 420 frames, 14 seconds and 3,028,361 bytes.
Its SHA-256 is `0871900727ba7e070fe2abb52f44e18697ee34f2ba4cda8c6bd94c5ef66a1b34`.
The WebM has the same dimensions, frame rate, frame count and duration, and is
3,144,997 bytes; SHA-256 `fb84697a6d4640eece234d02ef98547816a619e830f5ad8781c394ec3922e4df`.
The decoded original MP4 boundary frames differ by 11.025 mean absolute RGB levels
out of 255. The new workflow reuses identical poses at the loop boundary.

The preserved source is:
`/workspace/private-coates-cog-04Oct2026/steering-wheel-review/current-public-source`.
Set `MACHINE_SOURCE_ROOT` to its parent to reproduce elsewhere. The accompanying
`current-229-file-manifest.json` has union SHA-256
`d573ed4017f9ebf0c9c8502367b847f4409eac75c9f3d4f59d5977151ffb7b13`.
The live service is now `v9.21-pins-aligned`, but its six relevant mechanism modules
(app, model, mechanics, parts, poses and service-parts) were downloaded and found
byte-identical on 11 October 2026. Every served source file is checked against the
manifest. External requests are blocked. Prior unpublished work remains untouched.

## Capture changes

`machine_film995.js` appends capture controls to the unchanged mechanism module.
Only `model.parts[18]`, ID `base`, is hidden. The other 175 parts retain their mesh
geometry, print texture, materials and release stages. The separate 310-part
interactive bundle metadata is not changed.

Axial travel is 1.15 times the native release distance. The perspective lens stays
between 32 and 34 degrees. The camera travels from the front three-quarter view to
the rear mechanism, then follows the exact reverse path. The original studio floor
and lighting remain, with higher shadow resolution and a larger floor to avoid its
far edge. Original printed artwork is 1179 × 1179: native 4K geometry rendering does
not manufacture additional artwork detail or replace its text.

## Reproduce

Run `render_batches995.py /private/output/path --width 3840 --height 2160 --batch 20`.
Each batch acquires `/tmp/gc500-browser.lock` and releases it on completion. Capture
frames 0, 31 through 165, and 420. Existing completed batches are skipped; each real
capture validates all resumed frame hashes and the frozen capture source before it
continues. Put a `pause-after-batch` file in the output directory to stop orchestration
cleanly before the next lock request. Remove it to resume.

For direct capture, `FRAMES` accepts comma-separated native 30 fps frame numbers.
Set `RESUME=1`, `WIDTH=3840`, `HEIGHT=2160` and `OUTDIR=/private/output/path`.
`FULL=1` captures the whole set in one process and must not be used while another
release needs browser access. Default review dimensions are 1280 × 720; the final
encoder accepts only native 3840 × 2160 capture.

Run `encode_machine995.py /private/output/path` once capture is complete. It checks
all unique source frames, vertex bounds, hidden-part identity and exact endpoint
picture and full-pose hashes. It produces a 14-second, 30 fps loop from native poses
and reversed source-frame reuse, with no interpolation. Outputs are a 4K H.264 MP4,
a 1080 H.264 MP4 and a 1080 WebP poster. Both videos have faststart metadata and no
audio track. Files over 32 MiB are rejected.

The encoder converts full-range RGB to limited-range Rec.709 YUV, writes matching
colour tags, checks the encoded stream metadata and decodes both boundary frames.
It also compares the decoded native 4K first frame with its source PNG and checks
the original orange swatch for colour drift.

## Integration and release checks

The page patch is separate. Desktop 4K loads only when the hero is visible and motion
is allowed. Phones and Save-Data use the 1080 preview. Media remains lazy beforehand.

Before publication, review native and encoded samples, verify all media properties,
and test actual MP4 playback on desktop and phone: looping, pause/resume, reduced
motion, visibility, unmount behavior and Back/Close. Follow the exact live release
checks. The renderer itself does not upload or publish anything.
