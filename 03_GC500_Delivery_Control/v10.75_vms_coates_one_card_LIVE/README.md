# v10.75: VMS counts match the site — one card per board, Coates too (LIVE 19 Oct 2026 14:44 AEST)

Author: Andrew Fisher · built and uploaded by Claude.

Andrew, 19 Oct 2026: "It should be 1191657 it a coates machine we need all these cleaned up please", then "Vms boards
counts are wrong you need to fix please".

**On site: 20 VMS boards, 14 Coates and 6 Premiair Hire, all numbered.** Before, the Equipment tab's VMS row read
"Premiair Hire 1 · Coates numbered 8 · no number yet 11", and the Rehire strip read "Premiair Hire 1 on site". Two causes:
1. The Coates boards VMS12 (T0128) and VMS14–17 (T0158) each had a VMS register row and a 16 Oct arrival record with the
   same number. Both copies were flagged "Duplicate physical identity", so neither counted.
2. VMS13 carried two numbers on T0158: the register's 1191657 and an arrival record typed 1191957 from the contract line.
   T0158 therefore had 10 numbered boards for 9 on site, and the page counted none of them.

**Fix:**
- **Record:** the 1191957 arrival record was set aside with the page's own take-off (`UnitIdentity1006.remove`; photos and
  history kept), and T0158's note says VMS13 is 1191657, confirmed by Andrew. New runner op `unit_archive_wrong`
  (`record_18Oct2026_vms_regos/vms13_1191657_spec.json`). Backup first; four documents; record 9858 → 9862; VERIFIED.
- **Page (`patch_v1075.py`):** v10.74's one-board-one-card rule now covers every VMS register row, Coates included: an
  arrival record with the register's company and number is that board. Footer v10.74 → v10.75.

**Now (live, read back):**
- VMS row: **20 on site · Premiair Hire 6 · spare 0 · 20 at locations · Coates numbered 14 · no number yet 0 · still to
  come 0 · ordered 20**. Rehire strip: **Premiair Hire 6 on site**.
- One card per board: T0001 7, T0103 2, T0128 2, T0158 9. No duplicate warnings.

**Money (Costs, line by line against v10.74):** priced revenue $447,672.84 → **$449,924.46 (+$2,251.62)**, all STPS hire.
T0128's Coates board VMS12 now counts and is priced. T0128's and T0158's VMS hire holds read "Hire quantity" instead of
"Hire". Today: no line changes.

**Page:** `1a4f83f16017aa28c237013a79888fc79a6b55c5f234ccb35175c7fd70be4c77`, 18,508,370 bytes, built on live v10.74
`079eb9d8…`; guarded upload, byte for byte. **Tests:** `test_v1075.cjs` (counts, cards, one company name, footer, Costs
and Today diff) passed on desktop and phone on the build, and on live. Both 24-tab sweeps: 0 page errors, 0 console errors.
The contract line still says 1191957 for VMS13; that is the branch's to correct.
