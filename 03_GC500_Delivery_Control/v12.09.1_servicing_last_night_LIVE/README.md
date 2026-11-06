# v12.09.1 Servicing: the Night report gives the night just finished

Author: Andrew Fisher

Claimed as v12.07.1, a point release between Codex's numbers. Renumbered to v12.09.1 because Codex's v12.09 went live first (the footer never goes backwards).

LIVE 25 Oct 2026 08:49 AEST. Guarded upload passed; a separate public GET at 08:49:18 matched the build byte for byte (06b9435ca8451fc638b40d65f8ce9450d9c61f7c6a93e9fe168c3f0890f7f09d, 15,252,527 bytes, footer v12.09.1). The test reran on the live bytes and passed 16/16 on desktop and phone.

Andrew, 25 Oct 2026, in this chat, just after Saturday's service night closed at 08:00: "Can we not do a nice coates gc500 report dor servicing when is the uodated one with stars."

## What was wrong

- Each service night runs 08:00 to 08:00. At 08:00 the Servicing panel moves on to the new night, before any crew has started it.
- The v12.05 Night report button followed the panel. So after 08:00 it offered "Sun 25 → Mon 26 · 0% · Well below standard so far": an empty report for tonight.
- Saturday's finished night (98%, five stars, Exceptional) was there, but only under "Previous nights · saved history" in the panel.
- Andrew already has Saturday's final report as a PDF, made from the live page's own button with Saturday picked (read only, tracker read 08:24).

## What changes

- **Unless a night is picked in the panel, a night with nothing done yet gives way to the night before it, the one just finished.** The button says so: "Previous night · Sat 24 → Sun 25 · 98% · Exceptional", and it opens that report.
- **Once tonight's first job is ticked, the button follows tonight, as before.** For example, at 04:59 this morning it read "Sat 24 → Sun 25 · 98% · Exceptional so far".
- **A picked night is always the one reported.** The panel's hook now also says whether the night was picked.
- **A night with nothing done never opens an empty report.** The button reads "Sun 25 → Mon 26 · not started yet", and pressing it says to pick a finished night under Previous nights.

No change to any figure, the rating, the report's look, QR codes, crew cards, trackers or records.

## Files

- `patch_v12091.py`:
  - one flag (`picked`) added to the `svcNight1202` hook that v12.05 put in the Servicing tab;
  - four edits inside `report1202-script`: the version, which night `current()` reports, no empty report in `open()`, and the caption in `label()`;
  - footer v12.09 → v12.09.1;
  - it refuses a base other than live v12.09 `87102c75…`.
- `tests/test_native12091.cjs`: read only, 16 checks, in two sessions. The tracker is served from saved read-only snapshots, so the test never calls the tracker service.
  - **This morning's read (08:24):**
    - the panel is on the new night and Saturday has closed;
    - the button offers "Previous night · Sat 24 → Sun 25 · 98% · Exceptional";
    - it opens Saturday's report: closed at 08:00, no "so far", 98%, five stars, five crew cards;
    - picked by hand, Saturday's figures equal what the panel draws;
    - tonight picked reads "not started yet" and opens nothing;
    - view link: no button; no page errors, zero writes.
  - **The 04:59 read:** with work done, the button stays on that night ("… so far").

## Where it's up to

- Built on live v12.09 `87102c753244e9243788c02f9eeabb652847b955a6ed5c733b71df651e4b5751`.
- Candidate `06b9435ca8451fc638b40d65f8ce9450d9c61f7c6a93e9fe168c3f0890f7f09d`, 15,252,527 bytes.
- Tests on desktop and phone: native 16/16; sweeps 27/19/7/Back with zero errors and zero writes.
- LIVE 08:49 AEST; public GET 08:49:18 identical to the build; native 16/16 on the live bytes, desktop and phone.
