# v12.89 — fencing reads 100% again (the settled CCB category joins the review)

Author: Andrew Fisher

**LIVE 3 Nov 2026 12:34 AEST**, on Andrew's word ("ok and approval to upload too"). Built first as v12.87 on live v12.86 (`8604e092…`); Codex's v12.88 map footprints went live before the upload, so it was rebuilt on live v12.88 (`d348e813db15b3ed3df125e14dd877597cbd8b410a4c13440c64244a86f85c37`) with the fresh-base guard and renumbered v12.89. Live page `89993cbd62c29f0a28b3dc5edc4365e8baab03a0af4858633441acc6faacab40`, 16,958,973 bytes: the upload's own read-back and a separate public GET both matched every byte. Record 12891 before and after.

## Why

Andrew, 3 Nov 2026, with two phone screenshots of the Today tab: "We need to.fix this please". The Fencing card read
99.29–99.42 %, Recorded 20,098.5–20,123.5 m and Left 117.5–142.5 m (the ranges wrapping on the phone), and Where we are read
"≥ 99.89 % · At least · Provisional: Fencing".

The cause is one docket. Hire agreement 36641 (F-AF-0082, Gate 1, 21 Oct, CCB 25 m, recorded as Event on 2 Nov) has no row in the
CCB source-review catalogue (`DATA.fence_ccb_review847`), so the page treated its 25 m as "Event or Demarcation". That kept a
range on the CCB rows, and the build-complete rule (v11.81, 24 Oct) skips a row that carries a range, so Demarcation stayed short
of its programme line. Andrew settled the docket on 3 Nov 2026 ("i approve the docket add in"; STATUS RULING); it stays as
recorded, Event.

## What it does

One script at the end of the page adds that docket's review row and its photo's checksum to the catalogue, as v11.63 and v11.81
did for earlier dockets. It is Codex's held v12.82 draft (`../v12.82_fencing_completion_DRAFT/`), rebuilt with a
fresh review input (then onto live v12.88); v12.82 was held only until the docket was settled, and is superseded by this release.

- Decision: confirmed, Event. The paper does not name the category; the review keeps the category as recorded and approved.
- Source: `36641.jpg`, sha256 `52e97949ee3372293b0f6c2f885b13ed45d337c84d96bb5ea83b208fcadf3823` (the photo filed on 2 Nov).
- The row carries the docket's exact fingerprint (date, location, quantities, components, note). Any later change to the
  docket, a missing or changed photo, or a duplicate makes it pending again by the page's own check; it never forces 100%.
- Nothing writes to the record. No quantity, category, rate, cost, revenue, month or branch changes.

The review input is private (it holds the record's note): sha256 `12a8dc3c6c6433de53cea4b86c47a9d4d360f22380300e7ee30d9749b7b38dea`,
read from the live record at version 12891.

## What changes on the page

| Where | Before (v12.86/v12.88) | v12.89 |
| --- | --- | --- |
| Today · Where we are | ≥ 99.89 % · At least · Provisional: Fencing | 100 % |
| Today · Fencing | 99.29–99.42 %, Recorded 20,098.5–20,123.5 m, Left 117.5–142.5 m | 100 %, Build complete at the docket numbers, Recorded 20,098.5 m, Left 0 m |
| Progress · Crowd control event | 2,195–2,220 | 2,220 |
| Progress · Crowd control demarcation | 5,062.5–5,087.5, 142.5 left of 5,205 | 5,062.5, 0 left (programme 5,205 kept in the completion detail) |
| Timeline | ≥99.89% | 100% |
| Questions | 5 need an answer (Fencing: confirm event or demarcation) | 4 need an answer; that item moves to answered |

Every other tab reads the same.

## Build and checks

From `03_GC500_Delivery_Control`:

```sh
FENCING1289_REVIEW_JSON=/private/data_v1287.json toolchain/build.sh v12.89 v12.89_fencing_review_settled_LIVE/patch_v1289.py
BASE_HTML=build/GC500_v12.89/base_live.html FENCING1289_REVIEW_JSON=/private/data_v1287.json \
  python3 v12.89_fencing_review_settled_LIVE/tests/test_patch1289.py
PAGE=build/GC500_v12.89/GC500_Delivery_Control_hosted.html STATE=/private/state.json [MOB=1] \
  node v12.89_fencing_review_settled_LIVE/tests/test_v1289.cjs
```

- `check_page.py`: PASS (224 inline scripts, no keys).
- `test_patch1289.py`: 5/5 (on v12.86 for v12.87, and again on v12.88) (only the one script and the release footer differ from live; refuses a second run, a different base, a
  missing or altered input).
- `test_v1289.cjs` on record 12891: 30/30 (v12.87 and v12.89 candidates, and the live page after upload, unpinned) on the phone and 30/30 on desktop. It covers fencing 100% with all lights; the
  original range reproduced without the row; the programme gap kept in the completion detail; days before race weekend unchanged;
  every docket, the programme, the P&L pack and the money models byte-identical; each stale, missing, changed-photo and duplicate
  guard; the progress index at 100%. No page errors, no console errors, no record writes.
- `toolchain/harness/sweep.js` (v12.87 and v12.89 candidates): 27 tabs plus the deep links and Back, desktop and phone. No errors, no console errors, no writes.
  The same 10 tabs are hidden as on live, and only Today, Progress, Fencing, Timeline and Questions text differ (as in the table).
- Phone pictures of the Today blocks before and after: checked, private.
