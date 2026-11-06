Author: Andrew Fisher

This component corrects the future carrier-cost fallback in `cj764Model776Held`. It has not been integrated or published on its own. Root release integration owns the final build and hosted checks.

`cost_dedup834.apply_patch(text, path)` changes only that model's bounded function body. The shared replacement helper rejects missing or repeated source fragments, and a component marker rejects a second application. It does not alter embedded source data, the native record, current money, customer Revenue, quantities, rates or completion.

A source task already represented by the equipment calculation cannot acquire another average carrier-load allowance through the unreferenced/fencing source lists. Existing paid/internal figures, typed carrier-cost coverage and authoritative equipment cancellation also suppress that task's fallback. Each fallback task ID is consumed once. A distinct pickup or delivery task remains distinct even when it uses the same equipment reference; missing IDs are never inferred from a name or date. Promoted equipment events without carrier/docket/cost fields still retain their valid raw fallback.

The current `rowOff()` authority excludes cancelled source tasks and respects reinstatement. Accreditation duties are held out only when the source category is `Passes`, there is no equipment item, and the quantity is absent or explicitly blank. Their source rows remain, and the existing gaps table explains the unresolved travel-cost basis. The word “Collect” alone never excludes a load; an unknown equipment quantity is not converted to zero.

Run `python test_cost_dedup834.py`: 25 synthetic checks cover repeated tasks, separate directions, missing IDs, cancellation/reinstatement, current paid and internal movements, typed-cost precedence, raw-list overlap, accreditation duties, physical collection, unknown quantities and guarded source boundaries. Private exact-state reconciliation is retained outside the repository; no commercial amounts or source records are included here.
