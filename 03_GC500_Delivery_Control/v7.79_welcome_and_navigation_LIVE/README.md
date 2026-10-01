# GC500 v7.79 — welcome and navigation in Text it (LIVE)

Author: Andrew Fisher · 1 Oct 2026

Andrew asked for a professional welcome to Coates GC500, a picture and navigation. Text it now starts with
“Welcome to Coates GC500” and the reference/equipment description. A concise “Navigate:” link follows the GPS
position, whose provenance still distinguishes a recorded delivery location, mapped location or planned area.
The existing GPS provenance and access route remain present;
the pit-lane directions use shorter, professional wording. Optional card links say “Delivery details”. The drawer
shows a message preview and its existing marked map picture, selected by default when available.

This does not change coordinates, map rendering, sender configuration, receipt handling, job records or journals.
The alternate Full details view retains its existing expanded content. No claim of an attached picture is added
to the text, because the sender can choose plain SMS. A standard navigation link is not a truck-clearance route.

Build from live v7.77:

```bash
bash toolchain/build.sh v7.79 v7.79_welcome_and_navigation_LIVE/patch_v779.py
```

Review correction: the welcome keeps the navigation URL on one line and omits a redundant “Reference:” prefix,
so existing delivery-details links and due dates fit. Paired checks compare the new and live formatters against
the same fully loaded record and require that no existing link or due date is lost.

Frozen candidate: **8,682,654 bytes**, SHA256
`19d200c470b5ac7403efad12b42160a6e049c11f7ed7eadbe68b2a640999423a`.
Base: v7.77 `35e4b00b150e081425e70a642945799d4dbab822bdbc7939c888c0503e5c26ef`.
**LIVE 1 Oct 2026, 22:17 AEST, after both reviews completed.** Public view verified byte for byte against the
candidate above. Server v5.87 and record version 3521 unchanged. Static script/secret checks and upload dry-run pass.
Practice checks: **23/23 desktop and 23/23 phone**; both sweeps: **21 tabs, 7 deep links, zero page/console errors**.
Phone visual review passes. Across 201 references: maximum 456 GSM units/characters; all 199 original details links
and 184 due lines survive (200 links now fit). The real map image renders; MMS and SMS submissions were intercepted
locally, with no real sends or record writes. Aggregate proof: `evidence/final_verification.json`.
