# Driver and installer sheets: planned equipment and current supply
Author: Andrew Fisher

Implementation verified on the live v8.07 base; final v8.05 spelling integration, official build and both final sweeps pending. Not published. Parent owns publication and shared-board changes.

The existing sheets showed full scheduled quantities without the current supply record. They now label those quantities as planned and show recorded supply and remaining quantities by requested type. The reference's arrival/Complete status is explicitly reference-wide. Unknown quantities stay unconfirmed; a green reference does not complete every item type. Installation boxes remain checks, not a claim of outstanding work.

All dates, DD ranks, loads, quantities, numbers, destinations and history are retained. Split DD sheets keep their booked quantity; receipt balances are labelled as reference-wide and unallocated to a load. Other numbers recorded against that reference cannot become cargo on a split booking. An evidence-based WC32 source-discrepancy note asks for confirmation without changing cancellation or dispatch status.

Explicit native supplied quantities take precedence. Invalid explicit values do not fall back to another count. The only numbered-unit fallback requires a sole FWF type, no accessories, every current unit labelled Event Portables with a nonzero numeric serial, and an explicit recorded on-site/Complete status. Serial numbers are de-duplicated. Mixed types, unidentified units, differing supplied types and conflicting counts remain unconfirmed. This changes printed context only; it does not allocate receipts, reschedule deliveries or amend business computations.

Owned source: `patch_v808.py`, `sheet_remaining808_src.js`, and `evidence/`. No other component, shared record, layout or CSS is changed. The patch uses exact component guards, rejects repeats and accepts only v8.07 or its separately owned v8.05 follow-up. It must be rebuilt and checked from the final live page before publication.

Private v8.07-base candidate: SHA-256 `b3c38f0ad23a48936b20278f71153cb3399ba93f8146fdc1653d9ffd08382a91`, 9,106,228 bytes. Base: `35024d43405947d59c106e858221f8c40ed9629bcf6b19b1081f87c4da6799ed`. Shared static check passes all8 inline scripts. Exact reverse proof13checks restores every original page byte, including all DATA, business logic, unrelated functions, markup and CSS. Independent semantic review34checks passes, including malformed quantities and placeholder serials. Independent full-page source reversal13checks and six final image inspections are accepted on the exact candidate, including the fitted phone preview. Native preview55checks pass on this corrected candidate: all15 Wednesday driver and15installer A4 sheets, completed/partial/unknown/split-reference cases, and the normal390px phone preview. WC31 PDF is one A4 page with both type counts and remaining quantities. The earlier cropped phone image was a fixture error and is excluded; the accepted run uses the native preview toolbar and checks the actual page bounds.

Evidence commands:

```sh
python3 evidence/check_source.py /path/to/base.html /path/to/candidate.html
PAGE=/path/to/candidate.html STATE_ROOT=/path/to/private/snapshot OUT=/path/to/private/evidence node evidence/practice_tests.cjs
```

The snapshot directory holds GET-only `state.json` and `version.json`; originals and detailed operational projections remain private. The browser blocks every non-GET request, including an unrelated Google tile-session setup request. No operational test writes or checklist attestations are made. Actual native phone preview uses the existing toolbar/fitting path; full-sized print output is also checked as A4.
