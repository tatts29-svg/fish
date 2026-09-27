# v6.90 master map: compass, sharp tiles, smooth (DRAFT, awaiting Andrew's yes)

Author: Andrew Fisher. This is the Map tab's master drawing: "Rotating of map … not rotate the map itself … north east
south west … smooth fast no blurry" (27 Sep 2026). Andrew confirmed the master map has the same problem as Plan on
satellite.

## What changes
- **Turning.** The frame stays still and is always full. The view turns inside it, and the drawing is held so it
  covers the stage at any angle.
- **Compass.** A compass in the corner shows N, E, S and W where they really are, with a "Facing …" label. Press a
  letter to face that way (an eased turn); drag the ring to turn freely. Two fingers and Shift + scroll still work.
- **Sharp.** The master plan is also held as 1,592 tiles of 512 px, cut from the vector PDF at 5,200, 10,400 and
  20,800 px across. At rest, the tiles for the screen load at the size the screen needs. Zoom now goes to 16×, and
  the drawing's small print is crisp.
- **Smooth.**
  - Nothing is measured inside a frame.
  - The pins ride on a flat layer above the drawing, so a drag moves that layer as one piece, not 300 separate pins.
  - Shadows are dropped while moving.
  - A flick coasts to a stop.
  - Main-thread work while zooming (phone profile) went from 3.2 s to 0.9 s over the same test.
- **Full screen.** A button gives the map the whole window; Esc brings it back.

## Build
```
v684 + 685 (master_loc_689) + 686 (new_media_690: +1,592 tiles, manifest 1,955 files) + 681 + 687 + 688 + 689 + patch_v690.py
```
`build690.sh`. The tiles come from `gen_tiles.py`; they live in the hosted media store, not in the repo.

## Checks (local)
Everything below passed:
- t689: layers and popups
- t687: master map
- map_test_master: zoom and search
- search_test
- nav_test
- axe_slow: none
- deep_data680: no issues
- rs_test
- fix_test681
