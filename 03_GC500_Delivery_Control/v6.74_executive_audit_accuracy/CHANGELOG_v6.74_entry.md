# GC500 Delivery Control — v6.74 (26 Sep 2026)

**The executive audit, stage 1: what the numbers mean.** Built from the CEO-presentation audit handed over on
26 Sep 2026 (`GC500_Claude_Handover-1.md`, `GC500_Executive_Audit_Brief.docx`). No stored record and no money
calculation was changed. What changed is what the page claims, so that nothing unknown reads as green and every
headline says its unit and scope.

Author: Andrew Fisher

## Accuracy fixes (P0)

| Audit ID | Before | Now |
|---|---|---|
| DATA-01 | Coates Way: "Nothing is red on this job today … no fencing line over its quote" (no quote had been entered) | Fencing types behind the programme show as red. A "Not assessed" list shows fencing against its quote ("quote required"), fleet unavailability ("not measured") and the commercial result ("forecast incomplete") |
| DATA-02 | Today: "How far through the job we are — 100%" (196 of 196 due) and "790 units on the whole job" | "Deliveries due by today met". The whole job reads "764 quantified units + 26 references awaiting quantity confirmation", and its percentage is marked provisional |
| DATA-03 | Coates Way showed 100 % "Fleet time utilisation" and 0 % "Redline" from job proxies | Both show "Not measured by this system". The job's own measures (delivery adherence, breakdowns recorded) appear under their own names |
| DATA-04 | "4,342.5 of 11,329 m temporary fence installed" | "…m of fence work on dockets". The note explains that the 36505 → 36539 clean-to-scrim conversion appears on both dockets |
| DATA-05 | Costs headline led with "$181,443 ahead … covers wages up to $83.90 an hour" | "Difference so far" plus a **Forecast incomplete** chip. It is not called a margin or profit, and the $/h figure has been removed from all three places |
| DATA-06 | The 8 prebill-differs lines were mentioned only in the missing list | The headline marks them as provisional, showing the rule amount and the prebill amount, not netted |
| DATA-07 | "Race weekend — worked 159 h" (event is 23–25 Oct) | "Race weekend — planned" until the days have passed (then "worked and planned", then "worked") |
| DATA-08 | Fencing "Cost" columns; clean rate shown as $16.16 while the charge is $1,616.07 | Columns read "Client charge ex GST". Rates show the precision they are stored at ($16.1607), and each docket line shows qty × rate = charge |
| DATA-09 | Aggregate fence metres ahead masked shortfalls by type | Plate, email and Coates Way list the shortfalls: scrim 1,359 m · vehicle gates 34 · pedestrian gates 1 · CCB demarcation 810 m. "Areas ticked done" is now "Docket areas ticked done" |
| DATA-10 | WB02 removal card showed 08:00 (the delivery's time); the schedule says 5.00 pm | A removal shows the time its own schedule row gives (17:00), or "time to confirm". The 2019 closure drawing (project 19003 rev 13) is badged "Reference only — 2026 closure authority to confirm" |

## Consistency fixes (P1)

- **UI-01:** a gap day now reads "Build phase · day 20 of 68", not "before the programme" or "outside every week". This applies to the header, Today, the email and the day strip.
- **UI-02:** "Event opens · Fri 23 Oct" replaces "Race day" in the header pod and the gauge.
- **UI-03:** the visible `/* v6.00 … */` and `/* v6.01 … */` comments on Coates Way are removed.
- **DATA-12 / 13:** "Fencing dockets 58 recorded · 57 fully priced · 1 partly priced" replaces "Dockets signed 58 · 58 priced". "Contacts on the record 17 — 8 Coates, 8 Advanced, 1 other". "Pre-start documents by crew".
- **DATA-11:** the transport card's empty state now says what it covers. The schedule's transport figures are scheduled estimates, not invoices.
- **DATA-15:** "Delivered today" becomes "Delivery updates today". Its times are record times, and a bare midnight reads "time n/r".
- **DATA-16:** "0 of 83 recorded" becomes "Specification check: 0 of 83 item lines verified".
- **DATA-17:** the forklift contract pool ($15,105.60, 10 lines) is shown once. Other forklift rows point to it.
- **DOC-01:** Today's document count loads the service's file index itself, so it no longer depends on opening Documents first.
- **UI-06:** "nothing removes it" becomes "return date not recorded". "NO PROGRAMME WEEK" becomes the phase and day.
- **UI-08:** the showcase no longer says "meet the crew on the next scene". Fence metres are "on dockets", not "installed".
- **UI-09:** map chips are labelled "Delivery status on this plan".
- **REL-01:** until the shared record answers, the strip reads LOADING and the headline figures are dimmed.

## Checked

- Syntax: all 3 page scripts pass `node --check`.
- Navigation sweep (desk and phone): deep links, back/forward, drawer, search, showcase open/Escape/Back, reload. No errors.
- Money audit: no errors.
- View dump of every tab against the live record: every changed wording was confirmed on screen.
- Live: `/v/…/` matches the local build byte for byte.

## Owner decisions still open (shown as "to confirm", nothing invented)

1. Fencing quote quantities from Advanced Temporary Fencing: until they are entered, "over quote" cannot be assessed.
2. The 8 contract lines where Baseplan's prebill differs from the rule ($16,554 by the rule vs $22,986 prebilled) need settling line by line with the branch.
3. Wage rates for the tracker's 2,162.5 h, and Alfie Harris's accommodation rate (39 nights).
4. WB02 removal time: the schedule row says 5.00 pm. Confirm that is the effective time.
5. Asset 1211961 appears against both WC11 (on site) and WC12 (plan). Confirm which is effective.
6. 2026 closure authority for the fencing closure plan drawn on the 2019 base drawing.
7. Whether 23 Oct is a race session or event opening (labelled "event opens" until confirmed).
