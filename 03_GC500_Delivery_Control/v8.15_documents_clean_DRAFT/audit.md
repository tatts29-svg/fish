# Documents tab audit (read only), 3 Oct 2026

Author: Andrew Fisher. Page audited: `scratchpad/live_now.html` (9,079,773 bytes), opened with `toolchain/harness/open_page.js` at the live address. Every write was aborted, 0 page errors, and the file index state was `ready`. Screenshots are in `scratchpad/docs/`.

The tab id is `docs` (`TABS`, line 9643), so `#docs` is the right hash. The deep links `#docs/swms|transport|maps|packs|photos|invoices` go to a section (line 34190).

## 1. Render functions and sections (top to bottom)

`renderDocs(keep)` (line 33864) calls `renderDocs_held` (line 33865). It writes `#pane-docs` in one template string. Photo galleries go through `renderPhotoGallery` (line 33851). Cards come from `docCard` (line 33642) and counts from `docCollection()` (line 33776). The CSS is at lines 4475–4540, with later overrides at 5295 and 6473.

Heights below are for the view link. Desktop is 1440 px wide, phone is 390 px wide.

| # | Section | Code | Always shown? | Desktop px | Phone px |
|---|---|---|---|---|---|
| 1 | "View only…" chip | shared | view link only | 34 | 70 |
| 2 | Page banner "THE PLANS BEHIND THE BUILD · illustrative scene" | `pageBanner('docs')` via `paneHeadingHtml` | yes | **467** | 148 |
| 3 | `.hubhead`: H2, count line, availability line, Print this list, Refresh | renderDocs_held 33921–33945 | yes | 71 | **188** |
| 4 | Jump buttons `.docjump` (6) | 33946 | yes | 37 | 123 |
| 5 | Upload form `#docAddCard` and "+ Add here" on each section | `addForm` 33897 | edit link only | not measured | — |
| 6 | SWMS & safety plan (6 cards) | `sec('swms')` + `groupHtml(DOC_GROUPS[0])` | yes | 826 | 1,819 |
| 7 | Transport & lifting (3) | `sec('transport')` | yes | 380 | 851 |
| 8 | Maps and drawings (42 across 6 sub-groups) | `sec('maps')` | yes | **4,084** | **10,582** |
| 9 | Packs and reports (29) | `sec('packs')` | yes | **2,488** | **6,923** |
| 10 | Photographs: 3 category tiles | `photoCardsHtml` (33843), `PHOTO_CATS` | when there are pictures | 254 | 709 |
| 11 | Invoices: 0 files, empty-state notice | `invoiceBody` 33909 | whenever hosted | 115 | 193 |
| 12 | Footer paragraph "Open shows the file…" | 33966 | yes | 33 | 117 |

The whole pane is **8,949 px on desktop (about 10 screens)** and **21,878 px on phone (about 26 screens)**. It has 80 cards and no search box of its own.

Each card (`docCard`) has:
- a kind tab and `//`;
- a cover thumb;
- a title and a sub-line (doc_ref · pages · paper);
- two pills (availability and source);
- a "Revision" block;
- Open PDF, Print sheet and Details buttons;
- an amber "absent" sentence.

The Details fold is already there. It holds the meta, note and sheet list.

## 2. Screenshots (`scratchpad/docs/`)

- `desktop_full.png`, `phone_full.png`: the whole tab, full height.
- `desktop_first_screen.png`, `phone_first_screen.png`: the first screen.
- `desktop_transport_section.png`: Transport opened by its jump button, with Details expanded.
- `phone_maps_section.png`: Maps opened on the phone.
- `desktop_photo_gallery_dropphotos.png`: a photo category opened (188 cards in one grid).
- `desktop_search_SWMS.png`, `desktop_search_D022.png`: the header search with a query.
- `_crop_*.png`: readable slices of the full shots.

## 3. Data

**The catalogue, `DATA.docs.docs`, has 73 items (built 25 Sep):**

| Category | Count | Breakdown |
|---|---|---|
| Safety | 6 | 4 SWMS, 1 risk assessment (G-Link), 1 HSEQ plan |
| Transport | 3 | |
| Maps | 40 | 8 issued drawings, 5 fencing plans, 11 A1 plates, 5 A3, 11 single A3 |
| Packs | 24 | 4 packs, 3 references, 17 pre-starts |

