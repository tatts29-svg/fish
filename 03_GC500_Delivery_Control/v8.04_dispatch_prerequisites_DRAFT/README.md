# Departure and prerequisite confirmations

Author: Andrew Fisher.

**Implementation verified; publication held for service capability deployment.**

Andrew asked for trucks to leave Kingston in DD order and for the applicable checklist to be followed. This release adds explicit per-truck checks and actual departure records to the existing dispatch cards and drawers. Earlier DD ranks require acknowledged departures before the next rank is ready; equal ranks can leave in either order. A booked loading clock never becomes an actual departure or site arrival. Fencing prerequisites retain the source instruction and record who confirmed or withdrew it, without recording completed work.

The full existing ten-page pre-transit instruction remains linked. Brief reminders are identified as reminders. The controls require current shared state and the strict `durable_record_reads: true` service capability. Pending, stale, unavailable or conflicting records keep the relevant hold in place.

`patch_v804.py` builds on live v8.03. It embeds `dispatch803_src.js` and `sequence803_src.js`; internal component names retain their original suffix. See `dispatch803_notes.md` for the supported storage namespaces, immutable event shape, source binding and legacy record visibility. No operational records were written during implementation or validation.

The exact reviewed candidate is 9,119,594 bytes, SHA-256 `63673ae8ecd6f8bb7013a4a3767be57979648ad83bfa6a085e22cf50f981ba6b`. Applying this patch to official v8.03 `fa32b0a1937b329077923b960688a8927fbaaa2e6283d4d1ce2c6732eb98c213` reproduces those bytes. Canonical DATA is unchanged by this control patch.

Evidence in `evidence/` records:

- 41/41 actual-page control, order, acknowledgement, retry and storage checks.
- 76/76 desktop and 390px phone UI checks, including all eleven truck drawers, full checklist link, reachable held departure buttons, conditional fencing text, visible operator/time and retained history.
- 54/54 independent native multi-client event, arrival-order, acknowledgement and retry checks.
- 20/20 independent strict capability and reset checks through the actual REST backend with isolated fake responses.
- 6/6 exact-source, unchanged DATA, official-base reproduction and non-mutating patch guards.

The independent client/service integration review also passed 14/14 isolated acknowledgement and retry checks. Service deployment and final official release verification are separate prerequisites. No source or UI result here claims that deployment has occurred.
