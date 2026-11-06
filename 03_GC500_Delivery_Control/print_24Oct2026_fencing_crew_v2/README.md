# The fencing crew's book, v2: "What you built" (GC500 2026)

**Superseded on 24 Oct 2026 by `../print_24Oct2026_fencing_crew_v3/`** (the showpiece: six full-bleed pages and ten matching
certificates). v3 still reads this folder's `map_inputs_24Oct2026.json` and `fonts_italic.css`, so keep them.

Author: Andrew Fisher. Andrew, 24 Oct 2026, on the first print-out (`../print_24Oct2026_fencing_crew/`): "Lets do something like
this as an example but 1000% better please".

## What's here

- **`GC500_2026_fencing_crew_what_you_built_v2.pdf`**: four A4 pages. Print at actual size, double-sided or as loose sheets; it
  also scales cleanly to A3. Every page has a white margin of at least 7 mm, so an office printer clips nothing.
  1. **Cover.** The Surfers Paradise street circuit from the air, using the Queensland Government 2022 aerial the record already
     holds. The track is drawn in white and the fence runs from the weekly installation plans in glowing orange. Over the map:
     "What you built", 20.8 km, 100% of the build, and the four headline numbers.
  2. **The numbers.**
     - 13.3 km of temporary fence, 7.3 km of crowd-control barrier and 4.4 km of scrim.
     - 20.8 km is more than seven laps of the street circuit, drawn as seven full laps plus 0.15 of an eighth.
     - The gear as picture rows where each symbol is 100: 8,235 feet, 7,977 clamps, 5,223 panels, 2,903 barriers, 1,426 braces.
     - Then the gates, hoarding panels, flat-feet barriers and gate wheels.
  3. **Week by week.**
     - Metres by week, with the hire agreements each week.
     - The running total: 10 km by Fri 2 Oct, 20.8 km by Fri 23 Oct.
     - The records: biggest week, biggest day, biggest single job and event week.
     - The weather they built through, the work done twice, and the 233 signed papers.
  4. **The line-up.** Wayne Woods (supervisor) and the nine crew, as the sign-on sheet reads. Then Andrew's thank-you letter with a
     line to sign, and the finish flag: "Build complete, 100%, Fri 23 Oct 2026".
- **`GC500_2026_fencing_crew_certificates.pdf`**: ten A4 landscape certificates of thanks, one for each of the crew, each with a
  line for Andrew to sign. Each one says "for your part in building 20.8 km", so nobody is credited with more than the crew did
  together.

No money anywhere.

## Where every figure comes from

The figures are the live record's own reading on 24 Oct 2026 (record 10804). They are the same as the v11.81 Advanced account,
the race call and the first print-out, with the feet as corrected on 24 Oct:
- 8,235 feet are written on the hire agreements.
- About 8,495 were used, counting the 11 papers that left the box blank.
- There are no separate concrete blocks.

The other sources:
- **Weather:** Bureau of Meteorology, Gold Coast Seaway, 7 Sep – 23 Oct 2026, as the race-call script cites it.
- **Positive feedback:** the project manager, 23 Oct 2026 (race-call script, figures table).
- **Lap length:** 2.91 km is the record's registered key-plan lap (`surrounds.registration.lap_length_m`). 20,797.5 m ÷ 2,910 m =
  7.15 laps. The official 2.96 km lap still gives more than seven.

## The map is placed, not drawn by eye

`make_inputs.py` reads it all off the live page into `map_inputs_24Oct2026.json`.
- **Fence runs.** The fencing map catalogue's 83 installation-plan fence lines sit on iEDM's master plan D001-26003-03. They come
  onto the aerial through that sheet's own 42 callouts, which carry both readings. The fit is exact, with a worst error of
  0.011 m.
- **Track.** iEDM's key-plan ring is fitted by closest points to the ring the page itself draws on its aerial (`DATA.hzmap`). The
  median error is 0.77 m and the worst is 4.9 m.
- **Place names.** They sit where the master plan writes them.

The fence runs are selected runs, not every panel, and the map is not surveyed. The cover says so in its credit line.

The aerial is "© State of Queensland 2022, CC BY 4.0", credited on the cover and on page 4.

## Rebuild

```
python3 make_inputs.py <live page .html> <hzmap .webp>       # only if the record changes
python3 build_crew_book.py <aerial_hi .webp>                  # checks the aerial's SHA-256 against the record
python3 build_certificates.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs && NODE_PATH=/opt/node22/lib/node_modules node render.cjs certificates.html
```

The aerial and hzmap images are the page's own media (`/m/Coates-GC500-2026/<sha256>.webp`, fetched with GET). The fonts are
Barlow Condensed and Inter (SIL Open Font Licence), embedded. `crew_book.html` and `certificates.html` are build outputs and are
not committed. The previews are `preview-1.jpg` to `preview-4.jpg` and `preview-certificate.jpg`.
