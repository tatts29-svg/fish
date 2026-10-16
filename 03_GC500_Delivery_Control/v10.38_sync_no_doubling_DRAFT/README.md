# v10.38 — opening the page can no longer double the fencing papers — READY, not uploaded

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Need to get this sorted, not acceptable on the level we are on."

## What went wrong

When a browser opens the page on an edit link, it folds the copy of the record it saved last time into the shared
record (`syncFirst` → `mergeRecords`). For the paper lists — hire agreements, service notes, collection forms —
`mergeRecords` kept **both** versions of any id the two copies held differently, re-keyed `id·hash`, and the page
then wrote both back. So any phone or laptop that last had the page before an edit brought the old version back beside
the new one. That is 36592 on 14 Oct, and all sixteen of 36601–36616 at 10:12 AEST on 16 Oct (the browser held the
09:20 copy, before the notes were re-saved at 09:23). The same code renamed a lone `id·hash` back to the plain id on
load, which is how a tombstone on the plain id swallowed 36592 at 10:34.

## The fix (`patch_v1038.py`)

On opening only — `mergeRecords(S, theirs, {live: true})` from `syncFirst`, passed through the truck-load wrapper:

- Two versions of the **same paper** (same docket, note or collection number under the same id) are one record. The
  version with the later stamp stands; on a tie the shared record's stands. A later edit made in the browser still
  goes up, under the shared record's id; an older copy is dropped quietly and never written back.
- A record the shared record holds as `id·hash` keeps that id — no renaming on load.
- Two **different** papers that share an id are still both kept and written down, as before.
- Duplicates the shared record itself holds are left for a person, as before.

Importing a file and the two-laptop folder sync keep the keep-both rule unchanged. No record changes, no rate changes.
Footer v10.37 → v10.38.

## Proof

| Check | Result |
|---|---|
| `tests/test_sync1038.cjs` — the 10:12 situation from the record's own backups (09:20 copy in the browser, 09:28 shared record), plus the edge cases | **14 of 14 passed**: the old merge doubles the sixteen (32, all suffixed); the live merge keeps sixteen, plain ids, the shared record's notes, no clash dialog; a later browser edit goes up once under the shared id; a new paper is kept; `F-AFV-0035·2904` keeps its id; two different papers under one id both kept; the shared record's own duplicates left alone; service notes not doubled |
| `tests/test_open1038.cjs` — the page's real opening path (`syncFirst`, merge, stage) with that old copy saved in the browser | **v10.37 writes 32 papers and removes 16** — the very ids seen at 10:12 (`F-AF-0001·1f08`, `·d9d2` …); **v10.38 writes none**, 16 papers on screen |
| v10.37's links test on v10.38 | 8 of 9; the one difference is its footer check expecting v10.37 |
| `harness/sweep.js` desktop and phone | 24 tabs each, 18 shown, 0 page errors, 0 console errors, deep links clean, 0 writes attempted |

Build: sha256 `d181b29e1c93713e494466dea3f24ee200729c72e7af61097342d657ea81f2dd`, 18050768 bytes, on the live v10.37 `902615e2…`. Every test only reads the live record; every write
the page tried was aborted.

## Still worth knowing

Setting a copy aside under the **plain** id while a suffixed twin survives still makes the twin vanish (a base-id
tombstone takes every variant). Set the suffixed copy aside instead, or put back and correct in place.
