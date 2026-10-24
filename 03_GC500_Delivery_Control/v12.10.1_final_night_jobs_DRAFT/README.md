# v12.10.1 Servicing: tonight's final night is Pump out, Clean & restock and Locked

Author: Andrew Fisher

Claimed as v12.09.2, a point release on v12.09.1. Renumbered to v12.10.1 because Codex's v12.10 (map searches) went live first at 08:59 (the footer never goes backwards).

Andrew, 25 Oct 2026, in this chat: "Also with tonights one. Shoud be Confirm emtpy and pump out. Confirmb clean and Lock no rewater needed so can remove the fill for tonight. They can still use same qr codes." ... "So lets do. Pump out confirmed / Cleaned / Locked. Locked is from the clean qr code".

## What was wrong

- Tonight (Sun 25 08:00 → Mon 26 08:00) is the final service night.
- On the event tracker, the final night for the FWF, accessible and 16-pan units was one combined job, "Pump out, clean & lock", offered on either code.
- The service refuses a tick for a job that isn't on that night's plan. So tonight, a crew ticking Pump out or Clean & restock on those units would have been refused.

## What changes

Tonight, on the FWF, accessible and 16-pan units:

| QR code | Jobs tonight |
|---|---|
| Pump-out code | **Pump out** |
| Clean code | **Clean & restock** and **Locked** |

- No water job tonight. Water checked / refilled stays on the clean code for the other nights; tonight's plan doesn't include it.
- "Pump out" and "Clean & restock" keep the names on the printed sheets. Andrew's "Locked" is the new name of the lock-up job.
- Blocks and sewer (Clean & restock) and tanks and pump-only lines (Pump out) are unchanged.
- The team message and the whose-job lists give the lock-up to the cleaners.
- **The printed QR codes stay the same.** The event tracker is updated in place: same token, no re-key, and the QR signatures don't change.
- No figure for any earlier night changes. Saturday stays at 98%, Exceptional.

## How it goes live

1. **The page.** Both copies of the tracker data are changed: the Servicing panel's (`SVC1067_DATA`) and the card bundle the "Manage servicing tracker" fold publishes (`SVC1067_CARD.data`). Footer v12.10 → v12.10.1.
2. **The event tracker**, straight after, through the page's own fold, run by `tests/update_tracker12101.cjs`:
   - It is Codex's v11.73 update tool adapted, sent through Codex's unchanged bounded bridge (`v11.73_crew_groups_LIVE/tests/native_bridge1173.py`).
   - A private snapshot is taken first as the backup, kept outside the repository.
   - The fold's one request is checked before it is sent:
     - same token, no re-key, no keys;
     - contact, title and dates unchanged;
     - the tracker equals the live one except the three final plans;
     - the crew card changes only in Locked, the three final nights, the pump code's jobs and the version line;
     - the crew groups and the card template are exactly as published.
   - Then it reads everything back:
     - the new tracker exactly;
     - every QR signature unchanged;
     - all completion history kept;
     - the job record and its version unchanged;
     - the crew card byte for byte.

   Between steps 1 and 2 (a few minutes, no crews working), the panel says the tracker uses a different reference list.

## Files

- `patch_v12101.py`:
  - five data edits, each made in both copies;
  - the card data's version line;
  - the team message and the whose-job list;
  - footer;
  - it refuses a base other than live v12.10 `00056a85…` and re-reads both copies afterwards.
- `tests/test_card12101.cjs`: read only, 8 checks. It makes the crew card from the page's bundle the way the fold does and opens it at a reference's pump and clean codes. The card's service is answered locally and nothing is posted.
  - Before (v12.10), PG01 tonight: "Pump out, clean & lock" on both codes.
  - After:
    - pump code: Pump out;
    - clean code: Clean & restock, Locked;
    - WC86 (accessible) the same;
    - WC20 block: Clean & restock; WC20 tank: Pump out.
  - Evidence: `evidence/` (desktop and phone).
- `tests/test_native12101.cjs`: read only, 11 checks, on the real page. The tracker is served from the 08:24 read-only snapshot.
  - Both copies of the data are correct.
  - The service's own `trackerConfig` (run from the v5.92 server source) accepts the new tracker. It equals the live one except the three final plans.
  - Tonight on the panel and in the report: Pump out 0 of 250, Clean & restock 0 of 259, Locked 0 of 244, no water.
  - Saturday unchanged: 98% Exceptional; Pump out 247/250, Clean & restock 252/259, Water 237/242.
  - The Night report still offers "Previous night · Sat 24 → Sun 25 · 98% · Exceptional".
  - Lock-up is the cleaners'. No page errors, zero writes.
- `tests/update_tracker12101.cjs`: the guarded tracker update (above). By default it captures and checks the fold's request and sends nothing. `--execute` needs `GC500_NATIVE_TRACKER_EXECUTE=1` and the reviewed page live.

## Where it's up to

- Built on live v12.10 `00056a857827a22519fe0ac095cf19ae94d2dbb7a06c2843c740f208adb3365c`.
- Candidate `4e53b9dc3e08ea8cdbe60fdaba053093890562445625ea4541cf61a95d67c95d`, 15,272,023 bytes, 195 inline scripts. Toolchain check PASS.
- Tests on desktop and phone: card 8/8, native 11/11.
- Sweeps: 27 tabs, 19 shown, 7 routes, Back, zero errors and zero writes.
