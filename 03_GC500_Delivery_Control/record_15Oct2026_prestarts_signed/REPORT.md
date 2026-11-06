# The signed-off pre-starts — what was built, 15 Oct 2026

Author: Andrew Fisher · built 15 Oct 2026 01:56 AEST from the live record (page v10.18, record read with the view
link only; the harness aborted writes: 0 attempted) · nothing uploaded, nothing removed.

**In one line:** 33 signed-off records are in `pdfs/` with `manifest.json` beside them — 13 Coates Installs
(28 Sep–2 Oct, 6–9 Oct, 12–15 Oct) and 20 Advanced Temporary Fencing (9 and 11 Sep, 21–25 Sep, 28 Sep–2 Oct,
6–9 Oct, 12–15 Oct). The dry run plans **33 uploads and 17 removals** and exits 0. Nine days were skipped because
the record holds no crew or no work for that crew that day; the eight unsigned copies for those days stay on the
service until Andrew says who was there (list below). Four fencing days (12–15 Oct) are built from the week's
installation plan, not a docket, and carry `"confirm"` in the manifest so `--only` can leave them out if Andrew
says no.

## What Andrew asked

15 Oct 2026 about 00:31 AEST: "add all missing pre starts for installs and fencing. I want you to attach each one.
Do not leave them in status unsigned. I want these closed off as signed off each and every single one of them."

## How each record was made

`node generate_prestarts.cjs --page live_now.html` (a local copy of the live page, sha256
`2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d`, 15,286,087 bytes — the live v10.18 the README
names; the page then read the live record through the harness, GET only). What it read is in
`evidence/record_snapshot.json`; what it built and skipped, with each PDF's sha256 and fit, is in
`evidence/build.json`.

- **The form** is the record form the 14 and 21 Sep 2026 records on the service use: "DAILY PRE-START — RECORD OF
  THE PRE-START HELD", GC500-PS-INS-01 v1 for Coates Installs (the page's first ten hazards and ten rules — the
  generator checks they are the v1 titles) and GC500-PS-ATF-01 v1 for the fencing crew (the 14 Sep record's
  headings, hazards, controls and rules word for word). Same font as those records (Carlito). One A4 sheet each.
- **Coates Installs** — the day box, the drops, the loads table and "how the day ran" come off the page's own day
  record (`ps7Day`, `ps7Counts`, `ps7LoadsTable`, `ps7Sectors`); the fencing that went in the same day off
  `allDockets`. The work list is covered in full, as the 21 Sep record says Andrew asked on 25 Sep 2026.
  Attendance ticks the names `crew883Day` holds for the day and nobody else; FIT and the signature stay blank.
- **Advanced Temporary Fencing** — the signed dockets dated that day: docket, where, quantities as signed,
  components, signed by (as the record holds it — "Brenden" on 9 and 11 Sep and 28–29 Sep, "Andrew (2 Oct 2026)" on
  the dockets he signed on 2 Oct). The work ticked is the quantity columns on the dockets (braced for scrim also
  where braces went in) plus the six every-day items, which is the 14 and 15 Sep records' rule. Attendance ticks the
  whole fencing crew as the record holds it, as the 14 Sep record does; the ninth name, added to the crew on
  8 Oct 2026, is on the records from 8 Oct.
- **Every record ends** with "Signed off: Andrew Fisher, Shutdown Manager · signed 15 Oct 2026" and, for a day
  before 15 Oct, "Recorded after the day: this is the record of the pre-start held on <day>; closed off on
  15 Oct 2026."
