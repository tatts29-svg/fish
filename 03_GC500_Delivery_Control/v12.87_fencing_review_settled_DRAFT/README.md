# v12.87 — fencing reads 100% again (the settled CCB category joins the review)

Author: Andrew Fisher

**READY TO UPLOAD — on Andrew's word only.** Built 3 Nov 2026 from live v12.86
(`92c1a3163ecf76e05e42d47ce4c94c78dea8d60e28d5b506b0cec560c7ce2865`) with the fresh-base guard.
Candidate `8604e0928d0243d0c6fc2cf6d7ccabe2aee1df106b91bdd9df84ea5dabf54f75`, 16,952,614 bytes.

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
did for earlier dockets. It is Codex's held v12.82 draft (`../v12.82_fencing_completion_DRAFT/`), rebuilt on live v12.86 with a
fresh review input; v12.82 was held only until the docket was settled, and is superseded by this release.

- Decision: confirmed, Event. The paper does not name the category; the review keeps the category as recorded and approved.
- Source: `36641.jpg`, sha256 `52e97949ee3372293b0f6c2f885b13ed45d337c84d96bb5ea83b208fcadf3823` (the photo filed on 2 Nov).
- The row carries the docket's exact fingerprint (date, location, quantities, components, note). Any later change to the
  docket, a missing or changed photo, or a duplicate makes it pending again by the page's own check; it never forces 100%.
- Nothing writes to the record. No quantity, category, rate, cost, revenue, month or branch changes.

The review input is private (it holds the record's note): sha256 `12a8dc3c6c6433de53cea4b86c47a9d4d360f22380300e7ee30d9749b7b38dea`,
read from the live record at version 12891.

## What changes on the page

| Where | Live v12.86 | v12.87 |
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
FENCING1287_REVIEW_JSON=/private/data_v1287.json toolchain/build.sh v12.87 v12.87_fencing_review_settled_DRAFT/patch_v1287.py
BASE_HTML=build/GC500_v12.87/base_live.html FENCING1287_REVIEW_JSON=/private/data_v1287.json \
  python3 v12.87_fencing_review_settled_DRAFT/tests/test_patch1287.py
PAGE=build/GC500_v12.87/GC500_Delivery_Control_hosted.html STATE=/private/state.json [MOB=1] \
  node v12.87_fencing_review_settled_DRAFT/tests/test_v1287.cjs
```

- `check_page.py`: PASS (224 inline scripts, no keys).
- `test_patch1287.py`: 5/5 (only the one script and the release footer differ from live; refuses a second run, a different base, a
  missing or altered input).
- `test_v1287.cjs` on record 12891: 30/30 on the phone and 30/30 on desktop. It covers fencing 100% with all lights; the
  original range reproduced without the row; the programme gap kept in the completion detail; days before race weekend unchanged;
  every docket, the programme, the P&L pack and the money models byte-identical; each stale, missing, changed-photo and duplicate
  guard; the progress index at 100%. No page errors, no console errors, no record writes.
- `toolchain/harness/sweep.js`: 27 tabs plus the deep links and Back, desktop and phone. No errors, no console errors, no writes.
  The same 10 tabs are hidden as on live, and only Today, Progress, Fencing, Timeline and Questions text differ (as in the table).
- Phone pictures of the Today blocks before and after: checked, private.
