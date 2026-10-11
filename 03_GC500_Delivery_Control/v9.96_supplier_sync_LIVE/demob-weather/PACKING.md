# Native Demob physical loads — draft

Author: Andrew Fisher

`packing996.py` exports `patch(html)`. Compose after the supplier and Demob weather patches; the stock adapter may come before or after it. It reads the full native future programme, not the supplier's current-on-site inventory subset.

- Canonically identified Event Portables 16-pan blocks each get their own supplier truck. Exact physical IDs and asset numbers remain on native truck cards, print sheets and draft email. All residual items stay with their existing native branch and programme date. Unknown/conflicting identity or ownership is never assigned to Event Portables by this adapter.
- Existing dated supplier portable loads are split only where needed for 24 total units and at most six pee panels. Each original native load keeps its first exact ID; extra physical loads have suffixed IDs. Coates load capacities, native branch filters, dates, travel assumptions, stop ordering and pump-out gate are retained.
- A saved mixed-item portion with no item breakdown remains labelled “item split to confirm”. Possible panels limit its capacity conservatively; no unrecorded item composition is asserted.
- Weather daily counts already read `trucks816`, so they include the same dedicated physical block trucks. Whole-reference completion still reads recorded collection evidence against the original full reference quantities.

Pure capacity/identity/scope tests: 13 passed. Demob evidence model: 24 passed, including the guard against crediting a partial original portion to multiple derived trucks. First browser attempt ended at Chromium `newPage` with a machine resource/target crash before any application assertions; no runtime pass claimed yet. Native cards, print, email, WC31 accessible residual, daily weather count and record/P&L preservation are covered by the prepared read-only browser test, pending the next browser slot.

Commands from `03_GC500_Delivery_Control`:

```sh
node v9.96_supplier_sync_DRAFT/demob-weather/tests/packing996.cjs
flock /tmp/gc500-browser.lock timeout 210s env CHROMIUM_PATH=/usr/bin/chromium PAGE=/path/to/candidate.html node v9.96_supplier_sync_DRAFT/demob-weather/tests/packing-browser996.cjs
flock /tmp/gc500-browser.lock timeout 210s env CHROMIUM_PATH=/usr/bin/chromium PAGE=/path/to/candidate.html MOB=1 node v9.96_supplier_sync_DRAFT/demob-weather/tests/packing-browser996.cjs
```
