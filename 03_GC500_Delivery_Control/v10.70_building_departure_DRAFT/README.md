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
and demob A4 bounds. Run it on desktop and phone only under the serial browser
lock, with private `GC500_FIXTURE` and result paths; it has not run yet.

Still required: build on the actual final v10.69 page, test native full-page
outputs and print fit on desktop/phone, check no duplicate wording or lost
recorded time/door side, run relevant regressions and use guarded publication
with exact live read-back. Nothing in this folder is READY or LIVE yet.
