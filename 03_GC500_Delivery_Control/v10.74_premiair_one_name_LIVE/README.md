# v10.74: one sub-hire company, Premiair Hire, everywhere (LIVE 19 Oct 2026 13:05 AEST)

Author: Andrew Fisher · built and uploaded by Claude.

Andrew, 19 Oct 2026: "Please make sure there is only one premair subhire company. You have mentioned it twice".

**Why it showed twice.** The page filed Premiair under two companies: the owner key `prem-air-hire`, shown "PremAir Hire"
(the project manager's 8 Oct spelling), and `other:premiair`, shown "Premiair". The owner folding knew "premair" and
"prem-air", but not "premiair" with the i, which is how contract 9961265 spells it. A read-only sweep (rendered page, code
and record, each finding then verified independently) confirmed **29 places**. Among them: two Sub-hired company buttons;
the Equipment "Rehire on site" strip and the VMS row's SUB-HIRE cell split across both names; the VMS register's Whose
column; the Every reference table; the Build and Change cards; and the VMS plan cards and print pack. Worst, every
sub-hired board recorded on arrival (VMS11, 18, 19, 20, 23) had **two cards** in its delivery's drawer, one under each name.

**What changed** (`patch_v1074.py`, nine edits, each old text found exactly once):
1–2. `owner925` and `ownerKey` fold every spelling (Premiair, PremAir, Prem-Air, Premiair Hire, Premiair Services Pty
     Ltd, PRE808) into the one key `prem-air-hire`. The record keeps that key, so **no record document changes**.
3–5. The company reads **Premiair Hire**, Andrew's own spelling on 19 Oct, in the unit panels, supplier labels and VMS10.
6.   The VMS register names every Premiair board Premiair Hire, VMS24 (supplier PRE808) included.
7.   One board, one card: the arrival record of a sub-hired VMS board with the register's company and fleet number is
     that board, not a second unit. Coates boards are left as they are (see below).
8.   The supplier cost estimate recognises "Premiair" and "Premiair Hire" as PRE808.
9.   The VMS plan's own note says Premiair Hire.
Costs keep the ledger name PREMIAIR SERVICES PTY LTD (PRE808). "Team Office Premiair Racing" (P19) is a race team and is
not touched. Footer v10.73 → v10.74.

**Page:** `079eb9d8434d29be559ec99a6e16435b683161e91ca3f0bd588cb23dd5bb0669`, 18,508,373 bytes, built with
`bash toolchain/build.sh v10.74 …/patch_v1074.py` on live v10.73 `31f1a9f5…`. Uploaded with `toolchain/upload_page.py`
(base guard passed); the view link serves it byte for byte.

**Tests:** `test_v1074.cjs` checks the views the sweep flagged:
- no "PremAir Hire" and no plain "Premiair" sub-hire label;
- one Premiair Hire button on the Sub-hired tab;
- all nine register boards say Premiair Hire;
- one card per board: T0103 120T; T0128 467T; T0158 472T, 487T, 475T and 453T;
- no duplicate warnings on those cards;
- footer v10.74, no page errors;
- **Costs and Today text identical to the live v10.73 page**.

It passed on desktop and phone on the build, and on the live page (`evidence/`). Both 24-tab sweeps found 0 page errors and
0 console errors.

**Left for Andrew (not changed):** the Coates boards VMS12 (T0128) and VMS14–17 (T0158) are each recorded twice, once from
the VMS register and once from the 16 Oct arrival record, and flagged "Duplicate physical identity". VMS13 also carries both
1191657 and 1191957. Because of those duplicates, the Equipment "Rehire on site" strip reads "Premiair Hire 1 on site": it
only counts a delivery whose identified units match its on-site count, and only T0103 does. Six Premiair boards are really
on site. Folding the Coates pairs too would fix that count, but it changes priced revenue (+$2,251.62 on STPS, T0128 VMS
hire), so it waits for Andrew's word. Not tested: saving the unit form on a merged card on the edit link.
