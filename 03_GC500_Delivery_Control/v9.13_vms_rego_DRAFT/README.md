# v9.13 — VMS boards: whose, fleet number, rego, and the delivery each is on

Author: Andrew Fisher

## READY — candidate on live v9.18 (not uploaded)

- **State:** READY TO UPLOAD on its agreed scope, once the publisher claims it on `STATUS.md`. Every check below is clean on
  the candidate; the live page was still v9.18 at 00:31 AEST 9 Oct (GET, same hash).
- **Base:** live v9.18 `c547a6debe1dea9009b50466d3c1028ec9c3a800e6c591ea258b61490b14b762` (11,605,879 bytes), fetched by the
  build 9 Oct 2026 00:17 AEST. The footer stays ` · v9.18`; whoever publishes gives it the next free footer.
- **Candidate:** `d8ccda88da99e7d0981bda910087b302d4eee0654413cd220a9b58c87911d6ed` (11,653,534 bytes), `check_page.py` PASS.
- **Build:** `toolchain/build.sh v913_r918 v9.13_vms_rego_DRAFT/patch_v913_vms_rego.py` → `build/GC500_v913_r918/`.
  Patch sha256 `ce57fead1d0244389d33451842dcc65eada1f49a2f70e2e9d2a63611d87af013`; test sha256 `06ceef54a959618f7de7bb9bf34d0f2a4a8f0fcfbd155d9fa9df017223ee0e3d`.
- **What is new against the last build (`bdd10c72…`):** Andrew's 8 Oct answers on board 1211404, below. Everything else is as
  reviewed.
- **The live record was only read (GET), never written.** Nothing on the record changes in this release; no `vmsboard`
  document exists on it.
- **Review record:** rebuilt and tested in one session. This rebuild has had no second review.

## What Andrew asked (on site, Thu 8 Oct 2026)

- About 14:55 AEST: "VMS10 is Subhired company is PremAir Hire Rego No V14221 ASSET NO 120T. VMS BOARDS will also have rego
  numbers." (The same message gave WC31's disabled toilet as asset 1317645. That is not part of this release.)
- About 15:35 AEST: "also need to fix things like this T0103 this is VMS09 and VMS10 VMS is the number i gave you and the
  VMS10 is the subhire number i gave you . vms boards have number plates too i told you this".
- About 13:50 AEST (relayed to the board at 17:41): "1211404 is VMS09". It is an asset number, not a rego.
- About 23:20 AEST, of 1211404 on T0001: "take off that location and put on new location".

## What his 8 Oct answers change

- **1211404 is VMS09, on T0103, by the project manager's word.** The record still overrides it: a board document on the
  record for VMS09 wins, field by field, as for every board.
- **One board, one row.** Contract 9961265 carries 1211404 on line 1 (T0001, from 7 Sep) and on line 12 (VMS09). His word
  makes them the same board, so line 1 is folded into VMS09's row. The register has 22 rows covering all 23 contract lines.
  VMS09's row reads "line 12 · moved from T0001 (line 1)", fleet no. 1211404, **On delivery T0103 (the project manager's
  word)**. "Asset no. also on line 1" and "also on T0001 - to confirm" are gone from every surface.
- **T0001 shows its 7 Coates boards on site plus one line "1211404 moved to T0103 (VMS09) — the project manager, 8 Oct"**:
  on the Timeline load card and its "Every day" row, the delivery cards, the drawer, the driver drop card (7 board pills and
  the line; no plain "Asset 1211404" pill), the printed drop sheet, the Drivers and Install PDFs, the installers' daily page,
  and the driver's full details text (with a plain dash). The driver's short text lists T0001's 7 boards only.
- **If the record moves VMS09**, T0001 follows it: "1211404 moved to <delivery> (VMS09) — on the record", or "moved off T0001"
  when the record takes it off every delivery. If the record puts it back on T0001, the line goes.
- **Editors only** (the edit link, in the register under the form), each said only while it is still true:
  - "The record still lists 1211404 among T0001's asset numbers — remove it on T0001's Change form."
  - "Contract 9961265 lists the board on line 1 (T0001, from 7 Sep) and line 12 (VMS09) — check line 1 was off-hired or
    transferred." It goes once a contract refresh shows line 1 ended.
- **Nothing on the record is changed by the page.** T0001's asset numbers still include 1211404 until an editor takes it off.

## Open items

- **For Andrew, on the page:** take 1211404 off T0001's asset numbers on T0001's Change form. That is a record change, his
  to make.
