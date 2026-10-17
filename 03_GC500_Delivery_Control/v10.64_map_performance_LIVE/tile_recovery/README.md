# Pyramid tile recovery — draft

Author: Andrew Fisher

The existing pyramid tile queue can keep all six slots occupied indefinitely if a fetch, response body or bitmap decode never settles. This leaves later drawing tiles queued even when the connection recovers.

`patch_tiles1064.py` changes only the non-SVG branch of `pumpVT`. An attempt now has a 20-second deadline, matching the satellite queue. Cancellation and timeout release its slot once; late results are ignored, and late bitmaps are closed. The existing 1, 2, 4 … 30-second retry schedule and packed-level fallback remain. Timeout never marks a missing tile as an empty completed tile. Replacement requests start in a microtask so the existing pruning loop finishes before they are installed.

The transformer requires the original branch exactly once and refuses a repeated patch. It can be imported as `apply(text, path)` or run with source and output paths. It contains no complete machine source or operational records.

Validation: 15 deterministic regression scenarios pass using the actual `requestVT` and `pumpVT` extracted from the supplied source, with controlled network/decode promises and a fake clock. They reproduce the original six-slot freeze, exercise all three stalled stages, immediate/stale cancellation, late bitmap cleanup, slot counts, retry timing, valid empty tiles, packed-level errors, unchanged source outside the branch, JavaScript parsing and transformer guards.

```sh
PYTHONDONTWRITEBYTECODE=1 node test_tiles1064.cjs /private/path/to/explorer.js
python3 patch_tiles1064.py /private/path/to/explorer.js /private/path/to/candidate-explorer.js
```

Integration still needs the page's pinned explorer script digest updated, current map/browser checks, and the guarded machine/page publication with exact read-back. This isolated test does not claim a browser or live release verification.
