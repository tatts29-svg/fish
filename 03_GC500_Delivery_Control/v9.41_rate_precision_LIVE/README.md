LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Displayed daily-rate precision — v9.41

Author: Andrew Fisher

READY source for integration after v9.40. Not published independently.

A native equipment drawer could show a daily rate rounded to cents beside a subtotal calculated from the original rate. Multiplying the displayed figures could then differ by a cent. The formula now shows only the extra rate digits needed to support the existing subtotal. Ordinary rates remain at two decimal places. Additional precision says “subtotal rounded to cents”.

This changes one formula in the equipment drawer's editor-only Contract & charges section. The original rate, charge window, quantity, minimum-hire note, native subtotal and every financial model remain unchanged. It does not alter the ordinary currency formatter, returned model basis strings, charge rules, capability rules or shared records.

The display helper validates the printed factors with decimal arithmetic. Where incomplete data, a different calculation basis or a floating-point edge prevents a supported equality, it retains an explicit limitation instead of inventing a rate. Precision is bounded at eight decimal places. No operational prices or source records are included in this folder.

## Build

Use the shared build tool with `patch_v941.py` after v9.40. The patch refuses the wrong footer, an absent restored native drawer or reapplication. `--preview-base-937` is solely for the focused private proof on the existing combined v9.37 candidate; it is not the production base.

## Focused checks

- 50 synthetic checks cover ordinary prices, additional precision, zero, negative credits, incomplete values, large multipliers, decimal ties and explicit fallback wording.
- Six patch checks prove wrong-base/reapplication rejection and that removing the display helper, one formula expression, marker and footer reconstructs the exact original page.
- The frozen-record browser proof checks every native daily formula, actual editor-only drawer rendering on desktop and phone, no horizontal overflow and no record writes. All 16 financial model outputs must remain deeply identical.
- The preceding money audit separately compared 24 rendered views and eight equipment drawers on the same frozen record and clock. Sanitised counts are in `evidence/review.json`; source values and screenshots remain private.

Run synthetic and guard checks:

```sh
node v9.41_rate_precision_LIVE/tests/model941.cjs
BASE941=/private/base937.html python3 v9.41_rate_precision_LIVE/tests/patch941.py
```

Run the focused browser proof with `BASE941`, `PAGE`, `FROZEN_STATE941`, `CLOCK941` and `OUT941`. `BASE941` and `PAGE` must be exact before/after files; the frozen snapshot and ISO clock must be from the same audit. Take the shared browser lock. Configure `NODE_PATH`, `CHROMIUM_PATH` and optionally `GC500_CACHE` as for the shared harness. All service writes are blocked; only the deliberately denied Google map-session setup request is an accepted denial.

For final integration, compare only the 16 models without repeating the prior 24-view audit:

```sh
MODEL_ONLY941=1 \
REFERENCE_MODELS941=/private/audited-after-models.json \
PAGE=/private/final-combined.html \
FROZEN_STATE941=/private/frozen-state.json \
CLOCK941=/private/clock.json \
OUT941=/private/final-model-proof \
flock -w 60 /tmp/gc500-browser.lock \
node v9.41_rate_precision_LIVE/tests/browser941.cjs
```

The model-only mode verifies that the native shared state remains unchanged and emits only counts, hashes and pass/fail metadata. Financial results and failure detail are written only inside the private output directory. The release owner runs the final combined-page native tie-outs and navigation checks.