**On the server:** `GET /api/files` returned 324 files. That is 254 jpg and 70 pdf, with 254 thumbnails.
- By kind: 188 drop-photo, 59 docket, 40 map, 23 pack, 6 other, 5 swms, 3 transport.
- Upload dates run from 14 Sep to 2 Oct. 87 files arrived after 26 Sep.

**The collection the tab shows has 333 items:**
- 73 catalogue items plus 260 "uploaded since".
- By category: Safety 6, Transport 3, Maps 42, Packs 29, Photographs 194 (188 drop and 6 site), Fencing dockets 59, Invoices 0.
- 324 are available and 9 are "missing".

**How each status is worked out:**
- **Available or Not hosted:** `docAvailability()` checks whether `DOCS.files[d.id]` exists (`docHref`). The id is checked, not the title.
- **Uploaded since the build:** `docCollection()` takes any server file whose id is not in the catalogue. These get `source:'uploaded'`. The kind comes from the upload field, the image extension, the drop-photo name, or a docket number in the file name.
- There are also "checking" and "unchecked" states while the file index loads or fails.

**Duplicates found.** Five Advanced Fencing pre-starts (14–18 Sep) show twice.
- One copy is the catalogue card, marked "Not hosted".
- The other is the uploaded copy under a different id, marked "Available".

The other 4 "not uploaded" items are: the ATF SWMS, the A3 laminate set, the A3 zooms and the ATF pre-start MASTER.

**What a file row shows:**
- title, doc_ref (e.g. "SEQ-SWMS-009.01g · published 13 Feb 2025 · review 13 Feb 2027"), pages, paper and size;
- revision (only 8 items carry one), rev_on_page or date_on_page;
- "uploaded 18 Sep 08:17 by Andrew Fisher";
- for photos, "capture time not recorded";
- under Details: the note and the sheet list.

## 4. Clutter, quoted as it appears on screen

- **Counts said three times.**
  - The header says "4 SWMS · 1 risk assessment · 1 HSEQ plan · 3 transport & lifting · 42 maps and plates · 29 packs · 194 photographs · 59 fencing dockets".
  - The next line says "**333** listed (73 in the build catalogue + 260 uploaded since) · **324** on the service and openable · **9** not uploaded yet — each one says so on its own card".
  - Every section repeats its count again in a chip ("6 DOCUMENTS", "42 FILES").
  - The header's "194 photographs" disagrees with the section chip "253 PICTURES" (194 photos + 59 dockets).
- **Technical wording:** "build catalogue", "on the service", "Not hosted", "Drawing source", "Made by this page", "Uploaded to the service" (also used as a group heading), "title is the file name", "Not on the service yet — upload it on the admin page, or here with the edit link."
- **Pills on every card.** The pill counts are "Available" ×71, "Drawing source" ×42, "Made by this page" ×24 and "Source document" ×6. "no revision recorded on the file" appears **62 times**.
- **Explanation paragraphs.** There are 9 `maphint` blurbs, e.g. "Pictures on the service, in their drawers. Press a card for that category's gallery… nothing here is to scale". There is also the footer "Open shows the file in your browser — print from there…".
- **Empty state.** Invoices shows "No invoices here yet — Upload one on the admin page or above, filed against its branch — STPS…, KINP…, NVAC…, MEAD…".
- **The 467 px banner** comes before any document.
- **Long lists that should fold:**
  - the print set: A1, A3 and single A3, 27 cards;
  - 17 dated pre-starts (+5 uploaded duplicates).
- **Gaps:**
  - Fencing dockets have no jump button and no section; they are reachable only through Photographs.
  - The "Fencing" plan-update link sets `state.docsec='fencing'` (line 16036). No such section exists, so it shows "That document section has no files to show."
  - Two uploaded fencing items (the "CW2 Fencing Installation Plan" and the "02 A3 Detailed Map Atlas") land under "UPLOADED TO THE SERVICE" instead of their group.

## 5. Taps today

On a phone, Documents sits under **Tools** below 760 px (`tabPrimary`). That adds 1 tap and a scroll on every route.

