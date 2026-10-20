# Fencing supplier allocation and evidence · v10.88

Author: Andrew Fisher.

Andrew requested that the supplier P/O, billed programme, original dockets,
schedule and map evidence align, with any remaining uncertainty visible.
This extends the existing supplier allocation without changing physical
docket quantities or customer rates.

Supplier-only bases and source-backed materials are supported. Materials
enter Rehire once; dated team leaders remain Installation. The existing P/O
detail links available schedule and map evidence and labels candidate or
unresolved matches. A matching financial subtotal does not imply physical
completion, a verified tax invoice, receipt or payment. Unpriced papers remain
explicitly outside the allocation.

The patch requires the exact live v10.87 page
`e073add8b16cdb735929b66ede2cdb45b69b7a0a31aef1208ab60f5e3c3e35f2`
(18,528,912 bytes). It preserves that release's servicing content. Earlier
v10.87/v10.88 Codex claims were renumbered after the live base changed.

## Checks and publication

The pure core suite retains prior allocation behavior and covers exact cents,
duplicate identities, source evidence, category restrictions and independent
P/Os. The browser suite takes private fixtures through the existing native
control in memory, with all real writes blocked; it verifies the financial
projections, remaining physical forecast, source links and phone display.
Document-catalogue readiness is required before comparing projections because
existing reviewed task attribution depends on source-file verification.

Use `toolchain/build.sh v10.88 v10.88_fencing_alignment_DRAFT/patch_v1088.py`,
then the focused tests, desktop and phone sweeps, and guarded uploader. Private
fixtures, source PDFs, amounts, raw logs and screenshots stay outside Git.
The bounded native writer is in `record_20Oct2026_fencing_alignment/`.

Status: READY TO UPLOAD. Core 34/34; runtime integration 35/35; native practice 29/29 with zero server writes; both 25-route/seven-link/Back sweeps passed with zero page or console errors and zero attempted native writes. Desktop and phone screenshots inspected. Independent code review and exact patch reproduction passed. Candidate SHA-256 `690d5995b0c76e56127242487c0d55b877548eb3bc10dae1855320247323d2b0`, 18,535,697 bytes. Uploader dry run confirmed edit access and unchanged live base.
