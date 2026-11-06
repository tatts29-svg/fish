# v11.53 — The Questions tab closed off where the record and the project manager's notes answer it

Author: Andrew Fisher. Built on live v11.52 `d1fd288a…`. LIVE 23 Oct 2026 12:32 AEST: page
`fe6080b63a31406dfc66d5e6e2722c4a4de538c6d4a4492c71e0254bd5a97a6b` (21,414,214 bytes), guarded page upload, byte for byte;
no media change, no record change. Full entry in STATUS.md.

## Andrew's words, 23 Oct 2026

"can we look at question we should be able to close a lot of this off now.. and finish we need to look at cleaning
everything up".

## What was on the tab, and why

Before: 11 need an answer, 4 pending / later, 41 answered or history, and a warning "Some checks didn't run (current
identity question), so this list may be short".

- The warning was real: the identity check behind "51 locations on site with asset numbers missing" threw on the VMS
  boards, which are identified on the VMS boards tab and are not assets, so the whole check was abandoned and the tab
  fell back to an older count. That older count cannot see the fleet numbers recorded on 39 of those 43 locations (the
  servicing register of 18 Oct was built from record 9704 with every one of them). With the VMS lines skipped, the current
  check runs and the question reads "2 received equipment lines still need fleet numbers": P34 pad chairs (0 of 2) and
  GN24 60 kVA (0 of 1).
- Nine questions were already answered in substance by the project manager's notes of 15 Oct 2026 and the work since;
  the tab kept asking because each closes only on a particular data item (a quote number, a drawing decision). They now
  sit in Answered or history with the decision as their answer, the original wording folded underneath, and the note,
  name and time kept: Advanced's fencing quote (paid on measured dockets, no lump sum), the closure marks (read, and
  drawn on the Fence closures tab), fencing on the record vs the plan (read against the programme; the Fencing tab keeps
  the live comparison), the team-leader rate (inside our cost, no customer line), R30 (the VMS plan governs), R10
  (pick-up 13 Nov on the Baseplan booking), R26 (028 on D024 is the sheet's reference note), R29 (the S04 metres are on
  the dockets), TX03 (one movement each on the delivery dockets).
- Labour cost basis moves to Pending / later while every unpriced person is Coates staff on salary: the cost rate is a
  payroll figure finance supplies; nothing to enter on the page. The three Kyle Gover records without hours are shifts
  not yet worked.
- Contract 9961976 (NVAC) lines 37, 41, 45 and 47 take the project manager's treatment, the way the toilet-block tanks
  and Coates' own use do (`questions1153.js`): 41 and 47 inside the generator card rate; 37 and 45 Pending with no charge
  unless delivered / called off, a treatment that lapses if the contract stops writing them Pending. NVAC has no unpriced
  line left; the P&L no longer counts "3 contract lines with no rate yet".
- "Questions reviewed" reads 23 Oct 2026.

After: 3 need an answer (Alfie Harris's nightly rate on 20 nights; the 2 received lines without fleet numbers; EQ0005
fork extensions 0 of 1 arrived), 2 pending / later (labour cost basis; the transport figures the project manager adds
after delivery), 51 answered or history. No record change.

## Files

- `patch_v1153.py` — requires live v11.52 by SHA-256; six text edits (the identity check skips VMS lines; the review date;
  the four history rows R10, R26, R29, TX03), the block before the `spot1117` script, footer v11.52 → v11.53.
- `questions1153.js` — the block: the 9961976 treatments (wrapping `contractTreatment747` after v11.52's wrapper) and
  the settled questions (wrapping `questionsList` after every other decorator). Handle `window.Questions1153`.
- `tests/test_v1153.cjs` — desktop and phone: the identity check runs with no failed check; the asset-number question
  counts the received units numbered and lists only the lines still short; the nine settled questions are done with
  their notes kept; labour cost basis is later; the four NVAC lines at nought with their treatment and no unrated line;
  Needs an answer at most three; the review date and the handle; the pane's counts and no warning; record unchanged,
  no errors, no writes. Screenshot of the top of the tab.

## Checks

- Dry build on a copy of live v11.52, scrubbed as the build is, check_page PASS; the real build from live byte for
  byte the same (hash in STATUS.md).
- `tests/test_v1153.cjs`: 12/12 desktop and phone on the build (evidence/dry/) and 12/12 desktop and phone on the live page
  after the upload (evidence/live_*_test_v1153.json, screenshots `questions_top_live_*.png`).
- Regressions on the build: v11.52 (not charged here) 16/16 desktop and phone, v11.48 12/12 both, v11.51 10/10 both —
  evidence/dry/regress/.
- Sweeps, desktop and phone, on the build: 27 tabs (19 shown) / 7 hashes / Back, 0 errors, 0 console, 0 blocked writes —
  evidence/dry/sweep_*.json.
