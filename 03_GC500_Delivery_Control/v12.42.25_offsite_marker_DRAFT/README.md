# v12.42.25 — Map explorer: off-site ring instead of the LEFT SITE badge (DRAFT, not uploaded)

Author: Andrew Fisher

Andrew, 28 Oct 2026: "the left site is to big it needs to be the shap of the icon then have a Off Site Pulsating Circle arfound it".

**What changes (Map explorer only):**
- A departed item keeps its own icon shape and colour. Before, it was swapped for an octagon with ↗ and a 56 × 19 px green "LEFT SITE" badge. With 74 references gone, those badges covered the whole plan.
- **Left in full:** a steady green ring round the icon, with a pulse going out from it every 1.8 s.
- **Part pick-up:** a dashed ring, no pulse.
- **Departure needing review:** a red ring, and the icon a red diamond with "!".
- The ring grows with the zoom, as the icons do: 5 px across the whole plan, 16 px once zoomed in.
- Label beside the shape: "WC69 · OFF SITE" (was "LEFT SITE").
- **When the ring doesn't animate:** it is hidden in 3D and on the Fencing map. The pulse stops when the tab is hidden. With reduced motion set on the device, the ring stays and the pulse is dropped.

**How it's built:** `departureFrame1211` (the explorer frame): the status override, the label, and the `drawMarks` wrap. The wrap now collects ring points into `Offsite1225`, its own canvas layer over the marks. Display only: no record, charge, count or hire changes.

**Base:** live v12.42.24 `524115a3…`. **Candidate:** `3b6292c3…` (build with `toolchain/build.sh v12.42.25 v12.42.25_offsite_marker_DRAFT/patch_v124225.py`). check_page PASS.

**Checks:**
- **Money probe, base vs candidate:** identical except the footer. Charge $1,025,473.88, cost $448,019.57.
- **Phone and desktop explorer:** 0 page errors, 0 writes.

**Pictures in `evidence/`:**
- `before_phone_whole_plan.png` (the badges)
- `phone_whole_plan.png`
- `phone_zoomed_wc69.png`
- `desktop_zoomed_wc69.png`

**Waiting on:** Codex's second review (PR #1) and Andrew's OK, then upload.