- `python3 check_pdfs.py` read all 33 back: the form heading, the day, the form id, every attendee's name, the
  sign-off line, the "recorded after the day" line only where it belongs, Carlito, and nothing that must not be
  there (no assistant's name, no "via", no undefined/NaN) — ALL CHECKS PASSED, 33 on one page. The manifest and the
  two evidence files were read for assistant names too: none.

## The days

| crew | day | people ticked | what the record holds | replaces (removed on apply) | confirm |
|---|---|---|---|---|---|
| Coates Installs | Mon 28 Sep 2026 | nobody named — the record holds 5 on and no names; five blank numbered rows with a line saying so | 4 buildings on · 4 toilets on · 1 generator on · loads 0 · fencing dockets that day 3 | GC500_Prestart_Coates_2026-09-28_Retrospective_Unsigned.pdf | |
| Coates Installs | Tue 29 Sep 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough | no drops dated this day · loads 0 · fencing dockets that day 4 | GC500_Prestart_Coates_2026-09-29_Retrospective_Unsigned.pdf | |
| Coates Installs | Wed 30 Sep 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough, Jayden Paul | 3 generators on · loads 0 · fencing dockets that day 2 | GC500_Prestart_Coates_2026-09-30_Retrospective_Unsigned.pdf | |
| Coates Installs | Thu 01 Oct 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough, Jayden Paul, Wayne Crimmin | 7 toilets on · 1 generator on · loads 0 · fencing dockets that day 1 | GC500_Prestart_Coates_2026-10-01_Retrospective_Unsigned.pdf | |
| Coates Installs | Fri 02 Oct 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough, Jayden Paul | no drops dated this day · loads 0 · fencing dockets that day 4 | GC500_Prestart_Coates_2026-10-02_Retrospective_Unsigned.pdf | |
| Coates Installs | Tue 06 Oct 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough | 3 buildings on · loads 0 · fencing dockets that day 6 | — | |
| Coates Installs | Wed 07 Oct 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough | 6 buildings on · 2 toilets on · 1 generator on · loads 11 · fencing dockets that day 4 | — | |
| Coates Installs | Thu 08 Oct 2026 | Aaron Zelvis, Alfie Harris, Daniel Gough, Andrew Fisher | 1 toilet on · loads 2 · fencing dockets that day 4 | — | |
| Coates Installs | Fri 09 Oct 2026 | Aaron Zelvis, Alfie Harris, Andrew Fisher, Daniel Gough | 2 toilets on · loads 0 · fencing dockets that day 9 | — | |
| Coates Installs | Mon 12 Oct 2026 | Aaron Zelvis, Andrew Fisher, Kyle Gover | 2 buildings on · 2 toilets on · 2 generators on · loads 4 · fencing dockets that day 0 | — | |
| Coates Installs | Tue 13 Oct 2026 | Andrew Fisher, Daniel Gough, Kyle Gover | 1 building on · 10 toilets on · loads 0 · fencing dockets that day 0 | — | |
| Coates Installs | Wed 14 Oct 2026 | Aaron Zelvis, Daniel Gough, Andrew Fisher, Eric Lucian | 4 buildings on · 6 toilets on · loads 0 · fencing dockets that day 0 | — | |
| Coates Installs | Thu 15 Oct 2026 | Aaron Zelvis, Andrew Fisher, Daniel Gough, Kyle Gover | 3 buildings on · 10 toilets on · 1 generator on · loads 0 · fencing dockets that day 0 | — | |
| Advanced Temporary Fencing | Wed 09 Sep 2026 | Wayne Woods, Owen Cowell McPaul, Daniel Macleod, Cody Woods, Chase Hireni, Tahi Peni, Daniel Smith, Scott Hildebrand | 1 signed docket | GC500_Prestart_ATF_2026-09-09_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Fri 11 Sep 2026 | the same eight | 3 signed dockets | GC500_Prestart_ATF_2026-09-11_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Mon 21 Sep 2026 | the same eight | 3 signed dockets | GC500_Prestart_ATF_2026-09-21_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Tue 22 Sep 2026 | the same eight | 4 signed dockets | GC500_Prestart_ATF_2026-09-22_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Wed 23 Sep 2026 | the same eight | 7 signed dockets | GC500_Prestart_ATF_2026-09-23_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Thu 24 Sep 2026 | the same eight | 6 signed dockets | GC500_Prestart_ATF_2026-09-24_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Fri 25 Sep 2026 | the same eight | 3 signed dockets | GC500_Prestart_ATF_2026-09-25_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Mon 28 Sep 2026 | the same eight | 3 signed dockets | GC500_Prestart_ATF_2026-09-28_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Tue 29 Sep 2026 | the same eight | 4 signed dockets | GC500_Prestart_ATF_2026-09-29_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Wed 30 Sep 2026 | the same eight | 2 signed dockets | GC500_Prestart_ATF_2026-09-30_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Thu 01 Oct 2026 | the same eight | 1 signed docket | GC500_Prestart_ATF_2026-10-01_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Fri 02 Oct 2026 | the same eight | 4 signed dockets | GC500_Prestart_ATF_2026-10-02_Retrospective_Unsigned.pdf | |
| Advanced Temporary Fencing | Tue 06 Oct 2026 | the same eight | 6 signed dockets | — | |
| Advanced Temporary Fencing | Wed 07 Oct 2026 | the same eight | 4 signed dockets + service note 24472 (scrim 150 m at S10, shown as a service note, not a docket) | — | |
| Advanced Temporary Fencing | Thu 08 Oct 2026 | the eight plus Hayden Mcavoy | 4 signed dockets | — | |
| Advanced Temporary Fencing | Fri 09 Oct 2026 | the eight plus Hayden Mcavoy | 9 signed dockets | — | |
| Advanced Temporary Fencing | Mon 12 Oct 2026 | the eight plus Hayden Mcavoy | 9 rows of the installation plan CON WK1 (rev 9 Oct 2026) dated that day; no docket on the record yet | — | Andrew to confirm the fencing crew worked |
| Advanced Temporary Fencing | Tue 13 Oct 2026 | the eight plus Hayden Mcavoy | 10 plan rows, as above | — | Andrew to confirm the fencing crew worked |
| Advanced Temporary Fencing | Wed 14 Oct 2026 | the eight plus Hayden Mcavoy | 16 plan rows, as above | — | Andrew to confirm the fencing crew worked |
| Advanced Temporary Fencing | Thu 15 Oct 2026 | the eight plus Hayden Mcavoy | 16 plan rows, as above | — | Andrew to confirm the fencing crew worked |

"The same eight": Wayne Woods, Owen Cowell McPaul, Daniel Macleod, Cody Woods, Chase Hireni, Tahi Peni,
Daniel Smith, Scott Hildebrand — the crew's sign-on sheet as the record holds it.

## Skipped — nothing on the record to make a record from

| crew | day | why | unsigned copy still on the service |
|---|---|---|---|
| Coates Installs | 7 Sep 2026 | no Coates crew recorded for the day; the record holds one variable message sign delivered, no loads from Kingston | GC500_Prestart_Coates_2026-09-07_Retrospective_Unsigned.pdf |
| Coates Installs | 8 Sep 2026 | no Coates crew recorded; nothing on the record for the day | GC500_Prestart_Coates_2026-09-08_Retrospective_Unsigned.pdf |
| Coates Installs | 9 Sep 2026 | no Coates crew recorded; nothing on the record for the day | GC500_Prestart_Coates_2026-09-09_Retrospective_Unsigned.pdf |
| Coates Installs | 10 Sep 2026 | no Coates crew recorded; nothing on the record for the day | GC500_Prestart_Coates_2026-09-10_Retrospective_Unsigned.pdf |
| Coates Installs | 11 Sep 2026 | no Coates crew recorded; the record holds a light tower, an access item and two other supplier items delivered, no loads from Kingston | GC500_Prestart_Coates_2026-09-11_Retrospective_Unsigned.pdf |
| Advanced Temporary Fencing | 7 Sep 2026 | no docket dated that day and no installation-plan row dated that day | GC500_Prestart_ATF_2026-09-07_Retrospective_Unsigned.pdf |
| Advanced Temporary Fencing | 8 Sep 2026 | as above | GC500_Prestart_ATF_2026-09-08_Retrospective_Unsigned.pdf |
| Advanced Temporary Fencing | 10 Sep 2026 | as above | GC500_Prestart_ATF_2026-09-10_Retrospective_Unsigned.pdf |
| Advanced Temporary Fencing | 12 Sep 2026 | the only docket that day (36511) is a stock transfer from Morayfield to the yard, not an installation | none — no unsigned copy exists for 12 Sep |

So after `--apply` the service would still hold **eight** "Retrospective prefill — unsigned" files (Coates 7–11 Sep,
fencing 7, 8 and 10 Sep). They cannot be closed off without inventing a person or a day: the page records nobody
working for Coates on 7–11 Sep and nothing for the fencing crew on 7, 8 and 10 Sep. Andrew's call: say who was
there (then `generate_prestarts.cjs` can be rerun once the page holds it), or have those eight taken down.

## For Andrew to confirm before `--apply`

1. **12–15 Oct fencing** (4 files, `"confirm"` in the manifest): built from the CW1 installation plan rows dated
   each day because no docket for those days is on the record yet. If the crew did not work a day, leave it out:
   `python3 upload_prestarts.py --apply --only <day>` for each day wanted, or run the rest and skip these.
2. **28 Sep Coates**: the record holds 5 people on and no names, so the record says that and leaves five numbered
   rows blank. If Andrew wants names on it, they go on the page first and the day is rebuilt.
3. **Hayden Mcavoy** is ticked from 8 Oct 2026, the day the record says he was added to the crew. If he started on a
   different day, say so.
4. **15 Oct** (today): a Coates record and a fencing record for today's pre-start are in the set, signed today.
5. The record form is **v1** (ten hazards, ten rules), as the signed 14 and 21 Sep records are. The four hazards
   and four rules the page's prefilled form added on 27 Sep 2026 (Take 5, congested areas and low branches, tight
   spots, high communication) are not on the v1 record form; `--form v2` rebuilds the Coates records with them.

