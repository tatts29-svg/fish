<!-- Author: Andrew Fisher -->

Eric Lucian — native record proposal for 14 Oct 2026 AEST.

Andrew requests Eric in today's labour list as labour hire, home branch NOIS, charge branch KINP, at Daniel Gough's hourly pay rate. Fresh native version 5806 has Daniel at $55.70/hour and no Finance rate override. Eric is absent. The existing five available names remain and Eric makes six.

The proposal adds one person, one 14 Oct shift and one availability entry through `setOurPerson`, `runSetShift` and `DailyStaff988.save`. Employer, worked hours and shift times remain unknown. Existing native Finance rules send labour costs to KINP and preserve NOIS as the person's home branch. This does not assert a posted journal, receipt or actual cost.

`record_eric1010.cjs` wraps the previously used guarded record runner. It saves private before/after records, permits only the exact staged document changes, checks fresh server state before sending, rejects unexpected writes and verifies fresh public readback. The edit credential stays in `GC500_EDIT_TOKEN`; apply also requires `GC500_EXPECTED_PAGE_SHA`. Root owns live execution after review.

Practice (GET only; no live writes):

```sh
PAGE=/absolute/path/to/reviewed.html flock /tmp/gc500-browser.lock node record_eric1010.cjs --practice
```

Root execution uses `--apply` only after the exact reviewed page is live. Do not retry automatically after a partial failure. Review private receipts first. A second successful run is a no-op; existing hours are not cleared.

Validation complete: 24 boundary checks and 17 native dry-practice checks pass. Exactly seven documents are proposed: person, shift, availability and four audit stamps. Zero service writes. Fresh public readback remains version 5806, with the full shared record unchanged. The daily labour row is visible, missing hours are explicitly flagged and availability is six. Independent source/guard review found no blockers. Private evidence: `/workspace/private-eric1010/record_14Oct2026_eric_2026-10-13T16-46-22-125Z`. Not executed live by this implementation task.
