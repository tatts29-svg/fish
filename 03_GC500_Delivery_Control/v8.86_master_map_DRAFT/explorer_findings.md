# Map explorer: why it feels clunky (read-only investigation, 8 Oct 2026 00:15 AEST)

Author: Andrew Fisher. Andrew, 7 Oct: "maps need some work its very very clunky its hard to use its slow its not smooth … when you click on example building nothing is clearly saying what has been done … you need to tap fencing or close fencing to close that."

**Where the code lives.** The explorer is not in the dashboard page. The page hosts an iframe that loads the machine bundle's `explorer/index.html`, so every fix below ships as a machine bundle release:

| File | Path |
|---|---|
| Explorer | `v8.13_maps_satellite_LIVE/release/explorer/explorer.js` + `explorer-merge.js`, patched by `v8.28_fencing_map_LIVE/patch_explorer828.py` |
| Fencing layer | `v8.28_fencing_map_LIVE/source/fencing-map-*.js`, patched by `v8.37…/patch_explorer837.py` |
| Last speed pass | `v8.64_map_explorer_LIVE/explorer/explorer-fix864.*` |

Line numbers below are approximate, because the live files are produced by those patches.

## Slow and not smooth

1. **The fencing layer is rebuilt on every frame.** It does this even with Fencing off, and it includes a duplicate check that converts every line to text twice (`fencing-map-core.js:111`, `fencing-map-explorer.js:120–137`). Build it once per filter or selection change instead.
2. **Gestures start and end with a hitch.** Three full-screen canvases are resized when a pan or zoom starts and again 160 ms after it ends. That is the blurry-then-sharp jump (`explorer-fix864.js:80–87`).
3. **Every dashboard refresh, about every 4 s after a save, forces a full fencing rebuild** (`setHostVisible` → `refresh(true)`). The 4 s fencing timer also converts a ~460 KB snapshot to text each time.
4. **Background polling runs while the map is hidden.** The Done check rebuilds every unit's status every 4 s on every tab; another timer runs every 700 ms.
5. **There is per-frame waste:**
   - a new gradient and a text measurement per ring;
   - a debug log that keeps up to 30,000 entries;
   - pointer moves that force page layout.
6. **Likely bug (from the code, not yet reproduced).** Tapping a fence line stops the event before the pointer is released. The map then follows the mouse on a laptop, and the next one-finger drag on a phone acts like a pinch.

## Tapping a building says too little

- **Nothing to tap by default.** Rings exist only when a category chip is on or the code was searched, so tapping P45 on a plain map does nothing. On a phone the chips sit in the hidden side panel.
- **The card shows one delivery word only:** On site / In transit / Not on site / No delivery record. It shows nothing on installed, levelled, steps or complete, and nothing on who, when or the due date.
- **On-hire units read "On site"**, while the Timeline says "On hire · delivery unconfirmed".
- **The card disappears on any touch of the map**, including a pan, but the ring stays lit.
- **Fix:** add the Timeline's five-stage status to the card (`timeline841State(a)`; ticks from `deliveryOf(key)`): Off site → In transit → On site → At location → Installed → Finished, with who and when. Add an "Open progress" button to the existing delivery progress dialog.

## Fencing does not close like other panels

- **It is an on/off mode, not a panel.** The only ways out are:
  - the same button, relabelled "Close fencing";
  - a close bar inside the side panel, which is hidden on a phone unless the drawer is open;
  - Escape, which only works when the map has keyboard focus and needs a second press if anything is selected.
- **Tapping the map never closes it.** Tapping a fence line reopens the side panel over the map on a phone.
- **Bug:** entering Fencing clears the category but leaves its chip pressed, so the first Escape is spent on that.
- **Fix:**
  - a clear × on the fencing view;
  - Escape works anywhere on the page;
  - one press of Close or Escape closes the whole fencing view;
  - fencing details close like the other cards.

## The new master and the explorer

The explorer draws D001 from its own tiles, not the page's master picture. Its fencing layer also checks the old drawing (`37792f0a…`). Swapping the master therefore also needs:
- new explorer tiles for D001;
- the fencing layer pointed at the new drawing.

Both ship with the machine bundle.
