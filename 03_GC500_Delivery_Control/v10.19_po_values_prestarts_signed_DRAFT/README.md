# Purchase-order values with the dollar sign, a recorded "checked" tick, people shown without an agent suffix — DRAFT

Author: Andrew Fisher · built 15 Oct 2026 (AEST) · **DRAFT, not uploaded**

## What Andrew asked

Andrew, in Claude's chat, 15 Oct 2026 about 00:31 AEST, with Fencing-tab and Pre-starts screenshots:

> "In purchase orders can we make sure we have a $ in the value. And all others should have a tick as they should all
> been checked the same too please. Fix."

and, about the pre-start rows and generally:

> "dont mention via codex".

## What changed and why

All on the Fencing tab's purchase-order card unless said otherwise. Nothing on the Costs & P&L, Finance handover or
any ledger changes; no rate, quantity or record value is touched by the page release.

1. **The value field shows currency.** The P/O value is a text field with a decimal keypad that shows the recorded
   value as money — `$26,695.00`, `$28,246.50` — instead of a bare `26695`. It stays 110px wide as v10.18 built it:
   the browser test measures that `$50,154.00` and `$28,246.50` fit without overflow, and on a phone 110px is what
   the Value column has at full scroll (see below). When somebody types or pastes a value, the dollar sign, commas and
   spaces come off before the existing "is it a number" check in the Save handler, so `$26,695.00`, `26,695` and
   `26695` all save as 26695; a non-number is still refused with the same message as before. An empty field still
   clears the value.
2. **A recorded "checked" tick.** Andrew's screenshot showed only 4647519 with a tick, because that tick is the
   *computed* supplier-docket reconciliation ("✓ Supplier dockets match P/O"), which only 4647519 has. The other
   orders have been checked the same way by a person, so the page now records that as a fact of its own: a confirmed
   order gets a **Mark checked** button; pressing it records who and when, and the row then shows
   **✓ P/O checked · \<person\> · \<stamp\>** in the P/O cell. The computed supplier-docket line stays exactly as it
   was and shows beside the recorded tick where both exist. The two are different facts: one is arithmetic on the
   supplier's dockets, the other is a named person saying they checked the order.
   - The record field is `checked: {by, at}` on the purchase-order document (`S.purchaseOrders[no].checked`),
     written through the page's own `setPo()` — so it carries `updated_at`/`updated_by` and the usual write gate,
     and needs a name in "Recording as". `poAll()` now layers `checked` through from the committed and local records
     like the other typed fields.
   - **Mark checked** only shows on a confirmed order with no recorded check; it disappears once the check is recorded.
     On the public view link it is hidden exactly as Save is (`body.viewonly [data-po-check1019]`, beside the page's
     own `body.viewonly [data-po-save]` rule), so a reader of the view link sees the recorded tick but no button.
3. **People shown without an agent suffix.** Where an entry was typed through an assistant, the record's
   `by`/`updated_by` carries the person's name with a "via <assistant>" suffix (25 of the 42 pre-start documents and
   three of the purchase orders on the live record today). The page now shows the person only — "confirmed by Andrew
   Fisher" on the P/O rows, "· Andrew Fisher" on the pre-start rows, and on the new checked line. The record itself
   is not changed; only what is shown. The strip is generic — a trailing "via <anything>", with or without brackets,
   any case — so the page's code names no assistant. A string that is nothing but the suffix is shown as it was,
   so nothing recorded disappears.
4. Footer `v10.18` → `v10.19`.

The Finance handover's purchase-order rows (`fh866Html`, `data-fh866-row`) show the supplier name only, never a
person, so nothing there needed the person-words change; the patch leaves that table untouched and the guard test
proves it.

## Files

- `po_prestart1019.js` — `personWords1019(s)`, `poParseMoney1019(s)`, `poCheckedBlock1019(o)` (the recorded tick),
  `poCheckButton1019(o)` (the Mark checked button) and a small style installed once (`.po-checked1019 b` green,
  `.po-checked1019 .w` 11px muted, `.po-check1019` 4px above, and the view-only rule). First line: the author comment.
- `patch_v1019.py` — `BASE_SHA` guard (exact live v10.18 only; refuses a repeat or any other input), inserts the
  source above `poLabel1014`, then nine `rep()` replacements (each must match exactly once).
