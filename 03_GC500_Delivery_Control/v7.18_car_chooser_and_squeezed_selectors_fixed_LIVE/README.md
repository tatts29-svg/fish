# v7.18: the car chooser works again (LIVE)

Author: Andrew Fisher

Andrew, 28 Sep 2026: "I cant see the car selection any more ... there is nothing to select".

The build scrub had squeezed six descendant selectors, so they matched nothing:
- the Special Editions list (the vehicle chooser) stayed empty;
- the showcase circuit canvas lookups failed;
- the map marker lists came back empty;
- two drawer link lists were not wired.

All six are fixed with \\x20.

Tested: the list shows all 7 vehicles, and picking Pallet Rocket stores and marks it, on desktop and phone.

**LIVE: 28 Sep 2026.** Verified byte for byte on the view link.
