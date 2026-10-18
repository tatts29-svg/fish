# v10.70 building departure coverage — draft

Author: Andrew Fisher

Every building movement from Week 4 onward, including Race Week and demob,
needs the settled departure rule on its driver and collection outputs. The
existing Kingston morning rule, oversize truck-flow check and 14 October arrival
plan cover only some of these paths.

The shared wording says to leave the pick-up point before 07:00, before the first
restriction, and be on site before 07:00. The 05:00 loaded-and-away instruction
is explicitly conditional on departing from Kingston. The existing no-travel
windows remain 07:00–09:00 and 16:00–18:00.

Evidence:

- `AGENTS.md`, “Buildings: door side and departure, permanent”: the rule covers
  Week 4 through demob and every building. It is separate from the recorded
  door side, which this patch never changes.
- `STATUS.md`, “SETTLED FROM THE DATA — WC20 second toilet block”, records the
  confirmed 05:00 Kingston departure, before-07:00 arrival and both no-travel
  windows, from the 2 October instructions.
- `handover_claude_18Oct2026/README.md` names this remaining departure-rule work;
  `HANDOVER_2_codex_takes_over.md` transfers it with the remaining queue.
- Native `LOAD782`, `flow891Curfew` and `arrival943` supply the existing wording
  and demonstrate the coverage gaps: morning-only, oversize-only or one date.

`departure1070_src.js` adds the rule to existing driver text/rules, day flow,
delivery/removal and drop sheets, the daily delivery model, and demob displays
and sheets. The patch adds it inside the existing PDF/demob email builders so
native size limits still apply. It does not send an email or message.

The existing Portable buildings classification identifies a building reference.
Movement-specific item rows, native demob units and actual stop parts exclude
accessory-only and zero-quantity movements.
The rule starts at the programme's Week 4; undated reference rules describe the
standing instruction. Recorded and planned times, quantities, unit identities,
door sides, prices and operational records remain untouched. A demob planning
sketch that conflicts with the rule is labelled for review; no replacement
booking or time is invented.

The native loading policy and Truck flow policy row are reused, keeping their
order, travel assumption and unloaded-by explanation. New wording includes only
missing policy clauses where the native arrival/demob output already carries
one. Existing recorded-time warnings remain verbatim; they are evidence, not a
replacement booking. The optional SMS no longer repeats the Kingston deadline
already in its mandatory building rule.

Source fixtures pass 93 checks:

- 54 coverage checks: build/race/demob phases, dates, movement types, delivery
  and removal sheets, daily model copies, demob conflicts and unchanged records.
- 30 checks executing native driver-rule builders: existing large-building
  policy appears once, other driver conditions and booked/recorded values stay
  unchanged, special-arrival additions do not repeat known policy, and native
  accessory-only/zero-quantity demob movements are excluded.
- 9 checks executing native bounded email builders: load selection, original
  facts, URL/body limits and truncation survive; accessory-only email is unchanged.

Run the three `tests/test_*.cjs` files with Node; `test_native1070.cjs` and
`test_outputs1070.cjs` take the candidate HTML as their first argument.
The patch refuses reapplication, a predecessor other than v10.69, and changed
native loading/time policy definitions (exact guards in `native_guards1070.json`). A private
fixture with only the predecessor label adjusted passed all 142 inline-script
checks and retained the DATA bytes exactly; it is not a release candidate.

Independent source review found no blocker in the bounded output adapters.
`tests/test_browser1070.cjs` is prepared and syntax checked. It uses the shared
frozen-read/write-blocking harness and covers native programme phases, full-page
output builders, an unchanged shared-record snapshot, native driver pagination
and demob A4 bounds. With a predecessor path it also compares the complete
shared record, native programme/load and demob models, and every daily model
field and original note; only the settled departure note may be appended. It
saves driver/demob print screenshots and rejects browser errors, writes or
missing frozen endpoints. Run it on desktop and phone only under the serial
browser lock, with private `GC500_FIXTURE` and result paths.

Final desktop and phone checks each pass **59/59** on the frozen candidate.
Both predecessor and candidate contexts are clean: zero page or console errors,
failed external responses, attempted writes or missing frozen endpoints. Every
programme/load, quantity, time, door-side and demob model field matches the
predecessor; daily models retain every original field/note, with only the policy
note appended. Six programme phases, native driver/drop/drawer/email outputs and
demob outputs are covered. The native compliance checkbox/name gate was completed
through its UI before print capture; driver pagination, all driver images, demob
A4 fit and unchanged record after printing pass. Desktop/phone driver and demob
screenshots were inspected and remain private.

Earlier attempts stopped on missing original media, then on a harness screenshot
that correctly encountered the unacknowledged native print lock. These were
resolved before the final runs; no production source, output assertions or media
were substituted. `tests/browser_results.json` records the sanitised final gate.

The frozen draft chain was built on the final private v10.69 candidate
`07cf8b6eedddc22397f301b9afae875137c608f5d62bae80a78249174cbfd88d`,
then passed the common attribution scrub and static checks. The v10.70 result is
`2c3d560843a1efbc6c24f332e46492ddafebd81bf1203356eba0cfa82b95aea6`
(18,501,611 bytes, 143 inline scripts). All 93 source/native-output checks pass on
these exact bytes. Embedded DATA and all 132 existing named script bodies remain
byte-for-byte unchanged. A second build matches exactly; repeat and wrong-base
application are refused. No browser was run for this private chain build.

Still required: the official build on the published v10.69 predecessor must
match those bytes, complete the release owner's remaining cross-page gates and
use guarded publication with exact live read-back. This is a tested private
candidate; no publication or live verification is claimed here.
