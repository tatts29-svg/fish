# v10.48 — Coates delivery times on each past day card — READY TO UPLOAD

Author: Andrew Fisher. Andrew, 16 Oct 2026: "Good data to have against each day card I think. Days that have passed."

Each Build (Timeline) day that has passed and has Coates delivery texts now carries a fold, **Coates trucks · delivery
times**. Andrew: "Percentage time is important out of 100%." So the header leads with the day's on-time percentage, out
of 100%, in large type with a bar: green at 80% or more, amber 50–79%, red under 50%. Under it: "1 of 13 inside the
booked window · 14 texted · build to date 8% (1 of 13)". Build to date is the running figure up to and including that
day (16 Oct: 55%, 52 of 95, as the analysis). Opened, the fold lists one line per truck:

- the item and its reference;
- the result: On time, Early (and by how much), In the re-sent window, Late (how long after the booked window), Delivery
  failed, Came a later day, No delivered text, or No booking text;
- the booked window, any re-sent window, the "on its way" time and the delivered time.

The fold shows in both the one-day and every-day views, on the phone too.

| Rule | Why |
|---|---|
| Only days before today | Andrew: days that have passed. Today's trucks show tomorrow (16 Oct is held: 11 of 11). |
| Nothing after 16 Oct | The export was taken 16 Oct 2026 17:47. 19 Oct bookings are not shown until a new export is added. |
| "Inside the booked window" = on time + early | Same as the analysis README (52 of 95 overall). |
| A booking with no delivered text says so | It is not counted as late, and not counted in the header's figure (23 Sep: three bookings, no delivered text). |

Source: `analysis_16Oct2026_delivery_timing/orders.csv`, which the patch copies in when it runs (106 rows over 19 days,
up to 16 Oct). Every day's header matches `report.json` `by_day`. The raw SMS export is not committed. The record,
charges and costs do not change. Footer v10.47 → v10.48.

**To refresh with a newer export:** re-run `parse_sms.py` and `summarise.py`, then set `EXPORT_DAY`/`EXPORT_AT` in
`patch_v1048.py` and build again.

Built from live v10.47 `fb68b94d…`, check_page PASS. `tests/test_dt1048.cjs` 15/15 (GET only). Sweeps desktop and phone: 18 tabs shown, 0 errors, 0 console.

    bash toolchain/build.sh v10.48 v10.48_delivery_times_DRAFT/patch_v1048.py
    node v10.48_delivery_times_DRAFT/tests/test_dt1048.cjs build/GC500_v10.48/GC500_Delivery_Control_hosted.html
    python3 toolchain/upload_page.py build/GC500_v10.48/GC500_Delivery_Control_hosted.html
