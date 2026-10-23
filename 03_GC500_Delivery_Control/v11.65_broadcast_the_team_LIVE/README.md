# v11.65 — the race-day broadcast redone: the team that built it

Author: Andrew Fisher. Built on live v11.63 `88a1d5e1…` with one patch, `patch_v1165.py`. **LIVE 24 Oct 2026 04:28 AEST**,
sha256 `f9a7d41802e62b004e9c24cced57d28b442314dfe0079f1384f69e9bf83721ab` (21,686,488 bytes); media manifest
`4ec67c00b301e58a35f4d88587a936111b40dbdd3570f620f6983cd682cbe399` (1,999 files) registered first. Status in STATUS.md.

Andrew, 23 Oct 2026: "Lets revisit the showcase broadcast. We want to talk as in numbers of everything done an completed
and we want to talk everyone up. Every single person. AARON lead the install he has the experience he got everyone moviing
and directed. Kyle another legend as well as alfie and daniel ... Fencing this is another highlight. Nothing but positive
comms about them and this is from the public. Residential areas. V8 management ... Another team lead by wayne. But all his
team. One team ... We need this to sound epic. Elite. We want this team to get a bit emotional ... We need to redo.it all.
An add more and more", and then: "Bit of humour is good so lets get a few laughs in there too".

