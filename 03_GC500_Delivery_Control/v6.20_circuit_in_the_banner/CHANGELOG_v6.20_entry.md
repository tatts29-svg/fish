## v6.20 — 26 Sep 2026 — the circuit in the banner, with the day's deliveries on it

- The banner, from Andrew's mock-ups: the car and the search top left, the circuit map across the right, the pods in one
  row beneath. The map is the registered 2022 aerial cropped to the circuit, darkened, with the key-plan ring drawn on it
  as a glowing line by the same registration the 3D proof uses (`make_hzmap.py`; 1600 × 668, 225 kB, hosted media; the
  crop travels in `DATA.hzmap`). The whole ring is always in the panel; it folds away with one press, remembered on the
  device; on short laptop screens it is 250 px tall, 200 on a phone.
- The day's deliveries: only what is due in on the day the banner counts, pinned at the callout's arrow tip on the
  registered drawing (`aerialPointFor`, the Map tab's own arithmetic), a reference plate over a dot in the light's colour.
  A reference with no position on the plan is counted under the caption, never guessed. A pin's menu: the plan (the Map
  tab on that sheet, the marker ringed), the satellite at its pin, the plan explorer opened on the reference (a new
  `?find=` on the explorer), the 3D proof, Navigate (the maps app at its coordinates), and the reference on Plant.
- Checked at 1366, 1024 and 390 wide with a sample of 14 positioned references: pins land on the track, the menu opens,
  no script errors, nothing scrolls sideways.
