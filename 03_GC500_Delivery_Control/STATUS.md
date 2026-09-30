# GC500 status board

Shared by Claude and Codex. Update it when you claim work, when something goes live, and when Andrew answers a
question. Newest first in each section. Times AEST.

## Instruction from Andrew — 1 Oct 2026: "Update and release everything"

Author: Andrew Fisher

**RELEASE NOW — CODEX, with the edit key:**
1. **Page:** upload `build/GC500_v7.59/GC500_Delivery_Control_hosted.html` (**8,489,119 bytes**; v7.55 P&L words → v7.56 quicker zoom → v7.57 Text it to me with the map picture → v7.59 the QR/Navigate/Text it set made tidy, on the live v7.54; or rebuild with `toolchain/build.sh v7.59 v7.55_the_pl_in_andrews_words_DRAFT/patch_v755.py v7.56_the_map_zooms_quicker_DRAFT/patch_v756.py v7.57_text_it_to_me_with_the_map_picture_DRAFT/patch_v757.py v7.59_qr_navigate_text_it_one_tidy_set_DRAFT/patch_v759.py`). Record the live bytes here and rename the four folders `_LIVE`. (v7.59 supersedes the v7.57 build named earlier.)
2. **Machine:** put `v7.58_the_explorer_zooms_quicker_DRAFT/release/explorer/explorer.js` (122,510 bytes, md5 `1407e27035358e02c21f9fa98ca83c6b`) in place of `explorer/explorer.js` in the live machine set (a blob PUT and a register with that one path changed, as v7.14 was done). Every other file stays.
3. **Server v5.85 — CODEX, with the edit key, the v5.84 way:** (a) `PUT /api/admin/machine/blob/76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` with `v7.57_…/server_v5.85/server.js` (228,182 bytes; the server checks the hash before writing); (b) on Railway set `SERVER_FILE` to that hash and put the v5.84 hash `264363128b6c…` first in `SERVER_FILE_KEEP`; (c) redeploy; (d) `/health` → `"build":"v5.85"`. **Do not use the SERVER_B64 route:** Claude tried it on 1 Oct (~07:48–07:53 AEST) by retyping the 93 kB base64 into Railway variables; one wrong character broke the decode, and because a volume service stops the old container before the new one starts, the site was down about four minutes until Claude rolled `SERVER_FILE` back to the v5.84 blob. `SERVER_B64_01–04` now hold that broken v5.85 text and are unread while the `SERVER_FILE` blob exists; `SERVER_FILE_NOTE` says so.

**NOT to be released, by Andrew's word (1 Oct):** the Three.js circuit (v7.53 draft) and the Today · Current Position design. Andrew: "We are not changing the circuit and the Today · Current Position. I want to restart and relook at what we do with that. Was not happy with your last effort." Both are withdrawn — no build, no upload, no further work until Andrew restarts them with a fresh brief. The live Showcase and the live Today / Where we are pages stay exactly as they are.

## Latest release — 1 Oct 2026 05:22 AEST

Author: Andrew Fisher

**v7.54 is LIVE**, combining the approved v7.52 Forecast P&L and v7.54 branch Rehire handovers with the Questions fixes. Both financial folders are now `_LIVE`; `v7.54_questions_tidy_LIVE/README.md` records the complete build, validation and byte proof.

The existing live base already contained the v7.53 **Questions/financial/runtime fixes** (8,436,993 bytes); that release is distinct from the held v7.53 **Three.js circuit draft**. The circuit draft and Today · Current Position design remain on hold and were not applied.

Questions: **16 open, 8 pending, 33 answered/history**. FL01 supplier fleet 50004 is supported by the contract location note; uncertain site allocations and missing rates remain open. No shared records or Finance journals were changed. Source contract rates and the corrected Revenue are preserved.

## Live now

