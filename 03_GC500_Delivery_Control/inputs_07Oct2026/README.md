# Andrew's files, 7 Oct 2026 (saved for later work)

Author: Andrew Fisher. Encrypted because they may hold rates, names or contacts. Same password and method as the v8.71 inputs (the papers password). It is not in this repo.

`inputs_07oct.zip.enc` sha256 `077a6a48e70cbf63c572e189bcbffb7306e9534884e2d24925da486843fe7c1b`

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in 03_GC500_Delivery_Control/inputs_07Oct2026/inputs_07oct.zip.enc -out /tmp/inputs_07oct.zip   # asks for the password
```

| File | sha256 | For |
|---|---|---|
| 05_CW2_Fencing_Installation_Plan.pdf | `c6d7f4ec14d8853d…` | CW2 fencing installation plan |
| Baseplan_SuperCars_07Oct.xlsx | `8a18bd1f0df331d3…` | Fresh Baseplan export, 7 Oct |
| D001-26003-03-MASTER.pdf | `8753d875cf90682e…` | New master map, issued 2 Oct. Replaces the 17 Sep issue `37792f0a…` (v8.77) |
| P003-25003-01-GC600_2026_Coates_Hire_Fencing_Programme.xlsx | `f66950215023da3d…` | GC600 2026 fencing programme (P003-25003-01) |
| P003-26003-01_Programme_-_Coates_Inf_V1_14.8.26.xlsx | `fd522077f05f1d36…` | Programme, Coates Inf V1 14.8.26 |

## Master map diff (old 17 Sep vs new 2 Oct)

- The whole sheet is shifted 9 mm left on the paper (layout, not site moves).
- Real changes: P45 moved about 43 mm on paper; WC69 now one label (was two); WC38 and WC39 nudged; **WC10 added**; **WC32 and WC40a removed**.
- P60, P62, P63, P68, WC48, WC49, WC51 and WC81 are not shifted with the rest (inset or redrawn area). Check them on the drawing.

## Andrew's requests that go with these (7 Oct, 13:46 AEST)

1. Maps: replace the current master with this one and update every record that uses it.
2. Map explorer: clunky and slow; make it smooth and fast. Tapping a building must clearly show what's done. Fencing must close like every other panel, not only by tapping Fencing or Close again.
3. Costs: everything reconciles across tabs. New **Transport** tab in Costs covering every transport fact, down to branch.
