# v7.16: no pre-bill amounts, anywhere (LIVE)

Author: Andrew Fisher

Andrew, 27 Sep 2026: "Do not use pre-bill amounts for anything."

- `prebill_amount` is removed from all 307 on-hire rows in the embedded data.
- Every pre-bill display, comparison, "to settle" list and question is gone from Costs & charges, Where we are,
  Pricing, Today, the drawer, the Questions page and both emails. `prebillReads()` and `contractDiffWords()` are removed.
- **One basis changed, not the figures:** the 10 transport and delivery contract lines took their charge from the pre-bill.
  They now charge price × quantity, which gives the identical amount on every one of them; the patch checks this before
  it writes. Transport revenue is still $6,938.47. Andrew may want to confirm price × quantity is the right basis for
  those lines.
- **The money probe is identical before and after.** The only changes are the removed pre-bill fields, and the
  "not in it yet" count drops from 7 to 6.

**LIVE: 28 Sep 2026, 00:50 AEST.** The page is v7.17 live + `patch_v716.py`, verified byte for byte on the view link.
