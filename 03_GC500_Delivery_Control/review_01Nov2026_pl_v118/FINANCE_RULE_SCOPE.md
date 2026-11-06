# Review patch: Finance rule relevance

Author: Andrew Fisher

Prepared against public source `dc055cddc2f88a4879d65a4aa676c974adaf1f90`. This is a source-only proposal for the release owner’s v12.78 candidate, not a published change.

`row_rule_scope.patch` changes only `v12.78_finance_fingerprint/patch_v1278.py`. Finance supplies the source shift as a second argument to `fin745PayRules1278`; the helper includes only rules read by that row's calculation branch:

- Valid timed weekday shifts without an explicit break use `wd_break`.
- Weekday wages/hire use their own ordinary-hours rule plus `ot_x15`.
- Saturday wages/hire use `sat_x15`; Sunday uses no split rule.
- Salary uses no ordinary/overtime split rule.
- Quoted event-crew shifts use the supplier calculation and no employee rule.

Only nondefault values remain in the map. The historical default `{}` fingerprint is preserved, as are relevant nondefault values and every other fingerprint field. Missing-row diagnostic calls conservatively retain their previous type-only behavior; real Finance rows always pass the source. Saved Finance review events, rules and monetary calculations are not changed.

`test_row_rule_scope.cjs` contains synthetic public-safe fixtures only. Run it with the path to the patch Python file. Against the original helper:41pass/9fail (six reported row-relevance cases plus quoted-supplier checks for three type labels). Against the proposed helper:**50/50pass**. The unified diff passes `git apply --unidiff-zero --check`; the proposed Python source compiles.

Compatibility boundary: historical fingerprints containing nonempty irrelevant-rule maps are not migrated. The original raw rule map is not retained in every saved review snapshot, so there is no safe generic conversion from those hashes alone. This proposal does not rewrite reviews or accept them from a reduced snapshot. Existing review compatibility evidence was checked separately in private.

Scope boundary: an active calculation branch's rule still invalidates when its configured nondefault value changes, even if a short shift does not reach that threshold. Removing all such conservative invalidations would require a wider effective-output/canonical-value design and analysis of nondefault legacy fingerprints. This proposal fixes the reported irrelevant-day/break cases without that broader migration.

The release owner should integrate the reviewed patch into the owned source, run the relevant assembled-page tests and existing guarded release checks, and retain the candidate/live distinction. No operational record change is needed.
