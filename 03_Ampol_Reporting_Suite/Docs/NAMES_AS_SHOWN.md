# Names as shown - the one style on every page

Author: Andrew Fisher | POWERED BY SITEIQ. As at 07 Nov 2026.

Every report reads its names from the raw SiteIQ exports and shows them
one way. Matching, pricing, joins and counts always use the raw text -
the rules below change what the reader sees, never what is counted.
The rules live in one file, `ampol_names.py`; the serial lists are read
by `ampol_serials.py`.

## Gas monitors
- Every gas monitor prints as **Dräger X-am 5000 Gas Monitor**, whichever
  way SiteIQ spelt it (AMPOL DRAGER X-AM 5000 GAS MONITOR, Drager X-am
  5000 - T&I -ARSN-0637, Drager X-am 5000 - Maintenance-ARTH-0140).
- When a serial number is known it follows in brackets:
  **Dräger X-am 5000 Gas Monitor (ARSN-0637)**. The serial comes from the
  description itself, or from Data\Gas_Monitor_Serial_Numbers.xlsx by
  barcode. No serial known, no brackets - nothing is guessed.
- Chargers, probes, pumps and docks are not monitors and keep their own
  description (Dräger X-am 5000 single charger).

## Radios
- Every radio prints as **Motorola Radio**, with the serial in brackets
  when known: **Motorola Radio (122TYX0140)**. The serial comes from the
  description or from Data\radio_register.xlsx by barcode.
- Every radio battery prints as **Motorola Radio Battery**.

## Every other description
- Sentence case: a capital first letter, lower case after.
  TORQUE WRENCH 1/2" DRIVE 200NM reads Torque wrench 1/2" drive 200Nm.
- Protected and kept as they are: sizes and codes with a digit (M18, 2T,
  1/2", 200Nm, IS940.1), brands (Milwaukee, Hytorc, Fluke, Kärcher, ...),
  standards and acronyms (UNC, UNF, AF, BSP, LED, RCD, USB, PPE, WLL,
  T&I, ...) and words with inner capitals (McGurk, DeWalt, iPad).
- The site's own prefix ("AMPOL ...") is not part of a name and is
  dropped; the former site name reads as the current one.
- One dash style: a dash between words prints as " - "; a hyphen inside a
  word (X-am, 2-3/8, Snap-on) stays.
- To protect another brand or acronym, add the word to PROTECTED_WORDS in
  ampol_names.py (or a spelling to _BRAND_FIX). Never edit the data.

## People
- SiteIQ's "First - Last" reads **First Last**, each word capitalised,
  inner capitals kept: ROBERT - MCGREGOR reads Robert McGregor;
  Hayden - O'Connor reads Hayden O'Connor.
- A tag SiteIQ appends for a second account reads as a tag in brackets,
  never glued to the surname (07 Nov 2026): Aaron Willmann-Shutdown reads
  Aaron Willmann (shutdown); Anthony Dutton T&I reads Anthony Dutton (T&I);
  Ardy Denehy 2021 reads Ardy Denehy (2021). The two accounts stay two
  SiteIQ accounts - the reports never merge them.
- Mc and Mac names keep their capital: Glenn Mccabe reads Glenn McCabe,
  James Macgregor reads James MacGregor.
- A slip that can only be one person is shown right (_PERSON_FIX in
  ampol_names.py): Brett Mclvor (a lower-case L) reads Brett McIvor beside
  his own McIvor account; Omeara reads O'Meara; Joe O Carroll reads Joe
  O'Carroll. A spelling that MIGHT be someone else (Kennth, Adrain, a
  surname cut short like Todd Van Der) is left as SiteIQ has it - fix it
  in SiteIQ. "For Andrew - SiteIQ names to check" lists every pair.

## Companies
- One customer, one name: AMPOL, AMPOL REFINERIES (QLD) PTY LTD and the
  former site-name account all read **Ampol**; project accounts (Contract
  Resources FCCU, Wood SATGAS/MOL) roll up to their company.
- Capitals become Title Case (WOOD reads Wood, TEAM FURMANITE reads Team
  Furmanite); acronym companies stay in capitals (HIS, CSA, IPS, ARL,
  UGL, NDE, CXC).

## Shared booking accounts
- The after-hours booking account (SiteIQ: "AFTER HOURS HIRE - GAS
  MONITORS & RADIO BATT.") prints as **After Hours Hire account** - the
  name of the account, not of the gear on the row.
- Any other shared or custody account (a shutdown, SFI, tool store,
  repairs or workflow account) prints with SiteIQ's separator dash
  dropped, the way a person does, plus " (account)", so it is never read
  as a person: FCCU - 2026 (SFI) reads FCCU 2026 (SFI) (account);
  Future - Fuels reads Future Fuels (account).
- A place or a holding line SiteIQ books like a person is an account too
  (07 Nov 2026): Wynnum Gardens (account), Bulk Yard (account), Radios
  Out Of Service (account), Hoses Off Site (account), Atlas Chains
  Offsite Repairs (account), Rigging & 240v Out Of Tag Date (account).
- A Dräger service line reads Dräger - <status> (account), one case on
  every page: DRAGER - FCCU reads Dräger - FCCU (account); Dräger -
  Dräger - Out Of Calibration reads Dräger - Out of calibration (account).

## Where to check
- `python ampol_names.py` prints worked examples of every rule.
- The truth sweep fails a page that prints a SiteIQ-form person, an
  all-capitals description, the raw after-hours account name, the former
  site name or a long dash.
- Button 09 (CHECK_REPORTS) also reads every page and every workbook
  cell for a long dash, a tag glued to a name, a doubled Dräger label, a
  build note, "1 items" and a sender's note, and says DO NOT SEND if it
  finds one (07 Nov 2026).
