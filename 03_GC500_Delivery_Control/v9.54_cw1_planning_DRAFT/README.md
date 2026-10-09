# v9.54 — current CW1 fencing plan and provisional forecasts

Author: Andrew Fisher

**READY for root release verification — exact v9.53-base source and native checks passed. Not live.** Root owns the claimed version, final whole-page sweeps and publication. This component has not uploaded the private original or changed the operational record.

The 9 October CW1 PDF and John Brett's supplied email update the planned work for 12–16 October. Supported task lengths, dates, bracing categories, access conditions and crew requirements now feed the existing day/week plan and fencing forecast. Recorded dockets, Revenue, Direct costs, rates, completion, equipment and the equipment running sheet are unchanged.

## Source review

`05_CW1_Fencing Installation Plan.pdf`: 23 pages, John Brett, created 9 October 2026 at 10:27 AEST, SHA-256 `d7287c2cb05f69677d954c6daf9bd086666ba54535ecb91e7d8fe6e0847fa661`. The supplied email is dated 10:34 AEST the same day; its provenance is explicitly the project manager's supplied chat text, not a claimed mailbox retrieval. Original pages and relevant maps were read. Vector strike-throughs and the identical Cypress pages were verified visually and by the extraction script.

`extract_cw1_954.py` reproduces the bounded transcript from that exact private original. It requires PyMuPDF and rejects a different hash, page count, task count, changed strike-through evidence or non-identical Cypress duplicate pages. The original is not included in this folder.

## Selection rule and remaining limitations

The forecast uses 57 distinct task rows: 45 rows represented in the PDF, with the two new Gate 6/Triangle tasks, plus 12 earlier programme tasks omitted from it. Eighteen rows retain prior allowances pending review, including the omitted tasks, crossed-out Monster Energy scope, Spit scope, Maddison completion uncertainty, Ferny stockpile/deployment, the inherited Inlet date note and provisional S14 length. They remain visibly provisional, not newly confirmed work or costs.

- Pit/Paddock is Thursday once, supported by the dedicated map/email and the crossed-out Friday copy; original Friday row text is retained.
- Gate 6 is Thursday once, supported by its dedicated map/table/email, with the Wednesday source discrepancy retained.
- Cypress is 240 m and two vehicle gates once; pages 21–22 are identical.
- The Esplanade Support Categories rows become 185 m +190 m braced for scrim, replacing 135 m +180 m clean.
- The Spit remains provisionally 85 m clean +35 m relocation. The 190 m detail may cover a wider transporter-parking extent; it is not added or substituted.
- The extra 50 m Gate 6 CCB stockpile is visible source evidence, not another installation or unique-hire-stock allowance.
- Printed PDF subtotals are not used: they mix stale dates, struck rows and scope differences. All model quantities are summed from selected task rows.

Selected CW1 quantities, including identified provisional allowances: clean 3,177 m; braced 705 m; relocation 142 m; removal 569 m; vehicle gates 50; pedestrian gates 21; Event CCB 430 m; Demarcation CCB 1,464 m; flat-feet CCB 90 m. These are work movements, not unique hire stock. Relocation/removal costs without matching units/rates remain unpriced under the existing native model.

All prior programme rows, original day/week totals, held 24 September carryover and prior CW5–CW2 installation-plan objects remain preserved. Earlier construction, event and demob weeks are unchanged. The native CW1 task card uses existing table/disclosure styles, places cells at the top and folds long source disputes; it has no write controls. Costs identifies the provisional CW1 allowances in its forecast explanation and gaps.

## Files and integration

- `source954.json`: bounded original transcript, source hashes, page references, supplied email highlights and repeated/struck evidence.
- `cw1_954.py`: pure source transformation; rejects wrong source/year/identity/quantity/page, existing CW1 overrides and reapplication.
- `cw1_954.js`: read-only native plan renderer and forecast qualification.
- `patch_v954.py`: strict production CLI, **v9.53 → v9.54**. It changes only `DATA.fencing`, its read-only presentation/forecast qualifications and the footer. It does not alter financial source fields or native records.
- `tests/test_source954.py`: 32 source, boundary, preservation and release-guard tests.
- `tests/browser954.cjs`: independent paired native source, task × rate, progress/actual and phone/desktop proof; GET-only, native record frozen after the initial read.

Final candidate: `/workspace/gc500-current-release/03_GC500_Delivery_Control/build/GC500_v9.54/GC500_Delivery_Control_hosted.html`, 12,677,405 bytes, SHA-256 `84109458fde3ec9de584d411e8b87616718b0b21a2f37c32066066e684ee4d8f`. Exact v9.53 base: `b4c2ec652c603c07b09afbca9ec2317816b96b4174e673339b77fb15314bfe8a`, retained at `/workspace/private-cw1-954/final954/base_live.html`. The strict CLI applied successfully to that base. The standard build attribution scrub changes only “Email text supplied by Andrew Fisher in this chat” to “Email text supplied by the project manager in this chat”; this sole six-byte change was independently verified. The final source and native checks were rerun on these exact production bytes. v9.53 is live at the same base hash; any intervening source still requires rebuild/recheck.

```sh
python3 v9.54_cw1_planning_DRAFT/extract_cw1_954.py /private/original.pdf v9.54_cw1_planning_DRAFT/source954.json
BASE_PAGE=/absolute/v9.53.html python3 v9.54_cw1_planning_DRAFT/tests/test_source954.py
CHROMIUM_PATH=/usr/bin/chromium BASE_PAGE=/absolute/v9.53.html PAGE=/absolute/v9.54.html OUT=/absolute/private-evidence MOB=1 flock /tmp/gc500-browser.lock node v9.54_cw1_planning_DRAFT/tests/browser954.cjs
```

Final evidence is private under `/workspace/private-cw1-954/production954/evidence/`; the committed summary contains hashes/counts rather than private record snapshots or financial rates. All 32 Python source/boundary tests and 191 independent task-source assertions pass on the final v9.53 comparison. All 46 inline scripts parse and the static page check passes.

Final native checks on identical frozen record 5104: **409 phone and 408 desktop checks passed**. Both retain the entire native record, money summary, recorded costs, dockets, green-book hours/costs, completion and customer/supplier rates. Only CW1 planned quantities/progress and its forecast change; the other nine forecast weeks remain exact. Every forecast week/category independently reconciles remaining quantities × current native rates. Zero runtime errors or operational write attempts; the only denied write was the expected Google map-session POST. Both source views stay within viewport width: 390/390 px and 1440/1440 px. All 57 task rows are available exactly once. Final phone folded-task/open-discrepancy captures and desktop captures were visually inspected and readable.

The independent review agent's exact-production whole-page sweeps also passed on desktop and phone: 22 routes, seven deep links, zero page/console/navigation errors and zero blocked-write attempts in each. Root's independent release review and guarded publication remain with the root owner. The component is frozen pending that handover; do not describe it as live before public byte verification.
