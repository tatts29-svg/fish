# Build day stamp — preview only

Author: Andrew Fisher

Status: **DRAFT PREVIEW ONLY — not ready to upload and not live.**

This draft enlarges the existing green completed-day stamp on Build. It retains the original image, ink texture, per-card angle, colour and native completed-day logic. The dark card, date, weather, progress, work, staff, safety information and controls retain their existing markup and positions. Demob is outside this selector.

The requested two-to-three-times enlargement cannot fit beside the date without covering existing information: the current visible artwork occupies approximately 91% of its source image. This bounded proposal uses a 204px stamp instead of 166px, or 196px instead of 148px on screens at most 360px wide. It moves the stamp slightly right and 4px upward within the existing gap. This is approximately 1.23× / 1.32× in width, not 2–3×. It awaits review of the actual before/after phone and desktop captures.

`build_preview.py` accepts only live v12.50 HTML SHA-256 `7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404`. The single added style block is exactly reversible; no JavaScript, markup, footer version or operational record changes are included. A changed live base requires explicit review and a fresh build.

Build with `python3 build_preview.py PRIVATE_LIVE_HTML PRIVATE_PREVIEW_HTML`. Keep complete HTML, frozen records, screenshots and detailed native results outside this repository.

`tests/preview.cjs` takes `BASE`, `PAGE`, `STATE`, `OUT`, `DAY`, `EXPECTED_PAGE_SHA` and `EXPECTED_STATE_SHA`. It uses the existing read-only harness and a frozen native record, captures before and after at desktop and phone widths, checks unchanged native content/positions and original artwork/angle, and checks visible ink bounds against date/week/weather text. It also requires exact original source reversal, unchanged native records, empty write queues, zero page/console errors and zero attempted HTTP writes. Evidence remains private.

The local preview SHA-256 is `3361eda980f8807136db905c5fe786c58cee2db9eaa4a1d90a6349e568579f20`. Native proof passed at 1440px, 390px and 360px: unchanged native markup/content geometry, original artwork and angle, no date/week/weather text collisions, unchanged frozen records, zero page/console errors and zero write attempts. Actual screenshots have been inspected. The stamp is about 51% larger in area on desktop/normal phone and 75% larger on small phones; these are presentation previews, not a completed release.

Publication remains outside this draft. Before any release, resolve the size/design review, rebase against the then-live page, complete required release checks and use the guarded shared uploader with exact live read-back.
