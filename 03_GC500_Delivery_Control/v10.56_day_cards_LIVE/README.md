# v10.56 — completed day cards: Coates on time, and what came in (LIVE 17 Oct 2026 07:19 AEST)

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

Two small corrections ride along (17 Oct 2026):

- **Money format.** The v10.55 Site vs Baseplan cards now print money in the page's own format: "$1,426.07", not
  "$1426.07".
- **WC20 map label.** The first waste tank now reads "under toilet block 1327228". It used to say 1311341, which is the
  tank itself. Andrew, 8 Oct: "1327228 is a toilet", "1311341 is a waste tank". The second tank stays under 1327225,
  WC20's second block. That block is settled from the data: schedule T0250 "1327228 - 1327225" and contract 9968955
  line 48.

The record does not change. Footer v10.55 → v10.56.

## Build and checks

```
bash toolchain/build.sh v10.56 v10.56_day_cards_LIVE/patch_v1056.py
python3 toolchain/upload_page.py build/GC500_v10.56/GC500_Delivery_Control_hosted.html
```

- On live v10.55 `0cfe02f8…`. Rebuilt 17 Oct 2026 with the two corrections: 18158203 bytes, sha256 `03ebb3cc0f1e4e4d630da2ea5792a9920212f9ca244773a5629f56cc2e4a8a72`, check_page PASS.
- `tests/test_daycards1056.cjs`: 24/24 on desktop and phone (adds the money comma, the WC20 map labels and WC20's four numbers).
- Sweeps: 24 tabs and 7 links, 0 errors.
- Phone screenshot: `evidence/oct7_card_phone.png`.

## Live

Uploaded 17 Oct 2026 07:19 AEST on Andrew's "Upload". The base guard passed (live was v10.55 `0cfe02f8…`). The view link serves the build byte for byte: 18,158,203 bytes, sha256 `03ebb3cc0f1e4e4d630da2ea5792a9920212f9ca244773a5629f56cc2e4a8a72`.

- `tests/test_daycards1056.cjs` on the live page: 24/24, desktop and phone.
- Sweeps on the build: 24 tabs and 7 links, 0 errors, desktop and phone. The six edit-only tabs stay hidden on the view link, as before.