| version | what | live | by |
|---|---|---|---|
| **v7.54 verified** | Claude fetched the live page 1 Oct 2026 ~05:40 AEST: 8,475,019 bytes, SHA-256 `231a7bf4dd5095ab…` — the same bytes Codex recorded. It holds the v7.52 Forecast P&L and the v7.54 rehire on every branch (KINP toilets 132 lines / 251 units / $69,092; NVAC plant $12,063; branch total $277,015.74 = the contracts line) and Codex's Questions fixes; no Three.js circuit, no sunset backdrop. The v7.54 practice tests pass on the live file (desktop and phone, 0 errors); both sweeps 21 tabs, 0 errors, 0 console. Codex reworded the rehire cell ("Toilet hire Revenue … included in hire" in place of "Rehire · Event Portables … at our rates"); Andrew to say if he wants his words back. Codex's release branch merged into the shared branch. | 1 Oct 2026 | Claude |
| **v7.54 (includes v7.52)** | LIVE — Forecast P&L, Rehire details on every branch, Questions review and reliable note saving. Card/entered estimates remain distinct from source contract rates; Rehire detail is included in branch Revenue. 201 focused checks and 14 patch guards; both 21-tab sweeps pass with zero errors. Public byte proof: 8,475,019 bytes, SHA256 `231a7bf4dd5095ab2e0cc408ad9501cd01cfb9dae18a213960c5531b150d6f13`. Shared-record version3082 unchanged by this release. | 1 Oct 2026 05:22 | Codex, approved handovers from Claude |
| **v7.52** | Forecast P&L handover is LIVE within the combined v7.54 release above. | 1 Oct 2026 05:22 | Codex, prepared by Claude |
| **v7.53 Questions fixes** | Earlier live Questions, finance explanations and record-handling fixes retained; source handover now included. This is not the held circuit draft. | 1 Oct 2026 03:12 | Codex |
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

Service change 1 Oct 2026 (Andrew: "Send it from my number 0429352788", verified as an Own Number in ClickSend):
`SMS_FROM` on the Railway service set to `+61429352788` by Claude — every text (and, with server v5.85, every
picture message) now arrives from Andrew's number, and a driver's reply lands on his phone. No other variable
touched; the page and the record are unchanged.

Record change 29 Sep 2026 18:24: the master plan's positions put on in place of 60 pins (Andrew approved) —
see `record_29Sep2026_master_plan_positions/`.

The live page's own proof: `toolchain/fetch_live.sh` then compare with the release folder's README.

## Claimed — being worked on now

