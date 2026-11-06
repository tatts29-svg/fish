# v11.27 — Save & close opens a status page; the card never closes itself

Author: Andrew Fisher. Built on live v11.26 `d39f7421…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "When they save it. It cutrently closes it. Can it go to a status conpletion page for them or show
whats been done and what still needs to be done".

## Before

Save & close showed a short "Saved" card (area and everything percentages, Back) and, once every tap had reached the
service, tried to close the window after 1.2 s.

## After

The window is never closed. Save & close shows a status page, drawn from the same job states as everything else and
redrawn live like the rest of the card:

1. **Saved** (or "Saving…" / "Kept on this phone" while taps are still going, exactly as before), with this reference
   stamped done and the time, or "PG01 still needs …" with the icons of the jobs it is missing; the area's and everything's
   percentages and jobs to go; **Back to PG01**.
2. **PG01 · what was done** — every job on every line at the reference with its time, waiting-for-signal taps marked.
3. **Area 1 · Pit Lane, Paddock & Teams · 81 jobs to go** — the "Still to go" chips with each reference's missing-job icons
   (this reference highlighted), then **Nearest still to go**: the three closest references with work left, by the pins on
   the record, in metres (with the area when it is another one) and their missing jobs. "Area finished hh:mm" when done.
4. **Show every area (view only)** — brings the Not done yet card and every area, as on the manager's view.

The sticky header keeps the area's three job rings over all of it. Footer v11.26 → v11.27. Nothing else changes.

## Files

- `patch_v1127.py` — requires the live v11.26 page by SHA-256. Replaces the saved view and the close attempt, adds the
  status-page style, footer. Exposes `window.SvcSaved1127(ref)` so the page can be rendered in the checks.
- `tests/test_v1127.cjs` — desktop and phone: the template never closes its window; the status page for PG01 (Saved, the
  three missing jobs with icons, percentages, Back, what was done with its three jobs, the area with 81 to go and 14
  references with icons, three nearest in rising metres with their missing jobs, Show every area); record unchanged, no
  errors, no writes. `test_v1126.cjs`, `test_v1125.cjs` and `test_v1123.cjs` run on the same page as regressions.
- `tracker_card_check.cjs` — also presses Save & close on the TEST card's clean code (no tap made, nothing is sent) and
  requires the status page and the card still open.

## Checks

Applied to a copy of the live v11.26 page first; the live build is byte-identical (`26534688…`, 21,145,787 bytes). Toolchain
PASS. `tests/test_v1127.cjs` desktop 9/9 and phone 9/9; regressions `test_v1126.cjs` 10/10 and `test_v1123.cjs` 11/11;
`test_v1125.cjs` 10/13 (its bounding-box sizes read mid-breath, as noted in v11.26); sweeps desktop + phone 25 tabs / 7
hashes / Back, 0 errors, 0 blocked writes. On the live page 9/9. The TEST tracker was republished (01:14 AEST, 23 Oct) and
then, on Andrew's word ("Currently i see this", the old event card), the **EVENT tracker** (01:15 AEST): one POST
/api/cards each, the page's own confirms answered, contact from the service, "saved and read back", printed codes and
ticks unchanged. `tracker_card_check.cjs test PG01` and `event PG01`: CARD OK — Save & close pressed on the clean code
with no tap made (nothing sent): the card stays open on the status page ("Saved", "PG01 still needs …", what was done,
14 still to go in the area, nearest PG03 same spot / PG05 same spot / T0176 9 m, Back to PG01); the event card's view
reads the real night (52 of 752 jobs done, 72 of 75 references still to go). Evidence in `evidence/`.
