# Coates ownership default — v9.44

Author: Andrew Fisher

READY source for integration after v9.43. Not published independently.

Andrew directly clarified in the current chat on 9 Oct 2026: “in the sub hire owner to confirm these are all Coates ... if anything is sub hired I will be telling you”. This supersedes older unnamed-owner assumptions. Explicitly named supplier allocations remain unchanged.

The current unconfirmed physical rows now display Coates consistently. The Sub-hired company list contains named suppliers; unnamed placeholders no longer create a company. Missing asset numbers remain missing numbers, rather than evidence of supplier ownership. New item forms default to Coates. Existing item IDs, original source records, photographs, work ticks and saved loading evidence retain their bindings.

The correction includes the existing unnamed forklift source projection. Its original hire-record note remains available, with the later ownership instruction beside it. The two old unnamed-forklift assumptions move from Rehire Revenue into Hire Revenue by exactly their unchanged contract charges. Total Revenue, Direct costs, difference, quote values and source rates remain unchanged. Accounting labels also follow the same actual ownership rule instead of calling every toilet contract Rehire.

Named PremAir and Event Portables units remain sub-hired. The two VMS units keep their separate Coates/PremAir identities. WC09's supplier portable-toilet plan and WC31's 16-pan supplier plan stay with Event Portables, including movements awaiting complete individual allocation. Demob applies Coates to the remaining unassigned ownership without changing quantities, unknown-quantity flags, run limits, saved portions or emptying checks.

## Implementation boundaries

- `ownership944.js` provides a pure ownership projection and run allocation helper.
- `patch_v944.py` applies the rule to existing native ownership, loading, supplier and financial presentation functions. It preserves original evidence and writes no operational documents.
- Historical metadata retains its established transport ID. Only a subsequent edit explicitly carrying the same original ID may preserve the newly defaulted identity. A canonical-photo regression found in review is covered by a dedicated synthetic test.
- Internal unknown-owner tokens can remain inside stable historical IDs; they are identity keys, not current ownership labels.

The patch requires v9.43 and refuses reapplication. `--preview-base-941` is only for the focused private proof while v9.42/v9.43 are integrated. Source claim: `573a768f`.

## Validation

The evidence file contains counts and hashes only. Detailed financial snapshots, original records, affected-reference lists and screenshots remain private.

```sh
node v9.44_owner_default_DRAFT/tests/model944.cjs
BASE944=/private/base941.html PAGE=/private/candidate.html \
  node v9.44_owner_default_DRAFT/tests/identity944.cjs
PAGE=/private/candidate.html \
  node v9.44_owner_default_DRAFT/tests/contract944.cjs
BASE944=/private/base941.html \
  python3 v9.44_owner_default_DRAFT/tests/patch944.py
```

For the paired native browser proof, set `BASE944`, `PAGE`, `FROZEN_STATE944`, `CLOCK944` and `OUT944`. Use the shared harness's `NODE_PATH`, `CHROMIUM_PATH` and optional `GC500_CACHE`, then take `/tmp/gc500-browser.lock` before running `tests/browser944.cjs`. `CAPTURE944=1` captures a fresh authenticated native GET into the specified private snapshot file before freezing both pages to it. Without that flag, the supplied snapshot is reused.

The test checks all 16 financial models, unchanged source contract charges and accounting evidence, the exact permitted Hire/Rehire transfer, every existing item ID/photo binding, named suppliers, Demob quantities, incomplete WC31 allocation, and actual 390px/1440px presentation. All service writes are denied; only the deliberately blocked Google map-session POST is an accepted setup denial. The financial assertion helper emits counts publicly and retains any monetary failure detail only in the private output directory.

The release owner runs final integration checks and publishes the combined release.
