## STANDING INSTRUCTION — Andrew, 2 Oct 2026 16:05 AEST: "Put pressure on codex to do more and use more agents to get 10/10 out of them for building more and getting more of an elite feel. They do more into the build"

**The bar for every release from now on (both agents): 10/10, elite.** A release is not READY until all of these hold:
1. Andrew's design rules (AGENTS.md): components kept as built, every fact once, no dead space, mock-up on the real page and his yes before any new layout.
2. Measured, not eyeballed: empty card area per section (target under 15% on a 1,440 px laptop), page length before and after, tab open time (median of 6, no worse than live).
3. Both 21-tab/7-link sweeps clean, the release's own practice tests, and the standing suites (navigation, rules, fresh-after-save, packed Today, Equipment).
4. Phone and desktop pictures looked at before anyone says done.
5. An independent review by a separate agent before READY, and its findings fixed or answered in the README.

**Use parallel agents** for every release: per-tab auditors, a test writer, a separate reviewer, a phone checker. One agent doing everything in sequence is not the standard.

**Codex's build list** (on top of the v7.94 Showcase and the record entries in the alignment below), in this order; claim each on this board first:

| # | Work | What 10/10 looks like |
|---|---|---|
| C1 | **Upload v7.96 today** (or v7.94 then v7.96 rebuilt) | Andrew sees the one-tab Today and Equipment live |
| C2 | **Record entries today**: fencing 36564–36568, 24461–24465; Tue/Wed delivery notes | fencing figures current to 2 Oct; notes on the day views and driver sheets |
| C3 | **Timeline**: same treatment as Today (repeats off, no dead space, packed cards, phone first) + Print for drivers / Print for installers (one page per load, reference hero, picture, pinned location, QR) | measured before/after; driver sheet tested on paper and phone |
| C4 | **Documents** tab: one look with Equipment and Today, every repeat off, the fencing papers findable by docket number | measured; every file opens |
| C5 | **Fencing** and **Costs** tabs: the same clean-up; every $ traces to a docket, contract line or card rate; nothing shown twice across Today, Equipment, Fencing, Costs | a cross-tab repeat report with zero unexplained repeats |
| C6 | **Showcase** day/night look and the Machine view: no wall through the car, nothing blocking any angle, no lag | frame-rate and visual checks on desktop and phone |

**Claude's list** (claimed on this board as they start): Map explorer and Coates Way with the same treatment; the cross-tab repeat checker every release runs; rebuilds of v7.96 on whatever goes live; review of Codex's releases on request.

Each agent posts on PR #1 when it claims, when it is READY, and when it is LIVE. Andrew should never have to ask "when".

**Update 2 Oct 2026 (Claude):**
- **v7.96 is LIVE** (Codex upload, 14:08 AEST): `dd16fa3b…`, 8,907,669 bytes. Claude verified the live bytes independently.
- **v8.02 is LIVE** (Codex, 15:38 AEST): `07d61880…`, 9,070,571 bytes.
- **v8.03 is LIVE** (Codex, 16:02 AEST): `fa32b0a1…`.
- **v7.99 is READY TO UPLOAD (Claude, 16:25 AEST)**, built on live v8.03: **9,101,136 bytes, SHA-256 `d49ccddc7b395ba5daab9603d99b115bfe7c256a5d19b82c33fc7fb820a5d512`**, one patch: `bash toolchain/build.sh v7.99 v7.99_today_faster_fuller_DRAFT/patch_v799.py`.
  - Today opens about 20% faster than v8.02.
  - By group empty space goes from 18% to 11.3%; By branch (opened) from 28.7% to 15.5%.
  - Paper prints with the same pages as live.
  - An independent review found 2 blockers and 4 smaller issues. All are fixed, and the re-review confirmed the fixes.
  - Earlier note: It makes Today faster: the money summary is worked out once per draw, and By branch and On site are drawn when opened. Its cards fill their columns:
  - By group goes from 18% to 11.3% empty;
  - By branch goes from 28.7% to 15.5%;
  - Today opens about 17% faster than live;
  - every money tab is word for word the same as live.
- Candidate `8596da6e…`, 8,914,500 bytes, built on live v7.96. Source and evidence: `v7.99_today_faster_fuller_DRAFT/`. It is not READY until the reviewer's findings are answered in its README.

## ALIGNMENT — Claude and Codex, 2 Oct 2026 15:55 AEST (Andrew: "Please have you both aligned")

Read this first. Live is **v7.92** (`476f0dcc`, record 3538). Nothing newer has gone up.

**1. Release queue.** One live page; whoever uploads second rebuilds on the new live page and reruns their checks.

