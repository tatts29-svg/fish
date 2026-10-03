# v7.39: fencing purchase orders read Receipt ID No. (LIVE)

Author: Andrew Fisher

Andrew, 29 Sep 2026:

> "Fencing has another purchase order, P/O 4658850, description INV 93920 - partial Collection, Receipt Id No 4922343, total $195. I'm using the Receipt Id No. Can we change the invoice no to receipt id no please in this area, as I have been using the Receipt Id with everything in this section."

## What changed (Fencing tab, Purchase orders card)
- The **Invoice** column now reads **Receipt ID No.** It's the same stored field, so the two receipt IDs already typed (4918492 on PO 4647508, 4922398 on PO 4647509) are exactly where they were.
- A **Description** box on every order (the order's note).
- A new order's period starts blank. **Save** keeps the receipt ID, description and value without a period; **Confirm** needs one. The button says which it will do.
- The summary, the saved message, the card's note and the branch plate all say receipt ID.

## Entered on the live record for Andrew
- PO 4658850 added, with receipt ID 4922343, description "INV 93920 - partial Collection", value $195. Its period is still to pick; press Confirm once it's known.

## Tested (practice copy on live data, writes blocked)
- Save without a period keeps all three fields, confirmed stays off; pick a period and Confirm sets it on with the right schedule week.
- An existing confirmed order keeps its receipt ID and value when re-saved with a description.
- The description box is locked on the view link.
- Money model identical before and after.
- Tab sweep: 21 tabs, 0 errors on desktop and phone.

**LIVE: 29 Sep 2026, 15:51 AEST.** It matches the build byte for byte on the view link.
