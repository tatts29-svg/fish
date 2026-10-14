# Native runner review

Author: Andrew Fisher

Independent source review of `record1006.cjs`, `native_identity1006.cjs`, `native_roster1006.cjs` and `native_roster_source1006.js` found no blocking write-scope issue. The runner backs up public/native state, pauses native sending during hydration and staging, allows only serialization-order alignment, checks the full record before applying, permits each expected native payload once, and verifies the complete fresh record afterwards. This review did not execute a live write.

Fifteen offline checks passed in `evidence/record1006-review.json`: semantic-only alignment, changed values, in-flight writes, unpaused native sending, deletion intent, persistence failure, approved ownership change, unrelated delivery/photo/supplier/unit changes, deletion and wrong actor. The reproducible offline test is `check_record_review1006.cjs`; no private native snapshot is committed.

The charge review verified use of shared received quantity with `max(received, recorded)` rather than adding them, no automatic stairs, and no alteration of physical labour ticks or supplier Direct costs. Initial missing-rate/missing-quantity presentation findings were corrected by the charge owner and have focused regressions. Current-record installation sums reconcile; finance monthly review must use `chargeQty975`, not the ordered quantity or physical completion month.
