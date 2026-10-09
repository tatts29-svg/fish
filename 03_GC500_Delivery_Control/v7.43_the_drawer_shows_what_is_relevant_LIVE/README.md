# v7.43: the drawer shows what is relevant (LIVE)

Author: Andrew Fisher · 29 Sep 2026

Andrew, 29 Sep 2026: "I want everything cleaned up, tidy. If I go into a generator there should be no option to
add accessories. Sub-hired needs cleaning up: when I go into WC43 I want to see clear as day it's sub-hired. This
is where we start thinking what is relevant data and what is not, and if it's data not needed we remove it."

**LIVE: 29 Sep 2026, 18:18 AEST.** The page on the service matches this build byte for byte. Nothing on the
live record was written.

## What changed

**What kind of thing a reference is decides what its drawer offers.**

| kind (from the discipline) | accessories | levelled and steps ticks | asset number box | fold wording |
|---|---|---|---|---|
| building (Portable buildings) | Attach form offered | yes | yes | a second building, boards |
| toilet block (Toilets & amenities) | Attach form offered | yes | yes | a second block, a tank |
| generator | no form; the part is gone unless something is already recorded | no (as before) | yes | a second set, a distribution board |
| light tower | no form | no | yes | a second tower |
| barrier run (water-filled) | no form | no | none: counted by quantity (v7.38) | another unit |
| furniture | no form | no | yes | another unit |

Anything already recorded is still shown whatever the kind: a rule never hides a record. A generator with an
accessory somebody attached keeps the form so it can be edited or taken off.

**A sub-hired location says so first.** WC43's drawer now leads with a banner: "SUB-HIRED · Event Portables — 10
units at WC43 belong to Event Portables, their numbers 0723 0056 0161 0182 0528 0696 0420 0961 0646 0581. Not
Coates plant: no Coates asset number, no rental contract, no branch." with who marked it and when, and for an
editor a "Not sub-hired after all" button. The header line carries the SUB-HIRED chip instead of a Coates Rental
ID. The rental contract and branch parts are left out; the number box asks for an Event Portables number. The
units, photographs, way in, pins and the money model are untouched. WC41 and WC31 read the same way.

**The id generator no longer breaks on punctuation.** The 29 Sep fault, where a bracket in the recorder's name
made every fencing docket the same id (F-AF(-0001), cannot happen again: the initials are letters only, the first
letter of each word of the name. "Andrew Fisher (via Claude)" gives F-AFV-…, "Brenden" gives F-B-…, a blank name
gives F-….

## Checks

- Practice tests (`evidence/practice_tests.js`, page from the build file, live GETs read-only, nothing written):
  8 of 8. GN01 has no accessory form and no contents part but keeps contract and branch; P17 keeps the form; WC17
  keeps contract, branch and its Rental ID with no banner; WC43 shows the banner with its ten numbers, the chip,
  no Rental ID, no contract, no branch, and asks for an Event Portables number; WB01 has no number box; the id
  generator gives letters-only ids; an editor sees the way back on the banner; the generator drawer draws in edit
  mode without errors.
- Sweeps: desktop 21 tabs 0 errors, phone 21 tabs 0 errors (`evidence/sweep_*.json`).
- Every inline script passes `node --check`; the token, keys and map tokens scanned for before upload.

## Files

- `patch_v743.py`, `tidy743_src.js`, `tidy743.css` — the change, applied to v7.42.
- `shot743_wc43.png` — WC43's drawer on a phone, banner first.
- `shot743_gn01.png` — GN01's drawer: contents and accessories gone.
- `evidence/practice_tests.js`, `evidence/sweep_desktop.json`, `evidence/sweep_phone.json`.
