# Coates delivery timing, 8 Sep – 16 Oct 2026 — from the delivery texts

Author: Andrew Fisher. Andrew sent the "Coates" text thread as a spreadsheet (335 texts, 8 Sep 09:39 to 16 Oct 15:14;
the earlier PDF held 1–16 Oct only). Read only: nothing goes to the record. The raw export is not kept in the repository.

Each order: the "received and is being prepared" text (with the promised window), any re-sent windows, "on its way",
then "delivered" or "could not be delivered". Two or more of the same item on the same day are separate units.

| | 14–30 Sep | 1–16 Oct | All |
|---|---|---|---|
| Deliveries with a booking text | 47 | 48 | **95** |
| Inside the first window promised (incl. early) | 17 (36%) | 35 (73%) | **52 (55%)** |

All 95: 42 on time, 10 early, 16 only inside a later widened window, 26 late even against the widened window, 1 delivered
on a later day (WC50: booked 25 Sep 07:00–10:00, delivered 28 Sep 12:49). Windows re-sent on 53 orders, 44 of them made
wider. "On its way" to delivered: median 1 h 50 min. First text to delivery: median about 2¼ days.

Worst days: 14 Sep (1 of 13 in the first window; the 12 m buildings booked 04:30–07:30, moved to 09:00–14:00), 21 Sep
(0 of 8), 25 Sep (0 of 5), 8 Oct (0 of 4; VMS and WC31 5 h 10 min late). Best: 7 Oct and 16 Oct 11 of 11 each, 14 Oct
4 of 4. Longest single delays inside a day: 4.8 m building 21 Sep (5 h 40 min), trakmat 15 Sep (5 h 30 min), VMS and
WC31 8 Oct (5 h 10 min).

Could not be delivered: 4.8 m × 3.0 m building +1, 15 Sep 15:49; no later delivered text under that name. No delivered
text found: 6.0 × 3.0 +5 (14 Sep, Main Beach), 6.0 × 3.0 and commentary booth and a toilet block (23 Sep), WC60 sewage
tank +1 (1 Oct). Delivered with no booking text: P06, three 6.0 × 3.0 cyclone +1 and WC01 (28 Sep). Not yet due:
19 Oct water barriers, scissor lift, VMS senior +1.

    python3 parse_sms.py <export .xlsx or pdftotext .txt> orders.json
    python3 summarise.py orders.json report.json orders.csv

`orders.csv`: one row per delivery; `report.json`: the summary.
