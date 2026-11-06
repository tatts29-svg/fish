# Servicing crew groups — LIVE

Author: Andrew Fisher · 24 Oct 2026

Andrew requested five crew groups, selected when completing work so each reference records who did it. Staff scan the existing completion QR, choose their group and tap each completed task. Cleaners are one group. Cleaning and water retain separate attribution through the same Clean & restock QR. Crew labels appear beside task times, in the saved summary and audit, the main Servicing table and the printable Coates shift report/CSV. Earlier entries say “Group not recorded”; no historical crew is guessed. The selection clears on another reference, reload or service-day change.

## Verified publication

Main v11.73 uploaded 24 Oct 2026 **10:19 AEST** and verified byte for byte. Existing crew-card HTML updated through the native HTML-only process and verified at **10:20:44 AEST**. Separate public read-back matched both at **10:21:25 AEST**.

- Page SHA256: `0a02e5fdba577f678a3494ffdccca474a126bc7be13dac2015a09d3a1c88dd9f` (21,753,853 bytes).
- Crew HTML SHA256: `bf53b806563c907780700f861485ac29585bd39e58787174fb091a2ddd1d8db3`.
- Base main v11.72: `84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea`.
- Previous crew HTML: `960faf8c41a0fbd79860420f342fd0c3635052f827dc9e09cfcba20c0c86f1ab`.
- Required server v5.92: `bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396`.

Implementation source `2d86df2fa6d7c0a61f4e0528358c3ac4506893c7`; completed candidate checks `e82d7f7d8a2401f8da9ca964f2ffa5669eb0fcfc`; reconciled publication claim `0603591b9e2afb9f649dc9dfe1e1533487bca587`, branch `ccr-061f77e8-ivjhrv`. Codex implemented, tested and published main/crew. Claude deployed the server first, reporting its exact boot-file hash in [PR #1 comment 6377390954](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6377390954). Codex independently read healthy v5.92 capability and verified preservation; no independent Railway-log inspection or Claude client review is claimed.

## Checks and preservation

Toolchain: 173 inline scripts parse. 54 pure/report checks; 23 actual phone-to-local-server checks covering all five IDs, separate clean/water crews, reload, undo, offline retry, unsupported server and malformed acknowledgements. 33 native report checks on each desktop and phone; both full sweeps (27 tabs, 19 shown, 7 deep links, Back), zero errors. Phone selector and A4 ledger inspected. Dependent server: 23 focused HTTP plus 205 existing regression checks.

Guarded main upload refused a changed base and then proved exact served bytes. The native crew update passed 72 assertions (71 saved before receipt serialization), made one intended HTML update and zero unexpected writes, retained the same card token/configuration, signed QR links, all prior completion history and shared record/version. After publication, actual live phone report passed 33/33 and actual live crew page 13/13; zero page errors or attempted writes, private screenshot inspected. No live test completions. The only operational read side effect was normal card access timestamps.

## Build, evidence and rollback

The patch requires the exact v11.72 base. Set `GC500_CREW_ROSTER` to the authorised private JSON roster: five objects with `id` and `label`, IDs `cleaners`, `pump1`, `pump2`, `pump3`, `water`. Do not commit that file, contact details, live snapshots, printed-code signatures, payloads or private screenshots. Phone numbers are not included in the candidate. Use the shared toolchain, with this folder's `patch_v1173.py`.

`validation.json` contains sanitised results. `tests/update_crew1173.cjs` documents the guarded native path and defaults to a dry capture; execution additionally needs its explicit environment gate and verified v5.92 capability. It is a one-time upgrade guard against the previous crew HTML and will refuse to reapply over v11.73. Read-only live checks use `tests/test_live_crew1173.cjs` with a private snapshot and authorised roster. Local integration accepts either the server's archived LIVE path or the earlier DRAFT path.

Use the previous main and crew HTML for a coordinated rollback, keeping all tracker history and QR signatures. If the server must return to v5.91, restore predecessor crew HTML before crews resume: that server retains stored group fields but drops new attribution. Prefer a tested roll-forward once crews have started saving groups. Claude owns the server release documentation; no machine import/prune was performed by Codex.
