## v5.88 — what v5.87 got wrong on the day (25 Sep 2026)

Seen on the live page by Andrew Fisher within the hour of v5.87 going up, fixed and re-uploaded the same evening.

- The new banner clipped the clock's drop-down panel and let the tab row paint over it. The bar no longer clips, and the bar sits above the tab row.
- The banner's blur and stacked shadow effects cost a phone its scroll. They are gone; the look is carried by gradients.
- The car picture and the daily brief had been moved under the cards. They are back under the day strip, where they were.
- The three instruments (lights, dial, programme) navigated on any press. Only their Open line navigates now; the rest is for reading.
- Live checks: the clock panel opens clear at 1440 and 390 px; no console errors; no sideways scroll.

## v5.89 — the Google 3D map opens (25 Sep 2026)

- Once the Google browser key was handed out by server v5.78, the 3D fly-around still failed with "importLibrary is not a function". The page asked Google's loader for the maps3d library the instant the bootstrap script had loaded, a moment before the loader had put importLibrary in place. The page now waits for it (up to ten seconds) before asking.
- Verified on the live page: the 3D fly-around opens on WC15; Street View opens on its nearest panorama.

## Server v5.78 (25 Sep 2026)

- Hands the Google browser key (GOOGLE_MAPS_KEY) to the page beside the Mapbox token at /api/map-key, only when it has the shape of a browser key. Nothing else changed.
- Deployed as twelve verified pieces plus one joiner (SERVER_B64_01 to SERVER_B64_12) after two two-piece attempts failed on a single mistyped character each; the boot log's checksums proved every piece. Three failed deploys cost about fifteen minutes of live downtime in total. The v5.77 pieces (V577_01, v577_02) remain as the way back; V578_01 and V578_02 are leftovers to delete.