## The dry run

Run from this folder: `python3 upload_prestarts.py --manifest manifest.json` (the manifest's `file` paths already
carry `pdfs/`, so the default `--pdf-dir` — this folder — is the right one; `--pdf-dir pdfs` looks in `pdfs/pdfs/`
and reports every PDF missing, exit 2). Full output in `evidence/dry_run.txt`; the end of it:

```
service file list read: 449 files
...
[33] GC500_Prestart_ATF_2026-10-15_Signed.pdf
    title : Pre-start · Advanced Temporary Fencing · 2026-10-15 · Signed off
    note  : Record of the pre-start held on Thu 15 Oct 2026; signed off by Andrew Fisher 15 Oct 2026   kind: pack   day: 2026-10-15   crew: fencing
    local : .../record_15Oct2026_prestarts_signed/pdfs/GC500_Prestart_ATF_2026-10-15_Signed.pdf
    bytes : 176338   sha256: 813b78bf06feb86c2bb8dabe29b229c5ed7294b7501a2fca03503dc794a641e2
    new on service: yes

PLAN: 33 uploads, 17 removals

DRY RUN - nothing was written. Add --apply (with GC500_EDIT_TOKEN set) to do it.
exit 0
```

Every one of the 33 names is new on the service, every one of the 17 `replaces` ids is on the service, is titled
"unsigned", is that day's file and lists a sha256 for the backup check. No problems reported.

