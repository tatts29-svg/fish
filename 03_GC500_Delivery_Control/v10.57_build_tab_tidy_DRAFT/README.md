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


# v10.58 — completed day cards: WHAT WENT IN by category, and Coates on time with the reasons (DRAFT, waiting on Andrew's "Upload")

Andrew, 17 Oct 2026: "Dont give me a refernce description give me water barriers. Or Toilets or something bettwr than
whta you have on the cards. If the transport is not 100% i want a reason why. This need to refresh and be accurate.
Needs to be neat and tidy its a card of that day with details."

- **WHAT WENT IN** (`part2_daycats.py`). Every completed Build day card shows a tidy two-column grid of plain categories:
  Buildings, Toilets, Water barriers, Generators, Lighting towers, VMS boards, Forklifts, Track mat, Furniture, Fencing
  (mesh metres, with scrim and gates in the small line) and Crowd barriers.
  - Each tile has the true quantity that came in that day: a close-to-close count on the site record, with receipts on
    their own day, aliases counted once, and cancelled or moved references left out.
  - No reference numbers on the card face, and no "+n more".
  - More info lists each reference with its quantity and where the number came from (site light, receipt, rental date
    or programme row).
  - Example, 15 Oct: Buildings 3 (2 × 6m · ticket box 4.8m), Toilets 21 (20 FWF · 1 accessible), Water barriers 154,
    Generators 1 (50 kVA), Fencing 777.5 m (3 ped gates), Crowd barriers 200 m.
- **COATES ON TIME** (`part3_ontime.py`, data `ontime1057_units.json` built by `build_ontime1057.py` from the full Coates
  text export of 16 Oct 17:47; the export itself is private and not in the repo).
  - Rebuilt truck by truck. Units booked together are separate units; the old figures merged them, so 21 Sep wrongly
    read 0%.
  - The headline is measured against the first booked window, as before.
  - Arrival comes from the site record: a time written in the site note wins; otherwise the earlier of the Coates
    delivered text and the site tick.
  - Under 100% the card names what was late in plain words, e.g. "1 late · Ticket box 26 min" or "6 late · Toilets ×3,
    Buildings ×2, Water barriers".
  - More info gives every late or failed load: booked window, Coates moving the window and when, the programme load and
    whether it could make the window, the on-its-way text, and the site time. Each ends "No cause recorded on site."
    The figure against the windows Coates had re-sent is shown there too, labelled.
  - The v10.56 painter and the v10.48 fold stand down, so a day shows one figure. Cards re-work on every redraw of the
    page.
- **Integrator's changes** after the two independent reviews:
  - A site-note arrival time wins over the Coates text (the site record is the truth). 16 Sep: P21's note says on site
    14:30, its text says 06:59, so it now counts 1 h late: 4 of 6.
  - The two 16 Oct "Senior" VMS texts (3 + 2 boards) are T0158's five boards, not T0128's.
  - The card's late line keeps the plain category words on a phone (two short lines).

Figures (first booked window): 15 Oct 75% (3 of 4); 21 Sep 25% (2 of 8); 14 Sep 31% (4 of 13); 15 Sep 50% (3 of 6,
the failed delivery counted); 16 Sep 67% (4 of 6); 25 Sep 0 of 4 (WC50 set aside, sources named); 8 Oct 1 of 4; 7 Oct
and 16 Oct 100%.

## Build and checks

```
python3 -I v10.57_build_tab_tidy_DRAFT/build_ontime1057.py <export.xlsx> <page.html>   (only when a new export comes)
bash toolchain/build.sh v10.58 v10.57_build_tab_tidy_DRAFT/patch_v1058.py
python3 toolchain/upload_page.py build/GC500_v10.58/GC500_Delivery_Control_hosted.html
```

- On live v10.57 `2ee2bfb1…`. Build: 18255724 bytes, sha256 `55059fe9384ab768d91944999ef80ad4c947bf96ebe3618d2640f734b879293e`, check_page PASS.
- Tests on this build:
  - `tests/test_part2.cjs` 107/107: every day's numbers, the reconciliation to what is on site now, no reference keys,
    Demob cards unchanged, 360 px.
  - `tests/test_part3.cjs` 130/130: every pinned day, one row per card after two redraws, a site-time change moving the
    figure.
  - `tests/test_part1.cjs` 72/72 and v10.53 `test_twinsteer1053` 36/36.
- v10.56 `test_daycards1056`'s work7, det7 and 14 Sep 8% checks are superseded by design. So are v10.48 `test_dt1048`'s
  fold checks.
- Sweeps: 24 tabs and 7 links, 0 errors, 0 console messages, desktop and phone.
- Phone screenshots: `evidence/v1058_card_2026-10-15_phone.png`, `v1058_card_2026-10-16_phone.png`,
  `v1058_card_2026-09-21_phone.png`, `v1058_card_2026-10-07_phone.png`, and the builders' `p2_*` and `p3_*` shots.

## For Andrew

- **Headline basis.** It uses the first booked window. Against the windows Coates had re-sent before the day, some days
  read higher (14 Sep 69%). That figure is in More info, labelled. It is a one-line switch if he wants it the other way.
- **Real causes.** The record and the texts hold no cause for any late truck, so every reason line is a timing fact and
  ends "No cause recorded on site." A Reason box per late load would let the site or the branch record the real cause;
  it writes to the record, so it needs his yes.
- **Days after 16 Oct 17:47.** These need a newer Coates text export, run through `build_ontime1057.py` and rebuilt.
- **Speed.** Re-working 40 cards adds about 0.4 s to a Timeline redraw on desktop. v10.59 (performance) should take this
  in.