- **Billing, for the branch:** contract 9961265 still lists 1211404 on line 1 (T0001, delivered 7 Sep, no term date) and on
  line 12 (VMS09, from 8 Oct). Check line 1 was off-hired or transferred, or the V8s may be charged twice for one board. The
  contract also gives the two lines different serial numbers (line 1 HE03-00122, line 12 HE03-00117), which is worth
  checking at the same time.
- **T0001's schedule row still reads "VMS × 8"** (the schedule's own words, untouched; the On delivery choice shows it).
  Its boards line says 7. The schedule row is for whoever next refreshes the schedule.
- **PremAir Hire / Premiair:** his spelling for VMS10 sits beside the contract's "Premiair" (VMS11, VMS18–23). Nothing
  changed until he says whether it applies to all of them.
- **Regos for every other board:** "not given" until somebody enters one.
- **The VMS plan:** the plan's numbering against the 23 contract lines is still open. Nothing is renumbered.
- **Today's own delivery list** does not show the boards (Today does not draw loads with these renderers, and Today's markup
  is the other agent's).
- **Tab-wide fault, not this release:** the Equipment tab's skin keeps `fold96` panels white in dark mode while `--ink`
  follows dark mode, so "Every reference", "Branches" and the other folds are hard to read on a dark-mode phone.

## What the page gains

### The VMS board register (Equipment tab, "VMS boards")

One row per board on contract 9961265's VMS lines: 22 rows for 23 lines (1, 3–9, then VMS09–VMS23; line 1 is VMS09's).

- **Board:** the VMS number where the contract names one, else the Coates asset number, with the line and the docket under
  it. A line folded in by the project manager's word is named under it ("moved from T0001 (line 1)"). Any other Coates
  asset number on two lines would still be said ("asset no. also on line N") and not resolved.
- **Whose:** Coates, or the sub-hire company the contract names (Premiair, RPM). A company the project manager or an editor
  gives wins.
- **Fleet no.:** the Coates asset number, or the supplier's fleet number when somebody has given one. Where it is the board's
  own name it reads "same as board" (no number twice in a row).
- **Rego:** only where somebody has given one; otherwise "not given". No rego is invented.
- **On delivery:** the VMS plant line carrying the board: the record first, then the project manager's word, then the
  contract ("by asset number" / "by delivery docket"). Otherwise "not named yet".
- **Source:** the record (who and when), or the project manager's word. Rows from the contract leave it blank; the note says
  "From the contract unless a row says otherwise" once. His word is said once per row.
