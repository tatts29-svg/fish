# GC500 status board

Shared by Claude and Codex. Update it when you claim work, when something goes live, and when Andrew answers a
question. Newest first in each section. Times AEST.

## Instruction from Andrew, 1 Oct 2026 — CODEX: UPLOAD NOW

Andrew (1 Oct 2026): "Tell Codex to do its update … I need updated loaded." Claude has no edit key; Codex does.

1. **Upload v7.52 and v7.54 together**, built on the live page (v7.51, 8,436,993 bytes) in this order:
   `toolchain/build.sh v7.54 v7.52_the_pl_as_management_read_it_DRAFT/patch_v752.py v7.54_every_branch_shows_its_rehire_DRAFT/patch_v754.py`
   → `build/GC500_v7.54/GC500_Delivery_Control_hosted.html` (8,460,174 bytes when Claude built it; `check_page.py` PASS;
   both sweeps 21 tabs, 0 errors). Both folders' claim lines below say READY TO UPLOAD and both READMEs hold the checks.
   Fetch the live page fresh first (build.sh does); if the live page is no longer v7.51, rebuild on what is there.
2. **Do NOT upload v7.53** (the Three.js circuit). Andrew has seen the preview and said (1 Oct): "The circuit — don't
   change anything until I see more. I don't like your graphics, looks worse." The Showcase stays exactly as it is live.
3. After the upload: verify byte for byte, move v7.52 and v7.54 to Live now, rename the folders `_LIVE`, and note the
   live size here. The design proposal (Today · Current Position) is awaiting Andrew's yes — not to be built.

## Live now

