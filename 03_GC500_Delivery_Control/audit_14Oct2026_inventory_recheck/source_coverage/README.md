# Original equipment-source coverage audit

Author: Andrew Fisher · 14 Oct 2026

Read-only review against public v10.16, native record 6075. Reused the fresh shared snapshot from the quantities reviewer; this reviewer opened no extra browser and made no operational, application or original-file changes.

Original evidence checked:

- Latest Baseplan (2): all 11 sheets, 296 numbered worksheet rows, 295 unique contract lines. One exact duplicate is excluded from scope totals. All source rows were reread and keyed by contract plus line, not shifting spreadsheet row numbers.
- Schedules (6), (7) and (8): all 12 sheets each. Older uploads are not allowed to reverse later changes. Two genuinely new requirements in Schedule (8) have no existing operational request. Other differences are replacement identities, type/scope changes, or planned timing changes.
- Infrastructure programme: all 12 sheets compared with the previous copy. No equipment/quantity additions. Three completion annotations were added on a secondary sheet; corresponding site records already exist. Cloned sheets do not multiply equipment.
- BOQ: original PDF hash rechecked; complete earlier extraction has 186 facilities and 403 lines. Its units, cancelled scope and source discrepancies are retained as comparisons, not imported as current truth.
- Quote 27172: readable second PDF re-extracted and matched to the prior source text. The earlier same-named upload is protected and was not used. This is supplier fencing scope, not an inventory for every equipment category. Metres, physical units and movement quantities stay separate.
- Master declarations were cross-checked with the independent map reviewer. A drawn reference is not proof of a scheduled or installed asset; a general place label does not establish an exact drop point.

The current record contains 182 raw references: 176 are non-cancelled raw entries. Removing two explicit aliases leaves 174 active canonical references; excluding one historical relocation leaves 173 canonical operational references. Six cancelled entries remain as history. These are reference counts, not equipment-unit totals. Twelve latest Baseplan equipment lines remain without a unique operational receiving allocation. These are not twelve proven missing physical units: they include longstanding future/overlapping plant bookings, attachments, steps and a spare. Named VMS batches, generic container codes, concert aliases and package cable entries are not added again.

The private review workbook has exactly **Existing** and **Needs checking** tabs, with 23 and 22 concise rows. It includes contract/line, source file/sheet/row, quantity, current state and plain-language action. Confirmed arrivals, asset moves, cancellations and requested-versus-supplied distinctions are preserved. No prices or price totals are included.

Private originals, detailed source rows, identities and the user workbook remain outside Git. The private reconciliation and workbook are under the task's `private-gc500-recheck14Oct2026` evidence directory. `validate_coverage.py` checks these private inputs and emits only aggregate results; all 17 checks pass in `checks.json`.

This is coverage and source reconciliation, not a blanket physical-count, map-position or financial-accuracy certification. An old completion record still lacks a recoverable item identity; it was preserved. Existing source differences require targeted reconciliation rather than a wholesale Baseplan import.
