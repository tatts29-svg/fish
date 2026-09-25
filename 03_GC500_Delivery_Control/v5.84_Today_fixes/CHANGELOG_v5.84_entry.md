## v5.84 — 25 Sep 2026 · The Today view read as a stranger would — nine defects from a view-link audit, and what a view link no longer shows

Candidate source. Andrew alone deploys; nothing here claims a production deployment. **No server change** — server
v5.77 stays up. What goes up: the page only (`print/out/GC500_Delivery_Control_hosted.html`).

An audit of the live view link on 25 Sep 2026, read the way a reader from outside the job would read it, at
1440 px and on a 390 px phone, in light and dark, with an accessibility pass. Every item below was seen on the
page, not guessed at, and each is fixed in `print/build_asset_app.py` with a note beside it.

- **The dial's figure collided with its own labels.** The big per-cent figure was sized from the viewport, the
  dial from its card: at 300 px the 0 and 100 labels, the "due by this day" caption and the foot line ran into
  it. The figure and the caption now size from the dial's face (`container-type:inline-size`), so they shrink
  with it and the print sizes are unchanged.
- **The Lights tiles spilled out of their card** by 7 px at 1440 px — `1fr` without `minmax(0, …)` and nowrap
  labels. The grid is `repeat(2, minmax(0, 1fr))` and the label wraps.
- **"Plan lines overtaken by a delivery" collapsed to one-character columns** on a 342 px card. A clash row is
  a sentence now, not a flex table.
- **"Tomorrow" was not tomorrow.** Section 04 of the brief showed Sun 27 Sep on Fri 25 Sep, because Saturday is
  not a programme day. The heading reads "Next programme day" whenever the look-ahead is not the next calendar day.
- **The Documents count changed mid-session without saying why** — 72 on first load, 245 after any tab read the
  library. The chip says "in this build" until the library has been read and "listed" after it; the second chip
  says "uploaded since the build".
- **A view link asked for the card reports on every load and was refused** (a 403 in the console every time).
  A view link records the refusal itself and never asks.
- **"1720 m over the plan" where the plan quantity was nought.** A fencing line with nothing planned this week
  says so.
- **"Week 4 · Build" read as the fourth week since the start** — it is the fourth week before event week. The
  label says "Week 4 · Build · 4 weeks to event week" on Today and on the brief; the sheet's name is unchanged.
- **What a view link does not show.** "Put your name in Recording as", the Your records card with Export and
  Import, the Edit card, the day view's Add an asset and the brief's amber "Confirm outcome" were all on a link
  that cannot change anything. They carry `.editonly` and go with the body's `viewonly` class (so a link the
  service turns read-only after the render loses them too); the Tools menu's name field goes with them.
- **The phone.** The board's three lines are said in words under the picture (the lamps are a hundred pixels
  wide there); the footer is two lines, not four; the tab's attention dot sits off the glyph; every button on
  Today is at least 40 px tall.
- **Small print.** The sub-labels on the coloured tiles ("schedule entries", "on the carrier's list") now clear
  4.5:1 on their tints; a figure never wraps away from its unit ("1302.5 / m"); the weather's reading time is in
  the page's own date form.

**Checked, and not checked.** The page was checked in headless Chromium at 1440×900 and 390×844, light and dark,
served locally with the live record and the v5.83 media: no script errors, no request to /api/reports from the view
link, the dial's figure clear of its labels at both widths, no tile outside its card, no horizontal scroll, WCAG AA
contrast clean on Today apart from the white-on-green Complete tick that was already there. **The gate, the seal and
`tests/` are PENDING** — this session had 20 of the 24 handover parts and no `tests/` folder, so nothing in
`build_all.py` was run; the next session with the whole tree runs `python3 tests/test_v583.py` and the gate before
this is called a release.

Not changed, and said here so nobody looks for it: the counts that disagree on the same screen (2 due and all
recorded; 8 recorded today; behind by 10 units; 58 dockets against 54 lines) are each right by their own
definition and the definitions are not on the page — that is a wording decision for Andrew, not a defect; the
two dropdown styles (Tools, More); and the order of Today, which still opens on the picture rather than the
position.

