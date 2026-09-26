# Dashboard evidence (v6.73 live record copy, 26 Sep 2026 ~19:45 AEST)

Load (local server, localhost network — not representative of the Gold Coast): desk DCL 1.11 s, FCP 0.26 s, Today drawn 1.26 s; phone DCL 0.94 s.
Start-up long task 649 ms desk / 605 ms phone. Tab switch to painted: today 185, progress 250, map 92, docs 146, plant 183, fencing 345, prestarts 61, coatesway 87, costs 254, pricing 228, timeline 271, about 83 ms (desk). Budget 150–200 ms: fencing, timeline, progress, costs, pricing over.
JS heap after visiting every tab once: 27 -> 108 MB desk, 23 -> 174 MB phone (release not measured).
Live: page 6.65 MB raw, 1.83 MB gzip (brotli would be 1.44 MB); TTFB ~0.5 s from a US test edge; service region asia-southeast1 (Singapore), volume 5 GB with ~1 GB used.
Header height: desk 273 px of 768 (36%); phone 363 px of 844 (43%) — no job data on the phone's first screen.
axe (WCAG 2 A/AA): header aria-required-children (critical, tab list); progress nested-interactive x17 (plates are buttons containing buttons), colour-contrast x5; docs colour-contrast x63; pricing/about scrollable-region-focusable; today contrast x1.
Files on live: 237 (117 drop photos, 44 docket images, 39 maps, 23 packs, 6 other, 5 SWMS, 3 transport), 785 MB; every one returns 200. 168 have server thumbnails (webp) but drop photos on cards load the full file (thumbUrl used once).
Exact-duplicate photo files: 5 groups / 17 files — one aerial shot filed on 10 references (HRP, AA, P37, P10–P16), another on P01/P03/P04, and three WC12 "in position" shots shared between WC12 units (incl. 1211961, the WC11/WC12 conflict asset).
Record integrity: 202 refs (3 cancelled); 57 due, 57 on site, 52 complete, 0 overdue, 0 unrecorded; 148 references have no out date; 58 dockets, 1 partly priced (workbook:Week 6:row3), 0 of 58 with signed paper; 0 breakdowns; 1 variance.
Day pod: next delivery day Mon 28 Sep shows "9 NOT RECORDED ON SITE" with a warning icon — for a day that has not happened.
Phone nav: "Coates Way" label clipped to "Coates Wav".
Weather: live /api/weather works (19.4 °C Surfers Paradise); the "no weather key" line seen locally is a local-only artefact.
