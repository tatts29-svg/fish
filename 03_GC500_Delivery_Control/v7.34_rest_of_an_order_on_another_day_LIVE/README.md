# v7.34: the rest of an order on another day (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026, on WC01's accessible toilet:

> "Since the accessible toilet did not turn up, how do we get this as not turned up, or push it to a next-day delivery?"

**Not turned up:** Change → WC01 → What turned up → Accessible Toilet **0**. WC01 shows Short (v7.30).

**Pushed to another day (new):** under a short item, What turned up now offers **Deliver the rest (n) on [day] → Book it** (tomorrow by default). That makes a follow-up reference, **WC01-R1**, which is a delivery only.

- **What the follow-up has of its own:**
  - its day on the Timeline and Change deliveries;
  - its own light;
  - its own driver and install sheets. The 30 Sep driver sheet reads "DELIVER WC01-R1 · Accessible Toilet → WC01 - Toilets · Accessible Toilet ×1";
  - WC01's spot on the master plan, so Navigate works.
- **What stays on WC01:** the order, its money, its asset number and its install ticks. The follow-up has no charge lines, no card value, no labour, no inventory row and no walk-around row, so nothing is counted twice.
- **Where it shows:** WC01's Short reads "Accessible Toilet 0 of 1 - rest due Wed 30 Sep (WC01-R1)" everywhere Short shows, including Questions. The follow-up's own form says what it is and links back to WC01.
- **When it arrives:** ticking WC01-R1 on site counts as arrived on WC01. Short clears, WC01's accessible toilet install tick appears, and the inventory counts it. Leave WC01's "arrived" box as it is.

**Tested (practice copy on live data, phone size, writes blocked)**
- WC01: Accessible 0 and FWF 2, then Book it for Wed 30 Sep. WC01-R1 was made with rest_of WC01, 1 × Accessible Toilet.
- WC01-R1 is on 30 Sep only, with Navigate at WC01's spot and the driver sheet as above.
- Once WC01-R1 was set on site:
  - WC01's Short cleared;
  - WC01's install ticks are Accessible and FWF 1211958 and 1211967;
  - accessible toilets on site went from 1 to 2.
- **Money was identical at every step:** before, after booking, and after arrival. Charge $405,843.84; labour plan unchanged.
- The money model is identical to v7.33, and the tab sweep shows 0 errors on desktop and phone.

**LIVE: 29 Sep 2026, 05:50 AEST.** It matches the build byte for byte on the view link.
