Author: Andrew Fisher

# Financial assurance for visual clarity

This release changes presentation and removes repeated calculations. It must preserve the same native record and all existing financial domains, including WC09's ten planned FWF, four received, and six remaining in forecast.

The thin wrappers reuse the established read-only 20-domain capture and 72-check comparison from v10.17. Every operational write is blocked. Raw source and financial values stay in private temporary audit storage.

Capture the actual public baseline with `PAGE` unset. Capture the final combined candidate with its absolute `PAGE` path, then compare both JSON snapshots. Both captures must use the same native record version and AEST day; do not waive a difference caused by a concurrent edit without reviewing it.

```bash
flock /tmp/gc500-browser.lock env -u PAGE NODE_PATH=/path/to/node_modules \
CHROMIUM_PATH=/usr/bin/chromium OUT=/private/before.json node capture1018.cjs

flock /tmp/gc500-browser.lock env NODE_PATH=/path/to/node_modules \
CHROMIUM_PATH=/usr/bin/chromium PAGE=/private/candidate.html \
OUT=/private/candidate.json node capture1018.cjs

python3 compare1018.py /private/before.json /private/candidate.json /private/parity.json
```

Actual-public baseline capture completed on native record 6078: 20 domains, unchanged native state, zero errors or operational writes, no local page substitution. The final combined candidate `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d` passes **72/72 parity checks across all 20 domains**, against that public baseline on the same native version and AEST day. No domain differs: source rates, actual and forecast charges, Direct costs, P&L, branches, supplier pricing, generator calculations and WC09 receipt/scope remain unchanged. Both captures have zero errors or operational writes.

After the release owner's publication at 20:05 AEST on 14 Oct 2026, an independent fresh **actual-public** capture also passes **72/72 parity checks across the same 20 domains**. `PAGE` and `MAP_CODE` were unset, the local-page interception count is zero, native6078 is unchanged, and there are zero browser errors or operational writes. `public-checks.json` records the sanitised result. Raw financial snapshots remain private; the uploader separately verifies exact public bytes.

`check_supplier1018.cjs` independently exercises the corrected supplier-pricing call chain using the actual candidate functions. The old path called supplier pricing again while deriving its validation branch from priced dockets, eventually swallowing a stack overflow. The explicit base-pricer path retains the same customer-charge grading and branch logic: a priced docket with no branch stays `no branch`, while no qualifying docket retains the existing `STPS` fallback. Default docket readers still apply approved supplier prices.

The fixture checks normal and blank supplier branches, no dockets and nothing to price, all customer ledger lines, native Save cache invalidation after a rate edit, and native P/O edit variance refresh. Persistence is replaced with an in-memory sink; the real Save invalidation wrappers and P/O setter still run. Every native/source object is restored, and every network write is blocked. A bounded negative control restores only the old call edge and proves the recursive failure is detected. Raw values stay private.

The first combined cycle candidate failed on a whitespace replacement that produced `returnObject.assign` for local dockets. The implementation owner corrected the full return anchor; the final candidate `2d09fa44794596c52c54d41aed6f98d16fbb6f5ff1ccf608f9d275874559785d` passes **33/33 supplier regressions**, with no browser errors or operational writes. No claim is made for the superseded candidate.
