# GC500 application audit — completed

Author: Andrew Fisher

Requested audit of errors, bugs and useful improvements across current GC500. Root owns integration; scoped reviews cover navigation, presentation, financial consistency and shared operational data. Live service access is read-only. Findings require reproduction and are separated from source-input gaps or design proposals. Private evidence is held outside this public repository.

Starting source: 16218ec5. Base v10.15 SHA256 bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67. The v10.16 corrections were published on 14 Oct 2026 at 16:39 AEST. Exact public bytes and 20 fresh actual-public checks pass on unchanged native6075. No operational record has been changed by this audit.

## Confirmed defects

| Severity | Trigger and consequence | Correction |
| --- | --- | --- |
| P1 | Reconnect says Live while supporting documents remain failed; progress and forecast credits stay stale | Retry failed document evidence after validated shared reads, with deduplication and backoff |
| P1 | A supplier day has too many full destination rows for the PDF page; individual and combined exports fail | Whole-row A4 portrait continuation pages, retaining readable text and QR codes |
| P2 | A fresh shared-only asset link is checked before the shared record loads and discarded | Defer rejection and reopen the unchanged requested link when records settle |
| P2 | Background map rendering replaces an open reference address and adds Back entries | Preserve the reference address while its drawer owns navigation |
| P2 | Active accessories are omitted from global asset-number search | Index active contents and open/highlight the matching current reference row |
| P2 | Today omits supplier requests that have known quantities but no mapped reference yet | Include unresolved source-only scope once, using current supplier quantities and dates |
| P2 | A reviewed moved VMS board remains current at its old reference in other readers | Project reviewed movement into current identity and stock; preserve receipt and charge history |
| P2 | An explicitly allocated manual customer charge reaches Costs/P&L but loses its branch | Carry the selected branch into the shared branch projection |
| P3 | The unselected damage waiver is reported as a missing required price | Treat the default unselected waiver as optional; retain explicitly required/enabled holds |
| P3 | Narrow phone screens clip the shared-record timestamp | Wrap the timestamp within the existing status pod |

## Evidence and limits

Scoped audit folders record the reproductions and tests. The release folder records combined-candidate checks and publication separately. All browser checks block operational writes. In-memory fixtures are restored; native records, published rates, original documents and physical map positions remain unchanged.

Settled financial checks reconcile Costs, P&L, branch and Finance totals, independently recalculate current generator hire at the Thursday/Friday/Sunday/Monday boundaries, and exercise editable rates, received quantities and P/O variance. Existing unpriced transport, work scope and uncertain contract allocations still need their actual source inputs. Passing arithmetic checks does not certify missing prices or uncertain source allocations.

The existing refresh/disclosure/scroll audit passed across 22 routes. Presentation checks covered 24 page/viewport combinations, readable Save/Clear controls, and drawer Back/Close/Escape/focus behaviour. A working loading panel and valid favicon are already present in the real HTML; earlier external claims that both were absent did not reproduce. Cached offline and first-visit failure/retry behaviour were tested. No broader security or performance certification is implied.

## Useful next improvements

- Add a clear horizontal-scroll cue to wide P/O tables on phones.
- Remove redundant quantity wording when adjacent counts describe the same thing.
- Use a consistent Fencing navigation symbol.
- Add a no-JavaScript explanation and ordinary link-preview metadata.
- Continue the separate map-quality audit using real devices and measured rendering performance. Preserve current map positions and completion semantics.

These are proposals, not untested changes bundled into the corrective release. The existing design is retained.

## Separate supplied fencing prototype

The supplied standalone 3D fencing preview was also reviewed without integration. Confirmed issues include sample statuses labelled as confirmed records, an unimplemented shared-data adapter, an unused write-block constant, unsafe HTML rendering of hardware data, inaccurate imagery scale/placement, interrupted-reset behaviour, invisible meshes remaining selectable and overlapping phone panels. Normal tested flows made no write attempts; the prototype constant does not enforce that boundary. Pointer/wheel pause and camera/selection preservation passed. Real-device frame rate, latency, touch behaviour and a full seamless loop remain unverified. Keep this as an assembly demonstration until corrected and connected to actual shared readers. No prototype source or operational record was changed.
