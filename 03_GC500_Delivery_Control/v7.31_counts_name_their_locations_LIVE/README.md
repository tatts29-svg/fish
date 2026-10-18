# v7.31: every inventory count names its locations (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "When you say we are missing inventory I need to be able to click what reference is missing it."

**Inventory (Change deliveries → Inventory)**
- Every count in the table is a button.
- Pressing one lists the locations behind it, under the table. For example, "FWF - with no number yet: 22 at 4 locations" lists:
  - WC41: 10 with no number (0 of 10 numbered);
  - WC43: 10;
  - WC42: 1;
  - WC81: 1.
- Pressing a location opens it on the Change form, on its own due-in day and scrolled to the form. From there you can add its numbers, what turned up, a swap, or cancel it.
- **New column, Still to come:** the ordered quantity not on site yet, or short. Its list is sorted by due-in day, e.g. "WC44 2 not on site yet · due in Thu 01 Oct".
- Every column can be pressed:
  - Total on site
  - Sub-hire
  - Spare
  - At locations
  - Coates numbered
  - No number yet
  - Still to come
  - Ordered

**Questions**
A detail row that starts with a location (e.g. "WC41 Toilets: 0 of 10 numbered") has the location as a button that opens it the same way.

**Tested (practice copy on live data, phone size, writes blocked)**
- The FWF lists above came from the live record.
- WC41 opened on the form, on its day.
- WC31 opened from Questions.
- Nothing scrolls sideways, and there were 0 page errors.
- The money model is identical to v7.30, and the tab sweep shows 0 errors on desktop and phone.

**LIVE: 29 Sep 2026, 05:09 AEST.** It matches the build byte for byte on the view link.
