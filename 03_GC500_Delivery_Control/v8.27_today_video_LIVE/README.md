# v8.27 — Today video playback

Author: Andrew Fisher

LIVE 4 Oct 2026 at 02:16 AEST. Guarded upload and public readback match the exact tested candidate. Actual public desktop/phone playback checks passed 15/15.

Today’s embedded progress section has no banner of its own, but its `wireBoard()` call previously disposed the real Today banner before checking for a replacement figure. The Play handler was consequently removed. The patch checks for an actual board first, then replaces existing resources.

A deliberate Play also works with reduced-motion preferences, while decorative animation stays off. The same control provides Cancel while loading and Stop during playback. A 20-second load limit restores the still and Retry. Failure/timeout and `NETWORK_NO_SOURCE` cause the next explicit Retry to restart native source selection; ordinary Play/Stop does not reload. Generation checks prevent an earlier request from interrupting a later Play or restarting after cancellation.

Both original video sources, captions and the banner template remain unchanged. The existing visibility, pane-exit, folded and offscreen checks still stop playback. There is no autoplay and no operational-record change.

The public-safe Python source files require the exact privately held v8.26 HTML input identified in `SOURCE_MANIFEST.json`. The HTML itself contains operational data and is excluded from this source package. The loader verifies the source bytes before execution and validates the complete output hash before writing. It supports the toolchain’s single working-copy argument, plus a separate input/output preview mode.

```
python3 patch_v827.py /private/path/working_copy.html
```

Root owns the standard build and publication. The wrapper alone changes the two release labels from v8.26 to v8.27. It refuses a stale base, altered source or repeat application.

Final candidate evidence: 53/53 CPU controller checks, 14/14 build/source-boundary guards, 6/6 restored-network Retry checks, 18/18 real-media checks, 11/11 native lifecycle checks, Today 23/23 desktop and 18/18 phone, selected-card motion 16/16 per viewport, and both 22-tab/seven-link/Back sweeps. No page errors or operational writes occurred in these bounded browser checks. Full wider v8.26 suites were not repeated; exact byte preservation demonstrates their source remains unchanged. See `TESTING.md` for reproducible test sources, scope limits and the preserved historical-fixture correction rationale. The portable actual-public smoke subsequently passed 15/15 on the served v8.27 page. Runtime reports and screenshots remain private.
