# v9.13 — VMS boards: whose, fleet number, rego, and the delivery each is on (DRAFT, not READY)

Author: Andrew Fisher

## What Andrew asked (on site, Thu 8 Oct 2026)

- About 14:55 AEST: "VMS10 is Subhired company is PremAir Hire Rego No V14221 ASSET NO 120T. VMS BOARDS will also have rego
  numbers." (The same message gave WC31's disabled toilet as asset 1317645. That is not part of this release.)
- About 15:35 AEST: "also need to fix things like this T0103 this is VMS09 and VMS10 VMS is the number i gave you and the
  VMS10 is the subhire number i gave you . vms boards have number plates too i told you this".

## Where it is up to

- **State:** DRAFT. Built and tested after the review; not uploaded, not READY TO UPLOAD. The footer is not touched, so
  whoever publishes it gives it the next free footer.
- **Base:** the live page moved twice during the work. v9.11 (the Timeline map release) went live, then v9.18 (the
  Showcase stability release). This build is on **live v9.18**:
  - Live v9.18: `c547a6debe1dea9009b50466d3c1028ec9c3a800e6c591ea258b61490b14b762` (11,605,879 bytes), fetched 8 Oct ~20:35 AEST.
  - Built page: `bdd10c727db81b63475d27b633101d7705a879678dca1edb209ad1c20dec86e1` (11,648,507 bytes; `check_page.py` PASS).
- **Build:** `toolchain/build.sh v913_vms v9.13_vms_rego_DRAFT/patch_v913_vms_rego.py`
- **The live record was only read (GET), never written.** No `vmsboard` document exists on it.

## What the page gains

### The VMS board register (Equipment tab, "VMS boards")

One row per VMS line on contract 9961265: 23 lines (1, 3–9, then VMS09–VMS23), under the references.

- **Board:** the VMS number where the contract names one, else the Coates asset number, with the line and the docket under
  it. 1211404 is on line 1 and on line 12 (VMS09); the row says so and does not resolve it.
- **Whose:** Coates, or the sub-hire company the contract names (Premiair, RPM). A company the project manager or an editor
  gives wins.
- **Fleet no.:** the Coates asset number, or the supplier's fleet number when somebody has given one. Where it is the board's
  own name it reads "same as board" (no number twice in a row).
- **Rego:** only where somebody has given one; otherwise "not given". No rego is invented.
- **On delivery:** the VMS plant line carrying the board: the record first, then the project manager's word, then the
  contract ("by asset number" / "by delivery docket"). Otherwise "not named yet".
- **Source:** the record (who and when), or the project manager's word. Rows from the contract leave it blank; the note says
  "From the contract unless a row says otherwise" once. His word is said once per row.
