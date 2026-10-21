# v11.14 — the crews' QR pages, race-night: dark, glowing, and every total says how much is to go

Author: Andrew Fisher. Built on live v11.13 `3be11b11…`. LIVE line and hashes in STATUS.md.

Andrew, 22 Oct 2026: "Lets work on the qr pages where they click complete.. lets glow this up and darken this up push
your limits with this one. Lets make this look good. We want the teams to know whats been done. How much more to go."

## What the crews see (the page every printed servicing QR opens)

- **Race-night dark, always.** Coates orange is what is next; green glow is what is done. The reference glows big and
  white, the code pill (Pump out / Clean & restock) glows orange, the chosen day glows orange.
- **How much to go, everywhere.** The sticky strip at the top says the area's and everything's percentage with
  "N to go" under each (green "all done" when it is). Every progress block says "N jobs to go · N references left".
  The per-task rows say "N to go". The area list (no-code view) says it per area.
- **A tick glows.** Tap Complete: the job settles into a green glowing card with its time. Pending (no signal) glows
  amber. Save & close pulses orange. The Saved card glows green with the area's and everything's % and to-go.
- **Still to go in Area n.** Under the jobs, the references in this area not yet done, each with its jobs done so far
  (the one you are on is outlined orange), or "Every reference in this area is done."
- A finished area glows green in the list; done rows carry a green edge; done chips glow.

Same ids, classes, data attributes, ticks, outbox, offline service worker and signed codes as before. `prefers-reduced-
motion` stops the shimmer, blink and pulse. Nothing here ticks the job record or changes a charge.

## What changed

1. `servicing_tracker_DRAFT/card/card.css` rewritten (v3), `card_src.js` extended (`togoHtml`, `leftHtml`, green
   `.full` marks, to-go text in the compact strip, progress blocks, task rows, area rows and the Saved card).
   The card's own suite `test_card_v2.cjs`: **46/46** (results in `test_card_v2_results_v3.txt`).
2. `patch_v1114.py`: the page's crew card template `SVC1067_CARD.html` (what "Create / update event tracker" posts) is
   rebuilt from those sources the way v10.67 built the first one (the data line becomes the `/*SVC1067_DATA*/null`
   placeholder); `SVC1067_CARD.data` is checked byte-for-byte unchanged. Footer v11.13 → v11.14.
3. `update_card.cjs`: after the upload, the live card is re-posted under its **existing token** through the page's own
   control on the edit link, so **every printed QR code keeps working** (the service keeps the tracker key; the page's
   read-back checks `key_kept`; the runner checks the 75 signed links are identical before and after, the tick count is
   unchanged, and /d/<token> serves the v3 card). Dry run first with every write aborted; the backup of the live card
   (html, links, ticks) goes to a private folder outside the repo; the report in this folder carries hashes only.

## Checks

Card suite 46/46 on the v3 card. Toolchain PASS all checks. `test_broadcast1113` on this build 36/37 (the one
"failure" is the footer now reading v11.14). Phone screenshots on the local mock service in `evidence/`
(`tests/shot_card_mock.cjs`). Sweeps, the dry run, the live update and its verification: see STATUS.
