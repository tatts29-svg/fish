# GC500 release, 8 Oct 2026: one page build (v8.84 to v8.89) and one Map explorer set (v8.87 + v8.90)

Author: Andrew Fisher. Andrew approved it at 00:20 AEST on 8 Oct: "Approved and get everything done". Everything here is built
and tested. Nothing is published yet, because publishing needs the edit key.

## What Andrew gets

| Release | What changes | Source |
|---|---|---|
| v8.84 | Today uses the full width of a wide screen: banner in a dark band, three cards across, titles on one line | [`v8.84_today_wide_layout_DRAFT/`](../v8.84_today_wide_layout_DRAFT/README.md) |
| v8.85 | **Where we are**: the whole job as one figure, with five large race lights above the group cards | [`v8.85_where_we_are_DRAFT/`](../v8.85_where_we_are_DRAFT/README.md) |
| v8.86 | Event Portables load days (plan v10) become the planned delivery days. A day recorded on the record still wins | [`v8.86_event_portables_days_DRAFT/`](../v8.86_event_portables_days_DRAFT/README.md) |
| v8.87 | Map explorer: fast and smooth; tapping a unit shows its Timeline stage, who and when, and what's left; Fencing closes like any panel (× / Escape / map tap) | [`v8.87_map_explorer_DRAFT/`](../v8.87_map_explorer_DRAFT/README.md) |
| v8.88 | Costs: one transport model, so the P&L, Costs to job end and the Finance handover agree (17 tie-outs, all tied). New Transport view down to the branch | [`v8.88_costs_transport_DRAFT/`](../v8.88_costs_transport_DRAFT/README.md) |
| v8.89 | The master is D001-26003-03 issued 2 Oct: the page's sheet picture, register entry and the 11 pins it moves | [`v8.89_master_map_DRAFT/`](../v8.89_master_map_DRAFT/README.md) |
| v8.90 | The Map explorer draws the 2 Oct master too, lined up in the same frame | [`v8.90_explorer_master_DRAFT/`](../v8.90_explorer_master_DRAFT/README.md) |

## The page: one build

```
toolchain/build.sh v8.89 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
  v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py \
  v8.88_costs_transport_DRAFT/patch_v888.py v8.89_master_map_DRAFT/patch_v889.py
```

- **Base:** live v8.83 `88a3584e919d8acd32ac3905099c1d606ec2fe5c1da2793363e8ff870f212457` (11,138,554 bytes).
- **Candidate:** `fe52302cda02d73c4f63ca73943360d66e740b074527b2685e2384ea5d00802c`, 11,256,999 bytes. The build label does not change the bytes. `check_page` PASS.
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
