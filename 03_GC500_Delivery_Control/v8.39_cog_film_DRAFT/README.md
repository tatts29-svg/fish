# v8.39 — Coates Way steering-wheel film integration

Author: Andrew Fisher

DRAFT. Visual review is open and no final film has been supplied to this wrapper. Publication is paused. This exact-base wrapper is prepared to compose the preserved v8.35 film controller with three independently reviewed media files. Root owns media registration, standard build, final visual/browser checks and publication. It is not ready or live.

Only the machine hero, three appended DATA.media descriptors and the hosted-media manifest change in DATA. All old descriptors, fonts, board, interactive-car assets, fencing sources and business data remain intact. The existing hero presents a preview; opening the film explicitly requests its full-resolution file. The visual direction preserves the current studio cog design, removes its steel support and improves separation and reassembly. The revised preview remains pending; the existing interactive car remains unchanged.

Set COG_FILM839_INPUT to a private absolute JSON path and COG_FILM839_INPUT_SHA256 to its reviewed SHA-256. The input has schema 1, author Andrew Fisher, and exactly three roles: preview, full and poster. Each role declares path, sha256, bytes, type, width and height. Video roles also declare duration, fps, codec and pixel_format. Paths and source evidence remain outside Git and are not embedded.

Verification requires ffprobe from FFmpeg and Pillow. The validator fails with an explicit dependency message if either is unavailable. Preview/full MP4 files must be H.264 yuv420p without audio, at their reviewed dimensions, with matching frame rate and duration within one frame. Each media file is limited to 32 MiB. The poster is one verified PNG/JPEG with the same aspect ratio. File contents and metadata are checked before the guarded host patch can apply.

Checks: python3 -m unittest discover -s tests -p 'test_*.py'. Set private BASE for the exact current-host proof. Also run the v8.35 component's Python, media and DOM tests. Final real-media desktop/phone playback, fullscreen, focus, Back, reduced-motion and native/financial parity checks remain required.
