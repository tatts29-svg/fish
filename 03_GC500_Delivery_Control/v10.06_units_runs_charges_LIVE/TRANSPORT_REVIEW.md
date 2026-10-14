# Received transport charges

Author: Andrew Fisher

Implementation and focused checks complete; root owns final integration, full release checks and publication.

`patch_transport1006.py` applies after the charge patch. It moves the received share of existing, uncovered card delivery and pickup Revenue into actual charges. Undelivered quantities remain forecast. Existing contract transport is counted once and still displaces card charges; shared package coverage is allocated once across units and legs. Carrier Direct costs and physical pickup records are unchanged.

The same split feeds Costs, P&L, branch totals, Finance handover, October invoice preparation, Transport rows/CSV and reference charge details. Hire Revenue subtracts only transport already in the contract total. Reference transport quantities show received scope. A charge inclusion does not claim a pickup, clean, invoice or Finance posting happened.

Validation: pure tests cover partial/full/no arrival, both legs, shared contract coverage, held/excluded/included items, branch totals, rounding conservation and unchanged input. Read-only browser validation passes the 14 P&L/Transport ties, Finance handover checks, Revenue stream sums, Transport table/CSV line sum and October allocation against one model, with zero page errors and zero attempted writes. The page source check passes. Detailed live-record output remains private in `/workspace/private-gc500-unit1006/transport-validation.json`.

GN20 delivery and pickup have separate editable customer rate fields under its arrived charges. Both stay blank/POA until entered. Save uses one native `loads` document with recorder, timestamp and revision history; the document/quantity/branch/source tokens reject stale forms. Entered rates feed the same Transport model and existing coverage, never a second cost line. Clearing a rate restores POA; an explicit zero is a priced zero. Shared acknowledgement is shown only after the native shared record confirms it. Input text is dark on white and the Save button remains visible. The idle-refresh module preserves unsubmitted edits and marks them unsaved.

Native editor tests pass 21 checks: separate rates increase actual Transport Revenue, NVAC, whole-job Transport and October preparation once; Hire Revenue and carrier Direct costs stay unchanged; clearing, zero, history, read-only rejection, stale document/source rejection and save feedback pass. Four saves occurred only in the disposable browser, with native network saves replaced by a local capture stub and all external writes blocked.

Missing rates and unresolved transport allocations remain visible. The focused snapshot contains 32 held received transport legs across 17 item/reference combinations; some already have partial contract coverage. They must not be described as all priced. The 32 held legs are not all missing monetary charges: 17 legs lack a numeric customer rate/per-load basis (GN20, WB01–03, WC09, WC100, T0001, T0025 pickup, T0103); 8 waste-tank legs at WC05/WC20/WC27/WC60 need separate-versus-paired transport scope; 7 legs at WC06/T0003/T0023/T0085 need existing-contract coverage allocation. WC06 delivery already has one unit covered by contract 9968955 line 137 for $278.39; the other unit is unresolved. Existing contract Revenue remains in totals even when a reference allocation is held.

GN20 is one: the original 2026 workbook (`60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6`), `Transport !M59`, says POA for the next lower 315 kVA generator. The original is `/workspace/fish/03_GC500_Delivery_Control/v7.46_gn20_install_LIVE/sources/Rate_Card_2026_1.xlsx`. A carrier charge is a Direct cost, not a customer transport quote, so it is not substituted for that missing Revenue rate.

No operational record has been written by this work.
