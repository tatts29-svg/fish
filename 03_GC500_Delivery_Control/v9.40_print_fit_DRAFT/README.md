# Native printed page fit

Author: Andrew Fisher.

READY for root's combined release; not independently published.

The native driver-page pagination added its sheet-number line after measuring the printable content. On the frozen source record, 14 Sep loads 7/10 and 19 Oct load 4 pushed the footer below the A4 page. The actual 19 Oct PDF raster shows its second footer line clipped, not merely a scroll-height warning. The native 9 Oct WC40 location sign also cut the final reference character at its right border: text width695.72px exceeded its662px band.

This patch reserves the existing numbering line before native pagination and updates that same label afterwards. Full content may move to its existing continuation page; no text, photo or safety information is removed or reduced. A location sign's reference is measured and reduced only if its text is wider than the printable band, keeping every reference readable inside the border. Native print/PDF/export and approval actions remain unchanged. There are no record, identity, money or photo-source edits.

Apply `python patch_v940.py <candidate>` after release37,38 or39; footer advances40. Production integration uses39. `tests/source940.py <base>` proves exact source boundaries and duplicate-application refusal. `check_page.py` passes42inline scripts.

The private GET-only audit uses one authenticated snapshot4669 and fixed clock for928/934 comparisons, then combined937 plus940. It traps native saves and never records driver approval. All eight native install/driver selections on14Sep,7Oct,9Oct,19Oct—including a removal—fit:359pages, zero native overflow/failed-image verdicts, zero page-bound overflow, no undefined/NaN. Comparing complete printed content proves every text section, photo count/label and location-sign reference is retained. Native Demob26Oct15pages and all5EventPortables sheets fit. Costed Inventory and loading outputs are unchanged; actual Inventory Share PDF generated11pages successfully. Shared record remained unchanged and page errors were zero. One mapping setup POST was deliberately denied by the strict GET-only harness.

`tests/actual940.cjs` reproduces four affected native cases with PAGE, FROZEN_STATE and FROZEN_CLOCK supplied by the coordinator. It checks native fit verdicts, footer/ref bounds, no duplicate numbering labels on re-fit, and unchanged record. Run serially under `/tmp/gc500-browser.lock`. Re-fitting may follow the native paginator's existing continuation behaviour; this test does not promise stable page count under arbitrary repeated reflow.

Private rendered HTML, source record, PDFs and inspected before/after screenshots are at `/workspace/private-bughunt935/print/`; none is committed. Root owns the exact combined final build, publication and live verification.
