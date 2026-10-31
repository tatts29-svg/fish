# v12.42.5: the P&L on Andrew's Baseplan (8) answers — LIVE

Author: Andrew Fisher · 27 Oct 2026 · on live v12.42.4 (`20c09785…`). Candidate sha256 `318de672389be59015d1b3f6fb99de6a0837628fca49b384410aeca69ae022b6`, check_page PASS.
**LIVE 27 Oct 2026 22:46 AEST** (sha256 318de672…, 15,821,895 bytes; upload proved byte for byte, fresh fetch matched with cmp). The live page reads the same P&L lines as the candidate (`evidence/pl_live_v12425.json`), no page errors.

Andrew's answers, 27 Oct 2026: "Coates own use equipment no charge"; water "Is part of the pump out charges"; accommodation
"$27,700 is this years cost. They haven't updated".

| P&L line (job) | Live v12.42.4 | v12.42.5 | Change | Why |
|---|---|---|---|---|
| 1005 Hire Revenue | $227,506.66 | $198,834.84 | −$28,671.82 | Coates forklifts on 9961976 (lines 21, 25, 26, 27, 31, 34, 35) own use |
| 1030 · 1031 Transport | $152,130.34 | $147,130.34 | −$5,000.00 | the forklift references' transport legs |
| 1032 Toilet Pumpouts | $80,585.79 | $70,985.79 | −$9,600.00 | water truck and pre-fill no longer added |
| 1020 Consumables | $4,350.00 | $0.00 | −$4,350.00 | water deliveries and tank no longer added |
| Accommodation and travel | $19,101.60 | $27,700.00 | +$8,598.40 | this year's cost |
| **Total revenue** | | | **−$39,023.42** | |

NVAC branch total $82,995.19 → $49,323.37. Page loads with no errors; footer v12.42.5. `patch_v12425.py`, `money_probe.cjs`, `evidence/`.
