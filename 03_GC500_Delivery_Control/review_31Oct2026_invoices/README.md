# The V8s' invoices, 31 Oct 2026: each one against its contract (read only)

Author: Andrew Fisher · 31 Oct 2026 · read only (no record change, no page release). Andrew sent 18 Coates tax invoices
(27–30 Oct 2026) in this chat after Baseplan (12) (`review_31Oct2026_baseplan12/`): "i now have all invoices keep in mind
some things might not be complete some things have also been invoiced to the last day 13/11/2026 some things we are
waiting on example the fencing". The invoices stay private (not committed); `parse_invoices.py` reads their text
(`pdftotext -layout`) and checks every line against the export's Billed Amount.

## Result

Every line on all 18 invoices equals Baseplan (12)'s Billed Amount for that contract line, to the cent. On top of the
contract lines the invoices carry two things the export does not:

- **LTD Waiver Charge**, 12.5% of the hire charges, on 15 invoices: **59,697.54**. Not on the VMS invoice 9961265 (LTD
  Waiver No) or the three stock invoices (scrim, consumables). Andrew, 23 Oct 2026: "Damage waiver etc we dont worry about
  unless I tell you different when they invoice" — now they have; in or out of the P&L is his call.
- **Env Charge** 16.84 on 9994248.

| Branch | Contract charges (= Baseplan) | LTD waiver | Other | Invoiced ex GST |
|---|---|---|---|---|
| KINP (10 invoices) | 442,208.45 | 20,341.90 | — | 462,550.35 |
| STPS (6) | 424,448.29 | 37,192.36 | 16.84 | 461,657.49 |
| MEAD (2) | 24,660.25 | 2,163.28 | — | 26,823.53 |
| NVAC | 48,739.96 on Baseplan | invoice not yet sent | | |
| **18 invoices** | **891,316.99** | **59,697.54** | **16.84** | **951,031.37** |

Still to come: 9961976 (NVAC, generators and lights). 9968929 bills nothing.

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
