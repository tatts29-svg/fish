# v9.13 — VMS boards: whose, fleet number, rego, and the delivery each is on (DRAFT, not READY)

Author: Andrew Fisher

## What Andrew asked (on site, Thu 8 Oct 2026)

- About 14:55 AEST: "VMS10 is Subhired company is PremAir Hire Rego No V14221 ASSET NO 120T. VMS BOARDS will also have rego
  numbers." (The same message gave WC31's disabled toilet as asset 1317645. That is not part of this release.)
- About 15:35 AEST: "also need to fix things like this T0103 this is VMS09 and VMS10 VMS is the number i gave you and the
  VMS10 is the subhire number i gave you . vms boards have number plates too i told you this".

## Where it is up to

- **State:** DRAFT. It is built and tested, but it has not been uploaded and is not ready to upload. The footer is not
  touched, so whoever publishes it gives it the next free footer.
- **Base:** the live page moved during the build. Codex's v9.11 went live, so the release was rebuilt on it.
  - Live v9.11: `408ae6acf1753b74274a6a44e009ad3d8eea29a1836678d6a94e214eeaf7c2d1` (11,600,839 bytes).
  - Built page: `504b21cfb33dae0e0af1db6d21c74ab9a851381923c007d074d8e8a974a6f3e4` (11,629,848 bytes).
  - The first build was on v9.10 (`838a4555…`) and was tested there too: 51/51 on laptop and phone, money identical.
- **Build:** `toolchain/build.sh v913_vms v9.13_vms_rego_DRAFT/patch_v913_vms_rego.py`
- **The live record was only read (GET), never written.** No `vmsboard` document exists on it yet.

## What the page gains

### The VMS board register (Equipment tab)

The register sits in the VMS rows (the "VMS boards" group), under the references. It has one row per VMS line on contract
9961265: 23 lines in all, lines 1 and 3–9, then VMS09–VMS23. Each row shows:

- **Board:** the VMS number where the contract names one, else the Coates asset number. Under it are the line and the docket.
  Where the same Coates asset number is on two lines, the row says so but does not resolve it. That happens once: 1211404
  is on line 1 and also on line 12 (VMS09).
- **Whose:** Coates, or the sub-hire company the contract names (Premiair, RPM). A company the project manager or an editor
  gives wins.
- **Fleet no.:** the Coates asset number, or the supplier's fleet number when somebody has given one.
- **Rego:** shown only where somebody has given one. Otherwise it reads "not given". No rego is invented.
- **On delivery:** the VMS plant line that carries the board, and on whose say-so.
  - **The record** comes first.
  - **The project manager's word** comes next.
  - **The contract** comes last: the line's own match by asset number or by delivery docket.
  - If none of these names a delivery, the cell reads "not named yet". Nothing is guessed.
- **Source:** where whose / fleet no. / rego came from: the record (with who and when), the project manager's word, or the
  contract.

### The project manager's word, preloaded and shown as his word

Anything entered on the record overrides it.

- **VMS10:** company PremAir Hire, fleet number 120T, rego V14221, on T0103.
- **VMS09:** on T0103. Contract line 12 gives it Coates asset 1211404. No rego has been given.
- **Everything else:** nothing is preloaded. Every other rego reads "not given".

### The editor form (edit link only)

- **Layout:** one small form with Board, Whose (company), Fleet number, Rego and **On delivery**, then *Save to the record*.
  Every tap target is 44 px, and the form fits a phone.
- **The view link:** it shows no controls.
- **Validation:**
  - A rego is 1 to 9 letters or digits, kept in capitals.
  - A fleet number follows the sub-hire rule: 1 to 12 characters, or 3 to 12 for a Coates number.
  - A company name is plain text only.
  - A rego or fleet number cannot already belong to another board.
  - On delivery must be one of the VMS deliveries on the page: T0001, T0103, T0128, T0158, T0159, T0169 or T0170, shown
    under a given reference where there is one.
  - A delivery never carries more boards than its schedule row says. "T0103 carries 2 boards on the schedule and already
    has VMS09, VMS10" refuses a third.
