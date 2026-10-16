# Event Portables arrivals of 16 Oct 2026: WC62, WC35, WC30 — PREPARED, dry run passed, not applied

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Here and installed: WC62 0103, 0976; WC35 0284; WC30 0428, 0440, 0024,
0419", then "WC30 here and installed 0993, 0584, 0089, 0553".

| Reference | Schedule asks | Units going on | After |
|---|---|---|---|
| WC62 | 2 FWF | 0103, 0976 | 2 of 2, installed, dated 16 Oct, complete, light on site |
| WC35 | 1 FWF | 0284 | 1 of 1, installed, dated 16 Oct, complete, light on site |
| WC30 | 8 FWF | 0428, 0440, 0024, 0419, 0993, 0584, 0089, 0553 (on top of 0681, 0043, 0963, 0545 from the 15 Oct partial arrival) | **12 on site against the schedule's 8**, supplied 12, installed, dated 16 Oct, complete, light on site, and a delivery note saying so |

WC30 is a top-up (`"topup": true`): the runner counts the four already on the record and adds these. It is also an
over-supply (`"over": true`): the schedule row asks for eight, Andrew has counted twelve on site, so all twelve go on
and the note on the delivery record says the schedule quantity is to be checked. Nothing is guessed about which four
are "extra"; the record carries what is there.

## Runner

`ep_arrived.cjs`, the Event Portables arrival runner (`record_15Oct2026_wc30_event_portables/`) with two additions:
top-up of a reference that already carries units, and over-supply with a note. Same controls as every arrival: one unit
identity record per number (`unit925Save`), the supplied count (`setSupplied`), the install tick (`setLabour`), the
delivery date (`setDate`), the complete tick (`setDone`, which sets the light green), and for the over-supply row the
delivery note (`setDeliveryNote`). Dry run on the live page with every write aborted, `--apply` with
`GC500_EDIT_TOKEN` and `GC500_EXPECTED_PAGE_SHA`, backup first, held sender, a write gate that allows exactly the
planned PUTs once each, settle, read back, verify, `report_<UTC>.json`. Spec: `ep_spec.json`.

Dry run on the live page (record 6749): the twelve numbers on no reference; the stage produced the fifty-five documents
expected (eleven unit records, three supplied, three install ticks, three delivery records, one note, and their stamps
and by); the page tried fifty-five writes, the harness aborted every one, no page errors — DRY RUN PASSED.

## Not applied yet

This session's permission gate refuses record writes (16 Oct). Run

```
GC500_EXPECTED_PAGE_SHA=<sha256 of the public page> node ep_arrived.cjs --apply
```

with the edit key in the environment, after the de-duplication in `record_16Oct2026_hire_agreements_36601_36616/`.
