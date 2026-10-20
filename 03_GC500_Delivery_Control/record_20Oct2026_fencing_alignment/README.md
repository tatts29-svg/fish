# Source-backed fencing P/O updates

Author: Andrew Fisher.

These bounded runners use the page's existing `setPo` control with Andrew's
named operator. They preserve unrelated shared records, customer Revenue,
receipt and payment fields, and prior supplier allocations.

The P/O amount operation and supplier allocation are separate. Each requires a
private specification and private absolute `GC500_RECORD_OUT` directory.
Practice reads the live record, stages only in browser memory, verifies exact
expected changes and blocks all server writes. Supplier practice also freezes
the reviewed page hash and financial deltas for the apply step.

Apply requires the private edit credential, the exact verified live page hash
and a successful frozen practice specification. Before writing, the runner
backs up and compares the complete current record; it permits only the selected
P/O and its audit documents. It refuses changed inputs, concurrent edits,
unexpected queued writes and automatic retries. Full public and native
read-back must match the proposal before success is reported.

No live financial specification or source attachment belongs in this folder.
The scripts do not establish commercial entitlement: the operator must first
reconcile the supplied evidence and preserve unresolved items explicitly.