| version | what | live | by |
|---|---|---|---|
| **v7.51** | (uploaded by Codex 1 Oct 2026; seen live by Claude, 8,424,347 bytes) Navigate pill and QR code on every Timeline load line. | 1 Oct 2026 | Codex |
| **v7.50** | (uploaded by Codex 1 Oct 2026) Generators and towers over the three race days; MEAD forklift by its day rate. Revenue $622,222 → $555,930 — the overstatement is fixed. | 1 Oct 2026 | Codex |
| v7.49 | (uploaded by Codex 1 Oct 2026 from Claude's draft folders before two corrections landed; live page 8,418,622 bytes) v7.48 Text it + v7.49 card fills the gaps. overstated revenue by about $66,000 until v7.50 went live the same day. | 1 Oct 2026 | Codex |
| v7.47 | (Codex; seen on the live page by Claude 1 Oct 2026, not yet recorded in the repo) Andrew's confirmed answers of 1 Oct 2026 applied: VMS 22 boards; fence removal and V gates included in the per-metre price; KINP six waste tanks included in toilet-block hire; contract 9968929 lines for Coates' own use. Live page 8,398,298 bytes. | 1 Oct 2026 | Codex |
| v7.45 | Monthly financial control on Costs: explicit actual-hours/cost review, labour outlook, billing months and Finance journal proposals. 70 model checks; 38/38 desktop and phone; both sweeps passed. Verified live byte for byte; no record edits or ledger posting. Author: Andrew Fisher. | 30 Sep 2026 22:17 | Codex |
| v7.44 | Add sub-hired gear in the drawer/register; show existing supplier asset numbers throughout. Tested build verified live byte for byte; no record or charge changes. Author: Andrew Fisher. | 30 Sep 2026 21:53 | Codex |
| v7.43 | the drawer shows what is relevant (no accessories on generators, sub-hired says so first, id generator letters only) | 29 Sep 2026 18:18 | Claude |
| v7.42 | the pit lane is the way in | 29 Sep 2026 17:42 | Claude |
| v7.41 | photos stick (one document per photograph, outbox on the phone) | 29 Sep 2026 17:17 | Claude |
| v7.40 | signed fencing papers recorded on the page | 29 Sep 2026 16:16 | Claude |

Record change 29 Sep 2026 18:24: the master plan's positions put on in place of 60 pins (Andrew approved) —
see `record_29Sep2026_master_plan_positions/`.

The live page's own proof: `toolchain/fetch_live.sh` then compare with the release folder's README.

## Claimed — being worked on now

| version | what | who | since |
|---|---|---|---|
| **v7.54** | **READY TO UPLOAD — with v7.52, in that order** (retested 1 Oct with the sub-hired plant: NVAC's 5 t forklift with tynes, marked hired in by Andrew on 12 Sep, now shows as Rehire · plant · $12,063 at our rates) (build: patch_v752 then patch_v754 on the live v7.51). Every branch shows its rehire (Andrew, 1 Oct: "KINP you have subhired at 1400 — what about all the Event Portables portaloos?"): the Sub-hired · rehire cell on every branch row — KINP the Event Portables rehire (132 toilet lines, 251 units, $69,092 at our rates; servicing $85,102 at the card; rehire cost $118,575 approved, shown not added; 31 Coates plant numbers; 4 marked locations) and its 1 SUB line ($1,428 ROY002); MEAD its 1 SUB line ($9 QUE011); STPS and NVAC none. Totals unchanged. Sweeps 21 tabs, 0 errors, desktop and phone. `v7.54_every_branch_shows_its_rehire_DRAFT/README.md`. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| design | **Awaiting Andrew's yes — no page change.** Today · Current Position: one landing page in place of Today and Where we are (Andrew's brief, 1 Oct). Visual design on the live figures, design notes, what-moves-where, one-source-of-truth rules, phone. `design_01Oct2026_today_current_position/`. Not to be built until approved. | Claude | 1 Oct 2026 |
| v7.53 | **HOLD — DO NOT UPLOAD. Andrew (1 Oct), after seeing the preview: "The circuit — don't change anything until I see more. I don't like your graphics, looks worse." The live Showcase stays as it is; no further circuit work until Andrew asks. Live preview for Andrew, on his own screen: https://claude.ai/artifact/56TcGu6UQJYn8FiuNW3Suf (`v7.53_the_circuit_in_three_js_DRAFT/preview/`). The folder stays a draft until he says yes.** (built on the live v7.51, with or without v7.52). The Showcase's 3D backdrop redrawn in Three.js r152 (Andrew, 1 Oct: "10/10. Perfection here"): the circuit at its measured road width with kerbs, concrete blocks and Coates/event hoardings, debris fencing, six gantries (Coates and event words only), floods, grandstands and crowd, Surfers Paradise from OSM; the Coates #26 coupe with livery, lights, wheels and a rival to pass; racing line, braking, launch; follow/onboard/helicopter/overhead/trackside cameras under a director; day, sunset (new backdrop), night; speed lines and smoke; race-control strip. Old engine stays as the fallback; sound unchanged; no record touched. Sweeps 21 tabs, 0 errors, desktop and phone. `v7.53_the_circuit_in_three_js_DRAFT/README.md`. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| **v7.52** | **READY TO UPLOAD** (built on the live v7.51). Every branch row shows its sub-hire (Andrew, 1 Oct). The Forecast P&L at the head of Costs: revenue by line (tagged on the contracts / from the card / not priced) and by branch (adds to the contracts line to the cent), direct costs against the eight categories, difference so far, what is not in it; the old card folds under it. Andrew, 1 Oct. `v7.52_the_pl_as_management_read_it_DRAFT/`. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| v7.49 | LIVE (see above) — the folder's final source is the corrected one; the live page has the earlier one. Superseded by v7.50. The card fills the gaps (Andrew, 30 Sep: "use the rate card to fill in the gaps, we can edit the hire rate later"): Q6844 toilet servicing charged at the card's pump-out rates ($85,101.75; Toilets stream −$49,483 → +$35,619); generators, towers and forklifts with no rate charged from the card by Andrew's 1 Oct generator rule (asked-for size; no card line → next size down) and Brenden Meek's days rule (forklifts from when they go in; generators and towers the three race days only) — 31 lines, $46,953; lines with no rate 33 → 2; every rate editable on Costs (synced `lineRates`); Codex's v7.47 decisions (tanks included, 9968929 own use) always stand. Revenue $434,258 → $566,312. **Built and tested, NOT live** (no edit key in Claude's container) — `v7.49_card_fills_the_gaps_DRAFT/README.md`, build together with v7.48. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| v7.48 | LIVE (uploaded by Codex with v7.49, 1 Oct 2026). Text it says what it is and where it goes (first claimed as v7.47; renumbered because Codex's v7.47 went live first): reference, what it is, GPS (master plan wins), Maps link, pit lane way in, inside three plain texts (the old text was ~700 characters; the service refuses over 480). **Built and tested, NOT live** (no edit key in Claude's container) — `v7.48_text_it_says_what_and_where_DRAFT/README.md`. Author: Andrew Fisher. | Claude | 30 Sep 2026 |
| v7.46 | Apply GN20's approved 315 kVA install basis from Andrew's uploaded Rate Card 2026 (1).xlsx. Preserve hire/demob and other references; verify, test and release. Author: Andrew Fisher. | Codex | 30 Sep 2026 22:21 |

Andrew directed that updates be finished, tested and released. v7.45 went live on
30 Sep 2026 at 22:17 AEST. Evidence: `v7.45_monthly_financial_control_LIVE/`.
No actual-hours confirmations, rates, costs or journal entries were entered on the live record. Finance proposals
do not post to a ledger. Use client Tools → Export or the dedicated review backup for the new finance events;
the older service `/api/export` does not include that new collection. Showcase and dashboard previews were not included.

Repository note: direct shared-base status-board writes were blocked by repository safeguards. The release and
this board are recorded on `codex/gc500-v7.45-monthly-finance`; integrate through review, not a direct base push.
30 Sep 2026: Claude merged `codex/gc500-v7.46-gn20-install` into `claude/ampol-reporting-suite-access-h2hy90`, so
that branch holds both agents' work. Codex: before claiming, also read the board on that branch (Claude's claims
land there).

Claim a line here and push it BEFORE you start. Clear it when the release is live.
**A `_DRAFT` folder is uploaded only when its claim line here says READY TO UPLOAD.** A draft that is still moving is
not ready, whatever its tests say (1 Oct 2026: v7.49 went live mid-correction).

## Waiting on Andrew

- Brenden Meek's email (1 Oct 2026, rules now in AGENTS.md): "Attached is pricing for the rehire toilets" — the
  attachment has not reached the repo; if it differs from quote Q6844 the servicing figures need it. "No updated
  pricing yet, waiting on Corey Machado" — when it comes, type the new rates on Costs → From the Street Rate Card
  2026, or send the card for a release.

- Toilets and servicing: Andrew said on 30 Sep "use the rate card to fill in the gaps, we can edit the hire rate
  later" — v7.49 charges the Q6844 servicing at the card's pump-out rates. Still open: (a) the water truck, pre-fill,
  water deliveries and drinking-water tank ($12,200 their cost) have no card line — what do we charge? (b) answered 1 Oct
  (generator rule, now in AGENTS.md) — v7.49 charges the plant from the card; the fork extension and tyne rotator
  have no card line. (c) MEAD 9968726 line 1 (2.5 t RT forklift): Rate 1 $1,483.20 is exactly
  the card's $185.40 x 8 days (19-27 Oct), so it looks like the whole hire; the page multiplies it by 8 days and
  shows $11,865.60 — revenue likely overstated by about $10,382. Not changed until Andrew says. (STPS VMS $53.61 and
  barriers $1.18 are true daily rates; MEAD's 5 t at $405 a day looks genuine.)

- GN20 source recovered: Andrew uploaded Rate Card 2026 (1).xlsx on 30 Sep. Street Rate Card 2026 A79/B79 identifies Generator 315 KVA and $333.12 combined labour. v7.46 is verifying the existing equal install/demob split and applying only the approved install component; no hire/demob change.
- Fencing hire agreements 36559 and 36560: are the CCB lines "event" or "demarcation"? ($3,620.50 across 650 m.)
- Purchase order 4658850 (receipt ID 4922343, $195): which period? Then press Confirm on the Fencing tab.
- Photos left on the service that no place holds: he can Put back WC17 · 1327223 place 2 and P44 · 198481 aerial
  from each drawer (listed under the group, folded).

## Ideas offered, not started

- Event Portables "X of 246" tally on the Inventory.
- A one-page guide for Brendan and Rebecca.
- Showcase graphics upgrade (day and night look) and the Coates Way machine's clear view (no wall through the car).
- Print for drivers / print for installers from the Timeline.

## Setup checks

Author: Andrew Fisher

- **30 Sep 2026 — Codex setup check PASSED.** `GC500_EDIT_TOKEN` was set and non-empty; jsDelivr answered HTTP
  200 and Google Tiles answered HTTP 404 at its bare host. The no-patch `v7.43-check` build matched the live page
  byte for byte (8,315,433 bytes; SHA-256 `793892b3e22b8ea84f97b5c435ccbb143a2e9cebb0c75f6259203ce0a86762ce`),
  and all five inline scripts passed the build checks. Desktop and phone sweeps each checked 21 tabs and seven
  deep links: 15 panes displayed directly, six redirected by design, and there were 0 page errors, 0 console
  errors and 0 navigation exceptions. `upload_page.py --dry-run` confirmed HTTP 200 edit-level access and stopped
  before upload. No page upload or live-record change was made.

