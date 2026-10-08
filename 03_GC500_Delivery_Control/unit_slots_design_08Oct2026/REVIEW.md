# Unit slots: skeptic review (read only, 8 Oct 2026)

Author: Andrew Fisher

I ran the review read only, against live v9.11 (sha256 408ae6ac…) and record 4581, which a GET confirmed is still current. Both browser runs were in view mode with counts.blocked 0 and 0 page errors, and the page's own functions were confirmed back in place afterwards.

**Verdict:** the idea holds up, but the design as written should not be built. It has 7 problems that need fixing first. Five of them are new risks the design adds; the other two are missing preconditions.

## Survey numbers, re-counted in the page by a different route
1. **The gap: confirmed.** 36 lines on 35 references, 206 units, 424 line-units, 27.08% of forecast labour.
2. **WC31: confirmed.** 16Pan Block ×2 with 1 counted on site, no numbers, one set of ticks, so one tick charges both blocks.
3. **WC50: confirmed.** FWF ×1, number 1211974, install ticked, so it is not a gap today.
4. **Tick counts: confirmed.** 173 ticks on the record: 121 reference keys, 52 unit keys, 0 "rest" keys.
5. **Off-by-one explained.** I get 373 / 202 / 167 against the survey's 372 / 203 / 166, because the survey leaves out WC31's Accessible Toilet (counted 0). The gap figures are unaffected.
6. **No line needs number-to-slot binding today.** 0 priced lines are part-numbered (some numbers plus "rest"). All 36 gap lines have 0 numbers on the line.
7. **The 7 existing block ticks on gap lines are all Event Portables:** WC41, WC43, WC44, WC56, WC59, WC67, WC71.

## Blocking problems and fixes
1. **A labour tick would write the site-counts record.** The design stores slot pins in the per-reference "supplied" document, and the first slot tick writes it. The page syncs one document per reference and the last write wins, so an offline or stale phone can overwrite counts or numbers someone else recorded.
   - Fix: no pins, and no labour tick ever writes that record.
   - A line goes either by asset number or by slot, never both. Once it has any slot tick it stays on slots, worked out from the ticks themselves. Numbers, fleet numbers and VMS boards become labels only.
2. **A tick can be lost when numbers change.** On WC10 (FWF ×3): slot 1 ticked, two numbers arrive with no page write (data releases do this here), then the second number is ticked. That reads 2 pieces. Swap the order of the two numbers and it reads 1. Remove one number and it also reads 1. The removal case already loses ticks today; the swap case is new.
   - Fix: the same as problem 1. A line on slots never moves to number keys, so slot ticks and number ticks never meet.
3. **Typing the quantity down drops a tick.** WC10 with slot 1 ticked reads 1 piece. Type the quantity down to 1 and it reads 0, with the tick still on the record but unread. Today's block tick survives this.
   - Fix: once a line has slot ticks, keep reading them for any quantity of 1 or more. Ticks on slots above the order are listed and not charged, never hidden.
4. **Two phones lose a unit.** Two crews on two phones each tick "the next box" for different units. Both write slot 2. Result: 3 units installed, 2 pieces charged.
   - Fix: numbered boxes only where each unit physically carries "3|12" (stickers become a requirement, not optional).
   - Unmarked items get a counter, "installed 7 of 20", where each tap writes its own unique key, counted and capped at the order.
5. **A stale phone undoes corrections.** On WC56, two phones each untick a different slot after the old whole-reference tick has been spread to every slot. Once both are synced the record shows 12 pieces installed where 10 was meant, so both corrections are lost.
   - Fix: never spread an old tick at run time on a slot line. Convert the 7 old reference ticks once, through the page's own functions on the edit link, with the project manager's yes, a backup first and a fresh read afterwards. Do it only after problem 6 is decided.
6. **Event Portables has to be answered first.** 13 gap lines, 89 units (43%), 178 line-units and 8.26% of forecast labour are Event Portables. WC31 should probably count too: its only recorded unit is labelled Event Portables. All 7 block ticks on these lines are Event Portables.
   - Fix: Event Portables lines keep the block until the project manager says whether Coates labour applies.
7. **The tick grid is the main build, not an extra.** 18 lines holding 163 of the 206 units (79%) have 5 or more units. On a 358 px phone column, today's card layout grows each labour section like this:

   | Reference | Today | With slots, current layout |
   |---|---|---|
   | WC56 | 154 px | 1,902 px |
   | T0025 | 112 px | 2,747 px |
   | WC33 | 112 px | 2,345 px |
   | WC09 | 372 px | 1,286 px |

   - Fix: mock-up on the real page and the project manager's yes before any build (the layout rule).

## Fix in the build (not blocking)
- **Moves:** `moveRecord` and `recordOn` only look at `REF|` keys, so unit and slot ticks are left behind on a move, with no warning. No moved reference holds unit ticks today, so nothing has been lost yet.
- **History:** a unit tick is filed under "WC56/s3", so it is missing from WC56's history. The spread also re-stamps every slot with the editor's name and time, and logs "Labour unticked" against the old reference key.
- **Order of releases:** build after v9.14 (keep fire extinguishers out of slots) and v9.13 (name VMS units by their board, e.g. VMS14, not "3|9"). Schedule 6 can change quantities.
- **Counts that move with no new work:** P&L ticks 192 → 236, plan lines 657 → 999, 44 more Accruals rows. Put this in the release notes for Finance.

## What holds up
- **No money moves on release.** With no slot keys on the record, the full read rule gives exactly today's pieces.
- **No double charging.** A line can never be charged more than its order quantity.
- **Labels fit.** "WC56 12|12 · EP 0009" is 142 px, which fits a phone card (336 px) and only just fits a two-column card (148 px).

## Corrected recommendation for the project manager (6 lines)
1. Yes to naming units "WC56 3|12". I re-checked it on the live page: 424 labour line-units (206 units on 35 locations, 27.08% of forecast labour) can only be ticked as one block today.
2. First, decide whether Coates labour applies to Event Portables units. That covers 89 of those 206 units (8.26% of forecast), probably WC31 too, and every block tick already recorded on these lines.
3. A box per unit only works if each unit is marked "3|12" on site. Otherwise two crews tick the same box and a unit's labour is lost, so unmarked items like Trakmat ×20 get an "installed 7 of 20" counter.
4. Build it simpler than the draft: a line goes either by asset number or by slot, never both, and nothing goes into the site-count record. That closes the three ways the draft could lose a tick.
5. 79% of these units are on lines of 5 or more, and on a phone the current layout would stretch WC56's labour section from 154 px to 1,902 px. So a mock-up on the real page, and your yes, comes before any build.
6. Order: part E, fire extinguishers (v9.14), VMS boards (v9.13), then slots. On release day no money moves, only counts (P&L ticks 192 → 236).

Files are in /tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/skeptic/:
- probe.cjs
- probe.json
- probe_phone.cjs
- probe_phone.json