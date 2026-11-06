# v7.28: sub-hire named, with the company and their asset number (LIVE)

Author: Andrew Fisher

Andrew, 28 Sep 2026: "subhired toilets if any will be Event Portables. I think we should mention if they are, or any subhired company, and mention their asset number if one."

**How it's kept.** A sub-hired piece is a unit of its location, named "Sub-hire: <company>", carrying the company's own number. It lives in the existing units record, which is already synced, merged, exported and backed up. There's no new store, so nothing can fall out of a sync or a backup.

**Where it shows:**
- **Change deliveries:** a Sub-hire box under Allocated asset numbers.
  - It has a company field (Event Portables offered first, with others remembered) and a "their asset number" field; one Add per unit.
  - Each unit is listed with an × to take it off.
  - When the hire contract has no Coates number for the location (MISCITEM or SUB- lines, or nothing allocated yet), the box says so.
- **The line:** its count ("n of q") includes sub-hire units, and a chip reads "Sub-hire · Event Portables ×n".
- **Questions:** the "asset numbers missing" count includes them.
- **The location's details (drawer):** each unit is listed.
- **Driver and install sheets:** the asset number column reads "Sub-hire · Event Portables · their no. …".

**Example (WC41, in a practice copy with writes blocked).** Adding EP10231, EP10232 and one unit with no number gave:
- 3 of 10, "Sub-hire · Event Portables ×3";
- Questions "3 of 10 numbered";
- the install sheet prints "Sub-hire · Event Portables · their no. EP10231 EP10232".

The EP numbers in the pictures are examples, not real Event Portables numbers.

**Tested:** the sweep shows 0 errors on desktop and phone, the money is identical to v7.27, and pre-starts still print one page each.

**LIVE: 28 Sep 2026.** Byte for byte on the view link.
