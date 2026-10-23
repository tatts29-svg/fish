# Coates servicing report and printing

Author: Andrew Fisher

VERIFIED LIVE — 24 October 2026, 08:51 AEST. Andrew directly requested a Coates-style report, easy reading and printing from Servicing in the Codex chat on 24 October 2026.

The report now uses Coates orange, charcoal and white. A one-page shift summary leads into area totals, work to follow up and the full completion record. Equipment quantities are shown once per line. Saved history remains separate from active totals. The main Servicing page has a prominent Print report entry, then a preview with Print / save PDF, CSV and copy actions. The preview and A4 document share the same report styling; print controls are omitted on paper.

This is presentation and print access only. The shared servicing state, snapshot calculations, CSV export, entire crew bundle, DATA and broadcast are unchanged. No operational records, rates, task plans, quantities or completion status are changed. Unrecorded work is labelled for crew confirmation, not declared missed.

Base: verified v11.71 `f6394233f1e42df04ebbf84bee7fdfd7df892020a06c267311faae1c69708cf4`, source `7836d34eb6c819015bffcd1a9f19f082d002ac4f`. Implementation/tests `40bba55b6b6e727f249762236289fb1810936c20`. Exact candidate `84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea`, 21747846 bytes.

Checks: shared toolchain PASS (173 inline scripts); 45 focused checks including unchanged state/DATA/crew/snapshot/CSV; 31 native report checks each desktop and phone, including contrast, print entry, A4 table fit, exports, separate history, stale-read wording and permission/night lifecycle; both full sweeps 27 tabs / 19 shown / 7 deep links / Back, zero page/console errors or writes. Phone screenshots and the 12-page PDF inspected. Upload dry run confirms edit access and unchanged live base. No second-agent review claimed. Private report contents, PDFs and screenshots remain outside Git.

Published through the shared guarded uploader at 08:51 AEST. A separate public GET matched the complete candidate at 08:51:58 AEST. Actual live phone report checks passed 31/31 with zero errors or writes; the requested night was explicitly selected and its 12-page PDF and CSV regenerated from the live report. The PDF and phone view were inspected. READY source `37a2a19b92284b61c24d5fe0f2dce9020fb862c3`. No crew-card publication or operational record write was performed. Future page releases must start from the exact v11.72 live hash above.
