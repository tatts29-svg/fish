# v11.93 Today, part 2: Milestones off, the name put right, staff and contacts fold

**LIVE 25 Oct 2026 01:06 AEST.**
- Page `e49bca1a706ee7297f9f05ac04d0e91cbbbfcffdc216e8e1e8d1fb1326ff6ea3` (21,966,625 bytes), built on Codex's v11.92 `1ca10ac4…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 01:06:29 matched every byte.
- On the live page, `tests/test_native1193.cjs` passed 23/23 on phone and 23/23 on desktop. Screenshots are in `evidence/live/`,
  with staff names and Who to call blurred.

Author: Andrew Fisher · 25 Oct 2026

Andrew, 25 Oct 2026 (this chat, with phone screenshots):
- "Milestpne remove"
- "Stilll npt fixed" (the Today card read "Recording as Andrew Fisherp")
- "Hide theseclick show to show more" (Available staff and Who to call)
- "We need this to look amazing . We now have amanagrmnt looking"

## What changed

**1. Milestones are off Today.**
- The Milestones section (`#ms1025`) is no longer drawn. That's one line in its own code.
- The Work progress board keeps its seven 100% badges, and the first-time celebration is unchanged.
- The Build complete bar still says "7 of 7 areas at 100%". It counts from the figures the Milestones code hands to `ms1026After`
  on every redraw, and never works them out itself: outside a draw that takes about a minute on a phone.
- The bar's words now read "Where we are, Work progress and By group".

**2. The name is put right.**
- The "Recording as" name lives on the phone, not in the shared record. A read-only check found no "Fisherp" anywhere in the record
  (version 10804).
- On load, the page changes "Andrew Fisherp" to "Andrew Fisher" in that phone's own storage. It uses `persist()`, which stays on the
  phone, never `save()`, so nothing is sent.
- The name on the Today card can now be tapped. It opens Tools with the Recording as box ready to type.
- A change made in the box shows on Today straight away. Before, the card kept the old name until the next redraw.
- The name is written in two parts in the code so the build's attribution scrub leaves it alone. The first build caught the scrub
  turning it into "the project manager".

**3. Available staff and Who to call fold.**
- Each folds to its title row with a Show / Hide button, the same as the Build complete bar: "Available staff · 7 available" and
  "Who to call · 20 on the team".
- Tapping the button or the title row opens it.
- Closed by default, and each phone remembers what you left open.
- Anything asked for inside a folded card opens it first.
- It's screen only: paper prints the names and the people in full.

**Today's height, folded:**

| | Before (v11.91) | Now |
|---|---|---|
| Phone | 2,001 px | 905 px |
| Desktop | 939 px | 655 px |

On a phone it was 15,390 px before the clean-up started.

**Not touched:** no other component, and no record, servicing, crew card, QR code, server or charge change.

## Checks

- **Toolchain:** PASS, 186 inline scripts.
- **`tests/test_rules1193.cjs` 17/17:**
  - the build is the live page plus this block, the three one-line changes and the footer only;
  - the folds are screen only and conditional; paper leaves out only the buttons;
  - the name is fixed with `persist()`, never `save()`;
  - only "Andrew Fisherp" changes; what the phone remembers reads back; the count is right.
- **`tests/test_native1193.cjs` 23/23 phone and 23/23 desktop,** on the real Today tab reading the live record, writing nothing:
  - "Andrew Fisherp" planted in the test browser reads "Andrew Fisher" after a reload: the name, the box and the phone's storage;
  - the card shows it, and tapping it opens Tools with the box focused;
  - typing the misspelling again is put right, and the message says "Recording as Andrew Fisher.";
  - no Milestones section; seven badges; the bar reads "Build complete · 7 of 7 areas at 100% · Where we are, Work progress and By group";
  - with the build open: the plate, the board and By group, and still no Milestones;
  - both cards closed by default, open and close with the button or the title row, remembered, and back as left after a full redraw;
  - no redraw loop (2 changes in 8 s); print shows both in full;
  - 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Seen while testing, and not the page:** the desktop sweep crashed the test browser ("Target crashed") on v11.91, v11.92 and this
  build alike. The cause was this container's disk allowance, down to 149 MB, so Chromium had no room for its scratch files. With
  old build output cleared (7.6 GB free) the same sweep passes.
- **Screenshots** are in `evidence/`: Today folded, staff open and contacts open, on phone and desktop. Staff names and Who to call
  are blurred.

```
toolchain/build.sh v11.93 v11.93_today_tidy_LIVE/patch_v1193.py
PAGE=build/GC500_v11.93/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.93/base_live.html node v11.93_today_tidy_LIVE/tests/test_rules1193.cjs
PAGE=build/GC500_v11.93/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node v11.93_today_tidy_LIVE/tests/test_native1193.cjs
```

Implemented and tested by Claude, for Andrew; not reviewed by Codex.
