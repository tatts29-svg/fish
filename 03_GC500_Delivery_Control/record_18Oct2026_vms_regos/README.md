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

## Applied: VMS18 (Premiair Hire 472T, rego TE58GZ) arrived on T0158, 19 Oct 2026 11:52 AEST

Andrew, 19 Oct 2026: "Vms18 rego TE58GZ ASSET NO 472T PREMIAIR HIRE". Contract 9961265 line 24 (SUB-2631, booked 19 Oct).
Same four ops as VMS19 (`vms18_spec.json`): unit record VMS18 / 472T / `prem-air-hire` on T0158; T0158 supplied 6 → 7;
register VMS18 fleet 472T, rego TE58GZ, on T0158; the arrival added to T0158's note. Nothing ticked, no time invented.
Backup first; ten documents; record 9782 → 9792; VERIFIED (`report_20261019T015206Z.json`). VMS on site: 18 of 20.
Still to come on the drawing: VMS05 and VMS20.

## Applied: VMS18 and VMS19 complete, 19 Oct 2026 11:56 AEST

Andrew, 19 Oct 2026: "COMPETED", answering that the milestone stays at 16 of 20 until VMS18 and VMS19 are set up. T0158
carries one install tick for the whole delivery and was already complete for its first five boards, so the page held
"5 of 9 installed · 7 received". A read-only probe showed that per-board install ticks are the wrong control here: the page
turns the delivery's one tick into per-board ticks and counts 0 of 9. Pressing **Complete again** is the page's own rule for
"everything received is now done" (Scope1017: a newer complete tick installs what has arrived): 7 of 9 installed. New op
`complete_again` (`setDone` on a reference already complete, with a check that the tick's time moved).
`node vms.cjs --apply --spec vms18_19_complete_spec.json`: one document; record 9792 → 9793; VERIFIED
(`report_20261019T015616Z.json`). Live page: **VMS boards 90% · 18 of 20 boards complete**, 18 of 20 on site.

## Applied: VMS20 (Premiair Hire 475T, rego TE88HN) arrived and completed on T0158, 19 Oct 2026 12:33 AEST

Andrew, 19 Oct 2026: "Vms20 asset no 475t rego TE88HN COMPLETED". Contract 9961265 line 26 ("VMS20 ... Premiair",
SUB-2631, booked 19 Oct). `vms20_spec.json`: unit record VMS20 / 475T / `prem-air-hire` on T0158; supplied 7 → 8; register
VMS20 fleet 475T, rego TE88HN, on T0158; the arrival added to the note; then `complete_again` so the eight received count as
installed. Backup first; ten documents; record 9802 → 9812; VERIFIED (`report_20261019T023258Z.json`). Live page:
**VMS boards 95% · 19 of 20 boards complete**, 19 of 20 on site. Still to come: VMS05.

## Applied: VMS23 (Premiair Hire 453T, rego TF54CQ) arrived on T0158, 19 Oct 2026 12:38 AEST

Andrew, 19 Oct 2026: "Vms23 asset no 453t rego TF54CQ". Contract 9961265 line 30 ("VMS23 ... Premiair", SUB-2631, booked
19 Oct). The nine 19 Oct boards on the contract (VMS13–20 and VMS23) are exactly T0158's nine. Not said to be complete, so
nothing is ticked.

A read-only probe found one trap: the page keeps a received/installed baseline from the last quantity edit (18 Oct:
5 installed), and a receipt recorded after the last complete tick falls back to it, so adding VMS23 alone would have shown
T0158 "5 of 9 installed". New op `scope_refresh`: the quantity set one above the schedule's and straight back to the
schedule's own through `setQty`, the page's own way of taking a new baseline (8 received / 8 installed); the quantity ends
as it began. Then the VMS23 unit record (453T, `prem-air-hire`), supplied 8 → 9, the register row and the note.
`vms23_spec.json`; backup first; twelve documents; record 9812 → 9824; VERIFIED (`report_20261019T023812Z.json`).
Live page: **VMS boards 20 of 20 on site**; milestone **95% · 19 of 20 boards complete** (T0158 "8 of 9 installed · 9
received"; VMS23 waits for its complete).

## Applied: VMS13 is 1191657 alone; the 1191957 arrival record set aside, 19 Oct 2026 14:37 AEST

Andrew, 19 Oct 2026: "It should be 1191657 it a coates machine we need all these cleaned up please". T0158 carried VMS13
twice: the register's 1191657 and the 16 Oct arrival record typed 1191957 (from contract line 32). New op
`unit_archive_wrong` (the page's own take-off, `UnitIdentity1006.remove`, kept only when the right number is still on the
reference) plus a note. `vms13_1191657_spec.json`; backup first; four documents; record 9858 → 9862; VERIFIED
(`report_20261019T043742Z.json`). With page v10.75 the VMS counts now read 20 on site: Premiair Hire 6, Coates numbered 14.

## Applied: VMS13 back to 1191957, Andrew's later word, 19 Oct 2026 15:24 AEST

Andrew, 19 Oct 2026: "vms13 should be 1191957", after "It should be 1191657" earlier the same day; his later word wins.
1191957 is also what contract 9961265 line 32 says. `vms13_1191957_spec.json`:
- `vms_fleet` VMS13 1191957. A number equal to the contract line's is not stored over it, so the register's own field
  clears and the contract's 1191957 shows; the op's check now accepts that.
- New op `note_replace`: T0158's earlier sentence ("VMS13 confirmed ... 1191657 ...") corrected in place to "VMS13 confirmed
  by Andrew 19 Oct 2026: 1191957, a Coates machine, as contract line 32 says (not 1191657)."
Backup first; four documents; record 9862 → 9866; VERIFIED (`report_20261019T052452Z.json`). The 1191957 arrival record set
aside at 14:37 stays set aside: the register row now carries 1191957 itself, so T0158 shows VMS13 once, as 1191957.
Live counts unchanged: 20 on site, Premiair Hire 6, Coates numbered 14, none without a number. Costs: STPS hire +$428.88
(VMS13's number now matches contract line 32, so its hire is priced from that line); priced revenue $450,353.34.

## Applied: WC67 FWF × 4 — 0714 (Event Portables spare) and 172824 (Coates) added, 19 Oct 2026 16:18 AEST

Andrew, 19 Oct 2026: "Wc67. Fwf. Can i add asset no 0714 this was a spare subhired. And a coates asset no 172824 to reference
wc67 this will make the total 4 at this reference". WC67 carried FWF × 2 (Event Portables 0793, 0769). 0714 is an Event
Portables number (the sub-hired spare); 172824 is the Coates FWF on contract 9968955 KINP line 140 (described there as
"WC01"; site record is truth, so it is recorded at WC67). No other reference held either number.
- `wc67_spec.json`: quantity 2 → 4 (`setQty`); unit records 0714 (`event-portables`) and 172824 (`coates`) through
  `unit925Save`. Nine documents; record 9928 → 9937; VERIFIED (`report_20261019T061811Z.json`).
- `wc67_complete_spec.json`: supplied 4 and complete pressed again, so the page counts all four at the reference. Four
  documents; VERIFIED (`report_20261019T061854Z.json`).
Live: WC67 FWF × 4, units 0793, 0769, 0714 (Event Portables) and 172824 (Coates); Today "4 of 4 installed · 4 received".
