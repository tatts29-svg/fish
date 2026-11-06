## v6.69 — 26 Sep 2026 — clean, quick and joined up

Andrew: "Can we check all pages… make sure everything is clean and tidy, everything adds up. Everything talks to each other. Update one place updates everywhere else. No bugs. No stalling, no lags. No errors… Maps all work as they should… smooth, no delay with opening or searching or zooming in."

### Bugs found and fixed
- **Ten broken lookups (`patch_v669.py`).** The page's packing had squeezed the space out of some selectors. A lookup meant as "a marker inside the map" (`#pane-map .mk`) became "the map that is itself a marker" (`#pane-map.mk`), which finds nothing. What that broke:
  - **Show on map** and search's "takes you there, ringed" could not find the callout. They flashed "not drawn on this sheet" instead of zooming in and ringing it.
  - The drawer's links on moved lines and notices did nothing.
  - Tile figures were never fitted to their tile.
  - The showcase's circuit trace was never measured.
  - The view-only chip never reached a pane.
  - Card folding on phones missed the Where-we-are group cards.
- **Header day pod (`patch_v669e.py`).** It read 0 / 0 / 0 because today (Sat 26 Sep) and Sun 27 Sep have nothing due in, while the Timeline showed 10 due in on Monday. The pod counts deliveries in, so it now skips ahead to the next day with deliveries and labels it "next delivery day". Its "so far today" note is only used for today.

### Speed (desktop test browser; long tasks are what freeze the page)
| | Before | After |
|---|---|---|
| Page opening (worst freeze) | 1.56 s | 0.63 s |
| Today board paging (every 6 s) | 0.81 s | about 0.05 s |
| Plant opens | 0.93 s (+0.4 s) | 0.12 s, rows fill in behind |
| Where we are opens | 0.39 s | 0.23 s |
| Map: change drawing | 0.5–1.05 s | no freeze |
| Search: each keystroke | 55–70 ms | about 17 ms |
| Open a record (drawer) | 0.22 s | 0.04 s |

- **LED board.** It used to draw 7,000 blurred circles. Now it lays one repeating tile for the dark lamps and one stamp per lit lamp: same look, a few milliseconds. The lamps light one frame after the page opens, not in the middle of opening it.
- **Plant traffic lights.** Each row carried a 92-piece drawing, 21,000 elements across the page. The housing, bezels and glass are now drawn once and shared, so a row keeps 21 pieces and looks exactly the same.
- **Plant rows.** The first two dozen rows arrive with the page and the rest fill in between frames. Tables below the fold aren't laid out until you scroll near them. A remembered scroll position, a redraw while scrolled, or printing draws everything at once.
- **One asset list per job.** Every page draw, search keystroke, record opening and Show on map now builds the asset list once, not once per marker or row. The day's figures (`dsnState`) and rental lines (`rentalOf`) are worked out once per draw.
- **"Email this".** It now writes its email when pressed, not on every draw.
- **Wheel zoom on the drawings.**
  - It now follows how far the wheel moved, so a mouse notch still zooms 18%, a trackpad zooms smoothly and a trackpad pinch follows your fingers.
  - The drawing moves once per frame, not once per event.

### Checked and found right
- **Every figure agrees across Today, Where we are, Timeline, Plant and the map sheets:** 43 on site, 0 in transit, 1 recorded not on site, 152 no record, 27 complete (196 references in view, 3 cancelled, 199 on the register).
- **One light set on the edit link updates everywhere.** It showed on Today, the Timeline, Where we are, Plant and the header pod, and a second browser on the view link saw it after the save.
- **The maps work.**
  - All nine drawings open, with their picture and markers.
  - Search for "callout 033" rings it at 2.6× inside the view.
  - Show on map from a record rings P12.
  - Plan on satellite and 3D proof open.
- **No script errors on any tab, desktop or phone.** No sideways overflow and no broken images.
- **Phone.** Search is behind the magnifier at the top. Documents is under Tools.
- **The showcase still runs** (Dunny Run rolls test passes). The live page is byte-identical to the published build.

### Files
- `patch_v669.py`: selectors, LED board, row edition of the traffic light, per-draw memo.
- `patch_v669b.py`: Plant rows fill in behind, board lit a frame later.
- `patch_v669c.py`: content-visibility on Plant tables.
- `patch_v669d.py`: lazy "Email this".
- `patch_v669e.py`: header day pod.
- `patch_v669f.py`: page draws hold one list, wheel zoom.
- `patch_v669g.py`: search, drawer and Show on map hold one list.
- `audit_scripts/`: the audit, profiler, figures cross-check, edit-propagation, map and search tests.
- `build_asset_app_v6.68_to_v6.69.diff`: the same changes in the builder.
