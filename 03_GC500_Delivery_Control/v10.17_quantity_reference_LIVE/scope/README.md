# Planned quantities and actual equipment

Author: Andrew Fisher

Published v10.17 component. No live equipment record has been changed by this work.

Changing a planned quantity previously reused an earlier whole-location Complete tick. Increasing four received toilets to six planned toilets could report six received and installed, increase charges, and change the historical delivery run. This component preserves the item quantities already received and installed before the native quantity setter changes the plan.

The planned quantity and its preserved actual scope travel in one existing `qtys` document. Its numeric `v` stays unchanged in format; `scope1017` carries the dated baseline. The typed local `loads` entry is a persistence cache, excluded from native loads synchronisation. The companion sync module keeps decoding pure, handles offline merges and metadata-only refreshes, and preserves the baseline on exports and imports.

Receipt, work, identity and rate records retain their original stamps. Later explicit item receipts or work update their own quantities; changing another item does not complete the remaining scope. Confirmed actuals cannot be removed by lowering the planned quantity. A planned type change cannot silently relabel a protected received item. Other references continue using their existing readers.

Apply `patch_scope1017.py`, then `patch_scope_sync1017.py`. The separate `financial_scope` component is required to keep the corresponding hire, supplier and ledger projections on the same actual quantities.

Validation: 23 pure projection cases, the dedicated 27-case native sync fixture, and the full 85-case quantity, map, Inventory, Supplier, Build, actual costs and forecast fixture pass. The final combined page has SHA-256 `5c0925948ce16c940fe56874da22a8b2980d0f87f005e382e67cb583542dac9f`. The final fixture also verifies native per-unit unticking: the deleted labour value is read alongside its retained audit stamp, so a recorded untick remains effective.

The 390-pixel phone practice shows 12 of 14 installed, FWF 4 of 6, and two proposed outstanding FWF; all six Pee Panels and both toilet blocks remain complete. It restored the native record exactly. Service requests were GET only, with no browser errors or write attempts; shared record version remained 6075. Private evidence is under `/workspace/private-gc500-recheck14Oct2026/combined/scope/final-v2/`.

WC09 remains four received FWF, six received Pee Panels and two received toilet blocks. Whether Andrew's reinstated six FWF mean six total or six additional is still awaiting his clarification; this component does not enter that change.
