# VMS board arrival projection — v10.98 component

Author: Andrew Fisher

This bounded component lets an existing VMS register board's native plan record establish arrival and installation without creating another asset, changing its delivery association, or setting Finished. It links the existing plan position 24 to the existing VMS24 contract-board identity. Private fleet numbers, registrations and exact pins are supplied only through the authorised native record runner, not embedded in this source.

`patch_vms_arrival.py` exports `patch(text)` and makes no footer change. Compose after the other v10.98 components. The original contract identities, supplier, categories, rates and branch attribution remain unchanged. Today, Equipment, the VMS register and milestone readings share the same physical-board count. Installation and Finished stay separate.

Native `VMS1024.write` retains the existing `inPlace` and exact `lat`/`lon` fields. `arrival1098` contains `state`, a date-only `effective_date`, the actual `recorded_at` timestamp and `by`. `events1098` retains successive arrival/placement states in the same native load document, including the previous arrival when migrating a record. Historical readings choose the latest applicable event for the requested date. Unchecking placement clears installation while retaining confirmed arrival; an explicit departure or withdrawal of arrival confirmation changes arrival. Invalid dates, future effective dates and malformed coordinates are rejected before writes. Ordinary pin changes preserve existing histories.

The existing billing engine requires a delivery reference for these contract-board charges. This component does not invent that association or claim that missing charges have been finalised. The agreed owner must resolve any missing reference through the established business record before the current reference-based billing path can price it.

Validation: `node test_vms_arrival.cjs` exercises date and history handling, unticks, departures, deduplication, count parity and unchanged Finished. The private native dry-capture runner verifies only the requested register/load/audit documents change, exact coordinates survive, other boards and associations stay unchanged, and the remote record is unchanged by tests. Codex completed composition, final desktop/phone sweeps, guarded publication and the authorised native record writes. This component was published within the combined release, with exact read-back of its bounded native changes.

## Verified release

LIVE as part of v10.98, published 21 Oct 2026 at 10:34 AEST (`2026-10-21T00:34:17.108Z`). Release source `954087a8668b904d34e122a5c7532b4e0d945e34`; hosted SHA-256 `6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64` (18,637,777 bytes). Guarded publication and independent public read-back match exactly. The final composed page passed all 149 inline-script checks, desktop and phone sweeps (25 routes, seven links and Back), focused tests and independent component review. Claude review is not claimed.

The hosted page, authorised native record actions and existing servicing tracker are verified live. The tracker was updated once through native Manage with the same key; independent read-only recovery confirms the exact served crew card and tracker data match, all prior signatures and completions are preserved, and the full job record/version is unchanged by the tracker update. The refreshed private PDF is still pending; physical paper scans remain unverified. The separate v10.96 map draft remains paused with its owner. v10.99 remains NOT READY TO UPLOAD pending its own final checks.
