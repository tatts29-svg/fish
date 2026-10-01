# Record changes, 1 Oct 2026: WC33 sub-hired toilets on site and installed · WC60 two toilet blocks installed, levelled, stairs on

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026:
- "Sub-hired WC33 toilets are here and installed, add for me. Tick complete. Assets 0634 0582 0548 0782 0657 0912 0554
  0920 0971 0586 0487 0790 0297 0456 0012 0938 0597."
- "WC60 turned up: toilet 6 m asset no 1119489 with waste tank 1328980 — tank is installed and levelled, toilet is
  installed, level and stairs done. 2nd toilet 6 m for WC60 asset 1087500, waste tank 1328981, is installed and levelled
  and toilet is installed and levelled and stairs."

## What the record holds today (read 1 Oct, version 3283)

| Reference | On the record | Contract |
|---|---|---|
| **WC33** · Toilets · FWF | 17 units planned Week 2, 8 Oct (T0100); no numbers, no units, not marked sub-hired, no light | 9968955 line 101, MISCITEM, qty 17, Pending — Event Portables by the toilets stream's rule |
| **WC60** · Toilets (Tank Mounted) · Toilet Block 6m ×2 | planned today, 1 Oct (T0248, "moved from 7/10"); no numbers, no light | 9968955 lines 91 and 93 (toilet blocks) and 94, 95 (sewage holding tanks, included in the block price); none of the four numbers is on any line or any other reference |

## What is to be recorded — through the page's own functions, in the name "Andrew Fisher via Claude"

**WC33**
1. `subhireMark('WC33', 'Event Portables')` — the location is Event Portables gear.
2. `subhire744Many('WC33', 'Event Portables', '0634 … 0597')` — the 17 fleet numbers as Event Portables units.
3. `setDone('WC33', true)` — the complete tick; the page sets the light green, on site, with it.

**WC60**
4. `numberPutOn('WC60', n)` for 1119489, 1328980, 1087500, 1328981 — the way the drawer's number box puts a Coates
   number on (clash check first; the contract lines then match "same asset number" as they do for WC20).
5. `setDeliveryNote('WC60', …)` — which tank goes with which toilet block, in Andrew's words.
6. `setLevelled('WC60', true)` — positioned and levelled; the page ticks complete and sets the light green with it.
7. `setSteps('WC60', true)` — steps installed.

Nothing else is touched: WC33's planned day stays 8 Oct on the schedule (the tick carries today's stamp, so Today and
the Timeline show it arrived and complete on 1 Oct); WC60 was due today.

## Status

**Rehearsed, not yet written.** `rehearsal_result.json`: the seven steps run against the live record's copy in memory
on the view link with every write blocked — WC33 marked Event Portables, 17 units added, none refused, complete and on
site; WC60 carries the four numbers (none refused, none on another reference), the note, levelled, steps, complete, on
site. The edit key is not in this session's environment, so the write needs one of:

- **Codex** (holds the key): `cd 03_GC500_Delivery_Control/record_01Oct2026_wc33_subhired_installed &&
  GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js` — writes
  `record_before.json`, `actions_log.json`, `record_after.json`; `DRY=1` rehearses on the edit link without writing.
- **Andrew, on the page.** WC33: Plant tab → WC33 → Sub-hired → "Event Portables" → paste the 17 numbers into "many
  fleet numbers at once" → Add → tick Complete. WC60: Plant tab → WC60 → type the four numbers into the number box one
  by one → tick Positioned and levelled, then Steps installed → a note on the light saying which tank goes with which.
- **Claude**, once `GC500_EDIT_TOKEN` is set as a secret on this cloud environment (never in a file or a message).

## Files

- `apply_through_the_page.js` — the write, through the page on the edit link; refuses to run without the key; logs
  every request and its status; saves before and after.
- `rehearsal_result.json` — the rehearsal on the view link, writes blocked.
