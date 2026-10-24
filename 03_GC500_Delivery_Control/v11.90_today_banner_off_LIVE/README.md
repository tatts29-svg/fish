# v11.90 Today: the "areas at 100%" banner comes off

**LIVE 24 Oct 2026 20:16 AEST.**
- Page `6b8b06f21cc1b1c5b7717cc945ef12b00654346ad88bf2537b72c869816c9673` (21,940,091 bytes), built on v11.89 `e8b601db…`.
- Guarded upload. The view link serves the build byte for byte; a separate public download at 20:16:22 matched every byte.
- On the live page, `tests/test_native1190.cjs` passed 13/13 on desktop and 13/13 on phone. Screenshots are in `evidence/live/`, with
  the staff names blurred.
- The first live run hit a syntax slip in the test itself: a `//` comment left on the screenshot line. It was fixed and rerun. The page
  was never affected.

Author: Andrew Fisher · 24 Oct 2026

Andrew, 24 Oct 2026 (this chat), with a screenshot of the Today tab's "7 areas at 100%" banner: "Need to remove this. We need to start
cleaning this up and making all pages mpre ogranjsed now".

## What changed

- **Removed:** the v10.26 milestone banner (`#ms1026`) at the top of Today. It read "7 areas at 100% · every reference ticked complete
  on the record", with Show me / Summary / Print (A4) for each area, and on a phone it filled more than a screen.
- **Kept, because nothing was lost:** the banner only repeated what is already on Today.
  - The **Milestones** section further down Today (`#ms1025`) keeps every area's summary, Print this summary (A4), Print all (A4)
    and Celebrate again.
  - The **Work progress board** still badges each area at 100%.
  - The A4 milestone prints (`#print/milestone/…`) are unchanged.
- **How:** a small wrapper removes the banner each time the milestone code draws it. The milestone code itself is untouched.
- **Not touched:** no other component, and no record, servicing, crew card, QR code, server or charge change.

## Checks

- **Toolchain:** PASS, 183 inline scripts.
- **`tests/test_rules1190.cjs` 7/7:**
  - the build is the live page plus this block and the footer only;
  - the wrapper runs the original (its celebration included), then removes the banner, and is applied once.
- **`tests/test_native1190.cjs` 13/13 desktop and 13/13 phone,** on the real Today tab reading the live record. It waits for the
  record to go live first, then checks:
  - no banner, on the view link and on the edit link, and after leaving Today and coming back;
  - the Milestones section reads "7 areas at 100%", with every summary, its A4 print and Print all;
  - the board's seven 100% badges;
  - Celebrate again still runs its fireworks, and the screen burst still works;
  - the A4 milestone print opens;
  - 0 page errors, 0 record writes.
- **Full sweeps** desktop and phone: 27 tabs, 19 shown, 7 deep links, Back; 0 errors, 0 writes.
- **Screenshots** of the top of Today, on phone and desktop, are in `evidence/`. The Today card now runs straight into Available staff,
  and the staff names are blurred in the pictures.

## Seen while testing (unchanged, on the live page before this too)

- **The first-time 100% fireworks** don't fire on load in a fresh browser: the seven areas stay "unseen".
- **Celebrate again** sometimes draws its fireworks on a copy of the board that has since been redrawn, so they don't show. It depends
  on timing, and happens the same way on v11.89.
- Neither is part of this change.

```
toolchain/build.sh v11.90 v11.90_today_banner_off_LIVE/patch_v1190.py
PAGE=build/GC500_v11.90/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.90/base_live.html node v11.90_today_banner_off_LIVE/tests/test_rules1190.cjs
PAGE=build/GC500_v11.90/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node v11.90_today_banner_off_LIVE/tests/test_native1190.cjs
```

Implemented and tested by Claude, for Andrew; not reviewed by Codex.
