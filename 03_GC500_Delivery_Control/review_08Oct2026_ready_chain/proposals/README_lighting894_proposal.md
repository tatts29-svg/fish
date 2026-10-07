Author: Andrew Fisher

Proposed v8.94 completion and drilldown correction — 8 Oct 2026 AEST.

This is a review proposal for the claimed draft’s owner to adopt. It has not been
committed, published or applied to the owned draft. The correction keeps native
work metrics, equipment records, delivery history and financial readers intact.

The Lighting audit now consumes the native work rows’ verified completion instead
of interpreting a raw Complete tick. A Complete tick that conflicts with a short
quantity receives no completion credit and retains the lower-bound review state.
Active keyed callouts with evidence join the location that the confirmed map
configuration assigns to them. Repeated reference keys and fully repeated asset
identifiers add no second tower; partial identifier overlaps or competing location
assignments remain visible for review and receive no inferred credit.

The Lighting headline and its Done, Total and Left drilldowns use the same scope
allocation. Verified completed references receive the location’s allocation first;
the location cap still applies. Reference details show the original recorded
quantity and its surplus separately. Unallocated map scope is explicitly labelled
as map scope, has no reference key or record action, and does not create an
equipment or delivery record. Native record links continue to open the original
reference. Other groups continue to use their native detail rows.

Public review files:

- `lighting894_projection.js`: pure projection, without operational inputs.
- `lighting894.js.diff`: proposed source changes against the owned draft.
- `patch_v894.py.diff`: the exact native drawer hook and dependency check.
- `prepare_lighting894_proposal.py`: generates corrected copies and unified diffs
  in a separate directory; refuses to overwrite an existing review copy.
- `../tests/check_lighting894_proposal.cjs`: network-free, fictional fixtures.

The source diffs were generated against Lighting source SHA-256
`1f201e801b98ae0fa20ae9407eadabe5c715cfd6f3bfb603fbc98cf3fea5be46`
and patch SHA-256
`71ca8a782b4ae2bd580dd6379dcb670c769e5b0b0fc9f356b704b5aea2f15de0`.
They must be reviewed and rebased if the owner changes those files. The patch
still checks that each native replacement matches exactly once.

Validation: 24 checks passed. Fifteen exercise the pure projection; six run the
integration candidate’s actual native work metrics and summary in a VM against
fictional equipment; three run the proposed page’s actual native drawer HTML
functions. These cover the short conflict, promoted callout, identifier aliases,
location caps, missing and unknown quantities, selected-day completion, cancelled
references, immutability and all three drilldown sums. The VM has no network client
or record writer. All 20 inline scripts in the private proposal page passed the
shared page checker. Reversing only the Lighting script replacement and drawer
hook reproduces the input page byte for byte: all other scripts, DATA and finance
code are unchanged.

To repeat the pure checks:

```sh
node tests/check_lighting894_proposal.cjs
```

Run from the parent review directory. Add paths to the input candidate, corrected
Lighting source and private corrected candidate to run the VM and renderer checks.

Validation limit: no browser session or live-record test was run for this proposal.
The renderer tests check native HTML output with fictional data, not browser layout,
focus, interaction, accessibility or shared-sync lifecycle. The owner must rebuild
the release chain and rerun affected Lighting, Today, Timeline/map and phone checks
on the exact adopted candidate before claiming release readiness. This proposal is
ready for code review, not READY TO UPLOAD.
