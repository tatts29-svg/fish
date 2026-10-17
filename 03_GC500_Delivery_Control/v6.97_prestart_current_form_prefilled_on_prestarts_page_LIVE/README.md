# v6.97 — the Coates Installs pre-start, prefilled, in the form the crew already use (LIVE)

Author: Andrew Fisher · 27 Sep 2026

**Live 27 Sep 2026 at 16:50 AEST**, on Andrew's "Pre start yes". Page = live v6.90 + `patch_v697.py`; checked byte for byte
against the live service afterwards. Replaces the v6.95 draft, which never went live.

## What Andrew asked

- "Pre start yes."
- "The prestart can you not use ones we are currently using. Use our current style of prestarts. Thats the common sense thing to do. U made another."
- "Not go into where u have it going" — so not the Timeline.

## What it is

- **The same sheet:** the "Pre-start — Coates Installs — [day]" pages the Pre-starts page already carries for 14 to 25 Sep
  (`print/render_prestart.py`, GC500-PS-INS-01).
  - Same header, sections and order.
  - Same work tick list and SWMS hazards with their references.
  - Same site rules, Coates Life Saving Rules, emergency, Coates and iEDM contacts, and print style.
  - Nothing is retyped: `build_prestart697.py` reads all of it out of the renderer and its dataset.
- **Filled in from the record for the day ahead:**
  - the day and its drops (off the same schedule the Timeline shows);
  - where on the circuit (off the master plan);
  - the loads (off the transport plan, which holds none for these days yet);
  - the work ticks, by the renderer's own rule;
  - the crew's names, ready for the sign-on.
- **Left for the morning:** the attendance tick, FIT Y/N and the signatures (each person's own), the weather, and the hazard and rule ticks as they are talked through.
- **Added from Andrew's own list (27 Sep):**
  - four hazards the form didn't carry: Take 5, congested areas and low branches, tight spots, high communication at all times;
  - four site rules: Take 5, PPE on, SWMS reviewed together, "Unsure? Ask the question. Everyone has the right to stop the job".
  - Each is in the form's own style and marked "added 27 Sep 2026".
- **Where it shows:** on the **Pre-starts page**, at the top of the Coates Installs section, with a Print button each. The signed sheet is uploaded there as the day's record, as before. The Timeline is unchanged.
- **When (Andrew's rule), on the Gold Coast date, automatically:**
  - Sunday prefills Monday to Wednesday.
  - Wednesday prefills Thursday and Friday, plus Saturday when work is on.
  - A Sunday with work on it is prefilled that day.
  - A working day with nothing scheduled still gets its pre-start, with the whole list ticked (the form's own rule of 20 Sep).
- **Always one A4 page:** the print measures the sheet at paper width before the dialog opens. It brings a busy day in by exactly what it runs over (never below 80 %), and a day that already fits isn't scaled.

## Checked

- Pre-starts page (test browser):
  - Sun 27, Mon 28, Tue 29 and Wed 30 Sep are ready to print, prefilled Sun 27 Sep 2026.
  - "Next: Thu 01 Oct — prefilled Wed 30 Sep 2026".
  - No Timeline button. No page errors.
- Mon 28 Sep: 4 buildings, 4 toilets and 1 generator on, in S10, S13, S11 and S14. Work ticked from the record.
- Printed to PDF: Mon 28 Sep, Wed 30 Sep, Fri 02 Oct (nothing scheduled, whole list ticked) and Wed 07 Oct are one page each.
- Live: the page served by the service equals the built file byte for byte. Printing Mon 28 Sep from it gives one page (`samples/`).

## Two things found on the way

- **The attribution scrub folds `" ."` in script text.** `scrub_attributions.py` turns every `" ."` into `"."` inside any
  script that mentions the author, so CSS selectors written inside JavaScript lose their spaces. The pre-start's styles
  are written with the space escaped (` `). The scrub itself is unchanged, because changing it would change other
  parts of the live page.
- **The same scrub turns crew names into "the project manager".** In the pre-start data the names are escaped the same way, so the
  sign-on reads "Andrew Fisher · Events Project Manager", as on the earlier pre-starts. That is a record fact, not an attribution.

## Files

- `build_prestart697.py`: reads the renderer and writes `prestart697.js` from `prestart697_src.js`.
- `patch_v697.py`: puts it on the Pre-starts page.
- `ps697.js`, `ps697m.js`, `livepre.js`: the tests.
- `samples/`: the printed PDFs.
- `screens/`: the Pre-starts page and the Mon 28 Sep sheet.
