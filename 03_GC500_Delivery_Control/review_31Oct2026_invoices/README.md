# The V8s' invoices, 31 Oct 2026: each one against its contract (read only)

Author: Andrew Fisher · 31 Oct 2026 · read only (no record change, no page release). Andrew sent 19 Coates tax invoices
(27–30 Oct 2026) in this chat after Baseplan (12) (`review_31Oct2026_baseplan12/`): "i now have all invoices keep in mind
some things might not be complete some things have also been invoiced to the last day 13/11/2026 some things we are
waiting on example the fencing". The invoices stay private (not committed); `parse_invoices.py` reads their text
(`pdftotext -layout`) and checks every line against the export's Billed Amount.

## Result

Every line on all 19 invoices equals Baseplan (12)'s Billed Amount for that contract line, to the cent. On top of the
contract lines the invoices carry two things the export does not:

- **LTD Waiver Charge**, 12.5% of the hire charges, on 16 invoices: **62,963.33**. Not on the VMS invoice 9961265 (LTD
  Waiver No) or the three stock invoices (scrim, consumables). Andrew, 23 Oct 2026: "Damage waiver etc we dont worry about
  unless I tell you different when they invoice" — now they have; in or out of the P&L is his call.
- **Env Charge** 16.84 on 9994248.

| Branch | Contract charges (= Baseplan) | LTD waiver | Other | Invoiced ex GST |
|---|---|---|---|---|
| KINP (10 invoices) | 442,208.45 | 20,341.90 | — | 462,550.35 |
| STPS (6) | 424,448.29 | 37,192.36 | 16.84 | 461,657.49 |
| NVAC (1) | 48,739.96 | 3,265.79 | — | 52,005.75 |
| MEAD (2) | 24,660.25 | 2,163.28 | — | 26,823.53 |
| **19 invoices** | **940,056.95** | **62,963.33** | **16.84** | **1,003,037.12** |

The generator invoice (9961976, 25121022, 27 Oct) came last: every line equals Baseplan (12) to the cent, plus waiver 3,265.79. Every contract with a billed amount now has its invoice; 9968929 bills nothing.

## For the branch (from the invoices against the record)

1. **VMS02, VMS03, VMS07 on both 10001927 and 9961265.** 10001927 bills them for the event week (VMS02 23–26 Oct 214.44;
   VMS03, VMS07 19–26 Oct 428.88 each) while 9961265 lines 4, 5 and 8 bill block amounts across those dates. 1,072.20 plus
   waiver if they are the same boards. (VMS19, VMS20 and VMS05/05a moved to 10001927 and are nought on 9961265: fine.)
2. **WB02 (9972648 line 3), 34 barriers:** billed 21–25 Sep, 7 days, 280.84; on the record on site since 21 Sep, out with
   the S08 run on Tue 3 Nov.
3. **WB03:** billed to 19 Oct 22:00 (1,097.40); the record has the 30 barriers leaving 29 Oct.
4. **Fencing 9990776:** invoiced 335,180.04 plus waiver, on hire to 13 Nov; the page charges Advanced's dockets at the card,
   365,341.63. Waiting on Advanced's invoices, as Andrew said.
5. **Billed in advance to 13 Nov:** the fencing, the post-event VMS (VMS13, 15, 16, 17), three construction boards on
   9961265, WC20 and WC86. Anything off hire before then is a credit to ask for.

## The generator contract (9961976), from its invoice

6. **The 839.07 pick-up charge (29 Oct, Baseplan line 61) is not on the invoice** (dated 27 Oct): it comes on the next one,
   still naming no asset.
7. **Hire billed to 28 Oct 08:00, still on hire:** GN18 and GN19 (on site on the record, ready for collection; Baseplan terms
   them 30 Oct), GN01 (left 30 Oct 14:30), and LT01–LT04 and LT09 (Molendinar; not on the site record). More hire to come on
   each until it is off hire.
8. **No fuel line** (Andrew, 29 Oct 2026: "get NVAC to add fuel").
9. **Transport for 12 of the 13 generators** (24 legs), with a labour charge on all 13: the 350 kVA's transport or the spare.
