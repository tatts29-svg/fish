# Record change, 1 Oct 2026: WC33 — sub-hired toilets on site and installed

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "Sub-hired WC33 toilets are here and installed, add for me. Tick complete. Assets 0634 0582 0548 0782
0657 0912 0554 0920 0971 0586 0487 0790 0297 0456 0012 0938 0597."

## What the record holds for WC33 today (read 1 Oct, version 3283)

- Reference **WC33 · Toilets · FWF**, 17 units planned for **Week 2, 8 Oct** (T0100), no Coates asset numbers, no units
  recorded, not marked sub-hired, no light set.
- Contract 9968955 line 101: "WC33 Toilet Portable - Fresh Water Flush", **MISCITEM**, qty 17, Pending — an Event
  Portables line by the toilets stream's rule (Rehire Revenue $1,531 at our rates).

## What is to be recorded — through the page's own functions, in the name "Andrew Fisher via Claude"

1. `subhireMark('WC33', 'Event Portables')` — the location is Event Portables gear (the banner "SUB-HIRED · Event
   Portables" on the drawer and the register).
2. `subhire744Many('WC33', 'Event Portables', '0634 0582 … 0597')` — the 17 fleet numbers as Event Portables units on
   WC33, labelled "Sub-hire: Event Portables".
3. `setDone('WC33', true)` — the complete tick; the page sets the light green, on site, with it ("complete means it is
   on the ground"), stamped with the name and the time.

Nothing else is touched: the planned day stays 8 Oct on the schedule (the tick and the light carry today's stamp, so
Today and the Timeline show WC33 arrived and complete on 1 Oct); no Coates number is taken off (there is none).

## Status

**Rehearsed, not yet written.** The rehearsal (`rehearsal_result.json`) ran the three calls against the live record's
copy in memory on the view link with every write blocked: WC33 marked Event Portables, 17 units added, none refused,
complete ticked and the light on site. The edit key is not in this session's environment, so the write itself needs
one of:

- **Codex** (holds the key): `cd 03_GC500_Delivery_Control/record_01Oct2026_wc33_subhired_installed &&
  GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js` — it writes
  `wc33_before.json`, `actions_log.json`, `wc33_after.json`; `DRY=1` rehearses against the edit link without writing.
- **Andrew, on the page** (about a minute): open WC33 on the Plant tab → Sub-hired → company "Event Portables" → paste the
  17 numbers into "many fleet numbers at once" → Add → tick **Complete** on the delivery light.
- **Claude**, once `GC500_EDIT_TOKEN` is set as a secret on this cloud environment (never in a file or a message).

## Files

- `apply_through_the_page.js` — the write, through the page on the edit link; refuses to run without the key; logs
  every request and its status; saves before and after.
- `rehearsal_result.json` — the rehearsal on the view link, writes blocked.
