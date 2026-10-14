Author: Andrew Fisher

A failed document registry could remain failed after the shared record recovered. The page then showed Live while source-backed progress was unavailable and reviewed forecast credits were withheld. Waiting and an unchanged-version poll did not repair it; manually refreshing the registry did.

This component retries failed source evidence through the existing successful shared-read paths, including unchanged-version polling. Automatic retries have a 15-second backoff, native in-flight loading is deduplicated, and explicit Retry also rechecks failed evidence with a one-second duplicate-tap guard. There is no additional timer or native record write. File identity and programme validation remain unchanged.

The standalone candidate passed 12 pure recovery guards, six patch guards and 12 browser checks. Browser coverage includes an offline reload, explicit Retry, continued source failure, unchanged-version automatic recovery, automatic connection recovery, exact financial parity and preservation of an open reference and reading position. The phone screenshot was inspected. No browser errors or operational writes occurred. The native version was unchanged. Combined release testing and publication remain with the release owner.

Detailed browser snapshots and the original reproduction remain private under `/workspace/private-gc500-audit14Oct2026/recovery/`; only sanitised check results are committed here.

Run the pure guards with `node test_recovery1016.cjs`. Run patch checks with `BASE_PAGE=<base HTML> python3 test_patch_recovery1016.py`. Run browser checks with `PAGE=<candidate HTML> OUT_DIR=<private evidence folder> node check_recovery1016.cjs`, using the shared Node and Chromium environment.
