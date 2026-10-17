# v7.35: a cancelled order's number never holds a unit back (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "Bug with P53 - it says it is still waiting for an asset number, or had a number assigned to it. That number is used somewhere else now."

Then, when asked:

> "That number belongs on P36."

**Where each number came from**

| Number | On P36 because | Who, when |
|---|---|---|
| **1327222** | the schedule's P36 row (the schedule's P53 row has it too) | nobody typed it |
| **1282487** | recorded on site against P36 in the shared record | Andrew Fisher; taken off P63 and HRP at 13:21 on 17 Sep, and pinned at P36 on 21 Sep |

Hire contract 9968862 says something else again:
- line 93, "P36 building shell", is **1189410**, Delivered;
- line 82, "P53 building shell", is **1327222**, Pending;
- line 121, "P63 building shell", is **1282487**, Pending.

**The bug.** P53 is cancelled and never arrived, but its planned 1327222 still counted as a unit being there. The number read as being on two locations, and the inventory's Check list offered to move P53's number to spares (a spare that isn't on site).

**The fix: one rule, nothing guessed**
- A number on a **cancelled order that never arrived** is a plan that was called off:
  - it no longer blocks the number anywhere else;
  - putting the number on a location takes it off the cancelled order, with the name, and says so.
- **Inventory Check list:** "P53 is cancelled and never arrived - 1327222 was only planned for it", with **Release 1327222**. A cancelled order that is on site still offers Move to spares.
- **Not guessed.** A first draft also treated a schedule number as overtaken when a number recorded on site filled the order. That was wrong for P36: 1327222 is its building. The rule was taken out before going live. Which number is really at a location is a person's call.

**Tested (practice copy on live data, phone size, writes blocked)**
- P53's claim on 1327222 is stale; P36's is not. 1327222 now belongs to P36 alone.
- Adding 1327222 or 1282487 to another location is still stopped, naming P36.
- P36 stays on Questions ("2 numbers for 1 ordered") until 1282487 is taken off it.
- The money model is identical to v7.34, and the tab sweep shows 0 errors on desktop and phone.

**To do**
- **Andrew:** P36 → Change → Allocated asset numbers → take **1282487** off, if 1327222 is the building there. Then say where 1282487 actually is; the contract line says P63 Gate 5 Volunteer Sign On.
- **P53:** Release 1327222 (Inventory → Check).
- **Branch, in the rental system:**
  - line 93 has P36 as 1189410;
  - line 82 still has P53 (cancelled) Pending with 1327222;
  - line 121 has 1282487 as P63.

**LIVE: 29 Sep 2026, 06:14 AEST.** It matches the build byte for byte on the view link.
