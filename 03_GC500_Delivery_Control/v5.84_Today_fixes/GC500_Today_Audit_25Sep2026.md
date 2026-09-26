# GC500 Delivery Control — Today view audit
Audited 25 Sep 2026 against https://gc500-production.up.railway.app/v/Coates-GC500-2026#today (view-only link), rendered in headless Chromium at 1440×900 and 390×844 (iPhone-class), light and dark mode, plus an accessibility pass (axe-core, WCAG 2.1 AA) and a load-time check with 4× CPU throttling.

## Verdict
The page is stable: no script errors, search is excellent, the record is consistent, and it works on a phone. For a CEO it currently reads as an operator's console rather than a status page: the first screen is a hero image and a video, the headline numbers disagree with each other without saying why, and internal tooling (Edit, Export, Recording as, Add an asset) leaks into a link that cannot change anything.

Recommendation: fix the nine confirmed defects below (a day's work), then restructure the top of Today so the first screen answers "are we on track, what is behind, what does it cost" in five seconds.

## Confirmed bugs

| # | Where | What is wrong | Fix |
|---|-------|---------------|-----|
| 1 | How far through the job — gauge | The 0 and 100 tick labels and the "DUE BY THIS DAY" caption collide with the 95.2% figure, desktop and mobile. | Move tick labels outside the arc or drop them; put the caption below the number. |
| 2 | Plan lines overtaken by a delivery card | Four-column table collapses to one-character columns ("ty pe d her e") at the 342 px card width. | Render as stacked lines, not a table, below ~420 px; nowrap on the reference. |
| 3 | Lights card | "0 in transit" and "32 of 128 levelled" tiles overflow the card's right edge by ~7 px at 1440 px. | Grid tiles need `min-width:0` and `overflow:hidden`, or two fixed columns. |
| 4 | Daily brief, section 04 "Tomorrow" | Heading says Tomorrow; content is "Look ahead · Sun 27 Sep" because Sat 26 Sep is not a programme day. | Rename to "Next programme day" or show Saturday as "nothing scheduled". |
| 5 | Documents card | Shows "72 in the catalogue" on first load and "245 in the catalogue · 236 uploaded" after any tab reads the library. Two truths in one session. | Show the same number always, or label the first as "in this build" and the second as "uploaded since". |
| 6 | Every page load | The view-only link calls /api/reports and gets 403; a console error on every load. | Skip the call when the link has no reports permission. |
| 7 | Fencing card | "1720 m CCB Event done this week · 1720 m over the plan" and "Clean 1302.5 m · 954 m over the plan": plan quantities are zero or missing, so "over the plan" is meaningless. | When the week's plan quantity is missing, say "no plan quantity this week". |
| 8 | Week label | "Week 4 · Build" is a countdown label from the fencing programme (Week 6 → Week 1 → Event Week). An outsider reads it as the fourth week of a programme that started 07 Sep, which would be week 3. | "4 weeks to event week" or "Build week 4 (countdown)". |
| 9 | View-only leakage | "Put your name in Recording as before you record anything"; Your records card with Export now / Import someone's file; Edit card "3 typed over · Open the edit table"; Tools menu shows an empty "Recording as" section; the day view has an orange primary "Add an asset to this day" button. | Hide all record-changing controls and their cards when the link is view-only. |

## Numbers that disagree on the same page
Each is defensible with its definition, but the definitions are not on the page.

- Top strip: 2 due in · 2 recorded · 0 outstanding · "Every entry due in today has an outcome recorded".
- Delivered today: 8 recorded on site · 6 complete (includes unscheduled arrivals).
- How far through: behind by 10 units · 5 unrecorded · 95.2% of plan-to-date.
- Where we are tab: red dot meaning "assets due in and not on site" (hover only, nothing on mobile).
- Fencing: 58 dockets · $92,551.10. Costs: 54 lines · $92,551.10 (four dockets are unusable, said nowhere on Today).
- Lights: 205 assets · 145 no record. Plan: 804 units, 210 due by today.

A CEO reads "all done" and "behind by 10" within one scroll. Pick one vocabulary (assets, schedule entries) and one sentence for today's position.

## Mobile
- Hero VMS board text renders at 4.8 to 8 px: the countdown headline is unreadable on a phone.
- Tabs: "Where we are" and "Coates Way" wrap to two lines while others are one; the red dot sits on the flag icon.
- Header (107 px) plus sticky four-line footer (95 px) take 24% of an 844 px screen permanently.
- Tap targets: Call buttons, map chips and the WC11/WC12 links are 24 to 31 px tall (44 px recommended).
- Load: about 5 s to interactive on a mid-range phone; 1.4 MB gzipped HTML (5.9 MB parsed, 4.6 MB of it inline data). Repeat loads revalidate with ETag (304) so they are cheap.

## Accessibility and consistency
- 4 WCAG AA contrast failures: the sub-labels on the coloured tiles ("schedule entries", "on the carrier's list") and the tick glyph.
- Date formats: weather line says "their reading of 2026-09-25 18:45"; the rest of the page uses "Fri 25 Sep 2026". The Where we are date picker showed 09/25/2026 in the test browser (native control; confirm on an Australian device).
- Traffic card is fed by reports 4 days old, 9 past their end time, with a "refresh before relying on it" chip a view-only reader cannot act on.
- Tools and More are two different dropdown styles; More overlaps the banner.
- The ticking seconds clock in the header says "device clock" and adds nothing to the record's freshness, which is already shown beside it.

## Visual improvements for a CEO reader
1. Status first. One line at the top: On track / Behind by 10 units · 95.2% of plan-to-date on site · 28 days to race day · $92.6k charged. RAG colour on the line, and the "why" beneath it.
2. Hero below the numbers, or a 160 px band. Keep the countdown as HTML text. Do not autoplay or lead with "Play with sound".
3. One vocabulary and one story: units, references, assets, schedule entries, dockets and lines become two terms with tooltips.
4. Hide the workshop on view-only: Your records, Edit, Add an asset, Recording as, Export/Import, Plan lines overtaken (or rename to "Plan vs delivered mismatches" if kept).
5. Card grid: equal-height rows; today the four-up row runs 277 to 410 px with dead space, and Edit sits alone on the last row.
6. Figures never wrap from their unit ("1302.5 / m", "$92,551.10 / charged"): nowrap the figure, wrap the label.
7. One dropdown style; footer collapses to one line on mobile; single-line tabs with short labels.
8. Red-dot legend: a count badge (5) and one line saying what it means.
9. Weather as a plain sentence: "Surfers Paradise, feels like 16°C, 71% humidity, no rain, 18:45".

## What was not checked
The application source is not in this repository, so nothing was changed. The date picker locale and tap targets should be confirmed on a real Australian phone. Race dates (23–25 Oct 2026) are marked in the data as "not confirmed against a Supercars publication".
