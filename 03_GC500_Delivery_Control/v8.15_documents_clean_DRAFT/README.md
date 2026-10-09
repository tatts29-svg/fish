# v8.15 — Documents, clean and tidy: READY TO UPLOAD (not live)

Author: Andrew Fisher · 3 Oct 2026 AEST

**What Andrew asked for.** In his chat with Claude, 3 Oct 2026, about the Documents tab: "lets clean up the document area and
increase the look in here and clean it up. make it look clean and tidy". On the first freehand mock-up: "your mock ups
look different to the style we using in all other pages . looks like a kids made it" … "the current super race car look
... icons. and gauges and the red light look. to even as far as the cards." Upload authority sits with Codex under
Andrew's "Work with codex and get everything live".

## The candidate

| | |
|---|---|
| Base (live v8.14, Today trimmed) | `6365fd0965e1ae1fcf75fdd6aad076b2662697443addfae49a3d6016a39f9fce`, 9,074,112 bytes |
| Built page | **`35ab136643f9b7b0fb5b4e237c501c58cb27bc31e4faaded75df013dad0f7770`, 9,118,422 bytes**: the same bytes Codex built and verified |
| Build | `bash toolchain/build.sh v8.15 v8.15_documents_clean_DRAFT/patch_v815.py` (from 03_GC500_Delivery_Control) |
| `docs815_src.js` | `da33522f35097ce2987e26ede691cd9d99b6e606e6522af8a0e02bb9e07cf134` |
| `v815.css` | `81c2bf72a6438adf8aaa8c6dd4072629671f01b8be4b1d4a8f34952798cd4e21` |
| `patch_v815.py` | `2d0a8457f22049123ecf437c6ef05fcf9bdd781e98c8e3508783e1744ea2c161` |
| `evidence/v815_tests.js` | `066949c7f0995b3de4274615e1390a1568bbccd23924789c3ca3e4f0417fb4b6` |

The patch stands on its own: it needs only functions that have been live since v8.07, and it applies cleanly on v8.13
or v8.14. It does not depend on the v8.14 or v8.16 drafts.

**Who did what.** Claude implemented and tested the patch. Codex reviewed it in three rounds:
- the five findings below (eafb37e);
- a correction for the public find box, keyboard focus on the cards and fresh collection reads (6ebb321);
- a correction keeping the selection across redraws (b0e58d2).

Both Codex corrections are integrated verbatim. Codex ran the standing suites and both full sweeps on its side: on
665f53fe (15/15 runs, 248 assertions, 0 errors, e078fea), and binding them to 35ab1366. Claude did not run the standing
suites on 35ab1366.

## What changed on the Documents tab

**Built from the page's own parts only:**
- Today's carbon island cards with their four screws (`.card.island.racecard`);
- the race-card numerals (`.pstat b`, Barlow italic, counted up by `countUpFigures`);
- the register's three-lens lamp (`dstat` + `lampSvgLite`, from the page's shared lamp parts);
- Today's white cards (`.card.hubcard`, `.hubtitle`, `.hublist`, `.hubgo`);
- `refPlate`, the `.tl` pip, `.chip.crit`, `.btn.sm`, `details.sfold` and the Change deliveries find box;
- line glyphs drawn the way the tab bar's are (16 box, `currentColor`, 1.4 stroke).

The four colours in `v815.css` are all already on the page, and no font was added (both tested).

**Top to bottom:**
- **Search first.** The find box filters everything on the tab: titles, references, sheets, docket numbers, notes and uploads.
- **Six category cards,** each with its count and lamp: Safety · SWMS 6, Transport 3, Drawings 42, Packs 24, Photos 194, Fencing dockets 59. Invoices appears only when there are some.
- **Recent:** the last five uploads.
- **Slim file rows:** plate, title, one line, light, then Open, Print sheet and Details.
- **Folded long lists:** the 27-plate print set, the 17 dated pre-starts, and photographs grouped by reference.
- **Removed:** the 467 px banner, both count lines, the section chips, the 9 explanation paragraphs, the footer, the source pills, "no revision recorded" and the Invoices empty notice.
- **Missing files:** the four that really are not uploaded show red. The sentence explaining why shows on the edit link only.

**Duplicates merged.** Five Advanced Fencing pre-starts appeared twice: catalogue "not hosted" and uploaded "available". Each now shows once, available, and keeps everything the catalogue said (its note, behind Details).

**Kept working:**
- every `#docs/...` link, plus `#docs/dockets`;
- the Fencing tab's "Open the plan" buttons, which open the fencing plans;
- printing (Ctrl+P and the button print the whole list);
- uploads and Remove on the edit link;
- the header search, which now lists up to 8 documents.

**Speed.** Every redraw runs inside `holdAssets`. Outside a hold, one redraw took 100 s, because each of 324 file names
rebuilt the asset list. A card now opens in 340–450 ms.

The docstring in `patch_v815.py` still mentions reusing the last collection. Codex's correction replaced that with fresh
reads inside the hold. The docstring is not in the page; correct it in the next edit.

## Codex's five findings

