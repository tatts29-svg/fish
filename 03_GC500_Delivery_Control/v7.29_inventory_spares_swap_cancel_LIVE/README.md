# v7.29: inventory, spares, swap and cancel (LIVE)

Author: Andrew Fisher

Andrew asked for this on 28 Sep 2026:

> "We need an inventory, and it says how much of each we currently have in stock. More so to work out how many sub-hired things are on site. More so again somewhere to put asset numbers that are not allocated anywhere. For example, I have a spare Coates portaloo on site and one spare Event Portables toilet. Can I go into P12 and change a Coates toilet for a sub-hired one? And I want an option to cancel an order, so if a building has been cancelled I can click on it and cancel that job completely."

Everything is on **Timeline → the day → Edit (Change deliveries)**.

## Inventory (a new card under the day; the Inventory button at the top jumps to it)
The card works per item type, filtered by trade. It opens on Toilets & amenities, and Everything shows the whole job.

| Column | What it counts |
|---|---|
| Total on site | At locations plus spares |
| Sub-hire | The number of units per company |
| Spare | The number of spares per owner |
| At locations | The order's quantity once it's ticked on site, or what was recorded as supplied |
| Coates numbered | Units that carry a Coates number |
| No number yet | Units on site that have no number recorded |
| Ordered | The quantity the orders ask for |

- The headline line reads "Sub-hired on site: Event Portables n on site (x at locations, y spare)".
- It reads the same delivery record as every other count. Cancelled orders aren't counted.
- Where a location has two types (e.g. WC01, 2 FWF + 1 accessible), its numbers count against its biggest line.
- **Check list:**
  - a spare whose number is also on a location (counted twice), with "Take it out of spares";
  - a cancelled order still carrying numbers or sub-hire units, with "Move to spares".

## Spares: on site, not allocated anywhere
- **Add spare:** what it is, whose it is (Coates or the company), its asset number if it has one, and where it's parked.
- A number that's already on a location is refused, and the message names the location.
- Each spare can be sent to a location with **Use**, or removed with **×** when it has left site.
- Typing a spare's number straight onto a location (in the asset number or sub-hire box) takes it out of spares automatically.
- **Where it's stored:** a new synced collection, `spares`, with one document per spare. It's in the record's load, export, blank and merge, and each spare carries who added it and when.

## Swap (e.g. a Coates toilet at P12 for a sub-hired one)
- Every Coates number and sub-hire unit on the Change form has **⇄ Swap**.
- **What can go in:**
  - a spare, with the same type first and the other owner first;
  - a new sub-hire unit;
  - a Coates number.
- What comes out goes to spares, because it's still on site. Untick the box if it has left site.
- Everything is checked before anything is written.

## Cancel an order
- **Cancel this order** is on the Change form. It uses the page's own cancel, which asks for a reason.
- A cancelled order comes off every day, list, count and sheet, and keeps the name and reason.
- **Put … back on** undoes it with one press.
- If the order is on site, the dialog offers to put its units into spares.

## Tested
- **Practice copy** (reading live data, writes blocked), desktop and phone:
  - two spares added;
  - a number already on a location refused;
  - WC01's Coates 1211958 swapped for an Event Portables spare (1211958 went to spares);
  - a Coates spare used at PG01;
  - AA cancelled with its unit moved to spares, then put back.
  - The numbers in these tests are examples, not real stock.
- **Local v5.84 server with test tokens:**
  - spares saved to the server, still there after a reload, and shown on the view link (read-only);
  - swap, cancel and put-back reached the second screen;
  - a typed number came out of spares.
- **Regression:**
  - the money model is identical to v7.28;
  - the tab sweep shows 0 errors on desktop and phone;
  - no page scrolls sideways;
  - the inventory takes about 11 ms to work out and 17 ms to draw.

**LIVE: 29 Sep 2026, 04:11 AEST.** It matches the build byte for byte on the view link.
