# v10.49 — lock and unlock the buildings; accessible toilets serviced as FWF — READY TO UPLOAD

Author: Andrew Fisher. Andrew, 16 Oct 2026: "all buildings are in, I want this all locked in so we know where we are
at" / "need to unlock also" / "Accessible treat it as a FWF".

**Buildings lock (Costs, top card).**

- **Lock buildings** takes a snapshot of every building on site with every charge the record gives it (hire,
  install, steps, levelling, cleaning, fire extinguisher, demob, delivery and pick-up legs) and keeps it in the shared
  record with the person and the time (runRules → `buildingsLock1049`, one JSON value, through the page's own
  stampIt/save).
- **While locked:** a tick, complete, light, levelled or steps change on a building is refused with a plain message
  ("Buildings are locked (16 Oct 2026 19:48, Andrew Fisher). Unlock them on Costs to change this."). Toilets and
  everything else are not affected.
- The card shows the locked total and **anything that differs from the lock since** (for example a rate or a
  contract line), building by building, with the net change.
- **Unlock buildings** (edit link only, after a confirm) opens them again; the card keeps the last lock and who
  unlocked. The buttons are hidden on the view link.

**Accessible toilets as FWF.** Event-night servicing now counts accessible toilets with the FWF units: FWF Pump out &
Clean & Restock $72.87 a unit, Friday, Saturday and Sunday night. WC01, WC31, WC51, WC86: 4 units, $291.48 a night,
**$874.44** for the three nights. FWF units 235 → 239; FWF servicing $51,373.35 → $52,247.79. Pee panels still carry
no servicing charge.

Built from live v10.48 `43c1c13b…`, check_page PASS. `tests/test_lock1049.cjs` 19/19 (GET only — edit rights are
simulated inside the page; nothing reaches the service): card and snapshot (52 buildings, $147,017.32, equal to the
16 Oct buildings breakdown), lock with the person, building tick and complete refused while locked, toilets not
locked, a change past the lock shows as drift, unlock, ticks free again, WC86 FWF $218.61, no agent names, no page
errors, phone layout, buttons hidden on the view link.

After upload, the first lock is pressed on Andrew's word (his "locked in"), through the page's own `lock1049`.

    bash toolchain/build.sh v10.49 v10.49_buildings_lock_DRAFT/patch_v1049.py
    node v10.49_buildings_lock_DRAFT/tests/test_lock1049.cjs build/GC500_v10.49/GC500_Delivery_Control_hosted.html
    python3 toolchain/upload_page.py build/GC500_v10.49/GC500_Delivery_Control_hosted.html
