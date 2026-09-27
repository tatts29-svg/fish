# v7.01 — SWMS label: "checking the shared record…" rather than a false "not uploaded yet" (DRAFT)

Author: Andrew Fisher · 27 Sep 2026

- Andrew sent the SWMS pack (GC500_v521_Part15_SWMS.zip): "They should be in documents".
- Checked the live service (GET only): all five of the pack's documents are already on the shared record, the same bytes as the zip, under the names the page expects. They open from the view link:
  - Loading and unloading at third party sites (SWMS);
  - Portable buildings and toilets (SWMS);
  - Temporary fencing and crowd control barriers (SWMS);
  - G-Link light rail high risk work;
  - HSEQ Management Plan.
- Not on the service: Advanced Temporary Fencing's own SWMS. It was not in the zip.
- The bug: the Pre-starts page said the Coates SWMS was "not uploaded yet" for the first seconds after opening, until the file list arrived, then "Open the SWMS". It now says "checking the shared record…" until the service answers.
- Checked in the test browser: no errors. The Coates SWMS shows "Open the SWMS". In this run the service's file list arrived before the first read, so the "checking…" wording was not caught on screen; the change only alters that brief waiting state. Advanced's SWMS still reads "not uploaded yet", correctly.
