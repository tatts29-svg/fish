# Generator standdown and location — v10.04

Author: Andrew Fisher

Implemented; final publication checks in progress. Not yet live.

Generators charge from delivery through 25 October 2026. Use the **published Standby Rate 2026** before Friday 23 October and **Daily Rate 2026** for 23–25 October, with no hire after Sunday. Andrew clarified that standdown rates already appear on the card and confirmed the 200 kVA rate as $182.28/day. Source precision is retained until each contract line is rounded. Explicit whole-event or weekly overrides keep their existing units; unpriced/POA lines remain visible holds.

One model replaces the former three-day generator charge and supplies Costs, P&L, branch totals, October Finance allocation and reference prices. Actual is the complete hire charge for confirmed arrivals; remaining forecast covers planned arrivals. The Generators subtab shows reference, quantity, location, confirmed asset numbers, arrival/planned date, off hire, branch, standdown, actual, remaining and total. Rate evidence and calculations are folded under More info. Physical pickup dates, accessories, installation, transport and supplier Direct costs retain their existing rules.

Andrew's two maps identify the Concert pair at **-27.984576, 153.427700**, Macintosh Island Park, beside the path junction near the peacock enclosure. Both 200 kVA units share this reference/position; individual plant numbers remain unconfirmed. The master overlay, navigation and financial destination agree; later native position edits take precedence. The answered Concert location question is closed. Two contract-only spare locations remain unspecified in their source.

Independent decimal calculation for shared-record fixture 5443 (18 active units; nine arrived and nine forecast), AUD ex GST:

| Charge | Actual arrivals | Remaining forecast | Total |
|---|---:|---:|---:|
| Standdown | $21,132.58 | $3,884.69 | $25,017.27 |
| Complete generator hire | $28,196.40 | $9,333.73 | $37,530.13 |

Testing uses the read-only harness under `/tmp/gc500-browser.lock`; fixtures never write to the service. Source/identity, rate/date boundaries, partial receipts, quantity holds, POA, cancellation, branch/date/rate propagation, original contract preservation and map precedence are covered. `browser_generators1004.cjs` expects private source fixtures via `FIXTURES` (default `/workspace/private-gc500-generators1004`). It waits for the document registry before comparing fencing forecasts: that existing calculation requires verified source files. Initial fixture failures exposed a generator branch split, now corrected, and a too-early registry check, now corrected. Receipt tests compare Hire Revenue independently because existing transport allowances also react to arrivals.

Root implemented integration, standdown disclosure, location mapping and release checks, with scoped source, finance and presentation implementation from collaborating agents. The final combined review is root-owned. No operational records, bookings or emails are changed.

Build: `./toolchain/build.sh v10.04 v10.04_generator_standdown_DRAFT/patch_v1004.py`. Exact required base: v10.03, SHA256 `3056702a2a5664050eb9b8cf8592bc2f700ea5faf705829d97f471b83f38e412`.
