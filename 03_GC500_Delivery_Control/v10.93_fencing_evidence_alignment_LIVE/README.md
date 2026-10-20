# v10.93 fencing evidence alignment

Author: Andrew Fisher.

This release aligns reviewed fencing record transcriptions with the supplied evidence. Its page patch updates exact expected record snapshots and their evidence basis in `FENCE_PROGRAMME958`. The existing strict matcher, programme tasks, source-file identities and hashes, forecast-attribution rows, rates and price categories remain unchanged.

The correction data is private. `GC500_FENCING_EVIDENCE_INPUT` must point to the reviewed JSON outside every Git checkout. The public patch locks both that file's SHA-256 and the exact verified v10.92 predecessor SHA-256. The patch refuses to run unless both frozen pins match. No raw docket notes, component quantities or correction payload are stored in this release's generic patch source.

The private envelope is:

```json
{
  "schema": 1,
  "source_sha256": "<verified predecessor SHA-256>",
  "rows": [{
    "record_id": "<existing catalogue record>",
    "before": "<complete existing expected object>",
    "after": "<complete reviewed expected object>",
    "basis_before": "<exact existing basis>",
    "basis_after": "<reviewed evidence basis>"
  }]
}
```

`before` and `after` are objects containing the matcher's complete expected-field set. The patch verifies the existing snapshot and basis exactly before replacing either. Record identity, date, work week and source are fixed. It rejects duplicate, missing or forecast-attribution rows and proves all other catalogue content is preserved. The envelope may carry additional private runner metadata; only `rows` is consumed by the page patch.

The page patch does not write native records. The separately owned native runner must perform its backup, dry run, exact before-state checks and read-back. The release owner coordinates page publication followed by bounded native corrections; the runner requires the exact published page hash. During that interval the unchanged matcher holds the three affected non-attribution task links for review; it never accepts fuzzy or unreviewed alternatives. Completion requires the final native records to match the published expected snapshots. Verify that publication alone leaves the forecast and revenue unchanged before applying the separately reviewed native corrections.

The native runner's apply mode also requires `GC500_EXPECTED_SPEC_SHA` to equal the SHA-256 of the actual frozen private specification bytes supplied by `GC500_FENCING_EVIDENCE_SPEC`. That native specification is distinct from the page patch's catalogue input. Keep both specifications and the native backup/read-back evidence outside Git.

After a successful apply, `verify_public_evidence.cjs` opens the actual public page with all mutations blocked. It requires the same page/specification hashes, the frozen specification, `GC500_APPLY_EVIDENCE_DIR` pointing to the successful apply receipt, and a private `GC500_RECORD_OUT`. It rejects local page/media replacement, compares every fresh shared document with the apply read-back, checks the current native projections and exact catalogue coverage, then verifies the public page bytes and full shared record again. It reads the current record without replaying the correction plan.

Local integrated validation is complete on the revised candidate:

- The official build passes the standard page checks; all 148 scripts parse.
- All 26 synthetic patch tests and the exact catalogue/page preservation check pass.
- Final native practice passes 34 checks with zero server writes. Stale, forbidden, hidden, duplicate, source, P/O and financial changes are rejected outside the reviewed scope.
- Publication-only practice leaves native records and financial projections unchanged. After captured corrections, the final record snapshots match the catalogue exactly.
- The affected phone view shows the concise operational note with no overflow or errors; the note remains present after its screenshot.
- Both desktop and phone sweeps pass: 25 routes, seven deep links and Back, with zero page errors, console errors or attempted native writes.
- The actual-public post-apply probe passes 11 synthetic checks without network access and 25 checks on the published page after the successful native apply.

Source validation completed: `python3 -B test_patch_v1093.py` passes 26 synthetic tests. These cover exact before states, hash locks, private-file location and symlink checks, duplicate and non-finite JSON rejection, identity and attribution protection, script-safe encoding, immutable inputs and page preservation. The preservation test also verifies the strict matcher's bytes independently. It detected and resolved a whitespace loss at the footer replacement.

The same checker passes against the private interim practice page: three catalogue rows differ, every other catalogue field and every page byte outside the catalogue JSON is unchanged, and the strict matcher is identical.

The hash-locked patch passes against the exact verified v10.92 predecessor. The final official candidate is `e07f45f9a9309e7cb5d20f59cb17b13222bbd9ed64285f163280457f8139e4b2` (18,600,236 bytes). The final-mode preservation check confirms three changed catalogue rows, identical strict-matcher bytes and identical remaining page bytes after restoring only the catalogue, release marker and footer.

Run the final candidate preservation check without exposing private content:

```sh
python3 -B test_patch_v1093.py --base "$BASE_HTML" --candidate "$CANDIDATE_HTML"
```

It permits only the reviewed catalogue JSON, release marker and version footer to differ. For an interim practice page with no release-marker or footer change, add `--catalogue-only`; that mode requires every byte outside the catalogue JSON to remain unchanged. Neither mode changes either file.

Frozen pins:

- Verified v10.92 predecessor: `4a94062d014c4c3c56cb94faba9622d75ed445cc1d5f1b625cb9a54845533da9`.
- Reviewed private input: `7ad727591872ec5ee1a61ed4b838adc2c4593a625026452425290237688c52c9`.

Current state: VERIFIED LIVE. Guarded publication and exact public-byte read-back passed. The reviewed native correction completed with every intended write acknowledged and full shared-document read-back verified. The actual public page then passed 25 checks with no local page replacement, native mutation attempts or page errors. All current corrected catalogue snapshots match; other shared documents remain unchanged. Public receipt hashes are in `release.json`; full source and financial evidence remains private.

Routine cards show concise operational text. Full amendment provenance remains in the private correction specification and archived evidence.
