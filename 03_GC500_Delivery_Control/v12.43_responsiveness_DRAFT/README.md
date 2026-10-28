# v12.43 responsiveness — tested draft

Author: Andrew Fisher

Opening Demob spent about 1.9 seconds scanning bold numbers for a decorative count-up. The page now shows its final rendered figures immediately. Navigation avoids measuring pane contents about to be replaced. Ownership lookup uses the existing native invalidation lifecycle; labour, Finance and event-window reads reuse results within a call. Hidden Costs alignment waits until Costs is opened. All existing styles, pricing rules, source quantities, records and explorer-frame code remain unchanged.

The earlier v12.43 customer-treatment draft is superseded by the later v12.42 financial releases. Do not apply that old patch or its record runner. Remaining financial consistency work is separately claimed as v12.44.

Built on verified v12.42.24 `524115a3c9f910b8af4f56ce5c7ce1ab55379a9415fad36df51d9e4a4f535005`; candidate `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`, 16,030,489 bytes. Checker214; native financial/record preservation34/34; phone6/6; alignment13/13; release-boundary8/8; five helper suites pass. Desktop and phone sweeps each pass27 tabs,7 deep links and Back, with no runtime/console errors or blocked writes. Phone screenshots inspected.

Matched phone runs on one frozen record: startup first-live 2.66–3.01 seconds versus13.75–15.50; Demob1.50–1.67 versus3.40–3.53; Costs2.40–5.03 versus3.55–3.64; Today1.77–1.83 versus1.68–1.78. These are small controlled samples, not a guarantee for every device. Costs remains variable and further latency work remains. This patch does not make existing financial reconciliation failures disappear.

`CHECKS.json` contains source-bound results without operational amounts. Tests accept `BASE`, `PAGE`, `STATE` and `OUT`; use the shared browser lock and GET-only harness. Private raw snapshots and screenshots remain outside Git.

Awaiting resolution of Claude's preceding v12.42.25 map candidate. Rebuild from the newest verified live page and rerun affected final checks before publication. Use the guarded uploader; this candidate has not been published. No record writes.
