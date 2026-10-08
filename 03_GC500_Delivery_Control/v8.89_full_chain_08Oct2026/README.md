# GC500 release, 8 Oct 2026: one page build (v8.84 to v8.89) and one Map explorer set (v8.87 + v8.90)

Author: Andrew Fisher. Andrew approved it at 00:20 AEST on 8 Oct: "Approved and get everything done". Everything here is built
and tested. Nothing is published yet, because publishing needs the edit key.

## Handover 1 — the combined candidate, 8 Oct 2026 (READY for Codex's review and publication)

Everything below this section is the v8.84–v8.89 chain as built and checked on the morning of 8 Oct; it still stands. This
section is the frozen handover of the **combined candidate**: that chain plus v8.93 (every map aligned on the 2 Oct master),
v8.94 (the Lighting basis), v8.91 (truck flow), v8.92 (the A+ pass) and v8.95 (the 7 Oct Baseplan export), with Codex's
review corrections adopted unchanged. Codex owns v8.96 (Today scene) and v8.97 (map completion) and builds them on top.

| Release | What it changes | Source |
|---|---|---|
| v8.93 | Every map on the 2 Oct master, aligned the same way everywhere: the page picture and the 260 pin pictures, the three inset pins (CP1, T0265, WC81) back where the paper has them, the explorer's scene clip and plan items, the 3D proof's units. No navigation pin moves. The machine set `96dee047…` | [`v8.93_maps_aligned_DRAFT/`](../v8.93_maps_aligned_DRAFT/README.md) |
| v8.94 | Lighting counts against D024's six keyed towers (Andrew: "What ever the map says. If its 6 its 6"), each location credited by verified completion up to the number the map keys there, the surplus named as a quantity on record; the 13 circuit fans are big screens (Andrew); the whole-job figure on the v8.82 projection basis | [`v8.94_lighting_basis_DRAFT/`](../v8.94_lighting_basis_DRAFT/README.md) |
| v8.91 | Truck flow: daily runs that get trucks in early, in order, never over-crowding an area; windows kept per stable load ID and unknown people kept unknown (Codex's correction) | [`v8.91_truck_flow_DRAFT/`](../v8.91_truck_flow_DRAFT/README.md) |
| v8.92 | The A+ pass: how the page behaves and reads — smooth, fast, easy to get around, the right words; no record, money figure, pin or direction changes; the redraw and scroll corrections (Codex) | [`v8.92_a_plus_pass_DRAFT/`](../v8.92_a_plus_pass_DRAFT/README.md) |
| v8.95 | The contract source refreshed to the 7 Oct Baseplan export through v8.71's pipeline; Andrew's record wins (9968862/50 to P37, /79 to P52); his two corrections (P52 1327211, WC07 1317643). **It moves money, on NVAC only:** the two Concert generators the export adds with no rate are charged from the card's 200 kVA line as an estimate — revenue on the record up 0.37%, to job end up 0.22%, NVAC hire revenue up 4.79%, NVAC invoice up 4.71% on the record and 4.24% to job end; every cost figure, Transport and the 17 tie-outs the same; the two joins and the corrections have no money effect (its README, "What that does to the money") | [`v8.95_baseplan_07oct_DRAFT/`](../v8.95_baseplan_07oct_DRAFT/README.md) |

**Build** (the base is live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457`, 11,138,554 bytes):

```
V895_BASEPLAN=<Baseplan_SuperCars_07Oct.xlsx> v8.89_full_chain_08Oct2026/tools/build_final.sh <label>
```

builds the chain in the order **884 → 885 → 886 → 887 → 888 → 889 → 893 → 894 → 891 → 892 → 895** (each patch's footer guard
accepts the release before it; v8.95 is last). The 7 Oct export is private, bound by SHA-256 `8a18bd1f…` in the patch. Drop the
last patch from the list and the same script builds the page without v8.95.

| Page | SHA-256 | Bytes | Footer |
|---|---|---|---|
| **A — without v8.95** (884–894 + 891 + 892) | `224bf93bdf781bb5fda888c313b314cd91de5f0ac8e269996b266d7f2dbce589` | 11,368,255 | ` · v8.92` |
| **B — with v8.95** | `5e786047b535c4d61ad35b8e4ad5de9344f323d2bfb2331b445c460b0e8b74a5` | 11,373,665 | ` · v8.95` |

- **B − A is exactly v8.95's contract data** (`identity895`, 139 PASS: DATA identical except `rental_on_hire` — the export's 25
  changed and 2 added lines, the 2 record joins and what v8.71 derives from them — and the five register corrections). Both pages
  carry the same media manifest. Which page goes live is **Andrew's call** (below); Codex is integrating v8.96/v8.97 on page A
  ([PR 6049184259](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6049184259)).
- **Data accounting through the chain:** chain + v8.93 = `64898a6be4178abf…` (`identity893` PASS against the v8.89 chain
  `fe52302c…`: only the D001 picture, the media list (+259/−259), 3 inset pins and 130 pins' pictures change; every navigation pin
  as v8.89); the chain without v8.92 = `b4186bb624c8dcd4…` (`identity892` PASS: DATA, MASTER_LOC and EP886 identical to B).
- **Media manifest** `cd70f758d382effa467316fdb21af18174331f687bcb51c467b17e2ea20ef0e7`, 1,958 assets (`media_manifest_v893.json`
  in the build folder, the digest as the service computes it; the same for A and B). The 259 new pictures are
  `v8.93_maps_aligned_DRAFT/media893.zip.enc` (zip SHA-256 `36d11c8c…`).
- **Machine set candidate** `96dee047a785117e0f96aa1365a391d38a72904c42c67dcd76e6bc7ca40325da`, 233 files: the code in
  `v8.93_maps_aligned_DRAFT/machine_code_v887_v890_v893/`, the assets from `archive/assets893.tar.enc.part00/01` (tar
  `7a1825dd…`) with `assets_small/` laid over them, published by `tools/publish_machine893.py --expect-candidate 96dee047…`, which
  fails closed. Codex reproduced the digest independently. The live set must still be `b469a99c…`.

**Codex's review corrections, adopted unchanged** (`460e886`, `697746c`): v8.94 verified completion with reconciled drilldowns
and the wording to match (verified complete / credited, the on-site quantity kept separate); v8.91 windows by stable load ID and
unknown people kept; v8.92 redraw and scroll fixes; v8.93 portable alignment test and the fail-closed publisher; money892 pins
both reads to one record version or reports inconclusive.

**Checks on page B** (`tools/run_h1.sh h1final evidence_h1final`, 8 Oct 2026 10:00–10:45 AEST; one browser at a time, every
write aborted, the live record read fresh at every open — version 4414 at the run):

| Check | Laptop | Phone | Other |
|---|---|---|---|
| Identity: chain + v8.93 against the v8.89 chain (`identity893`) | PASS | — | only the D001 picture, the media list, 3 inset pins and 130 pins' pictures change; every navigation pin as v8.89 |
| Identity: the chain without v8.92 against B (`identity892`) | PASS | — | DATA, MASTER_LOC and EP886 identical |
| Identity: A against B (`identity895`) | 139 PASS | — | the suite's first run reported 3 findings, all in the test (WC07's line 38 join, the counts after it, the attribution the v5.97 scrub lifts); the test was brought to the rules and re-run on the same bytes |
| v8.94 Lighting (`lighting894`) | 35/35 | 35/35 | 4 of 6 today: T0002's 5 at Molendinar credit 4, 1 surplus; LT05, LT06 not on site |
| v8.91 truck flow (`flow891`) | 43/43 | 41/41 | Andrew's 14 Sep Crew orders respected |
| v8.92 the A+ pass (`aplus892`) | 21/21 | 22/22 | |
| v8.92 money against the chain without v8.92 (`money892`) | 6/6 | 6/6 | both reads on record 4414 |
| v8.95 contracts (`contracts895`) | 26/26 | 26/26 | |
| v8.93 alignment (`align893`) | 21/21 | 20/21 on the suite's run, **21/21** re-run with the corrected bound | the one failing check was the test's fixed 1e-4 picture fraction against the page's `toFixed(1)` CSS px (Codex found the same, [6049323871](https://github.com/tatts29-svg/fish/pull/1#issuecomment-6049323871)); the bound is now the page's own 0.05 px rounding, and both widths pass on the same bytes |
| v8.86 Event Portables (`ep886`) | 31/31 | 31/31 | WC57 and WC67 on the Tue 13 Oct Andrew recorded |
| v8.88 Transport view (`transport888`) | 29/29 | 29/29 | 29/29 at 2560 px |
| v8.65 Costs (`costs865`) | 33/33 | 33/33 | |
| Map explorer card on the v8.93 code and assets (`explorer887`) | 23/23 | 24/24 | |
| v8.90's explorer test on the v8.93 code and assets (`explorer890_v893`) | 17/17 | 17/17 | the 2 Oct scene, the pyramid by byte range, P45 / WC10 / WC51 / WC38 / WC39 at their 2 Oct places, the fencing layer, deep zoom |
| v8.89 master read against v8.93 (`master889_v893`) | 17/17 | 17/17 | |
| v8.85 Where we are (`where885`) | 24/24 at 1600 and 1440 | 24/24 | 24/24 at 2560 |
| v8.84 wide layout (`wide884`) | 21/21 at 1600 and 1440 | 21/21 | 21/21 at 2560 |
| Layout 876 · VMS 874 · Equipment 873 | 18 · 18 · 40 | 18 · 18 · 40 | |
| Crew 883 · Finance 866 | 34/34 · 24/24 | 34/34 · 24/24 | |
| Loading 872 · Unloading 881 · Paired 881 | 26 · 34 · 18 | 26 · 34 · 18 | |
| v8.71 · Supplier 870 · KINP 869 | 11/12 · 17/17 · 17/17 | — | v871's first check asks for the 6 Oct export, which v8.95 supersedes on page B; on page A it is 12/12 |
| 15-tab sweep | 15 shown, 0 errors, 0 blocked | 15 shown, 0 errors, 0 blocked | |
| Handling 875 · Paired 879 (out of date) | 22/28 · 17/18 | 22/28 · 17/18 | the same lines fail on live v8.83 (`handling875_live.log`, `paired879_live.log`) |
| **v8.95's money effect, A against B** (`compare_money895`) | measured: 4,062 figures the same, **58 differ**, all revenue-side (below) | — | every money model read from both pages on record 4414; the business's lines, the Transport view, the labour plan and all **17 tie-outs (17/17 on both)** identical; 0 errors, 0 writes |
| **Page A** (sweeps, costs865, finance866, transport888, v871) | 15 tabs 0 errors 0 blocked · 33/33 · 24/24 · 29/29 · 12/12 | 15 tabs, 0 errors, 0 blocked | `evidence_h1final_pageA/` |

**What v8.95 does to the money, measured on these bytes** (`compare_money895_laptop.log`; direction and percentage only — it agrees with
the v8.95 README's table): P&L summary — contracts charge up 0.88%, NVAC's branch charge up 4.79% (34 → 36 lines), total up 0.37%,
break-even up 0.70%, and the one stream carrying the two generator lines up 18.73% (24 → 26 lines); Costs to job end — revenue on the
record up 0.37%, to job end up 0.22%; Finance handover — NVAC's invoice up 4.71% on the record and 4.24% to job end, the totals up
0.37% / 0.22%; P&L — Hire Revenue to job end up 1.45%, gross margin to job end up 0.40%; Rehire by branch — its share down 0.22–0.37%
because the whole is larger. Every cost figure is the same. The 8 structural differences are the contract-line keys that v8.95 joins
to four references' transport rows (WC07's 20 lines among them) — joins, not charges. The two Concert generators (1316182, 1316183),
which the export adds with no rate, are charged from the card's 200 kVA line as an estimate; their GN number and rate from Andrew
would replace that estimate.

**The record at the run.** Andrew recorded Tue 13 Oct on WC57 and WC67 at about 05:23 AEST, so the Event Portables test reads
them there — the release's own rule (a day recorded on the record wins over the plan, for the whole reference). On WC67 that
moves the two FWF on site since 1 Oct to 13 Oct as well (noted for Andrew, below). The two legacy suites that read out-of-date
expectations (handling875 22/28, paired879 17/18) fail on the same lines on live v8.83 itself (`*_live.log`): the tests' age, not
this release.

**Publish order (Codex; each step needs the edit key):** 1. the v8.93 media (decrypt `media893.zip.enc`, `upload_media893.py`
dry-run then real, until the manifest `cd70f758…` is registered); 2. the page — A or B as Andrew decides — with
`toolchain/upload_page.py` (it refuses if live moved since the build; if it has, rebuild on live with the same script);
3. the machine set with `publish_machine893.py --expect-candidate 96dee047…` (dry-run then real); 4. read back the public bytes
against the hash, `/api/machine` against `96dee047…`, and record LIVE on `STATUS.md`.

**For Andrew to settle (the page holds these; it guesses none):**
1. **v8.95 in this release, or held?** It carries your two settled corrections (P52 1327211, WC07 1317643) and the 7 Oct export.
   It does move money, on NVAC only: the two Concert generators the export adds with no rate are charged from the card's 200 kVA
   line as an estimate (revenue on the record up 0.37%, to job end up 0.22%; NVAC invoice up 4.71% on the record). Costs, Transport
   and the 17 tie-outs are unchanged; the joins and the corrections have no money effect. The generators' GN number and rate (item 3)
   would replace that estimate. Codex is building without it for now, keeping the live contract source.
2. **WC67:** your recorded 13 Oct also moves the first two FWF (on site since 1 Oct) to 13 Oct on the Timeline. If only the second
   drop was meant, clear the date on WC67.
3. **The two NVAC Concert 200 kVA generators** (1316182, 1316183): GN number, rate, both going in?
4. A small gap for a later release, not this one: the "moved off this day" fold on Mon 12 Oct still names the plan's Fri 9 Oct for
   WC57 while the record has it on 13 Oct (everything else reads 13 Oct).

**Source:** the READY commit on `claude/ampol-reporting-suite-access-h2hy90` named in the READY comment on PR #1 (8 Oct 2026, ~11:00
AEST); it carries this README. Evidence: `evidence_h1final/` and `evidence_h1final_pageA/` (one log per run; dollar figures redacted).

## What Andrew gets

| Release | What changes | Source |
|---|---|---|
| v8.84 | Today uses the full width of a wide screen: banner in a dark band, three cards across, titles on one line | [`v8.84_today_wide_layout_DRAFT/`](../v8.84_today_wide_layout_DRAFT/README.md) |
| v8.85 | **Where we are**: the whole job as one figure, with five large race lights above the group cards | [`v8.85_where_we_are_DRAFT/`](../v8.85_where_we_are_DRAFT/README.md) |
| v8.86 | Event Portables load days (plan v10) become the planned delivery days. A day recorded on the record still wins | [`v8.86_event_portables_days_DRAFT/`](../v8.86_event_portables_days_DRAFT/README.md) |
| v8.87 | Map explorer: fast and smooth; tapping a unit shows its Timeline stage, who and when, and what's left; Fencing closes like any panel (× / Escape / map tap) | [`v8.87_map_explorer_DRAFT/`](../v8.87_map_explorer_DRAFT/README.md) |
| v8.88 | Costs: one transport model, so the P&L, Costs to job end and the Finance handover agree (17 tie-outs, all tied). New Transport view down to the branch | [`v8.88_costs_transport_DRAFT/`](../v8.88_costs_transport_DRAFT/README.md) |
| v8.89 | The master is D001-26003-03 issued 2 Oct, the new truth for locations (Andrew): the page's sheet picture, register entry and the 11 pins it moves, including navigation | [`v8.89_master_map_DRAFT/`](../v8.89_master_map_DRAFT/README.md) |
| v8.90 | The Map explorer draws the 2 Oct master too, lined up in the same frame | [`v8.90_explorer_master_DRAFT/`](../v8.90_explorer_master_DRAFT/README.md) |

## The page: one build

```
toolchain/build.sh v8.89 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py \
  v8.88_costs_transport_DRAFT/patch_v888.py v8.89_master_map_DRAFT/patch_v889.py
```

- **Base:** live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457` (11,138,554 bytes).
- **Candidate:** `fe52302cda02d73c4f63ca73943360d66e740b074527b2685e2384ea5d00802c`, 11,256,999 bytes. The build label does not change the bytes. `check_page` PASS.
- **History:** at about 04:00 Andrew wrote "All navigation pin points are correct", and for an hour the four moved pins were held at their 17 Sep places (`adc967ab…`, withdrawn). At about 04:30 he confirmed: "The master I gave you is the new truth." The pins follow the 2 Oct master, and the build is byte-identical to the original `fe52302c…` again.
- **Media manifest:** `1aa4a3b1ac15fab6f2f7dfb77c8358cf1353451e958cb47b794035b9224551de`, 1,958 files. It is the same manifest as v8.89 alone, because v8.86–v8.88 change no media.
- **If live moves first,** rebuild on it. Drop the patches already live. Each footer step accepts the release before it.

## Publish order (each step needs the edit key)

1. **Media for the new master (v8.89).**
   - Decrypt `v8.89_master_map_DRAFT/media889.zip.enc` (papers password) into a folder.
   - Run `python3 v8.89_master_map_DRAFT/upload_media889.py <folder> build/GC500_v8.89/media_manifest_v889.json --dry-run`, then the same without `--dry-run`.

   The service refuses the page until this manifest is registered.
2. **The page:** `python3 toolchain/upload_page.py build/GC500_v8.89/GC500_Delivery_Control_hosted.html --dry-run`, then without
   `--dry-run`. It refuses if live changed since the build.
3. **The Map explorer set (v8.87 + v8.90 in one registration).** Follow `v8.90_explorer_master_DRAFT/README.md` → Publish:
   - apply the v8.90 patch on the v8.87 prepared files;
   - decrypt the v8.90 asset archive (papers password);
   - run `tools/publish_machine890.py --dry-run`, then the real run.

   The patch output must equal `machine_code_v887_v890/` here, file for file (`machine_code_v887_v890.sha256`). Use `--code` on that folder and `--assets` on the decrypted archive plus `v8.90_explorer_master_DRAFT/assets_small/`.

   The live set must still be `b469a99c`. Each part also works on its own, so the page and the set can go in either order once the media is in.
4. **Read back:**
   - the public page's SHA-256 equals the candidate's;
   - `/api/machine` shows the new digest;
   - run `test_master889.cjs` and `test_explorer887.cjs` / `test_explorer890.cjs` against live (`LOCAL` unset);
   - record LIVE on `STATUS.md`.

## Checks on the full chain (one browser at a time, every write aborted)

Run on 8 Oct 2026, 03:05–04:00 AEST, on candidate `fe52302c…`. Logs are in `evidence/`.

**Data accounting for the whole chain:**
- Live → v8.84–v8.88: only v8.86's 20 Event Portables rows and their spans change (`data886` PASS). v8.87 and v8.88 change no DATA.
- v8.88 chain → full chain: only v8.89's master changes, meaning the picture, the register entry, +11/−9 media and the 11 pins (`identity889` PASS).

| Check | Laptop | Phone | Other |
|---|---|---|---|
| v8.86 Event Portables days (`ep886`) | 31/31 | 31/31 | |
| v8.87 Map explorer (`explorer887`, v8.87 final files) | 23/23 | 24/24 | |
| v8.88 Transport view (`transport888`) | 29/29 | 29/29 | 29/29 at 2560 px |
| v8.65 Costs (`costs865`) | 33/33 | 33/33 | |
| v8.89 master (`master889`, new pictures served locally) | 16/16 | 16/16 | |
| v8.85 Where we are (`where885`) | 24/24 at 1600 and 1440 | 24/24 | 24/24 at 2560 |
| v8.84 wide layout (`wide884`) | 21/21 at 1600 and 1440 | 21/21 | 21/21 at 2560 |
| Layout 876 · VMS 874 · Equipment 873 | 18 · 18 · 40 | 18 · 18 · 40 | |
| Crew 883 · Finance 866 | 34/34 · 24/24 | 34/34 · 24/24 | |
| Loading 872 · Unloading 881 · Paired 881 | 26 · 34 · 18 | 26 · 34 · 18 | |
| v8.71 · Supplier 870 · KINP 869 | 12 · 17 · 17 | | |
| 15-tab sweep | 0 errors, 0 blocked | 0 errors, 0 blocked | |
| Handling 875 · Paired 879 (out of date) | 22/28 · 17/18 | 22/28 · 17/18 | identical on live v8.83 |

**The final Map explorer pair:** v8.87's final files with the v8.90 patch on top, in `machine_code_v887_v890/` with SHA-256s, plus the v8.90 drawing assets (`explorer890_final_*`). Results:

**17/17 on laptop and 17/17 on phone.** The pair was tested with the full-chain page:
- the 2 Oct scene: 301,253 records, attribution "issued 2 Oct";
- 26 pyramid levels fetched by byte range, with tiles in every mode;
- P45, WC10, WC51, WC38 and WC39 found at their 2 Oct places; WC69 and WC40 one label each; WC32 has no place on the drawing;
- the fencing layer accepts the frame and draws a 17 Sep run at its place, with no "Master drawing changed" alert;
- deep zoom draws from the new scene;
- no page errors, and no writes.

## Re-checks on the corrected page `adc967ab…` (navigation pins as live), 8 Oct 2026 ~04:00–04:20 AEST

Logs are in `evidence_rev_nav/`.

- **Identity checks:** `test_identity889` PASS, both v8.85 → v8.89 and v8.88 chain → full chain. This includes the new check that no existing navigation pin (`ll`) moves.
- **Master map** (`master889`, with "P45 navigation pin unchanged"): 16/16 on laptop and phone.
- **Explorer card** (`explorer887`): 23/23 on laptop and 24/24 on phone.
- **Sweeps:** 15 tabs, 0 errors, 0 attempted writes, on laptop and phone.
- **Other suites:** loading872 26/26 · unloading881 34/34 · paired881 18/18 · v871 12/12 · ep886 31/31.

Every check from the full run above that this change cannot affect stands as recorded: DATA outside MASTER_LOC is identical, and no code changed.

## Review points from Codex (PR 6043702034) and where they stand

- **The lighting basis behind the whole-job figure.**
  - v8.85 takes the Lighting reading unchanged from `todayWorkSummary848`. That is the same reading the live Today group card already shows: confirmed completion over the register's lighting towers. v8.85 makes no new lighting claim.
  - The pending lighting scope audit (v8.82; it needs the "Schedule (5)" workbook, which Andrew has been asked to resend) could change that group's total.
  - Until it does, no one claims the whole-job figure is independently verified. v8.92 labels the Lighting basis on the card and treats it as a lower bound, so the whole figure reads as a minimum.
- **Transport forecast and allocation gaps:** they stay explicit on the page (v8.88 "Decisions for Andrew"). Nothing is guessed.
- **Phone Transport heading:** v8.92 folds the explanation under a disclosure so the figures lead.
- **`xembed890.cjs` portability:** the harness import is now relative (`4e7e111`). It is a test-only change; candidate bytes are unchanged.

## Decisions for Andrew (the page holds all of these and guesses none)

1. **WC32** is already cancelled on the record and is not on the 2 Oct master. The page keeps its old pin, marked as from the 17 Sep issue. Say if you want the pin gone.
2. **The western edge of the 2 Oct sheet** shows 9 mm less of the Main Beach end, and labels G7, G8, OP11, MAIN BEACH TOWER and others sat in that strip. No page pin is affected. Ask iEDM to reissue, or accept?
3. **Event Portables:**
   - Brad Jones Racing and Shell V-Power (Load 4) have no WC number, so the page cannot carry their day.
   - A plan v11 would take T0089 off Load 1 on the supplier card.
4. **Transport:**
   - Do the 51 demob pickup legs (29 references) join the forecast?
   - Which branch carries the 11 fencing semis?
   - Six November rows have no reference.
   - Should "Kev" read as a Coates truck?
5. **WC09, today:** both 6 m blocks share one door side (passenger). For separate sides, record the two asset numbers on WC09.
6. **Lighting audit:** it needs the "Schedule (5)" workbook (sha256 `6383ebdd…`) again. It is not in this session.
