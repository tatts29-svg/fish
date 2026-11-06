# Daily pre-starts for the days ahead, 29 Oct – 13 Nov 2026

Author: Andrew Fisher

Andrew, 28 Oct 2026: "A pre-start for every weekday to 14 Nov, Installs and Fencing. Each one prefilled with that day's planned work, crew, equipment and hazards from the record, and i want these signed off just with their names please".

**What's in here:** 23 one-page A4 pre-starts in `pdfs/`, also bundled as `GC500_Prestarts_29Oct-13Nov2026.zip`.
- **Coates Installs:** 12, one for every weekday from Thu 29 Oct to Fri 13 Nov 2026.
- **Advanced Temporary Fencing:** 11. Tue 10 Nov has no form because no fencing task is dated that day on the demob plan.
- Sat 14 Nov 2026 is a weekend day, so the last form is Fri 13 Nov.

**What each form holds:**
- **The day's work:** the demob pick-ups on the programme for Installs, and the demob plan rows dated that day for Fencing.
- **Crew:** the day's roster for Installs, and the fencing crew list for Fencing.
- **Standard sections:** the Life Saving Rules, hazards and controls, site rules and emergency contacts.

**Names and sign-off:** each person's name is printed. The tick, fit Y/N, signature and the supervisor sign-off stay blank, to be completed by each person at that day's pre-start.

**How they're made:** `generate_prestarts_ahead.cjs` is adapted from `record_15Oct2026_prestarts_signed/generate_prestarts.cjs`. It reads the live page read-only, so nothing is written to the record. `evidence/build.json` lists what each form was built from.

**Not uploaded.** Nothing in this folder has been sent to the record.

## Uploaded, 28 Oct 2026

- **16:13 AEST:** the 23 forms went onto the record, one per crew per day (`report_20261028T061345Z.json`).
- **16:19 AEST:** Andrew, on the eight old "Retrospective prefill — unsigned" copies for 7–11 Sep: "yes please". Each was replaced with a form in the same layout (`sep/`, `manifest_sep.json`, `report_20261028T061935Z.json`). The old copies were backed up locally, in a git-ignored folder, before removal.
  - **Coates Installs 7–11 Sep:** the record holds no crew names for those days, so the crew rows are left blank. The work shown is what the programme holds (7 Sep: 1 VMS on; 11 Sep: 1 lighting tower on; 8–10 Sep: nothing).
  - **Fencing 7, 8 and 10 Sep:** the record holds no work for those days, so no names are printed.
  - The generator now takes `--days` for any days, and no longer prints crew names on a day with no work on the record.

**Result:** 79 pre-starts on the record. None is titled "unsigned", and none is shown as uploaded by anyone other than Andrew Fisher.