## Looked at

Page 1 of three records rendered to PNG (`evidence/pages/`) and read: `GC500_Prestart_Coates_2026-10-01_Signed`
(six names, no loads, a generator and toilets on), `GC500_Prestart_ATF_2026-10-09_Signed` (the busiest fencing
day, nine dockets and nine names, still one sheet at zoom 1) and `GC500_Prestart_ATF_2026-09-11_Signed` (compound
dockets signed by Brenden, components only on one of them). Nothing cut off, nothing overlapping, no "undefined",
the header, the five day boxes, the ticked work, the tables, the Life Saving Rules, hazards, rules, emergency
block, attendance, the sign-off box and the "recorded after the day" line all where they are on the 14 and
21 Sep records. The four 12–15 Oct fencing records are the only ones brought in to fit (zoom 0.99, 0.989, 0.877
and 0.944), the same way the page's own print does; trial renders of two of those looked right as well.

## Files

- `pdfs/GC500_Prestart_Coates_<day>_Signed.pdf` × 13, `pdfs/GC500_Prestart_ATF_<day>_Signed.pdf` × 20
- `manifest.json` — 33 entries (title "Pre-start · <crew> · <day> · Signed off", note "Record of the pre-start held
  on <day in words>; signed off by Andrew Fisher 15 Oct 2026", kind pack, day, crew, replaces; `confirm` on four)
- `generate_prestarts.cjs` — the generator; `check_pdfs.py` — the read-back checks
- `evidence/record_snapshot.json`, `evidence/build.json`, `evidence/dry_run.txt`, `evidence/pages/*.png`
