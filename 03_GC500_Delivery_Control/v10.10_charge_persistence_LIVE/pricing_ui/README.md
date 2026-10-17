# Pee-panel hire basis and Save

Author: Andrew Fisher

The WC09 Pee Panel hire row names its rate as full hire per panel. Hire · more info identifies the original card source, full hire and separate daily reference, with quantity counted once. An invalid stored override or one below the approved $450 supplier floor is disclosed when the shared pricing model rejects it. A future contract-covered item keeps its original contract presentation.

Editors can type a full hire override and press Save rate. Typing and leaving the field do not change the record. Validation uses the shared pricing model, then the existing native `data-lr748` change path, operator check, write capability, stamp, persistence and sync. No parallel rate store is introduced. Blank removes this full override; any existing legacy default continues to follow the shared pricing model. Reload explicitly replaces an unsaved draft with the current recorded value.

A changed record refuses a stale draft rather than silently overwriting another editor. Save feedback distinguishes unsaved, local-only/pending, failed and shared. Shared confirmation requires the exact rate (or acknowledged absence on reset), timestamp and author documents, with no outstanding queue or write for them. Successful submitted values are not restored as stale drafts by the refresh helper.

`check_rate_save1010.cjs`: 21 pure acknowledgement checks pass, including old acknowledgements, changed intent, queued/in-flight saves, local failure and resets. `check_pricing_ui1010.cjs` is a two-viewport test for the final candidate; it captures all native writes inside the test page and never sends them to the service. The release owner coordinates browser execution under `/tmp/gc500-browser.lock` and records the final result.
