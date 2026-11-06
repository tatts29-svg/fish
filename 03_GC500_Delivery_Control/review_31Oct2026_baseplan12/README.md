# Source review, 31 Oct 2026: Baseplan SuperCars (12) against (11)

Author: Andrew Fisher · 31 Oct 2026 · read only (no import, no page release, no record change). Record 12622.

Andrew, 31 Oct 2026 (this chat), with the export: "i now have all invoices keep in mind some things might not be complete
some things have also been invoiced to the last day 13/11/2026 some things we are waiting on example the fencing. lewtg me
know and ill start sending you the invoices then that way we can now tidy everything up. this is the last piece now that
needs to be done."

| Source | Private file (not committed) | SHA256 | Size |
|---|---|---|---|
| Baseplan SuperCars (12), 20 contract sheets + Delivery Dockets | `a268295e-Baseplan_SuperCars.xlsx` (staged as `Baseplan_SuperCars_12.xlsx`) | `5ccf97db…` | 150,595 bytes |
| Compared with Baseplan (11), 30 Oct | `Baseplan_SuperCars_11.xlsx` | `6c812e40…` | 147,210 bytes |

Method: `review_29Oct2026_baseplan9/to_json.py` and `diff67.py` on both exports. Billed Amount only; pre-bill is never used.

## What changed

One thing: a new contract, **10001927 (STPS), 12 lines, billed 7,314.62**. Every line on the other 19 contracts is the same
as (11) (0 changed, 0 gone), and so are the Delivery Dockets.

**Billed Amount, all contracts (ex GST): 932,742.33 → 940,056.95.** KINP 442,208.45 · STPS 424,448.29 · NVAC 48,739.96 ·
MEAD 24,660.25.

## 10001927 (STPS)

| Lines | What | Dates | Billed |
|---|---|---|---|
| 1, 2 | VMS11 467T (Premiair), VMS12 Junior (1211646) | 16–22 Oct, 7 days at 53.61 | 375.27 each |
| 3 | VMS02 Message Board | 23–26 Oct, 4 days | 214.44 |
| 4–8 | VMS03, VMS05, VMS07, VMS19, VMS20 Message Board | 19–26 Oct, 8 days | 428.88 each |
| 9 | Labour Charge VMS | 12 × 176.97 | 2,123.64 |
| 10 | Transport Charge VMS | 8 × 154.50 | 1,236.00 |
| 11, 12 | Fence Feet, Concrete | 200 and 80 at 3.02, one week from 29 Oct | 604.00 + 241.60 |

- VMS19 487T and VMS20 475T, at nought on 9961265 since (11), are billed here: that answers question 1 of the (11) review.
- VMS11 and VMS12 are no longer on 9961265; they are billed here.
- To check against the invoices and the record: VMS02, VMS03 and VMS07 are also on 9961265 (lines 4, 5 and 8, fixed amounts
  spanning 7 Sep to 28 Oct or 13 Nov), so the event-week days on this contract may be charged twice, or the boards here may
  be other boards under the same names.
- VMS labour across the two contracts is now 20 + 12 = 32 charges for the 24 boards on the record, and transport 40 at
  150.00 + 8 at 154.50 + 8 site shifts.

## Next

Andrew sends the invoices; each one is matched to its contract's lines and the site record, the open items listed (the
fencing 9990776 waits on Advanced's invoices; some contracts are billed to 13 Nov), then the P&L by branch and month.
