# v7.33: labour follows the order (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026, after the WC01 fix: "Check all similar for bugs."

**What the check covered.** Every live location was checked for the same class of problem: numbers against orders, labour units against quantities, and items sharing numbers.

**What it found**

| Where | Problem | Effect |
|---|---|---|
| **P36** (Harry the Hirer, 1 × Building 6m) | Carries two numbers: 1282487, recorded on site and on the rental contract, and 1327222, from the schedule (which also gives it to P53). The ticks count once per number. | Install, steps and levelling charged twice: $707.88 for one building instead of $353.94. |
| **Any location with some numbers but fewer than it ordered** | Only the numbered units could be ticked. No live location was affected yet; the walk-around would have triggered it. | Example: WC51 (6 FWF) with 2 numbered would offer 2 installs, and 4 would be lost from labour. |
| **WC05** | Its one number counted as its waste tank rather than its toilet block (a tie). | The label only; one number means one plain tick. |
| **Anywhere** | A location carrying more numbers than it ordered wasn't flagged. | — |

**Fixes**
- **Labour never counts more buildings than the order.** The numbers recorded on site or typed here are kept first. P36 is now charged once, $353.94.
- **Fewer numbers than ordered:** the unnumbered units become one more set of ticks, "n more with no number yet", charged for n.
  - WC51 test: the plan stays $614.19 before and after numbering.
  - Ticking all its installs gives 6 × $36.44 = $218.61.
- **Ties:** an ancillary item (tank, pee panel, steps) loses a tie, so WC05's number counts as its toilet block.
- **Questions:** new item "locations with more asset numbers than ordered", naming each number and where it came from. P36 is listed.
- **Inventory:** counts numbers on mixed locations the way the split counts them.

**Checked**
- Every location's labour, v7.32 against v7.33: exactly one line changed, P36 (from $707.88 to $353.94, from 2 units to 1).
  - Labour charged: $17,384.70 to $17,030.76.
  - Charge total: $406,197.78 to $405,843.84.
  - Both differences are the $353.94 double count.
- The tab sweep shows 0 errors on desktop and phone.

**Still needs a person.** P36 still carries 1327222 on its record and drop sheet. If 1282487 is the building at P36, take 1327222 off there: P36 on the Change form, Allocated asset numbers, ×.

**LIVE: 29 Sep 2026, 05:34 AEST.** It matches the build byte for byte on the view link.