- A record whose board is no longer on the contract is listed under the register ("On the record for a board no longer on
  the contract"), so a contract refresh never hides one.

### The project manager's word, preloaded and shown as his word

Field by field, anything entered on the record overrides it.

- **VMS10:** PremAir Hire, fleet number 120T, rego V14221, on T0103.
- **VMS09:** on T0103. Contract line 12 gives it Coates asset 1211404. No rego has been given.
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
- In the sync list, blank record, merge, import and export, exactly as `subhire`. An import now checks it: the key is a board
  on the contract, the rego and fleet number follow the rules, and `on` is a VMS delivery, `'none'` or nothing.

### The boards by name wherever a VMS delivery is shown

T0103 reads **VMS09 (Coates 1211404 · rego not given · asset no. also on T0001 - to confirm) · VMS10 (PremAir Hire 120T ·
rego V14221)**, marked "(the project manager's word)". A Coates board whose only fact is its asset number, already shown on
the same surface, is counted rather than repeated (T0001: "1211404 (… also on T0103 - to confirm) · 7 Coates boards by the
asset nos. shown (rego not given)"). A VMS delivery with no board linked says "VMS boards not named yet".

| surface | how it is reached | done |
|---|---|---|
| Timeline load card | wraps `loading872AssetHtml`, under "Asset no." | yes |
| Timeline "Every day" rows | wraps `dayRows`, under the asset numbers | yes |
| Delivery cards (a Timeline load opened) | wraps `bookingNosLine801`; hidden inside an opened load, where the load card already says it | yes |
| Drawer — Delivery card | wraps `deliveryCard`, under its rental lines (class `dcl913`, not the page's `.dcard`); the rental lines' own chips are left off there | yes |
| Drawer — Driver drop card | anchor in `driverCard`: one pill per board (wrapping inside the card on a phone), his word as one small note naming the boards; the plain Asset pills leave out numbers a board pill carries and "and N more" counts what is left | yes |
| Printed drop sheet / Print the day | anchor in `dropPage`'s Asset no. field | yes |
| Drivers PDF and Install PDF (run sheets) | anchor in `dpTruckBefore801`'s "Booked / recorded numbers" cell | yes |
| Installers' daily page | wraps `daily821Model`, the boards as the delivery's first note | yes |
| Driver's short text | wraps `dropSmsText`: one "Boards:" line, only while the text stays within 459 units, 3 texts and 480 characters (full, then "VMS10 rego V14221", then names, then "see Full details"); rego only where given; `text747What` (the map picture's title) is untouched | yes |
| Driver's full details text | wraps `dropText`, a Boards line after the asset numbers | yes |
| Today's own delivery list | Today does not draw loads with these renderers, and Today's markup is the other agent's | **not done** |

Nothing changes on a delivery that is not VMS (WC09 is checked on every surface).

## The review findings and what happened to each

| finding | outcome | evidence |
|---|---|---|
| **Saving (blocking): a stale form overwrote a newer record** | fixed: base + touched draft, refill and message, stale save refused, document = record + changed fields | test D: "the open form refills…", "saving only On delivery keeps the other device's fleet number and rego" (body `{co:null, fleet:'R13', rego:'RPM13', on:'T0158'}`), "a save from a stale form is refused…" (0 sent) |
| **Screens (blocking): register unreadable in dark mode** | fixed: light-panel tokens on the register's own fold only | test B: 0 texts under 4.5:1 on phone and laptop; `evidence/dark_*_{phone,laptop}.png` |
| **Screens (blocking): boards line drawn as a `.dcard` box** | fixed: `dcl913` (and `tl913`, `row913`, `dc913`) | test A: computed border 0, radius 0, no shadow, no margin |
| **Screens (blocking): facts repeated** | fixed: (a) "same as board" / "by asset number"; (b) driver card pills; (c) chips dropped where the Boards line is drawn; (d) note without counts; (e) his word once per row | test A checks for each; `evidence/register_*.png`, `drawer_dropcard_T0103_*.png` |
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
| Drivers sheet: Boards line away from the numbers | fixed: in the booked numbers cell | test A; `evidence/drivers_sheet_T0103_laptop.png` |
| SMS spent characters on "rego not given", lost its link | fixed | test A |
| VMS09's 1211404 also on T0001, caution only in the register | fixed: "asset no. also on T0001 - to confirm" on driver and installer surfaces | test A |
| Word pill read as a detached tag | fixed: one small note "VMS09 and VMS10: the project manager's word" | test A |
| Validation error shown twice | fixed: inline only | test C |
| On delivery options truncated / relocation | fixed: "T0159 - 19 Oct - VMS × 5 · Relocate" (no year) | test C |
| Phone rows tall, "from the contract" ×22, Change per row | fixed: source blank for contract rows; no Change button on phone | test A/C |
| Board select truncated | fixed: "1211404 - line 1" | screenshots |
| Dark screenshots missing | fixed | `evidence/dark_*` |
| PremAir Hire vs Premiair | **open — question for the project manager**, nothing changed | — |
| Tab-wide fault (not this release): the Equipment tab's skin keeps `fold96` panels white in dark mode while `--ink` follows dark mode, so "Every reference", "Branches" and the other folds are unreadable on a dark-mode phone | **reported, not fixed here** | `evidence/dark_form_laptop.png` shows "Every reference" above the register |

## Checks (all read only; the live record was never written)

Run with `TMPDIR=/dev/shm/v913tmp` and `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (Playwright's own
headless shell is not installed on this machine, and Chromium crashes on large pictures when the temp disk is full). Every
browser run went through the one-browser-at-a-time lock.

- `tests/test_vms_rego913.cjs` — four sessions: A view link (register, every surface, texts, import, orphans), B dark mode,
  C practice editor (form, validation, nothing-changed, one save, Save waits), D another device (incoming record without a
  reload, stale form, 403 refusal). Every write captured in `page.route` and aborted; the harness blocked nothing; a fresh
  GET before and after shows no `vmsboard` document.
  - Laptop **66/66** (`evidence/test_vms_rego913_laptop.log`), phone **66/66** (`evidence/test_vms_rego913_phone.log`), on the
    final build `bdd10c72…`.
- `tests/shots913.cjs` — the T0103 Driver drop card (`evidence/drawer_dropcard_T0103_{laptop,phone}.png`) and the Drivers
  sheet's booked numbers cell (`evidence/drivers_sheet_T0103_laptop.png`, drawn on screen without the print styles). The
  drawer's Delivery card is not drawn open for T0103 by default, so it has no picture; test A checks its markup and computed
  style instead.
- Money (`v8.95_baseplan_07oct_DRAFT/tests/compare_money895.cjs`, A = live v9.18, B = this build), laptop and phone: 4,113
  numbers the same, **0 differ**, 0 structural differences, tie-outs 17/17 on both pages, both reading record 4581; no errors,
  no writes attempted (`evidence/compare_money_{laptop,phone}.log`).
- Sweeps (`toolchain/harness/sweep.js`), laptop and phone: 21 tabs, 0 page errors, 0 console errors, 0 hash errors, 0 blocked
  writes (`evidence/sweep_{laptop,phone}.json`).
- `check_page.py` PASS; the patch refuses to run twice; DATA round-trips; MASTER_LOC and the footer asserted unchanged.

## Open with the project manager (nothing here resolves them)

- **VMS09's asset number:** he confirmed 1211404 is VMS09 (relayed 17:41). The contract also has 1211404 on line 1, on
  T0001 since 7 Sep. Did VMS09 move, or is T0001's number wrong? The page says "asset no. also on … - to confirm".
- **PremAir Hire / Premiair:** his spelling for VMS10 sits beside the contract's "Premiair" (VMS11, VMS18–23). Does his
  spelling apply to all of them? Nothing changed until he says.
- **Regos for every other board:** "not given" until somebody enters one.
- **The VMS plan:** the plan's numbering against the 23 contract lines is still open. Nothing is renumbered.