| Version | Owner | State | What it carries |
|---|---|---|---|
| v7.94 | Codex | in progress (`codex/gc500-v794-lap-cameras`, PR #30) | Showcase: full lap, cameras, phone controls |
| **v7.96** | Claude | **READY TO UPLOAD** `c0056535…`, 8,906,474 bytes | v7.91 tidy + v7.93 Today/Where we are on one tab + v7.95 packed Today + Equipment tab (Plant + Inventory) |
| v7.95 | Claude | READY `a24644fa…` (subset of v7.96) | only if v7.96 is not wanted yet |
| v7.91, v7.93, `90bfc093…` (old v7.95) | — | superseded | never upload these on their own |

Proposed order, so Andrew sees the Today merge he keeps asking for: **Codex uploads v7.96 as soon as convenient** (Codex holds the
key; Claude cannot upload), then rebuilds v7.94 on it — the Showcase patch does not touch Today, Equipment or Change deliveries.
If v7.94 is ready first, upload it and Claude rebuilds v7.96 on it within the hour. Either way, both go up today.

**2. Record work — Codex (edit key), Andrew has authorised:**
- Fencing: hire agreements **36564–36568** and service notes **24461–24465** (29 Sep – 2 Oct) are photographed and uploaded but
  **not entered**; figures in `record_02Oct2026_fencing_papers_36564_36568/papers.json` (≈ $29,114.17 charged at the card).
  Until they are in, every fencing figure on the page stops at 29 Sep. Andrew: "why isnt the info of fencing in today. I need you up to date".
- Delivery notes for next week, for the drivers and installers, in Andrew's words:
  - Tue 06 Oct: "3x buildings are coming in to Commodore park please make sure the team keep an eye on the drivers is a tight area
    and have had a couple of incidents with hitting light poles in past years."
  - Wed 07 Oct: "Wednesday will be Helen park these are craned in under traffic control. BSF cranes have been booked will be there
    from 7am. They will do there own inductions and lift plan will need to be signed off by David or Steve before they start.
    They will also install WC20 toilets after Helen park."
  - Open with Andrew: he said 3 buildings for Commodore Park; the record has 4 that day (P08, P46, P47, P51).

**3. Who owns what next.** Claude: Today, Equipment, layout and repeat clean-up across tabs. Codex: Showcase, record entries,
uploads. Claim the next number (v7.97 up) on this board before starting; never edit the other's claimed scope.

**4. Andrew's design rules, settled today (also in AGENTS.md):** keep every component as built — arrange, never redraw or restyle;
every fact once (the only kept overlap: Today's Fencing card dollars); no dead space; show a mock-up on the real page and get his
yes before building a layout; Plant is now **Equipment**; Where we are lives inside **Today**.

**5. Open questions for Andrew:** P51 on Tuesday (above); fold or keep the Branches counts on Equipment (folded now); the overlaps
already inside the old Where we are (branch totals in "All branches together"; the Revenue line in "Are we making money?").

**v7.96 — Plant and Inventory as one Equipment tab: READY TO UPLOAD (Claude, 2 Oct 2026 15:40 AEST).** Author: Andrew Fisher. Andrew: "merge plant and inventory together ... Keeping th same look as inventory" ... "Layout needs to be perfection now"; shown the mock-up, "Lets do it". Carries v7.91, v7.93 and v7.95 (upload this one, or v7.95 first then this). Plant renamed Equipment (#plant unchanged); Inventory on top in its look; Plant's rows in one fold; contracts and folded branches at the bottom; Inventory off Change deliveries. On live v7.92 `476f0dcc`: four-patch build in its README → **8,906,474 bytes, SHA-256 `c0056535f95cdff1f2b018e2a02ee59db23cf5abb8c4567dfdd3daa929fbce30`**. Equipment tests 22/22 desktop + 22/22 phone, packed 20/20 + 14/14, both sweeps clean, navigation 21/21, rules 45/45, fresh 11/11. Claude implemented and tested; Codex has not reviewed. Source and evidence: `v7.96_equipment_tab_DRAFT/`.

**Fencing on Today — corrected 2 Oct 2026.** Andrew: "why isnt the info of fencing in today. I need you up to date". v7.93 had hidden Today's Fencing card as a repeat; its docket count, quote flag and week lines are on no other card, so it is back (fix in the v7.93 patch). **v7.95 rebuilt: 8,898,905 bytes, SHA-256 `a24644fa0c3611324eb6250797746a3266cf7f6cc8a1ce6d52dad2ee78a202a6`; the earlier `90bfc093…` is superseded — do not upload it.** Record still behind: hire agreements 36564–36568 and service notes 24461–24465 (transcribed in `record_02Oct2026_fencing_papers_36564_36568/papers.json`, about $29,114.17 charged) are not entered; asked of Codex (edit key) on PR #1.

**v7.95 — Today packed, with jump buttons and folding sections: READY TO UPLOAD (Claude, 2 Oct 2026 14:20 AEST).** Author: Andrew Fisher. Andrew: "We have a lot of dead space in all of them try again"; he said "Ok" to Packed + folds. Carries v7.91 and v7.93 (upload this one only). Programme card in one band; Today's work, By group and By branch packed at natural height; By branch, Money and On site fold; jump buttons under the Today heading; paper prints as before. Empty card area 27% → 13%, page 6,693 → 4,171 px at 1,440 px. On live v7.92 `476f0dcc`: `bash toolchain/build.sh v7.95 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py v7.95_today_packed_DRAFT/patch_v795.py` → superseded by the rebuild with Today's Fencing card (see the Fencing note above: `a24644fa…`). Packed tests 20/20 desktop + 14/14 phone, both sweeps clean, navigation 21/21, rules 45/45, fresh 11/11; v7.93 checks 22/24 (the 2 look for headings now inside folds). Claude implemented and tested; Codex has not reviewed. Source and evidence: `v7.95_today_packed_DRAFT/`.

**v7.93 — Today and Where we are on one tab (Andrew's Example A): READY, now carried by v7.95 above — upload v7.95, not v7.93 (Claude, 2 Oct 2026 12:40 AEST).** Author: Andrew Fisher. Andrew: "we really need to merge both today and where we are into one" ... "make sure we dont double up info"; he picked Example A. Today carries Where we are (its own code, its own pane) under Today's cards; Where we are leaves the tab row and Tools (`#progress` opens Today at By group); repeats left off on screen only (dial panel, milestone strip, As at / Today date line, Today's Fencing and Costs cards, chicane picture, second View only line). Also fixes the dead Open lines on Today's instruments (live wired `.island.hubgo`). v7.91 folded in, not uploaded separately. On live v7.92 `476f0dcc`: `bash toolchain/build.sh v7.93 v7.91_today_tidy_full_width_DRAFT/patch_v791.py v7.93_one_tab_today_DRAFT/patch_v793.py` → **8,889,991 bytes, SHA-256 `2aeecb8ca3287511b4dcdff6d2db02612fd3d02ef784e4fc49076ac9a1f3564b`**. One-tab tests 24/24 desktop + 24/24 phone, both 21-tab/7-link sweeps clean, navigation 21/21, rules 45/45, fresh-after-save 11/11, editing link checked. Claude implemented and tested; Codex has not reviewed. Source and evidence: `v7.93_one_tab_today_DRAFT/`.

**v7.92 — Showcase photo-informed whole-lap refinement and smoothness: LIVE, 02 Oct 2026 11:19 AEST.**
Author: Andrew Fisher. Andrew: "Revisit showcase again. Wiith new info. Must be smooth. No bugs no errors".
Built on the then-current live v7.89 page, carrying forward the whole-lap work and 39 new photo references.
Adds coastal facade/foliage detail, pit framing, clearer lettering and daylight. Rendering storage is reused,
pixel quality adapts earlier, and graphics recovery retains the current lap/camera/pause. Original circuit, car,
physics, cameras, media/weather, operational page and records are preserved.
Scope: `v7.92_showcase_photo_refinement_LIVE/`, branch `codex/gc500-v788-full-lap` / PR #26.
Implementation and independent subtask reviews completed within Codex; Claude's Today work remains separately owned.
Final page `476f0dcca3d97de07d55c8eb7c85618a8672abf99f2c00f2892c11690b7bc265`, 8,883,495 bytes.
74/74 lap, 28/28 smoothness/recovery, 23/23 integration, both 21-tab/7-link sweeps: zero detected errors.
Protected source 15/15, mutation 5/5, pit 15/15, signage 15/15, storage/quality 10/10, shader 9/9;
26 lap views plus hosted desktop/phone visually inspected. Exact rebuild/static checks/dry-run pass.
Codex implemented, delegated independent source/visual/shader reviews, and ran final browser integration.
Claude has not reviewed this final v7.92 candidate. Codex published and verified exact public bytes; record **3538** unchanged.
No record changes or journals. Proof: `v7.92_showcase_photo_refinement_LIVE/evidence/release_verification.json`.

**v7.91 — Today tidy-up after full width: READY TO UPLOAD (Claude, 2 Oct 2026 10:35 AEST).** Andrew: "this is how today
looks now, this needs some work to clean up". On the live v7.89: `bash toolchain/build.sh v7.91
v7.91_today_tidy_full_width_DRAFT/patch_v791.py` → **8,862,008 bytes, SHA-256 `a942bebe86fabc53d905e8267b526a9a1d54699adf5243fb9314ee6bf65d05e6`**.
Back in the header row; picture bands capped at 1,400 px (same crop); Deliveries fills its panel; Today's cards fill each row.
Desktop only. Sweeps ×2 clean, navigation 21/21. **Superseded: folded into v7.93 above; do not upload v7.91 on its own.**

**v7.90 — map explorer (machine files only): LIVE, 2 Oct 2026 09:55 AEST.** Plan ⇄ satellite fits the view;
Done markers start hidden until selected. Codex found and fixed the pending zoom/pan/rotation race during independent
review of Claude's ready handover. Final exact JS **128511 bytes** `ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4`,
entry **23736 bytes** `dd4b44d2169f38ef46d056d488d9bfaa39fa6942233ad3f98a9750af8e9ef25f`.
Final checks **22/22 + 7/7 on each device**, phone visual inspection, reproducible patch, source preservation and guarded
machine publication passed. Codex published and verified the final corrected candidate; Claude's original handover
review preceded this narrow correction. Other 217 machine files, v7.89 page and record **3538** unchanged.
Proof: `v7.90_map_plan_fit_and_quiet_ticks_LIVE/evidence/release_verification.json`.

**v7.88 — historical full-lap Showcase study: superseded by the tested, LIVE v7.92 refinement above.**
Codex preserved the existing car, route and cameras while adding detail across the full 2.91 km source lap; both MP4
references were read. Source, tests and actual-browser contact sheets: PR #26, branch `codex/gc500-v788-full-lap`
(`d950bd9`). Frozen page `121d183a…`, preview `a31ccb85…`: Codex **68/68** full-lap checks, **23/23** integration
and both **21-tab/7-link** sweeps; Claude independently checked the same candidate (**61/61** in-page lap, **45/45**
rules, **58/58** earlier lap harness), PR #1 comment `5942850787`. This is stylised browser graphics, not photorealistic.
The frozen v7.88 bytes were never uploaded. Their whole-lap changes were carried into v7.92, rebuilt on then-live v7.89 and fully retested before publication. Separate from the live map fix.

**Further whole-track photographs — reviewed and applied in v7.92, 2 Oct 2026.** Author: Andrew Fisher.
Codex and its source-review subagents visually reviewed 39 originals: `20490`, `20491`, `20526`, `20527`,
`20667`–`20696`, `20698`–`20702` (all `.jpg`). Byte-verified private copies and provenance manifest:
`/workspace/private-full-lap-references/photos-02Oct2026/` on the Codex workspace; access from Claude's workspace
is not established. Claude's original-photo review remains pending; a text summary is not a source review.
Shared observations and placement limits: `v7.88_full_lap_detail_DRAFT/PHOTO_REFERENCES_02Oct2026.md`.
Two different Boost gantries, three bridge designs and the separate pit/access lane are distinguished.
The intake itself changed no graphics or records. The later v7.92 release applies illustrative coastal facade/foliage treatments, pit framing, clearer existing lettering and daylight; exact new gantry locations were not inferred. Originals remain private; Claude's original-photo review is still pending.

**v7.89 — compact header + full-width tabs: LIVE, 2 Oct 2026 09:44 AEST.** Andrew: "let's fix this first"
... "should we not be using the full page" ... "should these not all be the same size". One patch on the live v7.87
`d592847a`: `bash toolchain/build.sh v7.89 v7.89_compact_header_full_width_LIVE/patch_v789.py` → **8,861,306 bytes, SHA-256
`0d165f5f8829f0b4bdc4403d945ebfb09ef668cfbc7a09e0c139e40ba23634ac`**. Desktop only: one row (lockup, search, three equal pods taking half the header width), slims to 105 px when the page is scrolled, tabs full width (1,500 px cap lifted). Laptop header 39% → 27% (15%
scrolled). Sweeps ×2 clean, navigation 21/21, fresh-after-save 11/11. Phone bar untouched. (v7.88 = Codex's full lap.)

Independent final-candidate review complete (Codex): exact `0d165f5f` rebuilt; header **30/30**, fresh-after-save
**11/11**, both **21-tab/7-link** sweeps with zero page/console errors, desktop/phone visual inspection, protected
source preservation, static checks and dry-run pass. Claude's final handover and Codex's review now cover the same
candidate. **Codex published and verified it LIVE, 2 Oct 2026 09:44 AEST**; public bytes match and shared record **3538** is unchanged.
Publication proof: `v7.89_compact_header_full_width_LIVE/evidence/release_verification.json`.

# GC500 status board

Shared by Claude and Codex. Update it when you claim work, when something goes live, and when Andrew answers a
question. Newest first in each section. Times AEST.

## Release completed — v7.90 map explorer LIVE, 2 Oct 2026 09:55 AEST

Author: Andrew Fisher. Original plan and satellite switches now fit the correct view; pending motion cannot restore
an old coordinate-space camera afterwards. Same-family pan/zoom/rotation is retained. Done markers start hidden and
remain available from the Done chip. **Claude implemented and checked the original handover; Codex independently
reviewed it, corrected the animation race, completed the final tests and published/verified the corrected files.**
Final **22/22 independent + 7/7 handover checks on each device**, no page/console errors or write attempts, complete
phone-frame visual review, exact source rebuild, fresh-base guard and machine dry-run passed.
Two files changed, 217 preserved; active 219-file manifest
`d53a38c6e4f51dce99aae0ab9ce2420408c2c6b6135ddaecac93c785533645cf`. Public JS and entry match the tested bytes.
Dashboard v7.89 `0d165f5f…` and shared record **3538** unchanged. No record changes, journals or real sends.
Source and proof: `v7.90_map_plan_fit_and_quiet_ticks_LIVE/`.

## Release completed — v7.89 compact header LIVE, 2 Oct 2026 09:44 AEST

Author: Andrew Fisher. The desktop clock, race-day and record pods are equal and occupy half the header row on
laptop and wide screens. The header slims after scrolling past 90 px and restores within 12 px of the top. Tabs use
the full available page width. The phone layout, original data, car, media and Showcase code are preserved.
**Claude implemented and tested the final handover; Codex independently reviewed and tested the same final candidate,
then published and verified it live.** Page **8,861,306 bytes**, SHA256
`0d165f5f8829f0b4bdc4403d945ebfb09ef668cfbc7a09e0c139e40ba23634ac`.
Independent header **30/30**, fresh-after-save **11/11**, both **21-tab/7-link sweeps** with zero page/console errors,
desktop/phone visual inspection, source preservation, static checks, dry-run and fresh-base guard passed.
Public view verified byte for byte; shared record **3538** unchanged. No record changes, journals or real messages.
The v7.88 full-lap draft remains separate; v7.90 map publication is recorded above. Proof: `v7.89_compact_header_full_width_LIVE/evidence/release_verification.json`.

## Release completed — v7.87 Inventory LIVE, 2 Oct 2026 09:14 AEST

Author: Andrew Fisher. Inventory now shows the waiting references under each Still-to-come number, with one line per
location for its due day, remaining equipment, locator, satellite image, directions and QR. Share PDF uses the same
location lines. The new per-type list's reference and map controls were corrected during independent review.
**Claude implemented the original handover and regression; Codex corrected the click bindings, completed final-candidate
checks, published and verified the release.** A second final-hash review by Claude is not claimed.
Page **8,858,382 bytes**, SHA256 `d592847abc0d774502f53fc568f1bfaaff1706be7dd23a3a54a70a1552a4c367`.
Actual clicks **8/8 ×2**, one-line Inventory **20/20 ×2**, Share PDF **9/9 ×2**, both **21-tab/7-link sweeps** with zero
page/console errors, phone and A4 visual checks, six-script static checks, dry-run and fresh-base guard passed.
Fresh public bytes match the build. Shared record **3538** is unchanged; no record changes, journals or real messages.
Whole-lap graphics work remains separate. Source and proof: `v7.87_inventory_one_line_LIVE/evidence/release_verification.json`.

## Release completed — v7.86 LIVE, 2 Oct 2026 08:45 AEST

Author: Andrew Fisher. The incomplete Track detail button is hidden until the visual upgrade covers the whole lap.
The existing full-circuit Showcase, MP4 car/weather, speedos and controls are preserved. The settled Fence blocks
line is also available; the supplier's per-block cost stays unknown until the invoice. No docket entry was changed.
**Claude implemented and checked the final handover; Codex independently reviewed, built, tested and published the
same final candidate.** Page **8,838,586 bytes**, SHA256
`0513542de21e7e00b2498c2416d90941ca7ded90e965fa1540ac50fc55e2e425`, verified live byte for byte.
Track detail off **4/4 per device**, Fence blocks **8/8 per device**, both **21-tab/7-link** sweeps with zero page or
console errors, six-script static checks, phone visual review and official dry-run passed. Shared record **3527** and
the active machine manifest are unchanged. No record changes, journals or real messages. Whole-lap graphics work
remains separate and unfinished. Source and proof: `v7.86_fence_blocks_line_LIVE/evidence/release_verification.json`.

## Signed papers uploaded — 2 Oct 2026 07:42 AEST

Author: Andrew Fisher. Andrew provided the private archive code and authorised the 15 signed-paper uploads.
Codex uploaded all **15** through Documents as Fencing dockets, retaining the paper-number filenames.
Fresh reads prove **15/15 original byte matches**, **15/15 open previews**, and **15/15 filename matches** through
the existing page function. All **308** prior file entries and shared record **3527** are unchanged.
This is attachment completion only; pending docket transcription and the v7.86 Fence blocks work remain separate.
The encrypted transfer file is removed in the cleanup PR; no password, signatures or private source details are committed.
Proof: `record_02Oct2026_fencing_papers_36564_36568/UPLOAD_VERIFICATION.json`.

## Current working arrangement — share implementation; independent releases allowed, 2 Oct 2026

Author: Andrew Fisher

Andrew: "u both work together and share the load. if he is busy u build and edit. os some occasions. u work alone
u edit, u upgrade yourself with out the other person auditing".

Claude and Codex both edit, build and test; split independent scopes and coordinate any ownership transfer.
Codex may complete and publish appropriate changes independently after its own checks. A second agent's audit is
not mandatory for every release; use judgement about when it helps. This replaces the blanket 1 Oct rule below
and any older claim wording requiring two reviews for every upload. `AGENTS.md` records the same instruction.

Required tests, fresh-base checks, verified live bytes, record authorisation and credential protections still apply.
Resolve known release-blocking findings and record who actually checked the final candidate. Distinguish a draft,
a completed handover and a verified live release; do not imply a second review took place when it did not.

For v7.82 and v7.83, Claude implemented the corrections and completed the full regression; Codex completed independent
checks on the same final combined candidate and published it. The known release blockers are resolved.
The approved Showcase scene follows the separate v7.85 release below.

## Release completed — v7.85 approved Showcase detail LIVE, 2 Oct 2026 07:29 AEST

Author: Andrew Fisher. Andrew approved the actual render: **"Wow that looks really good proceed"**.
Codex completed the implementation and final tests. Claude rebuilt the exact candidate, reviewed the kerb fix,
and passed 45/45 driver rules; no remaining blocker ([review](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5940892989)).
Full page **8,836,973 bytes**, SHA256 `2e73ac04d3c8f8105db6ff801998bbd8016a0e60b70374acfe9e4dad3e09c297`,
built on unchanged live v7.84. Standalone **49/49**, full-page/phone **35/35**, both **21-tab/7-link** sweeps,
static checks and upload dry-run pass. Six focused controls and 11 shadow-filter checks pass. Phone visual checked.
All 7,625,870 operational bytes before the renderer and default-off pixels are unchanged. No record writes or messages.
Approved scene is reached through **Showcase → Track detail**. MP4/weather, speedos, dashboard and existing car remain.
Published with the official fresh-base guard and independently verified byte for byte at **07:30 AEST**.
Record **3527** and the active 219-file machine manifest are unchanged. Both final reviews are complete;
this is a verified live release. Claude has the live handover for his separate v7.86 build and regression.
Source: `v7.85_showcase_track_detail_LIVE/`; PR #20. Proof: `evidence/release_verification.json`.

## Release completed — v7.84 directions LIVE, 2 Oct 2026 06:28 AEST

Author: Andrew Fisher. Andrew's five confirmed ways in are applied across texts, driver sheets, the drawer and print
checks. **Claude completed implementation/full regression; Codex independently reviewed and checked the exact candidate,
then published and verified it live.** Page **8,767,811 bytes**, SHA256
`c9958a42085aef90aab8f7e81fdafddf6e49859669bf2b15fecff5818139a725`.
Independent directions **10/10 desktop and phone**, phone visual review, static checks, dry-run and fresh-base guard pass.
Claude's current regression suites and both **21-tab/7-link** sweeps pass; legacy text expectations are documented in the README.
Record **3527** and the active machine manifest are unchanged. No record changes, journals or real sends.
The remaining unconfirmed access decisions stay open. Showcase stays unpublished.
Source and public proof: `v7.84_ways_in_from_andrew_LIVE/evidence/release_verification.json`.

## Release completed — v7.83 including v7.82 LIVE, 2 Oct 2026 05:24 AEST

Author: Andrew Fisher. Map positions and Done markers, one consistent destination across driver sheets, navigation,
texts and pictures, print confirmation that expires when its inputs change, and Inventory Share PDF are live.
**Claude and Codex completed checks on the same final candidate; published and verified live.**
Page **8,765,480 bytes**, SHA256 `f654426216d6da4bee1c20958a4d37531dd76bbd4df791793b4b83729f33543e`.
Explorer **127,720 bytes**, SHA256 `dd6256bcd3e20cd89a70ba1c1d32e5f3b7b1acf09a2d19f1ac824f05fea93d3e`.
The map entry versions its script URL to avoid serving an older cached explorer; the other 217 machine files remain unchanged.
Active 219-file manifest: `1436f85afdfe6d8da043a0b4d134eb8f054c9fe4a28c23d8c2103299ad25c490`.
Claude's full regression is recorded in the release folders. Codex's final independent checks: dispatch/calendar **9/9**,
driver print **10/10**, **201 current messages + 198 timed variants**, **68 picture centres**, two picture/dialog flows,
PDF **9/9 desktop and phone**, **41 inventory types / 116 QR targets** agreeing, and both **21-tab/7-link** sweeps clean.
Unchanged explorer **18/18** isolated checks. Static, dry-run, fresh-base and public byte checks pass.
Record **3527** before and after; no record changes, journals or real sends. Operational questions remain visibly unresolved.
The Showcase stays unpublished. Sources: `v7.82_maps_accuracy_and_driver_rules_LIVE/` and
`v7.83_inventory_share_pdf_LIVE/`; each holds `evidence/release_verification.json`.

## Historical preview proof — v7.81 surface refinement, superseded by v7.85 approval

Author: Andrew Fisher. Codex owns this separate preview on `codex/gc500-v7.81-showcase-preview`, draft PR #20.
Andrew: “Lets proceed with showcase improvments” and “don't undo everything else we have done your improving the
look not full redign”. The current pass adds physical profiles to **260 existing kerb footprints**, consistent
fence lighting and barrier/gantry material and connection detail. It retains the earlier facade and foliage work,
source arrays, car, MP4/weather, speedos, layout, controls and driving simulation. The track-detail batch contains
**114 mounting plates, 208 fixings, 100 barrier skins and 22,036 triangles**. Temporary structures and kerb profiles
remain illustrative, not surveyed. Current ownership follows the 2 Oct arrangement in PR #21.

Built on **live v7.84** ([PR #23](https://github.com/tatts29-svg/fish/pull/23)), **8,767,811 bytes**, SHA256
`c9958a42085aef90aab8f7e81fdafddf6e49859669bf2b15fecff5818139a725`. The v7.81 label identifies this separate graphics
draft, not the current live release. Full draft: **8,834,099 bytes**, SHA256
`d5cd59c5df09caadfa835f3c10f1aef2a073852ec6922474107f97efefb67c21`.
Standalone preview: **1,142,904 bytes**, SHA256
`8908db45cee553841abc33c5c5bf87195d8486d2d6edfd058180d716bf702a5e`.

Standalone **49/49**, full-page **25/25**, and both **21-tab/7-link** navigation sweeps pass on those hashes.
Default-off pixels match v7.84; exiting restores preferences and releases added resources. All **7,625,870 bytes**
before the renderer match the v7.84 base exactly. Independent internal code review found no surface-pass blockers.
Claude's review at a67c9d4 applies only to the historical prototype; it is not a review of this candidate. Checks:
`v7.85_showcase_track_detail_LIVE/evidence/surface-{standalone,full-page,sweeps,preservation}.json`.

**Historical preview evidence.** Andrew has since approved publication as v7.85 above. Actual desktop, phone, track-level and kerb-profile frames plus a six-second
1440 × 900 animation are complete in `evidence/surface-*`. `surface-render.json` records hashes, zero render errors
or external requests, and a native 3840 × 2160 still retained in Andrew's local review package. Software exports do
not establish real-time/4K frame rates. Earlier evidence is marked historical in the README. Visual fidelity and performance
on physical devices remain unfinished. Private photos and clips remain private. No graphics publication, project
record edits, journals or real messages. The released operational corrections remain in the v7.84 base.


## Release completed — v7.80 Fencing card refresh LIVE, 2 Oct 2026 00:45 AEST

Author: Andrew Fisher. A typed paid fence rate now refreshes the Fencing breakdown immediately, so the card and
its headline total agree. Saving clears the per-draw memo before and after the existing save; all other v7.79 content
is preserved. **Both reviews complete on the same final candidate; published and verified live.**
**8,682,905 bytes**, SHA256 `303029e3e64d5a43654bafc400d09e5bed2efbb93060a964214502cc04b96fc7`.
Independent Fencing checks: **5/5 desktop and 5/5 phone**, zero page errors. Final handover: fresh-after-save **11/11**
and P&L **31/31** on both devices; navigation **21/21**; both **21-tab/7-link** sweeps with zero page/console errors.
Static checks, upload dry-run and base guard pass; public view verified byte for byte. Server **v5.87** and record
version **3521** unchanged. No record changes, journals or real texts. Source and proof:
`v7.80_fencing_card_fresh_LIVE/`; `evidence/release_verification.json`.

## Release completed — v7.79 welcome and navigation text LIVE, 1 Oct 2026 22:17 AEST

Author: Andrew Fisher. Codex owns this change. Andrew asks for a more professional message with a picture,
navigation and a welcome to Coates GC500. Retain the working map picture and verified MMS delivery; update the
message to welcome the recipient, identify the reference/equipment, label navigation clearly and keep the confirmed
site access instructions. v7.78 plain-text-default proposal stays on hold. **Both reviews complete; published and verified live.**
Final candidate: 8,682,654 bytes, SHA256 `19d200c470b5ac7403efad12b42160a6e049c11f7ed7eadbe68b2a640999423a`.
23/23 practice checks on desktop and phone, both 21-tab/7-link sweeps with zero page/console errors, phone visual
review, static checks and upload dry-run pass. Across 201 references all 199 existing details links and 184 due
lines survive (200 links now fit); maximum 456 GSM units. No real sends or record writes in these checks.
Public view verified byte for byte; server v5.87 and record version 3521 unchanged. Source and proof:
`v7.79_welcome_and_navigation_LIVE/`. Branch `codex/gc500-v7.79-professional-text`, PR #18.

## Earlier release instruction — 1 Oct 2026, superseded by the 2 Oct arrangement above

Author: Andrew Fisher

Andrew: "Let me know when done i want you to work on something else and you publish the updates on the new tasks
only when you and claude are finished though".

This was the rule for the releases recorded below. Their completed joint reviews remain part of the release
history. For current and future work, use the 2 Oct arrangement above and the updated `AGENTS.md`.

Historical state (2 Oct 2026 00:45 AEST): **v7.80 was LIVE**, including the v7.79 welcome/navigation message and the
Fencing card refresh. Picture texting remains verified end to end on server **v5.87**. The v7.78 plain-text-default
proposal stays on hold. The Showcase preview is a separate unpublished task.

## Release completed — v7.76 LIVE, 1 Oct 2026 18:59 AEST

Author: Andrew Fisher

Navigation and the selected page now share the existing synchronous asset snapshot; the forecast and Rehire models
are reused within that same draw. Original calculation bodies are unchanged. **8,674,101 bytes**, SHA256
`449f9d0c292d64388c7cb804bcab13307bac3d7cd48118160f147742a9a9e1d1`; public view verified byte for byte.
21 synthetic regressions, 36/36 paired checks on each device, both 21-tab/7-link sweeps, phone visual review and
upload dry-run pass. Same displayed content, financial models, permissions and fresh-record behaviour as v7.74.
Costs median JavaScript navigation: **426 → 330.5 ms desktop (22.4%)**, **368.8 → 312.8 ms phone viewport (15.2%)**,
five warmed runs per build on the same host. Phone is emulated, not physical handset timing; full aggregate results
and limitations are in `v7.76_navigation_performance_LIVE/evidence/benchmark_summary.json`.
Record stayed **3521**; no record or ledger writes. Claude has the live proof and is completing an additional cross-check.
His v7.75 follow-up builds on this release. Final proof: `v7.76_navigation_performance_LIVE/evidence/release_verification.json`.

## Release completed — v7.74 LIVE, 1 Oct 2026 18:45 AEST

Author: Andrew Fisher

The frozen v7.74 handover from 10bfa6c is live on v7.73: **8,673,113 bytes**, SHA256
`59e58833ab1ee8c6fb0ad2f8c2b3ff5e7b13c14923cd3e70459bc32503fda7d8`; public view verified byte for byte.
70 wording replacements, phone-table fixes and recorder display tidy-up. The final handover has 31/31 checks on
both devices and both 21-tab/7-link sweeps clean; independent review, earlier candidate checks and light/dark phone
visuals also pass. Upload dry-run passed. Record was **3521** before and after; no record or ledger writes.
Source: `v7.74_tidy_two_LIVE/`; final proof in its `evidence/release_verification.json`.
Claude asked to verify independently. v7.76 navigation performance remains in progress; v7.75 is separate.

## Release completed — v7.73 LIVE, 1 Oct 2026 18:19 AEST

Author: Andrew Fisher

The combined v7.70 + v7.72 + v7.73 handover, with independent review corrections, is live on the v7.71 base.
**8,667,935 bytes**, SHA256 `6010538894d3637c4d7267fecd4da75ad46484bdc22170244244d4835927a5f9`;
public view verified byte for byte. Fresh checks: 31/31 desktop and phone, 33 synthetic regressions, both sweeps
21 tabs and 7 deep links with zero page/console errors. Sampled table headers pass 7:1 in light and dark themes;
phone visuals inspected. Upload dry-run passed. Record stayed **3520**; no record or ledger writes.
Source folders v7.70, v7.72 and v7.73 are `_LIVE`; proof is `v7.73_crystal_LIVE/evidence/release_verification.json`.
Claude asked to independently verify the live bytes on PR #1. v7.74 and the remaining speed work stay separate.

## Release completed — v7.71 LIVE, 1 Oct 2026 17:19 AEST

Author: Andrew Fisher

The programme forecast lookup correction is live: **8,638,736 bytes**, SHA256
`919b23f2b030af4b5a06c2a6b98661a3e637040582ede75e9d51cdcb181b3d29`; public view verified byte for byte.
Source PDF verified; 26 synthetic, 13 integration and 22 forecast regression checks pass. Both sweeps passed
21 tabs and 7 deep links with zero page/console errors. Phone screenshots inspected. No record or ledger writes.
Source: `v7.71_fencing_forecast_card_lookup_LIVE/`. Claimed and pushed at 17:10 AEST, separately from v7.70.

Historical v7.70 review hold: the e288743 draft needed corrections despite its reconciliation checks passing.
The corrected v7.70 is now LIVE within v7.73 above. Detailed source review stays private; subsequent releases build
on the current live page.

## Release completed — v7.69 LIVE, 1 Oct 2026 17:02 AEST

Author: Andrew Fisher

The approved v7.68 + v7.69 handover is live, including the tank-piece regression correction. **8,637,431 bytes**,
SHA256 `ea4643899d33b677c0911b679b0b3e97e5610fe686ab383a39a239a34baf2c43`; public view verified byte for byte.
Fresh desktop/phone checks 18/18 each, tank phone checks 16/16, seven synthetic cases and both 21-tab/7-link sweeps
passed with zero page/console errors. Phone screenshots inspected. Both source folders are `_LIVE`.
Claude asked to independently verify on PR #1. The authorised record follow-up completed at 17:03 AEST: record version 3503 → 3520, 17 new documents,
zero updates/deletions, existing charges preserved and fresh readback verified. Private backups retained.

## Standing instruction — shared source-document review, 1 Oct 2026

Author: Andrew Fisher

Andrew: "What ever documenet claude gets you need to read and also understand". Both agents read the original source
and acknowledge what it means, what is unresolved and what has been applied. Receipt, review and application are
different states. `../AGENTS.md` records the lasting rule. An attachment in one chat is not automatically accessible
to the other agent: share its original location and revision through the authorised handover location.

Claude has been asked on [PR #1](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5925213072) to confirm a private
location for detailed findings and any originals not yet accessible to both agents. Public coordination stays here;
private originals and review details stay in the authorised private location.

## Release completed — v7.67 LIVE, 1 Oct 2026 15:04 AEST

Author: Andrew Fisher

The corrected v7.64 → v7.65 → v7.66 → v7.67 handover is live: **8,626,587 bytes**, SHA256 `0368fc08ee159f7c12903b53299ba16dec97b846143708ce187e39783b11a853`. Upload verified the public view byte for byte. Includes the final NVAC correction. Six review regressions and 18 fresh phone checks pass; final handover evidence shows all four releases' desktop/phone checks and both 21-tab/7-link sweeps passing without errors. Four folders renamed `_LIVE`. Claude asked to perform independent live verification on PR #1. The WC44/WC71/WC67 record batch completed at 1 Oct 2026 15:06 AEST with private backups and fresh readback; record version 3406 → 3451, zero deletions.

## Release completed — v7.63 LIVE, 1 Oct 2026 13:57 AEST

Author: Andrew Fisher

The approved v7.60 → v7.61 → v7.62 → v7.63 build is uploaded and served byte for byte: **8,572,884 bytes**, SHA256 `e723a1fbe2ba001812d91e98d15d0c8761639bb4578d552e2e471e433b5a7fa3`. Matched the frozen handover candidate; 33/33 desktop and phone checks and both 21-tab/7-link sweeps recorded as passing, build checks rerun. Page upload began with record version 3283; a later read showed 3287 during independent live activity. Record changes are audited separately. No ledger posting. Four source folders renamed `_LIVE`.

v7.64–v7.67 are now LIVE within v7.67 at 15:04 AEST. The queued WC33/WC56/WC59/WC60 record update completed at 14:03 AEST through the page and was verified by fresh read; see its completion record. Record version 3288 → 3401, zero deletions.

## Brief from Andrew — 1 Oct 2026 12:20 AEST: "All costs must be correct and accurate. Forecast as much as we can. Clean data, tidy, presentable — all in on GC500."

Author: Andrew Fisher

Claude's audit of the Costs tab is in `costs_audit_01Oct2026/README.md`: twelve findings (one arithmetic miss — transport counts one load per reference, WC05's second truck $290 dropped; three dockets costed by the hour not the metre; one undated docket treated two ways; the rest are gaps in the record that only Andrew or a supplier can fill — Coates wage rates, Alfie's 31 nights, three sub-hire costs, two no-rate lines, the water truck rate, Q6846's dates, four empty dockets, the fence team of six), a forecast to job end from the record (fencing carried through the programme's remaining weeks: about $109,900 more cost and $166,900 more revenue; transport, accommodation, toilets, Job Connect), and a one-flow layout for the tab. Claimed: **v7.64** (correct and complete + Costs to job end card) and **v7.65** (the tab in one flow). Codex asked not to change Costs-tab code while these are drafted.

## Decision from Andrew — 1 Oct 2026 12:05 AEST: accrue the revenue

Author: Andrew Fisher

Andrew: "We want to accrue the revenue. We are just supplying info today so the business sees how well we manage costs." So the WIP question on the Accruals for Finance section is answered for GC500: September's unbilled revenue is accrued (fencing $120,913, barriers and VMS $26,316, forklifts $11,656, install labour $17,083, container delivery $1,000 = $176,968), and the costs stay in the month they were incurred (fencing to accrue $30,735 after the two Advanced invoices; Job Connect $6,285; loads and tracker expenses on checking the invoices). Nothing is posted from the page; the proposals are recorded under Finance journal proposals by Andrew on the edit link once Finance confirm. The Event Portables September share ($21,950) stays Finance's call. No page change needed for this; the section already shows "Accrue" on those rows.

## Completed handover — the Costs tab (LIVE within v7.63 at 13:57 AEST)

Author: Andrew Fisher

Andrew, 1 Oct: "hard focus on costs… toilets under KINP… cleaning is not labour… Labour Install"; "we need this clean info in the Costs section for the finance team to look at"; "I need to know what the forecast labour is". Built, reviewed both ways (Codex's v7.62 review of Claude's v7.61; Claude's v7.63 review of v7.62), tested and swept. Marked ready by Claude on Andrew's instruction that this information go in the Costs section; Andrew can have it pulled back with a word.

**One build, four patches, on the live v7.59 (8,489,105 bytes):**
```
bash toolchain/build.sh v7.63 v7.60_costs_in_andrews_structure_LIVE/patch_v760.py v7.61_accruals_for_finance_LIVE/patch_v761.py v7.62_finance_review_basis_LIVE/patch_v762.py v7.63_accruals_in_andrews_words_LIVE/patch_v763.py
python3 toolchain/upload_page.py build/GC500_v7.63/GC500_Delivery_Control_hosted.html
```
Expected **8,572,884 bytes**, SHA-256 `e723a1fbe2ba001812d91e98d15d0c8761639bb4578d552e2e471e433b5a7fa3` (Claude's build on 1 Oct 11:55 AEST; if the live page is no longer v7.59, rebuild on what is there and the bytes will differ). Checks on that build: `v7.63_…/evidence/practice_tests.js` desktop 33/33 and phone 33/33; `v7.60_…/evidence/practice_tests.js` reconciles; both sweeps 21 tabs, 0 errors, 0 console. No record write; nothing sent. After upload: record the live bytes here, rename the four folders `_LIVE`. Nothing else goes up with it — not the Three.js circuit, not the Today · Current Position design (still withdrawn), not the record (Andrew's 1 Oct Baseplan export is kept in `v7.61_…/sources/`, not folded in).

## Instruction from Andrew — 1 Oct 2026: "Update and release everything"

Author: Andrew Fisher

**Release progress — 1 Oct 2026 08:20 AEST: ALL THREE DONE. Everything Andrew asked to be released is live.**
1. **Page v7.59 LIVE:** v7.55 P&L words, v7.56 drawing zoom, v7.57 map-picture Text it and v7.59 controls, plus the Brisbane-date correction in the picture footer. 8,489,105 bytes, SHA256 `ed1e2f4b9e97b94558d09522bdd9b7c64aaf1e18740a39dd88494227b388a403`. 55 focused checks and both 21-tab/7-link sweeps passed. Four page folders renamed `_LIVE`.
2. **Explorer v7.58 LIVE:** only `explorer/explorer.js` changed, all other 218 files preserved. Served file verified byte for byte. Folder renamed `_LIVE`.
3. **Server v5.85 LIVE (08:20 AEST):** Codex PUT the validated 228,182-byte blob `76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` on the service with the rollback blob `264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14` kept; Claude set `SERVER_FILE` to the new hash, `SERVER_FILE_KEEP` to the rollback hash first with the existing entry preserved, and redeployed once by the blob route (never the `SERVER_B64` fallback). `/health` → `"build":"v5.85"`; the deploy log's `sha256sum /app/server.js` is the new hash. Details in Live now.

All record versions stayed at 3082. No real messages were sent. Public coordination: https://github.com/tatts29-svg/fish/pull/1#issuecomment-5920624903 .

**NOT to be released, by Andrew's word (1 Oct):** the Three.js circuit (v7.53 draft) and the Today · Current Position design. Andrew: "We are not changing the circuit and the Today · Current Position. I want to restart and relook at what we do with that. Was not happy with your last effort." Both are withdrawn — no build, no upload, no further work until Andrew restarts them with a fresh brief. The live Showcase and the live Today / Where we are pages stay exactly as they are.

## Earlier release — 1 Oct 2026 05:22 AEST

Author: Andrew Fisher

**v7.54 is LIVE**, combining the approved v7.52 Forecast P&L and v7.54 branch Rehire handovers with the Questions fixes. Both financial folders are now `_LIVE`; `v7.54_questions_tidy_LIVE/README.md` records the complete build, validation and byte proof.

The existing live base already contained the v7.53 **Questions/financial/runtime fixes** (8,436,993 bytes); that release is distinct from the held v7.53 **Three.js circuit draft**. The circuit draft and Today · Current Position design remain on hold and were not applied.

Questions: **16 open, 8 pending, 33 answered/history**. FL01 supplier fleet 50004 is supported by the contract location note; uncertain site allocations and missing rates remain open. No shared records or Finance journals were changed. Source contract rates and the corrected Revenue are preserved.

## Live now

| version | what | live | by |
|---|---|---|---|
| **v7.90 machine LIVE** | Plan/satellite fitting, cancelled old camera animations and default-off Done display; two files byte-verified, other 217 preserved, page v7.89 and record 3538 unchanged. | 2 Oct 2026 09:55 | Claude (original handover), Codex (review/race fix/final checks/upload) |
| **v7.89 LIVE** | Compact desktop header, three equal pods occupying half the row, scroll hysteresis and full-width tabs; phone unchanged. Both agents checked exact `0d165f5f…`; public bytes verified, record 3538 unchanged. | 2 Oct 2026 09:44 | Claude (implementation/checks), Codex (independent review/checks/upload) |
| **v7.87 LIVE** | Inventory waiting references and location lines with due day, remaining equipment, locator, satellite, navigation and QR; shared PDF layout. Drill click bindings corrected during review. Exact `d592847a…` byte-verified live, record 3538 unchanged. | 2 Oct 2026 09:14 | Claude (original implementation/regression), Codex (binding fix/final checks/upload) |
| **v7.86 LIVE** | Incomplete Track detail option hidden; existing full-circuit Showcase preserved. Settled Fence blocks line available; existing docket figures unchanged. Both agents checked exact `0513542d…`; byte-verified live, record 3527 and explorer unchanged. | 2 Oct 2026 08:45 | Claude (implementation), Codex (independent review/checks/upload) |
| **v7.84 LIVE** | Andrew’s five confirmed ways in; shared directions across text, driver sheet, drawer and print check. Exact c9958a42 candidate verified live; record 3527 and explorer unchanged. | 2 Oct 2026 06:28 | Claude (implementation/full regression), Codex (independent checks/upload) |
| **v7.83 LIVE (includes v7.82)** | Map accuracy, Done markers, consistent driver sheets/texts/pictures, print confirmation and Inventory Share PDF. Both agents completed checks on f6544262; page and explorer verified byte for byte. Record 3527 unchanged. See release proof above. | 2 Oct 2026 05:24 | Claude (implementation/full regression), Codex (independent checks/upload) |
| **v7.80 LIVE** | The Fencing tab's "Paid to Advanced, by P&L line" card follows a typed paid rate at once: a save empties the per-draw memo (`RENDER_MEMO`). On live v7.79 the card stayed stale (3/5); now 5/5 on desktop and phone, v7.75 11/11, P&L 31/31, navigation 21/21, sweeps clean. Both reviews on the same build. Claude fetched it fresh at 00:45: **8,682,905 bytes, SHA-256 `303029e3e64d5a43654bafc400d09e5bed2efbb93060a964214502cc04b96fc7`**. No record changes. `v7.80_fencing_card_fresh_LIVE/`. | 2 Oct 2026 00:45 | Codex (upload), Claude (fix) |
| **v7.79 LIVE** | Professional welcome, reference, Navigate link and site access in Text it; existing delivery-details links and due dates retained. Both reviews, 23/23 checks per viewport, both sweeps and byte verification complete. No record writes. | 1 Oct 2026 22:17 | Codex, reviewed with Claude |
| **server v5.87 LIVE — picture texting verified** | Picture messages go from the ClickSend shared number (`MMS_FROM=shared`); plain texts are unchanged and still go from SMS_FROM. Codex signed off and staged the blob at 21:50. Claude made one Railway change at 21:50: deployment `81618338…` SUCCESS; deploy log `server from volume blob d5a0d777…`; running SHA-256 `d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc`; `/health` v5.87; record 3521 unchanged. `SERVER_FILE_KEEP` keeps v5.86 `f5b9a3f7…`, `76afbd99…`, `264363…` and `b8d38b…`. Rollback: `SERVER_FILE=f5b9a3f7…` and remove `MMS_FROM`. **Verified end to end (21:56):** the attempt at 21:48:59 was before the switch (v5.86, FAILED/301, the old cause). The one authorised GC500 picture on v5.87 (Codex, to the recipient Andrew confirmed) was confirmed arrived by Andrew and read back as DELIVERED / 201 with no error code. GET-only follow-ups, no resend. `server_v5.87_pictures_from_shared_number_LIVE/README.md`. | 1 Oct 2026 21:50 | Claude (activation), Codex (review, staging) |
| **v7.75 + v7.77 LIVE** (with server v5.86) | v7.75: a save made during navigation now shows on screen straight away; the Transport and Consumables Recovery ratios wait until the quotes split. v7.77: "Text it" delivery wording and the receipt lookup (server v5.86, deployment `4941538a…`, 20:42). Both agents reviewed it. Claude fetched the public view fresh at 21:53 AEST: **8,682,665 bytes, SHA-256 `35e4b00b150e081425e70a642945799d4dbab822bdbc7939c888c0503e5c26ef`**, the jointly reviewed candidate, with `heldFresh775` present. No record changes. | 1 Oct 2026 ~20:42 | Codex (upload), Claude (v7.75) |
| **v7.76 LIVE** | Navigation and per-draw model reuse; verified correctness and measured speed improvement above. No record changes. | 1 Oct 2026 18:59 | Codex |
| **v7.74 verified** | Claude fetched the public view fresh at 18:46 AEST, 1 Oct 2026: **8,673,113 bytes, SHA-256 `59e58833ab1ee8c6fb0ad2f8c2b3ff5e7b13c14923cd3e70459bc32503fda7d8`**, byte-identical to the frozen build. Checks on the live file: both sweeps 21 tabs, 7 deep links, 0 page and console errors, desktop and phone; the released suite 31/31 desktop and phone; every tab's text — no agent's name, no undefined or NaN (`v7.74_tidy_two_LIVE/evidence/regress/live_*`). Record version 3521 (was 3520 at 18:24): read through the page, the newest saved entry on the record is still the WC60 tank ticks of 17:03 and nothing is stamped after 18:00; files 308, unchanged — the version moved without a change to the job's data that the page shows. | 1 Oct 2026 18:51 | Claude |
| **v7.74 LIVE** | Phone tables, management wording and recorder display improvements; exact frozen handover and byte proof above. No record changes. | 1 Oct 2026 18:45 | Codex, from Claude’s handover |
| **v7.73 verified** | Claude fetched the public view fresh at 18:24 AEST, 1 Oct 2026: **8,667,935 bytes, SHA-256 `6010538894d3637c4d7267fecd4da75ad46484bdc22170244244d4835927a5f9`** — the same bytes Codex recorded at 18:19; `/health` still version 3520 (no record write). It is v7.70 + v7.72 + v7.73 on the live v7.71 with Codex's release corrections (19 hunks read in a diff against the frozen candidate: the recorder-name strip scoped to a display helper, not `esc()`; the event scope on its own "allocation pending" revenue row until Finance states the people split; Rehire Recovery "not readable yet" while the fence rate bundles installation; the fixed-light cards given their own paper and ink tokens in dark mode; table headers on the tint token). Checks on the live file: both sweeps 21 tabs, 0 page errors, 0 console, 7 deep links clean, desktop and phone (`v7.73_crystal_LIVE/evidence/regress/live_*`); the v7.70 suite as it stood 28/29 both — the one check that failed encoded the Installation rule Codex changed on purpose; his LIVE suite (31 checks) is the one to run from here. None of the corrections touches the five v7.74 fixes. | 1 Oct 2026 18:24 | Claude |
| **v7.70 · v7.72 · v7.73 LIVE** | Corrected P&L classification, management wording and text clarity; fresh verification and byte proof above. No record or ledger writes. | 1 Oct 2026 18:19 | Codex, from Claude’s handover with independent corrections |
| **v7.55 · v7.56 · v7.57 · v7.59 LIVE** | Uploaded by Codex 1 Oct 2026 08:11 AEST from Claude's handover: 8,489,105 bytes, SHA-256 `ed1e2f4b9e97b94558d09522bdd9b7c64aaf1e18740a39dd88494227b388a403` — the P&L in Andrew's words, the quicker drawing-viewer zoom, Text it to me with the map picture (with Codex's one-line correction: Brisbane's date on the picture footer), and the QR/Navigate/Text it set made tidy. Codex: 55 focused checks and both sweeps passed; no real messages sent; record version 3082 unchanged. Claude fetched the live page and confirmed the bytes and all four patch guards. Folders renamed `_LIVE` by Codex (PR #6, merged into the shared branch by Claude); Codex's release evidence in `v7.59_qr_navigate_text_it_one_tidy_set_LIVE/evidence/` (release.json, release_focused_summary.json 55/55, date_boundary_results.json 4/4, deployment_result.json). | 1 Oct 2026 08:11 | Codex, from Claude's drafts |
| **v7.58 explorer LIVE** | Codex registered the machine set with the quicker explorer (`explorer/explorer.js` only; 218 other files preserved; manifest `c3f9a346eccb8e63127ff600caa5a5d4815a9d31b1ace8870b3f4a39b8c4a3bc`). A wheel notch ×1.38, glide 50 ms. | 1 Oct 2026 08:12 | Codex, from Claude's draft |
| **server v5.85 LIVE** | `/health` → `"build":"v5.85"` at 08:20 AEST 1 Oct 2026. Codex PUT the blob `76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` on the volume (228,182 bytes); Claude set `SERVER_FILE` to it, `SERVER_FILE_KEEP` = v5.84 `264363…` + `b8d38b…`, and redeployed (2aa17cc3, SUCCESS; deploy log: `server from volume blob 76afbd99…` and `sha256sum /app/server.js` = the same hash). About 10 s between the old container stopping and the new one answering. Checks on the live service: `/api/mms` GET and POST answer 401 without a key (the route exists, edit only); `/p/<unknown>.jpg` 404; the view page 8,489,105 bytes; record 3082. Text it to me now offers "Send the picture too" on the edit link. Cosmetic: the start-up banner in the deploy log still reads "server v5.84 — HARDENED …" (the string was not bumped in `patch_server_v585.py`); `/health` is the truth — fix the banner in the next server release, not a release of its own. Rollback if ever needed: `SERVER_FILE=264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14`, redeploy. | 1 Oct 2026 08:20 | Codex (blob) + Claude (Railway) |
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

**v8.14 — Today, trimmed: LIVE 3 Oct 2026 10:04 AEST.** Published by Codex from 89e5054 (dd83f06 plus two audited corrections: Export count kept visible, two-card gap-day packing). Live sha256 6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce, 9,074,112 B; Claude's independent readback matched (PR #1 comment 5963566444). LIVE folder and bookkeeping: `v8.14_today_trimmed_LIVE/` on codex/gc500-v794-lap-cameras (1954b22). Author: Andrew Fisher. Andrew, with screenshots: "starting with today we don't these in here. Unless u think overwise". Off Today: Map, Documents, Also on the schedule — no reference, Roads, Fencing, Your records (its export warning moves to Tools → Export). Next programme day stays only as Due today on delivery days (put to Andrew). No figure changes. Scope: `v8.14_today_trimmed_DRAFT/`. Not READY: tests, pictures, Andrew's yes.

**v8.15 — Documents, clean and tidy: ASKED of Codex (its scope), 3 Oct 2026.** Andrew: "lets clean up the document area and increase the look in here and clean it up. make it look clean and tidy". Claude does a read-only mock-up; build only on Codex's release.

**Map markers and complete icons: PASSED to Codex (its scope), 3 Oct 2026.** Andrew: "maps we want to use a svg or something that pulsates more ... we also want to use icons when something is complete something that matches and references it".

**v7.88 — full-lap Showcase visual correction, Codex, 2 Oct 2026. WORKING PREVIEW; independent checks complete, not live.**
Author: Andrew Fisher. Andrew: "the job was to keep what we have and we are upgrading the look ... its the whole
track not 10 mtrs of it. U also have mp4 videos of whole track to help you". Preserve the existing circuit geometry,
car, driving simulation, cameras, MP4/weather and speedos. Replace the separate short detail run with improvements
over the full existing lap. Review both original GC500_Codex_Part_01.mp4 and Part_02.mp4 privately; record observed
detail without invented locations. Claude has been asked to independently check lap coverage and visual continuity.
The incomplete v7.85 scene is hidden in verified-live v7.86. The v7.88 draft renders the full 2,910.1 m lap,
498/498 boundary segments, 260 original kerb profiles, 80 roadside building parts and 337 refined source trees.
Final desktop/emulated-phone full-lap checks **68/68** pass: 8,163 original physics steps, 71 checkpoints and 13
rendered views per device through 2,935 m, no resets, teleports, graphics errors or external requests. Full-page
integration **23/23** and both **21-tab/7-link sweeps** pass with zero errors. Narrow kerbs and original road paint
are verified. Actual-render contact sheets are in `v7.88_full_lap_detail_DRAFT/evidence/final-*.png`.
Candidate built on v7.87: **8,854,418 bytes**, SHA256 `121d183a400d95d997bfbf4db07b5cb5872b57a8e3ec80d163adc4eaec1dd91e`;
offline preview **1,139,977 bytes**, SHA256 `a31ccb858829675a8ae1b9364107058b823a70b80ec23d1b0467e402ce5191db`.
Claude independently rebuilt the same hashes and completed **61/61** in-page lap checkpoints, **45/45** driver rules,
and **58/58** in the earlier lap harness on desktop/phone. He inspected the circuit views and start/finish join;
no movement jumps or graphics errors. Evidence: `v7.88_review_by_claude/` and PR #1 comment 5942850787 for the finished
phone rerun. Buildings/foliage remain stylised; these checks do not claim Andrew's visual acceptance or physical-device/4K
performance. Rebuild on the latest live base before release. v7.89 header and v7.90 maps are now verified live.
No financial record changes are included in this graphics preview.

**Fencing papers 2 Oct 2026 — entry sheet ready for Codex (Claude).** Author: Andrew Fisher.
HA 36564-36568 and SN 24463-24465 transcribed from Andrew's photographs:
`record_02Oct2026_fencing_papers_36564_36568/papers.json`. Andrew's answers, 2 Oct: "shade cloth same as fencing" (scrim =
the fence metres: 36564 40 m, 36568 462.5 m); "new 60 was north 68 is south" (no overlap); "no shade cloth gone on as yet"
(36560 north); 36566 "charge as per what was used" and "continue with your logic" - 36567 smoking zones CCB Event, 36568
median strip CCB Demarcation, 36566 216 fence blocks at the card's $3.02 (needs v7.85, below). Charged as recorded $29,114.17; paid to Advanced $20,965 (36566 blocks from their invoice); service notes 2.75 h ($275). Signed-paper photos (these 8 and the 29 Sep 7) are with Andrew; they stay off the public repo.

**v7.87 — Inventory: one line per location: LIVE, 2 Oct 2026 09:14 AEST (verified byte for byte).** Author: Andrew Fisher.
Andrew asked for the reference, work still to do, map location and QR on the same line, keeping the Inventory table's
look. Claude implemented the one-line lists, table references and Share PDF and completed the original regression.
Codex independently rebuilt the handover, found unbound reference and map controls in the per-type drill, and fixed
the two selectors. Actual-click tests now prove both lists open the selected reference and map location.
One patch on live v7.86:
`bash toolchain/build.sh v7.87 v7.87_inventory_one_line_LIVE/patch_v787.py` → **8,858,382 bytes, SHA256
`d592847abc0d774502f53fc568f1bfaaff1706be7dd23a3a54a70a1552a4c367`**. This supersedes the earlier `a39c652d` handover.
Codex's final-candidate checks: drill clicks **8/8 ×2**, one-line display **20/20 ×2**, Share PDF **9/9 ×2**, both
**21-tab/7-link sweeps with zero page/console errors**, phone and A4 visual review, six-script static checks and official
dry-run. Claude's broader regression is retained as earlier-candidate evidence; no second final-hash review is implied.
Satellite pictures use the service's public map key at run time; no credentials are committed. No record changes,
journals or real messages. Codex completed the official page-only upload; a fresh public GET matches the build and
shared record **3538** is unchanged. Publication proof: `v7.87_inventory_one_line_LIVE/evidence/release_verification.json`. Review proof: `v7.87_inventory_one_line_LIVE/evidence/independent_review.json`.

**v7.86 — LIVE 2 Oct 2026 08:45 AEST (Codex upload, independently verified by Claude: `0513542d…`). Historical READY TO UPLOAD handover follows (Claude, 2 Oct 2026 07:58 AEST).**
Andrew, 2 Oct: "can we take this out until its fixed, don't have it in there, its almost like a bug ... make it go live so
people don't see". The v7.85 Track detail covers 250 m of the pit straight and the drive runs out of it; its button is no
longer added (`attach()` returns), so it cannot be switched on. The scene's code stays in the page untouched for Codex to
finish (whole lap) and switch back on. Plus the Fence blocks line ($3.02, 36566). One patch on the live v7.85:
`bash toolchain/build.sh v7.86 v7.86_fence_blocks_line_LIVE/patch_v786.py` → **8,838,586 bytes, SHA-256
`0513542de21e7e00b2498c2416d90941ca7ded90e965fa1540ac50fc55e2e425`**. Claude's checks on 0513542d: Track detail off 4/4
desktop and phone (Showcase opens with all its controls, no button, scene off; live v7.85 shows the button); Fence blocks
8/8; full regression of the Fence blocks part passed on 3e1612dd (only the Track detail switch was added since); 21-tab/7-link
sweeps clean on desktop and phone (0 errors, 0 console). Docket 36566 entry remains a separate authorised record task; it was not entered by this release.

**v7.84 — LIVE, 2 Oct 2026 06:28 AEST.** Claude's READY handover at `335886e` was independently checked,
published by Codex and verified byte for byte. See the release completion and Live now entries above.
Source: `v7.84_ways_in_from_andrew_LIVE/`. Remaining access and timing questions stay open.

**v7.82 — LIVE within v7.83, 2 Oct 2026 05:24 AEST. Historical ready handover follows.**
Author: Andrew Fisher. One patch on the live v7.80, plus the explorer:
`bash toolchain/build.sh v7.82 v7.82_maps_accuracy_and_driver_rules_LIVE/patch_v782.py` → `build/GC500_v7.82`
**8,748,278 bytes, SHA-256 `e8a4868c0b6c08dd300bb8817b5343b8fd7d0c09b20b9358c23769385b5f202d`** (commit 2d0e23d);
explorer `v7.82_maps_accuracy_and_driver_rules_LIVE/release/explorer/explorer.js` 127,720 bytes, md5 `2b6d4b43…`,
SHA-256 `dd6256bcd3e20cd89a70ba1c1d32e5f3b7b1acf09a2d19f1ac824f05fea93d3e`. b5af68eb, 987f92f1, bcad902b and b0157d26
are superseded.
**Who checked what.** Claude: full regression on e8a4868c, every suite passing desktop and phone — rules 45/45,
print check 28/28, one destination 12/12, Inventory still-to-come, explorer done chip, fencing, fresh-after-save, P&L
practice, both 21-tab/7-link sweeps, navigation; the v7.79 text checks 15/23 with the same 8 misses as the accepted
b5af68eb (old raw-destination assertions Codex is replacing). Codex: four rounds of findings on PR #1, each reproduced
and fixed with a test that fails on the previous build (logs committed): confirmation invalidated by a changed value;
one destination for the text, Navigate, labels, QR codes and sheet; the printed way in; the picture and a sendable
text. Codex's final recheck of e8a4868c and combined f6544262 is complete; published within v7.83. No record writes, no real texts.
**Left visibly unresolved on purpose (Andrew's answers, not guesses):** the way in for GN04, WB13, WB18, WB20, WC25,
WC45, WC47 (Turn 2 / Ferny Ave), WB07 (Admiralty Dr) and WC31 (S25) — their sheets print "Way in: not set - do not
leave until site gives it", their texts carry a HOLD line and the print check lists them in red; Gate 1 (Tedder Ave
access point) and Gate 2 (GC Hwy underpass via Commodore Dr) are D007's entry points pending his confirmation; the
05:00 morning-run scope; items with no drop-off report to the pit lane until one is set in Edit.

**v7.83 — Inventory Share PDF: LIVE with v7.82, verified 2 Oct 2026 05:24 AEST. Historical ready handover follows.** Author: Andrew Fisher.
`bash toolchain/build.sh v7.83 v7.82_maps_accuracy_and_driver_rules_LIVE/patch_v782.py v7.83_inventory_share_pdf_LIVE/patch_v783.py`
→ **8,765,480 bytes, SHA-256 `f654426216d6da4bee1c20958a4d37531dd76bbd4df791793b4b83729f33543e`** (same explorer as
v7.82). Claude: full regression on f6544262, every suite passing desktop and phone (as v7.82, v7.79 text checks the
same 15/23); Inventory PDF 9/9 desktop and phone. Codex completed the final independent checks and published this combined build with the matching explorer.
Both scopes are verified live; see the release proof above.

**v7.82 — Maps accuracy and driver rules, claimed by Claude, 2 Oct 2026 01:20 AEST.** Author: Andrew Fisher.
Andrew, 2 Oct: "you have picked locations that don't exist, example GN21 … if it's not on the master you back track to their other map, find it, then add the location to the master." Scope: (1) correct the master positions the drawings contradict (GN21: the 27 Sep trace followed the wrong leader line; D024 puts it beside GN20 at the pit lane's west end); cross-check every master position against its own drawing; never invent a position. (2) Driver rules on Text it and the delivery views: Main Beach Pde entry by side (seaside via the Seaworld Dr roundabout end, per Andrew's marked map; land side, e.g. S08, from the other end, race direction); delivery order (waste tanks first; P03 → P01 → P05; WC05 tank → WC05 → P05; P04 after WC05; GN21 before GN20); stagger arrivals; parks: wildlife and low branches, very tight. Checked against what has already been delivered. (3) A clear pulsing "done" marker on the maps. Built on the live page; Codex's v7.81 Showcase preview is separate and unaffected. Both reviews before any upload.

**v7.80 — LIVE 2 Oct 2026 00:45 AEST (see Live now). Claimed by Claude, 1 Oct 2026 22:01 AEST.** Author: Andrew Fisher.
Found by the v7.75 critic: after a paid fence rate is typed on the Fencing tab, the "Paid to Advanced, by P&L line" card
(`fencePaidSplit`) keeps the old figure until the next tab change, while the KPI above it shows the new one. The fix:
a save also clears `RENDER_MEMO`. No figure, rule or record changes. Built on the live base; if v7.79 (Codex, Text it
wording) goes live first, it will be rebuilt on that base. One frozen candidate goes to Codex, and both reviews happen before any upload.

**v7.77 — Text it delivery, claimed by Codex, 1 Oct 2026 19:39 AEST.** Author: Andrew Fisher.
Andrew reports that a text he sends does not arrive on his phone. Trace the page and live message service,
fix the verified cause and exercise the paths with provider sends blocked in tests. Claude owns v7.75 separately.
Both agents must complete review of the final candidate before any publication, under Andrew's latest rule.
Review correction: combined v7.75 + v7.77 page **8,682,665 bytes**, SHA256 `35e4b00b150e081425e70a642945799d4dbab822bdbc7939c888c0503e5c26ef`;
server v5.86 **236,308 bytes**, SHA256 `f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9`.
Both agents reviewed the previous page 577c69b2 and the unchanged server; Claude requested failure wording
that covers provider cancellations and escaped provider status/note detail. Codex applied and reviewed that
correction; 12/12 pure checks, static checks and uploader dry-run pass. UI 25/25 on desktop and phone; both
21-tab/7-link sweeps pass with zero page and console errors. Phone detail screenshot inspected. Claude explicitly
completed the changed-page review on PR #1 (`issuecomment-5929668833`); Codex's review and checks are complete.
**READY TO UPLOAD — both agents finished on the same page and server candidate.** Server f5b9a3f7 is staged,
not activated; v5.85 rollback blob `76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684` is present.
Earlier unchanged save checks pass 11/11 on both viewports; server provider-mock checks pass 82/82.
Draft handover: [PR #17](https://github.com/tatts29-svg/fish/pull/17). No real messages or record writes by tests.
The README includes the read-only check of earlier message reports after server activation. Actual non-arrival
is not considered resolved until the existing reports or handset evidence establish what happened.


**v7.62 — LIVE within v7.63 at 13:57 AEST. Earlier validation: 1 Oct 2026.** [PR #7](https://github.com/tatts29-svg/fish/pull/7) contains the correction overlay; apply after v7.60 then v7.61. 83 synthetic regression checks, 54 desktop and 54 phone browser checks, both 21-tab/7-link sweeps and the upload dry-run pass. Build 8,552,206 bytes; SHA256 `9745d4e521aa222cf81400845956d1c4f35b78c39b4ef2436c656cfed21fa5e0`. No automatic accrual, inferred work dates or hidden unknown values; people/days/hours and invoice evidence retained. Claude has claimed v7.63 for the final presentation pass (PR #7); v7.62 is frozen and handed over with no overlapping edits. Combined release is not yet marked READY TO UPLOAD. No upload or record changes. Author: Andrew Fisher.

| version | what | who | since |
|---|---|---|---|
| **v7.75 fresh after a save** | Claude's cross-check of v7.76 (19:22, PR #1): a box committed during `go()`'s own focus move writes the record and redraws inside the v7.76 hold, so that redraw reads the asset list and the forecast and Rehire models from before the write — the record is right, the screen stale until the next draw (Costs to job end can disagree with the Forecast P&L above it). `v7.75_fresh_after_a_save_LIVE/` — on the live v7.76: `save()` marks an active hold stale and the next read rebuilds once (a draw with no save builds exactly as v7.76); and Transport and Consumables Recovery wait, with the reason, when the Event Portables quotes do not split or are not approved (no change today). Tests: the finding reproduced on live v7.76, passing on v7.75, desktop and phone; builds per tab change unchanged. **Frozen candidate 19:54: `build/GC500_v7.75` 8,675,862 bytes, SHA-256 `0154be31…`** (after Codex's catch on the withdrawn b4f5b990: the hold is marked stale before the save too; and the memo emptied before the rebuild). Test 11/11 desktop and phone (live v7.76 5/11); v7.76 regressions 21/21; released suite 31/31 both; sweeps 21 tabs 0/0 both; tab text unchanged. **Both reviews complete — Claude (19:54) and Codex's sign-off (20:00: rebuilt exactly, 11/11 both, 21/21, his own editor-save reproduction `tabsSeen:[true]`, zero writes). READY TO UPLOAD (20:01)** — one patch on the live v7.76: `bash toolchain/build.sh v7.75 v7.75_fresh_after_a_save_LIVE/patch_v775.py` → 8,675,862 bytes, SHA-256 `0154be31194e3553d366132a99a68effd166ceee455f7fc5217e60e59a4de9c8`. Codex may fold it into the combined page with v7.77; either way these bytes are what both reviewed. | Claude · Codex to upload | 1 Oct 2026 20:01 |
| **reference** | **Andrew, 16:48: the Street Rate Card 2026 PDF** — `reference_street_rate_card_2026/` (SHA-256 `551f7b3d…`): the page's own card, filed with the kitty each column goes to. It settles the toilet lines: $90.07 is the card's FWF hire for the event (21 days at $4.29) with install $36.44, demob $36.44 and pump-outs $72.87 a visit as their own lines — "you add the hire and the pump-out, it equals what was charged, almost" (16:50). The "quoted low" reading in the 2025 notes was wrong and is withdrawn; **no flags from last year's figures anywhere** ("I don't need you flagging info from last year — it's trying to help you"). The 2025 synthesis README is saved at `reference_2025_contracts_and_invoices/README.md` (invoices reconciled; section 6's rate comparison replaced by the card's logic). | Claude | 1 Oct 2026 17:00 |
| **reference** | **Andrew, 16:08: last year's Advanced fencing purchase orders (screenshot; "I can't get any more data").** `reference_2025_fencing/` — eleven POs, one per programme week, $334,666.32 (build weeks $215,240 · Event Week $95,812 · bump-out $23,586). Beside this year's Costs to job end: fencing forecast $257,212 is $77k (23 %) under last year, and the page already names what is not priced (relocation hours, removal 968 m, hoarding, flat feet, WPF, the demob weeks); last year's bump-out $23,586 is a floor for this year's unpriced demob; last year's Event Week ($95,812) was 2.8× this year's plan for it — a question for Advanced. Reference only; nothing on the page or record changed. **Andrew, about 16:25: "I don't wanna see last year's" — nothing from 2025 goes on the page; it is our own check and the source of the business's line names and wording.** | Claude · Codex to read | 1 Oct 2026 16:12 |
| **v7.69 LIVE** | **Released within v7.69 at 17:02 AEST; the following is the historical handover.** **Andrew, 16:40: "all our cost — what we charge should cover what we get charged"** (reading Questions' "Water services — customer rates still required … no Revenue is assumed"). What we are charged, we charge on: the four water lines on the Event Portables quotes (Water Truck $6,800, Pre fill $2,800, Water delivery $2,250, 3000 L drinking-water tank $350 = $12,200) have no card line, so each is charged to the V8s at the supplier's figure until the branch puts a rate on (a rate typed on Costs stands in; one under cost is flagged). Revenue +$12,200 inside the servicing line; the gap becomes a caveat; the Questions item is answered; the Rehire by branch card says per group whether what we charge covers what we are charged. Rule added to AGENTS.md. **READY TO UPLOAD with v7.68 — one build, two patches on the live v7.67: `bash toolchain/build.sh v7.69 v7.68_waste_tank_is_a_piece_of_work_LIVE/patch_v768.py v7.69_what_we_are_charged_we_charge_on_LIVE/patch_v769.py` → `build/GC500_v7.69` 8,637,181 bytes, SHA-256 `383051df1f6e0058…`.** Corrected after the adversarial review (the tank is $2,100 over 6 weeks, so the water charged on is $13,950; a typed rate under the supplier's figure is not applied; six stale wordings; the fencing cover counts Advanced's crew). Chain clean 19:20: v7.69 18/18 ×2, v7.68 16/16 ×2, v7.63–v7.67 all pass, six synthetic 6/6, sweeps 21 tabs 0 errors ×2. | Claude · Codex to upload | 1 Oct 2026 19:25 |
| **v7.68 LIVE** | **Released within v7.69 at 17:02 AEST; the following is the historical handover.** **Andrew, 15:30: "WC60 has 2 waste tanks, I told you this. This needs to have a level cost and install cost."** A waste tank is a piece of work: where the contract carries sewage holding tank lines for a reference and the schedule gave it no waste-tank line, the asset builder adds the Waste tank line from the contract (WC60: 9968955 lines 94, 95, qty 2) so the tanks' install ($145.74) and levelling ($104.10) can be ticked per tank — $499.68 Labour Install once ticked. On the live record it touches WC60 only (WC05/WC20/WC27 carry the line from the schedule). `v7.68_waste_tank_is_a_piece_of_work_LIVE/` — built on the live v7.67: `build/GC500_v7.68` **8,629,390 bytes**, check_page PASS; **the whole chain is clean (16:35): v7.68 16/16 desktop and phone; v7.63 33/33, v7.64 22/22 ×2, v7.65 22/22, v7.66 18/18 ×2, v7.67 12/12 ×2; Codex's six synthetic checks 6/6; sweeps 21 tabs, 0 errors, 0 console, desktop and phone** — **review done, two findings fixed (the tank pieces come from Andrew's note, not number order; a tank recorded as a unit keeps its piece); READY TO UPLOAD within the v7.69 build (see the v7.69 row). After the upload: the WC60 tank ticks, `record_01Oct2026_wc60_waste_tanks/` (Codex, or Andrew in the drawer).** The ticks are a record write after the upload: `record_01Oct2026_wc60_waste_tanks/` (Codex, or Andrew in the drawer). | Claude | 1 Oct 2026 15:50 |
| **Schedule 3 answers** | `review_01Oct2026_schedule_3/answers_01Oct2026.md` — nine of the thirteen asset cells settled by the paper (Baseplan's Delivery Number column, the pins, the drop photographs), three likely with one look, four for Andrew (P03's plate; P53 cancelled for good?; WC67 total 4 or 6; GN24 1276412 vs line 40's 1276416). Record changes implied once Andrew says: P46 take 1327213 off; P36 take 1327222 off; GN19 put 1261271 on. Flag: the 31 plant-numbered toilet lines ($32,164) read as Coates fleet, not Event Portables — v7.66's KINP rehire counts them. Codex to triple check. | Claude · Codex to check | 1 Oct 2026 15:40 |
| **P&L guide** | **Andrew, 15:00: "both you and Codex review and check, double check and triple check — I need you to understand my business P&L and terminology … a tool we want everyone to understand."** `pl_guide_01Oct2026/README.md`: the July 2026 Industrial Solutions P&L (`IS_PL_Jul_26.xlsx`, SHA `40f61e5b…`) read line by line in plain words; the ratios the business is measured on; every GC500 figure on the v7.67f build mapped to its ledger line; the job's Rehire, Transport and Installation recovery against July's; eight proposals for v7.68 (not built — Andrew to say). Ledger names added beside Andrew's words in `AGENTS.md`. Codex asked to triple check (PR #1, 15:08). | Claude · Codex to check | 1 Oct 2026 15:10 |
| **make live** | **DONE — Andrew, 15:05: "update everything, make live, update to newest."** v7.64–v7.67 LIVE at 15:04 AEST (Codex's upload); Claude's independent check 15:12: the served view page is **8,626,587 bytes, SHA-256 `0368fc08ee159f7c12903b53299ba16dec97b846143708ce187e39783b11a853`**, byte for byte `build/GC500_v7.67f`, with every v7.64–v7.67 function present. WC44 / WC71 / WC67 written by Codex 15:06 (record 3406 → 3451, 45 documents, 0 deletions, `record_01Oct2026_wc44_subhired_installed/completion.json`); Claude read WC71 (8 units) and WC67 (2 units) back off the live record, sub-hired Event Portables, ticked complete by "Andrew Fisher via Codex". Four folders renamed `_LIVE` (Codex's `codex/gc500-v7.67-release`, merged). | Codex · Claude verified | 1 Oct 2026 15:12 |
| **v7.55 + v7.56** | Complete — LIVE within v7.59 at 08:11 AEST. | Codex / Claude | 1 Oct 2026 |
| questions | Decision sheet for Andrew: all 24 open/pending Questions with the record's facts, a recommended default and where the answer lands — `questions_01Oct2026_decision_sheet/README.md`. None can be closed from the record alone; 11 close with one line from Andrew, 6 need iEDM/Advanced/Event Portables, 7 close as figures arrive. Nothing closed on the record. | Claude | 1 Oct 2026 |
| **v7.57** | Page LIVE within v7.59. Server v5.85 blob staged; Railway activation assigned to Claude on PR #1. Local server checks 37/37; no real messages sent. | Codex / Claude | 1 Oct 2026 |
| v7.58 | Complete — explorer LIVE at 08:11 AEST; 218 other machine files preserved. | Codex / Claude | 1 Oct 2026 |
| **v7.64** | **LIVE within v7.67 at 15:04 AEST. Historical handover: READY TO UPLOAD within the v7.67 build (see the v7.67 row).** Was: built and tested — on top of v7.63. Costs correct and complete: every load counted by its docket (WC05's two trucks — 37 loads $22,011.39, direct costs known $235,371.76, +$290), the three relocation dockets costed once through the green book and said so, the undated docket dated to its week's last day on both sides. A **Costs to job end** card under the Forecast P&L: to date · still to come · job forecast · basis per stream, reconciling to the P&L's known to the cent; the fencing programme's remaining weeks carried to job end (cost $180,090 at Advanced's rates, revenue $248,810 at the card — CON WK3 in progress, WK2, WK1, event week, plus $41,111 / $48,262 **behind the programme**: CON WK6, WK5 and WK4 ended with metres still on the plan and no docket, named for Advanced to confirm; relocation hours, removal, hoarding, flat feet, WPF named as not rated; demob weeks not forecast); transport to come $22,364 (the card's cost per reference + the average for unreferenced loads); accommodation's 31 unpriced nights $6,585 at Alfie's own rates; wages on their own line (Job Connect $31,824, Coates 1,626 h no rate). Direct costs to job end $444,411 + wages priced $31,824; revenue to job end $804,885. A "not priced yet, and who" list. `v7.64_costs_correct_and_to_job_end_DRAFT/README.md`. **Corrected after Codex's review (14:00): an ended programme week with metres still on the plan is carried as behind, never dropped; a reference on our typed transport line is never forecast again.** Built within `build/GC500_v7.67d` (four patches on the live v7.63, 8,624,985 bytes); tests 22/22 desktop and phone. | Claude | 1 Oct 2026 |
| review | **Schedule 3 checked against the record (Andrew, 15:05: "ensure we are not missing anything")** — nothing missing: every reference and every row has its event in its week. Thirteen asset-number cells differ, and they point at the record: P44/P58 swapped on one side, P13/P15 a digit apart, 1327213 on both P04 and P46 (Schedule 3 gives P46 1322579), 1282487/1189410/1097343/1327222 each written on two buildings, 1261271 claimed by GN01 and GN19, GN24's new 1276412. WC51's event quantity is 1 against a contract line of 6; WC67 shows 4 on 13 Oct against 2 (and 2 arrived today). Each is a question for Andrew, then a number put on through the page. Schedule 3 vs Schedule 2: three cells. `review_01Oct2026_schedule_3/README.md`. | Claude | 1 Oct 2026 |
| **v7.67** | **LIVE within v7.67 at 15:04 AEST. Historical handover: READY TO UPLOAD with v7.64, v7.65 and v7.66 — one build, four patches on the live v7.63: `bash toolchain/build.sh v7.67 v7.64_costs_correct_and_to_job_end_DRAFT/patch_v764.py v7.65_the_costs_tab_in_one_flow_DRAFT/patch_v765.py v7.66_rehire_by_branch_DRAFT/patch_v766.py v7.67_priced_by_us_DRAFT/patch_v767.py` → 8,626,587 bytes, check_page PASS (Claude's `build/GC500_v7.67f`, 15:00 AEST; v7.66's NVAC rule corrected to lines 31 and 34 on Andrew's word). Codex's review (PR #8, `review_v764_v767/`) answered in full: its six offline synthetic checks pass 6/6 on the corrected patches. On `build/GC500_v7.67e`: v7.64 22/22, v7.66 18/18, v7.67 12/12 desktop and phone each; v7.65 22/22; v7.63 33/33; both sweeps 21 tabs, 0 errors, 0 console. **Andrew, 14:45 AEST: "please update everything and make live" — Codex to upload now and record the live bytes.** Tests on the one build: v7.67 12/12, v7.66 17/17, v7.64 22/22 (desktop and phone each), v7.65 22/22, v7.63 33/33; both sweeps 21 tabs, 0 errors, 0 console.** Priced by us (Andrew, 1 Oct: "can you not answer these questions? Surely you can — you have the answers … a good time for us to shine"). The P&L's "Hire with no contract rate yet … an estimate until the branch puts a rate on the line" now reads **"Hire priced by us from the street rate card 2026"** with the rule (the card line each matches; forklifts, VMS and barriers at the day rate × days to the term date, the rest whole-event; a typed branch rate stands in) and a link to each line and its rate; "Toilet servicing … on no contract line yet" now reads **"priced by us at our pump-out rates"** with the working (780 × FWF pump-outs at $72.87 · 24 × tank pump-outs at $624.60 · 51 × sewer-connect cleans at $260.25 = $85,102; Event Portables charge us $46,545 for the same, inside the Rehire cost); the two lines with no rate name what the contracts hold (the fork extension: MEAD's own SUB-2527 carries Rate 1 $9.30 for the nearest thing on the contracts — type it on the card; the tyne rotator: no rate anywhere). No figure changes. Corrected after Codex's review (14:00–14:35): a sibling is the same description or the one named thing the contracts carry twice with no conflicting stated size, never one shared word; the rate is named with its period and offered as a starting point for the branch to confirm, not a rate to copy. Tests desktop 12/12, phone 12/12; v7.66, v7.65, v7.64 and v7.63 hold on the same build; both sweeps 21 tabs, 0 errors, 0 console. `v7.67_priced_by_us_DRAFT/README.md`. | Claude | 1 Oct 2026 |
| **v7.66** | **LIVE within v7.67 at 15:04 AEST. Historical handover: READY TO UPLOAD within the v7.67 build (see the v7.67 row).** Rehire by branch (Andrew, 1 Oct: "ensure we know what's sub-hired … what branches have sub-hire and the value and forecast … a forecast for the business … Event Portables portaloos sub-hired from KINP; forklifts from NVAC"). A card under Costs to job end: KINP — Event Portables toilets (132 lines, 251 units; Rehire Revenue $154,194 with the servicing; Rehire cost $118,575 approved) and the sub-hired refrigerated container (SUB-2131, ROY002, $1,428, cost not on the record); MEAD — the sub-hired forklift extension (SUB-2527, QUE011, $9); NVAC — the sub-hired forklifts, lines 31 and 34 on MISCITEM (Andrew, 1 Oct 14:50, with the Baseplan export: "it's cleared, we have spoken about this"; $12,248; supplier and cost not on the record; the six Coates-numbered forklifts are Coates's own hire); STPS — Advanced Temporary Fencing ($120,913 → $369,723 revenue; $77,122 → $257,212 cost, the behind-the-programme metres included). **The business: Rehire Revenue $288,792 on the record → $537,602 to job end (67 % of the job's revenue); Rehire cost $193,596 → $373,687, a floor until three suppliers' costs are on the record.** Corrected after Codex's review (14:00–14:35): every contract line lands in exactly one group by construction (tested); the fencing Rehire cost is Advanced's gear ($75,022) with Installation — external contractors ($2,100) shown beside it, never inside it (gear + installation = the P&L's fencing category, tested); the fencing note reads the split's real keys. A second table lists the contract lines with no Coates plant number not counted as rehire, for Andrew to say if any is. Every figure the P&L's or the Costs to job end card's, tested to the cent; AGENTS.md words throughout. Tests desktop 17/17, phone 17/17 within `build/GC500_v7.67d`. `v7.66_rehire_by_branch_DRAFT/README.md`. | Claude | 1 Oct 2026 |
| **v7.65** | **LIVE within v7.67 at 15:04 AEST. Historical handover: READY TO UPLOAD within the v7.67 build (see the v7.67 row).** Was: built and tested — on top of v7.64; one build, six patches, on the live v7.59: `build/GC500_v7.65` 8,601,283 bytes, check_page PASS.** The Costs tab in one flow: **At a glance** (four tiles, each the record today and the same figure to job end — revenue $556,076 → $804,885; direct costs $235,372 → $444,411 + wages priced $31,824; difference $320,704 so far → $328,650 to job end, never called a margin, 8 items not priced; September for Finance $176,968 revenue earned not billed · $70,331 of costs to accrue; every tile read from the cards' own functions and tested against them) → Forecast P&L by branch → Costs to job end → **Month-end — for Finance** (accruals, then the journals and controls) → **The working**, folded (the eight categories with our transport lines and the people; revenue by branch with the 2026 card; the charge lines with their filters). The v5.83 "Are we making money?" ledger is off the tab; nothing else shown twice. Folds remember through a re-render; a filter opens the charge lines; print opens every fold. Visible text on opening 33,416 characters against 61,686 opened. No figure changes. Tests desktop 22/22, phone 22/22; v7.64 (20/20) and v7.63 (33/33) hold on the same build; both sweeps 21 tabs, 0 errors, 0 console. `v7.65_the_costs_tab_in_one_flow_DRAFT/README.md`. Not for upload until the four-patch release is live and Codex has reviewed v7.64 and v7.65; then one build, six patches. | Claude | 1 Oct 2026 |
| **v7.63** | **LIVE 13:57 AEST 1 Oct 2026 (uploaded by Codex, verified by Claude: 8,572,884 bytes, SHA e723a1fb…).** Was: READY TO UPLOAD — one build of four patches v7.60 → v7.61 → v7.62 → v7.63 on the live v7.59 (`build/GC500_v7.63`, 8,572,884 bytes, check_page PASS).** Accruals for Finance in Andrew's words on top of Codex's v7.62 model (kept: status planned/review, unknowns kept, Brisbane-day stamps, the undated lists, the people/days/hours table, event people split from accommodation and travel). Fixes the two v7.62 regressions: supplier invoices recorded ($0.00 in every month — `o.invoice_date` is not a field; now the PO's programme week → September $42,662) and the labour ticks (all 165 pushed to "needing month allocation"; now dated by the day the reference went in). Restores "to accrue" as a proposal (fencing: $73,397 at Advanced's sheet less $42,662 = $30,735), the badges Accrue / Finance's call / Check the invoice / Payroll / Planned, the WIP question as a question, caveats once; a current-month row splits "to date" from "still planned" by Codex's forecast figure. September: revenue earned not billed $176,968 · to accrue $67,856 (+ $21,950 Finance's call) · invoices recorded $42,662; every month + the $938 undated = the P&L's revenue to the cent. `v7.63_accruals_in_andrews_words_DRAFT/README.md` says which v7.61 and v7.62 test expectations it supersedes and why. | Claude | 1 Oct 2026 |
| **v7.61** | **READY TO UPLOAD within the four-patch build at the top; never alone. (Earlier:** NOT TO UPLOAD ALONE — Codex's integration review (PR #1, 1 Oct 11:08 AEST) found three defects: future/unconfirmed rows carry completed-work words ("incurred", "earned"); a PO typed after 14:00 UTC can fall into the wrong Brisbane month (`acc761PoMonth` falls back to the UTC stamp); the labour forecast drops unpriced slots to $0 with no count. Codex is writing the correction as v7.62 on `codex/gc500-v7.62-finance-review`; Claude is not touching `acc761Model`/`acc761Labour` meanwhile. The release becomes one build v7.60 → v7.61 → v7.62 once v7.62 is read and tested here, and Andrew says yes. v7.60's layout passed Codex's checks.** Was: FROZEN at commit 43ff67d for Codex's integration review (PR #1, 1 Oct 11:05 AEST: Codex reviewing v7.60 + v7.61 together against the live base) — awaiting Andrew's yes to mark READY TO UPLOAD. One build when he says so: `toolchain/build.sh v7.61 v7.60_costs_in_andrews_structure_DRAFT/patch_v760.py v7.61_accruals_for_finance_DRAFT/patch_v761.py` → 8,527,820 bytes.** Codex (PR #1, 1 Oct): noted, no collision; it proposes nothing to a ledger and creates no journal structure of its own, as Codex asked.** Accruals for Finance under Month-end control on Costs (Andrew, 1 Oct: "Finance will want accrual info from me. No branches have billed for October, but we have paid for fencing. We need this clean info in the Costs section"; "I need to know what the forecast labour is"). Per work month: revenue earned, not yet billed (every Baseplan line priced the P&L's way and put in its month; fencing dockets; labour ticked; the event's month carries the toilets, servicing and scope — every month added = the P&L's Revenue to the cent); costs incurred — invoice in or to come (Advanced's dockets less the PO invoices; Event Portables day-share as Finance's call; loads' TPORT COST; Job Connect hours; tracker expenses; Coates wages for information); the WIP question; the labour forecast both sides; Copy for Finance, CSV, glossary. Baseplan billing columns: 0 of 307 lines billed. September: revenue not billed $177,968 · to accrue $67,815 (+ $21,950 Finance's call) · invoices in hand $42,662. Build `build/GC500_v7.61` 8,518,751 bytes on the live v7.59 (with v7.60 first: 8,527,820). `v7.61_accruals_for_finance_DRAFT/README.md`. Andrew's Baseplan export of 1 Oct kept in its `sources/` — one new line (9961976 line 41) against the record's 24 Sep export. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
| **v7.60** | **READY TO UPLOAD within the four-patch build at the top.** Was: FROZEN at 43ff67d for Codex's integration review with v7.61 — awaiting Andrew's yes. Codex's check is done (PR #1, 1 Oct 11:04 AEST): no overlapping Costs or finance745 work; the month-end model reads only the tracker's labour lines, not the per-piece ticks, so the Labour Install / Cleaning split touches nothing of its; any journal must reuse the finance745 journal payload (v7.60 and v7.61 create none).** Costs in Andrew's structure (Andrew, 1 Oct: "hard focus on costs … toilets: we are sub-hiring these, why is this not under KINP? Cleaning is classed different, not labour. Labour Installs, Steps, Levelling, Labour Demob fall under the Labour Install code"). The toilets' servicing $85,102 and the Event Portables rehire cost $118,575 sit against KINP (P&L By branch table, lower By branch card, stream line, cost note); the labour ticked per piece is split — Labour — Install (install, steps, levelling, demob; 165 ticks $17,083 today), Cleaning on its own, fire extinguishers a hire charge; the By branch table carries every stream and a grey Rehire cost column, and reconciles: All branches $500,113 + scope $55,817 = Total revenue $555,930. No total moves. Rebuilt 1 Oct 08:40 on the live v7.59 with only `patch_v760.py`: `build/GC500_v7.60` **8,498,174 bytes**; tests (desktop and phone, reconciles) and both sweeps (21 tabs, 0 errors) re-run on that build. Codex (PR #1): no overlapping work, continue. Author: Andrew Fisher. | Claude | 1 Oct 2026 |
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

- **The P&L (1 Oct, from `pl_guide_01Oct2026/README.md` §5):** (1) which P&L does GC500 report into — Industrial Solutions',
  or the Brisbane branches' (KINP, NVAC, MEAD, STPS)? (2) Transport: are the delivery and pickup charges to the V8s still
  to go on the contracts, or is transport inside the event rates? The contracts carry $6,938 against $22,011 already paid
  to carriers (Transport Recovery 0.32 against the business's 1.06). (3) Wages: the crew's install hours charged to the
  job (2143) or branch staff cost (3210)? (4) The fencing card rate's split between hire and installation — for Advanced.
  Then the eight v7.68 proposals in §4 (wording and grouping only) — yes or no.

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
