# v11.69 — Alonzo McAvoy on the fencing crew, on the page and in the race call

Author: Andrew Fisher. Built on live v11.68 `f98be3c6…` (Codex's servicing shift report, on my v11.67) with one patch,
`patch_v1169.py`. **LIVE 24 Oct 2026 06:44 AEST**, sha256 `1a0c2dc11be081cae5a792662a4fcdd3854212e0fb6bc9174cef7143dc2948a7`
(21,725,576 bytes); media manifest `9c9923efc88f27d081e6ac239e88b23af2601b93c454f5d60c0c1622bcdaf836` (1,999 files)
registered first. Status in STATUS.md.

Andrew, 24 Oct 2026: "Did i give you the other fencing guys name alonzo mcavoy to add". He had not been given before — the
crew stood at nine: the eight off the sign-on sheet of 17 Sep and Hayden McAvoy, added by the project manager on 8 Oct.

## What changed

1. **The crew record** (`DATA.team`): Alonzo McAvoy joins the fencing group after Hayden, as Fencing crew with Advanced
   Temporary Fencing, "added by the project manager on 24 Oct 2026", with no role, number or email (none given). The
   Showcase's fencing scene and the Meet-the-team cards read the group from the record: ten cards, five by two, and the
   fine print reads "10 names from the project record: 8 as the crew's sign-on sheet reads, in its order, and 2 added by the
   project manager on 8 Oct 2026 and 24 Oct 2026". The group's note says ten names.
2. **The race call**: both roll calls re-voiced in the same voice (GC500 Race Caller), flow and mix, each now ending
   "… Scott Hildebrand! Hayden McAvoy! Alonzo McAvoy!" — turn 25 (Meet the fencing crew) and turn 47 (every name once more).
   Two takes each, all four transcribed and checked: every take says "Hayden McAvoy, Alonzo McAvoy"; the take used
   (`takes/picks.json`) is the one with every other name cleanest. Two takes out of the media table, two in (1,999 files).
   Turn 47's transcript keeps the v5.97 rule.
3. Footer v11.68 → v11.69. No record, servicing, crew-card bundle, tracker or printed-code change.

The family name is written "McAvoy" for Alonzo, as the race call says it; Hayden's record line keeps "Mcavoy" as it was
entered on 8 Oct.

## Checks

`tests/test_v1169.cjs` on the build: 46/46 (the crew is ten with Alonzo last and nothing invented; the group note; the
fencing scene names him and counts eight off the sheet and two added; turns 25 and 47 name him after Hayden; v11.67's
kilometre lines kept; media table and manifest agree; chain and all 25 scenes; 0 page errors). Toolchain PASS (173 inline
scripts). Sweeps desktop and phone: 27 tabs, 19 shown, 7 hashes, Back, 0 errors, 0 blocked writes. The first page upload
got no answer from the service (curl status 0) and the service kept serving v11.68; the guarded upload was run again and
landed. On the live page `tests/live_v1169.cjs` 9/9 (byte-for-byte view link, the live fencing scene names Alonzo McAvoy,
all 51 takes 200 audio/mpeg with their bytes and SHA-256, Broadcast starts turn 1 on its hosted take, footer v11.69, 0
errors, 0 writes).
