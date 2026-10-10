# Animated Build card design preview

Author: Andrew Fisher

**DRAFT — not ready to upload, not published. Live remains v9.92.**

Andrew requested a refined mock-up on the actual page, retaining animation, lights and known dimensions/weights. He then identified the white Available staff area as inconsistent with the page. This folder contains that reviewable preview only.

The preview aligns load number, time, destination and actions; separates native measurements into larger readings; keeps qualification labels visible; and uses compact charcoal panels for Available staff, day More info and Truck flow. The nested white card face is removed. Available staff still uses the shared daily roster and native editing permissions.

Native light stages, current-stage pulse, weather animation, hover feedback, tap sweep and Details transitions remain. Motion controls, reduced motion and offscreen lamp suspension are retained. No continuous animation loop was added. The legacy Navigate pulse now also stops with Motion Off, reduced motion and print. Real loads retain their actual status; the preview does not pretend an Off-site load is in transit to demonstrate a pulse.

Measurement strings are preserved verbatim, including units, ranges and certainty labels. The patch changes presentation only; no operational record, financial model, load state, staff assignment or route is written.

## Reproduce

From `03_GC500_Delivery_Control`:

```sh
bash toolchain/build.sh v9.93-preview-final2 v9.93_animated_load_preview_DRAFT/patch_v993.py
```

The patch requires exact live v9.92 SHA256 `0460e6f2306946c0e7262600414ff65b0824b0a086e618dbce28d7c66669e890` and refuses a second application.

Preview SHA256: `a93c369b91dec0deafb2d677fbbb8a263563c93271f5e57962bd4a330d646308`.

Preview size: 14,756,116 bytes; 78 inline scripts. Build syntax, attribution and secret checks passed. Duplicate-application and wrong-base guards passed.

The capture harness in `preview/` uses the existing read-only shared harness with a local browser-video wrapper. Every browser run requires `/tmp/gc500-browser.lock`. Private screenshots and video remain outside Git in `/workspace/private-gc500-v993-preview/`. Compact preview validation is saved under `tests/`; this is not a release gate or approval to upload.

## Preview validation

Desktop (1440 × 960) and phone (390 × 844): 22 focused checks each, zero browser errors and zero operational writes. Checks cover native numeric strings/qualification labels, 19px/18px measurements, roster names/count/access controls, layout and visible lamps, Truck flow/Details/record/progress controls, Motion Off, reduced motion, offscreen lamps and unchanged shared records/P&L. Desktop and phone stills were visually inspected. These checks apply to this preview scope; no full release sweep or publication was performed.
