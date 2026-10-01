# v7.72 — tidy for management (built with v7.70 on the live page; results below)

Author: Andrew Fisher · 1 Oct 2026, 17:35 AEST

Andrew, 1 Oct 16:51: "I have management looking at GC500 tonight. Please make sure the costs are all up to date with as
much data as possible. No bugs, it's clean and tidy and easy to understand." 16:57: "I need both yourself and Codex
working together, making this a wow factor, like we know what we are doing."

Codex holds **v7.71** (the fencing forecast lookup, `cj771AddProgrammeForecast`, live at 17:1x); this tidy is **v7.72**
and is built on top of it with v7.70.

## Where it came from

A management read of every tab of the ready build — the rendered text, desktop and phone, every fold open — by seven
readers with one brief: what would a Coates manager who has never seen this page trip on tonight? Bugs in the text,
figures that contradict each other, stale text, anything from last year, any agent's name, jargon off the AGENTS.md
list. Their findings are in `evidence/management_read_findings.md`; the ones below are the ones that mattered
tonight and could be fixed in wording without changing a figure, a rule or the record. The rest is listed at the
end for the next pass.

## What it changes

| # | Where | Was | Now |
|---|---|---|---|
| 1 | Today — Delivery updates; Progress — RECORDED BY column; every fold that prints a recorder | "Andrew Fisher via Codex" — an agent's name on the page, eleven times | the person alone. The escaper every rendering goes through drops a " via Codex" / " via Claude (…)" suffix. The record is untouched; this is how the page shows it. |
| 2 | Progress — All branches together, the sentence under the branch bars | "$397,929 … the event labour scope $55,817, and the labour ticked $19,170 — the job's. With them, $571,967 is the revenue" — the parts did not add; $99,052 of servicing and water was unnamed | "…the labour ticked per piece $19,170, and the toilets' servicing and water charged on at our rates $99,052 — the job's. With them, $572,467 is the revenue charged to the V8s" |
| 3 | Costs — The working — the transport fold | headed "Transport (cartage) — our direct costs" and ending "No transport cost of ours recorded yet", while the Forecast P&L counts $22,011 from the schedule | headed "Transport (cartage) — lines typed here"; "No transport line typed here yet. The carriers' figures on the schedule's TPORT COST column are counted in the Forecast P&L above." |
| 4 | Costs to job end — Revenue to job end tile; At a glance — Revenue tile | carried the fencing programme only, with no word on the labour per piece still to tick | "… · labour per piece still to tick is charged as the work is done and is not carried here" |
| 5 | Today — the delivery cards | "FWF · Sub-hire · Event Portables" | "FWF · Rehire · Event Portables" |
| 6 | Costs and Progress — the short caveat | "subhire rehire cost not on the record" | "rehire cost of the sub-hired lines not on the record" |
| 7 | Forecast P&L — Not in it yet, transport | "37 loads … each written with a plus" when 35 of 37 carry one | "35 of them written with a plus, so at least that" (says "each" only when every load does) |
| 8 | Forecast P&L — the servicing line's tag | "priced by us · the card" on a figure that is $85,102 at the card and $13,950 at cost | "priced by us · the card + at cost" |
| 9 | Costs to job end — the fencing block and the fencing stream's note | "the deconstruction weeks still carry 2025 dates and are not forecast", printed whether or not any did | said only when the programme file has undated removal weeks, in this year's words: "the removal weeks in the programme file are not yet dated for 2026, so removal is not forecast" |

And v7.70's card, corrected after its own three-lens review (see `../v7.70_pl_in_the_business_lines_DRAFT/README.md`):
the direct-costs tile is the Costs to job end figure with the ledger split in its note; the difference is never called a
margin before the costs are complete; the Rehire lines bridge to the Rehire by branch card's figures; R&M (2357) on its
own line; the transport line says 2120 or 2140; the wages row says Temporary Staff.

## Build

```
bash toolchain/build.sh v7.72 v7.70_pl_in_the_business_lines_DRAFT/patch_v770.py v7.72_tidy_for_management_DRAFT/patch_v772.py
python3 toolchain/upload_page.py build/GC500_v7.72/GC500_Delivery_Control_hosted.html
```
`patch_v772.py` applies steps 1–4 with the exact-once replace every patch uses, then the wording list in
`evidence/replacements.json`, each checked to occur once in the build before it is applied (one that does not is
skipped and printed, never guessed).

## Results

On `build/GC500_v7.72` (8,662,539 bytes, SHA-256 `8695ee3806155d871c26929ecfee3799162355589e0d8d20e59e5424529b7ee8`), 17:31–17:35 AEST:

| Check | Result |
|---|---|
| v7.70 suite on the combined build (`../v7.70_pl_in_the_business_lines_DRAFT/evidence/`) | **30/30 desktop · 30/30 phone** |
| Sweeps (`evidence/regress/`) | 21 tabs, 0 page errors, 0 console errors, desktop and phone; 7 deep links clean |
| Every tab's rendered text (desktop), searched | "via Codex" / "via Claude": **0** (was 11) · the Progress paragraph: "…the labour ticked per piece, $19,670, and the toilets' servicing and water charged on at our rates, $99,052 — the job's. With them, $572,467 is the revenue charged to the V8s" · the transport fold: "No transport line typed here yet. The carriers' figures on the schedule's TPORT COST column are counted in the Forecast P&L above." · Today: "Rehire · Event Portables" ×3 · "35 of them written with a plus" · "2025" on the Costs tab: **0** |
| Screenshots of the new card | desktop and phone inspected: tiles, three tables, codes as chips, nothing cut, the page not widened |

**READY TO UPLOAD** — one build on the live v7.71: the two commands under Build.

## Left for the next pass (from the management read — wording, not figures)

Today: the "2 rows still need a reference" count against its list; "197 assets" where the page means references; the
"—:—" times on Due today; the ten-day-old roads snapshot; "Checking file availability" left in the Documents fold.
Progress: 168 + 26 ≠ 197 in The whole job; 58 vs 79 asset numbers; "Not itemised here" in the revenue table; "Subhire ·
59 lines" for the fencing dockets; the MEAD "0 lines · 1 contract" header; passed off-hire dates under "On site";
forklifts "coming in the next 7 days" when all are on site. Costs: 32 card lines vs the fold's 31; 63 vs 59 dockets;
the internal labour hours' parts; the 52 vs 51 loads; the BY BRANCH rehire cost column label; the 197 vs 307 line
counts in the working; cents on total rows. Docs: the header's count of photographs; "11 pages · 11 pages"; "rev iew";
raw file-name titles. Plant: the VMS heading printed twice; WC16's "x Male"; WC31 lit complete while short; the empty
DESCRIPTION SUPPLIED and STATE columns; the rental contracts table's SITE and CUSTOMER cells; editor buttons on the view
link; ISO dates beside friendly dates. Phone: the race-start marker cut from the calendar strips.
