# v10.59 receipt regression fixture maintenance

Author: Andrew Fisher

The standing v10.59 test originally ran before its three date-only receipts were
published. Its existing release README records that subsequent data step. The
current frozen record already satisfies the test's postcondition, so the old
suite reported 148/154: its two before/after presentation assertions and its
new-entry assertion failed once per viewport.

This is test maintenance only. All original 154 assertions remain unchanged.
Before part B, `late_receipt_fixture.cjs` stops synchronization and reconstructs
only that earlier in-memory test state. It removes the exact matching entries
from disposable local/committed read copies, preserving lights, original
recording timestamps, other history, quantities and unrelated references. The
helper does not call a record setter or persistence function. The native arrival setter
then performs the transition under the existing write-blocking test harness.

`test_late_receipt_fixture.cjs` passes 12 contract assertions, including unchanged
unrelated history and idempotent fixture preparation. `late_receipt_probe.cjs`
executes the native browser transition on both exact pages: 10/10 baseline and
10/10 candidate, zero attempted writes. It first confirms that the current record
already satisfies the old postcondition, then verifies the pre-entry transition,
new-entry format and setter idempotence without changing those expectations.

Verification identities:

- Baseline HTML SHA256: `c62adee5817153a56d538e1db015b0ef66a8a6e75609bc4d6e09a47bedfafbd8`.
- Candidate HTML SHA256: `4b5b727b781992e251968f81503ee064a3dbd3414a6087260258871ad83a0ec6`.
- Frozen API version/state: `9704` / `9704`.
- Frozen API state body SHA256: `7754b1bfa8f9da2bccef6c7278d13822475a9a5102f1626b8647adbe02adecf3`.
- Corrected `test_v1059.cjs` SHA256: `a2c9f80e60463c2c47c5881073b27ed5a95f9d44f2c33c0bb01b99adb3e9d310`.
- Fixture helper SHA256: `bb463ee1008a7573d313ef66cf8550587097de19e2a102f02d41e5a1b36eedaa`.

The complete corrected candidate suite passes **154/154**, desktop **77/77** and
phone **77/77**, exit 0, with no failed assertion lines. Nine screenshots were
captured. The native before/after, setter, idempotence, refusal, display and
original-light-history assertions are all retained. Raw output, screenshots and
browser records stay in the private execution directory; none is checked in.
No production code or operational record was changed by this maintenance.
