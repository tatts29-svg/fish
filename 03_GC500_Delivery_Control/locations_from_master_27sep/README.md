# Delivery locations read from the master plan — 27 Sep 2026 (findings, not loaded into the dashboard)

Author: Andrew Fisher

Andrew asked for a deep read of the master plan (D001-26003-03) to find delivery locations, since most units, including Monday's, show no place on the map.

## Method
1. **Text layer.** Every word on D001 and on sheets D007, D016, D022–D025 and K220–K231 was read from the PDF's vector text, with its position (`resolve.py`).
2. **Unit tags.** A unit's small tag on the master (e.g. "P38") sits on the unit. This gives 110 references.
3. **Callout bubbles.** Bubbles on D022, D023, D024 and D025 were traced along their leader lines to the arrow tip (`trace.py`). This adds generators, circuit light towers and a few buildings. GN04 was read by eye.
4. **Cross-check.** Tags and leader tips agree within about 3 m (P06, WC01, AA, HRP).
5. **GPS.** Sheet points were converted to GPS using the explorer's satellite registration (about ±0.7 m).
6. **Landmarks.** Each point was labelled with its nearest sector, gate, street and park, and with what is written beside it.

## Result
- **139 references placed on the unit.** Six of them had no location before: P38, P39 and P42 (beside the 8 m stage), P45, P60 and WC86.
- **23 area only.** These are water barriers, plant lines and pit garage toilets, placed by the place words on their own line.
- **6 in the Molendinar storage-yard box.** LT01–LT06.
- **31 not found on any drawing.** These include WC10, WC66, WC85, WC100, VMS lines, Tedder Ave, Phillip Park and others.

`GC500_Delivery_Locations.html` is the phone page, with zoomed proof crops for Mon 28 Sep to Thu 1 Oct. It is published privately as an artifact. Nothing is written to the dashboard or the shared record yet; that waits on Andrew's yes.
