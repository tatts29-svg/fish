# v7.52 — The P&L, as management read it (DRAFT: built and tested on the live v7.51, READY TO UPLOAD)

Author: Andrew Fisher · 1 Oct 2026

Andrew: "We need this to look professional, almost like a P&L but in a way it's easy to understand. Does each branch
layout correct? Is the total the whole forecast? Business is wanting to see numbers now."

## What it does

One statement at the head of the Costs tab, **Forecast P&L**, read top to bottom the way a P&L reads and in Andrew's
words (AGENTS.md, "Andrew's business words"):

- **Header:** Revenue · Direct costs known · Difference so far (not a margin yet). As at, AUD ex GST, and the rule
  that every figure traces to a contract line, a card rate, a docket or a quote.
- **Revenue — charged to the V8s.** Hire on the contracts by the rate (including Rehire Revenue and Transport
  Revenue); hire with no contract rate yet, at the card; toilet servicing at our pump-out rates; fencing dockets at
  the 2026 card; event labour (the scope); labour ticked on references; lines with no rate and no card line. Each
  line carries a tag saying where it stands: **ON THE CONTRACTS**, **FROM THE CARD** (an estimate until the branch puts
  a rate on the line), **DOCKETS**, **THE SCOPE**, or **NOT PRICED**. Then **Total revenue** — the forecast.
- **By branch — KINP, STPS, NVAC, MEAD** (full width, under both columns): lines; hire by the rate; hire from the card; Transport Revenue;
  **Sub-hired** (Andrew, 1 Oct: "make sure all branches show sub-hired") — every branch says it: the SUB lines the
  rental system books as sub-hired, their Rehire Revenue and supplier code (KINP: 1 line, $1,428, ROY002; MEAD: 1
  line, $9, QUE011), or **NONE SUB-HIRED** (STPS, NVAC), with "rehire cost not on the record" where it is not; lines
  with no rate; total. Under the table, **Sub-hired on the record, by supplier**: the sub-hired locations recorded on
  the page (Event Portables — WC41, WC42, WC43, WC81), which are locations not contract lines, with where their hire
  and their rehire cost sit. The branch totals add to the contracts line **to the cent** ($277,015.74).
  Lines settled as no separate charge (the six tanks, contract 9968929) are named under their branch.
- **Direct costs — what Coates pays**, against the eight categories management expect, as written, with each
  category's own note; hours-only categories say HOURS ONLY; empty ones say NOT PRICED. Then Total direct costs known,
  and **Difference so far — not a margin yet**.
- **Not in it yet — named, never added:** wages (hours only), unpriced accommodation nights, transport only partly in,
  rehire cost of hired-in plant, provisional figures.
- Footer: author; where the working is. The old "Are we making money?" card (streams, the two-sided ledger, every
  source) folds closed under the statement — nothing removed, everything one tap away. Print keeps the statement and
  drops the fold.

Every figure is `moneySummary()`'s own figure, so the statement and the working can never disagree; a rate typed on
Costs → From the Street Rate Card 2026 changes the statement at once.

## Figures (practice tests on the live record, read only; with v7.50 and v7.51 applied)

| | |
|---|---|
| Revenue (the forecast) | **$555,930** |
| — on the contracts by the rate | $228,580 (263 lines; incl. Rehire Revenue $1,437, Transport Revenue $6,938) |
| — at the card, no contract rate yet | $48,436 (32 lines) |
| — toilet servicing at our pump-out rates | $85,102 |
| — fencing dockets | $120,913 |
| — event labour, the scope | $55,817 |
| — labour ticked | $17,083 |
| Direct costs known | **$235,082** (+ 1,669.5 h wages and 532 h contractors with no rate) |
| Difference so far | **$320,848** — not a margin yet |
| By branch | KINP $138,920 · STPS $81,252 · NVAC $47,292 · MEAD $9,553 = $277,016 |

Checks: statement header shows the working's revenue, costs and difference; branch table adds to the contracts line
to the cent; the fold is closed and the old card still present; 0 page errors desktop (1440) and phone; no sideways
scroll on the phone. Screenshots: `shot752_pl_desktop.png`, `shot752_by_branch.png`, `shot752_pl_phone.png`. Sweeps: `sweep_desktop.txt`,
`sweep_phone.txt`.

Build: `toolchain/build.sh v7.52 v7.52_the_pl_as_management_read_it_DRAFT/patch_v752.py` — v7.50 and v7.51 went live
(Codex, 1 Oct 2026, live page 8,424,347 bytes); the patch needs card748Html and marginCard and refuses to run twice.
