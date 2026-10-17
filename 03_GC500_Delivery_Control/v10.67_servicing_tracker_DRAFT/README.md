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
- Draft patch on the current v10.66 candidate passed `check_page.py` (142 scripts). This is development evidence,
  not a final source/hash or release read-back; rebuild after the final v10.66 and card sources settle.

Pending: actual-page phone screenshot inspection and local server v5.90 integration, both standard sweeps and
current live-base guarded build. No page, card or operational record has been published by this draft.

The new `tests/test_actual_page.cjs` runs the full candidate against v5.90 on localhost with a disposable private
record store and all outside networking intercepted. Its first run confirmed TEST/event creation, exact HTML/CSP
read-back, same-token signatures and stale-progress recovery, but exposed an inherited main-page boot race:
`syncFirst` can reach `ScopeSync1017` before that extension is registered; the existing backend catches the exception
and can report live without the first merge completing. Root owns the main-page fix. Final integration remains
blocked until the corrected v10.66 base is rebuilt; the test now waits for every initial collection merge as well
as the live/ready signals. `GC500_DEBUG_BOOT=1` only adds catch logging to the disposable test copy to diagnose it.

The print download path was also exercised with a synthetic TEST bundle: all 55 pages rendered with its actual
rehearsal day and confirmed fixture contact, and no event dates. Seven print readiness checks pass. The existing
full 42-check PDF/QR suite covers all completion/location code decoding; physical phone scans remain an operator check.

## Inputs kept honest

No contact has been invented. The real creation/print flow requires it. T0024 keeps its workbook area 1 grouping and
its master-plan SUPPLY position, shown as a separate far map. Seven unpinned references continue to say to ask on site;
no directions or coordinates are guessed. Opening the public view link to tracker progress remains a separate choice.
