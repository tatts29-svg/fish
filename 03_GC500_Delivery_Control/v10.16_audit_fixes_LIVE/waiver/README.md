# Optional damage-waiver explanation

Author: Andrew Fisher

The P&L's default damage-waiver placeholder carries no price and no charge. It is now explicitly optional and explains that no automatic waiver is applied. This removes the misleading missing-rate hold for a charge that was not requested. Existing transport, hire-allocation and work-rate holds remain unchanged, as do all current Revenue, Direct costs, supplier pricing and branch allocations.

The rule retains an unpriced hold if a future ledger row explicitly marks waiver required or enabled, and does not suppress a priced row. Existing explicit charge-entry and editing paths remain unchanged; no rate, enable setting or native record is added by this patch. Root owns integration and publication.

The isolated test also checks an explicit generic charge. Its value reaches Costs/P&L once and remains editable. That test exposed a separate pre-existing branch allocation defect, corrected by the adjacent branch patch. With both components applied all 23 waiver checks pass, including the retained branch assertion. The current saved ledger, supplier pricing and branch totals remain unchanged. Raw evidence remains private.
