# GC500 release handover — 18 October 2026

Author: Andrew Fisher

Source branch: `codex/gc500-v10.66-speed-smooth`. Shared coordination remains PR #1. Codex has completed the page release sequence and has staged and inventory-verified the server blob. Andrew explicitly assigned the Railway server switch to Claude; Claude proceeds after the staged-server handover and inventory verification. Posting this handover does not prove Claude has read it.

## Verified live and current publication

| Scope | Verified state | Exact identity |
| --- | --- | --- |
| v10.66 incremental speed | Guarded upload and independent exact public read-back passed, 12:30 AEST | Source `6a338fa959c21de0c1a5188ba7e6f6c38fc46089`; page `9724e2a644833e7b6e56139b7954add2f639e348f03c6b6c9d109e0229cc821a` |
| v10.67 servicing tracker software | Guarded upload and independent exact public read-back passed, 12:34 AEST | Source `10268d4d60e80a80eabfa32e6851d4db012ac7e5`; page `f32b39bcf42637fd246e03c6b64547b9dd203015659b768411e232e77ffcfc86` |
| Server v5.90 | Railway switch and exact running-file identity independently verified; healthy | Source `bbafd3b301097f737ecdae1b61e15ed33795d46b`; server `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec` |
| v10.68 supplier servicing costs | Guarded upload and independent exact public read-back passed, 12:40:03 AEST | Source `ce2272ab7ec33fdf04dfff2aed7107b35e677ad9`; page `851197de50912e51e5715c16d6a21271691593588ebba5bb0a0dd60608374534` |
| v10.69 map pick/label clarity + v10.70 building departure rule + v10.71 fencing evidence | Combined v10.71 guarded publication and independent exact public read-back passed, 12:41:24 AEST; final desktop/phone standard sweeps passed | Source `382d0ee530b9e0191fb594fa6ce860251c6a000f`; live combined page `34a6b81b4f5adc76a46c2d28670d24d1f72e0233092d13dd3445f8b0805b1df2` (18,506,356 bytes) |

The live page releases preserved the shared operational record, machine and protected server inventory. The v10.68 checks cover source reconciliation, 36 synthetic and 14 native cases, desktop/phone financial parity, both standard sweeps and inspected phone presentation, with no operational writes. Customer Revenue and branch attribution remain unchanged. v10.69–71 affected checks preserve map geometry, recorded departure facts, pricing and the installed-fence headline. Their combined final sweep covers 24 tabs, seven exact deep-link destinations and Back on both form factors.

The final upload envelope adds only a non-rendered identity comment. Original browser evidence keeps its original hashes. Exact removal of that comment restores each tested candidate byte-for-byte; see `../v10.67_servicing_tracker_LIVE/tests/envelope_equivalence.json`. v10.68 compact readiness evidence is `../v10.68_servicing_cost_consistency_LIVE/tests/readiness1068.json`. Source documents, detailed operational/financial comparisons and screenshots stay private.

## Immediate next actions

1. Codex completed server v5.91 staging, verified the inventory and retained rollback blobs, and posted the exact deployment handover to Claude in PR #1. Blob staging and inventory verification passed12:42 AEST; exact switch and rollback instructions are posted in PR #1 comment6244841898.
2. Claude performs the Railway switch after that handover and verifies the running file, health, export contract and retained rollback blobs. Codex independently checks the public result where accessible.
3. Continue the five remaining outcomes below. The real servicing rollout remains due before Thu 22 Oct 08:00; the completed software release is not a physical rollout claim.

Server v5.91 export-completeness code is ready: candidate `c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7` (292,090 bytes), based on verified v5.90 `55a19453…`. Native export, legacy-route, tracker, worker and rollback/recovery suites passed 282 checks, with exact rebuild and wrong-base/repeat guards. Its supplemental native-oracle upload-envelope check also passed. **Staging and inventory verification passed; v5.91 is not deployed by this handover.** See `../server_v5.91_export_completeness_DRAFT/DEPLOY_HANDOVER.md` for the deployment sequence; do not prune a staged server blob through a concurrent machine import.

## Completion count and remaining work

This is a count of twelve explicit outcomes, not a weighted estimate of effort or a claim of universal data accuracy.

| # | Outcome | State at this handover |
| --- | --- | --- |
| 1 | Incremental speed release v10.66 live | Done |
| 2 | Full phone performance targets reached | Open |
| 3 | Tracker reliability server v5.90 live | Done |
| 4 | Servicing tracker software v10.67 live | Done |
| 5 | Real contact, TEST/event and physical paper/QR rollout | Open |
| 6 | Supplier servicing-cost correction v10.68 live | Done |
| 7 | Map pick/label correction v10.69 live | Done in combined v10.71 |
| 8 | Building departure coverage v10.70 live | Done in combined v10.71 |
| 9 | Remaining fencing evidence v10.71 live | Done |
| 10 | New buildings-register layout accepted, built and live | Open |
| 11 | Remaining source-unpriced customer transport resolved | Open |
| 12 | Complete-export server v5.91 staged, switched and verified live | Code ready; staged; switch pending; Claude switch pending |

Current verified count: **7/12 done, 5/12 outstanding: 41.7%, approximately 42% of these listed outcomes remaining**. This counts the independently verified page publications; it does not imply that 42% of engineering effort remains or that every data item has been audited. A subsequent verified v5.91 switch makes it 8/12 done and 4/12 outstanding.

The five remaining items are:

- **Performance:** the incremental release improves measured work but does not meet every target. The controlled phone sample still took 11.171 seconds to usable and 1.19–5.42 seconds for measured tabs; idle Today/Build/Map remained 5.11%/8.48%/4.98%, above the under-2% target. Further profiling and bounded changes are required; the single controlled comparison is not a universal device guarantee.
- **Real servicing rollout:** the software is ready, but the nominated servicing contact, real TEST/event setup, private QR/paper bundle and physical iPhone/Android scans must be completed before Thu 22 Oct 08:00. Local fixtures cannot certify physical delivery or scans.
- **Buildings-register layout:** the new layout still needs the required mockup acceptance and implementation. The departure-rule correction is separate and does not complete that design work.
- **Customer transport pricing:** the remaining GN20 delivery/pickup entry is source POA with no supported transport override; the settled hire/install rules do not supply a truck-movement price. See `../v10.06_units_runs_charges_LIVE/transport_override1006.js` and `../v10.50_charge_gaps_LIVE/README.md`. Do not reopen superseded pricing questions or invent this rate.
- **Server export deployment:** v5.91 code and rollback tests are ready, and staged-blob verification passed; the Railway switch and exact running-file/public read-back remain. Code readiness does not establish deployment.

Existing confirmed onsite records and agreed rate cards remain authoritative. No missing quantity, rate, date, asset or completion status has been invented for this release. Update the statuses and counts only from verified release evidence; retain public/private sharing restrictions.
