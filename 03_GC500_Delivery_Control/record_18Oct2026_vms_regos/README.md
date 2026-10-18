# VMS board regos, 18 Oct 2026: runner built, NOT applied

Author: Andrew Fisher · written by Claude.

Andrew, 18 Oct: "Please add rego. For all of these ... THIS NEED TO BE FIXED and updated" (VMS1 1211354 EX0017,
VMS2 1211370 ES3206, VMS3 1271129 536UOO, VMS4 1191877 EM6306, VMS6 1211359 ER9247, VMS7 1182999 410UFQ,
VMS8 1211383 ER9381, VMS9 1211404 TF15JR).

`vms.cjs` is the p06 record runner with one extra op, `vms_rego`, which goes through the page's own `vms913Save(key, ..., {rego:true})`.
`vms_spec.json` lists the eight regos. The dry run (read-only, every write aborted) on live v10.71, record 9728, refused
all eight with "Nothing changed": Codex had already saved the same eight regos at 09:22 UTC under the v10.72 claim. It was
never run with `--apply`, and this folder wrote nothing.

Read-back of `/api/state` (version 9728) confirms all eight regos on keys 1211354, 1211370, 1271129, 1191877, 1211359,
1182999, 1211383 and VMS09. The board names VMS1–VMS8 are Codex's v10.72 page change.

## Applied: VMS7 (1182999) ticked installed, 18 Oct 2026 19:59 AEST

Andrew, 18 Oct: "I want them all tidked installed". On the record before, every VMS install tick was already on except
T0001 unit 1182999 (VMS7), which he had taken off on 23 Sep. His word today is later and wins (AGENTS.md: when his own
entries disagree, his later word wins). The other boards: T0001's other six units and the rest, T0103 (VMS9/VMS10) and T0128
(VMS11/12) were already ticked. T0158 (VMS13–17) is "not on site" (in for Mon 19 Oct), so it was left alone.

`node vms.cjs --apply --spec vms_install_spec.json` (op `labour_on`, through the page's own `setLabour`, by Andrew Fisher),
with backup `backup_state_20261018T095944Z.json`. Two documents written, the tick and its stamp; record 9728 → 9730;
every other document unchanged in value; VERIFIED on the service (`report_20261018T095944Z.json`).

## Applied: T0158 (VMS13–17) on site from Fri 16 Oct and ticked installed, 18 Oct 2026 20:19 AEST

Andrew, 18 Oct: "They are here already onsite. They turned up friday". T0158's light was "not on site". Its own note already
said "Came in 16 Oct 2026", and the five boards' regos were read off them on site and saved Fri 16 Oct 02:09 UTC (12:09 AEST).
`node vms.cjs --apply --spec t0158_spec.json`:
- `light` T0158 → on site through the page's own `setLight`, dated 2026-10-16T02:09:00Z (the light and its history entry,
  with Andrew's words as the entry's note). That is the earliest time the record itself proves they were on site; no time
  was invented.
- `labour_on` T0158|Variable message signs|VMS|install, a reference-level tick like T0128's, through `setLabour`.

"Complete" was not pressed. Backup `backup_state_20261018T101930Z.json`. Four documents written; record 9730 → 9734;
everything else unchanged in value; VERIFIED (`report_20261018T101930Z.json`). Still open from the note: VMS13's asset is
1191957 on the contract and 1191657 as Andrew wrote it, "to be checked on the plate".

## Applied: T0158 complete, 18 Oct 2026 20:21 AEST

Asked what his "Approved" covered, Andrew chose "Press complete on VMS". Every other VMS delivery (T0001, T0103, T0128) was
already complete. `node vms.cjs --apply --spec t0158_complete_spec.json` (op `complete`, through the page's own `setDone`,
by Andrew Fisher). Backup `backup_state_20261018T102120Z.json`; one document (delivery/T0158); record 9734 → 9735;
everything else unchanged in value; VERIFIED (`report_20261018T102120Z.json`).

## Applied: 1211404 off T0001 (it is VMS09 on T0103), 18 Oct 2026 20:46 AEST

Andrew, 18 Oct: "Your vms number onsite is.wrong · I gave you asset number last week for 7 vms boards and rego". On site
are his 9 today (VMS1–4, 6–10) plus last week's 7 (VMS11–17) = 16. The page counted 17, because 1211404 was still on
T0001's numbers as well as being VMS09 on T0103 (his words today: "1211404 was orginally vms5 but was taken off and added
to vms9"; 8 Oct: "take off that location and put on new location"). `node vms.cjs --apply --spec t0001_1211404_off_spec.json`
(`number_off`, through the page's own `numberTakeOff`, with a tombstone). Backup first; three documents; record 9736 → 9739;
VERIFIED (`report_20261018T104652Z.json`).

Read-back on the live page: T0001 7 boards (VMS01–04, 06–08), T0103 2 (VMS09 1211404, VMS10 120T), T0128 2 (VMS11 467T,
VMS12 1211646), T0158 5 (VMS13–17) = **16 on site**. T0159, T0169 and T0170 are VMS deliveries not on site.
Tried and dropped: putting the numbers on T0103/T0128/T0158 by hand. The page refused one (the ended contract line ties
1211404 to T0001), and the others are already shown through the VMS register, so nothing was written for them.

## Applied: VMS13 is 1191657, Andrew's number, 18 Oct 2026 20:48 AEST

Andrew, 18 Oct: "Vms 11 -17 vms turned up friday. I gave you all numbers". His 16 Oct number for VMS13 is 1191657 (the
contract line reads 1191957). Site record is truth (AGENTS.md), so the register now carries his number: `vms_fleet` through
the page's own `vms913Save(VMS13, fleet 1191657, {fleet:true})`. Backup first; two documents; record 9739 → 9741; VERIFIED
(`report_20261018T104832Z.json`). Read-back: VMS13 fleet 1191657, rego EN3803, on T0158, by Andrew Fisher. VMS11–17 arrival
dates already read Friday 16 Oct (T0128 10:39 AEST, T0158 12:09 AEST). The contract line still says 1191957; that is the
branch's to correct.
