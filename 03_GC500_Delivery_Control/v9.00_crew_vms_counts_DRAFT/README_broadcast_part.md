# v9.00 part B: the race call names the new fencing crew member (DRAFT)

Author: Andrew Fisher · 8 Oct 2026 · state: **DRAFT, built and tested on v8.99; not uploaded**

## What Andrew asked

Andrew, 8 Oct 2026 about 11:25 AEST (GC500 chat, about the name added to the fencing crew in part A): "<the new name> he
will need to be added to the broadcast too". The name is kept out of git. The patch and the test read it from the private
input `V900_TEAM` (SHA-256 `ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a`), and it is never written
into this folder.

## What changes on the page

This part changes data only, on the model of v7.22 (a name added to the install team's four turns).

- **Turn 17** (`DATA.broadcast.turns` slot 17, turn "15", the fencing crew roll call): the text gets " <name>!" after the
  last name called. The text keeps Andrew's spelling. The take speaks the input's `broadcast_spoken` spelling, which is
  the same name with different capitals.
- The slot's take changes to the new one, by SHA-256: `sha256` and `audio.media` become `c1f29637…`, `bytes` becomes
  192428, and `secs` and `measured_s` become 16.03 (was 13.82).
- **`DATA.media`**: the new take is added as `{file: <sha>.mp3, sha256, type: audio/mpeg, bytes: 192428, scope: view}`.
  The old slot-17 take `91ddb434…` is dropped because nothing else on the page names it. The list stays at 1,966 entries.
- **`DATA.broadcast.revision`**: gains "; turn 17 re-voiced 8 Oct 2026 in the same voice, flow and mix to add <name> to
  the fencing crew as named in the call".
- **`DATA.hostedMedia.manifest`**: changes from `d01b619abe6fac3d56d077abaf8a2cdcbbc4c9e69bd725a4a84c01849c83fa1f` to
  `08c62c1e3fba1c21627c3f6d9b37f04910a767badec09a75664377bde29532f9`.

Nothing outside the DATA line changes. In DATA, only `broadcast`, `media` and `hostedMedia.manifest` change, and the
patch asserts this. Nothing else moves: no money figure, no record, no navigation pin, no MASTER_LOC and no marker.
`broadcast.about.body_s` is left as v7.22 left it: it was already stale (447.5 against 449.88) and no code reads it.

## The take (kept out of git)

| file | SHA-256 | bytes | length |
|---|---|---|---|
| `c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893.mp3` | `c1f296379a281e22516d8f86a7d7f24097f7e5b47b4c6aa135dcb6e0dc352893` | 192428 | 16.03 s (`ffmpeg -i`, 7.0.2 static; a full decode reads the same, with no errors) |

- **Format:** 48 kHz mono 96 kbps MP3, the same encode as turns 16 and 18 and the four v7.22 takes.
- **Where it is:** in the builder's scratch media folder (`<scratchpad>/v900/media/`), not in the repo.
- **Upload:** it must be uploaded to the service's media store, with the manifest below, before this page goes live.
  The page asks for `/m/<view link>/c1f29637….mp3`.
- **The mixing job's report:** this is the same voice (GC500 Race Caller, ElevenLabs flow `W7a20xwIayc6JFewVxvl`,
  eleven_v3, one take). The normalisation step reproduces the live turns 16, 17 and 18 byte for byte from their v6.70
  mixed takes. On the page file:
  - integrated loudness −15.4 LUFS (old 17: −15.3) and mean volume −16.9 dB;
  - bed 17.9 dB under the voice (old 17: 17.7);
  - every speech band from 63 Hz up within 1.5 sd of the 34 old takes.
- **Not checked yet:** nobody has listened to it. Andrew's ear on 16 → 17 → 18 is the real test.

## The media manifest

- **Proof first:** before it changes anything, the patch rebuilds the live manifest's asset list from the base page's
  `DATA.media`, each asset as `{bytes, file, scope, sha256, type}` and sorted by file. It proves the canonical digest
  (v7.22's `canonical()` over `{schema: 'gc500-media-v1', assets}`) equals the live `hostedMedia.manifest`
  `d01b619a…`. If it does not, the patch stops.
- **The new manifest:** `media_manifest_v900.json`, in this folder, holds 1,966 assets with digest `08c62c1e…`. The
  build writes the same file next to the built page, and the patch refuses to run if the copy in this folder differs.
- **If a later v9.00 part changes `DATA.media`,** it must rebuild the manifest from `DATA.media` the same way.

## Build and checks (8 Oct 2026, about 12:27 AEST)

```
V900_TEAM=<private input> V900_TAKE=<scratch>/v900/media/c1f29637….mp3 V900_FFMPEG=<ffmpeg 7.0.2> \
  toolchain/build.sh v900_broadcast v9.00_crew_vms_counts_DRAFT/patch_v900_broadcast.py
```

- **Base:** `f7f4a3fedad41f024eca82d85befad163067b83720413fab2a8aa5999d5d0ab4` (live v8.99), checked on `base_live.html`.
- **Built:** `c7bb4529c016e82328327d4c7dcdfce7afe6297865b4c6eab1ef9101b32fe0e9`, 11,429,141 bytes. The build is the same
  byte for byte as a separate dry run of the patch on the base. `check_page`: PASS (20 inline scripts parse, no new
  secrets, author line present). The scrub left the page unchanged.
- **Runs once only:** a second run stops with "v9.00 broadcast part already applied".
- **Refuses the wrong base:** on today's later live page (v9.04, manifest `752a49a9…`) the patch stops at the manifest
  proof and leaves the page untouched. **The patch is bound to the v8.99 base;** rebasing means proving the manifest
  again on the new base.
- **Independent diff of DATA:** only `broadcast` (revision plus slot 17) and `media` (one in, one out) change, plus
  `hostedMedia.manifest`.
- **`tests/test_broadcast900.cjs`:** static checks plus a browser run, laptop and phone. Results are in the release record.

```
PAGE=<built page> V900_TEAM=<private input> MEDIA=<folder holding <sha>.mp3> [MOB=1] [OUT=<dir>] node tests/test_broadcast900.cjs
```

The test checks:

- all 35 turns resolve to `DATA.media`;
- slot 17's text ends with the name from the input, after the unchanged live roll call;
- the new take is served locally and Broadcast plays slot 17 from it to its end and moves on to slot 18;
- the manifest digest on the page equals `media_manifest_v900.json`;
- no errors and no writes.

`STATIC_ONLY=1` runs the file checks without a browser.

## Still open

- Spelling of the name to confirm with Andrew. The page uses his spelling, and the take says it with a capital A in the
  surname.
- Andrew to listen to 16 → 17 → 18.
- The take and the new manifest must be uploaded with the page.
