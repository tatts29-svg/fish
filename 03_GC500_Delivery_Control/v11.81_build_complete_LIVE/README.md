# v11.81 — the fencing build complete at the docket numbers — LIVE

**LIVE 24 Oct 2026 14:09 AEST**, page `6ca9da442988bbe4c9e86aa7d43200f9aa2517102bda1f59fa5a8b3a2c28a2e0` (21,858,331 bytes), built on
Codex's live v11.80 `8d59f9ff6f9801deb509ae2d4a7dd0c0864be7fbf3e1799df3331c578ffdae7e` (loaded Advanced truck); guarded upload, the view
link serves the build byte for byte. Media manifest `69ec3e8319cdc94dc16f53fa64df801fee1a40db9905861661511fae195c4609` (1,999 files)
registered first. Followed at 14:21 by the v11.81.1 lights fix (`../v11.81.1_fencing_lights_LIVE/`). Status in STATUS.md.

Author: Andrew Fisher. Andrew, 24 Oct 2026: "So we need fencing to be 100% now and we work off number we have for completion of
build", then "If we need to change anything in broadcast lets do it so everytjing matches we want everything to match. Make sure we
know everything advanced have done and a rough figure or an exact one".

## What changes (`patch_v1181.py`, `complete1181.js`, `data_v1181.json`)

1. **The ruling.** At race weekend (the v11.63 cut-off, Fri 23 Oct) every fencing type whose recorded work is short of its Build +
   Event programme line reads done = programme; the programme line stays on the row and in its details. Earlier days read as before.

   | Type | Recorded = now the line | Programme line kept |
   |---|---|---|
   | Scrim fitted | 3,977.5 m | 4,394.5 m |
   | Vehicle gates (wheels) | 133 | 135 |
   | Pedestrian gates | 22 | 34 |
   | Crowd control · demarcation | 5,062.5 m | 5,205 m |
   | Relocations | 612.5 m | 989 m |
   | Removed or stacked down | 1,102.5 m | 1,133 m |

   Types already over their line are untouched (temporary fence 13,270 of 12,617 m; event crowd control 2,195 of 2,163 m; flat feet
   270 of 256 m), and the temporary-fence total the overall reading builds (`FencingProgress1104`) is unchanged. The fencing reading
   is now 100% of 20,098.5 m, one figure, not provisional; the seven-group index reads 100%; gates 133/133 and 22/22. The Today
   "planned to date against done" table keeps the programme's planned figures and reads "none · build complete" where a leftover
   was never docketed.
2. **The forecast.** The event week reads as done on the ruling (`cj764Fencing`, as v11.59 reads an ended week): its leftover
   ($15,117.84 at the card, $3,660.60 Advanced) leaves the forecast. The demob programme stays: $26,522.40 / $10,350.00. Fencing job
   forecast $431,673.36 charged / $271,473.20 Advanced (was $446,791.20 / $275,133.80). The money card says so.
3. **The evidence (v11.63's mechanism).** 36766 (Smoking Zone, 10 m) and 36768 (Club 500 B.O.H., 50 m) confirmed as recorded,
   Event. The papers do not name the category: smoking zones have been Event since the project manager accepted it on 2 Oct, the
   Club 500 crowd control is Event on the programme and the record, and he was told Event would be recorded unless he said
   otherwise. Service note 24492's 30 m relocation (Transporter Compound, 22 Oct) added: relocations 582.5 → 612.5 m.
4. **The race call.** Turn 33 re-voiced (scrim 4.4 km; "more than six hundred metres" relocated, now true with 24492; more than a
   kilometre stacked away), same voice, flow and mix; both takes word-perfect, take 1 used (`takes/picks.json`). Eight more turns
   are written in `turns_changes.json` with the final figures (28 fence 13.3 km / 13,270 m / 653 m over; 29 papers 166 / 42 / 25 and
   45 in five days; 30 panels 5,223, feet 8,235; 31 clamps 7,977, vehicle gates 133; 32 crowd control 7.3 km, 2,903 units, 2.2 event;
   35 20.8 km and 100% of the build; 42 eight areas at 100% with fencing; 43 13.3 / 7.3 / 4.4 / 20.8) but **not voiced**: the five
   speech calls made were declined at the approval prompt (`raw/voicing_state.json`) and none is re-run without Andrew's say-so.
   Those turns keep their v11.79 lines and takes.
5. Footer v11.80 → v11.81. No record write, crew card, QR or server change.

`ADVANCED_ACCOUNT_24Oct2026.md` is the whole account of Advanced's build from the same live record.

## Checks

- `tests/test_v1181.cjs` (real clock, then page clock Tue 27 Oct): 44/48 on the build before the media upload (the four misses were
  the new take's 404, expected until the media went up), **48/48 on the live page, desktop and phone**.
- Toolchain PASS (175 inline scripts). Sweeps on the build, desktop and phone: 27 tabs, 19 shown, 7 hashes, Back, 0 errors, 0 blocked.
- A scan of every tab for the closed leftovers (417 m, 142.5 m, 406.5 m, $41,640.24, $14,010.60, "not yet docketed" in the
  programme table) found none left in the fencing readings.

## Files

`complete1181.js` (the ruling, the wrappers, the data install), `data_v1181.json` from `make_data.py` and `snapshots_24Oct2026.json`
(`tests/probe_gen.cjs`, GET only), `patch_v1181.py`, `upload_media1181.py`, `turns_changes.json`, `takes/`, `raw/`, `tests/`.
