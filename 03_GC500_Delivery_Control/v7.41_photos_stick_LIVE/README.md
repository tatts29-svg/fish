# v7.41: photographs stick (LIVE)

Author: Andrew Fisher · 29 Sep 2026

Andrew, 29 Sep 2026: "please ensure when photos are added they stick. I have noticed photos are disappearing, or the
next day they get removed or don't attach. Huge bug."

**LIVE: 29 Sep 2026, 17:17 AEST.** The page on the service matches this build byte for byte. Record v2563 was read
only; nothing on the live record was written by this work.

## What was actually happening

Read from the service's own request log (Railway HTTP log, 24 and 28 Sep) against the record and the file list, all
read-only. The tables are in `evidence/`.

- **141 drop photographs uploaded, 41 files on the service with nothing pointing at them.** Some of those are
  deliberate replacements (a place re-taken), but most are the ones Andrew saw vanish.
- **One document held every photograph of a reference.** Every add, remove and caption rebuilt the whole list from
  what the phone held in memory and wrote it over the top. Whenever the phone's memory was behind the service, the
  next write put the older list back, and a photograph that had landed a minute earlier was written out of the
  record. The request log shows it plainly: on 28 Sep at 18:23, P17 place 2 was stored and its list written; 21 s
  later place 1 was stored and the list was written **without** place 2; place 2 was taken again 14 s after that.
  WC17 · 1327223 place 2 (18:29:49) was written out a minute later and never re-taken.
- **At the circuit uploads took 14 to 65 seconds and the phone abandoned several** (the proxy logged 499, "client
  closed the request before the service answered"). An abandoned upload was gone from the page for good, although
  the service had stored the file: "it didn't attach", and the picture was taken again.
- **A poll answer that left the service before a write landed could arrive after the write's acknowledgement** and
  be folded in as the newer truth. The photograph vanished from the screen for a few seconds, and a write in those
  seconds wrote the vanishing into the record.

No DELETE of a photograph document appears in either window. Every loss is a whole-list write that did not carry a
photograph the service already held.

## What changed

1. **One document per photograph.** `S.photoLinks`, keyed by the file's own id. Adding a photograph writes one new
   document; nothing ever rewrites another photograph's document. Taking one off writes a tombstone on its own
   document (when, by whom, why), which a merge keeps by its stamp like any other change. Replacing a photograph
   tombstones the old one as "replaced by …" so it is not listed as lost. The old per-reference lists
   (`S.dropPhotos`, the 100 photographs on the record today) are read but never written again.
2. **An outbox on the phone (IndexedDB).** The shrunk picture and where it goes are saved on the device before a
   byte leaves it. The entry is removed only once the service has the file and its document is written. A failed
   or abandoned upload goes again on its own: after 3 s, 6 s, 12 s … up to a minute, on every page open, and
   whenever the phone comes back online. The place says **Sending** meanwhile (with Send now and Forget it), so
   nobody takes the picture twice. The message on a failure now reads "kept on this phone … it goes again on its
   own; no need to take it again" instead of "nothing was changed".
3. **The poll never applies a late answer.** The service adapter remembers the highest record version this browser
   has read or been acknowledged for; a record answer below it is not applied and the next poll asks again.
4. **Photographs on the service that no place holds are listed under their group** ("2 photographs of WC17 · asset
   1327223 on the service, not on the sheet"), each with **Put back**. Put back writes the file's own document into
   its old place if free, else the first free one, carrying the file's upload time so a photograph taken since keeps
   the numbered place. Nothing is uploaded twice. The list is folded closed; it includes photographs replaced on
   purpose before today, which can simply be left there.
5. **A photograph the record holds is never hidden.** Two in one place are both shown: the newer in the numbered
   place, the older after it. Past the numbered places no Replace is offered, only Remove.

The record's checker, blank record, load, export and merge all know `photoLinks`; the sync engine carries it as a
map collection like the others. The service needed no change.

## Andrew's lost photographs

The ones the log shows written out without a re-take are back in one tap each from the drawer, under the group's
"on the service, not on the sheet" list:

| where | what | when it was lost |
|---|---|---|
| WC17 · asset 1327223 | Access and surrounds | 28 Sep 18:30 UTC (04:30 AEST 29 Sep) |
| P44 · asset 198481 | Aerial — overhead | 28 Sep 18:16 UTC |
| WC17 · asset 1327223 | Access and surrounds (22 Sep) | 22 Sep |
| WC16 · asset 1322587 | Access and surrounds (22 Sep) | 22 Sep, re-taken 28 Sep |

The 18 Sep reference-level pairs (P17, WC16, P10, P11, P12, HRP, P36, P37, T0023) were re-taken against the asset
number a minute later, so those places are full; the earlier files sit in the folded list.

## Checks

- Practice tests (`evidence/practice_tests.js`, page from the build file, every write captured in the page, uploads
  answered by a stub, nothing reaching the live record): 13 of 13. Add (one document, legacy list untouched); two
  at once; replace (old one tombstoned as replaced); service away (kept in the outbox, Sending cell, retry booked,
  nothing on the record); service back (sent on its own); page reload with a picture waiting (sent after the
  reload); remove (tombstone, merge either way keeps it off); caption on a legacy photograph; strays listed for
  WC17 · 1327223 and P44; Put back; a late poll answer not applied while a current one is.
- The live record through the new reader: 37 references, 100 photographs, all resolving to files, unchanged.
- Sweeps (`evidence/sweep_*.json`): desktop 21 tabs 0 errors, phone 21 tabs 0 errors.
- Every inline script passes `node --check`; the token, keys and map tokens scanned for before upload.

## Files

- `patch_v741.py`, `photo741_src.js`, `photo741.css` — the change, applied to v7.40.
- `shot741_sending.png` — a place whose photograph is still on the phone (the service answering "no signal").
- `shot741_strays.png` — the folded list of photographs on the service not on the sheet, with Put back.
- `evidence/uploads_vs_record_29Sep2026.md` — every upload against the record.
- `evidence/service_request_log_extracts.md` — the request log for the two windows.
- `evidence/audit_pointers_vs_files.js` — the read-only audit that found the 41.
