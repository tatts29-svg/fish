# The broadcast compound's forklifts and track mats, 16 Oct 2026 — PREPARED, dry run passed, not applied

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Forklift for broadcast turned up asset no 1298390 2.5t forklift. Forklift
for broadcast 5t turned up 1321364. Trackmats for broadcast turned up qty 10. I approve."

The page holds the three contract lines (9992300-MEAD, the Supercars TV order: line 1 Forklift Rough Terrain 5.0t
1321364 dd 26133345, line 2 Forklift Rough Terrain 2.5t 1298390 dd 26133373 with fork extensions on line 3, line 6
Trakmat dd 26133383, all booked 17 Oct) but no schedule row carries them, so there was nothing to record an arrival
against. Each gets a reference the way Andrew added FL01, FL02 and NVLT on 25 Sep: the Add tab's own `addReference`.

| Reference | Trade · type | Asset / quantity | Location · plan day | Then, through the same controls as every arrival |
|---|---|---|---|---|
| FL03 | Other · Forklift 5T | 1321364 | TV compound · 17 Oct | date 16 Oct (the day it came, kept because the plan says 17 Oct), light on site, note, branch MEAD |
| FL04 | Other · Forklift 2.5T | 1298390 | TV compound · 17 Oct | the same |
| TM01 | Ground protection · Trakmat | supplied 10 | TV compound · 17 Oct | the same, plus the supplied count 10 (the Add form has no quantity field, so the reference's own line reads × 1 and the supplied record carries the ten) |

Nothing is ticked complete. The reference names follow Andrew's FL series (FL01, FL02 at Phillip Park); TM is new, for
track mats. A reference is never renamed on this page, so if different names are wanted, say so before the apply.

## Runner

`kit_arrived.cjs` (from the VMS boards runner): dry run on the live page with every write aborted, `--apply` with
`GC500_EDIT_TOKEN` and `GC500_EXPECTED_PAGE_SHA`, backup of the whole record first, held sender, a write gate that
allows exactly the planned PUTs once each, settle, read back, verify, `report_<UTC>.json`. The key is never printed,
logged or stored. Spec: `kit_spec.json`.

Dry run on the live page (record 6699, page `d72e7f6198111f51…`): FL03, FL04 and TM01 free on the page, the asset
numbers on no reference; the stage produced the twenty-four documents expected (three added references, three
delivery records with the date, the light and the note, three branch records, one supplied record, and their stamps and
by), the page tried twenty-four writes and the harness aborted every one, no page errors — DRY RUN PASSED.

## Not applied yet

This session's permission gate refused record writes on 16 Oct (the 36592 swap and the VMS boards too), so this waits
for Andrew: either run

```
GC500_EXPECTED_PAGE_SHA=<sha256 of the public page> node kit_arrived.cjs --apply
```

with the edit key in the environment, or add the three references on the Add tab by hand (trade, type, number, TV
compound, 17 Oct, branch MEAD), then on each drawer the date 16 Oct, the light on site and the note.
