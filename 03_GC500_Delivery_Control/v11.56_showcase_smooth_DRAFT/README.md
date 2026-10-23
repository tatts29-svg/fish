# Showcase preparation and responsiveness — DRAFT

Author: Andrew Fisher

Andrew reports continued Showcase lag and freezing. This draft builds the existing 3D circuit in interruptible steps, keeps the incomplete scene out of the renderer, and avoids layout and painting of the dashboard covered by the full-screen Showcase. Shader programs use parallel compilation when the browser supports it. The existing geometry, selected look, figures, record and release guard remain authoritative.

Source is based on shared commit ba7f6982e707653c2cc448b9d97ebdaf16d14a9b and live v11.54, SHA-256 d23c1278283e5c7225d946d81f7372796f3d53d86fa6410cc811b08abe6be410. Rebuild on the latest live page after the separately owned v11.55 release if it lands first.

The current live page reproduced a 19.4-second synchronous circuit build at 4× CPU slowdown. Private profiling also identifies dashboard layout work while Showcase covers it. The first draft parses and reaches a complete circuit in a read-only browser; final performance measurements, geometry equivalence, cancellation/recovery, desktop/phone checks and both full sweeps are still pending. **Not ready to upload.** No record change or publication has been made.

`constructors1156.json` contains generator counterparts of the existing constructors, with exact source digests. The patch refuses a changed base or constructor. The original synchronous APIs remain for standalone callers. The scheduler exposes only a complete scene to the adapter. Cancellation abandons the private build and releases its context.
