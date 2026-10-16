# v10.56 — completed day cards: Coates on time, and what came in (DRAFT, waiting on Andrew's "Upload")

Author: Andrew Fisher · 17 Oct 2026

Andrew, 17 Oct 2026: "I know we spoke about delivery info like a percentage. Those completed days cards would be a perfect
place to have it. Also in work recorded lets have the info of what came in and the description and qty".

- **COATES ON TIME** on each completed Build day card, under Day's deliveries/loads. It shows the day's on-time
  percentage out of 100%, with "INSIDE THE BOOKED WINDOW · n OF m" under it, coloured green at 80% or more, amber 50–79%
  and red under 50%. The figures are v10.48's delivery-text figures: 14 Sep 8% (1 of 13), 7 Oct 100% (11 of 11). It
  shows only on days that have passed and have booked texts, 18 cards today.
- **Work recorded** now shows what came in: one line per arrival, with the reference and its description on the left and
  the quantity and item on the right. For example, 7 Oct reads "P55 · Gate 1 Ticket Box — 1 × Ticket Box 6m", then P56
  and P54. The card shows the first three; More info lists every arrival with its on-site time.

The record does not change. Footer v10.55 → v10.56.

## Build and checks

```
bash toolchain/build.sh v10.56 v10.56_day_cards_DRAFT/patch_v1056.py
python3 toolchain/upload_page.py build/GC500_v10.56/GC500_Delivery_Control_hosted.html
```

- On live v10.55 `0cfe02f8…`. Build: 18158122 bytes, sha256 `3633d9d937ad128dc7281fef56080613434623aeb3cb9e8414fbe0cf0f60bac5`, check_page PASS.
- `tests/test_daycards1056.cjs`: 18/18 on desktop and phone.
- Sweeps: 24 tabs and 7 links, 0 errors.
- Phone screenshot: `evidence/oct7_card_phone.png`.
