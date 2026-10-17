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
4. **Generators, light towers and forklifts with no rate are charged from the card** (Andrew, 1 Oct 2026: "If a
   generator price is not there you go for the lower, so 70 kVA becomes the 60 kVA. If the client asks for a 60 kVA and
   we supplied larger, they get the price of a 60 kVA."). The size is what was asked for (the reference's own type),
   else what the line says; a size the card has no line for takes the next size down (GN20 asked 350 → 315 kVA; the
   300 kVA line → 250 kVA; GN18/GN06 asked 50 with 60 sent → 50; GN13 asked 45 → 45). The days follow the branch's
   rule (Brenden Meek, Branch Manager: "Forklifts, VMS and water barriers are charged for from when they go in.
   Everything else is only charged for over the event."): forklifts charge the card's daily rate by the day from when
   they go in (the 3.0 t and 3.5 t take the 2.5 t standard, no card line); a generator or tower is charged once, the
   card's daily rate × the three race days (23–25 Oct), never its days on site. 31 lines filled, $46,953; the fork
   extension and tyne rotator have no card line and stay open with a box.

## Figures (practice tests on the live record, read only — `evidence/streams_before_after.json`)

| stream | charge before | charge after | cost | difference after |
|---|---|---|---|---|
| Fencing | $120,913 | $120,913 | $77,122 | +$43,791 |
| Toilets and servicing | $69,092 | **$154,194** | $118,575 | **+$35,619** (was −$49,483) |
| Buildings, containers and furniture | $66,992 | $66,992 | not recorded | — |
| VMS, water barriers and track mat | $81,149 | $81,149 | not recorded | — |
| Forklifts and access | $15,935 | **$51,211** | not recorded | — |
| Generators and lighting towers | $339 | **$12,015** | not recorded | — |
| Delivery and transport | $6,939 | $6,939 | $21,721 | −$14,782 |
| People — event staff and crew | $72,899 | $72,899 | $17,664 | +$55,235 |
| **Revenue** | **$434,258** | **$566,312** | known costs $235,082 | |

Contract lines with no rate: 33 → 2. Still not in the costs: wages (hours only), 31 accommodation nights, transport
only partly, sub-hire rehire cost for the hired-in plant. Brenden Meek: "no updated pricing yet, waiting on Corey
Machado" — every card figure here can be typed over when it comes.

Checks: a rate typed on a decided tank line is ignored (stays "Included in toilet-block hire", $0); a typed rate on a
card-filled generator wins, and clearing it puts the card figure back; the typer's name is kept; the revenue total on
the page moves at once; 0 page errors desktop and phone; no sideways scroll on the phone. Screenshots:
`shot748_costs_desktop.png`, `shot748_costs_phone.png`.

## Also noticed (not changed)

MEAD's forklift lines on contract 9968726 carry Rate 1 values like $1,483.20 (= the card's $185.40 × 8 days), and the
page charges forklifts Rate 1 **per day** — giving $11,865.60 for that line. If Rate 1 there is already the whole
hire, that line is counted about 8 times over. Worth a look before the revenue figure is quoted.
