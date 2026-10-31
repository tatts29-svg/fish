# v12.18 — the P&L tidy: Advanced's $195 collection in the fencing cost, and the P&L card's fencing wording

Author: Andrew Fisher. 25 Oct 2026. **LIVE 15:36 AEST**: the view link serves `677b41fce24fafdc1795259a272b4770c5d719e1dd2b3be245909ee484d0b4d4` byte for byte (15,352,474 bytes); `tests/test_v1218.cjs` 14/14 against the live page (`evidence/test_live.txt`).

Andrew (Claude's chat): "is there anything we cqan clean up here" (the Whole-job P&L card), then "can codex help with anything we need to clean things up and make sure P&L is correct and align things into the correct cost area and close off as much as possible to the cent". The non-fencing P&L audit, the branch tie-out and the close-off list went to Codex on PR #1 (comment 6393892195).

## What changes
- **The $195 collection is in what we pay Advanced** (`pl1218_src.js`).
  - Rule: an Advanced order outside the programme weeks with a receipt ID counts at its amount in the fencing cost, on Rehire (2126) with their gear.
  - The order: 4658850, receipt 4922343, their invoice 93920, a partial collection, $195. It sat outside the weeks, so no docket and no week's order carried it.
  - The fencing cost is now $244,368.20 (gear $234,118.20).
  - P&L Rehire cost and Total Direct Costs go up $195. The job difference and the branch view go down $195.
  - The receipted-order words name it.
- **The P&L's Rehire basis** says the orders have "Advanced's sheet matched to the cent", not that they are invoiced. Weeks 1–3 have no receipt yet.
- **The card's right-hand column** is "Of which · fencing demob still to come", and the card line says Advanced's relocation and removal hours are not priced yet.
- **The Coates wages row** reads "1,471.5 h · hours only, not priced".
- **Footer:** v12.17 → v12.18.

## What doesn't change
- The charge to the V8s: $340,871.73. The invoice-based charge is a separate release, on Andrew's go.
- Any docket's charge or pay, and the papers' quantities.
- Today, progress and the area metres.
- The record.

## Checks
- `tests/test_v1218.cjs` (base = live v12.17, side by side): 14/14 on desktop and 14/14 on phone.
- `toolchain/check_page.py`: PASS.
- Both full sweeps: 27 tabs and 7 deep links, 0 errors, 0 console messages, 0 record writes (`evidence/sweeps.json`).
- Phone screenshots: `evidence/phone_pl_card_top.png` and `evidence/phone_pl_card_wages.png`.

Build: `toolchain/build.sh v12.18 v12.18_pl_tidy_LIVE/patch_v1218.py`, on live v12.17 `1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5` → `677b41fce24fafdc1795259a272b4770c5d719e1dd2b3be245909ee484d0b4d4`, 15,352,474 bytes.
