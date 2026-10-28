# Bounded ruled-contract corrections — v12.54

Author: Andrew Fisher

CHECKED for the bounded financial release, with the inherited phone-table limitation below. The READY entry on STATUS.md names the frozen source commit and exact candidate. This file is not a live-release claim.

This smaller release follows the scoped movements in PR1 handovers6481196253 and6481372848. It applies seven named existing source cells, four unmatched source-only additions, the approved sewer-cleaning customer zero, and the release footer. The source cleaning Price/Quantity stay intact; the customer decision is explicit. Zero-rated laser/stillage source lines stop appearing unpriced. PG29 is already charged and is not added again.

The new source rows do not allocate physical units or infer bookings, arrivals, departures or completion. Existing unruled source rows, records, styling, physical quantities, supplier costs and branch cost allocation are preserved. Installation, Cleaning and per-piece fire projections remain exactly as the predecessor carries them. Installation/per-piece coverage, event labour and fire removal are the separate55 draft; later contract rulings are queued there or a later bounded release. This is not a complete Baseplan9 import.

## Exact build

- Predecessor50.1 SHA256: `69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2`,16,099,841 bytes.
- Candidate54 SHA256: `378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c`,16,105,875 bytes.
- Shared live-base build reproduces the tested candidate exactly. The patch rejects a different predecessor or duplicate application.

From the repository root:

```bash
GC500_V1254_BASE_SHA256=69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2 \
bash 03_GC500_Delivery_Control/toolchain/build.sh v12.54 \
  03_GC500_Delivery_Control/v12.54_ruled_contracts_DRAFT/patch_v1254.py
```

`source_movements.py` is the bounded production source patch. `finance_patch.py` and `settled_finance1254.js` apply one customer-zero projection to contract and servicing readers. The earlier `source_adapter.py` is preparatory only and is not called by this release.

## Validation

- 26 Python source, adapter and exact-boundary tests pass, including private exact-predecessor tests. The full-source adapter accounts for15 of these and is not release-import acceptance.
- 12 customer-zero preservation checks pass.
- 217 inline scripts parse; no new keys or edit key; original style blocks are exact.
- 1,055 native checks pass on identical pinned state11847 and time: independent expected ledger/branch movements, complete source boundaries, Finance/monthly ties, original supplier/Direct costs, record documents and physical projections.
- Shared live-base rebuild equals the tested candidate. Fresh22:03UTC record is byte-identical to the pinned snapshot.
- Desktop and phone shared sweeps:27 routes,seven deep links and Back match the predecessor;zero runtime/console errors or operational writes.
- Actual phone controls and screenshots inspected; focused approved-zero wording/source-treatment/re-entry and complete model/document checks pass with an inherited amount-visibility limitation. The first pinned table column obscures monetary text during horizontal scrolling on both exact50.1 and54. No complete numeric visibility pass is claimed. Separate54.1 owns the scoped mobile repair; this is not caused by the54 financial calculation changes.
- Independent read-only implementation review found no release-blocking source/calculation or preservation issue.

```bash
SOURCE_PAGE=/private/exact50.1.html BASE=/private/exact50.1.html \
python -m unittest discover -s 03_GC500_Delivery_Control/v12.54_ruled_contracts_DRAFT/tests -p 'test_*.py' -v
node 03_GC500_Delivery_Control/v12.54_ruled_contracts_DRAFT/tests/settled_finance.cjs
```

`tests/native_contracts.cjs` requires explicit `BASE`, `CANDIDATE`, `CANDIDATE_SHA`, private `STATE`, private `EXPECTED`, and private `OUT`. EXPECTED must be independently reviewed, pin both page hashes and the record hash, and list source edits/additions, line results and ledger/branch deltas. `CAPTURE_ONLY=1` records diagnostics without acceptance. `tests/phone_contracts.cjs` requires exact PAGE/PAGE_SHA, private STATE/OUT and MOB=1. Its inherited-limit path additionally requires private BASELINE_VISIBILITY from exact50.1; it does not waive an unexplained new visibility failure. Keep originals, snapshots, expected monetary manifests, native outputs and screenshots private. Run browser tests serially under `/tmp/gc500-browser.lock`.

## Publication handover

Codex implements/tests and independently verifies; Claude publishes the frozen READY source through the shared guarded uploader and owns operational writes. Rebuild exact bytes, check the current record against the tested one, rerun affected native checks if documents changed, and confirm the same-record financial movements without duplicating existing charges. Upload only after STATUS.md says READY TO UPLOAD. The uploader must refuse a changed live predecessor and read the complete public candidate back byte for byte. A later independent public read-back is required before reporting independent verification.

Previews51/52/53 retain their separate visual/access gates. This release does not certify every contract or resolve the separate record-provenance review.


## LIVE

LIVE 29 Oct 2026 08:55 AEST (Claude publication). Exact rebuild from frozen `d2c012fd` on the verified live50.1 `69bf04e7…` reproduced the tested candidate `378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c`, 16,105,875 bytes; money probe on the same record: Hire Revenue +$1,868.54, Transport Revenue +$600.00, Toilet Pumpouts −$6,246.00, charge $1,011,296.03 → $1,007,518.57, costs unchanged, KINP +$2,468.54, other branches unchanged; guarded upload (live page unchanged since the build started, record 11946); public read-back byte for byte identical.
