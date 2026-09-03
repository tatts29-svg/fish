# Names as shown - the one style on every page

Author: Andrew Fisher | POWERED BY SITEIQ. As at 03 Sep 2026.

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
- Anything SiteIQ appends after the name stays, tidied: Aaron
  Broderick-Shutdown, Anthony Dutton T&I, Ardy Denehy 2021.

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
- Any other shared account (a shutdown, SFI or tool store account) prints
  as SiteIQ spells it plus " (account)", so it is never read as a person.

## Where to check
- `python ampol_names.py` prints worked examples of every rule.
- The truth sweep fails a page that prints a SiteIQ-form person, an
  all-capitals description, the raw after-hours account name, the former
  site name or a long dash.
