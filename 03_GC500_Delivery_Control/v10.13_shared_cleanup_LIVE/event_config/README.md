# Shared event date boundary

Author: Andrew Fisher

This component connects generator charging, linked supplier whole-event coverage, the existing shared event-day readers, workforce event shifts and Demob planning to the current source configuration. It adds no configuration form and writes no operational records.

Configuration inputs:

- `DATA.charge_basis.event_days`: nonempty, valid ISO calendar dates; unique and consecutive. Order is normalised in a copy, leaving the source intact.
- `DATA.charge_basis.invoice_month`: optional valid `YYYY-MM` allocation. A same-month event can derive its month; an event spanning months requires an explicit value. Missing or invalid allocation holds generator charges and whole-event supplier estimates as unpriced/unallocated, with a visible reason.
- `DATA.weeks`: rows with `phase: "Demob"` supply the earliest start and latest end. Working days exclude weekends and current `DATA.holidays`. Invalid/missing windows retain recorded movements and withhold proposed dates.

`EventConfig1013.current()` validates these inputs and invalidates the existing `RENDER_MEMO` and `HELD_MEMO` on a configuration change, including an in-place change. Existing `EVENT_DAYS` readers use an array-compatible read-only projection. `GeneratorFinance1004` exposes current date getters; its precise card rates and all source quote dates remain unchanged.

This is a boundary for the named consumers, not a claim that the entire GC500 application is a configurable multi-event product. Circuit locations, event countdown/cinematic dates, historical evidence, supplied rate cards, transport assumptions and source roster facts remain their existing sources. Moving configured dates does not move an actual receipt, roster entry or source quotation.

Validation commands (private baseline/candidate/record paths supplied through environment variables):

```sh
python test_patch1013.py --base "$BASE" --out "$PAGE"
BASE="$BASE" PAGE="$PAGE" node test_event_config1013.cjs
flock /tmp/gc500-browser.lock env BASE="$BASE" PAGE="$PAGE" STATE="$STATE" OUT="$OUT" node check_event_config1013.cjs
```

The browser comparison uses one frozen native record and clock for both pages. It checks full current financial/operational model parity, shifted dates, invoice holds, actual cache invalidation and in-memory restoration. Its data-rich evidence and screenshot stay in private storage; the portable test summary contains no financial amounts.

Component signoff on native record 6052: 51 extracted-module fixtures, seven patch/source guards, 37 paired native checks and four phone checks passed. All 17 current models were deeply equal to v10.12, including monthly financial allocation arrays. The read-only scope audit compared 182 active described item groups and 120 fully identified ownership groups with no mismatches; seven category percentages remain dimensionless and do not mark incomplete work complete. Zero browser errors or operational writes. Full model capture measured 3,372 ms for the baseline and 3,574 ms for the final component in this environment; this is a bounded observation, not a browser performance guarantee.

Private current/basis/pending phone captures: `/workspace/private-shared-review1013/phone-final/`. The current and missing-configuration screens were visually inspected. Missing configuration shows an explicit hold and Not priced in aggregate cards and individual charge rows. A byte comparison proves the final display refinement changes only generatorHtml1004, leaving all previously compared numerical model code identical.
