# v6.92: the machine, a bigger shut garage, the driver's eyes, and the wheel runs everything (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher
Asked 27 Sep 2026: "Pit needs to be bigger. More detail. More mechanical things operating ... you can't look outside the pit";
"the cockpit should only ever be from the driver's view"; "more clicks and clangs ... that steering wheel operates everything".

**Nothing here is live.** Full notes: `machine_changed/CHANGES_v6.92.md`. Diffs against the live set are the `*.diff` files.
Deploy by re-registering the machine set with the six changed files, `pit-machinery.js` and `assets/audio/coates-fm.mp3`
added over the current live manifest.

- Garage 54 x 42 x 12 m (was 36 x 28 x 9), fully shut: 102 camera views, 0 pixels of outside (before: 122,054).
- Working machinery every frame: gantry crane with a spare V8, two-post lift, compressor, parts washer, pedestal drill,
  tyre changer, balancer, tyre carousel, 12 extraction fans, 6 beacons, hose reels, a live HALL SYSTEMS board.
- Cockpit: camera at the driver's eyes (0.000 m off), look around only (±100° left/right, −50°/+30°), leans with the steering,
  rides the V8 rumble; wheel apart stays in the driver's view.
- 27 synthesised mechanical sounds; all 26 cockpit controls click, clack or clang and visibly move. Every system is on the
  wheel (IGN, FUEL, FAN, LIGHTS, HB, FIRE added to the rim; START at twelve o'clock); buttons light when their system is on.
- Coates FM on RADIO: radio EQ, V8 ducked 10 dB, press again to stop.
- Test `_qa/test_v6_92.js`: 24 of 24 pass, no page errors. Car view +55 draw calls, +2.7 % triangles.
- Not yet checked: a real GPU, phones, Safari/Firefox, and the sound levels by ear.

## LIVE — 27 Sep 2026, 16:31 AEST
On Andrew's "Machine yes". The machine set was re-registered with the six changed files, `pit-machinery.js` and
`assets/audio/coates-fm.mp3` added over the live v6.90 set (7bdc9747350c, 213 files).
- **New set:** 1f3bddd5acf4, 215 files, 161.2 MB. Version `v6.92-machine-garage-cockpit-coatesfm`.
- **Checked from the live service:** the machine loads `pit-garage.js`, `pit-machinery.js` and `car-cockpit.js` with no page errors.
- **Not yet checked:** a real GPU, phones, and the sound levels by ear.
