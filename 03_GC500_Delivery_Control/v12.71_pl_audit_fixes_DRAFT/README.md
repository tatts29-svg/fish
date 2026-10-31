# v12.71 — the P&L tab: the independent audit's findings taken forward (DRAFT, not uploaded)

Author: Andrew Fisher. Built 31 Oct 2026 11:3x AEST on the live v12.69 (`038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`).
Candidate `c6b6bb015bdb78738625aab55dcfdb4aa2c0775735bb7efde84e79f9f0d0177e`, 16,551,091 bytes. **Not uploaded.** Previews go to
Andrew first; upload only on his word. Codex is asked to re-audit this candidate independently before then.

Why: the independent read-only audit of the live P&L (`review_31Oct2026_pl_independent/`, on Andrew's word "Codex needs to be
doing the audit i approve") passed its 175 arithmetic checks and named three things to fix before the P&L goes to management,
and a few to improve. Andrew, 31 Oct 2026: "Work with codex on audit on p&l" · "Talk to codex lets get this right" · "I want you
both to work on p&l".

## What changes

| Audit item | v12.71 |
|---|---|
| 1. The Costs & P&L Print button printed the twin-steer refusal page and nothing else | The print flag the print stylesheet reads is set whenever a print is allowed: on load, before every print the page starts (the Print buttons, Ctrl+P, the browser's own menu) and again after a print closes. The rule down the edge of every printed page stays; after a checklist print it goes back to the rule alone, so a later print never carries that checklist's name. Nothing asks the question v11.35 switched off. |
| (found while fixing 1) The only Print button sat inside the closed Workings fold | Print is on the face too, beside the P&L heading; it runs the tab's own print (A4 landscape). |
| 2. The small print rounded parts to the dollar | The transport split by branch and the sub-hire suppliers' estimates say cents. |
| 3. Management and invoicing branch bases | The cards are named the management view. Under them: Finance's invoicing view (the handover's own figures: revenue by the branch on the hire contracts, costs by its own split), the two moves that bridge it to the cards (event labour revenue to KINP; travel, accommodation and meals to KINP), and the difference both ways, branch by branch, with a tick that it foots to the cent. No branch attribution changes; the handover and its CSV keep the contract branches. |
| Should: an estimate cue beside the headline costs | One line under the cost table: what inside "so far" is carried at quotes or estimates, in the lines' own words, and what job end adds as forecast. |
| Should: phone density | The bridge keeps its labels and figures on a phone and leaves its small print to the desktop and the paper. The cost table's notes were checked at phone width and left as they are. |
| Should: cents-exact branch tests | The tests compare every branch, both views and the bridge, to the cent, against the handover's own rows. |

Unchanged: every model and figure, the three tiles, So far with Job end under it, labour hire in the difference once, Transport as
its own row, the folds and every old card. Nothing is typed; nothing is written to the record.

## Figures on the candidate (record 12600, as at Sat 31 Oct 2026, job end)

| Branch | Finance's invoicing view: charged · costs | Moves to KINP: revenue · costs | Management view: charged · costs · difference |
|---|---|---|---|
| KINP | 447,476.68 · 224,655.72 | +30,520.54 · +2,843.89 | 477,997.22 · 227,499.61 · 250,497.61 |
| STPS | 494,289.09 · 301,605.88 | −25,109.07 · −1,895.93 | 469,180.02 · 299,709.95 · 169,470.07 |
| NVAC | 49,683.51 · 9,313.78 | −5,411.47 · — | 44,272.04 · 9,313.78 · 34,958.26 |
| MEAD | 27,429.95 · 2,185.19 | — · −947.96 | 27,429.95 · 1,237.23 · 26,192.72 |
| The job | 1,018,879.23 · 537,760.57 | nil · nil | 1,018,879.23 · 537,760.57 · 481,118.66 |

## Files

- `patch_v1271.py` — in place on the live v12.69 (BASE pinned): the twin-steer module's print flag (every anchor asserted once),
  the pl1267 style and script replaced whole (ids kept), footer v12.69 → v12.71.
- `pl1267_src.js`, `pl1267.css` — the face with the bridge, the cue, cents in the small print, Print on the face, the print layout.
- `tests/test_v1271.cjs` — on the real tab, reading the live record, writing nothing: 72 checks, desktop and phone, including every
  branch of both views and the bridge to the cent against the handover's rows.
- `tests/print_v1271.cjs` — the face's Print, the Workings' Print and Ctrl+P through to the PDF: 26 checks. The browser's print is
  stood in for by a recorder installed before the page's scripts, so the button's own code sets the page up for paper and the PDF
  is made from that exact state.
- `tests/shoot_v1271.cjs` — the face pictures, desktop and phone.
- `evidence/` — the tests, the two PDFs and their page pictures, the face pictures, both sweeps, and `before_live_v1269/` (the
  live page's print today: the refusal page only).

## Checks

- `toolchain/build.sh v12.71 v12.71_pl_audit_fixes_DRAFT/patch_v1271.py`: 222 inline scripts, check_page PASS.
- `tests/test_v1271.cjs`: desktop 72/72, phone 72/72. `tests/print_v1271.cjs`: 26/26 (both PDFs four landscape pages, the rule on
  every page, no word of the refusal page).
- Before: the same Print on the live v12.69 gives a one-page PDF of the refusal page and no figure (`evidence/before_live_v1269/`).
- `toolchain/harness/sweep.js`: desktop and phone, 27 tabs, the same ten routes as v12.69 draw no pane of their own, 0 errors,
  0 console, 0 writes (`evidence/sweep_*.json`). A desktop run made while Codex's checks were using the browser at the same time
  caught Today and Progress still loading (`evidence/sweep_desktop_contended.json`); run on its own it is clean.
- Codex's independent pack (`review_31Oct2026_pl_independent/tests/`), run here on the candidate on one frozen snapshot (record
  12600, state SHA-256 `dc92ee7b…`, kept private): capture PASS on the live v12.69 and on the candidate; `verify_cents.py` with the
  same-snapshot baseline **258/258** (no existing figure moved); `verify_presentation.cjs` **24/24 desktop, 24/24 phone**, the real
  `#printCosts` through to the PDF. It first ran 23/24: the PDF's text read the letter-spaced heading as "AU D E X G S T"; the
  eyebrows are now tight on paper and read "AUD EX GST · AS AT SAT 31 OCT 2026". Codex runs the pack independently as well.

## Open

- The transport row's split by branch adds to the row's job-end figure, not its so-far figure, and the note does not say so.
  It will read "job end by branch" in the next rebuild, together with whatever Codex's independent run finds (PR #1, 6537380904).
- Codex's independent run of his pack on this exact source, his look at the printed pages and the phone face, and his view on the
  Finance semantics (finding 3). Then the previews to Andrew; upload only on his word.
