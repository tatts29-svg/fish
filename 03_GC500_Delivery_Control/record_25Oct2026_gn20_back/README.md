# Record: GN20 back on our record as GN20-A, on Andrew's word

Author: Andrew Fisher.
- **Applied:** 25 Oct 2026, in two runs, both VERIFIED:
  - 13:16 AEST, on the live page `91f90060…` (v12.14), record version 10848 → 10865, 17 documents;
  - 13:27 AEST, on the live page `786142f3…` (v12.15), record version 10865 → 10870, 5 documents.
- **Made by:** Andrew Fisher via Claude.
- **Backups:** the whole record before each run is kept private, outside the repo: scratchpad `record_25Oct2026_gn20_back/backup_state_20261025T031644Z.json` and `backup_state_20261025T032723Z.json`.
- **Reports:** `report_20261025T031644Z.json`, `report_20261025T032723Z.json`.

Andrew, 25 Oct 2026:
- "i made a error the gn20 is here sorry" (correcting his "never came to site");
- "its this big one here 350A", "in pink": the big set on drawing D024, callout 020, beside GN21;
- "please add GN20 Back and all costs please add all this data back in".

| | Before | After |
|---|---|---|
| GN20 (S01, 350 kVA, 1276701) | deleted on 20 Oct, in error | stays deleted: the page never re-uses a deleted reference |
| GN20-A | did not exist | **S01 (GN20)**, Generators, 350 kVA, number 1276701, branch NVAC, at D024-26003-02 callout 020; note "Rental 9961976, line 6." |
| GN20-A's dates | — | GN20's own: on site 30 Sep 07:23, complete 30 Sep 12:45, received with it, install ticked 30 Sep 22:40 |
| Today, Generators (progress to Fri 23 Oct) | 14 of 14 before the run; 14 of 15 after run 1 | **15 of 15** |
| EQ0006 (laserplane) | read 0 received | 1 of 1 received and installed |

**How it was done:**
- Through the page's own controls, as an editor would. The runner is `gn20.cjs`: the record runner of `../record_25Oct2026_accessories_laserplane/acc.cjs`, plus:
  - `add_ref` takes the drawing sheet and callout, and checks the link;
  - a `date_back` step;
  - read-only probes of Today's groups and rows, and of the quantity scopes.
- **Run 1** (`gn20_spec.json`):
  - The page's Add form (`addReference`) made GN20-A with GN20's details.
  - Then `setQty` 1, `setLight` on site (dated to GN20's own arrival, as the light step allows), `setSupplied`, `setDone` and the install labour tick.
  - Last, the quantity went to 2 and back to 1. That is the page's own way to take a fresh received/installed baseline after the events. EQ0006 had the same done to it.
- **Run 2** (`gn20_dates_spec.json`):
  - The progress views are cut off at Fri 23 Oct (v11.63). With today's dates, GN20-A read 0 received there.
  - `date_back` gave its complete tick, its receipt and its install tick GN20's own times.
  - The page's quantity scope keeps the receipt day it first saw, so the stored receipt day took the same date.
  - Then the quantity was cleared and set to 1 again, and the page re-captured it.
- Dry runs came first, every write aborted.
- The first `--apply` of run 2 stopped before writing anything: the public page had just changed (v12.15 went up). It was dry-run again on the new page, then applied.
- Each `--apply`:
  - checked the public page's SHA-256;
  - wrote exactly the planned documents, each acknowledged 200;
  - verified every op on the service;
  - checked that every other document is unchanged in value.
- `check_after.cjs` read it back on a fresh load of the live page: Generators 15/15; GN20-A "1 of 1 installed · 1 received", on site, complete, number 1276701, drawing D024-26003-02 020; errors 0, blocked 0.

**What it changes, and what it doesn't:**
- The P&L by branch is unchanged: KINP $241,028.14, NVAC $75,154.36, STPS $41,142.65, MEAD $16,859.02.
  - The page's on-hire rows still leave out 9961976 line 6, taken out in v11.18 as "never came".
  - Putting GN20's hire and costs back is a page change, not a record change. It comes next.
- The page's data still has GN20's asset note as "never came to site". That is a page change too.

The edit key is never printed, logged or stored.
