# v7.32: a location's numbers split by item (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026, on WC01:

> "2 portable toilets turned up, but the description of the install is wrong and there are 4 places to click install. I had 2 x portaloos turn up and allocated, but no 1 x accessible toilet."

**Cause.** On a location with more than one item, every item was given all of the location's asset numbers as its own buildings. WC01 (1 accessible toilet and 2 FWF) showed 1211958 and 1211967 under Accessible Toilet as well as under FWF. That made four install boxes (plus four demob boxes) for two toilets.

**Fix**
- **Each number counts against one item.**
  - First, the item someone chose: the Change form has a small "counts as" picker beside each number, on locations with more than one item.
  - Otherwise, numbers fill the biggest order first, or what turned up where it was counted.
  - An item counted as 0 arrived takes no numbers.
- **WC01 now:**
  - FWF has both numbers, with one install tick each;
  - the accessible toilet has one plain tick;
  - once "What turned up" says Accessible Toilet 0, it shows "none arrived, nothing to install yet" instead of ticks.
- **Unchanged:**
  - single-item locations;
  - existing ticks, because the ticks on mixed locations (WC05, WC27) are recorded against the whole location.
- **WC20** (2 toilet blocks and 2 waste tanks): both numbers count as its toilet blocks, which agrees with the notes (WC15, WC16, WC17 and WC20 carry two numbers each, "every one a 6 m toilet block").
- **The drawer:** Short now sits on the line under the name, clear of the Navigate button on a phone.

**Tested (practice copy on live data, phone size, writes blocked)**

WC01 install ticks, before and after:

| Version | Install ticks on WC01 |
|---|---|
| v7.31 | 4: Accessible ×2 and FWF ×2 (by number) |
| v7.32 | 3: Accessible ×1 plus FWF 1211958 and 1211967 |
| v7.32, Accessible counted 0 | 2: FWF only |

Moving 1211967 to Accessible Toilet with the picker was saved in the supplied record, and the labour followed.

**LIVE: 29 Sep 2026, 05:21 AEST.** It matches the build byte for byte on the view link.