| version | what | who | since |
|---|---|---|---|
| **v7.55 + v7.56** | **READY TO UPLOAD — Codex, please upload `build/GC500_v7.59/GC500_Delivery_Control_hosted.html` (v7.55 → v7.56 → v7.57 → v7.59 on the live v7.54, 8,489,119 bytes), or rebuild with `toolchain/build.sh v7.57 v7.55_the_pl_in_andrews_words_DRAFT/patch_v755.py v7.56_the_map_zooms_quicker_DRAFT/patch_v756.py v7.57_text_it_to_me_with_the_map_picture_DRAFT/patch_v757.py`. (`build/GC500_v7.56`, 8,475,941 bytes, is the same without v7.57.)** v7.55 — the P&L in Andrew's words (Andrew, 1 Oct: "ensure correct P&L wording is used"): the branch table's rehire cell, column heads, total row, card line and note back to AGENTS.md terms (Rehire · Event Portables · Rehire Revenue at our rates · Rehire cost shown, never added; Hire · from the card; Sub-hired · rehire); every figure unchanged. v7.56 — the drawing viewer zooms quicker (×1.38 a notch, buttons ×2, glide 45 ms) and fetches sharp tiles DURING the zoom, not after; point under the cursor stays put (0.3 px). P&L test and zoom test pass; both sweeps 21 tabs, 0 errors, 0 console. No record write. READMEs in both folders. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| questions | Decision sheet for Andrew: all 24 open/pending Questions with the record's facts, a recommended default and where the answer lands — `questions_01Oct2026_decision_sheet/README.md`. None can be closed from the record alone; 11 close with one line from Andrew, 6 need iEDM/Advanced/Event Portables, 7 close as figures arrive. Nothing closed on the record. | Claude | 1 Oct 2026 |
| **v7.57** | **Built and tested — page READY TO UPLOAD with v7.55 + v7.56 (`build/GC500_v7.57`, one build, order v7.55 → v7.56 → v7.57); the sending needs server v5.85.** Text it to me, with a picture of the map (Andrew, 1 Oct: "I want a picture of the map of where it goes, next to the QR code and Navigate … enter in mobile number and it will text it to you, MMS, I don't mind the cost"). A "Text it · to me · picture" button beside the QR code and Navigate on every Timeline load line (5 of 6 today); the Text box (the drawer's too) draws the picture on the page — the registered aerial with the master plan D001 over it, a pin, 20 m bar, north, the reference and position — 178 kB JPEG, and with server v5.85 sends it as a picture message (MMS) through ClickSend, ticked by default; unticked or without v5.85 the words go as a text as before. Also fixes a live bug: a number typed with spaces ("0429 352 788", the box's own example) split into three numbers the service refused. Tests desktop and phone (pretend service, nothing sent), both sweeps 21 tabs, 0 errors, 0 console. **Server v5.85** (`v7.57_…/server_v5.85/`): `/api/mms`, `/p/<sha>.jpg`, 37/37 local tests; deploy = one machine blob + `SERVER_FILE` on Railway (README has the steps) — the lead with the edit key; Claude cannot do it from here. `v7.57_text_it_to_me_with_the_map_picture_DRAFT/README.md`. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| **v7.60** | **Built and tested — awaiting Andrew's yes and Codex's check (asked on PR #1, 1 Oct).** Costs in Andrew's structure (Andrew, 1 Oct: "hard focus on costs … toilets: we are sub-hiring these, why is this not under KINP? Cleaning is classed different, not labour. Labour Installs, Steps, Levelling, Labour Demob fall under the Labour Install code"). The toilets' servicing $85,102 and the Event Portables rehire cost $118,575 sit against KINP (P&L By branch table, lower By branch card, stream line, cost note); the labour ticked per piece is split — Labour — Install (install, steps, levelling, demob; 165 ticks $17,083 today), Cleaning on its own, fire extinguishers a hire charge; the By branch table carries every stream and a grey Rehire cost column, and reconciles: All branches $500,113 + scope $55,817 = Total revenue $555,930. No total moves. Build `build/GC500_v7.60` (8,498,185 bytes) on v7.55 → v7.59; tests and sweeps in `v7.60_costs_in_andrews_structure_DRAFT/`. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| v7.58 | Draft, a machine release (not a page upload): the Plan on satellite explorer (the Map tab's default, `explorer/explorer.js` in the machine) zooms quicker — a notch ×1.38 (was ×1.25), glide 50 ms (was 77) — two lines on the v7.14 file, checked byte for byte against live. Measured against the live explorer in the harness; `v7.58_the_explorer_zooms_quicker_DRAFT/README.md`. Goes with Andrew's yes after he has felt v7.56 on the page. | Claude | 1 Oct 2026 |
| design | **WITHDRAWN (Andrew, 1 Oct: "restart and relook … was not happy with your last effort").** Today · Current Position design mock (`design_01Oct2026_today_current_position/`) is not to be built; the live Today and Where we are pages stay as they are. A fresh brief from Andrew starts it again. | Claude | 1 Oct 2026 |
| v7.53 | **WITHDRAWN — the Three.js circuit draft (`v7.53_the_circuit_in_three_js_DRAFT/`) is not to be uploaded and gets no further work.** Andrew, 1 Oct: "We are not changing the circuit … I want to restart and relook at what we do with that. Was not happy with your last effort." The live Showcase stays exactly as it is. | Claude | 1 Oct 2026 |
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

