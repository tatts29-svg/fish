# v8.21 — Timeline daily installer runs

Author: Andrew Fisher

**LIVE — 4 Oct 2026, 01:19 AEST.** Exact public SHA-256 `a505155e749d35c2231add24762a2db08ae617b9efcd4d06c8aee8507750a414`, 9,568,271 bytes, built on v8.19 `0630371d2c662cbff820d429aec87f0142da24a947d7b3ef4441dd5671d7bf6c`. The guarded upload and public readback match. All 269 standing assertions and both desktop/phone 22-tab, seven-link and Back sweeps passed with no browser errors. Operational collections are unchanged. See `RELEASE_REVIEW.txt` for source bindings and scope.

The Timeline's visible Day documents plate now includes **Message daily runs**. Choose one of the existing installation contacts and press **Text this day's deliveries**. That explicit click prepares a fresh day-only page and submits its link. **Preview daily page** is optional and sends nothing. No scheduled texts, crew assignments or duplicate contact directory are created.

The existing load rows keep their references, status, DD order, shared trucks, split loads, navigation and expandable reference cards. Location-picture texting moves inside the expanded load, labelled by reference. A narrow grouping correction retains rescheduled bookings when the same day also contains an active booking; it does not change any schedule date or recorded status.

The installer page contains only current scheduled deliveries for the selected Brisbane date. It excludes cancellations, removals, unrelated dates, the whole application, the contact directory and financial records. Planned quantities, reference-level recorded/remaining quantities, uncertain receipt allocation and booking-specific asset slices retain their meaning. The page is an issued snapshot with its record revision and expiry; a new send creates a new token instead of replacing an earlier snapshot.

If v8.19's structured meet-point data is on the base page, each reference includes its own meet point, way in and applicable site rules. Supplier-plan dates remain separate from the native schedule; a disagreement appears as a visible **Date needs confirmation** notice. This release does not apply the supplier plan as a reschedule, copy complete supplier loads or publish a demob instruction.

## Send behaviour

- Edit capability, fully synchronised source revision, current recipient, operator and SMS availability/quota are checked before submission.
- An explicitly previewed revision is bound to its recipient and date. Changed data or a preview over two minutes old requires refresh.
- The record is checked again after the day-page publication and before the SMS POST. A changed record stops the text.
- Repeated clicks lock one submission. A verified session-storage receipt is required before the provider POST; storage failure sends nothing. Accepted or uncertain submissions remain locked across redraw and same-tab reload.
- Submission acceptance is separate from network-confirmed delivery. Read-only status refresh never sends again. A deliberate **Prepare another message** action warns about duplicates.
- Both reads and provider sends have bounded timeouts. A page-publication timeout can leave an expiring page, but its late result cannot send an SMS.
- Server boundaries are explicit: no more than 40 reference metadata keys, payload below 1.9 MB, same-origin `/d/` links only. Days without deliveries or dates already passed cannot send.

## Files and checks

`patch_v821_release.py` applies the frozen `patch_v821.py`, isolates its CSS from the supplier card without changing selector specificity, and updates the two release labels. The owner patch uses the shared exact-once patch helper, refuses a second application, preserves the then-live base and adds no credentials or operational records. `daily821_src.js`, `daily821_renderer.js`, `daily821.css` and embedded font CSS are the product source.

`test_daily821_projection.cjs` checks date resolution, moved bookings, DD order, shared/split loads, quantity context and optional meet-point projection. `test_daily821_send.cjs` is the independent Chromium fault suite; every API call is a local fixture. `test_daily821.cjs` uses the actual page and fresh read-only record with intercepted card/SMS POSTs. `test_daily821_visual.cjs` exercises the visible native Timeline controls, new-tab page, redraw persistence and 1440/390/320 widths. All generated operational HTML and screenshots stay in private output paths, outside this repository. Synthetic reports contain no contact directory or live record dump.

Run from the repository root after the shared build:

```sh
bash 03_GC500_Delivery_Control/toolchain/build.sh v8.21 03_GC500_Delivery_Control/v8.21_timeline_daily_runs_LIVE/patch_v821_release.py
node 03_GC500_Delivery_Control/v8.21_timeline_daily_runs_LIVE/test_daily821_projection.cjs
CHROMIUM_PATH=/usr/bin/chromium node 03_GC500_Delivery_Control/v8.21_timeline_daily_runs_LIVE/test_daily821_send.cjs
CHROMIUM_PATH=/usr/bin/chromium node 03_GC500_Delivery_Control/v8.21_timeline_daily_runs_LIVE/test_daily821.cjs
CHROMIUM_PATH=/usr/bin/chromium node 03_GC500_Delivery_Control/v8.21_timeline_daily_runs_LIVE/test_daily821_visual.cjs
```

`PAGE` selects an integrated candidate for actual-page tests. `BASE` selects its base for the synthetic suites. `EVIDENCE` directs private outputs. The release owner runs standing suites and both navigation sweeps on the final integrated candidate, records exact hashes and publishes through the guarded toolchain. No real SMS, card publication or record change is used as a test.
