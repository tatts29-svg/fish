# v6.95: the pre-start, prefilled automatically on the Timeline (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "In the timeline I want a prefilled prestart done for each day, based off what is coming in ... only ever
prefill 3 days. So Sunday's prefill Monday Tuesday Wednesday. Wednesday's prefill Thursday and Friday ... this needs to be
done automatically."

**Nothing here is live.** `patch_v695.py` + `prestart695.js`. It stands alone: it applies to the live v6.90 page, or on top
of the v6.93/v6.94 map drafts.

## When (automatic, on the Gold Coast date; nobody presses anything)
- **Sunday** prefills Monday, Tuesday and Wednesday.
- **Wednesday** prefills Thursday and Friday. Saturday is prefilled only when something is scheduled on it, because the site's
  hours are Monday to Friday unless iEDM approves otherwise.
- **A Sunday with work on it** is prefilled that morning.
- **Never more than three days ahead.** A day further out says when it will be prefilled (for example "prefilled automatically
  on Wed 30 Sep 2026").

## What each pre-start holds (on the day in the Timeline, with Print pre-start)
1. **What is coming in:**
   - units in and out by type, and the carrier's loads with their times;
   - the sectors the work is in.
2. **Hazards and controls, each with a tick box.** Andrew's list every day:
   - Take 5s;
   - safety gear on;
   - spotting trucks;
   - reviewing the SWMS;
   - unloading trucks;
   - congested areas and low branches;
   - tight spots;
   - high communication at all times.

   Each one adds what the day's work brings: building lifts with tag lines, light-tower masts raised only with the overhead
   clear, toilet and generator placement, removals.
3. **The Coates Life Saving Rules**, word for word off the Coates card, as printed on every pre-start since 22 Sep.
4. **"If you're unsure, ask the question. Everyone has the right to stop the job."**
5. **Site:** hours, iEDM contacts, and a space for what is added on the morning.
6. **Printed page only:** a supervisor and start-time line, and a sign-on table.

The prefill is the start of the pre-start, not the record of one: the supervisor adds the morning's items, the crew sign on,
and the signed sheet is the record.

## Checks (Sun 27 Sep 2026, live record, read only)
- Mon 28, Tue 29 and Wed 30 Sep show as prefilled Sun 27 Sep; Thu 1 Oct says Wed 30 Sep.
- Mon 28 Sep: in 9 (4 portable buildings, 4 toilets, 1 generator) in S10, S13, S11 and S14.
- The print view renders; no page errors on desktop or phone.
