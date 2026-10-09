# v7.42: the pit lane is the way in (LIVE)

Author: Andrew Fisher · 29 Sep 2026

Andrew, 29 Sep 2026: "Anywhere in the park the truck entry point is going to be pit lane. From the road they go into
the pit lane. This is the entry point." And: "You're driving from the left. Same way the race cars go."

**LIVE: 29 Sep 2026, 17:42 AEST.** The page on the service matches this build byte for byte. Nothing on the
live record was written: the rule lives in the build and applies on its own.

## The rule

Every reference standing inside Macintosh Island Park (the paddock) comes in the same way: **off the Gold Coast
Highway into the pit lane at its north-west end, then down the lane the way the race cars go (south-east), with
the park on your left.** That is one rule, kept once, and every one of those references reads it.

- **49 references** are inside the park outline today: AA, GN24, HRP, LTC09, LTC10, LTC11, LTC14, P01, P03, P04,
  P05, P06, P09, P10, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P36, P37, P38, P39, P41, P42, P44, P58,
  T0005, T0022, T0023, T0243, WC02, WC04, WC05, WC06, WC07, WC09, WC12, WC15, WC16, WC17, WC20, WC73. Whether a
  reference is "in the park" is worked out from where it stands (a pin, then a placed position, then the master
  plan's tag, then the drawing), so a reference moved into or out of the park follows on its own.
- **A way in pinned at a turn-in still wins** for that reference, as a pin always does (P33's pin from 22 Sep
  stands). Take the pin off and the rule applies again.
- **Where it shows:** the drawer's Way in row ("the pit lane, like everything in the park", with the words, the
  lane entry's position, "Drive to the pit lane entry", Earth, and the distance from the lane entry to the drop);
  the driver's drop sheet ("Way in — the pit lane"); the drawer's map mark; Navigate.
- **The end can be switched on the record** without a rebuild ("Enter at the south end instead", editors only):
  trucks would then come in at the paddock ramps half-way down the lane and drive it north-west. Everything in
  the park follows the switch. The rule document travels with the record like everything else (`gates`).

## Where the geometry comes from

- The lane is OpenStreetMap's service road on Macintosh Island tagged for motor sport (way 179722656, 15 nodes,
  609 m), the same line iEDM's key plan draws and the Showcase drives. Its north-west node sits on the Gold Coast
  Highway; its south-east node dead-ends in the paddock; a short link half-way down (way 501847689) joins it to
  the highway at the paddock ramps.
- The park is OpenStreetMap way 414608857 (Macintosh Island Park, 53 nodes).
- Both © OpenStreetMap contributors, ODbL. The coordinates are embedded in the page; nothing is fetched at
  run time.
- The race direction: the page's Showcase runs the circuit anticlockwise ("as the race runs"), and the promo
  still of the #26 on the grid shows the pit garages behind the car with its nose pointing south along the
  straight. Southbound on the pit straight is anticlockwise, so the race cars drive the lane south-east and the
  north-west end is where they, and the trucks, come in. If that is ever wrong on the day, the switch above
  flips it in one press.

## Checks

- Practice tests (`evidence/practice_tests.js`, page from the build file, live GETs read-only, writes captured in
  the page): 8 of 8. 49 in the park; P17 gets the lane entry and P33 keeps its pin; a reference outside the park
  keeps the plain row; the driver sheet carries the pit lane words; the switch writes the rule document and every
  park reference follows, and back; a pin wins and clearing it brings the rule back; the map feature builder gives
  one mark at the lane entry.
- Sweeps: desktop 21 tabs 0 errors, phone 21 tabs 0 errors (`evidence/sweep_*.json`).
- Every inline script passes `node --check`; the token, keys and map tokens scanned for before upload.

## Files

- `patch_v742.py`, `pit742_src.js`, `pit742.css` — the change, applied to v7.41.
- `shot742_wayin.png` — the drawer's Way in row for P17 on a phone.
- `evidence/practice_tests.js`, `evidence/sweep_desktop.json`, `evidence/sweep_phone.json`.
