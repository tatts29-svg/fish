Author: Andrew Fisher

This draft adds optional date-only installation and completion to the existing native setters. It stores the supplied effective day separately from the actual audit timestamp, preserves existing histories, and renders the supplied day without an invented time. The ordinary controls keep their existing exact-time behavior.

`installationOn1098.set(reference, day)` uses the existing named edit capability, installation control and Complete control. It refuses invalid/future dates, cancelled/moved/already-complete references, delivery shortages and later conflicting history. A completion proves the item was onsite by that day; the historical projection identifies that basis and leaves the arrival timestamp unknown. Existing onsite history remains untouched apart from the native current onsite confirmation.

The patch contains no operational record inputs. Apply `patch_installation_dates.patch(text)` when composing the reviewed candidate; record changes require a separate private native action after publication. It does not change quantities, ownership, map coordinates, rates or labour ticks.

Validation: `python3 test_installation_dates.py <base-page>` exercises native date validation, capability and history guards, actual audit versus effective timestamps, preservation of unrelated fields, ordinary exact-time controls, and proof merge/reset. Run the existing page checker on the composed candidate. Use the private write-blocked browser runner to verify current and historical completion, map wording, unchanged charges and the exact document diff before any record action.
