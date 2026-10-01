# GC500 v7.79 — welcome and navigation in Text it

Author: Andrew Fisher · 1 Oct 2026

Andrew asked for a professional welcome to Coates GC500, a picture and navigation. Text it now starts with
“Welcome to Coates GC500” and a labelled reference/equipment line. Navigation is labelled for the recorded
delivery location, mapped location or planned area. The existing GPS provenance and access route remain present;
the pit-lane directions use shorter, professional wording. Optional card links say “Delivery details”. The drawer
shows a message preview and its existing marked map picture, selected by default when available.

This does not change coordinates, map rendering, sender configuration, receipt handling, job records or journals.
The alternate Full details view retains its existing expanded content. No claim of an attached picture is added
to the text, because the sender can choose plain SMS. A standard navigation link is not a truck-clearance route.

Build from live v7.77:

```bash
bash toolchain/build.sh v7.79 v7.79_welcome_and_navigation_DRAFT/patch_v779.py
```

Frozen candidate: **8,682,797 bytes**, SHA256
`6a6cf581e70f6f58892b685d28bf87fb4017f0efe5f3420487f2b2a823443a21`.
Base: v7.77 `35e4b00b150e081425e70a642945799d4dbab822bdbc7939c888c0503e5c26ef`.
Static script/secret checks pass. Practice checks, both sweeps and independent review are in progress.
**Not ready to upload** until both agents complete their review of this same candidate.
