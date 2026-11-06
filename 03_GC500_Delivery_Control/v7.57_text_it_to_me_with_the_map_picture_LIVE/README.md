# v7.57 — Text it to me, with a picture of the map (LIVE)

**LIVE in the combined v7.59 page, 1 Oct 2026 08:11 AEST.** The public view serves the build byte for byte: **8,489,105 bytes**, SHA256 `ed1e2f4b9e97b94558d09522bdd9b7c64aaf1e18740a39dd88494227b388a403`. 55 focused checks and both 21-tab/7-link sweeps passed, with zero page or console errors. Earlier build sizes below describe the draft checks. No shared records changed. The map-picture footer now uses the Brisbane date (`todayIso()`); four actual-canvas checks cover Brisbane and UTC midnight. **The page is live, but MMS sending still needs Railway activation of server v5.85.** The validated server blob is uploaded and the rollback blob retained; current health remains v5.84. No real SMS/MMS was sent during verification.

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Text messages. I want to send a picture of the map. MMS ok, I don't mind the cost. I want a
picture of the map of where it goes. Next to the QR code and Navigate: Text it to me. This allows you to enter in a
mobile number and it will text it to you, MMS, of where it goes."

## What it does

1. **A third control on every Timeline load line** that has somewhere to navigate to, beside the QR code and
   Navigate: **Text it · to me · picture**. Pressing it opens the Text box for that reference; it never opens or
   closes the load. (`evidence/shot757_load_line.png`)
2. **The Text box draws the picture of where it goes** — the drawer's own Text it too. The registered 2022 aerial
   (the frame every pin is read against), about 95 m each side of the spot, with the master plan D001 laid over it
   through `sheetFitOf` (the same fit the drawers use to put a position on a sheet), a pin on the spot with an 8 m
   ring, the reference on a plate, a 20 m bar, north, and a band with what it is, the position and where the
   position came from (master plan, pinned on site within n m, placed on the map). Drawn on the page from the
   page's own pictures — nothing fetched from anywhere else. A JPEG kept under ClickSend's 250 kB (178 kB for
   GN03 at quality 0.86; the quality steps down if a picture comes out bigger). On a phone the picture can be held
   to save or share, whether or not the service can send it. (`evidence/picture757_Text_GN03.jpg`)
3. **A tick — "Send the picture too, as a picture message (MMS). It costs more than a text."** — ticked by default
   when the service is set up for it (server v5.85). Send then goes to `/api/mms` with the same words, the number
   and a subject "Coates GC500 GN03"; the box answers "Sent to +61…, with the picture · $0.36" with the price
   ClickSend gave back. Unticked, or on a service without v5.85, the words go as a plain text through `/api/sms`
   exactly as v7.48 does. "Check it, send nothing" works for both.
4. **A bug in the live Text box, fixed here:** a number typed with its spaces, "0429 352 788" — the shape the box's
   own placeholder shows — was split on the spaces into three "numbers" that did not read, and the service refused
   the lot. Now a number keeps its spaces as one number; several are separated by commas, semicolons or new lines.

Nothing about the record changes. The words of the text are v7.48's.

## The picture message on the service (server v5.85)

`server_v5.85/` — `POST /api/mms`, `GET /api/mms`, the picture served at `/p/<sha256>.jpg` for ClickSend to fetch,
the same daily cap and log as texts, 37 / 37 local tests against a pretend ClickSend. `server_v5.85/README.md` has
the deploy steps (a machine blob and one Railway variable — the lead, with the edit key). Until v5.85 is live the
page shows the picture and says "Picture messages are not switched on for this service yet (server v5.85)"; the
words go as a text.

## Evidence — `evidence/practice_tests.js` on `build/GC500_v7.57` (v7.55 + v7.56 + v7.57 on the live v7.54)

The harness opens the view link and aborts every write; the service's texting endpoints are stood in for
(`/api/sms`, `/api/mms` answer "set up" and capture what the page sends). Nothing was sent; no picture left this
machine.

| check | desktop 1440×1000 | phone 390×844 |
|---|---|---|
| load lines with somewhere to navigate to carry the button | 5 of 6 | 5 of 6 (the three controls wrap to two rows) |
| the button opens the Text box for its reference, without toggling the load | yes (GN03) | yes |
| the picture is drawn: aerial + master plan, JPEG under 250 kB | 1000×824, 178 kB, q 0.86 | 1000×824, 178 kB |
| Check it, send nothing → `/api/mms`, dry_run, the picture and the words, "0429 352 788" read as one number | yes | yes |
| Send → `/api/mms` with to, text, subject "Coates GC500 GN03", the JPEG; the box closes after | "Sent to +61429352788, with the picture · $0.36." | same |
| unticked → `/api/sms` as before | "Sent to +61429352788 · $0.08." | same |
| the drawer's own Text it shows the same box with the picture | yes | yes |
| page errors / console | 0 / 0 | 0 / 0 |

Build: `build/GC500_v7.57/GC500_Delivery_Control_hosted.html`, **8,488,095 bytes**, check_page PASS, key grep clean.
Sweeps on it: desktop 21 tabs, 0 errors, 0 console; phone (MOB=1) 21 tabs, 0 errors, 0 console
(`evidence/sweep_desktop.txt`, `evidence/sweep_phone.txt`).

## Files

- `patch_v757.py` — guard `mms757`; the button and its wiring after `ldGo751`; `mms757Picture` and the new
  `smsDropBox` (whole function swapped); the styles.
- `server_v5.85/` — `server.js`, `patch_server_v585.py`, `test_mms.js`, `server_v5.84_to_v5.85.diff`, `README.md`.
- `evidence/` — the test, results, the load line, the box, the picture.

Upload order: v7.55, v7.56, v7.57 on the live v7.54 (one build). No record write. Key grep clean on the build.
