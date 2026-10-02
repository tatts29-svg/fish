# v8.05 — links that go where they say, and Today's money once

Author: Andrew Fisher · 2 Oct 2026 · **DRAFT, under independent review (Claude)**, not live. Built on live v8.07 (`35024d43…`), which already carries v7.99.

## Why

The read-only audits of Map explorer and The Coates Way (2 Oct) found two routing faults. Andrew: "Proceed".

Today's Money fold repeated the three money totals on Costs. Andrew saw the mock-up and approved it ("Approved", twice).

## What changes

**The Coates Way.**
- **The fault:** none of its links went anywhere. The four pillars (People, Operations, Assets, Financials) and the red rows set the page's tab without moving to it, so the page stayed on The Coates Way while its record said Costs.
- **The fix:** they now go through `go()`, like every other link on the page. Where we are opens Today, and the register opens Equipment.

**Map explorer.**
- **Reloads and links:** a reload, bookmark or link to `#sheet/__explorer` opened the old master-plan page and stayed there. That page counts Portable buildings as 50 against the explorer's 52. The address was read before the page's connection to the service was up. The request is now remembered, and the explorer opens as soon as it can.
- **Named drawings:** a link to a named drawing (for example the aerial) opened the master plan on a first visit. It now opens that drawing.

**Today, Money** (screen only; paper prints as before):
- **Off the screen:** "Are we making money?". Its revenue, direct costs and difference are on Costs & charges.
- **Moved into the "Revenue, by stream" card:** what that card held that is on no other tab.
  - The "Forecast incomplete — not a margin" line, with a link to Costs & charges.
  - A More info with each stream's revenue · direct costs · the difference, and what is not in it yet.
- **Found while building:** the first mock-up would have lost those per-stream differences. They are kept.

## Build

```
bash toolchain/build.sh v8.05 v8.05_links_that_go_DRAFT/patch_v805.py
```

- Base: live v8.07 `35024d43405947d59c106e858221f8c40ed9629bcf6b19b1081f87c4da6799ed` (9,101,458 bytes).
- Candidate: **9,103,335 bytes, SHA-256 `d0f5391fa7504114d51625f989b12bef896dd098a186903f6c390a8d3e86db0c`**.
- `check_page` passes.

## Checks (`evidence/run_all.sh`, all read-only)

| Suite | Result |
|---|---|
| `v805_tests.js` | **10/10 desktop, 10/10 phone**. On live v8.07 the same file fails the link, explorer, drawing and Money checks, which is the reason for this release. |
| v7.99 tests | 23/23, 18/18 |
| packed | 20/20, 14/14 |
| Equipment | 22/22, 22/22 |
| results | 9/9, 9/9 |
| navigation | 21/21 |
| rules | 45/45 |
| fresh | 11/11 |
| one tab | 22/24 each, the same two folded-heading misses as live |
| Both 21-tab sweeps | 0 page errors, 0 console errors |
| Text against live | Every tab matches word for word except Today's Money. Today loses "Are we making money?", "Difference so far", $235,372 and $337,095, and gains the stream differences and the caveat. |

Screenshots stay out of the repo (Today shows "Who to call" numbers).
