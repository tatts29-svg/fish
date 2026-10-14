# Planned quantities and actual equipment

Author: Andrew Fisher

Draft v10.17 component. No live equipment record has been changed by this work.

Changing a planned quantity previously reused an earlier whole-location Complete tick. Increasing four received toilets to six planned toilets could report six received and installed, increase charges, and change the historical delivery run. This component preserves the item quantities already received and installed before the native quantity setter changes the plan.

The planned quantity and its preserved actual scope travel in one existing `qtys` document. Its numeric `v` stays unchanged in format; `scope1017` carries the dated baseline. The typed local `loads` entry is a persistence cache, excluded from native loads synchronisation. The companion sync module keeps decoding pure, handles offline merges and metadata-only refreshes, and preserves the baseline on exports and imports.

Receipt, work, identity and rate records retain their original stamps. Later explicit item receipts or work update their own quantities; changing another item does not complete the remaining scope. Confirmed actuals cannot be removed by lowering the planned quantity. A planned type change cannot silently relabel a protected received item. Other references continue using their existing readers.

Apply `patch_scope1017.py`, then `patch_scope_sync1017.py`. The separate `financial_scope` component is required to keep the corresponding hire, supplier and ledger projections on the same actual quantities.

Validation in progress: 21 pure projection cases and the dedicated 27-case native sync fixture pass. The full quantity, map, Inventory, Supplier, Build, actual costs and forecast fixture is being rerun on the final components. Service requests are GET only; all practice changes are confined to the browser and restored afterward.

WC09 remains four received FWF, six received Pee Panels and two received toilet blocks. Whether Andrew's reinstated six FWF mean six total or six additional is still awaiting his clarification; this component does not enter that change.
