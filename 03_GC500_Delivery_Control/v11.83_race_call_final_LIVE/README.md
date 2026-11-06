# v11.83 — the race call says the finished build — LIVE

**LIVE 24 Oct 2026 14:45 AEST**, page `5d9b7650b701440f4b7fa20eb99aa3274d476bb74c0951078ade8e9dbc192d87` (21,860,411 bytes), built on my
live v11.81.1 `1c355e7d80e4703e01c4daa942d4298dfa451780b63db9c9e08dae60f6c816df`; media manifest
`e166450364f1089ea550c13fc57d27c26ad775dc51f46eb29d9a3244558fdf17` (1,999 files) registered first; guarded upload, the view link
serves the build byte for byte.

Author: Andrew Fisher. Andrew, 24 Oct 2026: "If we need to change anything in broadcast lets do it so everytjing matches we want
everything to match." (said twice; the second time is the go-ahead to voice what v11.81 wrote but did not voice).

## What changes (`patch_v1183.py`)

The eight fencing turns v11.81 wrote, voiced in the same voice (GC500 Race Caller), flow and mix, two takes each; all sixteen
transcribed and every figure heard correctly (`takes/picks.json` says which take is used and why):

| Turn | Says now |
|---|---|
| 28 | 13.3 km of temporary fence put in — 13,270 m, 653 m more than the programme |
| 29 | 166 signed hire agreements, 42 labour notes, 25 collection forms; 32 days, 9 Sep – 23 Oct; 45 dockets in five days of event week |
| 30 | 5,223 mesh panels, 8,235 feet, 216 concrete blocks |
| 31 | 7,977 clamps, 1,426 braces, 133 vehicle gates, 22 pedestrian gates, 41 hoarding panels |
| 32 | 7.3 km of crowd control, 2,903 barriers; 2.2 km event, 5.1 km demarcation, 270 m flat feet |
| 35 | 13.3 + 7.3 + 270 m = 20.8 km, one hundred per cent of the build; 4.4 km of scrim |
| 42 | eight areas at one hundred per cent, fencing among them |
| 43 | 13.3 km fence, 7.3 crowd control, 4.4 scrim, 20.8 km all up |

With turn 33 (v11.81) every fencing figure in the race call is the record's own. Eight takes out of the media table, eight in;
manifest digest; the programme note records the revision; footer v11.81.1 → v11.83 (Codex holds v11.82). No record, servicing,
crew card, tracker or printed-code change.

## Checks

`tests/test_v1183.cjs`: 22/22 on the build (incl. the other 43 turns byte-equal to the base page) and 21/21 on the live page,
desktop and phone (each turn's line and take, each take served 200 audio/mpeg with its bytes, turns 1–51, fencing still 100% and
five green, no errors or writes). Toolchain PASS (176 scripts). Sweeps desktop and phone: 27/19/7/Back, 0 errors, 0 blocked.
