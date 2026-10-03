# v8.19 — Meet points, site rules and the Event Portables load plan (DRAFT)

Author: Andrew Fisher · 3 Oct 2026 · **DRAFT, tested, not uploaded. Not READY TO UPLOAD.** It needs Andrew's yes on
the screenshots, because the Timeline card is a new panel.

**Numbered v8.19.** The claim on the board was v8.18. In the meantime a separate release, which calls itself "v8.18 —
selected-day weather artwork", went live as `f3bb490b`, without a board entry. The coordinator confirmed the live
base and renamed this release v8.19 (3 Oct 2026). It is built on that weather release.

## What Andrew asked (Claude chat, 3 Oct 2026)

> "This goes for all gear and equipment ... If we unsure they refer back to entry pitlane" — "this now should be info
> for everything now"

> (island west parkland) "no one enter park. Ensure spotters. Wild life. Extemly low branches. There is not much room
> hense sptters and excort is a must"

> "We go by whats on the quote at the moment" — "deliries for next week we move to the 9th oct" — "The loads that come
> in. Will have a run sheet where they go" — "I want qr codes done with direction to get to where they need to go"

> "We allocate everything to a WC number. Then at the end quote is this many. And we mention no WC allocation for these"
> — "Nothing is to be picked up unless emptied" — "They can take early we can store in pit regardless"

## What changed

1. **Meet points, for every reference.** `meetPoint819(a)` takes each reference's master-plan position and applies
   the rule in this order:
   - it is inside a drawn area outline (the island west parkland), so it goes to that area's point;
   - it is in the pit lane precinct (PG.., WC12, WC16), so it goes to pit lane entry;
   - otherwise it goes to the nearest point on the **same side** within 150 m. Side comes from the page's own
     `zone816` (island or outside; seaside or land side on Main Beach Pde and Surfers), and the page's own way-in
     wording decides the side where it names one;
   - anything else goes to pit lane entry.

   This matches the private reference `assign.py` line for line. The data is
   `meet_points_03Oct2026/meet_points.json`. Names and ways in are the ones on the 3 Oct supplier sheets.
2. **Reference drawer.** Under *Where it is* the drawer now shows:
   - "Meet point: <name>";
   - a QR (tap or scan) for Google Maps driving directions to the meet point, at
     `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=driving`, 6 decimals. This uses the
     page's own `qrSvg` and `navUrl`, the same pair as the v7.51 load QRs and the v7.83 share PDF;
   - one line saying why that point was chosen;
   - the parkland rules box, only where the meet point is the island west parkland.

   The meet point's way in is shown only when it differs from the reference's own *Way in* line.
3. **Driver sheet (GC500-DRV-01).** A new *Meet point · site rules* band follows *Where it goes*:
   - each meet point the load goes to, with its QR and the references it serves;
   - beside them, the site rules and the parkland rules. Site hours are not repeated, because the sheet's own rules
     line already carries them.
4. **Timeline: Event Portables · load plan card**, under the day, where deliveries live. It reuses the Timeline's own
   load rows and folds. It holds:
   - **Site rules · all gear and equipment**, the one place on the page, with the parkland rules;
   - **Demob – pick-up**, word for word;
   - the fill-order wording with the early-delivery rule beside it;
   - the **5 loads**. Each row shows the date, zone and count, and opens to its stops: meet point (linked to
     directions), way in, WC numbers, FWF and *left on truck*;
   - **Print run sheet** on each load (one A4 page, below);
   - **Quote Q6845 against WC allocation**, with the *No WC allocation* column in Coates orange (56 / 0 / 0 / 4 / 3,
     63 in all) and the note;
   - **Cancelled – do not deliver**: WC32, WC66, and 6 of the 10 at WC09.
5. **Run sheet.** One A4 portrait page per load, matching `GC500_EventPortables_load_run_sheets_v1.pdf`. It has:
   - the orange header with the author;
   - the load bar;
   - the site rules and the parkland rules;
   - the fill-order and early-delivery wording;
   - the stops, with the count down to 0, a directions QR per meet point and a Done box;
   - the demob notice, the sign-off block and the footer.

   On screen it opens as a preview with *Print / Save as PDF* and *Close*. On paper it prints alone.
6. The footer and the `gc500-release` marker read **v8.19**. The marker was v8.13. The weather release's own
   `gc500-weather-v818` meta is left as it was.

The plan is data and is never recomputed. `event_portables_plan.json` is read at build time, and the patch refuses to
build if any of these fail:

- 5 loads of 24 = 120 FWF;
- every stop's count adds up, and every load counts down to 0;
- every stop sits on its meet point, and its directions URL is that point at 6 decimals;
- every stop's name and way in match the meet point table;
- every quote row adds up;
- the data has no dollar figure, no phone number, no SiteIQ and nothing that would close the script.

On the page: no prices or totals of money, no phone numbers, no contact names, no SiteIQ, no model names. The page's
attribution scrub changes the WC66 "Cancelled by" from "Andrew Fisher, 1 Oct 2026" to "the project manager, 1 Oct
2026", as the page does everywhere. The patch drops the "(Andrew, 3 Oct 2026)" tail of the early rule.

Not touched: Codex's Demob register and logic, the two-location cap, the crane rules, the equipment register and the
record. No record writes.

## Build

`bash toolchain/build.sh v8.19 v8.19_meet_points_ep_plan_DRAFT/patch_v819.py`

| | |
|---|---|
| base (live at build time) | `f3bb490b0a6a23ef820dc71d359b5e246a443778e0d1baef35dcf3393a259000`, 9,265,578 bytes |
| built | see *Checks* (final hash recorded there) |
| check_page | PASS: 7 inline scripts parse, no new keys, author line present |

## Checks

`SCRATCH=<scratchpad> bash v8.19_meet_points_ep_plan_DRAFT/evidence/run_all.sh` runs every suite, one browser at a
time, under the shared lock. All runs are read-only: the harness aborts every write, and `window.print` is stubbed.

RESULTS_PLACEHOLDER

Screenshots (desktop and phone) and the five printed run-sheet PDFs are in the session scratchpad
(`v819/final/`), not in git.

## Independent review

REVIEW_PLACEHOLDER

## Open questions for Andrew / Codex

QUESTIONS_PLACEHOLDER
