# v10.80 — VMS05 is back: 24 VMS boards

**LIVE 20 Oct 2026 10:07 AEST.**

- **Page:** `6a509831956221160fc78798a28b5fcee3eb3bd0740709b6f12f77b4efbcc478` (18,515,766 bytes), on v10.79 `a0f2a41b…`.
- **Upload:** guarded upload; the view link serves the build byte for byte.
- **Checks:** `test_v1080` passes on desktop and phone, including the record steps run in memory. Both sweeps: 0 page errors, 7/7 links, Back works. The only messages were the outside weather service throttling us (429).

Author: Andrew Fisher.

**Andrew, 20 Oct 2026:** "there is a VMW05 now asset no 1211356 Rego no ER9244 pinned location 27°58'57.5"S 153°25'28.7"E".

On 19 Oct VMS05 was "removed and no longer needed", and v10.76 counted 23. The register lists contract lines only, and no contract line names VMS05 or 1211356 yet.

## What changes

- **The register:** VMS05 is added as a Coates board, 1211356, "no contract line yet - on Andrew's word, 20 Oct". It's added only while no line names VMS05 or 1211356; once the branch puts it on hire, the contract line takes over.
- **The count:** 24 boards, and the recorded requirement is 24 (was 23).
- **The line count:** VMS05 doesn't count as a contract line.
- **Footer:** v10.79 → v10.80.

## Record, through the page, after the upload

- **VMS05** (`record_18Oct2026_vms_regos/vms05_spec.json`; 9978 → 10012, VERIFIED):
  - T0001 quantity back to the schedule's own 8, and supplied 8;
  - unit 1211356 recorded as VMS05 (Coates);
  - register rego ER9244, on T0001;
  - VMS plan position 05a pinned at -27.982639, 153.424639, which is 34 m from the plan's spot (Gold Coast Hwy southbound, PB3).
- **Board pins from Andrew the same morning:**

  | Board | Plan position | Distance from the plan's spot |
  |---|---|---|
  | VMS07 | 07a | 20 m |
  | VMS13 | 13 | 43 m |
  | VMS14 | 14 | 57 m |
  | VMS16 | 16 | 9 m |
  | VMS17 | 17 | 101 m |
  | VMS19 | 19 | 340 m |
  | VMS11 | 11 | 19 m (10012 → 10015) |
  | VMS15 | 15 | 22 m (→ 10018) |
  | VMS18 | 18 | 120 m (→ 10021) |
  | VMS20 | 20 | 28 m (→ 10024) |

  Each was dry-run first and VERIFIED. Andrew's pin is the position of record wherever the plan's spot differs.

## Live after it all

- 24 boards: 21 on site, 3 still to come (VMS21, VMS22, VMS24).
- Equipment VMS row: 21 on site · Coates 15 · Premiair Hire 6 · ordered 24.

## Open

- **VMS05 reads complete**, because T0001 still carries its complete tick. Andrew didn't say VMS05 is installed.
- **An unnamed "vms" pin** (-27.983284, 153.425068) is 21 m from position 02a (VMS02's relocation). It's not recorded until Andrew names the board.
