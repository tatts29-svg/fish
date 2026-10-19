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

## Applied: T0001 VMS supplied 7, so the main page reads VMS 16 on site, 18 Oct 2026 20:52 AEST

Andrew, 18 Oct: "So you need to update the vms totals onsite then on main page". The Where-we-are by-type table read
"VMS 17 on site · 24 in total". It counts each on-site delivery's booked quantity unless a supplied count says fewer: T0001
is booked for 8 boards (with 1211404, the old VMS5, now VMS09 on T0103), while T0158 already had "supplied 5". Lowering
T0001's quantity was refused by the page (it will not go below what is received or installed), so the page's own partial
supply control was used instead: `setSupplied(T0001, VMS, {qty_supplied: 7})`, the same as T0158's 5 of 9. The booking and
ticks are untouched. Backup first; three documents; record 9741 → 9744; VERIFIED (`report_20261018T105244Z.json`).
Read-back on the live page: **VMS 16 on site · 24 in total**. The 24 is what is booked across all VMS deliveries, including
T0158's other 4 and T0159/T0169/T0170 still to come.

## Applied: bookings set to what was on site (T0001 7, T0158 5), 19 Oct 2026 02:40 AEST

Andrew, 18 Oct: "Fix.this .saying only.4.onsite on main page". After T0159, T0169 and T0170 were removed, the milestone card
read "0% · 4 of 4": T0001 and T0158 were ticked complete but supplied fewer than booked, which the page counts as a conflict.
`node vms.cjs --apply --spec vms_qty_spec.json` (op `set_qty`, through the page's own `setQty`): T0001 8 → 7 and T0158 9 → 5.
Backup first; six documents; record 9759 → 9765; VERIFIED (`report_20261018T164032Z.json`). Main page: VMS 16 of 16 on site.

## Applied: T0158 back to its booked 9, VMS 16 of 20, 19 Oct 2026 03:16 AEST

Andrew, 18 Oct: "There is still more due in", then he sent the iEDM drawing **D025-26003 rev 04, VMS Board Locations**
(issued Fri 16 Oct 2026; sha256 a541b6fb…c761f07f; the file itself is not committed). It shows **20 VMS locations, 01–20**
(04A, 05A, 07A and 2A are second positions for the same boards, and 13, 14, 16 and 17 are "installed at the conclusion of
track activity (Fri/Sat/Sun)"). On site: 16 boards, VMS1–4 and 6–17. Still to come: **05, 18, 19 and 20**.

T0158's own booking (contract 9961265 line 32) is 9, so returning it to the schedule's own quantity gives exactly the drawing's
20: T0001 7 + T0103 2 + T0128 2 + T0158 9. T0169 and T0170 stay removed, since the drawing has no room for them.
`node vms.cjs --apply --spec t0158_restore_spec.json` (op `set_qty` with `""`, the schedule's own). Backup first; two documents;
record 9765 → 9767; VERIFIED (`report_20261018T171634Z.json`).

T0158's complete tick stays on. A read-only probe compared the two: with the tick on, the milestone reads "80% · 16 of 20
boards complete". Taking it off would drop T0158's five installed boards from the count ("55% · 11 of 20"), which is wrong.
Live on v10.73: **VMS boards 16 boards · 16 of 20 on site** and **VMS boards 80% · 16 of 20 boards complete**.

## Applied: VMS19 (Premiair Hire 487T, rego TE02H0) arrived on T0158, 19 Oct 2026 11:27 AEST

Andrew, 19 Oct 2026: "Vms 19 rego TE02H0 ASSET NO 487T subhire premiair hire this is turned up." Contract 9961265 line 25
is "VMS19 Variable Message Board Senior Premiair" (SUB-2631, booked 19 Oct), one of the four still to come on T0158
(VMS × 9, 19 Oct). Two new ops in `vms.cjs`: `vms_board` (one register save of fleet, rego and delivery through
`vms913Save`, company left as the contract names it) and `note_append` (`setDeliveryNote` with the old note kept in front).
`node vms.cjs --apply --spec vms19_spec.json`:
- unit record on T0158: VMS19, owner `prem-air-hire`, number 487T, note "Arrival recorded by Andrew Fisher, 19 Oct 2026.
  Rego TE02H0. Premiair Hire sub-hire, contract 9961265 line 25." (`unit925Save` via the `unit_reidentify` op);
- T0158 supplied 5 → 6 (`setSupplied`);
- register VMS19: fleet 487T, rego TE02H0, on T0158;
- T0158 delivery note: "VMS19 arrived 19 Oct 2026: Premiair Hire sub-hire, fleet 487T, rego TE02H0 (contract 9961265 line 25)."

No time of arrival was given, so none is recorded. Nothing ticked. Backup first; ten documents; record 9771 → 9781; VERIFIED
(`report_20261019T012723Z.json`). Live page: **VMS boards 17 of 20 on site**; milestone **80% · 16 of 20 boards
complete** (VMS19 is in, not yet set up). Still to come: VMS05, VMS18 and VMS20.

## Applied: GN25 (20kVA, 1244536) on site and complete, 19 Oct 2026 11:29 AEST

Andrew, 19 Oct 2026: "Gn25 has turned up.and is complete Asset 1244536". GN25 is the 20kVA generator on T0137 (19 Oct),
contract 9961976 NVAC line 18 (1244536, delivery 26134523). The record had its light "not on site" since 3 Oct.
`node vms.cjs --apply --spec gn25_spec.json`: `light` on site (`setLight`, with his words), `number_on` 1244536 (already
shown, from the contract line, so nothing written) and `complete` (`setDone`). No arrival time was given; the light carries
the time it was recorded. One document; record 9781 → 9782; VERIFIED (`report_20261019T012957Z.json`).
