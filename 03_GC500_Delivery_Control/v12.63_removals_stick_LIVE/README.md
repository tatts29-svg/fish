# v12.63 — a history entry taken off stays off

Author: Andrew Fisher. 30 Oct 2026. **LIVE 30 Oct 2026 16:45 AEST, inside v12.64**, on Andrew's word ("Go live", 16:44 AEST): the public page
is the chained candidate `afbbc0d1448f3ecf83db854a2ec44634d3704884a9b0e95e24c4ee6407c966c0`, 16,144,243 bytes = live v12.61 + this patch +
`v12.64_baseplan11_pins_LIVE/patch_v1264.py`, rebuilt at 16:45 to the same hash and read back byte for byte (record 12167 at upload). The
stand-alone v12.63 candidate `c778a9055edd7b08f9bdb7181f48fe4cccf2fe29c076e371f0a61b09a055adaf`, 16,144,217 bytes, was built and tested
but not uploaded on its own. Built on the live v12.61 (`ddd1bd7a…`, 16,143,727 bytes); `patch_v1263.py` refuses any other base.

## Why

WC41's superseded 28 Oct 12:15 departure entry (the same collection id as the corrected 30 Oct 09:40 entry) was taken out at
11:55 (run 82) and again at 13:06 (run 91), on Andrew's word, and came back three times: 10:34, 12:42 and 14:05. The server's
log for the 14:05 save shows a device on the site network (not this tooling: its address and browser differ) loading the page
and, three seconds later, writing WC41 back with the old entry. That is the mechanism, not a stale tab: the page keeps its own
saved copy of the record on every device (IndexedDB) and merges it with the service on every load; delivery histories merge as
a union keyed by `state|at`, so an entry one side still holds is put back, and the stale side also wins the shared key. Refreshing
cannot clear it. Andrew, 13:0x: "Pages refreshed on all devices, take the wc41 duplicate out" — done, and it came back at 14:05.

## What changes

One line of `mergeRecords`: the delivery history union skips any entry whose tombstone is set, on either side:

    deleted['hist/<ref>/<state>|<at>']

That is the record's own deletion machinery (`tomb`, `untomb`, `tombed`), the one that already keeps a deleted docket or cost
line off every copy. Both sides' tombstones apply before anything else merges, so the copy that still holds the entry cannot
put it back, and its own saved copy picks the tombstone up at that merge. The page's `back/` undo on the same id puts the entry
back, as for everything else. Footer v12.61 → v12.63. Nothing else on the page changes; no figure moves.

`record_26Oct2026_departures/left_site.cjs` writes the tombstone through the page's own `tomb()` when `collection_remove` or
`collection_withdraw` takes a departure entry off, checks it on the service afterwards, and gains `hist_tomb` for an entry
already off (T0023's withdrawn departure of run 88). Pages before v12.63 ignore the tombstone; from v12.63 every copy honours it.

## Checks (candidate `c778a905…`)

- `tests/test_v1263.cjs` on the live record, writing nothing: **11/11 desktop, 11/11 phone** (`evidence/test_*.txt`): opening the
  page on the stale device (live merge) drops the tombstoned entry and keeps the corrected one; the other way round the same;
  the merged record carries the tombstone on; with no tombstone the union is as it was (both entries); a later `back/` undo puts
  the entry back; the tombstone works when the removing side still holds the entry too; the live WC41 document (four history
  entries today, two collection entries) loses the 28 Oct entry once the tombstone is on; footer v12.63; 0 page errors, 0
  console errors, 0 writes.
- Sweeps desktop and phone: 27 tabs, 17 shown, the deep links and Back, 0 errors, 0 console messages, 0 writes
  (`evidence/sweep_*.json`).
- `check_page`: PASS (220 scripts, no key, author credit present).

## After upload

Run the parked spec (`/tmp/gc500-scratch/spec95_…json`, copied into `record_26Oct2026_departures/` as spec95): WC41's duplicate
out once more with its tombstone; T0023's withdrawn entry tombstoned. The stale device drops the entry on its next load of the
new page and saves the cleaned document. v12.62 (the P&L tab) stays queued on Andrew's word; its patch expects the v12.61 base
and is rebuilt on v12.63 when he says.

## To upload (on Andrew's word)

```
cd 03_GC500_Delivery_Control
bash toolchain/build.sh v12.63 v12.63_removals_stick_DRAFT/patch_v1263.py
python3 toolchain/upload_page.py build/GC500_v12.63/GC500_Delivery_Control_hosted.html
```
