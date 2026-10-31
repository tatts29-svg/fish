**COMPLETED — 1 Oct 2026 15:06 AEST. Author: Andrew Fisher.**

Applied through the page as Andrew Fisher via Codex; WC44 (2 units), WC71 (8) and WC67 (2) are recorded as sub-hired, complete and on site. Fresh service readback verified every scoped document. Record version 3406 → 3451; 45 new documents, zero deletions. Private before/after backups and audit logs are retained under `/workspace/private-record-review-wc44-01Oct2026/write-2026-10-01T05-05-56-542Z`; full record snapshots are not published. `completion.json` holds the compact verification record. Earlier preparation notes below are historical; do not rerun the original prepared script.

# Record change, 1 Oct 2026: WC44, WC71 and WC67 — sub-hired toilets in and installed

Author: Andrew Fisher · 1 Oct 2026

Andrew, 1 Oct 2026:
- "WC44 toilets are sub-hired and in and installed. Asset no 0146 0037."
- "WC71 here and installed. Sub-hired. Assets 0280 0116 0279 0293 0531 0644 0552 0490."
- "WC67 here and complete and installed. Assets no 0793 0769."

A second write, after `../record_01Oct2026_wc33_subhired_installed/` (WC33, WC56, WC59, WC60 — written by Codex at
14:03). Same script, same three page functions, in the name "Andrew Fisher via Claude":

For each of WC44 (2 units), WC71 (8 units) and WC67 (2 units):
1. `subhireMark(key, 'Event Portables')` — the location is Event Portables gear.
2. `subhire744Many(key, 'Event Portables', numbers)` — the fleet numbers as Event Portables units.
3. `setDone(key, true)` — the complete tick; the page sets the light green, on site, with it.

Nothing else is touched. `rehearsal_result.json` is the rehearsal on the view link with every write blocked (what the
record holds for each before, and what the three calls would record).

```
cd 03_GC500_Delivery_Control/record_01Oct2026_wc44_subhired_installed
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium DRY=1 node apply_through_the_page.js   # rehearse on the edit link, no write
GC500_EDIT_TOKEN=… CHROMIUM_PATH=/opt/pw-browsers/chromium node apply_through_the_page.js         # the write
```
Writes `record_before.json`, `actions_log.json`, `record_after.json`. Status: **rehearsed, handed to Codex (holds the
key) at 14:20 AEST** — updated here when written and verified.
