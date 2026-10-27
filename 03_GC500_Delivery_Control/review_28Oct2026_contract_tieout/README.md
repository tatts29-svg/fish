# Contract tie-out, 28 Oct 2026: live v12.42.8 against Baseplan SuperCars (8), line by line

Andrew: "Lets relook again make sure our figures match contract for contract and yours is to the cent", "let me know what the branch needs to fix. Or work it out yourself".
Read only. Page side: `lines.cjs` on the live page (435ee86f…), contractCharge per line. Baseplan side: Prebill Amount per line. `tie_rows.json` = the 119 lines that differ. `tie.py` re-runs it.

Totals by charge type (fencing 9990776, cancelled 9973079/9994996 and held 9994248 left out):

| Type | Baseplan prebill | Page, contract lines | Page, P&L line |
|---|---|---|---|
| Transport (FRI) | 152,520.18 | 152,020.18 | 159,313.48 |
| Hire (HIR) + sub (SUB) | 241,743.62 | 233,584.74 | hire + rehire, priced from the record |
| Labour / install (INS) | 98,704.37 | 7,700.00 | 107,438.93 (ticks on the record) |
| Pump-outs (TOI) | 66,145.14 | 0 | 70,985.79 |
| Cleaning (CLE) | 6,246.00 | 0 | 8,328.00 |
| Accommodation (MIS) | 28,200.00 | 500.00 | 27,700.00 |
| Consumables (CON) | 12,754.42 | 0 | 0 |

See the chat answer of 28 Oct 2026 for the fix list.
