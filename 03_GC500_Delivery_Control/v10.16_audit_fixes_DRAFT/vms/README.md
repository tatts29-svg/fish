# Current VMS assignments

Author: Andrew Fisher.

The shared physical-unit reader still exposed a moved board at its former source as well as its reviewed current destination. The older native row used a legacy description, so matching only the VMS description would miss it. Inventory counted ten onsite VMS units where the reviewed assignments identify nine.

This component projects explicit reviewed board assignments into the shared identity model. The source row remains available as nonphysical history, with its original description retained. Current inventory and asset search use the current destination. The original delivery receipt and planned quantity remain unchanged; no native record, contract, rate, cost, receipt, or charge writer is changed.

Unnumbered received units remain counted. A later physical replacement can fill a moved unit's place without subtracting the old move again. The replacement count is bounded by recorded receipts. The original-number presence guard prevents planned contract boards alone from reducing a partial received quantity.

The dated site instruction is used for historical reads only while it agrees with the current assignment. The generic board record edit timestamp is not a movement timestamp. Current identities are not replayed as historical replacement events; this adapter does not reconstruct events absent from the native record.

`patch_vms1016.apply(html)` patches the lexical shared model and adds the runtime with exact-match and repeat guards. The release integrator owns the full baseline hash guard and version footer.

Validation:

- `node test_vms1016.cjs`: 18 movement, identity, quantity, history, replacement, and unrelated-equipment fixtures.
- `python3 -m unittest discover -s . -p test_patch_vms1016.py`: four exact-source and repeat guards.
- `BASE=/path/to/baseline.html PAGE=/path/to/candidate.html OUT=/private/output node check_vms1016.cjs`: browser GET-only current identity, inventory, search, original delivery, shared-state, and complete financial-model comparisons. This uses the shared read-only browser helper and must never receive an edit URL.

Full browser snapshots include private operational and financial records; retain them outside the public repository. Only sanitized check results belong in `evidence/`.
