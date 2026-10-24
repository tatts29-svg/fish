# v10.52 — lock the ticks, unlock, untick any (DRAFT, waiting on Andrew's "Upload")

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "We need to be able to lock the ticks but also unlock it and then untick any. And price will then
come off or be added on. This need to then update everywhere else".

- **Lock ticks** (Costs) holds every tick on everything on site at that moment: 157 references today. That covers
  the charge ticks, complete, levelled, steps, the lights, emptied, and any door side already recorded. Anything that
  arrives after the lock stays open until the next lock. A missing door side can still be filled while locked.
- **Unlock to change**, in each drawer, opens that one reference, and **Lock again** closes it. **Unlock all** on Costs
  opens everything. The drawer shows 🔒 Locked or 🔓 Unlocked on Complete it.
- **Untick → the price comes off everywhere.** Since Andrew's 13 Oct direction, every applicable charge (install,
  levelling, demob, cleaning) has been included automatically on arrival, so taking a tick off did not take the money
  off. Now a tick Andrew took off takes that piece off the charge and the forecast, building by building. That matches
  his 16 Oct rule, "whatever as per rate card … unless I unticked it". Everything adds up from the same charge: the
  drawer, Costs, the P&L, branch totals, the labour plan and the buildings card.
- **Three of Andrew's earlier unticks now count:** T0001 VMS install (−$88.48), the WC60 toilet block clean
  (−$156.15) and the WC01 FWF install (no change; its units are ticked one by one). Labour charged goes from
  $74,619.30 to $74,374.67. The buildings total is unchanged at $149,017.32.
- **Door sides:** P65 (passenger) and P66 (driver), which Andrew recorded on 9 Oct before the units were numbered,
  read again.

The lock is kept in the record's runRules under `buildingsLock1049`, the same key v10.49 uses, now with `held` and
`open`. Nothing else in the record changes.

## Build and checks

```
bash toolchain/build.sh v10.52 v10.49_buildings_lock_LIVE/patch_v1049.py v10.50_charge_gaps_LIVE/patch_v1050.py v10.51_drawer_tidy_LIVE/patch_v1051.py v10.52_tick_lock_LIVE/patch_v1052.py
python3 toolchain/upload_page.py build/GC500_v10.52/GC500_Delivery_Control_hosted.html
```

- **Build:** on live v10.48 `43c1c13b…`; 18124078 bytes, sha256 `0981f5ff67be0422527ebe5931ffb6d9e75b30d6ba34de04656eedec55e22002`; check_page PASS.
- **Tests:** `tests/test_ticklock1052.cjs` passes 44/44 on desktop and phone (GET only; edit rights simulated inside
  the page). It checks:
  - a building tick and a toilet tick are both refused while locked;
  - one-by-one unlock works;
  - the demob untick moves P05's charge, the job labour total and the buildings card by $145.74 each;
  - Lock again and Unlock all both work;
  - the P65 and P66 door sides read again;
  - there are no page errors.
- **Retired test:** `test_lock1049.cjs` expected "Buildings · locked" and unlocked toilets. Both change here by design.
