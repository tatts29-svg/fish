# VMS board arrival projection — v10.98 component

Author: Andrew Fisher

This bounded component lets an existing VMS register board's native plan record establish arrival and installation without creating another asset, changing its delivery association, or setting Finished. It links the existing plan position 24 to the existing VMS24 contract-board identity. Private fleet numbers, registrations and exact pins are supplied only through the authorised native record runner, not embedded in this source.

`patch_vms_arrival.py` exports `patch(text)` and makes no footer change. Compose after the other v10.98 components. The original contract identities, supplier, categories, rates and branch attribution remain unchanged. Today, Equipment, the VMS register and milestone readings share the same physical-board count. Installation and Finished stay separate.

Native `VMS1024.write` retains the existing `inPlace` and exact `lat`/`lon` fields. `arrival1098` contains `state`, a date-only `effective_date`, the actual `recorded_at` timestamp and `by`. `events1098` retains successive arrival/placement states in the same native load document, including the previous arrival when migrating a record. Historical readings choose the latest applicable event for the requested date. Unchecking placement clears installation while retaining confirmed arrival; an explicit departure or withdrawal of arrival confirmation changes arrival. Invalid dates, future effective dates and malformed coordinates are rejected before writes. Ordinary pin changes preserve existing histories.

The existing billing engine requires a delivery reference for these contract-board charges. This component does not invent that association or claim that missing charges have been finalised. The agreed owner must resolve any missing reference through the established business record before the current reference-based billing path can price it.

Validation: `node test_vms_arrival.cjs` exercises date and history handling, unticks, departures, deduplication, count parity and unchanged Finished. The private native dry-capture runner verifies only the requested register/load/audit documents change, exact coordinates survive, other boards and associations stay unchanged, and the remote record is unchanged by tests. Root owns composition, final desktop/phone sweeps, guarded publication and authorised actual native record writes. This component alone is not a live release.
