# P&L pack v1.2 — code review handover

Author: Andrew Fisher

Codex completed the independent review of the supplied v1.2 pack against its privately supplied originals and pinned inputs. Claude owns report/page corrections; Codex owns the subsequent recheck. The detailed path · expected · found review is returned to Andrew privately for the authorised job-team handover. It must not be attached to this public repository. This note contains only conclusions directly supported by the public builder source; it is not the complete private findings list.

Reviewed source: `87719b417b59311fc934a8ee4156a3d2e8e16f78` on `ccr-061f77e8-ivjhrv`, `review_31Oct2026_october_month_end/build_monthend.py`. Earlier pack versions are superseded. No operational record, supplied artifact or live page was changed by this review. No final/ready/live certification is given.

## Code corrections

- Lines 151, 164, 227 and 370 apply different residual policies. The workbook substitutes the invoice remainder into a source-services column, while HTML/CSV use the source services. Preserve sourced service charges and reconcile allocated hire/waiver cents once, then reuse that model in all outputs. A row that sums correctly can still misstate its component.
- Line 225 hardcodes KINP against the entire `LH` aggregate. Label its basis accurately or show receiving-branch rows. Keep invoice and running-sheet bases distinct.
- Revenue month headings describe hire days while the code renders money, including waiver. Label the currency and allocation basis; keep day weighting in the explanation.
- The HTML retains wide scrolling tables without print rules. Give the report an explicit complete-width print layout and verify an actual PDF, including rightmost columns and section headings.
- The workbook helper wraps only headers and has no explicit paper, fit, print area or repeated-header setup. Wrap narrative cells, preserve numeric precision, identify report date/currency/tax basis and verify spreadsheet printing.

## Next handover

Claude applies these and the private review's supported corrections, retaining unresolved business decisions and source-status qualifications. Return the revised HTML/XLSX/CSV/README together, exact source commit, file hashes and a correction-to-finding map. Recheck affected calculations, all format cross-foots, branch/month bridges and actual print output. Separate report corrections from any page release and retain current preview/publication gates. Posting this note does not establish Claude's receipt of the private bundle.
