# v12.71 — the P&L tab: the independent audit's findings taken forward (DRAFT, not uploaded)

Author: Andrew Fisher. Built 31 Oct 2026 on the live v12.69 (`038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`).
Candidate **`b019bb96464fdea89f4d4a47824849e561a7ec54f5ea9027e72a243d15c84b9c`**, 16,550,929 bytes, the third candidate: Codex's
independent review of the first (`c6b6bb01…`) passed it and asked for small corrections, made in the second (`b3cd424e…`); this one
adds Andrew's ruling of 31 Oct 2026 that revenue stays on the branch that invoices it. **Not uploaded.** Previews go to Andrew first;
upload only on his word.

Why: the independent read-only audit of the live P&L (`review_31Oct2026_pl_independent/`, on Andrew's word "Codex needs to be
doing the audit i approve") passed its 175 arithmetic checks and named three things to fix before the P&L goes to management,
and a few to improve. Andrew, 31 Oct 2026: "Work with codex on audit on p&l" · "Talk to codex lets get this right" · "I want you
both to work on p&l" · "Work with codex where we at" · "Things stay in the branch. But we can align labour to correct branch costs if that
makes sense". Claude implements and holds the preview and publication gate; Codex verifies
independently (PR #1, 6537082762).

## What changes

| Audit item | v12.71 |
|---|---|
| 1. The Costs & P&L Print button printed the twin-steer refusal page and nothing else | The print flag the print stylesheet reads is set whenever a print is allowed: on load, before every print the page starts (the Print buttons, Ctrl+P, the browser's own menu) and again after a print closes. The rule down the edge of every printed page stays; after a checklist print it goes back to the rule alone, so a later print never carries that checklist's name. Nothing asks the question v11.35 switched off. |
| (found while fixing 1) The only Print button sat inside the closed Workings fold | Print is on the face too, beside the P&L heading; it runs the tab's own print (A4 landscape). |
| 2. The small print rounded parts to the dollar | The face's small print says cents, and so does the Finance handover card (every figure in `fh866Html` through `money`, not `money0`; categories, hours and branches unchanged). The transport split says it is the job-end figure ("job end by branch"), and its parts add to that figure to the cent. |
| 3. Management and invoicing branch bases | The cards, and the folded branch table under Finance's lines, are named the management view. Under the cards: Finance's invoicing view (the handover's own figures: revenue by the branch on the hire contracts, costs by its own split), the move that bridges it to the cards, and the difference both ways, branch by branch, with a tick that it foots to the cent. Revenue is the same in both views: it stays on the branch that invoices it (Andrew, 31 Oct 2026: "Things stay in the branch"), so the people's event labour revenue is no longer moved to KINP. The one move is a cost move: the people's travel, accommodation and meals to KINP, his ruling of 29 Oct 2026. No branch attribution changes; the handover and its CSV keep the contract branches, which Codex's review confirms is right. |
| Should: an estimate cue beside the headline costs | One line under the cost table: what inside "so far" is carried at quotes or estimates, in the lines' own words, and what job end adds as forecast. The "not a margin until the costs are complete" qualification stays on the face. |
| Should: phone density | The bridge keeps its labels and figures on a phone and leaves its small print to the desktop and the paper. The cost table's notes were checked at phone width and left as they are. |
| Should: cents-exact branch tests | The tests compare every branch, both views and the bridge, to the cent, against the handover's own rows. |
| Polish (Codex's review) | The page's print note says "printed" where it said "asset map printed" on every print, the P&L included. |

Unchanged: every model and figure, the three tiles, So far with Job end under it, labour hire in the difference once, Transport as
its own row, the folds and every old card. Nothing is typed; nothing is written to the record.

## Figures on the candidate (record 12600, as at Sat 31 Oct 2026, job end)

| Branch | Finance's invoicing view: charged · costs | Moves to KINP: revenue · costs | Management view: charged · costs · difference |
|---|---|---|---|
| KINP | 447,476.68 · 224,655.72 | — · +2,843.89 | 447,476.68 · 227,499.61 · 219,977.07 |
| STPS | 494,289.09 · 301,605.88 | — · −1,895.93 | 494,289.09 · 299,709.95 · 194,579.14 |
| NVAC | 49,683.51 · 9,313.78 | — · — | 49,683.51 · 9,313.78 · 40,369.73 |
| MEAD | 27,429.95 · 2,185.19 | — · −947.96 | 27,429.95 · 1,237.23 · 26,192.72 |
| The job | 1,018,879.23 · 537,760.57 | nil · nil | 1,018,879.23 · 537,760.57 · 481,118.66 |

## Files

- `patch_v1271.py` — in place on the live v12.69 (BASE pinned): the twin-steer module's print flag (every anchor asserted once),
  the Finance handover card's cents (all 20 figures, asserted), the print note, the pl1267 style and script replaced whole (ids
  kept), footer v12.69 → v12.71.
- `pl1267_src.js`, `pl1267.css` — the face with the bridge, the cue, cents in the small print, Print on the face, the print layout.
- `tests/test_v1271.cjs` — on the real tab, reading the live record, writing nothing: 78 checks, desktop and phone, including every
  branch of both views and the bridge to the cent against the handover's rows, which move is a ruling and which an allocation,
  the transport split's period, and the handover card's cents.
- `tests/print_v1271.cjs` — the face's Print, the Workings' Print and Ctrl+P through to the PDF: 28 checks. The browser's print is
  stood in for by a recorder installed before the page's scripts, so the button's own code sets the page up for paper and the PDF
  is made from that exact state.
- `tests/shoot_v1271.cjs` — the face pictures, desktop and phone.
- `evidence/` — the tests, the two PDFs and their page pictures, the face pictures, both sweeps, and `before_live_v1269/` (the
  live page's print today: the refusal page only).

## Checks on the candidate

- `toolchain/build.sh v12.71 v12.71_pl_audit_fixes_DRAFT/patch_v1271.py`: 222 inline scripts, check_page PASS.
- `tests/test_v1271.cjs`: desktop 78/78, phone 78/78. `tests/print_v1271.cjs`: 28/28 (both PDFs four landscape pages, the rule on
  every page, no word of the refusal page, the basis and headings readable as words, the print note's new word).
- Before: the same Print on the live v12.69 gives a one-page PDF of the refusal page and no figure (`evidence/before_live_v1269/`).
- `toolchain/harness/sweep.js`: desktop and phone, 27 tabs, the same ten routes as v12.69 draw no pane of their own, 0 errors,
  0 console, 0 writes (`evidence/sweep_*.json`).
- Codex's independent pack (`review_31Oct2026_pl_independent/tests/`), run here on one frozen snapshot (record 12600, state SHA-256
  `dc92ee7b…`, kept private): capture PASS on the live v12.69 and on the candidate; `verify_presentation.cjs` **24/24 desktop,
  24/24 phone**, the real `#printCosts` through to the PDF. `verify_cents.py` still builds the old revenue move into its expected
  figures (its staffing loop moves the event labour revenue to KINP), so on this candidate it fails exactly the six revenue checks
  for KINP, STPS and NVAC, and its v12.69 baseline comparison flags the branch figures that Andrew's ruling changes (250/258). A
  private copy with only that loop switched off, kept outside the repository, passes **245/245**. Codex owns the pack and its
  update; the second candidate (`b3cd424e…`, before the ruling) passed the unmodified pack 258/258.
- Codex's own run on the first candidate (`review_31Oct2026_pl_independent/CANDIDATE_v1271.md`): rebuilt to the byte, 258/258,
  the new bridge fields 46/46, 24/24 desktop and phone, the PDF pages looked at and legible. His corrections are the second
  candidate's changes; he rechecks the affected paths on this candidate.

## Open

- Codex's recheck of this candidate's affected paths (PR #1).
- Answered: revenue stays on the branch that invoices it (Andrew, 31 Oct 2026). Before it, the management view moved 30,520.54
  of event labour revenue from STPS and NVAC to KINP; now KINP's difference is 219,977.07 (was 250,497.61), STPS 194,579.14 (was
  169,470.07), NVAC 40,369.73 (was 34,958.26). The tiles and the job total do not change.
- Next, on Andrew's word: labour costs to the branch of the work, shift by shift ("we can align labour to correct branch costs if
  that makes sense"). 103 of the 233 labour rows already name the branch of their work in their notes (the water barriers on
  9972648 STPS, the generators on 9961976 NVAC, the KINP days); 130 do not yet. The priced effect is the labour hire, all on
  KINP today, and with it the people's travel, accommodation and meals if they follow the hours; Coates wages stay in hours. A
  register of every row for Andrew to settle, then a release that charges each branch its labour.
- Optional, left: the printed P&L's last page holds "Not in it yet" alone; fitting it on page 3 would mean shrinking the report.
- Previews to Andrew; upload only on his word.
