# v10.59 — late loads named by reference and description; an arrival recorded late lands on the day it came (DRAFT)

Author: Andrew Fisher · 17 Oct 2026 · work in progress, not built or live; nothing publishes without Andrew's "Upload"

Andrew, 17 Oct 2026: "Do we know what was late and by how late is what we need to know what was late. What description
it relates too" and "the swivel chairs turned up on the correct day. So did the fridges".

- **Part A** (`part_a_latedesc.py`): Coates on time names each late or failed load by its reference and description,
  in More info ("P60 Gate 5 Ticket Box · Ticket box · window 05:30–08:30 · done 08:56 · 26 min late") and on the
  card (up to three, then "+n more · More info"). A "one of" booking the site record pairs is named as that reference.
  A reference with no description shows its item.
- **Part B** (`part_b_arrived.py`): `arrivedOn1059.set(key, iso, why)` adds one "on site by the close of <day>, time
  not recorded" entry to the light history, so every past-day view counts the item from that day. Tested in page
  memory with P26, P28, P34, FR01 and FR02 on 14 Oct: the 14 Oct card goes 11/16 → 16/16 received, Furniture 6.
  Since corrected: FR01/FR02 now carry 1129733/1157786, which came in on 17 Oct, so only P26, P28 and P34 get 14 Oct.
  The display patches (no screen prints the entry's stamp as a time) follow the readers audit.
- Still to do: the display patches, the independent late-load check's confirmed fixes, tests, build, sweeps.
- Performance moves to v10.60.
