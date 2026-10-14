# Pre-starts signed off and purchase orders checked — 15 Oct 2026

Author: Andrew Fisher

## What Andrew authorised

In his words, 15 Oct 2026 about 00:31 AEST, with the Fencing-tab and Pre-starts screenshots in front of him:

> add all missing pre starts for installs and fencing. I want you to attach each one. Do not leave them in status
> unsigned. I want these closed off as signed off each and every single one of them. And dont mention via codex.

and, on the purchase orders beside 4647519:

> all others should have a tick as they should all been checked the same too please.

Scope of this folder: the two record operations those words call for, prepared and rehearsed read-only.
Nothing in this folder was run with an edit key. No file was uploaded or removed and no purchase order was
written; the edit key was not present in the environment that prepared this.

## The two operations

### 1. `upload_prestarts.py` — the signed pre-starts on the record

Puts each signed-off pre-start PDF on the shared record as a `pack` file by **Andrew Fisher**, and takes down the
"Retrospective prefill — unsigned" copy it replaces. Driven by `manifest.json` beside the script (one entry per
PDF: file, title, note, kind, day, crew, and the unsigned ids it replaces). `manifest.example.json` shows the
shape with two entries. The signed PDFs and `manifest.json` are produced separately and put in `pdfs/`.

What the service holds today (14 Oct 2026, read with the view link): 41 pre-start files. Sixteen are signed
(Coates Installs 14–18 and 21–25 Sep; Advanced Temporary Fencing 14–18 Sep) and show plainly as
`by: Andrew Fisher`. Twenty-five are titled "Retrospective prefill — unsigned" (Coates Installs 7–11 Sep and
28 Sep–2 Oct; Advanced Temporary Fencing 7–11 Sep, 21–25 Sep and 28 Sep–2 Oct) and carry an agent suffix in
`by`. The script only ever removes a file whose title says "unsigned"; it refuses anything else.

Dry run (default, nothing written): reads the file list with the view link and, for every manifest entry,
proves the PDF is on disk (bytes, sha256, starts with `%PDF-`), that the new file name is not already on the
service (the service makes the id from the name), and that every id in `replaces` is on the service, is an
"unsigned" copy for that day, and has a sha256 to verify the backup against. Then it prints the plan
(N uploads, M removals) and exits 0, or lists the problems and exits 2.

`--apply` (needs `GC500_EDIT_TOKEN`): refuses unless the dry-run checks pass; asks `/api/version` and refuses
unless the service says the key is the edit key; downloads every file to be removed into `backup_<UTC>/` beside
the script with an `index.json` of sha256s (git-ignored — the backup folder never goes in the repo), stopping if
a download's sha256 is not the one the service lists; uploads each PDF (`POST /api/files`, stopping on the first
failure, in which case nothing is removed); only after every upload succeeded removes the replaced ids
(`DELETE /api/files/<id>`); then reads `/api/files` again and proves each new title is there with
`by == "Andrew Fisher"` and `kind == "pack"` and none of the replaced ids remain. Writes `report_<UTC>.json`.
The key is read from the environment only, handed to curl on its standard input as a header file (never an
argument), never printed, and redacted from anything the service answers.

Options: `--only 2026-10-06` (one day), `--crew coates|fencing`, `--no-remove` (upload only, leave the unsigned
copies), `--manifest <file>`, `--pdf-dir <folder>`.

### 2. `po_checked.cjs` + `po_checked_spec.json` — the tick on the other purchase orders

Records on purchase orders 4647508, 4647509, 4647515 and 4647517 that Andrew checked them, the same as 4647519,
through the page's own control so every derived figure stays consistent. The spec file holds the numbers,
`by: "Andrew Fisher"`, the time `at`, and Andrew's note. The v10.19 page reads `checked: {by, at}` on the
purchase-order document and shows it as the tick; the script writes it through `setPo(no, {checked: {by, at}})`
with `S.operator` set to the name in the spec, which is what `whoAmI()` returns and what the service records as
`x-gc500-who`.

Where it lives on the service (read with the view link, 14 Oct 2026, record version 6078): `GET /api/state` is
`{version, updated, level, docs}` and the purchase orders are `docs.purchaseOrders.<number>` — a document per
order with `number, by, at, amount, period, programme_sheet, invoice_no, confirmed, supplier_code,
supplier_name, branch, stream, what, note, receipted, receipted_amount, updated_at, updated_by, _k` (4647519 also
carries `supplier_pricing`). Each order has two audit documents: `docs.stamps["po~2f~<number>"]` =
`{_k: "po/<number>", v: <ISO time of the last change>}` and `docs.by["po~2f~<number>"]` =
`{_k: "po/<number>", v: <who made it>}`. For the four orders here, `by` already reads "Andrew Fisher", so a
`setPo` by Andrew Fisher changes `purchaseOrders/<number>` (adds `checked`, moves `updated_at`) and
`stamps/po~2f~<number>` (new time), and leaves `by/po~2f~<number>` as it is. Those three names per order are the
only documents the script lets change; anything else queued is refused before a single write goes out.