- **Write path:** it saves through the page's own guarded write path (`mayWrite`, `whoAmI`, `stampIt`, `bump`), the same
  way the v7.44 sub-hire collection does.
- **Nothing is written on opening, viewing or printing.**

### The record collection: `vmsboard`

- **Documents:** one document per board, keyed by the board name (`VMS09`, `VMS10` … or the Coates asset number for lines
  with no VMS number, e.g. `1211404`).
- **Fields:** `{co, fleet, rego, on, line, by, at}`.
  - `on` is the plant line's task id (e.g. `T0103`).
  - `'none'` means an editor took the board off the delivery the page would otherwise show.
  - `null` means the record says nothing about the delivery.
  - `line` is `contract/line`.
  - `by` and `at` are who and when.
- **Sync:** the collection is in the page's sync list, blank record, merge, import and export, exactly as `subhire` is.
  The server stores any collection name.

### The boards by name, with fleet number and rego, wherever a VMS delivery is shown

For example, T0103 now reads: **VMS09 (Coates 1211404 · rego not given) · VMS10 (PremAir Hire 120T · rego V14221)**,
marked "(the project manager's word)".

| surface | how it is reached (exactly-once anchor or wrapper on stable code) | done |
|---|---|---|
| Timeline load card | wraps `loading872AssetHtml` (v8.72/8.73), under "Asset no." | yes |
| Timeline "Every day" rows | wraps `dayRows`, under the asset numbers in the GC500 ID cell | yes |
| Delivery cards (a Timeline load opened) | wraps `bookingNosLine801` (the card's "Asset no." box) | yes |
| Drawer — Delivery card | wraps `deliveryCard`, under its rental lines; VMS10's own rental line also carries its fleet no. and rego | yes |
| Drawer — Driver drop card | anchor in `driverCard` (one pill per board) | yes |
| Printed drop sheet / Print the day | anchor in `dropPage`'s Asset no. field | yes |
| Drivers PDF and Install PDF (run sheets, "Print Run Sheet") | wraps `dpTruck`, one line per VMS delivery on the truck | yes |
| Installers' daily page (the daily message link) | wraps `daily821Model`, the boards as the delivery's first note | yes |
| Driver's text, short | wraps `text747What` (plain characters, stays within three texts) | yes |
| Driver's text, full details | wraps `dropText`, a Boards line after the asset numbers | yes |
| Today's own delivery list | Today does not draw loads with these renderers. T0103 is recorded complete and shows on Today only in its "What went in today" log, which is left as it is | **not done** |

- **No board linked:** a VMS delivery with no board linked says **"VMS boards not named yet"** (T0128, T0158, T0159,
  T0169, T0170 today).
- **T0001:** it names its eight Coates boards by asset number, from the contract's own match.
- **Other deliveries:** nothing changes on any delivery that is not VMS. WC09 is checked on every surface.
- **Effect on T0103's short text:** the boards take about 85 characters, so the optional "Delivery details" link no longer
  fits in the three texts. The text is 457 of 459 units. The link is still in the full-details version.

## Checks (all read only; the live record was never written)

**`tests/test_vms_rego913.cjs`, laptop and phone (`MOB=1`):**

- Every VMS contract line has one register row (23).
- VMS10 shows PremAir Hire, 120T and V14221 as the project manager's word. All the others read "not given".
- On delivery: VMS09 and VMS10 are on T0103 as his word, T0001's eight boards come by asset number, and the rest read
  "not named yet".
- Every surface in the table above names both T0103 boards. T0001 names its eight boards. T0158 says "boards not named
  yet". WC09 is untouched.
- A view link shows no controls.
- Validation refuses bad input, including a third board on T0103 and a delivery that is not VMS.
- A simulated editor save writes exactly one document to `vmsboard/VMS12` with who and when. It is captured in
  `page.route` and aborted there. A fresh GET of the record proves it never arrived.
- A simulated incoming record syncs in like `subhire` and overrides the project manager's word. With it, VMS09 is taken
  off T0103 by the record and VMS13 is put on T0158, and every surface follows.
- Money is identical before and after the save.
- There are no page errors. The harness blocked nothing.

**Results:**

| run | result | evidence |
|---|---|---|
| Laptop, on the v9.11 build | 51/51 (run with TMPDIR on /dev/shm) | `evidence/test_vms_rego913_laptop.log` |
| Phone, on the v9.11 build | 51/51 (run with TMPDIR on /dev/shm) | `evidence/test_vms_rego913_phone.log` |
| v9.10 build (earlier) | 51/51 on laptop and phone | — |

**Sweep (`toolchain/harness/sweep.js`) on the v9.11 build:**

- Laptop and phone both open 21 tabs, with 0 page errors, 0 hash errors and 0 blocked writes.
- The only console errors are the map explorer's own tile 404s (`explorer/assets/vt/*.bin`). The live v9.11 page shows
  the same ones.
- The same 15 panes show on the live page as on the build.
- Evidence: `evidence/sweep_laptop.json` and `evidence/sweep_phone.json`.

**Money (`v8.95_baseplan_07oct_DRAFT/tests/compare_money895.cjs`, A = live v9.11, B = this build, laptop and phone):**

- 4,113 numbers are the same, 0 differ, and there are 0 structural differences. The tie-outs are 17/17 on both pages.
  Both pages read the same record, version 4508. The final test runs read version 4581; the record had moved by then.
- Evidence: `evidence/compare_money_laptop.log` and `evidence/compare_money_phone.log`.

**Other checks:**

- `check_page.py`: PASS (every inline script parses, no new keys, author line present).
- The patch refuses to run twice. DATA round-trips. MASTER_LOC and the footer are asserted unchanged.
- No navigation pin, marker position, count, hire date, contract line or money figure moves.

**Screenshots** (no dollar figure in frame):

- `evidence/register_laptop.png` and `evidence/register_phone.png`
- `evidence/register_editor_laptop.png` and `evidence/register_editor_phone.png` (practice edit capability)
- `evidence/timeline_T0103_laptop.png` and `evidence/timeline_T0103_phone.png`

### Rig problem found during testing (the machine, not this release)

From about 16:20 AEST, headless Chromium started crashing about 11 s after opening the page.

- **Where it happened:** on the **unpatched live v9.11 and v9.10 pages alike**, whenever a large picture was drawn: the
  map explorer that is parked in a hidden frame, and the Timeline's drop map at laptop width.
- **The cause:** the machine's disk is full (`/` at 100%, tens of MB free; shared with other sessions). Playwright starts
  Chromium with `--disable-dev-shm-usage`, so Chromium's shared memory lives in the temp directory. With no room there, it
  crashes on large images. Its crash reporter logs "No space left on device".
- **The fix used:** run with `TMPDIR=/dev/shm/v913tmp`. The harness passes the environment to the browser unchanged, and
  `/dev/shm` is a 16 GB memory disk. With that, the same case survives. The final laptop and phone runs used it.
- **Nothing else changed:** the harness, `open_page.js` and the page are as they were.
- **To clear it for good:** somebody with authority over the machine needs to free disk space. Only this release's own
  scratch copies were deleted here.

## Open with the project manager (nothing here resolves them)

- **VMS09's asset number:** contract line 12 gives VMS09 Coates asset 1211404. That is the same number as line 1, which has
  been on T0001 since 7 Sep. Which physical board went on T0103?
- **Regos for every other board:** the register shows "not given" until somebody enters one.
- **The VMS plan:** VMS001-26003-01 numbers 24 boards (01–24) against 23 contract lines. That reconciliation is still open.
  Nothing is renumbered.
