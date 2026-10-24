# v11.98 Today: the asset-number clash card off

Author: Andrew Fisher

Andrew, 25 Oct 2026, sent a screenshot of the Today card "Asset numbers delivered against two references · 1 NUMBER · 1189908 P41 (inside it — air conditioner, delivered) and P62 (inside it — air conditioner, delivered)" with: "Can we remove this looks messy on todays page".

## What changes

- **Today:** the hub's clash card (`clashcard`) no longer draws. It's one early return in its block.
- **The warning stays with the number.** Each building's drawer still carries it under "Contents and accessories" (`contentsClashLine`): "A number inside P41 is on another reference too … 1189908 Air conditioner — P41 · P62". Load briefs and driver cards keep their own "Asset number on two references" flag (`clashOf`) for a building's own number.
- **No record change.** 1189908 is still recorded inside both P41 and P62. Which building actually has it is Andrew's call, and the record is put right when he says.

Footer reads v11.98. No rate, servicing, crew card, QR code or server change.

## Base and candidate

- Base: live v11.96 (Codex) `f8a93ce25459abd4493e65a28d9e9170d031237302b35af2ea1cf419bca08b68`.
- Candidate: `6e92bd7e5fb09b86d2d184638a9cea3d41d02509c4fdd4243b8ce5ab273c7dc7`, 21,999,244 bytes, 189 inline scripts. `check_page` passes.

## Checks

| Check | Result |
|---|---|
| `tests/test_native1198.cjs` desktop | 8/8 |
| `tests/test_native1198.cjs` phone | 8/8 |
| Sweeps, desktop and phone | 27 tabs, 19 shown, 7 routes and Back; 0 errors; 0 writes |

The native test confirms:
- no clash card on Today, and Today still draws its five cards;
- the record still holds 1189908 on P41/P62;
- both drawers still warn under Contents;
- 0 errors and 0 writes.