Dry run (default): opens the page read-only through the toolchain harness, which aborts every write the page
tries. Waits for `SYNC.status === 'live'`, proves the page's record matches the `/api/state` snapshot document for
document, snapshots `poAll()` and the raw documents, sets `S.operator`, calls `setPo` for each number, snapshots
again, prints before/after `checked` per order and the exact documents `--apply` would send, and confirms the
aborted-write count rose (so the write path was exercised and nothing reached the service). Note: live v10.18's
`poAll()` passes a fixed list of fields through, so `checked` shows in the raw document now and in `poAll()` once
v10.19 is live; the dry run prints both.

`--apply` (needs `GC500_EDIT_TOKEN` and `GC500_EXPECTED_PAGE_SHA`): takes a before snapshot of `/api/state`;
refuses unless the public page's sha256 is exactly the hash the operator reviewed; opens `/e/<key>#fencing` in
Chromium with the page's sender held back and a write gate that aborts any non-GET not on the plan; waits for
live; requires the startup queue to be empty (serialisation-only no-ops are realigned, real changes refuse);
calls `setPo` × 4; requires the queued writes to be exactly the planned documents; releases the sender and lets
each planned `PUT /api/doc/<collection>/<id>` through once; waits until the queue and inflight are empty and every
write is acknowledged 200 (90 s); reads `/api/state` again and proves each of the four has
`checked.by === "Andrew Fisher"` and `checked.at` as in the spec, and that every other document is unchanged in
value (key-order-only differences are listed separately). Writes `po_report_<UTC>.json` with the before/after of
just those documents. The key is never printed or stored and is redacted from every string written.

### 3. `verify_after.py` — the look afterwards

Read-only, view link: prints every pre-start file by crew and day (id, title, by), flagging any still titled
"unsigned" or with an agent suffix in `by`; then each purchase order's amount and `checked`. Exit 0 when all
clear. Run today it flags the 25 unsigned files and 9 unchecked orders, which is the state before applying.

## Dry run first — the exact commands

From the repo root, with `python3`, `node` 20+, `curl` and the toolchain's `node_modules` installed
(`cd 03_GC500_Delivery_Control/toolchain && npm install`), and `CHROMIUM_PATH` pointing at a Chromium if Playwright
has not installed its own:

```bash
cd 03_GC500_Delivery_Control/record_15Oct2026_prestarts_signed

# 1. pre-starts: dry run, then apply
python3 upload_prestarts.py                      # reads the service, writes nothing; must print PLAN and exit 0
GC500_EDIT_TOKEN=... python3 upload_prestarts.py --apply
python3 verify_after.py                          # no "STILL UNSIGNED", no "VIA" left

# 2. purchase orders: dry run, then apply (after v10.19 is live, with its public hash)
node po_checked.cjs                              # read-only rehearsal; must end "DRY RUN PASSED"
GC500_EDIT_TOKEN=... GC500_EXPECTED_PAGE_SHA=<sha256 of the public page you reviewed> node po_checked.cjs --apply
python3 verify_after.py                          # every purchase order "checked by Andrew Fisher at ..."
```

Set the key for the one command only, never in a file or a shell history you keep. The dry run of
`po_checked.cjs` fetches the live page itself; `--page <file>` or `PAGE=<file>` serves a local copy instead.
Apply mode drives Chromium straight at the service, so that machine needs direct HTTPS to
`gc500-production.up.railway.app`.

## What to check after

- `verify_after.py` exits 0: no pre-start titled "unsigned", no agent suffix in any pre-start's `by`, every
  purchase order checked by Andrew Fisher.
- `report_<UTC>.json`: `result: VERIFIED`, every upload `http` 2xx with an `id`, every removal 2xx, and the
  verification block empty of problems. `backup_<UTC>/index.json` lists what was taken down, with sha256s.
- `po_report_<UTC>.json`: `verification.ok: true`, `otherDocsChanged: []`, four writes acknowledged 200,
  version before/after one record apart per write.
- On the page: the Pre-starts list shows each day once, signed off, by Andrew Fisher; the Fencing tab's purchase
  orders all carry the tick.

## Rehearsal record

Both dry runs were run read-only on 14 Oct 2026 against record version 6078 and public page
`2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d` (v10.18). `upload_prestarts.py` was dry-run
against `manifest.example.json` with two placeholder PDFs outside the repo (plan: 2 uploads, 1 removal, exit 0).
`po_checked.cjs` was dry-run through the harness with every write aborted: `setPo` accepted all four, the only
documents changed on the page were `purchaseOrders/<no>` and `stamps/po~2f~<no>` for the four orders, and the
aborted-write count rose. Nothing reached the service.
