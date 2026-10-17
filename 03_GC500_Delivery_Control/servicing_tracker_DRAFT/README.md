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
  are unchanged. If Thursday is serviced its ticks show it, but ticks never change a count or a charge (AGENTS.md: "Scans and
  ticks never change either figure"); only Andrew's word does.
- WC100's two FWF trailers (Andrew, 18 Oct: "Trailers let not give.them a location yet.."): out of the Teams Area,
  in their own "No location yet" group at the foot, no pin; still tickable and in the 257. Teams Area is now 6 units.
- QR codes (Andrew, 18 Oct: "Qr xodes one oer sheet"): one QR per area sheet, opening that area on the current day.
- WC81 stays in area 11 (Andrew, 18 Oct: "Wc81 stays there"), though it is 1.4 km from the rest of it.
- To check with Andrew: nothing open on the design.

## Design and review (18 Oct 2026)

`design_and_review_18Oct.json`: three code readers, a build spec and an adversarial review.
- Approach: one drop card (server-minted token) opted in as a tracker; 14 sheets, each QR = the card link + `#a<n>`;
  server v5.89 adds its own tick store and `/d/<t>/ticks` (GET shared ticks, POST tick/undo) and edit-only `/api/ticks`;
  page v10.63 makes the card and shows progress read-only on Event nights. Nothing touches the record.
- Review: not ready until fixed — rate limits per address and per token, per-row caps and an edit-only void route
  (a photo of one sheet could flood or fake it); escape everything the panel shows (or no names at all); panel drawn so
  the run sheet's own redraw cannot wipe it; 400/409 instead of silently dropping the tracker on a bad re-post; unticks
  name the tick they cancel; snapshot epoch; trailing slash, hashchange and 413 handling; one tracker per load;
  day pick lapses at 08:00; append-only tick file; hasOwnProperty on card tokens.

## Andrew's answers, 18 Oct 2026 (build brief)

"Carried by crews" · "Just times" · "Waste tanks too" · "We can have multiple printed off for each. I can even laminate them" ·
"Remember must show a percentage complete off that area" · "they can tick that refernce number as complete. One refernce number may
have other completion lines as they will have a different desription" · "Lets have qr code for pinned location. The asset numbers
associated with that refernce. And a picture of location on the master map. With a circle around the area. And even a master map
with a print of the different areas" · "There is a compmetion qr code for their refernece. They scan. It whe all done. And click tap.
This only alows them to complete the refernce qr code. Must shows percentage complete for the area. And again for everything" ·
"must state. Reference number and how many in each one" · "each refernce needs to have 3 ticks Water fillled. Pumped out
Restock/Cleaned ... As these could be 3 different job. Waste tanks is only a pump out. Toilet blocks will only need a pump out and
clean. Sunday night will need a extra. locked and confirmed empty. No water will be needed".

- `tracker_data.json`: 14 groups, 75 references, 83 lines, 263 units (257 toilets + 6 waste tanks). Jobs: FWF, accessible and FWF
  trailers Pumped out · Fresh water refilled · Cleaned & restocked; blocks Pumped out · Cleaned & restocked; waste tanks Pumped out;
  Sunday night adds Locked & confirmed empty and drops the water. Percentages weigh each job by the line's units.
- Each reference gets a completion QR that can only tick that reference (a server-checked signature), a location QR, its asset
  numbers and a master-map crop with a circle; plus a master map of the 13 areas. Build: workflow wf_86a7cb05-ee8.
- Job rules (Andrew, 18 Oct 2026: "Corrext with 1. 2 is correct. 3 let go with need to be cleaned regardless"): blocks with
  their own waste tank (WC05, WC20, WC27, WC60) are Cleaned & restocked only and the tank takes the pump-out; sewer-connected
  blocks (WC15, WC16, T0243) are Cleaned & restocked only; FWFs are still cleaned & restocked on Sunday. Line kind
  `blockclean` (night: clean; Sunday: clean, lock). WC09, WC17 and WC31's blocks stay Pumped out + Cleaned (the record
  marks them neither sewer nor tanked). Jobs per night: 749 (Sunday 766).
