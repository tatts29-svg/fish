# v10.67 servicing tracker — DRAFT, not ready to publish

Author: Andrew Fisher · 18 Oct 2026

This page change follows v10.66 and the server v5.90 servicing fixes. It reads the crews’ separate tracker on Event
nights and adds deliberate edit-only Create / update actions. It never writes the job record, a delivery or a charge.

The progress headline uses the same figures as the crew card: completed references and completed unit-weighted jobs.
Every area shows Pumped out, Fresh water refilled, Cleaned & restocked and, on the final night, Locked & confirmed
empty separately. The one `panel_mockup/state.js` supplies both pages’ maths. An unfinished 99.x% stays 99%.

The panel is a sibling above the existing Event nights pane. The run sheet’s redraw cannot replace it, its open areas
are retained, and polling does not redraw the run sheet. GET `/api/ticks` is bounded by the v5.90 cursor; a changed
snapshot epoch or tracker definition restarts the read. Partial reads never become a verified percentage. Failed reads
keep the last verified figures with an explicit message. Only the connected edit authority may read tracker tokens;
losing edit access clears the private panel and creation form. The view link remains unchanged pending Andrew’s choice.

## Creation workflow

1. Open Event nights on the edit link and expand **Manage servicing tracker**. Enter the confirmed servicing contact.
   An existing event tracker’s contact can fill the form from server metadata; it is not kept in browser storage.
2. Choose **Create / update TEST tracker** and confirm. TEST uses the service’s actual current day, so rehearsal ticks
   can be made before the event. It has a clearly separate load, title and visible TEST heading.
3. Complete the TEST rehearsal. The test automation runs against a local service or intercepted fixture, never as
   test writes to the live service. The publication button is a deliberate operator action only.
4. Confirm the TEST checks and event site directions, then choose **Create / update event tracker**. The event keeps
   the agreed four service days and reference list. Creation requires a current server connection and edit authority.
5. An update explicitly confirms reuse of the existing token. A concurrent creator’s `tracker_exists` response offers
   the same-token update for confirmation. A lost key stops the action; no rekey or withdrawal button is offered.
6. **Saved and read back** appears only after tracker metadata and served crew HTML match the posted payload exactly.
   Then open the crew card or download its private QR links file, which includes the exact published days and contact
   for the print generator. A failed verification says not to print.
7. Produce a TEST print pack, complete physical iPhone/Android scan checks, then generate the real pack with its
   matching private readiness receipt. The print generator’s README gives the receipt fields and guards.

The panel labels TEST/other trackers separately and uses their actual configured service days. It automatically picks
only a unique active event tracker. It refuses percentages when reference quantities, line kinds or job plans differ
from this page’s source; it does not substitute another list silently.

## Files and validation so far

- `patch_v1067.py`: guarded on v10.66, refuses repeat, uses the shared `rep` helper; embeds the card builder’s current
  source with a unique data slot and keeps the existing map scripts and pin allowlists unchanged.
- `servicing1067_src.js`: edit-only display, background reading and independent container.
- `admin1067_src.js`: explicit creation/update, confirmed contact, read-back and private link download.
- `tests/test_panel.cjs`: 10 local checks passed (shared totals, nouns, per-job progress, escaping, paging, void epoch,
  cursor stalls and partial-read refusal).
- `tests/test_admin.cjs`: 19 local payload assertions passed (TEST current day, event dates/quantities, contact/clock
  requirements and unchanged source data).
- `tests/test_panel_browser.cjs`: 28 checks passed at 360 and 1280 px with zero page errors/network writes,
  including the TEST next-day-label regression. All responses are local fixtures.
- Existing shared state suite: 51 passed, including exact shared-source inclusion and random event-order checks.
- Actual full-page/native-server integration: **22/22 passed**, including fully merged boot, whole-state isolation,
  create/update/read-back, downloaded TEST bundle, stale reads, immediate access-loss clearing and fresh-view privacy.
  Zero page errors or attempted operational-record writes; the server record stayed byte-for-byte identical.
- Draft patch passed `check_page.py` (142 scripts). The phone screenshot was inspected: controls and saved state are
  readable at 390 px without horizontal overflow. This is development evidence, not a release read-back.

Current tested page: `bb57d139e0aacf5e0f193e5238c260a7e28ef2f40f52d8eba2843fd91b9dabc9`
(18,465,137 bytes), on boot-corrected v10.66 `08a8d9c13cf185de9f5c8db39cebb7d4d3f82acf44b15d8f5dc0b0fde3f078b3`,
against final server `55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec`.
`tests/actual_page_results.json` binds the sanitized evidence to those exact sources.

Pending: both standard sweeps and the current live-base guarded build. Rebuild/retest if the v10.66 base changes.
The server is staged separately and Claude owns the Railway switch; no machine import or page publication precedes
confirmation. No page, card or operational record has been published by this draft.

`tests/test_actual_page.cjs` uses the real page and final v5.90 on localhost, a disposable private record store and
intercepted outside networking. It waits for every initial collection merge plus live/ready signals. Before tracker
operations it verifies the native first redelivery's exact empty-map normalization (absent `mapKeys` → `{}`), then
requires the second redelivery and all later tracker actions to preserve the entire state. No field is excluded from
that assertion. The full-page test confirmed the corrected boot path; `GC500_DEBUG_BOOT=1` is diagnostic only and
was not used for the passing evidence.

The print download path was also exercised with a synthetic TEST bundle: all 55 pages rendered with its actual
rehearsal day and confirmed fixture contact, and no event dates. Seven print readiness checks pass. The existing
full 42-check PDF/QR suite covers all completion/location code decoding; physical phone scans remain an operator check.

## Inputs kept honest

No contact has been invented. The real creation/print flow requires it. T0024 keeps its workbook area 1 grouping and
its master-plan SUPPLY position, shown as a separate far map. Seven unpinned references continue to say to ask on site;
no directions or coordinates are guessed. Opening the public view link to tracker progress remains a separate choice.
