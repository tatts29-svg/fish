# v10.57 — Build tab tidied: a readable no-twin-steer banner, the locked orders off the Build tab (LIVE 17 Oct 2026 10:32 AEST)

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026, on the Build tab: "Your locked order is taken up the whole page. Hide it somewhere else not here.
You have no twin steer but i cant even see the writing.. … Needs to be neat and tidy its a card of that day with
details."

- **No-twin-steer banner, now readable.** The header photo's dark shading was painting over the red strip, which v10.53
  had left unpositioned. The strip now sits above the shading as white on Coates red, and the wording is shorter: two
  lines on a phone, one on a computer. It reads "⛔ NO TWIN-STEER TRUCKS · Week 3 to demob · track, Esplanade, Macintosh
  Island Park". The print lock is unchanged.
- **Locked delivery orders off the Build tab.** The 819 px list has gone from the top of the Build tab, so Day Documents
  and the day cards now sit straight under the tabs. The full list is kept, folded shut, at the foot of the Demob tab:
  "Delivery orders · locked — 11 days · 44 references in the exact order to keep · 1 rule". Each building's drawer still
  shows its own "Delivery order · locked" card.
- **The day panel's twin-steer card is one red line.** It was 219 px of pink on a phone. It now reads "⛔ No twin-steer
  trucks · track, Esplanade, Macintosh Island Park · Week 3 to demob", with the full rule behind More. Printed, the full
  rule shows. The card's class is renamed so the tick dialog's rule is plain text again.

The day-card categories (Buildings, Toilets, Water barriers …) and the on-time reasons follow as **v10.58**. The
performance work taken over from Codex becomes **v10.59**. The record does not change. Footer v10.56 → v10.57.

## Build and checks

```
bash toolchain/build.sh v10.57 v10.57_build_tab_tidy_DRAFT/patch_v1057.py
python3 toolchain/upload_page.py build/GC500_v10.57/GC500_Delivery_Control_hosted.html
```

- On live v10.56 `03ebb3cc…`. Build: 18163802 bytes, sha256 `2ee2bfb105f05e8707676796e39aac4e7befd74b7e30514091bec32a7b784a95`, check_page PASS.
- `tests/test_part1.cjs`: 72/72 (36 desktop, 36 phone). It covers the banner legibility (nothing painted over it at five
  points; two lines at 360–430 px), no orders list on the Build tab even after a redraw, the Demob fold (closed, its
  place, 11 days, and it stays open across pick-up-day taps), the drawers unchanged, the rule line (compact, More/Less,
  not mistaken for a print button), the print lock both ways, and no sideways scroll.
- Regression on this build: v10.53 `test_twinsteer1053` 36/36; v10.56 `test_daycards1056` 24/24. v10.54
  `test_orders1054`'s Timeline-list checks are superseded by design; its drawer checks are covered in test_part1.
- Sweeps: 24 tabs and 7 links, 0 errors, desktop and phone.
- Phone screenshots: `evidence/p1_timeline_top_phone.png`, `p1_demob_fold_closed_phone.png`,
  `p1_demob_fold_open_phone.png`, `p1_rule_open_phone.png`, `p1_rule_truckday_phone.png`.

## Live

Uploaded 17 Oct 2026 10:32 AEST on Andrew's "Upload". The base guard passed (live was v10.56 `03ebb3cc…`), and the view link serves the build byte for byte: 18,163,802 bytes, sha256 `2ee2bfb105f05e87…`. `tests/test_part1.cjs` on the live page: 72/72. The folder keeps its DRAFT name while the v10.58 parts are built in it.
