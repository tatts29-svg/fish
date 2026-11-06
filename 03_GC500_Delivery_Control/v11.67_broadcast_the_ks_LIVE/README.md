# v11.67 — the kilometres in the race call, exactly as the record has them

Author: Andrew Fisher. Built on live v11.66 `c425b688…` (Codex's servicing map share, itself on v11.65) with one patch,
`patch_v1167.py`. **LIVE 24 Oct 2026 05:01 AEST**, sha256 `2a8671b792492953eb560a4123b2234dc036c144970e778276f40b3b5dc27683`
(21,709,540 bytes); media manifest `459a7537f5a0984ef1f095859ebd70ccf3f0973eb10cec3b0deaea5e6f7d00d4` (1,999 files)
registered first. Status in STATUS.md.

Andrew, 24 Oct 2026: "Make sure the ks are right in broadcast. The fencing. The ccb. The scriimms ks. There is a lot.of ks".

## What was checked

Every distance in the v11.65 programme, against the live record to race weekend (Fri 23 Oct; record version 10777) and
against the Showcase scene each line plays over (read on the live page, GET-only):

| Figure | Record | v11.65 said | Now |
|---|---|---|---|
| Fence put in | 13,187.5 m of the 12,617 m programme (+570.5 m); scene: 13.188 km | "13 km … 13,187 metres … of fence standing … more than 500 m more" | **13.2 km put in, 13,187 and a half metres, 570 m more** (turn 28; 43) |
| Crowd control | 2,135 m event + 5,062.5 m demarcation = 7,197.5 m; 2,879 barriers | 7.2 km, 2.1 + 5.1, 2,879 (turn 32) — right; "seven kilometres" (turn 43) | turn 32 unchanged; **7.2** in turns 35 and 43 |
| Flat-feet CCB | 270 m of 256 m | 270 m (turn 32) — right | also named in turn 35 |
| Scrim | 3,977.5 m fitted + 427.5 m on existing fence = 4,405 m | 4.4 km (turn 33) — right | turn 33 unchanged; **4.4** added to turns 35 and 43 |
| Relocated / stacked down | 582.5 m / 1,102.5 m | "nearly six hundred metres" / "more than a kilometre" — right | unchanged |
| Fence + crowd control, all up | 13,187.5 + 2,135 + 5,062.5 + 270 = 20,655 m (the four activities the page's fencing index counts; programme 20,241 m) | "twenty kilometres" (turns 2, 35, 43) | **20.7 km** (turns 35, 43); "more than twenty kilometres" (turn 2) |

Scrim, relocations and stack-downs are separate work on the same fence; they are named beside the total, not added into it.
"Put in" follows the page's own wording: the 13,187.5 m is recorded clean-fence work, which the page does not describe as
unique fence standing.

## What changed (`patch_v1167.py`)

Turns 2, 28, 35 and 43 re-voiced in the same voice (GC500 Race Caller), flow and mix; two takes each, both transcribed and
compared word for word with the line, every figure said correctly in all eight; the take used is in `takes/picks.json`.
`turns_changes.json` holds each old and new line. Four takes out of the media table, four in (1,999 files); manifest
digest; footer v11.66 → v11.67. The other 47 takes are v11.65's. No servicing, crew-card bundle, tracker, printed-code or
record change.

## Checks

`tests/test_v1167.cjs` on the build: 42/42 (the four lines and their figures, turns 32 and 33 unchanged, media table and
manifest agree, chain 1..50 and 50 → 51 → 3, all 25 scenes, 0 page errors). Toolchain PASS (173 inline scripts). Sweeps
desktop and phone: 27 tabs, 19 shown, 7 hashes, Back, 0 errors, 0 blocked writes. On the live page,
`tests/live_v1167.cjs` 8/8 (byte-for-byte view link, all 51 takes 200 audio/mpeg with their bytes and SHA-256, Broadcast
starts turn 1 on its hosted take, footer v11.67, 0 errors, 0 writes).
