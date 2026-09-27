# v6.96 — Maps opens on Satellite · 3D, four buttons once each, one set of numbers (DRAFT, awaiting approval)

Author: Andrew Fisher · Coates Industrial Solutions · GC500 2026 · 27 Sep 2026

Nothing here is live. It goes live only on Andrew's yes.

## What Andrew asked (27 Sep 2026)

- "Maps is meant to open …#sheet/__satellite3d", "With these options": Satellite · pins, Satellite · 3D,
  Plan on satellite, 3D proof. "And" the Plan / Sat + plan / Satellite switch.
- Pointing at the Map tab landing on "The master plan": "It should not got to this view".
- "And make sure we cover everything here dont double up any".
- On Plan on satellite's Find panel: "Numbers here are wrong".

## What changes

| # | Issue | Root cause | Fix |
|---|---|---|---|
| 1 | Map tab lands on the master plan | v6.90 sends the first visit to the master (`state.mapMasterSeen`) | The first visit opens Satellite · 3D (`#sheet/__satellite3d`). If 3D can't run on the device, it opens Satellite · pins. A link or a search that asks for a sheet still goes there. |
| 2 | Five buttons, one doubled | A "Master plan" button sat beside Plan on satellite, whose own "Plan" mode is the same master drawing | The row is exactly Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof. A search that finds something on the master still opens the master. The Plan / Sat + plan / Satellite switch stays inside Plan on satellite. |
| 3 | Phone missed two options and doubled one | On a phone the buttons were hidden and a drop-down showed Master plan, Satellite · pins and Satellite · 3D. It had no Plan on satellite and no 3D proof. | A phone shows the same four buttons, two by two, with no drop-down. |
| 4 | Plan on satellite counts wrong (46 of 55 portable buildings, 62 of 71 toilets, 0 of 14 generators, 0 of 19 light towers, 0 of 15 water barriers) | It counted the codes drawing D001 prints plus a static register file from 25 Sep. D001 prints no generator, light tower or barrier codes, and it prints a few codes that aren't on the register. | Opened from the dashboard, its Find chips now come from the dashboard itself (`gc500PlanItems()`): the same live record, places and counts as the master plan's Trade and Show rows. |
| 5 | Stands 19 | The pattern missed S22A | Stands 20, the same list as the master. |
| 6 | Opened in its own window | It has no dashboard to ask | It reads `explorer/assets/plan_items.json`, a snapshot taken from that same function at build (27 Sep 2026). |

## The numbers, before and after (Plan on satellite · Find)

| Chip | Before | After | Master plan (Map tab) |
|---|---|---|---|
| Portable buildings | 46 of 55 | 51 | 51 |
| Toilets & amenities | 62 of 71 | 68 | 68 |
| Generators | 0 of 14 | 12 | 12 |
| Lighting towers | 0 of 19 | 13 | 13 |
| Water-filled barriers | 0 of 15 | 12 locations | 12 locations |
| Access & plant / Furniture / Ground protection | not shown | 2 / 4 / 1 | 2 / 4 / 1 |
| VMS boards / Water barriers / Gates / Entry points / Big screens | Gates 8, Big screens 12 (others not shown) | 19 / 20 / 19 / 23 / 13 | 19 / 20 / 19 / 23 / 13 |
| Other gensets / Interface areas / Drawn, not on our schedule | not shown | 9 / 4 / 7 | 9 / 4 / 7 |
| Stands | 19 | 20 | 20 (S22A included) |
| Bars, Armco access, Emergency egress, Over-track signage, Pedestrian bridges | 8, 51, 2, 5, 3 | unchanged (what D001 prints) | not on the master |

The register holds more references than the master plan places. Each chip's list shows them dimmed as "no place on the
master plan yet", as the Map does, so nothing is hidden:

- **Generators:** GN25, GN? and T0268.
- **Light towers:** LT01–LT06.
- **Water barriers:** WB01, WB05 and WB06.
- **Toilets:** WC10, WC66, WC85 and WC100.
- **Other:** several task-sheet T rows, FL01/FL02 and NVLT.

The Map counts only references it can place, and so does this page now.

## Checked (test browser against the live record, GET only)

- **Tapping Map (desktop and phone):** the page goes to `#sheet/__satellite3d` with Satellite · 3D selected, and the master heading doesn't appear.
- **Button row:** exactly Satellite · pins, Satellite · 3D, Plan on satellite, 3D proof on the 3D view, the pins view and the master. The phone drop-down is hidden. No page errors.
- **Full draft stack (v6.95, on a phone):** same result.
- **Plan on satellite chip counts:** equal to the master's Trade and Show rows, string for string.
- **Generators:** tapping the chip rings 12 places. Searching GN04 finds it ("on the master plan · S15") and rings it. Before, GN04 wasn't findable at all.
- **Own window:** see `standalone696.js`.

## To publish (only on Andrew's yes)

1. **Page:** `GC500_Delivery_Control_hosted_v696solo.html` (= live v6.90 + `patch_v696.py`). If the v6.93–v6.95 drafts go
   too, apply `patch_v696.py` after `patch_v693.py`; the default-view line is shared and it knows.
2. **Machine set** (Plan on satellite lives there):
   `machine_set.py --keep <live manifest> --add-file explorer/explorer.js=explorer/explorer.js --add-file explorer/assets/plan_items.json=explorer/assets/plan_items.json`.
3. Re-take `plan_items.json` with `plansnap.js` on publish day so the own-window snapshot is current.
