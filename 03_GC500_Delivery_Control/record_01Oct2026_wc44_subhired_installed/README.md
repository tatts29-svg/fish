# Record change, 1 Oct 2026: WC44 — sub-hired toilets in and installed

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026: "WC44 toilets are sub-hired and in and installed. Asset no 0146 0037."

A second write, after `../record_01Oct2026_wc33_subhired_installed/` (WC33, WC56, WC59, WC60 — written by Codex at
14:03). Same script, same three page functions, in the name "Andrew Fisher via Claude":

1. `subhireMark('WC44', 'Event Portables')` — the location is Event Portables gear.
2. `subhire744Many('WC44', 'Event Portables', '0146 0037')` — the two fleet numbers as Event Portables units.
3. `setDone('WC44', true)` — the complete tick; the page sets the light green, on site, with it.

Nothing else is touched. `rehearsal_result.json` is the rehearsal on the view link with every write blocked (what the
record holds for WC44 before, and what the three calls would record).

```
cd 03_GC500_Delivery_Control/record_01Oct2026_wc44_subhired_installed
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium DRY=1 node apply_through_the_page.js   # rehearse on the edit link, no write
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js         # the write
```
Writes `record_before.json`, `actions_log.json`, `record_after.json`. Status: **rehearsed, handed to Codex (holds the
key) at 14:20 AEST** — updated here when written and verified.
