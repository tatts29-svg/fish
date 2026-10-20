# v9.00 part B — the race call names the new member of the fencing crew (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT**, not uploaded, not committed by this part

## What Andrew asked

Andrew, 8 Oct 2026 about 11:25 AEST, in the v9.00 chat, about the fencing crew member added in part A: "… he will need to
be added to the broadcast too". (The name is left out of this folder on purpose; it reaches the build only from the private
input, below.)

## What the patch does (`patch_v900_broadcast.py`)

Turn 17 of the race call (`DATA.broadcast.turns`, slot 17, turn "15") is the fencing crew's roll call. On the v7.22 model:

- **Text:** the new name is appended, with "!", after the last name the call already makes, in Andrew's spelling. The take
  speaks the input's `broadcast_spoken` spelling (same name, capitals differ).
- **Take:** the new take is added to `DATA.media` by SHA-256 (`<sha>.mp3`, `audio/mpeg`, scope `view`, bytes). The slot's
  `sha256`, `bytes`, `audio.media`, `secs` and `measured_s` are updated; `secs` = `measured_s` = 16.03 s, measured by
  ffmpeg 7.0.2 (`ffmpeg -i`) on the file itself when the patch runs.
- **Old take:** the base's slot-17 take leaves `DATA.media` when nothing else names it (on v9.04 nothing does).
- **Revision:** `DATA.broadcast.revision` gains one dated sentence: "turn 17 re-voiced 8 Oct 2026 in the same voice, flow
  and mix to add <name> to the fencing crew as named in the call".
- **Media manifest:** before changing anything it proves the base's `DATA.hostedMedia.manifest` is v7.22's canonical digest
  of `{"schema":"gc500-media-v1","assets": DATA.media sorted by file}`. Then it writes the new manifest to
  `media_manifest_v900.json` (beside the patch and beside the built page) and sets `DATA.hostedMedia.manifest` to its digest.
- **Nothing else:** the patch asserts every other `DATA` key, every other turn, every other media entry and every byte
  outside the `DATA` line are unchanged. No money, no record write, no pin, no `MASTER_LOC`, no marker. No footer change
  (`patch_v900_footer.py` does that). `broadcast.about.body_s` is left as v7.22 left it: it was already stale (447.5
  against the slots' 449.88 s before this part) and no page code reads it.

**The base is read, not assumed.** Slot 17's current take, its roll call and the base manifest all come from whatever live
page `build.sh` fetches. It was written for v8.99 (`f7f4a3fe…`); live moved to v9.04 (`d0d63004…`, one webp added, 1,967
media, manifest `752a49a9…`) during the work, and the patch now applies to either. Only the input take is pinned.

## The take (kept out of git)

| | |
|---|---|
| file | `<scratchpad>/v900/media/c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893.mp3` (copied from the mixing job's `bcast/final/turn17.mp3`) |
| SHA-256 | `c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893` |
| size | 192,428 bytes |
| length | 16.03 s (`ffmpeg -i`, and a full decode, with no errors) |
| format | MP3, 48 kHz, mono, 96 kbps, the same as turns 16 and 18 |

The mixing job's report (`bcast/final/REPORT.md`, outside git) passes every check and reports no failed one. It proves the last
step byte for byte (re-making old turns 16–18 from their v6.70 mixed takes gives the page's own files). The new take matches its
neighbours on loudness (page file −15.4 LUFS, mean −16.9 dB against −16.8 to −17.0), on the bed under the voice (17.89 dB
against 17.69–18.69) and on the speech spectrum within 1.5 sd of the 34 old takes. **Andrew listened and approved it on 8 Oct 2026 at
about 14:38 AEST** ("Race clip all good"), after hearing a 41 s clip of turns 16 → 17 → 18 back to back, built from the live
files for 16 and 18 and the new take.

**Before upload** the take must be on the service's media store under that file name. The view link serves
`/m/<token>/<sha>.mp3` and checks the page against the manifest.

## Build

```bash
V900_TEAM=<private input, SHA-256 ee576e40…> \
V900_TAKE=<scratchpad>/v900/media/c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893.mp3 \
V900_FFMPEG=<ffmpeg 7.0.2 static> \
toolchain/build.sh v900_x v9.00_crew_vms_counts_DRAFT/patch_v900_crew.py v9.00_crew_vms_counts_DRAFT/patch_v900_broadcast.py <split> <vms> <footer>
```

Any later part that changes `DATA.media` has to write the manifest again. The test checks the final page's digest against
both this file and the page's own `DATA.media`.

## Test (`tests/test_broadcast900.cjs`)

`PAGE=<build> V900_TEAM=<input> MEDIA=<folder with <sha>.mp3> [MOB=1] [OUT=…] node tests/test_broadcast900.cjs`, through
`browser_run.sh`. It reads the base from `base_live.html` beside the build. `STATIC_ONLY=1` runs just the file checks.

- the base's manifest digest is the canonical form of its own `DATA.media`
- all 35 turns resolve to their take in `DATA.media`
- slot 17's text is the base's roll call with the name once at the end, from the input
- slot 17 carries the new take: sha256, bytes, secs, measured_s
- every other turn is unchanged, the base's old take is gone, and every other media entry is unchanged
- the revision sentence is present
- `media_manifest_v900.json` equals the page's `DATA.media` and the page's digest
- in the browser, at the live address with the take served locally:
  - every turn resolves to a hosted take URL
  - Broadcast starts from its button (behind Options on a phone)
  - slot 17 plays the new file to its end and moves on to slot 18
  - the old take is never requested
  - no script or console errors, and no write (`counts.blocked` 0)

## Results (8 Oct 2026, ~13:15 AEST, on live v9.04)

- Base `d0d630046090…` (live v9.04, re-fetched read-only after the runs, unchanged). Built page `3b14ae4c7d64…`
  (broadcast part alone; `check_page` PASS). Crew + broadcast chain `1da8bdf4c1b8…`, which gives the same manifest.
- Manifest proof: the canonical digest of v9.04's own `DATA.media` (1,967 assets) = `752a49a945bf…` = its
  `hostedMedia.manifest`. New manifest `85c6747f74d73c3914ebb04e2a87426a79012784a9b0c4b28f0288fd00d41ff3`, 1,967 assets
  (one take in, one out).
- `test_broadcast900.cjs`: laptop 18/18, phone 18/18 (the phone reaches Broadcast through Options); static 10/10 on
  the chain build. The unpatched base fails the six checks it should.
- Money, read-only, with v8.95's `compare_money895.cjs` (A = base, B = build, record 4465): 4,113 figures the same,
  0 differ, 0 structural differences. Tie-outs 17/17 on both, 0 errors, 0 writes.
- The patch refuses a second run ("already applied").

**Why the Broadcast button "did not show".** It did show. A probe found it visible (100 × 44 px) 0.5 s after
`showOpen()`. The showcase's 3D scene starves headless Chromium of animation frames: the test measured 58 frames per
second before `showOpen()` and 1 after on a laptop, and 47 then 2 on a phone. The page's own watchdog then says "3D paused
— this device could not keep up". Playwright's `waitForFunction` polling, selector polling and click checks all wait on
frames, so they timed out with the button on screen. The test now waits with node-side loops and presses with a real mouse
click at the button's centre, after checking that the button is what is there.
