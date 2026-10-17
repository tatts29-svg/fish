# Servicing tracker — DRAFT (mock-up only, not live)

Author: Andrew Fisher · 18 Oct 2026

Andrew, 18 Oct 2026: "I dont want it set up so you tick it and charged. Its purely just a track. Can it not have its own
seperate html that is linked to nothing else. But still links results to main"; then, with his 13-area workbook:
"Days are set ... 8am thursday to 8am friday / 8am friday to 8am saturday / 8am saturday to 8am sunday / 8am sunday to
8am monday. Qr code. When scanned it automatically goes to set day ... We dont need to nesscaraelally need to go by asset
no ... We can have a navigate to. How many are in location. Maybe mention asset nos in location. Then tick when complete.
Each section will automaitcally update. With a percentage of completion. Log the time the reference was done. And log a
time when the whole area was done."

- `mockup.html`: tap-through mock-up (ticks stay on the phone). Private preview: https://claude.ai/artifact/DKXFpaEMBVMRx96bZqghn3
- `areas13.json`: Andrew's 13 areas (his workbook `GC500_13_area_references_and_locations.xlsx`), 74 references + spare
  0164 = 257 units, with each location's asset numbers from record 9704 (all counts match).
- Design: four service days, 08:00 to 08:00 Gold Coast time (Thu 22 → Mon 26 Oct), picked automatically from the
  time of the scan; tick per location; percentages by units (so WC07's 20 weigh as 20); the time of each tick and the
  area's finish time (its last tick) logged; Navigate opens Google Maps directions to the record's pin; no pin = "ask on
  site", never a guess.
- The real one: a standalone page on the service with its own secret link (the QR), like the drivers' drop cards
  (server v5.56/v5.63 pattern); ticks append to their own log on the service (server time), never touch the job
  record, ticks or charges; the main page reads the log and shows progress per area per night. Needs a server
  addition (no edit key on phones) — deploy and page release on Andrew's "Upload".
- Thursday (Andrew, 18 Oct: "Thursday is a just iin case. Im not sure"): the Thursday day stays on the tracker marked
  "if needed"; before the event it opens on Friday. The Event Portables count stays Fri/Sat/Sun (714) and the labels
  are unchanged; if Thursday is serviced, its ticks show it and the count can follow what was actually done.
- WC100's two FWF trailers (Andrew, 18 Oct: "Trailers let not give.them a location yet.."): out of the Teams Area,
  in their own "No location yet" group at the foot, no pin; still tickable and in the 257. Teams Area is now 6 units.
- To check with Andrew: WC81 is 1.4 km from the
  rest of area 11;  one QR for all or one per area sheet.