| # | Finding (eafb37e) | Fix | Test |
|---|---|---|---|
| 1 | Native Ctrl+P printed no document rows unless the dedicated button set `docPrint815` | The whole list (`printList815`) is always on the page, hidden on screen and shown in print. No flag, nothing to restore. | Real `page.pdf()` three ways: Ctrl+P from the default view, the Print the list button, and Ctrl+P with a search and fold open. Live: 22 pages, 80 files. v8.15: 12 pages, 134 files, with every title live prints present in the PDF text; the screen is unchanged afterwards. Codex check 1. |
| 2 | `row815` dropped non-photo filed-reference links | `meta815` shows "filed against <ref>" with the drawer action (`data-open815`) for maps and invoices, known reference or not | "a map or invoice filed against a reference says so and the reference opens it, known or not"; Codex checks 2–3 |
| 3 | Header finder used the old twin IDs and did not select the merged result | The finder indexes a merged twin under its uploaded ID, so it opens that one file. A document with no file lands on Documents, found by its title, with its row marked, in view and keyboard-focused. The mark survives the file-list refresh redraw (Codex's b0e58d2). | Real typing in the header search, then a click: merged pre-start opens its file; not-uploaded SWMS lands marked and focused after a forced refresh, waiting on `DOCS.busy` (unchanged guard test); available original opens. Codex checks 5–6. |
| 4 | Legacy "Open the plan" fencing shortcuts opened signed dockets | `DOCSEC815.fencing = 'maps'`, scrolled to the Fencing plans heading; `dockets` keeps its own route | The Fencing tab's real buttons, pressed on every week that draws one, land on the plans, not the dockets. Codex check 4. |
| 5 | Twin merging dropped catalogue notes | `twins815` copies every catalogue field the upload lacks, including the note | Each merged pre-start's note matches live word for word, and Details unfolds it. Codex check 7. |

**Codex's seven portable checks**:
- On the frozen 968aefb source, Codex's own `probe.cjs` reproduces all 7 defects (`evidence/codex_checks_frozen968.json`).
- It refuses the corrected bytes by design (`evidence/codex_probe_on_v815.txt`).
- The same seven checks, with the same synthetic fixture, run against the functions in the 35ab1366 page: **7/7 fixed** (`evidence/codex_probe_v815.cjs` → `evidence/codex_checks_v815.json`).

## Tests on 35ab1366 (`evidence/v815_tests.js`, `066949c7…`)

**125 passed, 0 failed:** paper 9/9, desktop 58/58, phone 58/58.
- **Search:** found by real typing on the view link, with the box enabled (`data-ro`).
- **Counts:** each card against live (live less the 5 duplicates).
- **Nothing lost:** every one of live's 300+ files is reachable, none is listed twice, and the 4 missing files show red.
- **Links:** the deep links and plan buttons above, plus Recent.
- **Keyboard:** Enter and Space open and close a card, and the focus stays on it.
- **Edit link:** + Add, Remove and the reason a file is red; none of it on the view link.
- **Looks and motion:** motion off and reduced motion respected; no emoji; no sideways scroll on the phone with any card or fold open.
- **Speed:** a card opens in under 0.5 s.
- **Open time:** median of 6. Desktop: live 434 ms, v8.15 470 ms (+8%, inside the 10% gate but not faster; an earlier run measured 442 against 461). Phone: live 457 ms, v8.15 448 ms.

**Test changes after the first runs, and why:**
- the Fencing plan buttons are drawn only for the picked week, so the test presses each week;
- the edit-link check reads in one task, so the page's 4 s poll cannot flip it back to view-only mid-check;
- `DOCS.at` is restored when a pick opened a file and never refreshed;
- Codex's `holdAssets` wrap is applied to the observation calls only;
- the twin-title equivalence was added to the paper check.

The missing-SWMS check exposed a real product race: a file-list refresh redraw dropped the mark and focus. Codex fixed it
in the product (b0e58d2), and the check stayed unchanged.

## Layout

Measured the v7.99 way (`evidence/layout815.cjs`): each section's area less its children's natural area.

| | live 6365fd09 | v8.15 35ab1366 |
|---|---|---|
| Desktop, tab as it opens | 8,949 px, 20.8% empty | **511 px**, 17.8% empty (cards 14%, Recent 22.1%) |
| Desktop, Packs open | — | 805 px, 21.7% (pack rows 28%) |
| Desktop, Drawings open | — | 1,196 px, 22.2% (issued 22.8%, plans 15.7%, "Other drawings" 67.7%: one row in a 3-column grid) |
| Desktop, Fencing dockets open | — | 1,687 px, 13.7% |
| Phone, tab as it opens | 21,878 px, 4.4% | **1,102 px**, 7.7% (cards 11.1%) |
| Phone, Packs / Drawings / Dockets open | — | 6.9% / 5.1% / 6.3% |

There is no sideways scroll on either device.

**Over the 15% target:** on desktop, the default view (17.8%), Packs (21.7%) and Drawings (22.2%) are above it. The cause
is the packing trade-off of the three-column row grid. Every grid line is as tall as its tallest row, so a two-line title
or meta stretches its neighbours. A part-filled last line also leaves empty cells: Recent is 5 rows over 3 columns, and
Other drawings is 1 row. The cards (14%) and the phone (all under 12%) meet the target. Not changed in this release
(product frozen). Follow-up: flow the rows in CSS columns, or size the grid to the list, if it looks wrong to Andrew.

## Pictures (outside the repo)

The pictures are in Claude's session scratchpad, `v815/`:
- before and after, desktop and phone, first screen and full height;
- each card open, and a WC search;
- `compare_today_vs_docs_desktop.png` and `compare_today_vs_docs_phone.png` (Today's instruments beside the new tab).
