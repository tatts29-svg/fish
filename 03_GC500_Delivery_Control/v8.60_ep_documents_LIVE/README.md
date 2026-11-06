# Event Portables documents — LIVE

Author: Andrew Fisher.

Andrew requested an email option on Event Portables run sheets and an inventory print listing asset numbers, matched references, locations and location QR codes.

Each supplier load has an Email PDF button, including in its print preview. It generates the existing A4 run sheet and offers an attached email draft. A supported phone can share the actual PDF to an email app; other browsers can download an unsent .eml draft containing the PDF. Recipients and sending remain with the user. Preparing, emailing or downloading this document does not print or change delivery status.

Print Event Portables inventory is available on the supplier Timeline section and Equipment supplier register. The landscape A4 PDF lists recorded supplier asset numbers, matched references, descriptions, quantities, status and qualified location QR codes. It is searchable vector text with vector QR codes. It contains no financial figures. Identical evidence is deduplicated; conflicting locations remain visible without a guessed pin. Unnumbered units and unconfirmed supplier scope remain explicit, and future supplier plan allocations are not added as existing inventory. A spare without an exact recorded pin has its textual location and no invented QR.

The existing print action, print retry, transit handling, financial models, operational records and backend remain unchanged. Source evidence and generated documents stay outside Git.

Base: verified v8.59, SHA-256 `71fdff199e5b09e6d67b2716cb6733ef4e69cb8b2fa3f002db5fec992527e888`. Codex owns implementation, independent source review, testing and publication. Claude remains intentionally paused. Synthetic inventory/identity/location tests and the standard build checks pass. Final candidate `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`, 10,993,891 bytes, source `b007ee6e`. VERIFIED LIVE, 5 Oct 2026 at 21:55 AEST. READY commit `0138ba62`; guarded publication serves these bytes exactly.

Final checks: all five supplier loads generate one A4 page with their exact PDF embedded in an unsent email draft. Desktop and phone inventory PDFs are vector text/QR, preserve recorded identities and decode to the native qualified locations. All load QR codes and inventory QR destinations were raster-decoded. Closing during generation, retry, share cancellation, attachment payloads, draft download and unchanged native records pass. Genuine phone controls invoke production producers and screenshots are inspected. Both exact-candidate sweeps pass: 21 menu routes, seven deep links and Back navigation, zero runtime/console errors.

Initial test-only assertions were corrected for PDF punctuation/word wrapping and specifically identified GET-only guard blocks of Google Maps session POSTs. A separate actual-phone-control check passes with no unexpected errors. Original private diagnostics are retained. Source review also corrected unknown-scope quantities, duplicate spare-location conflicts and expanded printed locations with existing master-plan landmarks. No private record figures or generated documents are included in this repository.

Actual-public checks, with no local HTML override, pass on laptop and phone: all five supplier load PDFs, attached drafts, inventory identity/QR comparisons, cancellation/retry and share/download paths. No operational writes or unexpected runtime/console errors. Exact intentional Google Maps session POST blocks are separately recorded with request evidence. The shared record remains version 3851. Health is OK on server v5.87; no backend deployment was needed. Reload existing tabs once.
