# v7.49 — The card fills the gaps (DRAFT: built and tested, not live)

Author: Andrew Fisher · 30 Sep / 1 Oct 2026

Andrew, with the Street Rate Card 2026 PDF: "Can you not use the rate card to fill in the gaps. We can edit the hire
rate later on if needed."

Files are named `patch_v748.py` / `card748_src.js` (the number was taken before Codex's live v7.47 was known); the
release is **v7.49** and needs the text release **v7.48** built with it:
`toolchain/build.sh v7.49 v7.48_text_it_says_what_and_where_DRAFT/patch_v747.py v7.49_card_fills_the_gaps_DRAFT/patch_v748.py`

## Where it is up to

Built on the live page (Codex's v7.47, 8,398,298 bytes) and tested. **Not uploaded**: Claude's container has no
`GC500_EDIT_TOKEN`. Whoever has the key: rebuild on live, rerun `evidence/practice_tests.js` and both sweeps, upload,
rename both folders `_LIVE`, update `STATUS.md`.

## What it does

1. **Toilet servicing is charged at the card's pump-out rates.** Event Portables' quote Q6844 quantities — 780 FWF
   services, 24 holding-tank pump-outs, 51 toilet-block cleans — at the card's FWF Pump out & Clean & Restock $72.87,
   Tank Pump Out & Clean & Restock $624.60 and Sewer Connect Units Clean & Restock $260.25 = **$85,101.75**. It is in
   the revenue total, the Toilets and servicing stream and the summary email, and it says it is on no contract line
   yet. The water truck, pre-fill, water deliveries and drinking-water tank ($12,200 their cost) have no card line and
   stay uncharged, listed as needing a price.
2. **Any rate can be changed later.** Each servicing rate and every contract line still without a rate has a box on
   Costs → From the Street Rate Card 2026 (editing link only). A typed rate is saved to the shared record
   (`lineRates`, named and stamped), wins over the card, and an empty box puts the card's rate back.
3. **Decisions stand.** The project manager's 1 Oct 2026 answers (Codex's v7.47) — the six waste tanks included in
   toilet-block hire, contract 9968929 for Coates' own use — are never overridden. The contract's own rule runs
   first: a rate on the line, or a decision, always wins.
4. **Per-day plant is not guessed.** 33 lines (16 generators, 8 forklifts, 7 light towers, 2 attachments) still have
   no rate. The card prices them per day on site; the page's rule charges generators and towers once for the whole
   event, and the one rated generator line ($339 for an 80 kVA) does not match the card's $218.73 a day for any
   whole number of days. So they are listed with the card's daily rate as a guide and a box to type the charge.

## Figures (practice tests, live record read only)

| | before | after |
|---|---|---|
| Revenue (charged to the V8s) | $434,257.87 | $519,359.62 |
| Toilets and servicing: charge | $69,092 | $154,194 |
| Toilets and servicing: cost (Event Portables, approved) | $118,575 | $118,575 |
| Toilets and servicing: difference | −$49,483 | **+$35,619** |
| Contract lines with no rate | 33 | 33 (boxes to type them) |

Checks: a rate typed on a decided tank line is ignored (stays "Included in toilet-block hire", $0); a typed generator
rate counts and moves the revenue total on the page at once; clearing it returns the line to "no rate"; the typer's
name is kept; 0 page errors desktop and phone; no sideways scroll on the phone. Sweeps on the final build (v7.48 + v7.49): desktop and phone, 21 tabs, 0 errors, 0 console errors
(`sweep_desktop.txt`, `sweep_phone.txt`). Screenshots: `shot748_costs_desktop.png`, `shot748_costs_phone.png`.

## Also noticed (not changed)

MEAD's forklift lines on contract 9968726 carry Rate 1 values like $1,483.20 (= the card's $185.40 × 8 days), and the
page charges forklifts Rate 1 **per day** — giving $11,865.60 for that line. If Rate 1 there is already the whole
hire, that line is counted about 8 times over. Worth a look before the revenue figure is quoted.
