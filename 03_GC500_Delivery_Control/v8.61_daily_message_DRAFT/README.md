# v8.61 Personal daily-run messages: READY TO UPLOAD (not live)

Author: Andrew Fisher.

## Andrew's words

- **The request** (relayed through Codex's board entry and draft, 5 Oct 2026; the exact chat wording was not in the
  repo): a personal greeting with the recipient's name, the day's weather, a Take 5 reminder and the daily-run link.
  He followed up asking to remove the duplicate Timeline Email tile, because email is already inside the document
  groups, and to fix the missing Event Portables inventory access in Equipment.
- **The handover** (Claude chat, 5 Oct 2026, about this release): "I want you to finish 8.61 and upload it". Codex ran
  out of credits after `e24e829`.
- **Uploads** (Claude chat, 5 Oct 2026 ~22:40 AEST, about both agents publishing): "Approval is from me. You both upload."

## What changed

- **Message daily runs** (Timeline, a day's Day documents) now shows the text message inside its existing panel. It
  contains, in order:
  1. "Good morning, <first name>." (a title such as Mr or Dr is dropped; with no name it says "Good morning.");
  2. "GC500 - <run date>";
  3. the Surfers Paradise forecast for **that run date** (WeatherAPI first, Open-Meteo second, provider named), with
     days 8 to 10 labelled "outlook". A missing, stale (over 12 hours), past or beyond-ten-day forecast reads
     "Forecast unavailable for this day. Check conditions before starting." Another day's weather, or a current
     reading, is never used instead;
  4. a short Take 5 reminder;
  5. the daily-run link, last.
  The text is capped at 480 characters (the texting service's limit). The preview shows "[Daily run link]" until the
  real link exists.
- **Preview** waits up to about 10 s for the page's existing weather loaders (GET only) and pins the forecast it showed.
  **Send** checks that forecast again; if it changed, nothing is sent and it asks for a fresh preview.
- **Unchanged:** sending still happens only when someone presses "Text this day's deliveries" on the edit link. Edit
  permission, operator name, recipient match, current-record version checks, the two-minute preview expiry, the daily
  quota, the 40-reference cap, receipts, double-click and duplicate prevention, and the unknown-result lock all stay
  as they were. The view link cannot send.
- **Timeline:** the generic **Email** tile and the per-day Email menu are removed. Email stays inside the Drivers and
  Install document groups and on the Event Portables run sheets.
- **Equipment:** a "Print Event Portables inventory" button sits beside List / Cards / Share PDF and opens the existing
  v8.60 inventory PDF (Open / Print, Email with PDF, Save, Download email draft; nothing is sent automatically).
- There are no record, financial-model or backend changes, and no new network calls. The footer reads v8.61.

## Who did what

Codex implemented the change and the three v8.61 tests (draft `e24e829`). Claude took over the draft, rebuilt and
re-ran every check below, added the standing-suite runner (`run_standing861.sh`) and the synthetic screenshot
script (`shots861.cjs`), and froze this README. **Review: Claude self-review only.** The finishing session had no
tool to start a separate reviewer, so this release has **not** had an independent review. See the review section.

## Base and candidate

- **Base:** live v8.60, SHA-256 `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`, 10,993,891 bytes.
  Confirmed by a GET of the view link before the build, 5 Oct 2026 ~22:45 AEST.
- **Candidate:** `toolchain/build.sh v8.61 v8.61_daily_message_DRAFT/patch_v861.py` gives SHA-256
  `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`, 10,997,956 bytes. This is identical to Codex's
  last candidate. `check_page.py` passes: 11 inline scripts parse, 0 Google keys, 0 Mapbox tokens.

## Checks (all read-only on the candidate above; every write the page tried was aborted and counted)

| check | result |
|---|---|
| `test_weather861.cjs`: selected-date forecast, staleness, fallbacks, truncation, outlook | **20/20 pass** |
| `test_daily_send861.cjs`: isolated browser, fixture APIs only | **48/48 pass**, 0 external requests |
| `test_daily_ui861.cjs`: native laptop 1366 + phone 390, live GETs | **pass on both** (greeting, date, pinned forecast, Take 5, link last, view cannot send, day page references match, redraw keeps the preview, Email tile gone, supplier email kept, Timeline + Equipment inventory PDF 3 pages, records unchanged), 0 operational writes, 0 unexpected console errors (2 intentional Maps-session blocks) |
| `shots861.cjs`: synthetic recipient "Sam Example" only, laptop + phone | **34/34 pass**: 288 characters; forecast for Tue 06 Oct "Overcast, 20-23°C, 83% rain chance, wind to 34 km/h (WeatherAPI)"; 23 Oct and a past day read unavailable; no SiteIQ or agent/model names in the Timeline or Equipment text; 0 page/console errors; 0 attempted writes |
| sweep, desktop | 21 routes (15 shown; the 6 not shown are the view-only ones), 7 links, Back returns to `#plant`; 0 page errors, 0 console errors, **0 attempted writes** |
| sweep, phone | same: 21 routes, 7 links, Back, 0 page errors, 0 console errors, **0 attempted writes** |

**Standing suites** (`run_standing861.sh`), run on the candidate **and** on live v8.60, are in `evidence/standing_summary.log`:

| suite | candidate pass/fail | live v8.60 pass/fail |
|---|---|---|
| v799 desktop / phone | 22/1, 18/0 | 22/1, 18/0 |
| packed desktop / phone | 6/3, 3/2 | 6/3, 3/2 |
| equipment desktop / phone | crash (0/0) | crash (0/0) |
| results desktop / phone | 1/1, 1/1 | 1/1, 1/1 |
| one-tab desktop / phone | 10/4, 10/4 | 10/4, 10/4 |
| rules | 45/0 | 45/0 |
| fresh after a save | 11/0 | 11/0 |
| same figures | Today, Costs, Fencing, Questions, Coates Way, run sheet identical; Equipment differs only by "Print Event Portables inventory" | — |

Every failure appears identically on live v8.60. The FAIL lines and errors match after numbers are stripped. They come
from older suites written before Codex's v8.20 to v8.60 Today and Equipment changes; for example, the equipment
suite clicks a control that no longer exists. v8.61 introduces no new failure. The suites rewrote evidence in v7.95,
v7.99, v7.96_equipment_tab_LIVE and other folders, and that evidence was restored with `git checkout --`.

## Review (Claude self-review, not independent)

- **No automatic send.** Only the click handler on "Text this day's deliveries" calls `daily821Send`. Restoring a
  receipt never queues work. The base and the candidate have the same count of `/api/sms` calls, `fetch('/api/sms'` and
  `daily821Send(`. The added code has no `fetch`, POST or `setInterval`. The weather loaders it calls are the
  page's existing GET-only loaders, with their caches.
- **Safeguards preserved:** permissions, operator, recipient checks, quota, record version, duplicate and unknown
  locks are unchanged (diff inspected). The isolated send suite exercises each of them.
- **No contacts or message bodies in the repo:** the v8.61 files hold only synthetic fixtures (`04000000xx`, "Installer
  Alpha", "Sam Example"). Native-run screenshots that show real recipients were kept outside Git.
- **No SiteIQ, no agent or model names** added to the page. The page already carries older mentions in data and comments
  from earlier releases, unchanged in count; none shows in the Timeline or Equipment text.

## Limitations

- **Not independently reviewed.** A second reviewer may want to read `patch_v861.py` and the two source files
  before or after upload.
- The 480-character guard runs after the daily page is created and before any text is sent. If it ever tripped, a
  page would exist with no text sent, and the panel says so. With realistic names it cannot trip (288 characters
  with the forecast; about 340 with a full link).
- The forecast is the page's own WeatherAPI/Open-Meteo data, up to 12 hours old (the page's existing rule). Event
  days more than ten days out read "unavailable" until they come into range.
- The Take 5 wording is a short reminder written for this release; Andrew has not seen the exact sentence.
- Not tested: an actual send (never done in tests), or a real phone receiving the text.
- Uploading needs `GC500_EDIT_TOKEN`, which this Claude session does not have. **READY TO UPLOAD, not live.**
