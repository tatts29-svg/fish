# WC09 additional FWF — native record update

Author: Andrew Fisher · 14 Oct 2026

Andrew clarified “Six additional” in the current chat after reinstating six FWF at WC09. Planned FWF quantity is now **10**: four already received/installed, six outstanding. This resolves the earlier six-total versus six-additional question.

The authorised update used the published page's `setQty('WC09','10')`, recording as Andrew Fisher via Codex. The original four physical units, receipt/install dates and Event Portables ownership remain unchanged. Six Pee Panels and two toilet blocks retain their original received/installed scope. No new asset, arrival or completed work was invented.

Native version **6075 → 6078**. Exactly three acknowledged document writes:

- `qtys/WC09`, including the existing v10.17 receipt-baseline metadata;
- `stamps/qtys~2f~WC09`;
- `by/qtys~2f~WC09`.

The full native record was backed up privately before writing. The gate compared each request against the staged document value; fresh server and browser readbacks matched the expected complete record. All other native documents were unchanged. The published page remains v10.17, SHA256 `d30833b57d59b2347c106193fa052edfda6c953801c513069af0ab6e05e00b5d`.

## Checks

Sixteen focused pre-write and applied checks pass. Nineteen fresh actual-public checks pass with no page substitution, page error or operational write attempt. The phone screenshot was inspected: 10 FWF planned, four received, mixed location 12 of 18 installed/12 received, six FWF remaining. Build and Event Portables use the same proposed 15 Oct run; pending FWF runs remain within 24 units per day. Map, Inventory and Today use the same revised scope; original actual charges and rates are retained. The proposed date is a delivery plan, not a receipt.

Independent fresh-public financial comparison passed **36 of 36 checks**. Existing actual customer charges, actual Direct costs, original rates/source rows and supplier Direct-cost job forecast are unchanged. Added customer forecast appears once in Event Portables Rehire, install/demob and delivery/pickup estimates, allocated to the existing KINP branch. The separate unposted card transport comparison remains an estimate, not a duplicate Direct-cost posting. Detailed cent-level deltas are retained privately.

Private evidence and financial captures: `/workspace/private-wc09-scope14Oct2026/`. The applied backup/log directory is `record_14Oct2026_wc09_scope_2026-10-14T09-03-27-482Z`. Raw records, monetary values and screenshots are not committed.

## Reproduction

`record_scope.cjs --practice` stages only the authorised four-to-ten change with every service write blocked. `--apply` requires the private edit binding and exact published page hash; it refuses a changed starting scope or identity list. It must **not** be rerun now that the update is complete.

`verify_public.cjs` opens a fresh public page and compares its projections against the private before/applied proof. Set `GC500_WC09_RECORD` to the applied private directory. Use the shared browser lock and normal Chromium/Node bindings. A later legitimate record change can make the exact historical comparison fail; review that change instead of overwriting it.
