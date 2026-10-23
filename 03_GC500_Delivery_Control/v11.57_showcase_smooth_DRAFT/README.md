# Showcase preparation and responsiveness — DRAFT

Author: Andrew Fisher

The Showcase blocks the page while building its 3D circuit, and closing it can wait for unfinished graphics work. This draft breaks the existing construction into interruptible steps, compiles shaders in parallel when supported, keeps incomplete scenes private, limits graphics submission to one outstanding frame and releases the old graphics context after the close action. The dashboard covered by the full-screen Showcase no longer lays out or paints.

The existing geometry, selected look, figures and record stay intact. The original synchronous constructors remain for standalone callers; generator counterparts retain their lexical scope, sequence and random seeds. Exact constructor digests and the full live-page SHA prevent applying the patch to changed source. GPU waits poll with zero timeout and old-context cleanup cannot touch a newly opened scene.

Rebased on live v11.55, SHA-256 7262dbfc63ef6f67744fa8f84bf5a734b60eb48d4655b98c3c9faebaccd63c4e. Gate search v11.56 is separately owned. The uploader must rebuild if that release lands before this one.

Intermediate candidate: 15/15 read-only desktop functional checks, including every static mesh/line byte and circuit/car statistic against the unchanged synchronous constructors; record unchanged, no errors or attempted writes. GPU scheduling and deferred-cleanup unit checks pass. Final desktop/phone runs, sustained playback, sweeps and publication checks remain pending. **Not ready to upload; not live.** Raw captures remain private.

Optional regeneration: `npm ci`, then `node derive_constructors.cjs base_live.html`. This regenerates `constructors1157.json` from the exact base. Normal builds use the checked-in counterparts and do not need npm. Build with the shared `toolchain/build.sh`; publish only through `toolchain/upload_page.py` after the checks pass.
