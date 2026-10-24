Author: Andrew Fisher

VERIFIED LIVE — 8 Oct 2026, 14:28 AEST. The guarded uploader confirmed exact public bytes. Implemented and independently reviewed in this task. Native form, roster/slot, persistence-failure, phone contrast and desktop/phone navigation checks passed. Existing page source/data preservation and script/secret checks passed. Claude received the reusable API handover; this does not claim his independent code review. Detailed evidence remains private.

The existing Crew form now offers names from the selected date’s labour forecast. Day availability is saved explicitly, then each task selects a person and their roles. Picking a task name never changes the available headcount.

Existing zero/unknown counts, manual names, blank person-number positions, legacy assignments and historical blank times are preserved. An unnamed person number remains a person; “To be assigned” remains an unallocated requirement. Naming a used number shows the references affected. Stale editors must reload, duplicate new names are refused and day saves retain unsaved task fields. The interface keeps native persistence and unsaved-record feedback. Crew buttons, time selectors and name selectors use readable colours.

No attendance, traffic, financial or operational records are changed by installing the patch.

Integration API on `window.StaffNames910`:

- `roster(day)`, `day(day)`, `mappingToken(day)`, `planToken(day, ref)`.
- `saveDay(day, values, expectedMappingToken[, originEditor])`, where values is `{count: null|0..50, names: [nameByStableSlot]}`.
- `savePlan(day, ref, values, expectedMappingToken, expectedPlanToken[, originEditor])`, where values contains order, people (slot and roles), start, finish and location.
- `captureTask(editor)` and `refresh(editor)` support the existing form.

Take mapping/plan tokens when the editor opens and pass them unchanged at save. Save methods return `{accepted, kept, reason}`. `kept` means native local persistence retained the change, not proof of remote synchronisation. Roles are spotter, forklift, installer and escort; multiple roles in one row remain one person.

Build with `patch_v910.py BASE OUTPUT`. `test_patch910.py BASE` proves exact preservation of existing page source/data. `tests/test_staff910.cjs` covers the pure roster and slot rules. `tests/test_staff_actual910.cjs` exercises native form saves with synthetic people and captured persistence. Detailed screenshots and test evidence are kept in the private release folder.
