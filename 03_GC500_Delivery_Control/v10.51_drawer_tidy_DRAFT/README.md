# v10.51 — the drawer, tidied (DRAFT, waiting on Andrew's "Upload")

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026, on P09's drawer:
- "This needs to be fixed why are we adding photos for accessories. Makes no sense i never asked for this"
- "Lets fix up the ticks we should not mention things twice"

**Photos.** Photo places are for the building itself, or each real unit inside a group (such as the FWFs in a toilet
group). Accessories get none: the aircon, fridge and urn carried inside a building lose their photo places in the
drawer, in its "Which unit" choice and on their cards. That takes 28 accessory units off 16 references. None of them
held a photo, and any photo already recorded against an accessory would still show.

**Ticks.** Complete it showed LEVELLED and LEVEL, and STEPS twice. Now there is one row for each job, with its date and
dollars ("LEVEL 16 Sep · $52.05"), and its tick still sets the levelled or steps record. "1 of 1 ticked" is dropped
because the tick already says it; a count like "2 of 3" stays. Where the record and the charge tick disagree, both rows
stay so nothing recorded is hidden.

No record, rate or charge change.

## Build and checks

```
bash toolchain/build.sh v10.51 v10.49_buildings_lock_DRAFT/patch_v1049.py v10.50_charge_gaps_DRAFT/patch_v1050.py v10.51_drawer_tidy_DRAFT/patch_v1051.py
python3 toolchain/upload_page.py build/GC500_v10.51/GC500_Delivery_Control_hosted.html
```

- On live v10.48 `43c1c13b…`, together with v10.49 and v10.50.
- Build: 18117073 bytes, sha256 `3b5648542671a14441c57f77d29ba9e88ab273a82be3882388873bedd3cb02c8`, check_page PASS.
- `tests/test_tidy1051.cjs`: 24/24 on desktop and phone, against the live record, GET only.
- Phone screenshots are in `evidence/`.