- `tests/test_patch1019.py` — source guards (40 checks).
- `tests/test_v1019.cjs` — read-only browser checks on the built page at the live address (31 checks).
- `tests/shot_po1019.cjs` — the phone/desktop screenshots and layout measurements.
- `tests/sweep_desktop1019.json`, `tests/sweep_phone1019.json` — the two standard sweeps on the candidate;
  `tests/sweep_desktop_base_v1018.json` — the same desktop sweep on the untouched live v10.18 page, for comparison.
- `tests/po_phone.png`, `tests/po_phone_value.png` (scrolled to the Value column), `tests/po_desktop.png` — the card
  as an editor sees it (the harness opens the public view link, which hides Save and Mark checked, so the shot
  script takes the body's `viewonly` class off first; nothing is written). `tests/po_desktop_viewonly.png` — the
  public view link as it is: the values with their dollar sign, no buttons.
- `tests/test_v1019_result.json` — the browser test's check-by-check record.

## Anchors and placement — where this differs from the brief

- The insertion anchor is the two lines `/* Author: Andrew Fisher. P/O labels read ... */` + `function
  poLabel1014(number) {`, so the v10.14 author comment stays with its own function. The source still lands
  immediately above `poLabel1014`.
- `${poSupplierBlock1014(o.number)}` alone appears twice (the Fencing card and the Finance handover row), so the
  Fencing anchor carries the "added here" chip that follows it, which is only on the Fencing card.
- **The Mark checked button sits in the P/O cell, not the actions column, and is the page's small button
  (`btn sm`).** The brief put a full-size button after Save. The phone geometry decided otherwise: on a 390px phone
  the card's table is 348px wide, the sticky P/O column 121px and the Save column 97px, so at full scroll the Value
  column has 120px. A second button beside Save (≈ 195px for the pair) left the value reading ".00"; stacked, or
  full-size in the P/O cell, it widened the sticky column to 138px and the value read "992.00" (both runs are
  measured in `shot_po1019.cjs`'s output). In the P/O cell as a small button it takes the place the "✓ P/O checked"
  line will occupy once pressed, the sticky column keeps its 121px, and the actions column and the value field stay
  exactly where v10.18 built them. The handler is where the brief put it, in `wirePoCard` before
  `const add = pane.querySelector('#poAdd')`.
- **The value field is not widened to 130px.** With the 110px field the phone has 10px to spare at full scroll;
  at 130px it sits 10px under the sticky column even without any button. The real values fit in 110px (measured).
- The brief's `esc(money(Number(o.amount)))` is `esc(money(Number(o.amount)) || o.amount)`: `money()` returns null
  for a non-finite value, and a rule on the page never hides a record.
- `rep()` takes a line's leading space with its match (as in every earlier release), so a few patched lines lose
  one space of indentation. Harmless; the guard test compares with whitespace folded.

## Hashes

- Base: live v10.18, SHA256 `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d`, 15,286,087 bytes.
  `toolchain/build.sh` re-fetched it on 15 Oct 2026 and it matched.
- Candidate: `build/GC500_v10.19/GC500_Delivery_Control_hosted.html`, SHA256
  `c7e698c9c4e42f3d00088383e4bb032e5ccfd296907900ec888a8f1440e07679`, **15,289,044 bytes**, 119 inline scripts;
  `check_page.py` PASS (every script parses, no new keys, author line present); the attribution scrub changed nothing
  (the patch output and the scrubbed build are byte for byte the same).
- Three earlier candidates from the same base were superseded by the phone screenshots before any check was recorded
  here: `1bc065ff…` (full-size button in the actions column; the value field read ".00" at full scroll),
  `258e39e7…` (button moved to the P/O cell, but shown on the view link) and `079839d7…` (hidden on the view link,
  but the 130px field and full-size button still put "$8," under the sticky column at full scroll).

## Checks (all read-only; the harness aborts every write the page tries)

```
cd 03_GC500_Delivery_Control
toolchain/build.sh v10.19 v10.19_po_values_prestarts_signed_DRAFT/patch_v1019.py
python3 -I v10.19_po_values_prestarts_signed_DRAFT/tests/test_patch1019.py build/GC500_v10.19/base_live.html
PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node v10.19_po_values_prestarts_signed_DRAFT/tests/test_v1019.cjs
PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js > .../tests/sweep_desktop1019.json
MOB=1 PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js > .../tests/sweep_phone1019.json
PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node v10.19_po_values_prestarts_signed_DRAFT/tests/shot_po1019.cjs
```

Results on the candidate `c7e698c9…` (15 Oct 2026, read-only harness at the live address, live record as it stood):

- `test_patch1019.py` — **40/40 PASS**: exact v10.18 base accepted; a repeat and a changed source refused; every anchor
  found once in the source and every replacement present once in the candidate; source inserted once, immediately
  above `poLabel1014`, author line first; footer `v10.19`; `setPo`, `poSupplierBlock1014`, the Finance handover P/O
  row and its amount editor unchanged byte for byte; `poAll` changed only by the `checked` field; the actions column
  (Save / Confirm) untouched; one P/O value editor and it is a text field; no assistant names in the page source.
- `test_v1019.cjs` — **31/31 PASS** (`tests/test_v1019_result.json`): 4647517 shows `$26,695.00`, 4647519
  `$28,246.50`, 4647520 empty; the field is a 110px text field with a decimal keypad and `$50,154.00` / `$28,246.50`
  fit without overflow; `poParseMoney1019('$26,695.00') === '26695.00'` and `Number(...) === 26695`, an empty field
  stays empty, a non-number still fails the Save check; `personWords1019` strips the suffix in all its spellings and
  leaves "a person", "Olivia Smith" and blanks alone; the live card renders with Mark checked on exactly the five
  confirmed rows (4647508, 4647509, 4647515, 4647517, 4647519), none on the unconfirmed 4647520, the button in the
  P/O cell with the actions column holding only Save / Confirm, hidden on the view link exactly like Save; 4647519's
  row says "confirmed by Andrew Fisher" with no suffix although the record carries one, and still shows
  "✓ Supplier dockets match P/O"; no suffix anywhere on the card; the style installed once. In memory only, a
  `checked` on 4647517 layers through `poAll`, the re-rendered row shows "✓ P/O checked · Andrew Fisher · 15 Oct
  10:40" with no suffix, 4647519 keeps its computed match beside it, Mark checked leaves the checked row and stays on
  the other four, and the record is restored afterwards. The Pre-starts tab renders 44 rows from 42 documents (25 of
  them recorded with a suffix) with no "via Codex" or any other suffix in its text, shown or folded, and still names
  the person. No page errors; the harness aborted nothing because the page attempted no write.
- Desktop sweep (`sweep_desktop1019.json`) — **22 tabs, `allErrors` empty, no tab or `go()` errors, the seven deep
  links and Back as expected, 0 blocked requests.** `cons` holds 61 entries, every one a 404 for a map-explorer tile
  file (`/w/Coates-GC500-2026/explorer/assets/vt/L*.bin`). The same sweep on the untouched live v10.18 page
  (`sweep_desktop_base_v1018.json`) gives the same thing: 74 entries, all the same tile 404s. They are the live page's,
  not this patch's, which touches no map code.
- Phone sweep (`sweep_phone1019.json`, 390×844) — **22 tabs, `allErrors` empty, no tab or `go()` errors, deep links
  and Back as expected, 0 blocked requests**; `cons` 59 entries, all the same tile 404s.
- Screenshots (`shot_po1019.cjs`): phone 390×844 — the page never scrolls sideways (390 of 390); the card's table
  scrolls inside its 348px wrapper; sticky P/O column 121px on the view link, 125px as an editor (the small button);
  at full scroll the 110px value field is wholly in view and clear of the sticky column (1px to spare) with its
  text fitting; Mark checked 103px wide and in view. Desktop 1440×900 — the whole table fits (1368 of 1370), rows
  142px as an editor, 97px on the view link. Looked at all four: nothing clipped, nothing wrapped oddly.

The same checks were run on the two superseded candidates and are what caught the clipping; the files in `tests/`
are from the final candidate only.

## What is left

- **Publication** by the token holder: `python3 toolchain/upload_page.py build/GC500_v10.19/GC500_Delivery_Control_hosted.html`
  (needs `GC500_EDIT_TOKEN`; it refuses if live has moved off `2d09fa44…`, in which case rebuild and rerun the checks
  above). Then rename this folder to `_LIVE`, add the LIVE time here and update `STATUS.md`.
- **The native write** setting `checked` on 4647508, 4647509, 4647515 and 4647517 by Andrew Fisher is a separate
  record operation on the edit link (backup first, through `setPo()` / the page's own Mark checked button, fresh read
  after) — it is not in this patch. Until it is done, those rows show Mark checked and no tick; 4647519 keeps its
  computed supplier-docket tick and also offers Mark checked.
- The pre-start PDFs and the replacement of the 25 "Retrospective prefill — unsigned" files are a separate piece of
  the same claim on `STATUS.md`, not part of this page release.
- Nothing was committed, pushed, uploaded or written to the service from this build.
