# v10.42 — every FWF gets its event-night servicing, Coates' FWF trailers included — LIVE 16 Oct 2026 14:35 AEST

Author: Andrew Fisher. Andrew, 16 Oct 2026: "We charge for all FWF including Coates. For Fridays and Saturdays and
Sundays."

v10.40 charged FWF Pump out & Clean & Restock ($72.87 a unit a night, Fri, Sat, Sun) on every line named "FWF": 233
units on live references, Event Portables' and Coates' alike (WC32 is cancelled and stays out). It missed **WC100**, the
two Coates FWF trailers (fleet 1248439 at S18, 1288823 at The Spit), because their line reads "FWF Trailer". v10.42
counts them the same way, one unit each.

| | v10.40 live | v10.42 |
|---|---|---|
| FWF units charged | 233 | 235 |
| FWF line (units × 3 nights × $72.87) | 699 → $50,936.13 | 705 → $51,373.35 |
| WC100 | not charged | $145.74 a night, $437.22 for the three nights |
| Servicing charged to the V8s (with water at cost) | $84,717.18 | $85,154.40 |

Waste tank, sewer-connect and water lines unchanged; cost side unchanged. Footer v10.40 → v10.42 (v10.41 is claimed for
the 3D compass). No record changes.

Built on live v10.40 (`2d8b11f5…dd95`): 18,057,349 bytes, check_page PASS. `tests/test_fwf1042.cjs` 12/12 against the
live record (read only). Sweeps desktop and phone: every tab shown, 0 page errors, 0 console.

    bash toolchain/build.sh v10.42 v10.42_coates_fwf_trailers_nights_DRAFT/patch_v1042.py
    python3 toolchain/upload_page.py build/GC500_v10.42/GC500_Delivery_Control_hosted.html
