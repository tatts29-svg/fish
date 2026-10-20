# v8.07 — Finish Today opening and card spacing

Author: Andrew Fisher · 2 Oct 2026 · LIVE · 2 Oct 2026 17:02 AEST.

Integrates the exact Today patch marked READY at source commit
`9deab91f9c4e9d9341e060de2d4343a6a0968d32`. Today shares its money-summary calculation,
draws the folded By branch and On site sections when opened, and places the existing
desktop cards more evenly. Phone stays in one column; paper keeps its original layout.
No deduplication preview or new component design is included.

The imported `v7.99_today_faster_fuller_LIVE/patch_v799.py` is unchanged.
The imported README remains as supplied; its publication status is recorded in that folder’s `PUBLICATION.md`. Its last
source change was commit `9deab91f9c4e9d9341e060de2d4343a6a0968d32`; SHA-256
`32020bcb82d59748dbaa0d4e5b8354464bf696da0a8d301b39ac1368b2f8d384`.
The source owner's latest accepted build was `d49ccddc7b395ba5daab9603d99b115bfe7c256a5d19b82c33fc7fb820a5d512`
on v8.03. This includes the synchronous draw when jumping into an unfinished fold. Those earlier results are provenance, not verification of this release.
Only that folder's source, test scripts and README were imported. Other agents'
claims and historical result files were not imported.

## Build

Historical build command from `03_GC500_Delivery_Control`, when v8.06 was live:

```sh
bash toolchain/build.sh v8.07 v8.07_today_finish_LIVE/patch_v807.py
```

The wrapper checks the exact imported source hash, the v8.06 release marker and
existing phone, CW2, Wednesday booking and Equipment components. It runs the
unchanged source patch on a temporary copy, then changes only the release marker
to v8.07. A failed guard leaves the input untouched.

## Verified candidate

Fresh live v8.06 base:
`eaf5182106015aa68c06452493c208f6ca9551b7f164d56089e343920b9dc8f9`,
9,091,870 bytes. Final v8.07 candidate:
`35024d43405947d59c106e858221f8c40ed9629bcf6b19b1081f87c4da6799ed`,
9,101,458 bytes. `check_page` passes for all eight inline scripts.

Every DATA byte, the v8.06 phone rules, CW2 plan, Wednesday bookings and all
other renderer/extension scripts are unchanged. The candidate is exactly the
frozen source patch plus the v8.07 release marker.

| Check | Result |
|---|---|
| Exact source, preservation and refusal guards | 28/28 |
| Independent source/rebuild, print and immediate-jump review | 31/31 |
| Today, folds, focus, widths and Equipment print isolation | 22/22 desktop; 18/18 phone |
| Immediate jumps with animation frames held, seven financial tabs, real PDFs and normal captures | 32/32 |
| Navigation regression suite | 21/21 |
| Packed Today standing suite | 20/20 desktop; 14/14 phone |
| Equipment standing suite | 22/22 desktop and phone |
| Driver/location rules | 45/45 |
| Fresh after a save | 11/11 |
| Final navigation sweeps | 21 tabs and seven links each; zero page, console or navigation errors |

All seven financial tab line multisets match the fresh base, including repeated
line counts. Eight actual PDF captures preserve page counts and words: Ctrl+P
and A4 report with folds open and closed. Only labelled countdown, live-clock
and last-confirmed times are excluded from sequential PDF text comparison;
booking times, dates and all figures remain compared.

The suites use the read-only service harness. Simulated-save checks remain in
their test page; service writes are blocked. Screenshots, full PDF pages and raw
record-derived test detail stay private. Final image manifests bind each image
to the exact candidate. The release owner and implementing reviewer inspected
desktop and phone views; the independent CPU review makes no visual claim.

## Measured improvement and remaining limits

At 1,440 px on this host, normal By group empty card area falls from **19.1% to
11.2%**, and the closed Today pane shortens from **3,906 to 3,798 px**. Normal
first-open **By branch remains 33.2% empty and 944 px high**. The source owner's
15.5% branch result was not reproduced here. That remains a layout follow-up;
this release is not described as meeting every spacing target or as 10/10.

One paired six-sample run measured Today opening at **253.6 → 204.7 ms** median.
Equipment measured **90.5 → 101.3 ms** although its renderer is unchanged. These
are single-host diagnostics, with run-to-run noise; no broad performance or
physical-phone frame-rate guarantee is made. No deduplication proposal is part
of this release.

`evidence/source_import.json` binds every imported source/test file to the READY
commit. Current validation results are recorded separately in this folder.

The first integration candidate `d547c81a…` used the earlier READY source and was
superseded before publication when the source owner supplied the jump correction.
Its checks are retained privately and are not evidence for the replacement candidate.

## Publication

Published 2 Oct 2026 at 17:02 AEST. The uploader received HTTP200 and the public
view served the exact tested35024d43… page. `evidence/release_verification.json`
independently confirms matching public bytes, every operational collection and
shared record3538 unchanged. Source folders are now named LIVE; the wrapper and
local harness paths were updated after publication, without changing page bytes.
The strict v8.06 guard intentionally prevents applying this release again to live
v8.07. Offline replay uses the retained `build/GC500_v8.07/base_live.html` base.
