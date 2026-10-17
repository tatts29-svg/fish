## v6.70 — 26 Sep 2026 — one voice for the whole race call

- Andrew: "I like the first lead A. Can we not have him for the whole lot."
- Voice design: from Andrew's brief ("Australian man in his 50s, big gravelly voice, classic Bathurst-style motor racing commentator…"), three previews read turn 1. He picked **lead_A**, saved to his ElevenLabs library as **GC500 Race Caller** (voice id DJgcuhDNrdWm8i2kZYZN). Lead B and C were marked discarded. The ex-driver previews (second_A–C) were not saved.
- Re-voiced all 35 turns of the live race call (same words as v6.60, `bc_live_script.json`) in that one voice: ElevenLabs flow W7a20xwIayc6JFewVxvl, eleven_v3, one take per turn, all 35 completed first time (about 7,700 credits).
- Same mix as v6.60. Each take has broadcast EQ and compression, plus the circuit bed (layered crowd, shaped noise and the original V8 clip) about 17 dB under the voice. The bed is quieter under turn 32. The takes are loudness-normalised by `pipeline/broadcast.py`.
- Page: the spine's voices all read "GC500 Race Caller" and every turn is LEAD. The 35 new takes are carried as media by SHA-256 and the 35 old ones dropped (175 assets, manifest digest cfc86a3d…). The Broadcast button's hover text now reads "The race call — the GC500 Race Caller over the scenes".
- Test: 35 of 35 turns carry audio. Broadcast plays slot 1 from hosted media and stops cleanly, with no script errors. The live page is byte-identical to the published build, and the live take serves 200.

| Audition file | Voice | generated_voice_id | |
|---|---|---|---|
| auditions/lead_A.mp3 | Veteran Aussie caller | DJgcuhDNrdWm8i2kZYZN | **picked, saved** |
| auditions/lead_B.mp3 | Veteran Aussie caller | cYFRWtLcEztcMzASrUrO | discarded |
| auditions/lead_C.mp3 | Veteran Aussie caller | qc4v0rFZneABpXKyDDYV | discarded |
| auditions/second_A–C.mp3 | Ex-driver expert | 1squCoaXwDQNX56Uz1lm, lnUSVKgLegZO0LlnWVBv, Xedcr6L5B0NZnizVp8G6 | not used |

`takes/` holds the 35 mixed takes. `SAMPLE_turn01_race_caller.mp3` is the opener.
