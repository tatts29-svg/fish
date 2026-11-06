# v8.05 — links that go where they say, and Today's money once

Author: Andrew Fisher · 2 Oct 2026 · **READY TO UPLOAD (Claude, 2 Oct 2026 18:30 AEST)**, not live. Built on live v8.07 (`35024d43…`), which already carries v7.99.

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
- Candidate: **9,103,625 bytes, SHA-256 `36d27b553b9d2ee8c221b155d49d760d02fd225645653eaaec9f3637fd3789ad`**.
- Superseded: `d0f5391f…`, before the review fixes below.
- `check_page` passes.

## Checks (`evidence/run_all.sh`, all read-only)

| Suite | Result |
|---|---|
| `v805_tests.js` | **16/16 desktop, 15/15 phone**. Added after the review: three drawing links, `__satellite3d` and an unknown key landing on the master plan, a pending explorer request never overriding a later link, Money totals read from the record, and real-PDF page counts equal to live. On live v8.07 the same file fails the link, explorer, drawing and Money checks, which is the reason for this release. |
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

## Independent review (a separate agent, 2 Oct 2026)

**Found in `d0f5391f`:**

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | **Blocker** | A link to a map view that is not a drawing (`#sheet/__satellite3d`) or an unknown key opened drawing D022 instead of the master plan. The check read the page's default sheet, not the key in the address. | It now reads the key from the address. These links land on the master plan, as live does. |
| 2 | Should fix | A pending explorer request was never cleared, so with poor signal it could override a later drawing link or a map search. | Any other address, or a search, now clears it, and it only acts while the address still asks for the explorer. |
| 3 | Test gaps | | Filled; see the checks table above. |
| 4 | Nit | The Coates Way red rows can't be reached by keyboard. This is older than this release. | Left for the Coates Way layout follow-up. |
| 5 | Nit | The docstring named the wrong base, and the patch had no base guard. | Fixed. |

**Confirmed clean:**
- Coates Way links by mouse, Enter and Space, and the back button.
- The Money block's figures match the hidden card character for character.
- The Costs link works.
- Paper page counts equal live, from real PDFs.

**Re-review of the fixes:** both confirmed, nothing new found. The reviewer rebuilt the patch and got exactly `36d27b55…`.
- **Each map address, loaded fresh:** all land where they should, with no D022 flash.
  - `#map`, `#sheet/__explorer` and `#sheet/__satellite` open the explorer.
  - `#sheet/__satellite3d`, MASTER and NOPE open the master plan.
  - AERIAL and D022 open themselves.
- **A leftover explorer request:** a later link or search wins.
- **A slow connection:** the explorer opens once, and a search or link wins over it.
- **Nits, not regressions:** if the connection is slow and the person leaves the map, the Map tab later opens the master plan, as live does; an address with escaped underscores lands on the master plan.

**Codex's semantic review of the Money change** (PR #1, 2 Oct): PASS, with its own 10/10 actual-page checks. No unique fact is lost.

**Repeats on the same live record:** live 165 (119 across tabs, 46 on the same tab); v8.05 165 (117, 48). The two money totals no longer repeat across tabs. The moved More info restates each stream's revenue beside its bar, as the hidden card did.
