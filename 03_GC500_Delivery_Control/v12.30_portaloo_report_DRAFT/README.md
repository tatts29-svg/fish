# v12.30 the servicing night report: every portaloo (DRAFT, on hold)

Author: Andrew Fisher · 26 Oct 2026

Andrew asked for this on 26 Oct 2026:
- "lets do a report on all last nights portaloos that also mentiones who confirmed locked and cleaned too please add thi into the report"
- "can we also mention or have a Tick of Ready to be picked up please. and then next to it a date when it will be picked up and time. we want this to look really good please"

**On hold at Andrew's word.** v12.31, the Demob tab's ready for collection, went first.

**This is not ready to upload.** `patch_v1230.py` checks it is building on the v12.29 page (BASE `a4d61111…`), but v12.31 is now live, so it must be rebased on v12.31 before it can build.

## What is here

| File | What it does |
|---|---|
| `who1230_src.js` | Lists every portaloo location on the night, area by area. For each one it shows who did each job (the crew group from the crew card, and the person who declared the lock), whether it is Ready to be picked up, and the pick-up day and time. It also prints the door-lock declarations one row each. |
| `patch_v1230.py` | Puts `who1230_src.js` into the Night report. It changes four places in the report and the footer. |
| `tests/make_report_live.cjs` | Makes last night's report as a PDF, read only, through the edit link. The PDF holds crew names, so it is written outside the repository only. |

## Still to do before it is ready

- **Banner tick:** it draws too small. The rule `.rbt span` also styles the `.rbk` tick, so the tick picks up the small text size.
- **Pick-up days:** show them as a calendar, one week per row, instead of chips that wrap untidily.
- **Area tables:** repeat each area's column headings on a continued page.
- **Page titles:** each page should name its own section, not say "Area by area · continued" throughout.
- **Jobs that were not due:** show "Not due" where a job was not on the night's list, instead of a dash.
- **Small fixes:**
  - collapse a time range when both ends are the same minute (00:42–00:42 should read 00:42);
  - say "1 unit", not "1 units";
  - show "proposed" in grey, not orange.
- **Door-lock table:**
  - drop the Received column unless it differs from Declared;
  - stop the crew name wrapping;
  - word the line about lock-ups with no named declaration more plainly.
- **Finish the release:**
  - fix the counters in `make_report_live.cjs`;
  - write `test_v1230.cjs`;
  - run the sweeps and the release steps.
