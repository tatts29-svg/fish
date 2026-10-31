# v11.91 Today: the finished build folds away

**LIVE 24 Oct 2026 23:59 AEST.**
- Page `ffacee9978f388e43559a02bf62a9ad01d2de0c3bf3b3326eb5c5cd19b279e6b` (21,948,407 bytes), built on v11.90 `6b8b06f2…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 23:59:10 matched every byte.
- On the live page, `tests/test_native1191.cjs` passed 27/27 on desktop and 26/26 on phone. Screenshots are in `evidence/live/`,
  with staff names and Who to call blurred.
- **One live check missed first time, and the cause was the test.** The first desktop run on live read Today with the fold open at
  5,567 px (6,615 on the build).
  - The first time the fold opens after a load, the embedded Where we are view re-measures its screen-only packed cards in the next
    frame (222 to 1,192 px), and the test measured in that same instant.
  - Its content was all there while folded: 14,430 characters and 5 cards, the same as open and the same as v11.90.
  - The test now lets the layout settle for 400 ms after a tap. The rerun passed 27/27 desktop and 26/26 phone.
- **Also checked on live:**
  - The On site, Trade by trade and By group jumps, each as the first open after a fresh load, finish where they do on v11.90:
    desktop 225 / 12 / 12 px from the top, phone 12 / 12 / 12. On site stops at 225 px on a desktop because that's the foot of the
    page, the same on v11.90.
  - The embedded Where we are view takes no space on paper on v11.90 either, so paper prints as before.

Author: Andrew Fisher · 24 Oct 2026

Andrew, 24 Oct 2026 (this chat): "We need to start cleaning this up and making all pages mpre ogranjsed now". On the plan ("Fold the
finished build boards into one closed 'Build complete' section, then do the tab bar, then the long pages, one release at a time"):
"Yes, Today first".

## What changed

On a phone, Today ran to 15,390 px, and most of that was the finished build. Four parts now fold behind one bar:

| Part | What it is |
|---|---|
| Where we are plate (`#where885`) | the lamps, the tracked category progress, the programme day |
| Work progress board (`#gc500-work-board840`) | every area and reference |
| Milestones (`#ms1025`) | the area summaries, their A4 prints, Print all, Celebrate again |
| The embedded Where we are view (`#pane-progress`) | By group, On site, Trade by trade |

- **The bar** reads "Build complete · 7 of 7 areas at 100% · Where we are, Work progress, Milestones and By group", with Show / Hide.
  - The count is the Milestones section's own.
  - If any area drops below 100% the title says "Build progress". It never claims complete when it isn't.
  - It wears the Available staff card's own dark housing, so it reads as one of Today's cards.
- **Closed by default.** Show or Hide is remembered on that phone or computer (device storage only; nothing goes to the record).
- **It opens by itself** when something leads into it:
  - the By group, On site and Trade by trade jump buttons under the Today heading;
  - any link or bookmark to Where we are (`go('progress')`);
  - anything that scrolls to a part inside it.
  - The Today and Site contacts jumps leave it closed.
- **Nothing is moved, deleted or redrawn.** A screen-only rule hides the four parts, so paper prints exactly as before. The bar itself
  is not printed.
- **Redraws don't jump.** The bar is in place before Today puts the scroll back after a redraw.
- **Today's height:**

  | | Fold open (as before) | Fold closed |
  |---|---|---|
  | Phone | 15,390 px | 2,001 px |
  | Desktop | 6,615 px | 939 px |

### The header fix that came with it

- The folded Today is short on a desktop. That showed up a fault in the v7.89 slim header: on a window about 1,180–1,270 px tall,
  slimming the header left the page nothing to scroll, so it sprang back to the top and the header flipped on every turn of the wheel
  (12 flips in six turns, stuck at the top).
- Any short page could do this; Today was never short before.
- Now a page too short to stay scrolled once the header slims keeps the full header and scrolls as normal. Every other page behaves
  exactly as before. It's a one-line change to the v7.89 code.

### Not touched

No other component, and no record, servicing, crew card, QR code, server or charge change.

## Checks

- **Toolchain:** PASS.
- **`tests/test_rules1191.cjs` 18/18:**
  - the build is the live page plus this block, the slim-header line and the footer only;
  - the hiding is screen-only, for the four parts, and only while the fold is closed; paper leaves out only the bar;
  - the bar's words for all done, not all done and no count;
  - the slim header on a stand-in: as before on a long page; no flipping on a short one.
- **`tests/test_native1191.cjs` 27/27 desktop and 26/26 phone,** on the real Today tab reading the live record, writing nothing:
  - closed on a first visit, with one bar straight before the Where we are plate;
  - the four parts folded; the Today card, Available staff, Site contacts, Who to call and the event banner still there;
  - the bar's words, its housing matching Available staff, no sideways scroll;
  - tap to open and close, remembered;
  - a full redraw keeps Who to call where it was (desktop 292 → 292 px, phone 319 → 319 px);
  - no redraw loop (2 top-level changes in 8 s);
  - By group opens the fold and lands on it; Site contacts leaves it closed;
  - `go('progress')` and scrolling to Milestones open it; scrolling to Who to call does not;
  - print: the board prints, the bar doesn't;
  - remembered across a reload, on the view link too;
  - desktop only: at a 1,206 px window the header held (0 flips) and the page scrolled to its foot (130 of 130 px). The same check
    on the build before the header fix failed with 12 flips, stuck at 0 of 130 px;
  - 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown (Where we are included), 7 deep links, Back; 0 errors, 0 writes.
- **Screenshots** in `evidence/`: Today with the fold closed and open, on phone and desktop. Staff names and Who to call are blurred.

```
toolchain/build.sh v11.91 v11.91_today_build_fold_LIVE/patch_v1191.py
PAGE=build/GC500_v11.91/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.91/base_live.html node v11.91_today_build_fold_LIVE/tests/test_rules1191.cjs
PAGE=build/GC500_v11.91/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node v11.91_today_build_fold_LIVE/tests/test_native1191.cjs
```

Implemented and tested by Claude, for Andrew; not reviewed by Codex.
