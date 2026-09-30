# v7.54 — Every branch shows its rehire (READY TO UPLOAD — built and tested, not live)

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct: "Make sure all branches show subhired. KINP you have subhired at 1400 — what about all the Event
Portables portaloos?"

## What was wrong

The v7.52 branch table's Sub-hired cell read only the SUB flag the rental system puts on a contract line. That is two
lines on the whole job: a refrigerated container on KINP (supplier ROY002, $1,428 — the "1400") and a forklift
attachment on MEAD (QUE011, $9.30). The Event Portables toilets were on no branch row, because the rental system
books every toilet line on KINP's contract 9968955 as KINP fleet. Yet the page's own rule since v5.83 — the toilets
stream, "Event Portables rehire — revenue at our rates · rehire cost, paid to Event Portables" — treats every toilet
line as the Event Portables rehire: charged to the V8s at Coates's rates as if the gear were ours, with Event
Portables paid for it. The branch table and the stream disagreed. Now they say the same thing.

## What it does

The column is now **Sub-hired · rehire**, and every branch row carries it:

- **KINP** — Rehire · Event Portables · 132 toilet lines · 251 units · **$69,092** at our rates; + servicing $85,102 at
  the card (on no contract line); rehire cost $118,575 approved — shown, not added; 31 lines carry a Coates plant
  number · 4 locations marked Event Portables gear on the page (WC41, WC42, WC43, WC81); then its 1 SUB line the
  rental system books · $1,428 · ROY002 · cost not on record.
- **NVAC** — Rehire · plant · 1 line · **$12,063** at our rates: the 5 t forklift with 1.8 m tynes Andrew marked as
  hired in on 12 Sep ("a second forklift was delivered — a subhired forklift with tynes"); supplier and cost not on
  the record. Andrew, 1 Oct: "some forklifts are subhired" — the plant a person marks as hired in (`subhired_machine`)
  counts as rehire on the branch's contracts, the same as the toilets.
- **MEAD** — 1 SUB line the rental system books · $9 · QUE011 · cost not on record. Its two forklifts (2.5 t, 5 t) carry
  Coates asset numbers and no mark, so they stay Coates fleet until someone marks them.
- **STPS** — none.
- **The contracts** — Rehire 132 toilet lines · $69,092 · Rehire 1 plant line · $12,063 · 2 SUB lines · $1,437.

The branch totals do not move ($277,015.74, the contracts line to the cent): the toilet lines were always in KINP's
hire by the rate. The cost is shown beside the revenue and never added to it (Andrew's words: Rehire Revenue, Rehire
cost; never "sub-hire partners"). The record does not say which unit is whose — the 31 Coates plant numbers and the 4
marked locations are stated as facts, not turned into a split.

Build: `toolchain/build.sh v7.54 v7.52_the_pl_as_management_read_it_DRAFT/patch_v752.py
v7.54_every_branch_shows_its_rehire_DRAFT/patch_v754.py` — v7.54 needs v7.52 applied first (it edits pl752Rows and the
branch table). Build 8,460,174 bytes; `check_page.py` PASS.

## Checks (evidence/)

- `practice_tests.js` → `practice_results.json`: branch total 277,015.74 = contracts 277,015.74; KINP rehire 132 lines,
  251 units, $69,092.26 = the toilet lines on the record (132 / 251 / $69,092.26); servicing 85,101.75 and rehire cost
  118,575 as moneySummary holds them; toilets stream charge 154,194.01 = 69,092.26 + 85,101.75; NVAC plant rehire 1
  line $12,062.70 = the one `subhired_machine` line on the record; every row carries the cell; 0 page errors desktop
  and phone; no sideways scroll on the phone.
- `shot754_by_branch.png`, `shot754_by_branch_phone.png`.
- Sweeps on the final build: `sweep_desktop.txt`, `sweep_phone.txt` — 21 tabs, 0 errors, 0 console.
