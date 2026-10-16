# v10.53 — no twin-steer trucks (DRAFT, waiting on Andrew's "Upload")

Author: Andrew Fisher · 17 Oct 2026. The wording and Andrew's instruction are in `WORDING.md`.

**The tick.** Before anything prints or a PDF is made, the person printing ticks "I confirm no twin-steer truck will be
used for any load on this paperwork" and gives their full name. There is no skip and no "don't ask again". Each print
job asks, and the tick holds for that job until it prints, two minutes at most.

**Where the tick sits:**
1. **Every print and PDF button** asks first, then runs as normal. That covers run sheets, drop sheets, install sheets,
   pre-starts, costs, advice, handover, dockets, event nights, VMS, milestones, Event Portables run sheets, stored-PDF
   links and the `#print/…` links.
2. **The pre-dispatch checklist** (drivers and demob) now has it as its first compulsory box. Those routes ask once,
   inside the checklist Andrew already uses.
3. **Behind the buttons**, a print that did not come through one is refused until ticked. It is refused before the
   print starts, so no load is marked in transit.
4. **The page's PDF maker** refuses until ticked.
5. **Ctrl+P** brings the tick up. **The browser's own print menu**, without the tick, prints only the warning.

**On paper:** every ticked print carries the short rule down its left edge, with who ticked and when. Every PDF page
carries the same.

**On screen:**
- A red strip under the header, on every tab.
- The rule in every drawer.
- A rule card on the Timeline truck-flow card.
- The drivers' texts, the daily run message and the PDF email text end with the rule.

**Beyond reach of the page:** driver drop cards and daily pages published before this release (`/d/…`) keep their old
text until they are made again. PDFs already saved on someone's phone or computer can't be called back.

## Build and checks

```
bash toolchain/build.sh v10.53 v10.49_buildings_lock_DRAFT/patch_v1049.py v10.50_charge_gaps_DRAFT/patch_v1050.py v10.51_drawer_tidy_DRAFT/patch_v1051.py v10.52_tick_lock_DRAFT/patch_v1052.py v10.53_no_twin_steer_DRAFT/patch_v1053.py
python3 toolchain/upload_page.py build/GC500_v10.53/GC500_Delivery_Control_hosted.html
```

- On live v10.48 `43c1c13b…`. Build: 18139667 bytes, sha256 `9370921b465a805803e2e61874df90a11b3ebdff01360904ffed408b04b72cf7`, check_page PASS.
- Tests, all against the live record:
  - `tests/test_twinsteer1053.cjs`: 36/36 on desktop and phone.
  - test_ticklock1052: 44/44.
  - test_tidy1051: 24/24.
- Sweeps: 24 tabs and 7 links, 0 console errors on desktop and phone.
- Screenshots are in `evidence/`.
