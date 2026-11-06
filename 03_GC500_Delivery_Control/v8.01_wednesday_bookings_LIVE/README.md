# Wednesday 7 Oct 2026 bookings

Author: Andrew Fisher

Andrew asked to load the supplied Supercars bookings and ensure trucks leave Kingston in the order in the DD column. This updates the fourteen existing schedule rows, keeping their prior source entries, quantities, map positions, pricing and operational records. It adds no duplicate references or delivery events.

The existing dispatch cards, day records, load briefs, pre-starts, driver sheets and installer sheets carry DD departure order separately from the loading clock. P55 and P56 remain separate 05:00 SFL trucks. The Helen Park container (T0258) and WC86 share the fourth truck. WC20 has two one-unit tank loads at seventh and two one-unit toilet-block loads at eighth. Asset-to-DD pairing for the blocks follows the order of the two supplied lists and says so in the source/load brief. Eleven trucks are known; the four FWF references have no truck, carrier or loading time supplied. Print output has fifteen groups, with 28 units in total. WC38's 07:00–11:00 text remains a note.

GN18's booked asset is 1261273 ex REED. The operational allocation remains 1276501; 1261273 is already allocated to GN13. Booking views explicitly flag this conflict for confirmation before dispatch. No allocation, arrival, installation, financial or other shared record is changed. The generator's DD has no departure order supplied, so its order remains blank. P52 retains the supplied 13227211 exactly. All source rows remain dated 7 Oct; “8th” is an order, not 8 Oct.

`patch_v801.py` reads `bookings_07Oct2026.json`, requires exact matches to `expected_events.json`, updates those existing events and installs read-only booking projections. It refuses a second application or changed source events. `patch_v801_consumers.py` updates the existing display consumers; no CSS or component styles change. Rescheduling a reference does not reconfirm the original date's loading time on the new day.

Practice evidence is recorded under `evidence/`. The source test restores all fourteen saved prior events and confirms the complete DATA object returns to the prior page, aside from the authorised customer on T0258. Browser checks cover grouping, quantities, clocks, numbers, unknown fields, conflict wording, notes, unchanged other days and moved-day handling. All practice service writes are aborted. Independent review and final integrated publication checks remain required before READY or LIVE.

Build from the current live page using the shared toolchain; v8.01 may follow v7.97/v7.98 and later compatible patches. A standalone v7.96 base gets a v8.01 release marker. An integrated v8.00 base advances only the release marker and the two overall Showcase report versions; vehicle component versions stay with their own implementation.

## Final release preparation

The publication chain is live v7.96 → v7.97 photo outbox durability → v7.98 connection status and print reliability → v8.01 Wednesday bookings. Showcase and vehicle refinements are being released separately in v8.02.

The booking patch keeps the canonical `const DATA = ` declaration so the standard attribution scrubber recognises DATA and preserves person names, authors and recorded-by fields. The source check compares the complete DATA object with the v7.98 stage after restoring the fourteen prior events; the guard suite also checks the scrubber can still recognise that declaration. A changed source quantity and a repeated patch application are refused without changing the file.

State: corrected product source frozen; booking implementation checks READY on the final official candidate, pending the separate integrated standing suites and independent browser/phone review. No production upload has been made by this implementation task.

Final official chain: v7.96 → v7.97 → v7.98 → v8.01. Candidate: 8,950,159 bytes; SHA-256 `70ed0c49213a910ae33dd062ecd3ada5f1752a69b0c1665c19c6bb25bcea1f11`. The immutable reviewed candidate is the official build. The corrected toolchain preserves JavaScript whitespace and punctuation while applying attribution substitutions. Separate DD trucks have unique day-card IDs; expanded WC20 cards show only their own docket and booked asset numbers. Explicit bookings do not carry an inferred-movement badge. Legacy timing checks exclude booked loading clocks from departure/arrival inference, and Full details explicitly labels supplied loading facts. `bookings801_tests.json` binds 33/33 browser checks to that hash, with zero page errors and zero attempted service writes. `source801_checks.json` binds 4/4 full-DATA preservation checks against the v7.98 stage `9a52ec22`; `guard801_tests.json` binds 3/3 fail-closed guards to the same final hash. Static page checking passes.

Optional six-opening timing, on the shared test machine: Today median 495 ms before / 691 ms after; Timeline on 7 Oct median 232 ms before / 362 ms after. The latter now includes eleven booking cards. Samples varied substantially while other browser checks ran; this is not a controlled performance result and does not establish the no-regression target. The measurements are retained in `timing801.json` for the broader performance follow-up, not represented as a pass. No performance change is included in this frozen booking release.

## Verified LIVE

Published 2 Oct 2026 at 15:19 AEST. The public view serves the exact reviewed `70ed0c49…` candidate. Independent readback verifies every shared operational collection unchanged, record version3538. See `evidence/release_verification.json` and `review801_handover.json`. The four desktop header assertions were corrected for CSS uppercase text; the focused final rerun passed6/6 with no product change.
