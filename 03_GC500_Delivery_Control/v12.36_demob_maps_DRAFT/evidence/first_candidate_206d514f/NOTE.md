# First v12.36 candidate (206d514f…), superseded

- Tests on candidate `206d514f8496ebef054058357efab28f73349faa624f3d1dd009739f690da2aa`: desktop 74/74. Phone 73/74 on the first run; the miss was the test scrolling only 54,000 px of a list that runs further on a phone. With the test scrolling the whole list, phone 74/74.
- Its page-wide sweep found the Demob tab redrawing itself every frame. Three label writes rewrote their text on every pass, and the tab's watcher woke on each one. Measured over 3 s on the tab: 91 changes, 3.3 s of blocking, 14 frames.
- Fixed in the next candidate (`778c8718…`): the watcher is paused while the steps run, and the labels are written only when their text changes. Same measure: 1 change, 0.2 s of blocking, 56 frames. The test now checks the tab sits still once drawn.
- Kept for the record; nothing here was uploaded.
