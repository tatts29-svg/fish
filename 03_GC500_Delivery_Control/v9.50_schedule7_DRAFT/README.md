# Schedule 7 source details and WAU requests

Author: Andrew Fisher

DRAFT. Focused checks pass on v9.48; final integration follows the separately owned v9.49 Baseplan update. No publication or operational record write is part of this patch.

Schedule 7 corrects the P45 docket, provides the Helen Park refrigerated-container docket, and adds an Events forklift-tine/second-docket note. These facts now use the existing source movements. P45 keeps its stable booking identity. The known Events forklift and its work/photos are retained; the Baseplan information area owns the distinct replacement-fleet discrepancy.

Two new WAU requests appear under 21 October's existing unreferenced schedule fold: one fridge and two portable air conditioners. The air conditioners are explicitly marked **SUB-HIRED — supplier not specified**. Customer, quantities and source cells are retained. No building reference, map location, fleet number, supplier, booking or price is invented. IDs T0273/T0274 are reserved against the entire DATA namespace, including fencing-only tasks.

These two product requests are not booked transport loads. They remain visible as source demand and do not acquire the legacy unreferenced-row average truck charge. The container docket is a detail of an existing movement; its existing financial source home is retained. All existing recorded dates, cancellations, unit corrections and approved arrival instructions remain authoritative.

The original workbook was read in full: 12 sheets, 2,969 nonempty cells, including hidden notes; four changed values and two new rows relative to Schedule 6. There are no formulas, business-row deletions or aligned style changes. Original files and detailed native-record/source comparisons remain private.

Validation:

- Source tests preserve every unrelated DATA field/reference, existing physical IDs and financial source fields, reject duplicate application and fencing-task ID collisions, and retain the explicit WAU sub-hire fact.
- The original-source test verifies the actual private XLSX hash and cells, including the absent fleets/dockets for the new requests.
- Strict GET-only native before/after check uses the same frozen record and clock. Fifteen financial models, physical unit/photo bindings, saved state, truck specifications and the approved arrival model are unchanged. The two requests add no transport loads or charges.
- Existing Timeline and print rendering show both requests. Phone and desktop screenshots were visually checked; no page errors or operational writes were observed.

Run `patch_v950.py` on an exact v9.49 final base (v9.48 is accepted for focused checks). Run `tests/source950.py BASE`, `tests/original950.py PRIVATE_ORIGINAL`, and the native `tests/browser950.cjs` with explicit BASE950, PAGE, STATE950 and private OUT950. Browser work uses the shared lock. Root owns final integration, final sweeps and publication.
