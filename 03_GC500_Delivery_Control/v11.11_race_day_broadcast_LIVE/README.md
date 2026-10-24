# v11.11 — the race-day broadcast, redone from scratch on the finished record

Author: Andrew Fisher. Built on live v11.09 `4741d5cd…` with two patches in one build: `../v11.10_showcase_smooth_LIVE/patch_v1110.py`
(the Showcase plays smoothly) then `patch_v1111.py` (this programme). **LIVE 22 Oct 2026 07:51 AEST**, sha256
`9aee0e49460de11ba3758370308013bf1eb8833bb9f43468252ef90e2cd8a5d9` (21,064,324 bytes); media manifest
`c67715c8a03370a080185f532acb5a0ac17953561c14e2d943170926eb5fdff5` (1,983 files) registered first. Status in STATUS.md.

Andrew, 22 Oct 2026, the evening before the first race day: "We want to redo the broadcast. From scratch as there is a lot
of data. But we want to broadcast it as everything is done and complete. We mention everyone's names. As it's the team
that made it happen. We have all records of what happened and when. Even all the weather records ... this now becomes the
showcase for the team to watch and listen to on the race days."

## The programme

33 turns, one voice (his designed **GC500 Race Caller**, ElevenLabs flow `Qc1iMoJTLhlFZqKutDwx`, eleven_v3, one take a
turn), 10 min 55 s of body (turns 1–32) and a 13 s loop opener (turn 33). `SCRIPT.md` is the script with every figure and
where it came from; `turns.json` is the same script as data with the scene each turn speaks over; `takes/turnNN.mp3` are
the mixed takes (`takes/takes.json` their lengths and SHA-256s).

| Turns | Over | What it says |
|---|---|---|
| 1–2 | countdown | Live at the Gold Coast; six weeks from the first truck (7 Sep) to the flag |
| 3 | lead | The project manager: 36 days on the ground, 385 hours |
| 4–5 | crew | The install team by name: Aaron Zelvis, Alfie Harris, Kyle Gover, Daniel Gough, Jayden Paul, Wayne Crimmin; Ludwig Chee and Frank Devilles on the race weekend; days and hours |
| 6–8 | buildings · checks | 52 buildings (23 × 6 m, 14 × 4.8, 6 × 12, 3 × 9.6), 13 Sep–14 Oct; every team's garage office, ECC, medical, police, ambulance, fire, first aid, security, accreditation, ticket boxes; 52 levelled, 45 sets of stairs |
| 9–10 | toilets | 265 units (236 FWF, 15 blocks, 2 sixteen-pan, 4 accessible, 2 trailers) over 74 references, 14 Sep–20 Oct; serviced nightly by QR: 266 units, 15 areas |
| 11–12 | VMS · equipment | 24 boards; 14 generators (two 200 kVA … 20s); 7 towers, 30 trakmats, forklifts, scissor, two booms |
| 13–14 | water barriers | 311 Armorzone barriers (154 along the grandstands), the roads and parks they protect; 14 Sep–21 Oct |
| 15 | deliveries | 30 delivery days, peak 16 Oct with 25 references; every load timed |
| 16 | fencing | Wayne Woods and the Advanced Temporary Fencing crew by name |
| 17–23 | fence · panels · fixings · CCB · repeat work · areas · programme | 11,577.5 of 12,617 m, 9 Sep–16 Oct, 26 docket days, 123 dockets; 4,548 panels, 6,789 feet, 216 blocks; 6,533 clamps, 1,023 braces, 111 vehicle gates, 22 pedestrian gates, 233 wheels; 2,320 CCB units, 1,267.5 m event + 4,532.5 m demarcation; scrim 1,725 + 427.5 m, 435 m relocated, 227.5 m stacked; 17.5 of 20.2 km overall |
| 24–25 | effort · dates | Pre-starts, spotters, nearly 2,000 hours of Coates labour by race weekend; 30 truck days, 26 docket days |
| 26–27 | weather | BoM Gold Coast Seaway 7 Sep–9 Oct: 33 days, 8 wet, 19.6 mm, fog 12 Sep and 6 Oct, 63 km/h gust 7 Oct, 12.9 °C on 27 Sep, 28.6 °C on 21 Sep |
| 28 | complete | Buildings, toilets, generators, lights, machines 100 % |
| 29–31 | site · crews finish | The five Coates values; everyone named once more; "every one of them deserves to be recognised" |
| 32 | countdown | "Stay with us" — the body's last turn |
| 33 | countdown | The loop opener; with Loop on, the programme rejoins at turn 3 and never replays the welcome |

Figures are the record as it stood at 05:00 AEST 22 Oct 2026 (`SCRIPT.md` lists the source of each). The scene behind
each turn shows the live record, so a number the record moves on from is still right on screen.

### Mix

Each raw take → 90 Hz high-pass, +3 dB presence at 3 kHz, gentle compression (3:1 from −18 dB), 0.6 s tail; the 22 s
circuit bed (ElevenLabs sound effect, looped, faded) about 17 dB under the voice; `loudnorm I=−16 TP=−1.5 LRA=11`,
limiter 0.891; mono 44.1 kHz 96 kbps MP3. A slot's length is its mixed take's measured length. Total 8.0 MB.

## What changed on the page (`patch_v1111.py`)

1. **`DATA.broadcast`** is the new programme (schema `gc500-broadcast-v2`): 33 turns with `slot`, `scene`, `text`,
   `secs`, `loop`, `audio:{media}`, `bytes`, `sha256`. The September programme's 35 takes leave the page.
2. **`DATA.media`** drops those 35 files and adds the 33 new ones (1,985 → 1,983 files); `hostedMedia.manifest` is the
   new digest. `media_manifest_v1111.json` and `media_v1111/<sha>.mp3` are written beside the build for the upload.
3. **One module** after the Crew Showcase: rebuilds the Showcase programme object from each turn's named scene (24 of
   the 25 scenes are spoken; the kilometre card has no words and the deck still shows it outside the broadcast), sets
   the next-slot chain 1→…→32, 32→33→3 with Loop on, and makes every press of Broadcast start at the welcome.
4. The transcript on the page follows the v5.97 rule ("the project manager" where the take says the name), as the
   September programme's did; turn 3's transcript is written so that line reads cleanly.
5. Footer v11.10 → v11.11.

Names: the install team and the fencing crew are the page's current contacts; the support crew and the retired installer
stay off the call, as they are off the page. "Six hundred metres" of water barrier is 311 × 2 m.

## Release order

    python3 v11.11_race_day_broadcast_LIVE/upload_media1111.py build/GC500_v11.11/media_manifest_v1111.json build/GC500_v11.11/media_v1111 --dry-run
    python3 v11.11_race_day_broadcast_LIVE/upload_media1111.py build/GC500_v11.11/media_manifest_v1111.json build/GC500_v11.11/media_v1111
    python3 toolchain/upload_page.py build/GC500_v11.11/GC500_Delivery_Control_hosted.html

The service refuses a page whose manifest it does not hold, so the takes and the manifest go first.

## Checks

`tests/test_broadcast1111.cjs` on the build: 33/33 (programme, media table and manifest digest agree; every take
resolves to a hosted media URL; chain, loop and restart rules; 24 scenes; no agent names in DATA; 0 page errors).
Toolchain PASS all checks. Sweeps desktop + phone 25 tabs / 7 hashes / Back, 0 errors. On the live page after upload:
all 33 takes answer HEAD 200 as audio/mpeg with their byte counts; each loads as audio with its slot's duration; a
`bcStart()` on the live page starts turn 1 over the countdown with the player on the hosted take; footer v11.11;
0 page errors.