| Task | Desktop | Phone | Notes |
|---|---|---|---|
| A SWMS | 2 (tab, Open PDF) after scrolling past the 467 px banner | 3 | Header search for "SWMS" shows only **4 of 6**, because `finderMatches` caps documents at 4. It says the ATF SWMS is "not on the service". |
| A drawing (D022 PDF) | 3 (tab, Maps, Open) and a ~1,000 px scroll | 4 and about 10,000 px of scroll to reach the single A3 | Search "D022" returns the Map sheet and assets, not the PDF |
| A transport doc | 3 | 4 | |
| A photo of P03 | 4 (tab, Photographs, Drop photographs, Open original) | 5 | The gallery is 188 cards with no filter. Uploaded files and photos are **not in search** (only catalogue documents are indexed, line 35671). |

## 6. Proposal: race-car look, clean and tidy

**Reuse these existing pieces (no new design language):**
- `.cut` / `.cut > .face`: chamfered cards with an orange `--edge` on hover (625–650).
- `.cut.dark` and `.card.island` (3913): espresso housing with rivets.
- `.card.island.racecard .pstat b`: big italic Barlow numerals.
- `.racenum` and `.rplate`: the race-number plate, already used for references (653–672).
- `signalHead()` (10152) and `.card.island.lights .hl` (3942): start-light status.
- `.tl i`: a small light dot.
- `gauge()` (36308) and `completionDial()` (37899): gauges.
- Glyphs in the `levelGlyph`/`stepsGlyph` style (8673, 8695) and `TAB_GLYPH.docs` (9686): 20-box SVG, stroked in currentColor at 1.4–2 px.
- `countUpFigures(tab)` (9865): count-up for any bold figure 22 px or larger.
- `button.cut:hover` lift, `@keyframes finderIn`, the `wipPing` glow, and `motionOff()` with the motion_off_twins rule.
- `.photocats` / `.pstrip`: photo strips.

**Layout, top to bottom:**

1. **Search first.** Add a box at the top of the tab that filters `docCollection().items` live. Use the same `hay` approach as the finder (title, name, doc_ref, ref, sheet_ids, note). Results drop in with `finderIn`. Also index uploaded files in the header finder and raise the doc cap above 4.
2. **Six category tiles.** Each is a `.cut.dark` chamfered housing. It has:
   - a new glyph in the levelGlyph style (shield = Safety, truck = Transport, sheet = Drawings, stack = Packs, camera = Photos, clip = Dockets);
   - its count as an italic `.racenum`, which counts up on arrival;
   - a 3-lamp start-light: green when everything is available, amber while checking, red when anything is not uploaded.

   The tiles are Safety 6, Transport 3, Drawings 42, Packs and pre-starts 29, Photos 194, Fencing dockets 59. Invoices appears only when it is above 0. The tiles rise in sequence, 40 ms apart. The selected tile turns `.cut.on` (orange livery).
3. **Recent.** The last 5 uploads, sorted by `DOCS.files[].uploaded`, as slim rows.
4. **File rows inside the open tile.** Each row is a slim `.cut` card with:
   - an `.rplate` for the sheet or doc ref (D022, SEQ-SWMS-009), or the kind glyph;
   - the title;
   - one line: "34 pp · A4 · rev 02";
   - a single `.tl` light in place of the two pills;
   - an Open button.

   Tapping the row opens a preview with the large cover (`d.thumb`, `docPhotoPreview`), Open and Print sheet, and the Details content.
5. **"More" folds.** These are folded by default:
   - "Print set — 27 plates" (A1, A3 and single A3 groups from `DOC_GROUPS`);
   - "Daily pre-starts — 17";
   - "Older fencing plans".

   Photos open by reference: the strip plus a reference filter (`d.ref`).
6. **Actions at the bottom.** Print list and Refresh become small ghost buttons at the foot. The upload form sits behind one "+ Add" button for the edit link only.

**Drop:**
- the banner (or cut it to about 120 px);
- both header count lines;
- the section count chips;
- all 9 maphint paragraphs and the footer paragraph;
- the source pill;
- "Revision / no revision recorded on the file";
- "title is the file name";
- the Invoices empty state.

**Merge:**
- Fencing dockets into their own tile;
- uploaded fencing plans into Drawings;
- duplicate catalogue and uploaded pre-starts, matched by date and title, showing the available copy.

**Hide:** the "not uploaded" wording becomes a red lamp, with the sentence shown in edit mode only.

The result is about 3 screens on desktop and 4–5 on phone before anything is opened, compared with 10 and 26 today.
