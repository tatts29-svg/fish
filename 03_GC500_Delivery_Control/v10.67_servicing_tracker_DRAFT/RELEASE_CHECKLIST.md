# Servicing page release and first setup

Author: Andrew Fisher · 18 Oct 2026

The v5.90 server prerequisite is verified live in the current STATUS.md. The page software can ship with no tracker
or contact configured. Its empty state says no tracker has been published, and **Manage servicing tracker** exposes
the setup form. Boot, refresh and opening the form never publish a tracker. A contact is required only when the
operator deliberately creates one. Physical paper checks are a rollout step, not a blocker to publishing the page code.

## Exact build boundary

`tests/test_build.py` compares the candidate with the exact base and current patch output. It allows one existing
script to change: the native main script (index 4 in the current base), for the guarded REST methods and version
footer. It allows one new `svc1067-script` and one new `svc1067-style`. Every other existing script, style and embedded
`DATA` value must remain byte-identical. The embedded card template/data must exactly match the current card builder.
Wrong predecessors and repeated application are refused. Standard attribution scrubbing must leave the final page
unchanged. The card author metadata is encoded without changing its decoded text so the publisher does not replace it.

The current source builds `6ae970ca79aea9b198aa93042d1a81ceea1589e404f66f552da70351d6967387`, 18,465,214 bytes,
on v10.66 candidate `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.
The patch pins that exact predecessor SHA-256. The author-metadata encoding leaves the decoded crew template unchanged
through the standard publisher scrub. `tests/build_results.json` records all ten boundary checks. Final actual-page/native
server integration passes 22/22 with an inspected phone screenshot; `tests/actual_page_results.json` binds it to these exact
bytes. Both final sweeps pass (24 panes, seven exact deep-link destinations and Back, no errors or attempted writes);
see `tests/sweep_results.json`.
Do not label this as a live-base build before v10.66 is live.

## Publisher commands

Run from `03_GC500_Delivery_Control/` after the final v10.66 is verified live. Use the existing private credential
binding; never put its value in a command or file. The standard build fetches the live predecessor and saves its bytes.

```sh
bash toolchain/build.sh v10.67 v10.67_servicing_tracker_DRAFT/patch_v1067.py
python3 v10.67_servicing_tracker_DRAFT/tests/test_build.py build/GC500_v10.67/base_live.html build/GC500_v10.67/GC500_Delivery_Control_hosted.html
node v10.67_servicing_tracker_DRAFT/tests/test_panel.cjs
node v10.67_servicing_tracker_DRAFT/tests/test_admin.cjs
```

If the base differs from the recorded development base, rerun `tests/test_actual_page.cjs` on the new candidate with
the final server source. It needs private `PAGE_FILE`, `GC500_FIXTURE` and `GC500_CACHE` paths; its disposable localhost
store is the only write destination. Preserve its strict whole-state and byte-identical-record assertions. Inspect its
phone screenshot. The current test cannot establish an actual live read-back because it intentionally serves a local page.

The exact candidate has already passed both navigation sweeps. If the guarded build produces different bytes, rerun
the affected integration and both sweeps serially under the shared browser lock. The commands are:

```sh
flock /tmp/gc500-browser.lock env PAGE=build/GC500_v10.67/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
flock /tmp/gc500-browser.lock env MOB=1 PAGE=build/GC500_v10.67/GC500_Delivery_Control_hosted.html node toolchain/harness/sweep.js
python3 toolchain/upload_page.py build/GC500_v10.67/GC500_Delivery_Control_hosted.html --dry-run
```

After the final checks pass and the exact source is handed over READY on the board, the named release owner runs the
same uploader without `--dry-run`. Never bypass the base guard. Record its exact public-byte read-back, then check the
public view remains read-only and the edit-link empty/setup state is usable without creating any test operational data.
The dependent v10.68 patch starts from that exact v10.67 page; it must preserve the servicing script and card template.

## Setup evidence and remaining operator input

The current live record (9704), card inventory, latest handover/reviews and tracker source were checked on 18 Oct.
There is no published servicing tracker and no stored contact explicitly nominated for it. Existing driver-card
contacts do not establish who should receive servicing calls. Enter the confirmed name/mobile in the private setup
form; neither is invented or embedded in the public source.

T0024 uses two distinct, supported facts: workbook servicing group **area 1**, and the master-plan **SUPPLY-compound
location**. The latter controls its map. Seven references with no verified pin retain “ask on site”; the software does
not fabricate coordinates or a location QR. The existing edit-only progress contract is retained. Broader view access
is optional future scope, not a required decision for this release.

Create TEST deliberately, check it, then deliberately create the event tracker with the contact and site confirmations.
Download the private QR bundle only after “saved and read back”. The bundle contains the exact published data/contact,
so print generation cannot silently substitute TEST days or another source list. Follow the print README for the matching
readiness receipt and actual iPhone/Android paper scans before making the real laminated pack. No physical scan is claimed
by the automated software checks.
