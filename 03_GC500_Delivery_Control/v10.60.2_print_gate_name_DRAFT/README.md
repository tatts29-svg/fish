# v10.60.2 — the print check says what it still needs (LIVE 18 Oct 2026 06:32 AEST)

Author: Andrew Fisher · 18 Oct 2026

Andrew, 06:26 (screenshot: box ticked, "Andrew" typed, button still grey): "When ticked its still greyed out you csnt get
passed this block", then "Its blocking me from printing off the vms run. Please fix and permission to upload everythi g".

The v10.53 no-twin-steer check needs the box ticked AND a first and last name, but it only said "until you tick the box"
and filled in "Andrew" from the phone. Now the label asks for first and last name, a line says what is still missing
("Tick the box to continue" / "Type your first and last name to continue", in red) and then "Ready", and a one-word name
that the project author's full name starts with is filled in as that full name ("Andrew" -> "Andrew Fisher"). The rule is
unchanged: nothing prints until the box is ticked and a full name is given. Footer v10.60.1 -> v10.60.2.

- Live over v10.60.1 (base guard passed): 18,301,333 bytes, sha256 `8222e47b800cc141…`, view link byte for byte.
- `test_gate1060p2.cjs` 12/12 on the build (desktop and phone) and on the live page. v10.53 `test_twinsteer1053.cjs`
  34/36: the two misses are its footer check `/v10\.5[3-9]$/`, which cannot match any v10.60 footer (not this change).
  Sweep 24 tabs, 0 errors, 0 console.
