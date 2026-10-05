# v8.61 Personal daily-run messages: READY TO UPLOAD (not live), review fixes applied

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
  The text is capped at 480 characters (the texting service's limit). The length is checked **before the daily page
  is published**, against the longest link the page will use (`location.origin + '/d/' + 64 characters`; the live
  server issues 32), and the preview runs the same check, so a text the preview accepts always fits when it is sent.
  The first name is capped at 30 characters. The preview shows "[Daily run link]" until the real link exists.
- **Plain text only.** The whole text uses the GSM-7 alphabet, so each part carries 160 characters, not 70: the
  temperature reads `20-23C` (no degree sign), and curly quotes, dashes and accents in a name, a date or a forecast
  become plain letters (`O’Brien` → `O'Brien`, `–` → `-`, `Seán` → `Sean`).
- **Preview** waits up to about 10 s for the page's existing weather loaders (GET only) and pins the forecast it showed.
  **Send** checks that forecast once, before anything is published; if it changed, nothing is published or sent and
  it asks for a fresh preview. The text then uses that pinned forecast; there is no second weather check after the
  page is published, so a forecast refresh during publishing can no longer leave a page with no text.
- The text does not say "Coates" (Andrew's call, N7). It starts with the greeting.
- **Unchanged:** sending still happens only when someone presses "Text this day's deliveries" on the edit link. Edit
  permission, operator name, recipient match, current-record version checks, the two-minute preview expiry, the daily
  quota, the 40-reference cap, receipts, double-click and duplicate prevention, and the unknown-result lock all stay
  as they were. The view link cannot send.
- **Timeline:** the generic **Email** tile and the per-day Email menu are removed. Email stays inside the Drivers and
  Install document groups and on the Event Portables run sheets. "Copy the email text" now lives only in the PDF
  dialogs those groups open (N2); the Timeline plate no longer offers it on its own.
- **Phone day plate (760 px and narrower):** Message daily runs sits beside Install, in the place Email left, instead
  of a hole beside Install; Edit keeps its full last row. Only the tile's grid position changed (arranged, not
  restyled). The laptop plate is unchanged: one row of five.
- **Equipment:** a "Print Event Portables inventory" button sits beside List / Cards / Share PDF and opens the existing
  v8.60 inventory PDF (Open / Print, Email with PDF, Save, Download email draft; nothing is sent automatically).
- There are no record, financial-model or backend changes, and no new network calls. The footer reads v8.61.

## Who did what

Codex implemented the change and the three v8.61 tests (draft `e24e829`). Claude took over the draft, rebuilt and
re-ran every check, added the standing-suite runner (`run_standing861.sh`) and the synthetic screenshot script
(`shots861.cjs`). **An independent review** (5 Oct 2026, on candidate `a02c7b5e`)
then found the issues below; Claude applied its fixes in this revision and re-ran every check. The reviewer has not
re-reviewed the fixed candidate; its strand cases are now part of `test_daily_send861.cjs` and pass. Codex has not
reviewed v8.61.

## Base and candidate

- **Base:** live v8.60, SHA-256 `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`, 10,993,891 bytes.
  Confirmed by a GET of the view link before the build, 5 Oct 2026 ~22:45 AEST.
- **Base re-checked:** GET of the view link at 23:27 AEST, 5 Oct 2026: still `ae6880d9…`, 10,993,891 bytes.
- **Candidate:** `toolchain/build.sh v8.61 v8.61_daily_message_DRAFT/patch_v861.py` gives SHA-256
  **`fa9e62b9ee8cbb763bc6bd17e418a9c10ceeac41eba6af4484176623b5d21c0f`, 11,000,316 bytes**. `check_page.py` passes:
  11 inline scripts parse, 0 Google keys, 0 Mapbox tokens. (Superseded: `a02c7b5e…`, 10,997,956 bytes, the
  candidate the review was done on.)

## Checks (all read-only on candidate `fa9e62b9…`; every write the page tried was aborted and counted)

| check | result |
|---|---|
| `test_weather861.cjs`: selected-date forecast, staleness, fallbacks, truncation, outlook, **GSM-7 plain text** | **21/21 pass** |
| `test_daily_send861.cjs`: isolated browser, fixture APIs only | **53/53 pass**, 0 external requests, 0 page errors. The same file on the old candidate `a02c7b5e` fails 9: exactly the 9 cases added or changed for the review (`evidence/send861_on_old_candidate_a02c7b5e.json`) |
| `test_daily_ui861.cjs`: native laptop 1366 + phone 390, live GETs | **pass on both** (greeting, date, pinned forecast, Take 5, link last, worst-case text GSM-7 and ≤480, no "Coates", view cannot send, day page references match, redraw keeps the preview, Email tile gone, supplier email kept, **phone: Message beside Install, Edit full row; laptop: one row**, Timeline + Equipment inventory PDF 3 pages, records unchanged), 0 operational writes, 0 unexpected console errors (2 intentional Maps-session blocks) |
| `shots861.cjs`: synthetic recipient "Sam Example" only, laptop + phone | **44/44 pass**: 287 characters with the placeholder, 377 with the worst-case link; forecast for Tue 06 Oct "Overcast, 20-23C, 83% rain chance, wind to 34 km/h (WeatherAPI)"; GSM-7 only; 23 Oct and a past day read unavailable; every phone plate row full (5 tiles, 3 rows); no SiteIQ or agent/model names in the Timeline or Equipment text; 0 page/console errors; 0 attempted writes |
| sweep, desktop | 21 routes (15 shown; the 6 not shown are the view-only ones), 7 links, Back returns to `#plant`; 0 page errors, 0 console errors, **0 attempted writes** |
| sweep, phone | same: 21 routes, 7 links, Back, 0 page errors, 0 console errors, **0 attempted writes** |

**Send test cases added or changed for the review** (all fixture-only; no real text, no record write):
- *Text over the length limit is refused before any daily page is published* (was: "fails before any SMS", which
  accepted a page with no text): 0 pages, 0 texts, "No daily page was published".
- *Long name (400 characters)*: capped at 30 in the greeting; the page and the text both go, 480 or fewer characters.
- *Strand boundary, fits / one over*: the date is padded until the worst-case text is exactly 480. At 480 the preview
  shows the text and the send (with a 64-character link) publishes and texts 480 characters; at 481 the preview says
  too long and the send publishes nothing.
- *Forecast changing / expiring during publishing* (was: "page created, no text"): the page and the text both go, and
  the text carries the forecast pinned before publishing.
- *GSM-7 only*: a name, date and forecast full of curly quotes, en dashes, accents and a degree sign send as plain
  GSM-7 characters only.
- *Rejected text*: after the service rejects it, the panel shows "Message preview" again, not "Message text / Check
  delivery below" (N4).
- *Storage refusal* reads "...before texting; no text was submitted." with its space (N1).

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

Run 5 Oct 2026 13:35 UTC on candidate `fa9e62b9…`. The log header names `0d4f37c`, the parent commit: the run used this commit's patch and sources before they were committed. Every failure appears identically on live v8.60: the FAIL and error
lines match after numbers are stripped, suite by suite. They come from older suites written before Codex's v8.20 to
v8.60 Today and Equipment changes; for example, the equipment suite clicks a control that no longer exists. v8.61
introduces no new failure. The suites rewrite evidence in other release folders; the runner put it back
(`git checkout --`) and nothing outside this folder is changed.

## Independent review and how each finding was resolved

Independent reviewer, 5 Oct 2026, on candidate `a02c7b5e`, with its own send test
(`strand861.cjs`: 45/49 on that candidate, the 4 failures all "daily page created, no text sent").

| finding | what it was | resolved |
|---|---|---|
| **S1** stranded page | The 480-character check ran after the daily page was published, and a second weather check after publishing could refuse the text. A long first name, or the forecast refreshing while the page published, left a published page with no text. The preview checked a shorter placeholder than the real link, so it could pass a text the send then refused. | The text is built and length-checked **before** publishing, with the worst-case link `location.origin + '/d/' + 64 characters` (the page defines no maximum; the live server issues 32). The preview runs the same check. The post-publish weather check is gone; the text uses the forecast pinned before publishing. First names are capped at 30 characters. Reviewer's strand cases added; the two old cases that accepted "page created, no text" now require no page, or page and text. |
| **S2** message size | The degree sign (and any curly quote or en dash) forced the whole text out of GSM-7 into the 70-characters-a-part (UCS-2) encoding: the reviewer's 346-character sample (with a real-length link) went as 6 parts; without the degree sign it is 3. | `20-23C`; every part of the text passes through a GSM-7 filter (`daily861Gsm`). Tests assert GSM-7 only, in the isolated send test, the weather test and on the native page. |
| **S3** phone plate hole | Removing Email left an empty cell beside Install on a phone. | Message daily runs sits beside Install at 760 px and narrower; Edit keeps the full last row. Phone screenshots (kept outside Git with the other screenshots): before `timeline-plate-phone-BEFORE-a02c7b5e.png`, after `timeline-no-email-tile-phone.png`. |
| **N1** | "before texting;no text was submitted." The patch helper swallowed the space. | Restored: "texting; no text was submitted." (patch anchors on `s.rows=[];throw Error(...` so the space is kept). |
| **N2** | Where "Copy the email text" lives now the Timeline Email tile is gone. | Recorded: it now lives only in the PDF dialogs. No code change. |
| **N4** | After a rejected text, the panel kept showing "Message text / Check delivery below". | Cleared when the service rejects the text; the panel shows the preview again. |
| **N7** | The text no longer says "Coates". | Andrew's call: kept as is. Recorded above. |

**Still true from the first self-review:** only the click on "Text this day's deliveries" calls `daily821Send`;
restoring a receipt never queues work; the base and candidate have the same count of `/api/sms` calls; the added code
has no `fetch`, POST or `setInterval`. Permissions, operator, recipient checks, quota, record version, duplicate and
unknown locks are unchanged. The v8.61 files hold only synthetic fixtures. No SiteIQ, agent or model names were added
to the page.

## Limitations

- **Not yet re-reviewed.** The independent reviewer saw `a02c7b5e`, not this fixed candidate; the fixes are covered
  by its own strand cases, now in the send test. Codex has not reviewed v8.61.
- **The rest of the review's minor notes** (N3, N5, N6) were not itemised in the handover to this session, so they
  are not changed here and are not described in the reviewer's words. They are carried as known, unfixed nits.
- **Still possible after publishing, as before v8.61** (v8.21 behaviour, unchanged): if the shared record or the
  chosen recipient changes while the page is publishing, the page exists and no text is sent; the panel says so. A
  link longer than 64 characters would also be refused after publishing; the live server issues 32.
- **Phone, Equipment:** with "Print Event Portables inventory" added, "Share PDF" wraps onto a second line of the
  tools row (screenshot `equipment-tools-phone.png`). Nothing is cut off.
- **Phone, Timeline:** at half width the Message daily runs tile wraps its title to two lines, so the Install row is
  a little taller than the Pre-start row.
- The forecast is the page's own WeatherAPI/Open-Meteo data, up to 12 hours old (the page's existing rule). Event
  days more than ten days out read "unavailable" until they come into range.
- The Take 5 wording is a short reminder written for this release; Andrew has not seen the exact sentence.
- Not tested: an actual send (never done in tests), or a real phone receiving the text.
- Uploading needs `GC500_EDIT_TOKEN`. **READY TO UPLOAD, not live.** Andrew approved upload; either agent may upload,
  from a fresh build of this source with `toolchain/upload_page.py`.