- The fold's summary counts contract lines (23), not rows.
- A record whose board is no longer on the contract is listed under the register ("On the record for a board no longer on
  the contract"), so a contract refresh never hides one.

### The project manager's word, preloaded and shown as his word

Field by field, anything entered on the record overrides it.

- **VMS10:** PremAir Hire, fleet number 120T, rego V14221, on T0103.
- **VMS09:** Coates asset 1211404 (contract lines 1 and 12), on T0103, moved off T0001. No rego has been given.
- Nothing else is preloaded. Every other rego reads "not given".

### The editor form (edit link only)

- Board, Whose (company), Fleet number, Rego, **On delivery**, *Save to the record*. Every tap target is 44 px. On a laptop
  each row has a Change button; on a phone the Board picker does that job (no Change button per row).
- **Validation:** rego 1 to 9 letters or digits, kept in capitals; fleet number by the sub-hire rule (1 to 12, or 3 to 12
  for Coates); company plain text; a rego or fleet number already on another board is refused; On delivery must be one of
  the VMS plant lines on the page (T0001, T0103, T0128, T0158, T0159, T0169, T0170), never more boards than its schedule row
  carries. A refusal is said once, in the form.
- **What a save writes:** the board's record as it stands, with only the fields the editor changed. A changed field that
  matches what would show anyway (his word, else the contract) is stored as null. Pressing Save with nothing changed writes
  nothing ("Nothing changed on VMS10 - nothing was saved.").
- **Another device:** if the board's record changes while the form is open, the form refills what the editor has not changed,
  keeps what he has, and says "VMS13 was changed on another device by … at … - the form now shows that". A save from a stale
  form is refused and writes nothing.
- **Save waits for the shared record** (disabled until `vmsboard` has arrived, the way the daily message waits).
- **Write path:** `mayWrite`, `whoAmI`, `stampIt`, `bump`, the same as the v7.44 sub-hire collection. Nothing is written on
  opening, viewing or printing.
- **Not yet on the shared record:** a row saved here but not taken by the service reads "saved on this device by … - not on
  the shared record yet"; after the service refuses it (403) the register is drawn again and reads "saved on this device only
  … - the shared record did not take it". Only a document the store holds reads "recorded by …".

### The record collection: `vmsboard`

- One document per board, keyed by the board name (`VMS09`, `VMS10` …, or the Coates asset number), `{co, fleet, rego, on,
  line, by, at}`. `null` says nothing (falls back); `''` means an editor cleared his word's value; `on` is a plant line,
  `'none'` (taken off) or `null`.
- In the sync list, blank record, merge, import and export, exactly as `subhire`. An import checks it: the key is a board
  on the contract, the rego and fleet number follow the rules, and `on` is a VMS delivery, `'none'` or nothing.

### The boards by name wherever a VMS delivery is shown

T0103 reads **VMS09 (Coates 1211404 · rego not given) · VMS10 (PremAir Hire 120T · rego V14221)**, marked "(the project
manager's word)". A Coates board whose only fact is its asset number, already shown on the same surface, is counted rather
than repeated (T0001: "7 Coates boards by the asset nos. shown (rego not given)", then "1211404 moved to T0103 (VMS09) — the
project manager, 8 Oct"). A VMS delivery with no board linked says "VMS boards not named yet".

| surface | how it is reached | done |
|---|---|---|
| Timeline load card | wraps `loading872AssetHtml`, under "Asset no." | yes |
| Timeline "Every day" rows | wraps `dayRows`, under the asset numbers | yes |
| Delivery cards (a Timeline load opened) | wraps `bookingNosLine801`; hidden inside an opened load, where the load card already says it | yes |
| Drawer — Delivery card | wraps `deliveryCard`, under its rental lines (class `dcl913`, not the page's `.dcard`); the rental lines' own chips are left off there | yes |
| Drawer — Driver drop card | anchor in `driverCard`: one pill per board (wrapping inside the card on a phone), his word as one small note naming the boards, the moved line as a small note; the plain Asset pills leave out numbers a board pill or the moved line carries, and "and N more" counts what is left | yes |
| Printed drop sheet / Print the day | anchor in `dropPage`'s Asset no. field | yes |
| Drivers PDF and Install PDF (run sheets) | anchor in `dpTruckBefore801`'s "Booked / recorded numbers" cell | yes |
| Installers' daily page | wraps `daily821Model`, the boards (and a moved line) as the delivery's first notes | yes |
| Driver's short text | wraps `dropSmsText`: one "Boards:" line, only while the text stays within 459 units, 3 texts and 480 characters (full, then "VMS10 rego V14221", then names, then "see Full details"); rego only where given; `text747What` (the map picture's title) is untouched | yes |
| Driver's full details text | wraps `dropText`, a Boards line (and a moved line, plain dash) after the asset numbers | yes |
| Today's own delivery list | Today does not draw loads with these renderers, and Today's markup is the other agent's | **not done** |

Nothing changes on a delivery that is not VMS (WC09 is checked on every surface).

## The review findings and what happened to each

| finding | outcome | evidence |
|---|---|---|
| **Saving (blocking): a stale form overwrote a newer record** | fixed: base + touched draft, refill and message, stale save refused, document = record + changed fields | test D: "the open form refills…", "saving only On delivery keeps the other device's fleet number and rego" (body `{co:null, fleet:'R13', rego:'RPM13', on:'T0158'}`), "a save from a stale form is refused…" (0 sent) |
| **Screens (blocking): register unreadable in dark mode** | fixed: light-panel tokens on the register's own fold only | test B: 0 texts under 4.5:1 on phone and laptop; `evidence/dark_*_{phone,laptop}.png` |
| **Screens (blocking): boards line drawn as a `.dcard` box** | fixed: `dcl913` (and `tl913`, `row913`, `dc913`) | test A: computed border 0, radius 0, no shadow, no margin |
| **Screens (blocking): facts repeated** | fixed: (a) "same as board" / "by asset number"; (b) driver card pills; (c) chips dropped where the Boards line is drawn; (d) note without counts; (e) his word once per row | test A checks for each; `evidence/register_*.png`, `drawer_dropcard_T0103_phone.png` |
| **Screens (blocking): note talked about the plan reconciliation** | fixed: one plain line, no counts, no plan | test A "the note carries no counts…" |
| **Scope (blocking): short text over the limit** | fixed: Boards line added in `dropSmsText` only while it fits | test A: 14 cases (7 deliveries today, and with T0158 9, T0159 5, T0128 2 linked in memory) all ≤ 459 units, 3 texts, 480 characters; T0103 keeps its link |
| **Scope (blocking): README named an agent** | fixed | this file |
| Save with nothing changed wrote a document | fixed | test C |
| Refused write presented as recorded | fixed (row wording by sync state; redrawn after the refusal) | test D |
| Orphan records never shown | fixed | test A |
| Import did not check `vmsboard` | fixed (`subhire` still has the same gap — not this release) | test A |
| Save possible before the record arrived | fixed | test C |
| Test gaps (no manual redraw; textContent) | fixed | test D waits with no redraw (about 3.5 s) |
| Boards twice in an opened Timeline load | fixed (CSS `:has`, inside `.ld` only) | test A |
| Drivers sheet: Boards line away from the numbers | fixed: in the booked numbers cell | test A |
| SMS spent characters on "rego not given", lost its link | fixed | test A |
| VMS09's 1211404 also on T0001, caution only in the register | **superseded by Andrew's 8 Oct answers**: one board, on T0103; T0001 says it moved; editors see what is left to do | test A, test C, test D |
| Word pill read as a detached tag | fixed: one small note "VMS09 and VMS10: the project manager's word" | test A |
| Validation error shown twice | fixed: inline only | test C |
| On delivery options truncated / relocation | fixed: "T0159 - 19 Oct - VMS × 5 · Relocate" (no year) | test C |
| Phone rows tall, "from the contract" ×22, Change per row | fixed: source blank for contract rows; no Change button on phone | test A/C |
| Board select truncated | fixed: "1211370 - line 3" | screenshots |
| Dark screenshots missing | fixed | `evidence/dark_*` |
| PremAir Hire vs Premiair | **open — question for the project manager**, nothing changed | — |
| Tab-wide fault (not this release): Equipment folds in dark mode | **reported, not fixed here** | `evidence/dark_form_laptop.png` |

## Checks on the candidate `d8ccda88…` (all read only; the live record was never written)

Run with `TMPDIR=/dev/shm/v913r` and `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, every browser run
through the one-browser-at-a-time lock, on 9 Oct 2026 between 00:20 and 00:30 AEST, record version 4581.

- `tests/test_vms_rego913.cjs` (four sessions: A view link, B dark mode, C practice editor, D another device; every write
  captured in `page.route` and aborted, the harness blocked nothing, a fresh GET before and after shows no `vmsboard`
  document): **laptop 68/68** (`evidence/test_vms_rego913_laptop.log`), **phone 68/68**
  (`evidence/test_vms_rego913_phone.log`).
  - Expectations updated for Andrew's answers: 22 rows for 23 lines; VMS09 "moved from T0001 (line 1)", On delivery T0103
    (the project manager's word), no "also on line"; T0103 text without "to confirm"; T0001 = 7 boards plus the moved line
    on the load card, the driver drop card (no plain 1211404 pill), the full details text and the run sheet cell; the
    editor note on the edit link only, and its first item gone once T0001's number is taken off (a tombstone set and
    removed in memory in one step); a record moving VMS09 off makes T0001 say "moved off T0001 (VMS09) — on the record".
  - The first runs (`*_run1.log`, laptop 65/67, phone 67/68) failed only on test faults, fixed in the test, not the page:
    the Timeline now opens on today (9 Oct), so the test chooses 8 Oct before reading T0103's drawn load card; and the
    editor-note check first faked T0001's asset instead of taking the number off the way the Change form does.
  - Dark mode: 0 texts under 4.5:1 in the register and its form (193 checked on laptop, 165 on phone).
- Sweeps (`toolchain/harness/sweep.js`), laptop and phone: 21 tabs, 0 page errors, 0 console errors, 0 hash errors,
  0 blocked writes (`evidence/sweep_{laptop,phone}.json`); the same 15 tabs shown as on the last build.
- Money (`v8.95_baseplan_07oct_DRAFT/tests/compare_money895.cjs`, A = live v9.18, B = this build), laptop and phone: 4,111
  numbers the same, **0 differ**, 0 structural differences, tie-outs 17/17 on both pages, both reading record 4581; no
  errors, no writes attempted (`evidence/compare_money_{laptop,phone}.log`).
- `check_page.py` PASS; the patch refuses to run twice; DATA round-trips; MASTER_LOC and the footer (` · v9.18`) asserted
  unchanged.

**Pictures on this build (each looked at; no dollar figure, phone number, email or credential in any):**
`register_{phone,laptop}.png`, `register_editor_{phone,laptop}.png` (the laptop one shows the editor note),
`timeline_T0103_{phone,laptop}.png`, `drawer_dropcard_T0103_phone.png` (from `tests/shots913.cjs`, phone), and
`dark_{top,vms10,end,form}_{phone,laptop}.png`. The drawer's Delivery card is not drawn open for T0103 by default, so it has
no picture; test A checks its markup and computed style. The laptop pictures of the T0103 drop card and the Drivers sheet
from the last build were removed (they showed the old "also on T0001 - to confirm" wording) and were not re-shot; test A
checks both surfaces.
