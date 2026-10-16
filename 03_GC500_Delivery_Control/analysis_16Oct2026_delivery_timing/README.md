# Coates delivery timing, 1–16 Oct 2026 — from the delivery texts

Author: Andrew Fisher. Andrew sent the export of the "Coates" text thread (150 texts, 1 Oct 07:49 to 16 Oct 15:14). Read
only: nothing goes to the record. The raw export is not kept in the repository.

Each order: the "received and is being prepared" text (with the promised window), any re-sent windows, "on its way",
then "delivered". 48 deliveries matched. Six booked before the export starts take their windows from Andrew's pasted list
(booking time unknown).

| | |
|---|---|
| Delivered inside the first window promised | **36 of 48 (75%)** (35 on time, 1 early) |
| Inside a later, widened window only | 3 (WC09 ×2, telehandler fork extension) |
| Late, even against the widened window | 9 |
| Windows re-sent | 13 orders, 12 of them made wider (3 h → 4–7 h) |
| "On its way" text to delivered | median 1 h 45 min (30 min to 4 h 10 min) |
| First text to delivery | median 54 h (2 h to 5 days) |

Worst: 8 Oct, none of 4 in the first window. VMS senior and WC31 both arrived 15:09–15:10 against 07:00–10:00 (5 h 10 min
late), still past their widened 13:00/14:00 windows. Forklift 5 t (6 Oct) 3 h 10 min late; toilet block (1 Oct) 3 h 9 min;
container (13 Oct) 2 h. Best: 7 Oct and 16 Oct 11 of 11 each, 14 Oct 4 of 4. Early-morning drops (05:00–08:30) held their
windows; misses cluster in later-morning second loads.

Not yet due: 19 Oct water barriers 07:00–10:00, scissor lift 08:00–11:00 (widened to 12:00), VMS senior +1 09:00–12:00
(moved to 09:30–12:30).

    python3 parse_sms.py sms.txt orders.json     # the export's text (pdftotext -layout)
    python3 summarise.py orders.json report.json orders.csv

`orders.csv`: one row per delivery; `report.json`: the summary.
