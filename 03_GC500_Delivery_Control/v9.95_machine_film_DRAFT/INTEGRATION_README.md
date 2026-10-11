# Coates Way film integration

Author: Andrew Fisher

DRAFT. Integration source is held. Desktop30/30 and phone28/28 source-matched960movie fixture checks pass, including16.5seconds across4native version polls without remounting. Media render and final native 4K browser tests are still in progress. Nothing
in this component has been uploaded. The current Coates Way card, hero button,
interactive machine, branding, colours and navigation remain as built.

`patch_v995.py` starts from exact v9.94 SHA256
`382311bc1faf33ca1333d1431368a442dbdf651a6d23874b56ef65bae7ed8dd8`.
It changes the hero media, three additive catalogue entries, the associated
immutable manifest, playback lifecycle and release footer. The native picture-status handler gains an IMG-only guard so assigning a video source cannot cover it with a picture-loading message; image loading/error/retry behaviour remains unchanged. All old media and
permissions remain. The native Open machine action remains. The rendered movie
uses the original geometry/artwork; render details and limits are in
`RENDER_README.md`. No mechanical part-count claim is added to the page.

The hero retains the native muted loop. Its source is assigned only when the card
is visible and motion is allowed. Desktop uses the native 3840×2160 movie; a CSS
viewport up to 767px or Save-Data uses the matched 1920×1080 encode. Device pixel
ratio does not turn a phone into the desktop download. Only one movie URL is set.
A decoder failure can fall back once from 4K to 1080. Motion off, reduced motion,
visibility, offscreen/tab/modal, print and page suspension pause the film. Redraw
releases the old observers, listeners and decoder. No polling/frame loop is added.

`media995.py` verifies the private report digest, actual media digests and byte
counts, MP4 faststart, H.264/yuv420p video without audio, Rec.709 colour tags/range, exact dimensions, 420 frames
at 30fps/14 seconds, reported decoded seam and native endpoint evidence. The poster
must be a single 1920×1080 WebP. Each file is limited to 32 MiB. The source catalogue
has 1979 entries; this change has 1982, below the service limit of 2000. Video proof
is a true geometry render; the original artwork texture remains its native detail.

Use the renderer's final `media-verification.json` after root visual acceptance:

```bash
export MACHINE995_REPORT=/private/final4k/media-verification.json
export MACHINE995_REPORT_SHA256=<sha256-of-that-exact-report>
toolchain/build.sh v9.95 v9.95_machine_film_DRAFT/patch_v995.py
python3 v9.95_machine_film_DRAFT/register_media995.py build/GC500_v9.95/GC500_Delivery_Control_hosted.html
```

The final command is a dry run by default. It reads current live bytes, credential
capability and the immutable media inventory. Only root publication adds `--apply`
after the tested source and READY state are committed/pushed. It uploads only the
three missing content-addressed files, registers the additive manifest, verifies
all existing server descriptors (including unrelated manifests) remain intact,
and checks all three actual public media bytes. It never uploads the page or writes
operational records. The normal guarded `toolchain/upload_page.py` follows.

When credentials are host-injected, pass the existing `--credential-proxy` option.
No credential is written to a file, command line or log. A changed current page
stops both media registration and normal page publication.

Tests:

- `python3 -m unittest discover -s v9.95_machine_film_DRAFT/tests -p 'test_*.py' -v`
- `tests/player995.cjs` under `/tmp/gc500-browser.lock`, desktop and phone. Set PAGE,
  EXPECTED_SHA, OUTDIR and MACHINE995_TEST_MEDIA to a private role-map JSON. That map
  has `{scope,roles:{full,preview,poster}}`; each role contains its private path,
  immutable file/hash/bytes/type and actual dimensions. The read-only harness serves
  only those exact digest-verified local files; all API writes are aborted.
- Set `PUBLIC=1` for actual-public HTML/media, with no local substitution.

Any early 960×540 movie fixture checks only the playback integration and is explicitly
labelled in evidence. It cannot pass the release media validator and does not prove
4K quality. Final media tests must be rerun using the real 4K/1080/poster outputs.

After validating final media, make the private role-map with:

```bash
python3 v9.95_machine_film_DRAFT/media995.py --write-test-map /private/final-media-roles.json
```

For standard navigation sweeps before media registration, preload the strictly
read-only provider so the new movies and poster come from verified local bytes:

```bash
MACHINE995_TEST_MEDIA=/private/final-media-roles.json PAGE=build/GC500_v9.95/GC500_Delivery_Control_hosted.html \
  flock /tmp/gc500-browser.lock node -r ./v9.95_machine_film_DRAFT/tests/media995_hook.cjs \
  v9.80_showcase_sound_LIVE/tests/navigation980.cjs
```

Retain that wrapper's normal EXPECTED_SHA, OUT and phone MOB=1 variables. The hook
handles only these three exact same-origin content-addressed media GETs, including
byte ranges. APIs and all unrelated assets use the standard harness. PUBLIC=1
always disables substitution.
