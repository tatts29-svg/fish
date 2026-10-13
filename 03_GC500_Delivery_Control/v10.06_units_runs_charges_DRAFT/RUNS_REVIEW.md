# Receipts and daily supplier runs

Author: Andrew Fisher

The shared supplier model now retains recorded receipts separately from remaining deliveries. Build and Today include the actual receipt day even after a location is completed. Supplier day sheets show Received and Remaining explicitly. Recorded receipts consume that day's capacity; quantities completed early no longer reserve space on a later proposed date.

At shared record 5698, 13 October has 23 Event Portables portaloos received across ten references. The current remaining programme is 1 on 13 October, 24 on each of 14–16 October, and 3 on 17 October. Supplier reconciliation is 112 portaloos received, 76 allocated remaining, and 6 without an allocation against the confirmed 194. Six pee panels and two 16-pan blocks are separate product counts.

Receipt dates use dated item receipts or native on-site history, never install-only timestamps or scheduled dates. WC69's partial receipt of six is preserved from the verified v9.98 native record 5320 (12 October AEST); the later cumulative receipt of twelve adds only six on 13 October. The baseline applies only while that specific original native on-site history remains present. Additional identity 0689 does not increase the explicit supplied quantity and is retained for review. Same-owner exact-number aliases (case/space normalised, leading zeroes preserved) count once. Cross-owner preference requires an explicit whole-Event-Portables reference or the exact known WC72/0699 native/metadata evidence. Other mixed-owner units remain distinct. Where earlier partial receipt quantities are unavailable, inventory is retained and the receipt date is explicitly left for review rather than reconstructed from the current cumulative quantity.

Files: receipts1006.js, daily1006.js, portrait1006.js, patch_runs1006.py. The patch exposes apply(html) for the combined release and refuses a repeat. The root release guards the complete source hash. No DATA, COMMITTED or native operational fields are mutated by the projection.

Validation: 21 pure regression checks; 37 desktop and 31 phone checks against the live record with all operational writes blocked; 980 PDF checks covering six files, A4 portrait size, quantities, Received/Remaining labels, destinations, row/column clipping and 86 decoded QR instances. Ninety inline scripts parse. Zero browser errors or operational writes. Today's combined PDF page was visually inspected. Private detailed evidence and PDFs: /workspace/private-gc500-unit1006/runs-check; phone evidence: /workspace/private-gc500-unit1006/runs-phone.

Ready for root integration and combined release checks. Not independently published.
