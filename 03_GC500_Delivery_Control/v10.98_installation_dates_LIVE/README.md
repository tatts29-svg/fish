Author: Andrew Fisher

This live component adds optional date-only installation and completion to the existing native setters. It stores the supplied effective day separately from the actual audit timestamp, preserves existing histories, and renders the supplied day without an invented time. The ordinary controls keep their existing exact-time behavior.

`installationOn1098.set(reference, day)` uses the existing named edit capability, installation control and Complete control. It refuses invalid/future dates, cancelled/moved/already-complete references, delivery shortages and later conflicting history. A completion proves the item was onsite by that day; the historical projection identifies that basis and leaves the arrival timestamp unknown. Existing onsite history remains untouched apart from the native current onsite confirmation.

The patch contains no operational record inputs. Apply `patch_installation_dates.patch(text)` when composing the reviewed candidate; record changes require a separate private native action after publication. It does not change quantities, ownership, map coordinates, rates or labour ticks.

Validation: `python3 test_installation_dates.py <base-page>` exercises native date validation, capability and history guards, actual audit versus effective timestamps, preservation of unrelated fields, ordinary exact-time controls, and proof merge/reset. Run the existing page checker on the composed candidate. Use the private write-blocked browser runner to verify current and historical completion, map wording, unchanged charges and the exact document diff before any record action.

## Verified release

LIVE as part of v10.98, published 21 Oct 2026 at 10:34 AEST (`2026-10-21T00:34:17.108Z`). Release source `954087a8668b904d34e122a5c7532b4e0d945e34`; hosted SHA-256 `6a1d77fe216ab6a1088a89e75ebd4602bb24e084342881a5aa963448adc34e64` (18,637,777 bytes). Guarded publication and independent public read-back match exactly. The final composed page passed all 149 inline-script checks, desktop and phone sweeps (25 routes, seven links and Back), focused tests and independent component review. Claude review is not claimed.

The hosted page, authorised native record actions and existing servicing tracker are verified live. The tracker was updated once through native Manage with the same key; independent read-only recovery confirms the exact served crew card and tracker data match, all prior signatures and completions are preserved, and the full job record/version is unchanged by the tracker update. The refreshed private PDF is still pending; physical paper scans remain unverified. The separate v10.96 map draft remains paused with its owner. v10.99 remains NOT READY TO UPLOAD pending its own final checks.
