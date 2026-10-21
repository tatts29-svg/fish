# v11.07 — fencing metres credit each type only up to its own programme

Author: Andrew Fisher. Candidate sha256 `6cecd6aaed10992a233069ac412277901f5bc29da99839571cd7fdc50f5d07b9` (21,051,171 bytes)
on live v11.06 `7c3f21ce…`. Status in STATUS.md.

Andrew, 21 Oct 2026: "Fencing is still not complete its not 100% yet".

## What was wrong
Today's Fencing card read **13,302.5 of 12,359.5 m of fence work on dockets · 100%**. `fenceMetres()` summed the two
temporary-fence types raw: clean fence 11,577.5 m docketed against a 7,965 m programme, braced-for-scrim 1,725 of
4,394.5 m. The clean over-run hid the scrim shortfall, the card went green, "left to do" went negative, and the Showcase
fence scene, the milestone % and the copy text all read 100%. The Build index already applied the right rule
(each type counts up to its own programme; extra work cannot cover another type's shortfall) and read 85.1–85.4%.

## What changed (`patch_v1107.py`, four exact-once replacements)
- `fenceMetres().done` is the credited sum: each type capped at its programme. `.docketed` is the raw docket sum.
  Every reader of `.done` follows: Today card, Design headline, Showcase fence scene, milestones, left-to-do, copy text.
- Today's card says "m of fence work credited" and, when docketed exceeds credited, adds "13,302.5 m on dockets;
  a type's extra does not credit another type" under the gauge. The copy text says the same.
- Footer v11.06 → v11.07. The per-type table, the Build index and all fencing records, rates and money are untouched.

## Result on live data (22 Oct)
`fenceMetres(progressAsOf('2026-10-22'))` → done 9,690 · docketed 13,302.5 · total 12,359.5 · 78%. Today card class
`part` (was `full`). Build index unchanged at 85.11–85.43%.

## Checks
Read-only probes on the candidate with live data (Today card text and class, fenceMetres values), desktop and phone
navigation sweeps (see STATUS for the result), no page errors.
