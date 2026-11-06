# The fencing crew's showpiece, v3: "What you built" (GC500 2026)

Author: Andrew Fisher. This version follows Andrew's notes on v2, 24 Oct 2026: "We want something elite and pretty to show the fencing team ... Try
again ... if we cant present it good. Remove it ... like a show piece for these guys so must look really good please. And
amazing on pdf".

It replaces `../print_24Oct2026_fencing_crew/` (v1) and `../print_24Oct2026_fencing_crew_v2/` (v2).

## What's here

**`GC500_2026_fencing_crew_what_you_built.pdf`** is six A4 pages, full bleed and dark, with one idea per page, big type and nothing technical:

1. **Cover.** The street circuit from the air: the track in white and the fence runs in glowing orange. It carries "What you built",
   Advanced Temporary Fencing, Wayne Woods and crew (9 Sep – 23 Oct 2026) and 100% of the build.
2. **The distance.**
   - 20.8 km of fence and crowd control, which is more than seven laps of the street circuit (drawn as seven laps and a bit).
   - 13.3 km of temporary fence, 7.3 km of crowd-control barrier and 4.4 km of scrim.
   - An aerial close-up of the fence runs along the highway and through the park.
3. **The gear.** "Every piece. By hand." with six big numbers:
   - 8,235 feet
   - 7,977 clamps
   - 5,223 mesh panels
   - 2,903 crowd-control barriers
   - 1,426 braces
   - 155 gates
4. **Seven weeks.**
   - Metres by week, with the biggest week (5,645 m) lit up.
   - The biggest day, the biggest single job, and the 45 dockets in event week.
   - The weather they built through.
5. **The line-up.** Wayne Woods (supervisor) and the nine crew, as the sign-on sheet reads, beside the circuit.
6. **Thank you.** Andrew's letter with a line to sign, and a chequered flag reading "Build complete, 100% · Friday 23 October 2026".

**`GC500_2026_fencing_crew_certificates.pdf`** is ten A4 landscape certificates of thanks in the same style, one for each of the crew,
with a line for Andrew to sign. Each says "for your part in building 20.8 km", so nobody is credited with more than the crew did
together. Each name is sized to fit its line.

There is no money anywhere. The previews are `preview-1.jpg` to `preview-6.jpg` and `preview-certificate.jpg`.

## Showing it and printing it

- **On a screen** (phone, tablet, laptop or a TV in the crib room) it works as it is. This is what it was designed for.
- **For prints worth keeping,** take the PDFs to a print shop on A4 satin or gloss, "print to edge" (full bleed). The pages are dark
  to the edge on purpose.
- **An office printer** will leave a thin white border and use a lot of toner. That's fine for a one-off, but it's not the best result.

## Where every figure comes from

Every figure is the live record's own reading on 24 Oct 2026 (record 10804), the same as the v11.81 Advanced account, the race
call and v2:
- **Feet.** 8,235 is the number written on the hire agreements. About 8,495 were used once the 11 papers that left the feet box
  blank are counted. The showpiece prints the written figure. There are no separate concrete blocks: the "blocks" on the dockets
  are these feet.
- **Weather:** Bureau of Meteorology, Gold Coast Seaway, 7 Sep – 23 Oct 2026, as the race-call script cites it.
- **Positive feedback:** the project manager, 23 Oct 2026, as in the race-call script.
- **Laps:** the record's registered key-plan lap is 2.91 km, so 20,797.5 m is 7.15 laps. The official 2.96 km lap still gives more
  than seven.
- **Weekdays:** checked against the calendar (Wed 9 Sep, Mon 28 Sep, Fri 2 Oct, Tue 13 Oct, Fri 23 Oct 2026).

## The map

- **The track and the fence runs** are placed exactly as in v2 (`../print_24Oct2026_fencing_crew_v2/make_inputs.py` and
  `map_inputs_24Oct2026.json`, which v3 reads from there unchanged; the v2 README has the fits).
- **The cover is north-up.** The aerial strip on page 2 is the frame as the record holds it, with north to the left. It is a
  close-up, so it carries no labels.
- **The aerial is "© State of Queensland 2022, CC BY 4.0",** credited on the cover. The fence runs are selected runs, not every
  panel, and the map is not surveyed.

## Rebuild

```
python3 build_showpiece.py <aerial_hi .webp>        # checks the aerial's SHA-256 against the record
python3 build_certificates.py
NODE_PATH=/opt/node22/lib/node_modules node render.cjs && NODE_PATH=/opt/node22/lib/node_modules node render.cjs certificates.html
python3 pdf_meta.py                                  # title, author and subject into both PDFs
```

- **Inputs.** The aerial is the page's own media (`/m/Coates-GC500-2026/<sha256>.webp`, fetched with GET).
- **Fonts.** Barlow Condensed and Inter (SIL Open Font Licence) are embedded as real font files: v1's `fonts.css` (Barlow), v2's
  `fonts_italic.css`, and this folder's `fonts_light.css` and `fonts_inter.css` (Inter 400–800 from @fontsource/inter 5.2.8).
- **Drawing.** The chart, the circuit and the flag are vector drawings, so they stay sharp at any size.
- **Not committed.** `showpiece.html`, `certificates.html` and the `page-N.png` / `cert-N.png` screenshots are build outputs.
