# v11.76 — find it on the map, picture it and send it — LIVE

**LIVE 24 Oct 2026 12:11 AEST**, page `862c9a63880169e2cfdb0f293b9fd662e2643c6c792a824f2ffc4bc454618b01` (21,793,715 bytes); guarded upload, the view link serves the build byte for byte (independent read-back matched). Live tests 35/35 desktop and 35/35 phone (`evidence/live/`).

Author: Andrew Fisher. Built on live v11.75 `4ed371e093ecf70323b28dacc0259b8831dba36e0bb4bc742ab8e037c6d9dc9e`.

## Andrew's words, 24 Oct 2026

> "In maps i want to search for a asset or a refernce no. Or gate no or vms no or stand no and take me pics of location on
> maps and i want a send to button also so i can send to phone"

## What was there already

The finder at the top of the page already answered references, register and unit asset numbers (v11.42), gates (v11.56) and
VMS boards (v11.42). It had no grandstands: "stand 5" found nothing and "S05" found only the label on the drawing. The map
picture and the picture message lived only in a reference's Text box (v7.57).

## What changes

1. **Find it on the map**: a box at the top of the Maps tab. It asks the page's own finder and lists only answers with a
   place on the map: references (and the reference behind an asset number), gates, VMS boards, VMS removal spots and the
   grandstands. A reference with no position says so; one with no drop-off yet says its picture is the pit lane.
2. **The grandstands**: the master plan D001-26003-03 labels twenty stands on the drawn stands — S01, S02, S04, S05, S07,
   S08, S10–S15, S18–S22, S22A, S23, S25. The page already held each label's place on the sheet (the D001 markers tagged
   `circuit_sector`). Each position is that place through the master plan's own registration, the affine that carries every
   MASTER_LAYERS point (fitted in the patch, worst point 0.08 m; image registration, not survey). The fencing schedules call
   them "S05 Grandstand", "S10 Grandstand Area" and so on. "stand 5", "s5", "S05", "grandstand 22a" and "stands" answer in
   both the Maps box and the finder; "stand 3" says the plan draws no S03. The satellite map under the explorer carries them
   as yellow pins with a **Grandstands (20)** filter and a list.
3. **The card** (picking an answer): a close picture (about 190 m across) and a wider one (about 840 m) — the site aerial
   with the master plan over it, a pin and the name, as the Text box draws its picture; a spot outside the aerial (some VMS
   boards out on the roads) is pictured on the satellite map's own Esri imagery, north up, and says so. Each picture is a JPEG
   under 235 kB. Buttons: **Send…** (the phone's share menu with both pictures and the words, e.g. "Coates GC500: Gate 6
   (spectator gate). Directions: <Google Maps link>"), **Navigate ↗**, **Save pictures**, **Copy words + directions**,
   **Open a text message**, **Show on the satellite map** (rings it at 1600%), and for a reference **Open its details**.
   On the edit link, **Text it to a mobile** sends through the service's existing picture-message route (`/api/mms`, with
   the close-up) or plain text (`/api/sms`), with the same check-first, truthful-result and no-duplicate rules as the Text box.

Nothing is written to the record; no crew card, QR code or server change.

## Files

- `find1176_src.js`, `find1176.css` — the module (the grandstands are filled in by the patch from the page's own data).
- `patch_v1176.py` — requires the live v11.75 footer, the gates and satellite-map modules; computes the stands, refuses if
  the registration does not fit within 0.5 m; appends the block as the page's last script; footer v11.75 → v11.76.
  Writes `stands1176.json` (the twenty with sheet place, position and the registration).
- `tests/test_v1176.cjs` — 35 checks, desktop and phone (`MOB=1`), `LIVE=1` for the live page.

## Checks (build of 24 Oct 2026)

- `test_v1176.cjs` 35/35 desktop, 35/35 phone: twenty stands from the D001 markers, each within 0.2 m of a refit of the
  registration in the page; finder answers for stands, gates, VMS, references and asset numbers; the Maps box above the
  explorer and surviving a redraw; 1244536 → GN25, WC41, gate 6, VMS 10, stand 5, stand 3 (none), 1262224 → EQ0005;
  Gate 6's card with two aerial-and-plan JPEGs, Navigate to the gate, plain-letter words; Send… hands two JPEGs and the words
  to a stubbed share menu; Show on the satellite map rings G6 at 1600%; twenty stand pins, filter and list; "stand 21" in the
  finder opens the Maps tab and S21's card; WC41's card uses dest782 like its Text box; VMS 10 (outside the aerial) gets
  satellite pictures; Text to a mobile hidden on the view link, and in an edit-mode practice with fetch stubbed the check
  sends nothing and Send posts one picture message (close-up, number, words) and locks; record unchanged; no page errors;
  no write left the page.
- Sweeps: desktop and phone 27 tabs / 19 shown / 7 hashes / Back, zero errors, zero console errors, zero blocked writes.
- Screenshots in `evidence/` (phone box, Gate 6, S21 and VMS 10 cards, stands on satellite).

Build: `bash toolchain/build.sh v11.76 v11.76_find_send_maps_LIVE/patch_v1176.py`.
