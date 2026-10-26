# Candidate per-unit sync regression matrix

Author: Andrew Fisher

Run this against a supplied candidate HTML to test the queue-overlay defect and its eventual correction. It also checks that the fix survives later financial patches, including v12.43. It does not require a particular release number: it extracts the candidate's entire `Singles1238` script plus its native `docIdOf`, `toDocs`, `fromDocs`, `syncPush`, `syncStage`, `syncStageLive` and `syncFold` functions. Input SHA-256, native footer version and module release are recorded; an expected SHA-256 may be required explicitly.

```sh
node candidate_sync_matrix.cjs --candidate <candidate.html> --expect-sha <candidate-sha256>
```

Exit 0 means the established preservation cases passed. Exit 1 means one or more failed. Exit 2 means the candidate, source boundaries or inputs could not be verified. All fixtures use fictional references, unit identifiers, users and dates. No browser, network, product file or application record is used or changed. Native send timers stay inert; native staging is inspected in memory only.

## Established preservation expectations

The 19 required cases cover:

- Ready and booking values for different units survive with an empty queue and a pending local whole document.
- Both histories survive the same two paths; identical history entries are not duplicated.
- A newer remote untick or cleared booking wins over an older local value, including when that local document is queued. A newer local untick or clear also survives an older server value.
- Outside the four new unit/history fields, native precedence stays intact: a queued local document retains its own fields; without a queue, the server fields stand.
- A queued document deletion remains a deletion. A pending new local reference remains present.
- View-only keeps the server projection, ignores queued local overrides, and neither changes the queue nor schedules a repair send.
- Caller-owned server documents and an unrelated reference stay unchanged. A staged outgoing document must contain the same preserved values as the local record.

These follow the handover's unit-by-unit merge, later-stamp, clear-retention and no-view-write rules, plus the existing native pending-edit/deletion behavior. They do not authorize new operational changes.

## Owner confirmation required

Equal timestamps with conflicting values are recorded as observations only. The owner needs to specify a deterministic tie-break that is consistent between live sync and initial `mergeRecords`; this matrix does not invent whose conflicting edit should win. These observations do not convert an unresolved policy choice into a passing release gate.

## Limits

The VM supplies an empty DOM and does not exercise UI behavior, real storage, live sender acknowledgements, cross-device timing, record runner allowlists or performance. This is a bounded regression matrix, not release approval. If a future implementation moves these functions or adds native dependencies, adapt and review the extraction rather than weakening a failed assertion. Claude retains ownership of the v12.42 correction.
