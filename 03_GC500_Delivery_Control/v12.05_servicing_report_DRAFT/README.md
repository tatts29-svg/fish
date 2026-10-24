# v12.05 Servicing night report: a Coates report for each service night, rated out of five stars

Author: Andrew Fisher

Claimed as v12.02. Renumbered to v12.05 because Codex's v12.03 went live first (the footer never goes backwards). It publishes in one build with v12.04, the Build cards.

READY TO UPLOAD, 25 Oct 2026. Andrew saw the mock-up (built from the event tracker's real ticks, crew names blurred) and said "build it".

Andrew, 25 Oct 2026, in this chat: "Can we also work on a new coates report for the servicing to be printed off of nights completion. Make this look elite and proffesional. Anything over 90% is exceptionally good. We should rate the night out of 5 stars. So be good to work out where this sits. And we have 5 stars that fill up like a gauge. This report will be sent to the buisness as well as event portables. So really make this stand out. And we talk about team effort."

## What it is

There's one **Night report** button on the Servicing tab, on the edit link only. That's where the tracker is read; on the view link there's no button. It opens a report for the night the panel is showing, with **Print or save as PDF** (the PDF name is "GC500 Servicing Report – Sat 24 Oct 2026").

**Page 1, the night:**
- Whole-night servicing as a big percentage.
- Five stars that fill like a gauge, the rating word, and a scale bar showing where the night sits.
- Units fully serviced, locations complete, areas finished, and first-to-last completion.
- Each job (pump out, clean and restock, water) with its ring.
- **Team effort:** every crew's services, areas and hours, and a thank-you signed with the page's author credit ("Andrew Fisher · Shutdown Manager · Coates").

**Page 2, area by area:**
- Every area with units, locations, % done and its finish time.
- What was left at close, grouped by area with the missing jobs as coloured chips.
- How the night is scored.

Whole blocks move to a third page only when a night has more left over than fits, so nothing is ever cut off. Every page is numbered.

**The rating** (Andrew: "Anything over 90% is exceptionally good"):
- One star for every 10 points above 40%. The last star fills part way like a gauge.
- 90% or better is ★★★★★ Exceptional; 80–89% Very good; 70–79% Good; 60–69% Fair; 50–59% Below standard.
- Fri 23 Oct (78%) reads 3.8 stars, Good. Sat 24 Oct (98%) reads 5.0, Exceptional.

**One figure everywhere:**
- The Servicing tab's own panel hands the report its last verified tracker read, its service clock and its night (`svcNight1202`).
- Every figure goes through the one state rule (`SvcState`: jobs weighed by their units, rounded down), exactly as the panel draws it.
- No second read and no write.

**What's left out, because it goes to Event Portables:**
- no money;
- no hidden tabs;
- no "partner" wording.

No QR code, crew card or tracker link is touched. Nothing is recorded.

Fonts: the page hands its own font files (already in its cache) to the report window, so the report never downloads its own; layout waits at most 4 s.

## Files

- `report1202_src.js`: the rating, the model (`model`), the report (`html`, two A4 pages plus a measured pager) and the button.
- `report1202.css`: the button on the Servicing tab.
- `patch_v1205.py`:
  - exposes `svcNight1202` inside the Servicing tab's own script;
  - inserts the style and script before `steady1143-script`;
  - moves the footer to v12.05;
  - runs on live v12.03 `682fcc85…`, or after `patch_v1204.py` in the same build.
- `tests/test_native1202.cjs`: read only, 14 checks.
  - On the view link, no button and the panel hands over nothing.
  - On the edit link, the report's night, percentage and each job equal what the panel draws.
  - The stars and rating word are right.
  - The report window shows the same figures, every crew, numbered pages, nothing cut off, no money or partner wording, and is signed.
  - No sideways scroll, no page errors, zero writes.
  - It serves the tracker from a saved snapshot (`TICKS=…`), so it never calls the tracker service.
- `tests/fetch_ticks1202.py`: takes that snapshot read only, paging the way the page does. It prints no tokens, links or names. Keep the snapshot in a private scratch folder; it is never committed.

## Where it's up to

- Rebuilt on live v12.03 `682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69` with v12.04 in the same build (earlier candidates: `0f7bd1f0…` on v12.00).
- Candidate `68a8da20f7576dc58357757efdb54471967c67deb49df68265ee4bf1ed1dc895`, 15,226,860 bytes.
- Native 14/14 on desktop and on phone; with v12.04's suites and both sweeps clean.
- Next: guarded upload, public bytes check, tests on the live page, LIVE.
- Open for Andrew: WC85 (Coates Compound) and WC100 (2 trailers, no location yet) are on the servicing list and weren't serviced on either night. If they shouldn't be, they can come off the totals (as SPASHDOWN does, no QR change), and Saturday would read 99%.
