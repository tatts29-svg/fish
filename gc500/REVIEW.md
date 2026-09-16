# GC500 Delivery Control — review of the live site, 16 Sep 2026

Reviewed: `https://gc500-production.up.railway.app/v/Coates-GC500-2026#today`, as deployed at 17:33 AEST
on 16 Sep 2026 — **server v5.24** (pulled out of the running container) and the uploaded page
**build assets-1.0.0** (18.9 MB). Every finding below names the code it was read in.

What could and could not be read: the whole server, the whole stylesheet and HTML shell, and the last
490 KB of the app script (the timeline, documents, printing, import/merge, sync, showcase, Where we are,
board, weather, capability code). The first part of the app script — the state, `save()`, the Today hub,
the map, the register and the drawer — sits behind 18 MB of embedded pictures that the container reader
could not pull before Railway's agent quota ran out (see README, "Pulling the page"). Those parts were
not reviewed and nothing here claims to have.

## Repaired

### In the service (server v5.25, deployed)

| # | Where | Fault | Fix |
|---|---|---|---|
| S1 | `persist()` | Record writes were debounced but not serialised. A second write starting before the first was renamed into place reopened the same `records.json.tmp` with truncation, so a crash in that window left a partial record file, and `persist rename` errors could log for a write that had in fact landed. | One write at a time, a per-process temp name, and a queued follow-up write when a change arrives mid-write. Proven by a 25-write burst in `test/run.js`. |
| S2 | shutdown | Railway sends `SIGTERM` on every redeploy. A write still inside the 150 ms debounce was lost. | The record is flushed synchronously on `SIGTERM`/`SIGINT` before exit. Proven in `test/run.js`. |

### In the page, at runtime (overlay, repairs R1–R4 in `overlay/overlay.js`)

These are bridges: the same fixes belong in the next build of the page.

| # | Where (app script, line in the pulled tail) | Fault | Repair |
|---|---|---|---|
| R1 | `renderDocs()` — thumbnails bound at 1508, then `.doccard [data-open]` bound at 1520 | A drawing or plate thumbnail (`img.thumb[data-open="/f/…"]`) is first bound to open its file, then the later line binds **every** `[data-open]` inside the card to `openAsset()`. The second assignment wins, so tapping a drawing's cover hands a URL to the asset drawer instead of opening the PDF. | A capture-phase handler opens the file for `#pane-docs img.thumb[data-open]` when the value is a URL. **Build fix:** scope line 1520 to `.doccard button[data-open]`. |
| R2 | `finderPick()` 3092 | Picking a search result on a phone removes `search-open` from the body directly, bypassing `closeSearch()`, so `#searchBtn` keeps `aria-expanded="true"` and `SEARCH_FROM` is never reset. | The magnifier button follows the body class. **Build fix:** call `closeSearch({keepQuery:false, noFocus:true})` there. |
| R3 | `showReduced()` 4776 | The showcase honours the OS reduced-motion preference but ignores the page's own Tools → Motion: Off, so a person who turned motion off still gets the launch lights and auto-advance. | `showReduced` also returns true when `motionOff()` does. **Build fix:** the same one line. |
| R4 | `recordBytes()` 5552, called from `syncFooter()` | Reads the entire record out of `localStorage` (up to ~5 MB) on every poll, every 4 s while the tab is visible, plus every write and every footer redraw. On a phone that is a copy of several megabytes fifteen times a minute for a number that changes once a day. | The measurement is cached for 20 s. **Build fix:** cache it in `persist()`/`save()` where the record is written. |

## Found, not repairable from outside the build

| # | Where | Fault | Suggested fix |
|---|---|---|---|
| B1 | `timeOfStamp` 1836 (a `const`, so not patchable at runtime) | Uses `hour12:false`, which some ICU builds render midnight as `24:05`. The page already guards this in `brisStamp()` ("en-GB with hour12:false writes midnight as 24 on some builds") but not here, so the delivery advice and the handover sheet can print `24:05` for a light set just after midnight. | Use `hourCycle:'h23'` as `tpodParts()` does, or map `24` to `00`. |
| B2 | `scanned()` / the scanner listener 1729–1741 | The barcode-scanner burst detector runs on keys typed in the search box. A fast typist (under 150 ms between keys) who presses Enter with no finder match is treated as a scan: the buffer is pushed into the search and the page jumps to the Register. | Require the burst to have started outside a text field, or a minimum burst length of 6 with no finder open. |
| B3 | `showScene('countdown')` 4813 | `kick(esc(DATA.event.name))` — `kick()` escapes again, so an `&` in the event name renders as `&amp;` on the first showcase scene. | Drop the inner `esc()`. |
| B4 | `photoRedraw()` 1202 | When the file registry settles it calls `render()` regardless of whether somebody is typing, unlike `syncRedraw()` which waits. Opening an asset cold starts a registry fetch; a note typed in the drawer in that window is redrawn under the person. | Route it through `syncRedraw()`'s typing guard. |
| B5 | `boardWxNote()` 4056 | The caption text is built with `esc()` and then placed with `textContent` on refresh (4391) but as HTML on first draw (4240). Harmless today because the weather fields carry no markup, but the two paths will disagree the day one does. | Pick one: build plain text and always use `textContent`. |
| B6 | `adviceSheet()` 2064–2065 | `window.print()` is called after a flat 60 ms and the `dropping` class is removed on a 15 s timer whatever the dialog is doing — the pattern the V11 audit replaced everywhere else with a preflight. | Use `paperOpen()`'s font-settled path, as the handover sheet does. |

## What was looked at and found sound

- Token handling (`same()` is constant-time; view/edit split is enforced on every write route; the admin
  page only opens on the edit token).
- Upload validation, file kinds, filing rules, Range serving, drop-card CSP.
- SMS/email caps, dry runs, GSM/UCS-2 counting.
- Import validation (`validateRecords`), the merge (`mergeRecords`) including tombstones and stamps,
  the sync queue/in-flight rules from the 14 Sep and V11 audits, the REST backend's version gate.
- Print preflight, drop-sheet fitting, the LED board, the timing pod, the capability model.
- The stylesheet: no rule found that breaks layout; the drawer, phone bar and day-table-as-cards rules do
  what their comments say.

## What the overlay adds (the "glow and move" brief)

Every item obeys Tools → Motion: Off and the OS reduced-motion setting, and none of it prints.

- **Header:** a carbon weave under the bar, a soft light under the orange hairline, a bright streak that
  crosses it every nine seconds, the GC500 wordmark lit, the chequer running under the pointer, the
  seconds digit on the lap timer catching the light as it changes.
- **Arriving on a tab:** cards, tiles, plates and the day strip assemble with a 40 ms stagger; every
  gauge, bar and meter fills from the left; a day card's light bar pours in. Only after a person changes
  tab or presses something — never on a background sync.
- **Pressing:** a ring of light spreads from under the finger on every button; a shaped card brightens its
  edge; the day just chosen takes one pass of gloss across its livery.
- **Pointer (laptops only):** every card, tile, plate, instrument and equipment card leans up to four
  degrees toward the pointer with a specular light following the cursor across its face, and settles when
  it leaves. The map stage, the signal banks, the timing pod and the record strip glow at the edge.
- **Figures:** every headline number rolls from 0 to its value the first time this device sees it and when
  it changes — never on a repaint of the same value (the dial's own rule).
- **Crispness:** antialiased type everywhere, composited layers for anything that transforms so nothing
  blurs, all effects drawn with gradients rather than images so they are sharp at any pixel density.

Kill switch: set `OVERLAY=off` on the Railway service. The page goes out byte-for-byte as uploaded.