Drafted as v11.64 and renumbered: Codex holds v11.64 (the servicing map picture, PR #38).

## The programme

51 turns in one voice, his designed **GC500 Race Caller** (ElevenLabs flow `Qc1iMoJTLhlFZqKutDwx`, eleven_v3): 17 min 22 s
of body (turns 1–50) and a 13 s loop opener (turn 51). `SCRIPT.md` is the script, part by part, with every figure and its
source; `turns.json` is the same script as data with the scene each turn speaks over (`turns_src.py` writes it);
`takes/turnNN.mp3` are the mixed takes, `takes/takes.json` their lengths and SHA-256s, `takes/picks.json` which of the two
takes each turn uses and why; `raw/sessions.json` and `raw/gens.json` record the generations (the raw takes stay outside
the repository).

| Turns | Over | What it says |
|---|---|---|
| 1–3 | countdown | Live from the Gold Coast; 47 days, first truck 7 Sep to race day Fri 23 Oct; 727 pieces of equipment; "grab a cold drink … we're about to talk about YOU" |
| 4 | lead | The project manager: 34 days, 361 hours |
| 5–12 | crew | The install team by name; Aaron Zelvis led the install (33 days, 367 h, day one 7 Sep, "got everyone MOVING"); Kyle Gover, Alfie Harris and Daniel Gough each called a legend with their days and hours; "more than a thousand hours between the four of them … this does not happen without them"; Jayden Paul, Wayne Crimmin, Ludwig Chee, Frank Devilles |
| 13–24 | buildings · checks · toilets · VMS · equipment · water · deliveries | 52 buildings and every team office by name; 52 levelled, 42 stairs; 265 toilets at 74 locations and the nightly QR servicing (266 units, 15 areas); 24 VMS boards; 14 generators; towers, trakmats, machines; 311 water-filled barriers; 727 pieces, 121 asset numbers, 25 references on 16 Oct |
| 25–35 | fencing | Wayne Woods and every member of his crew by name; nothing but praise from the public, the residents and V8 Supercars management; 13,187 m of fence; 162 dockets in 31 days, 40 in event week's four days; panels, feet, blocks, clamps, braces, gates; 7.2 km of crowd control; scrim, relocations and removals; 20 km of fencing work |
| 36–41 | weather · effort · dates | The Bureau's Gold Coast Seaway record: 18 wet mornings, 113.6 mm, 94 mm in the last ten days, gusts of 50 km/h+ on 15 days; 58 pre-starts; ~1,500 hours of Coates hands; the dates that made it |
| 42–43 | complete | Seven areas at 100 %; 727 of 727 on site; "WE did that" |
| 44–45 | site | The Coates values; one team — Coates and Advanced side by side, "if one crew didn't do what they did, none of us would be where we are" |
| 46–49 | crews finish | Special mentions (branches and yard, drivers, the night servicing crews, Rob Simmons and iEDM, V8 Supercars); every name once more; the quiet, emotional close: "somebody in this team put it there … Every one of you deserves to be recognised" |
| 50–51 | countdown | "Stay with us"; the loop opener, which rejoins at turn 3 while Loop is on |

The humour is warm and never at anyone's expense ("leg day, every day", "the most important buildings on the circuit",
the message board not flashing "are we there yet", "more feet than a centipede convention", "beautiful one day, perfect
the next — said NOBODY in event week", the barriers being "the driest thing on site").

Figures are the record to race weekend, Fri 23 Oct 2026, as the v11.63 page reads it (`SCRIPT.md` lists each source);
the scene behind each turn shows the live record.

### Takes and mix

Each turn was generated twice. Both takes were transcribed locally and compared word for word with the script (stage
directions removed, numbers written out); the take used is the closer one, and where the names decided it, the one that
says them cleanly (turn 5 "Aaron Zelvis", turn 25 "Chase Hireni", turn 47 the full roll call). Turn 48, the quiet line,
uses the take that holds its pauses. No take dropped or added words, read a stage direction aloud or had dead air. 35 turns
use take 1 and 16 use take 2.

The mix is v11.11's: 90 Hz high-pass, +3 dB presence at 3 kHz, gentle compression (3:1 from −18 dB), 0.6 s tail; the 22 s
circuit bed looped about 17 dB under the voice; `loudnorm I=−16 TP=−1.5 LRA=11`, limiter 0.891; mono 44.1 kHz 96 kbps MP3
(measured about −15.5 LUFS, peaks under −0.8 dBFS). 12.7 MB.

## What changed on the page (`patch_v1165.py`)

1. **`DATA.broadcast`**: the new programme (schema `gc500-broadcast-v2`), 51 turns with `slot`, `scene`, `text`, `secs`,
   `loop`, `audio:{media}`, `bytes`, `sha256`. The 33 takes of 22 Oct leave the page.
2. **`DATA.media`**: those 33 out, the 51 new takes in, and the machine film's two original v9.95 renders out (MP4
   `0871900727ba…` and WebM `fb84697a6d46…`, replaced by the current film `ff48424670e6…`; nothing on the page or in the
   live record names them; they stay on the service's disk): 1,983 → 1,999 files. The service holds at most 2,000 files in
   a page's manifest (`server.js`: `assets.length>2000` → "invalid media manifest"), and 2,001 was refused on the first
   try with no page sent. `hostedMedia.manifest` is the new digest; `media_manifest_v1165.json` and `media_v1165/<sha>.mp3`
   are written beside the build for the upload.
3. No module: v11.11's `RaceDayBroadcast1111` already rebuilds the Showcase programme from each turn's scene and chains it
   1 → … → 50, then 51 → 3 while Loop is on. All 25 Showcase scenes are now spoken (the kilometre card has its own line).
4. The transcript follows the v5.97 rule ("the project manager" where the take says the name); turns 4 and 47 are written
   so they read cleanly.
5. Footer v11.63 → v11.65. Nothing else: no servicing, crew-card bundle, tracker, printed code or record change.

Headroom: 64 more media files are named by nothing on the page or in the live record (62 WebP pictures, two videos;
unnamed in the v10.21, v11.06, v11.10 and v11.11 builds as well, and absent from the live record at version 10777). They stay for now; they are the room to
free if a later release needs it.

## Release order

    python3 v11.65_broadcast_the_team_LIVE/upload_media1165.py build/GC500_v11.65/media_manifest_v1165.json build/GC500_v11.65/media_v1165 --dry-run
    python3 v11.65_broadcast_the_team_LIVE/upload_media1165.py build/GC500_v11.65/media_manifest_v1165.json build/GC500_v11.65/media_v1165
    python3 toolchain/upload_page.py build/GC500_v11.65/GC500_Delivery_Control_hosted.html

The service refuses a page whose manifest it does not hold, so the takes and the manifest go first.

## Checks

`tests/test_v1165.cjs` on the build: 37/37 (programme, media table and manifest digest agree; 1,999 files, the two film
renders gone; every take resolves to a
hosted media URL; every person named; no full name in the transcript; chain 1..50, 50 → 51 → 3 with Loop; all 25 scenes;
no agent names in DATA; 0 page errors). Toolchain PASS all checks (173 inline scripts). Sweeps desktop and phone: 27 tabs,
19 shown, 7 hashes, Back, 0 errors, 0 blocked writes. On the live page, `tests/live_v1165.cjs` (GET-only): the view link
serves the build byte for byte; all 51 takes answer 200 audio/mpeg with their bytes and SHA-256; a press of Broadcast
starts turn 1 on its hosted take; footer v11.65; 0 page errors — 8/8 at 04:30 AEST 24 Oct, record version 10777 unchanged.
